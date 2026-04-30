import * as THREE from "three";
import * as CANNON from "cannon-es";
import type { SceneCtx } from "./scene";
import { addPhysicsBox, addPhysicsCylinder } from "./scene";

export const TOWER_Z = -31;
export const TOWER_CENTER_Y = 4.1;
export const TOWER_HEIGHT = 8.2;
export const TOWER_HALF_HEIGHT = TOWER_HEIGHT / 2;
export const TOWER_RADIUS_TOP = 0.62;
export const TOWER_RADIUS_BOTTOM = 1.28;

export function towerHorizRadiusAtWorldY(worldY: number): number {
  const yRel = worldY - TOWER_CENTER_Y;
  const t = THREE.MathUtils.clamp((yRel + TOWER_HALF_HEIGHT) / TOWER_HEIGHT, 0, 1);
  return TOWER_RADIUS_BOTTOM + t * (TOWER_RADIUS_TOP - TOWER_RADIUS_BOTTOM);
}

export function buildTargetChallenge(ctx: SceneCtx): {
  towerBody: CANNON.Body;
  chimneyTop: THREE.Vector3;
} {
  const { materials } = ctx;
  const ladderCenterX = 0;
  const ladderCenterZ = -19.7;
  const ladderCenterY = 1.02;
  const ladderAngle = Math.PI / 6;
  const ladderLength = 3.6;

  for (const x of [-0.62, 0.62]) {
    addPhysicsBox(
      ctx,
      [0.14, 0.12, ladderLength],
      [ladderCenterX + x, ladderCenterY, ladderCenterZ],
      materials.wood,
      [ladderAngle, 0, 0],
    );
  }

  for (let i = 0; i < 6; i += 1) {
    const localZ = 1.25 - i * 0.5;
    addPhysicsBox(
      ctx,
      [1.52, 0.105, 0.14],
      [
        ladderCenterX,
        ladderCenterY - Math.sin(ladderAngle) * localZ,
        ladderCenterZ + Math.cos(ladderAngle) * localZ,
      ],
      materials.wood,
      [ladderAngle, 0, 0],
    );
  }

  const tower = addPhysicsCylinder(
    ctx,
    [TOWER_RADIUS_TOP, TOWER_RADIUS_BOTTOM],
    TOWER_HEIGHT,
    [0, TOWER_CENTER_Y, TOWER_Z],
    materials.tower,
  );
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.74, 0.66, 0.45, 36), materials.towerTop);
  cap.position.set(0, 8.42, TOWER_Z);
  cap.castShadow = true;
  cap.receiveShadow = true;
  ctx.scene.add(cap);

  const targetBand = new THREE.Mesh(new THREE.TorusGeometry(1.34, 0.035, 10, 64), materials.accent);
  targetBand.rotation.x = Math.PI / 2;
  targetBand.position.set(0, 1.3, TOWER_Z);
  targetBand.castShadow = true;
  ctx.scene.add(targetBand);

  return { towerBody: tower.body, chimneyTop: new THREE.Vector3(0, 8.68, TOWER_Z) };
}
