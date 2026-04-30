import * as THREE from "three";
import type { SceneCtx } from "./scene";
import { addBox, addPhysicsBox } from "./scene";

export const ROLLER_AXIS_X = 0.2;
export const ROLLER_HALF_LENGTH = 2.65 / 2;
export const ROLLER_SLOT_X_MARGIN = 0.28;
export const rollerSlotXMin = ROLLER_AXIS_X - ROLLER_HALF_LENGTH + ROLLER_SLOT_X_MARGIN;
export const rollerSlotXMax = ROLLER_AXIS_X + ROLLER_HALF_LENGTH - ROLLER_SLOT_X_MARGIN;
export const rollerCenter = new THREE.Vector3(ROLLER_AXIS_X, 0.84, -2.9);
export const rollerDrumRadius = 0.18;

export function buildRollerMachine(ctx: SceneCtx): {
  rollerGroup: THREE.Group;
  flywheel: THREE.Mesh;
} {
  const { materials } = ctx;
  // Steel chassis (physical so the player can lean on it)
  addPhysicsBox(ctx, [2.5, 0.22, 1.72], [0.2, 0.11, -2.9], materials.darkMetal);
  addBox(ctx, [0.22, 1.0, 1.95], [1.6, 0.54, -2.9], materials.metal);

  const rollerGroup = new THREE.Group();
  ctx.scene.add(rollerGroup);
  for (const z of [-3.25, -2.55]) {
    const roller = new THREE.Mesh(
      new THREE.CylinderGeometry(rollerDrumRadius, rollerDrumRadius, 2.65, 32),
      materials.darkMetal,
    );
    roller.rotation.z = Math.PI / 2;
    roller.position.set(0.2, 0.52, z);
    roller.castShadow = true;
    roller.receiveShadow = true;
    rollerGroup.add(roller);
  }

  // Decorative ribbed ridge under the rollers
  const rib = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 0.06, 0.08),
    materials.metal,
  );
  rib.position.set(0.2, 0.32, -2.9);
  ctx.scene.add(rib);

  const engine = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.78, 0.82), materials.metal);
  engine.position.set(2.45, 0.55, -2.95);
  engine.castShadow = true;
  engine.receiveShadow = true;
  ctx.scene.add(engine);

  const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.6, 12), materials.darkMetal);
  exhaust.position.set(2.6, 1.15, -3.05);
  exhaust.castShadow = true;
  ctx.scene.add(exhaust);

  const flywheel = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.18, 48), materials.metal);
  flywheel.rotation.z = Math.PI / 2;
  flywheel.position.set(1.88, 0.66, -2.95);
  flywheel.castShadow = true;
  ctx.scene.add(flywheel);

  // Flywheel spokes
  for (let i = 0; i < 6; i += 1) {
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.95), materials.darkMetal);
    spoke.position.copy(flywheel.position);
    spoke.rotation.x = (i / 6) * Math.PI;
    spoke.castShadow = true;
    flywheel.add(spoke);
  }

  const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.52, 24), materials.accent);
  arrow.rotation.x = -Math.PI / 2;
  arrow.position.set(0.2, 0.62, -4.25);
  arrow.castShadow = true;
  ctx.scene.add(arrow);

  return { rollerGroup, flywheel };
}
