import * as THREE from "three";
import * as CANNON from "cannon-es";
import type { Difficulty, GameEvents, GameHudState, GameInputState, ThemeId } from "../lib/types";
import { getTheme } from "../lib/themes";
import { audio } from "../lib/audio";
import { createMaterials, disposeMaterials } from "./materials";
import { buildEnvironment, type SceneCtx } from "./scene";
import { buildTargetChallenge, towerHorizRadiusAtWorldY, TOWER_CENTER_Y, TOWER_HALF_HEIGHT } from "./tower";
import {
  buildRollerMachine,
  rollerCenter,
  rollerDrumRadius,
  rollerSlotXMax,
  rollerSlotXMin,
} from "./roller";
import { createTyre, tyreRadius } from "./tyre";
import {
  buildChimneySmoke,
  buildRollerSmoke,
  buildTowerConfetti,
  type ChimneySmoke,
  type Confetti,
  type RollerSmoke,
} from "./particles";

type TyreState = "free" | "carried" | "loaded" | "launched";

export type GameOptions = {
  themeId: ThemeId;
  difficulty: Difficulty;
  sfxOn: boolean;
  hapticsOn: boolean;
};

const DIFFICULTY_TUNING: Record<Difficulty, { chargeRate: number; aimAssist: number; charSpeed: number }> = {
  easy:   { chargeRate: 0.32, aimAssist: 0.18, charSpeed: 5.4 },
  normal: { chargeRate: 0.26, aimAssist: 0.10, charSpeed: 5.0 },
  hard:   { chargeRate: 0.22, aimAssist: 0.04, charSpeed: 4.6 },
};

export class Game {
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private world: CANNON.World;
  private ctx!: SceneCtx;
  private tyre!: { mesh: THREE.Group; body: CANNON.Body };
  private machine!: { rollerGroup: THREE.Group; flywheel: THREE.Mesh };
  private rollerSmoke!: RollerSmoke;
  private chimneySmoke!: ChimneySmoke;
  private confetti!: Confetti;
  private towerBody!: CANNON.Body;
  private clock = new THREE.Clock();
  private resizeObserver?: ResizeObserver;
  private input: GameInputState;
  private events: GameEvents;
  private opts: GameOptions;
  private rafId: number | null = null;
  private engineHandle: ReturnType<typeof audio.startEngine> | null = null;
  private paused = false;

  private player = {
    position: new THREE.Vector3(0, 1.65, 4.8),
    yaw: Math.PI,
    pitch: -0.1,
    velocity: new THREE.Vector3(),
  };

  private tyreState: TyreState = "free";
  private rollerCharge = 0;
  private releaseSpeed = 0;
  private loadedTyreSlotX = 0.2;
  private launchDirection = new THREE.Vector3(0, 0, -1);
  private carryOffset = new THREE.Vector3(0, -0.48, -1.55);
  private towerHit = false;
  private launchedRestTime = 0;
  private goalResetTimer = 0;
  private tyreVisualRollAngle = 0;
  private status = "Walk to the tyre and tap Pick";
  private wobbleQ = new THREE.Quaternion();
  private wobbleEuler = new THREE.Euler(0, 0, 0, "XYZ");
  private hudTick = 0;
  private hudIntervalId: number | null = null;
  private fpsSmoothed = 60;
  private currentPixelRatio = 1;
  private adaptCooldown = 0;

