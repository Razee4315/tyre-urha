import * as THREE from "three";
import * as CANNON from "cannon-es";
import type { SceneCtx } from "./scene";

export const tyreRadius = 0.62;
const tyreSidewallThickness = 0.16;

/**
 * Builds a chunky off-road tyre with sidewall lettering, a proper alloy
 * hub, and tread blocks. Heavier than the original torus + box treads
 * but still cheap (single mesh tree, no textures).
 */
export function createTyre(ctx: SceneCtx, tyreMaterial: CANNON.Material): {
  mesh: THREE.Group;
  body: CANNON.Body;
} {
  const { materials } = ctx;
  const tyre = new THREE.Group();

  // Outer rubber torus
  const torus = new THREE.Mesh(
    new THREE.TorusGeometry(tyreRadius, tyreSidewallThickness, 24, 96),
    materials.rubber,
  );
  torus.rotation.y = Math.PI / 2;
  torus.castShadow = true;
  torus.receiveShadow = true;
  tyre.add(torus);

  // Sidewall plates (give the tyre a flat side instead of pure torus)
  for (const x of [-0.1, 0.1]) {
    const sidewall = new THREE.Mesh(
      new THREE.RingGeometry(0.32, tyreRadius - 0.02, 48, 1),
      materials.rubberSide,
    );
    sidewall.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2;
    sidewall.position.x = x;
    sidewall.castShadow = false;
    sidewall.receiveShadow = true;
    tyre.add(sidewall);
  }

  // Sidewall raised lettering (chunky bumps along the rubberSide ring)
  for (const xSide of [-0.105, 0.105]) {
    const letterRing = new THREE.Group();
    const ringRadius = tyreRadius - 0.18;
    const letterCount = 18;
    for (let i = 0; i < letterCount; i += 1) {
      const angle = (i / letterCount) * Math.PI * 2;
      const bump = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.075, 0.18),
        materials.rubber,
      );
      bump.position.set(
        xSide * 1.05,
        Math.cos(angle) * ringRadius,
        Math.sin(angle) * ringRadius,
      );
      bump.rotation.x = -angle;
      letterRing.add(bump);
    }
    tyre.add(letterRing);
  }

  // Alloy hub (5-spoke)
  const hubRadius = 0.28;
  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(hubRadius, hubRadius, 0.32, 32),
    materials.alloy,
  );
  hub.rotation.z = Math.PI / 2;
  hub.castShadow = true;
  tyre.add(hub);

  for (let i = 0; i < 5; i += 1) {
    const angle = (i / 5) * Math.PI * 2;
    const spoke = new THREE.Mesh(
      new THREE.BoxGeometry(0.31, 0.06, 0.46),
      materials.alloy,
    );
    spoke.position.set(0, Math.cos(angle) * 0.14, Math.sin(angle) * 0.14);
    spoke.rotation.x = -angle;
    spoke.castShadow = true;
    tyre.add(spoke);
  }

  // Hubcap centre boss
  const boss = new THREE.Mesh(
    new THREE.CylinderGeometry(0.085, 0.085, 0.36, 24),
    materials.hubCap,
  );
  boss.rotation.z = Math.PI / 2;
  boss.castShadow = true;
  tyre.add(boss);

  // Tread blocks – chunkier than the original
  const treadCount = 18;
  for (let i = 0; i < treadCount; i += 1) {
    const angle = (i / treadCount) * Math.PI * 2;
    const tread = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.075, 0.26),
      materials.rubberSide,
    );
    tread.position.set(0, Math.cos(angle) * (tyreRadius + 0.05), Math.sin(angle) * (tyreRadius + 0.05));
    tread.rotation.x = -angle;
    tread.castShadow = true;
    tyre.add(tread);

    if (i % 2 === 0) {
      const groove = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.082, 0.32), materials.rubber);
      groove.position.copy(tread.position);
      groove.rotation.copy(tread.rotation);
      tyre.add(groove);
    }
  }

  ctx.scene.add(tyre);

  const body = new CANNON.Body({
    mass: 16,
    material: tyreMaterial,
    linearDamping: 0.09,
    angularDamping: 0.12,
    allowSleep: false,
  });
  const cylinder = new CANNON.Cylinder(tyreRadius, tyreRadius, 0.34, 32);
  const shapeOrientation = new CANNON.Quaternion();
  shapeOrientation.setFromEuler(0, 0, Math.PI / 2);
  body.addShape(cylinder, new CANNON.Vec3(), shapeOrientation);
  body.position.set(-1.2, tyreRadius + 0.08, 1.0);
  body.quaternion.setFromEuler(0, 0, 0);
  ctx.world.addBody(body);

  return { mesh: tyre, body };
}
