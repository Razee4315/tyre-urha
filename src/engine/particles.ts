import * as THREE from "three";
import { towerHorizRadiusAtWorldY, TOWER_Z } from "./tower";

export type RollerSmoke = {
  points: THREE.Points;
  update: (dt: number, charge: number, active: boolean, mesh: THREE.Group) => void;
  dispose: () => void;
};

export type ChimneySmoke = {
  points: THREE.Points;
  update: (dt: number) => void;
  dispose: () => void;
};

export type Confetti = {
  burst: () => void;
  update: (dt: number) => void;
  dispose: () => void;
};

const CONFETTI_PALETTE = [
  0xe63946, 0xf4a261, 0xe9c46a, 0x2a9d8f, 0x8338ec, 0xff006e, 0x3a86ff, 0xffbe0b, 0xfb5607, 0x06d6a0,
];

function createSmokeTexture(): THREE.CanvasTexture | null {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 64;
  const g = c.getContext("2d");
  if (!g) return null;
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, "rgba(255,255,255,0.55)");
  grd.addColorStop(0.4, "rgba(210,210,210,0.2)");
  grd.addColorStop(0.75, "rgba(170,170,170,0.08)");
  grd.addColorStop(1, "rgba(150,150,150,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function buildRollerSmoke(scene: THREE.Scene, tyreRadius: number): RollerSmoke {
  const count = 70;
  const positions = new Float32Array(count * 3);
  const puffs: { life: number; vx: number; vy: number; vz: number }[] = [];
  for (let i = 0; i < count; i += 1) puffs.push({ life: 0, vx: 0, vy: 0, vz: 0 });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const smTex = createSmokeTexture();
  const material = new THREE.PointsMaterial({
    size: 0.5,
    map: smTex ?? undefined,
    alphaMap: smTex ?? undefined,
    transparent: true,
    depthWrite: false,
    opacity: 0.72,
    color: 0xbfb8b0,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  scene.add(points);

  const origin = new THREE.Vector3();
  const scratch = new THREE.Vector3();
  let acc = 0;

  const spawn = (i: number, charge: number, mesh: THREE.Group) => {
    const speedFactor = Math.pow(Math.max(0, charge), 1.1);
    scratch.set(0, -tyreRadius * 0.58, 0.08);
    scratch.applyQuaternion(mesh.quaternion);
    origin.copy(mesh.position).add(scratch);
    origin.x += (Math.random() - 0.5) * (0.1 + 0.12 * speedFactor);
    origin.z += (Math.random() - 0.5) * (0.16 + 0.12 * speedFactor);
    const i3 = i * 3;
    const f = 0.45 + speedFactor;
    positions[i3] = origin.x;
    positions[i3 + 1] = origin.y + Math.random() * 0.04;
    positions[i3 + 2] = origin.z;
    puffs[i] = {
      life: 0.45 + 0.65 * f * (0.35 + Math.random()),
      vx: (Math.random() - 0.5) * (0.15 + 0.35 * speedFactor),
      vy: 0.38 + 0.85 * f * (0.4 + Math.random() * 0.6),
      vz: 0.05 + 0.55 * f * (0.25 + Math.random() * 0.75),
    };
  };

  return {
    points,
    update(dt, charge, active, mesh) {
      const speedFactor = Math.pow(Math.max(0, charge), 1.1);
      material.size = 0.32 + 0.58 * (0.15 + 0.85 * speedFactor);
      material.opacity = 0.28 + 0.5 * (0.2 + 0.8 * speedFactor);

      if (active) {
        acc += (1.2 + 38 * speedFactor) * dt;
        while (acc >= 1) {
          acc -= 1;
          for (let i = 0; i < count; i += 1) {
            if (puffs[i].life <= 0) {
              spawn(i, charge, mesh);
              break;
            }
          }
        }
      } else {
        acc = 0;
      }

      for (let i = 0; i < count; i += 1) {
        const p = puffs[i];
        const i3 = i * 3;
        if (p.life > 0) {
          p.life -= dt;
          positions[i3] += p.vx * dt;
          positions[i3 + 1] += p.vy * dt;
          positions[i3 + 2] += p.vz * dt;
          p.vy += 0.28 * dt;
          p.vx *= 1 - 0.85 * dt;
          p.vz *= 1 - 0.4 * dt;
        } else {
          positions[i3 + 1] = -200;
        }
      }
      (geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    },
    dispose() {
      scene.remove(points);
      geometry.dispose();
      material.dispose();
      smTex?.dispose();
    },
  };
}

export function buildChimneySmoke(scene: THREE.Scene, origin: THREE.Vector3): ChimneySmoke {
  const count = 60;
  const positions = new Float32Array(count * 3);
  const puffs: { life: number; vx: number; vy: number; vz: number }[] = [];
  for (let i = 0; i < count; i += 1) puffs.push({ life: 0, vx: 0, vy: 0, vz: 0 });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const smTex = createSmokeTexture();
  const material = new THREE.PointsMaterial({
    size: 0.62,
    map: smTex ?? undefined,
    alphaMap: smTex ?? undefined,
    transparent: true,
    depthWrite: false,
    opacity: 0.52,
    color: 0x7a7672,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  scene.add(points);

  const spawnOrigin = new THREE.Vector3();
  let acc = 0;

  const spawn = (i: number) => {
    spawnOrigin.copy(origin);
    spawnOrigin.x += (Math.random() - 0.5) * 0.2;
    spawnOrigin.z += (Math.random() - 0.5) * 0.2;
    spawnOrigin.y += Math.random() * 0.08;
    const i3 = i * 3;
    positions[i3] = spawnOrigin.x;
    positions[i3 + 1] = spawnOrigin.y;
    positions[i3 + 2] = spawnOrigin.z;
    puffs[i] = {
      life: 1.6 + Math.random() * 2.4,
      vx: (Math.random() - 0.5) * 0.22,
      vy: 0.5 + Math.random() * 1.05,
      vz: (Math.random() - 0.5) * 0.22,
    };
  };

  return {
    points,
    update(dt) {
      acc += dt * 9;
      while (acc >= 1) {
        acc -= 1;
        for (let i = 0; i < count; i += 1) {
          if (puffs[i].life <= 0) {
            spawn(i);
            break;
          }
        }
      }
      for (let i = 0; i < count; i += 1) {
        const p = puffs[i];
        const i3 = i * 3;
        if (p.life > 0) {
          p.life -= dt;
          positions[i3] += p.vx * dt;
          positions[i3 + 1] += p.vy * dt;
          positions[i3 + 2] += p.vz * dt;
          p.vy += 0.1 * dt;
          p.vx *= 1 - 0.32 * dt;
          p.vz *= 1 - 0.32 * dt;
        } else {
          positions[i3 + 1] = -200;
        }
      }
      (geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    },
    dispose() {
      scene.remove(points);
      geometry.dispose();
      material.dispose();
      smTex?.dispose();
    },
  };
}

export function buildTowerConfetti(scene: THREE.Scene): Confetti {
  const maxCount = 240;
  const geometry = new THREE.BoxGeometry(0.072, 0.1, 0.02);
  const material = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 1,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.InstancedMesh(geometry, material, maxCount);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;
  mesh.visible = false;
  scene.add(mesh);

  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  const surf = new THREE.Vector3();
  const outward = new THREE.Vector3();
  const hiddenMatrix = new THREE.Matrix4().makeTranslation(0, -420, 0);

  type Particle = {
    life: number;
    px: number; py: number; pz: number;
    vx: number; vy: number; vz: number;
    rx: number; ry: number; rz: number;
    avx: number; avy: number; avz: number;
  };
  const particles: Particle[] = [];
  for (let i = 0; i < maxCount; i++) {
    particles.push({
      life: 0, px: 0, py: 0, pz: 0,
      vx: 0, vy: 0, vz: 0,
      rx: 0, ry: 0, rz: 0,
      avx: 0, avy: 0, avz: 0,
    });
  }

  let hasActive = false;

  const sampleTowerSurface = (target: THREE.Vector3) => {
    const y = 1.4 + Math.random() * 6.8;
    const r = towerHorizRadiusAtWorldY(y) * 0.95 + 0.04;
    const ang = Math.random() * Math.PI * 2;
    target.set(Math.cos(ang) * r, y, TOWER_Z + Math.sin(ang) * r);
  };

  const burst = () => {
    mesh.visible = true;
    hasActive = true;
    for (let i = 0; i < maxCount; i += 1) {
      sampleTowerSurface(surf);
      outward.set(surf.x, 0, surf.z - TOWER_Z);
      outward.normalize();
      const p = particles[i];
      p.px = surf.x;
      p.py = surf.y;
      p.pz = surf.z;
      const blast = 4.5 + Math.random() * 11;
      const lift = 3 + Math.random() * 7;
      p.vx = outward.x * blast * (0.65 + Math.random() * 0.55) + (Math.random() - 0.5) * 4;
      p.vy = lift + Math.random() * 4;
      p.vz = outward.z * blast * (0.65 + Math.random() * 0.55) + (Math.random() - 0.5) * 4;
      p.rx = Math.random() * Math.PI * 2;
      p.ry = Math.random() * Math.PI * 2;
      p.rz = Math.random() * Math.PI * 2;
      p.avx = (Math.random() - 0.5) * 16;
      p.avy = (Math.random() - 0.5) * 16;
      p.avz = (Math.random() - 0.5) * 16;
      p.life = 2.4 + Math.random() * 2;
      color.setHex(CONFETTI_PALETTE[i % CONFETTI_PALETTE.length]);
      mesh.setColorAt(i, color);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.instanceMatrix.needsUpdate = true;
  };

  const update = (dt: number) => {
    if (!hasActive) return;
    let any = false;
    const g = 11;
    for (let i = 0; i < maxCount; i += 1) {
      const p = particles[i];
      if (p.life <= 0) {
        mesh.setMatrixAt(i, hiddenMatrix);
        continue;
      }
      any = true;
      p.life -= dt;
      p.vy -= g * dt;
      p.vx *= 1 - 0.28 * dt;
      p.vz *= 1 - 0.28 * dt;
      p.px += p.vx * dt;
      p.py += p.vy * dt;
      p.pz += p.vz * dt;
      p.rx += p.avx * dt;
      p.ry += p.avy * dt;
      p.rz += p.avz * dt;
      const fade = THREE.MathUtils.clamp(p.life * 1.15, 0.15, 1);
      const s = 0.7 + 0.55 * fade;
      dummy.position.set(p.px, p.py, p.pz);
      dummy.rotation.set(p.rx, p.ry, p.rz);
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (!any) {
      hasActive = false;
      mesh.visible = false;
    }
  };

  return {
    burst,
    update,
    dispose() {
      scene.remove(mesh);
      geometry.dispose();
      material.dispose();
      mesh.dispose();
    },
  };
}