  constructor(container: HTMLElement, input: GameInputState, opts: GameOptions, events: GameEvents) {
    this.container = container;
    this.input = input;
    this.opts = opts;
    this.events = events;
    audio.setMuted(!opts.sfxOn);

    const theme = getTheme(opts.themeId);

    this.canvas = document.createElement("canvas");
    this.canvas.id = "game-canvas";
    container.appendChild(this.canvas);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(theme.sky);
    this.scene.fog = new THREE.Fog(theme.fog, theme.fogNear, theme.fogFar);

    const rect = container.getBoundingClientRect();
    this.camera = new THREE.PerspectiveCamera(68, Math.max(1, rect.width) / Math.max(1, rect.height), 0.1, 220);

    // Adaptive renderer: start at the device pixel ratio capped at 1.5 so
    // mid-range Androids don't burn fillrate. We re-tune dynamically based
    // on measured FPS during the game loop.
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.currentPixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    this.renderer.setPixelRatio(this.currentPixelRatio);
    this.renderer.setSize(rect.width, rect.height, false);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    const hemi = new THREE.HemisphereLight(theme.hemiSky, theme.hemiGround, theme.hemiIntensity);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight(theme.sunColor, theme.sunIntensity);
    sun.position.set(-8, 12, 7);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -24;
    sun.shadow.camera.right = 24;
    sun.shadow.camera.top = 24;
    sun.shadow.camera.bottom = -24;
    this.scene.add(sun);

    this.world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.82, 0) });
    this.world.broadphase = new CANNON.SAPBroadphase(this.world);
    this.world.allowSleep = true;
    this.world.defaultContactMaterial.friction = 0.85;
    this.world.defaultContactMaterial.restitution = 0.06;

    const tyreMaterial = new CANNON.Material("tyre");
    const dustMaterial = new CANNON.Material("packed-dirt");
    this.world.addContactMaterial(
      new CANNON.ContactMaterial(tyreMaterial, dustMaterial, {
        friction: 1.35,
        restitution: 0.04,
        contactEquationStiffness: 1e7,
      }),
    );

    const groundBody = new CANNON.Body({ mass: 0, material: dustMaterial });
    groundBody.addShape(new CANNON.Plane());
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    this.world.addBody(groundBody);

    const materials = createMaterials(theme);
    this.ctx = { scene: this.scene, world: this.world, materials, dustMaterial, hemi, sun };

    buildEnvironment(this.ctx);
    const target = buildTargetChallenge(this.ctx);
    this.towerBody = target.towerBody;
    this.machine = buildRollerMachine(this.ctx);
    this.tyre = createTyre(this.ctx, tyreMaterial);
    this.rollerSmoke = buildRollerSmoke(this.scene, tyreRadius);
    this.chimneySmoke = buildChimneySmoke(this.scene, target.chimneyTop);
    this.confetti = buildTowerConfetti(this.scene);

    this.tyre.body.addEventListener("collide", (event: { body: CANNON.Body }) => {
      if (event.body !== this.towerBody) return;
      this.registerTowerHit();
    });

    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(() => this.onResize());
      this.resizeObserver.observe(container);
    }
    window.addEventListener("resize", this.onResize);

    if (opts.sfxOn) {
      void audio.unlock().then(() => {
        if (!this.opts.sfxOn || this.paused) return;
        this.engineHandle = audio.startEngine();
        this.engineHandle.setCharge(this.tyreState === "loaded" ? this.rollerCharge : 0);
      });
    }

    // Throttle HUD react notifications to 15 Hz
    this.hudIntervalId = window.setInterval(() => this.notifyHud(), 66);
  }

  private onResize = () => {
    const rect = this.container.getBoundingClientRect();
    this.camera.aspect = Math.max(0.1, rect.width / Math.max(1, rect.height));
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(rect.width, rect.height, false);
  };

  pause(): void {
    if (this.paused) return;
    this.paused = true;
    if (this.engineHandle) {
      this.engineHandle.stop();
      this.engineHandle = null;
    }
  }

  resume(): void {
    if (!this.paused) return;
    this.paused = false;
    if (this.opts.sfxOn) {
      this.engineHandle = audio.startEngine();
      this.engineHandle.setCharge(this.tyreState === "loaded" ? this.rollerCharge : 0);
    }
    // reset frame timer so dt isn't a giant spike
    this.clock.getDelta();
  }

  setSfxOn(on: boolean): void {
    this.opts.sfxOn = on;
    audio.setMuted(!on);
    if (!on && this.engineHandle) {
      this.engineHandle.stop();
      this.engineHandle = null;
    } else if (on && !this.engineHandle && !this.paused) {
      this.engineHandle = audio.startEngine();
      this.engineHandle.setCharge(this.tyreState === "loaded" ? this.rollerCharge : 0);
    }
  }

  start(): void {
    if (this.rafId !== null) return;
    this.clock.getDelta();
    const loop = () => {
      this.rafId = requestAnimationFrame(loop);
      this.step();
    };
    loop();
  }

  dispose(): void {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    if (this.hudIntervalId !== null) clearInterval(this.hudIntervalId);
    this.hudIntervalId = null;
    if (this.engineHandle) {
      this.engineHandle.stop();
      this.engineHandle = null;
    }
    this.resizeObserver?.disconnect();
    window.removeEventListener("resize", this.onResize);
    this.rollerSmoke.dispose();
    this.chimneySmoke.dispose();
    this.confetti.dispose();
    disposeMaterials(this.ctx.materials);
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry?.dispose();
      }
    });
    this.renderer.dispose();
    if (this.canvas.parentElement === this.container) this.container.removeChild(this.canvas);
  }

  /* ---------- core simulation ---------- */

  private step(): void {
    if (this.paused) return;
    const dt = Math.min(this.clock.getDelta(), 0.033);

    this.consumeInput();
    this.updatePlayer(dt);
    this.updateTyre(dt);

    if (this.tyreState !== "carried" && this.tyreState !== "loaded") {
      const maxSubSteps = this.tyreState === "launched" ? 16 : 3;
      this.world.step(1 / 60, dt, maxSubSteps);
      this.checkLaunchedTyreTowerOverlap();
    }
    this.updateTyreRespawn(dt);
    this.animateMachine(dt);
    this.rollerSmoke.update(dt, this.rollerCharge, this.tyreState === "loaded", this.tyre.mesh);
    this.chimneySmoke.update(dt);
    this.confetti.update(dt);

    if (this.engineHandle) {
      const target = this.tyreState === "loaded" ? this.rollerCharge : 0;
      this.engineHandle.setCharge(target);
    }

    this.renderer.render(this.scene, this.camera);
    this.hudTick += dt;

    // Adaptive pixel ratio — drop quality if we slip below 50 FPS, restore
    // when we comfortably exceed 58 FPS. Cooldown so we never thrash.
    if (dt > 0) {
      const fps = 1 / dt;
      this.fpsSmoothed = this.fpsSmoothed * 0.9 + fps * 0.1;
      this.adaptCooldown -= dt;
      if (this.adaptCooldown <= 0) {
        if (this.fpsSmoothed < 50 && this.currentPixelRatio > 0.75) {
          this.currentPixelRatio = Math.max(0.75, this.currentPixelRatio - 0.25);
          this.renderer.setPixelRatio(this.currentPixelRatio);
          this.adaptCooldown = 2;
        } else if (this.fpsSmoothed > 58 && this.currentPixelRatio < Math.min(window.devicePixelRatio || 1, 1.5) - 0.05) {
          this.currentPixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
          this.renderer.setPixelRatio(this.currentPixelRatio);
          this.adaptCooldown = 4;
        }
      }
    }
  }

  private consumeInput(): void {
    // joystick stays continuous; look + button presses are consumed each tick
    this.player.yaw -= this.input.lookDx * 0.0036;
    this.player.pitch -= this.input.lookDy * 0.0028;
    this.player.pitch = THREE.MathUtils.clamp(this.player.pitch, -0.65, 0.55);
    this.input.lookDx = 0;
    this.input.lookDy = 0;

    if (this.input.pressInteract) {
      this.input.pressInteract = false;
      this.interact();
    }
    if (this.input.pressRelease) {
      this.input.pressRelease = false;
      this.releaseTyre();
    }
  }

  /* ---------- helpers ---------- */

  private cameraForward(flat = false): THREE.Vector3 {
    const direction = new THREE.Vector3(0, 0, -1).applyEuler(
      new THREE.Euler(this.player.pitch, this.player.yaw, 0, "YXZ"),
    );
    if (flat) {
      direction.y = 0;
      direction.normalize();
    }
    return direction;
  }

  private cameraRight(): THREE.Vector3 {
    return this.cameraForward(true).cross(new THREE.Vector3(0, 1, 0)).normalize();
  }

  private getRollerDriveSpin(): number {
    return this.tyreState === "loaded" ? THREE.MathUtils.lerp(10, 42, this.rollerCharge) : 2;
  }

  private setTyreKinematic(): void {
    this.tyre.body.type = CANNON.Body.KINEMATIC;
    this.tyre.body.mass = 0;
    this.tyre.body.velocity.setZero();
    this.tyre.body.angularVelocity.setZero();
    this.tyre.body.updateMassProperties();
    this.tyre.body.collisionResponse = false;
  }

  private setTyreDynamic(): void {
    this.tyre.body.type = CANNON.Body.DYNAMIC;
    this.tyre.body.mass = 16;
    this.tyre.body.updateMassProperties();
    this.tyre.body.collisionResponse = true;
    this.tyre.body.wakeUp();
  }

  private carryTyre(): void {
    this.setTyreKinematic();
    this.tyreState = "carried";
    this.rollerCharge = 0;
    this.status = "Carry it to the rollers";
  }

  private loadTyre(): void {
    this.setTyreKinematic();
    this.tyreState = "loaded";
    this.tyreVisualRollAngle = 0;
    // place near roller centre — slot X based on player x clamped
    this.loadedTyreSlotX = THREE.MathUtils.clamp(this.player.position.x, rollerSlotXMin, rollerSlotXMax);
    this.tyre.body.position.set(this.loadedTyreSlotX, rollerCenter.y, rollerCenter.z);
    this.tyre.body.quaternion.setFromEuler(0, 0, 0);
    this.status = "Tyre charging — release when ready";
  }

  private releaseTyre(): void {
    if (this.tyreState !== "loaded") return;
    if (this.rollerCharge < 0.18) return;

    this.towerHit = false;
    this.launchedRestTime = 0;
    this.goalResetTimer = 0;
    this.releaseSpeed = THREE.MathUtils.lerp(7, 25, this.rollerCharge);
    // tiny aim assist toward tower center (difficulty-tuned)
    const tuning = DIFFICULTY_TUNING[this.opts.difficulty];
    const dirX = -this.loadedTyreSlotX * tuning.aimAssist;
    this.setTyreDynamic();
    this.tyreState = "launched";
    this.tyre.body.position.set(this.loadedTyreSlotX, rollerCenter.y, rollerCenter.z - 0.72);
    this.tyre.body.velocity.set(
      this.launchDirection.x * this.releaseSpeed + dirX,
      0.2,
      this.launchDirection.z * this.releaseSpeed,
    );
    this.tyre.body.angularVelocity.set(-this.releaseSpeed / tyreRadius, 0, 0);
    this.status = `Launched at ${this.releaseSpeed.toFixed(1)} m/s`;
    if (this.opts.sfxOn) audio.whoosh();
    if (this.opts.hapticsOn && navigator.vibrate) navigator.vibrate(35);
  }

  private respawnTyre(message = "Tyre respawned. Pick it up again"): void {
    this.setTyreDynamic();
    this.tyreState = "free";
    this.towerHit = false;
    this.launchedRestTime = 0;
    this.goalResetTimer = 0;
    this.rollerCharge = 0;
    this.releaseSpeed = 0;
    this.tyre.body.position.set(-1.2, tyreRadius + 0.08, 1.0);
    this.tyre.body.velocity.setZero();
    this.tyre.body.angularVelocity.setZero();
    this.tyre.body.quaternion.setFromEuler(0, 0, 0);
    this.status = message;
  }

  private interact(): void {
    const tyrePosition = new THREE.Vector3(
      this.tyre.body.position.x,
      this.tyre.body.position.y,
      this.tyre.body.position.z,
    );
    const playerFeet = this.player.position.clone();
    playerFeet.y = tyrePosition.y;

    if (this.tyreState === "free" || this.tyreState === "launched") {
      if (playerFeet.distanceTo(tyrePosition) < 2.4) this.carryTyre();
      return;
    }

    if (this.tyreState === "carried") {
      const nearMachine = this.player.position.distanceTo(
        new THREE.Vector3(rollerCenter.x, this.player.position.y, rollerCenter.z),
      ) < 3.0;
      if (nearMachine) this.loadTyre();
      else {
        this.setTyreDynamic();
        this.tyreState = "free";
        this.status = "Dropped — get closer to the rollers next time";
      }
    }
  }

  private registerTowerHit(): void {
    if (this.towerHit) return;
    this.confetti.burst();
    this.towerHit = true;
    this.goalResetTimer = 2.4;
    this.status = "Goal — direct hit on the tower!";
    if (this.opts.sfxOn) {
      audio.thud();
      window.setTimeout(() => audio.pop(), 90);
    }
    if (this.opts.hapticsOn && navigator.vibrate) navigator.vibrate([40, 30, 80]);
    this.events.onWin(this.releaseSpeed);
  }

  private checkLaunchedTyreTowerOverlap(): void {
    if (this.tyreState !== "launched" || this.towerHit) return;
    const p = this.tyre.body.position;
    const horiz = Math.hypot(p.x, p.z - (-31));
    const r = towerHorizRadiusAtWorldY(p.y) + tyreRadius * 0.92;
    if (horiz > r) return;
    const yMin = TOWER_CENTER_Y - TOWER_HALF_HEIGHT - tyreRadius;
    const yMax = TOWER_CENTER_Y + TOWER_HALF_HEIGHT + 0.55;
    if (p.y >= yMin && p.y <= yMax) this.registerTowerHit();
  }

  private updatePlayer(dt: number): void {
    const forward = this.cameraForward(true);
    const right = this.cameraRight();
    const wish = new THREE.Vector3();

    // joystick: y is forward (negative because joystick up is screen up = forward)
    const jx = this.input.moveX;
    const jy = this.input.moveY;
    if (Math.abs(jx) + Math.abs(jy) > 0.01) {
      const fwdAmt = -jy;
      const rightAmt = jx;
      wish.addScaledVector(forward, fwdAmt);
      wish.addScaledVector(right, rightAmt);
    }
    if (wish.lengthSq() > 1) wish.normalize();
    const tuning = DIFFICULTY_TUNING[this.opts.difficulty];
    this.player.velocity.lerp(wish.multiplyScalar(tuning.charSpeed), 1 - Math.exp(-dt * 12));
    this.player.position.addScaledVector(this.player.velocity, dt);
    this.player.position.x = THREE.MathUtils.clamp(this.player.position.x, -2.75, 3.25);
    this.player.position.z = THREE.MathUtils.clamp(this.player.position.z, -8, 7);

    this.camera.position.copy(this.player.position);
    this.camera.rotation.set(this.player.pitch, this.player.yaw, 0, "YXZ");
  }

  private updateTyre(dt: number): void {
    if (this.tyreState === "carried") {
      const offset = this.carryOffset.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), this.player.yaw);
      const target = this.player.position.clone().add(offset);
      this.tyre.body.position.set(target.x, target.y, target.z);
      this.tyre.body.quaternion.setFromEuler(0, this.player.yaw, 0);
    }

    if (this.tyreState === "loaded") {
      const tuning = DIFFICULTY_TUNING[this.opts.difficulty];
      this.rollerCharge = Math.min(1, this.rollerCharge + dt * tuning.chargeRate);
      const drive = this.getRollerDriveSpin();
      const tyreOmega = (drive * rollerDrumRadius) / tyreRadius;
      this.tyreVisualRollAngle += tyreOmega * dt;
      this.tyre.body.position.set(this.loadedTyreSlotX, rollerCenter.y, rollerCenter.z);
      this.tyre.body.quaternion.setFromEuler(this.tyreVisualRollAngle, 0, 0);
    }

    this.tyre.mesh.position.set(this.tyre.body.position.x, this.tyre.body.position.y, this.tyre.body.position.z);
    this.tyre.mesh.quaternion.set(
      this.tyre.body.quaternion.x,
      this.tyre.body.quaternion.y,
      this.tyre.body.quaternion.z,
      this.tyre.body.quaternion.w,
    );

    if (this.tyreState === "loaded") {
      const t = this.clock.elapsedTime;
      const c = this.rollerCharge;
      this.tyre.mesh.position.x += 0.02 * Math.sin(t * 35) * (0.45 + c);
      this.tyre.mesh.position.z += 0.016 * Math.sin(t * 28 + 1.1) * (0.45 + c);
      this.tyre.mesh.position.y += 0.007 * Math.sin(t * 46) * (0.35 + c);
      this.wobbleEuler.set(
        0.02 * (0.45 + c) * Math.sin(t * 41),
        0.01 * (0.4 + c) * Math.sin(t * 32 + 0.2),
        0.04 * c * Math.sin(t * 51 + 0.3),
      );
      this.wobbleQ.setFromEuler(this.wobbleEuler);
      this.tyre.mesh.quaternion.multiply(this.wobbleQ);
    }
  }

  private updateTyreRespawn(dt: number): void {
    if (this.towerHit) {
      this.goalResetTimer -= dt;
      if (this.goalResetTimer <= 0) this.respawnTyre("Tyre respawned. Send another!");
      return;
    }
    if (this.tyre.body.position.y < -5 || this.tyre.body.position.z < -76 || Math.abs(this.tyre.body.position.x) > 18) {
      this.respawnTyre("Tyre reset. Pick it up again");
      return;
    }
    if (this.tyreState === "launched" && this.tyre.body.velocity.length() < 0.8) {
      this.launchedRestTime += dt;
      if (this.launchedRestTime >= 1.2) this.respawnTyre("Tyre slowed down. Respawned for another try");
    } else {
      this.launchedRestTime = 0;
    }
  }

  private animateMachine(dt: number): void {
    const spin = this.getRollerDriveSpin();
    this.machine.rollerGroup.children.forEach((roller) => {
      roller.rotation.x += spin * dt;
    });
    this.machine.flywheel.rotation.x += spin * 0.8 * dt;
  }

  private notifyHud(): void {
    const canRelease = this.tyreState === "loaded" && this.rollerCharge >= 0.18;

    let actionLabel = "Pick";
    let canAction = false;
    const tyrePosition = new THREE.Vector3(
      this.tyre.body.position.x,
      this.tyre.body.position.y,
      this.tyre.body.position.z,
    );
    const playerFeet = this.player.position.clone();
    playerFeet.y = tyrePosition.y;

    if (this.tyreState === "free" || this.tyreState === "launched") {
      actionLabel = "Pick";
      canAction = playerFeet.distanceTo(tyrePosition) < 2.4;
    } else if (this.tyreState === "carried") {
      const nearMachine = this.player.position.distanceTo(
        new THREE.Vector3(rollerCenter.x, this.player.position.y, rollerCenter.z),
      ) < 3.0;
      actionLabel = nearMachine ? "Place" : "Drop";
      canAction = true;
    } else {
      actionLabel = "Loaded";
      canAction = false;
    }

    const hud: GameHudState = {
      charge: this.rollerCharge,
      status: this.status,
      canRelease,
      actionLabel,
      canAction,
      lastReleaseSpeed: this.releaseSpeed,
      hit: this.towerHit,
    };
    this.events.onHud(hud);
  }
}
