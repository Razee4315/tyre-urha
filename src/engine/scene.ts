import * as THREE from "three";
import * as CANNON from "cannon-es";
import type { Materials } from "./materials";

export type SceneCtx = {
  scene: THREE.Scene;
  world: CANNON.World;
  materials: Materials;
  dustMaterial: CANNON.Material;
  hemi: THREE.HemisphereLight;
  sun: THREE.DirectionalLight;
};

export function addBox(
  ctx: SceneCtx,
  size: [number, number, number],
  position: [number, number, number],
  material: THREE.Material,
  cast = true,
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position);
  mesh.castShadow = cast;
  mesh.receiveShadow = true;
  ctx.scene.add(mesh);
  return mesh;
}

export function addPhysicsBox(
  ctx: SceneCtx,
  size: [number, number, number],
  position: [number, number, number],
  material: THREE.Material,
  rotation: [number, number, number] = [0, 0, 0],
): { mesh: THREE.Mesh; body: CANNON.Body } {
  const mesh = addBox(ctx, size, position, material);
  mesh.rotation.set(...rotation);
  const body = new CANNON.Body({ mass: 0, material: ctx.dustMaterial });
  body.addShape(new CANNON.Box(new CANNON.Vec3(size[0] / 2, size[1] / 2, size[2] / 2)));
  body.position.set(...position);
  body.quaternion.setFromEuler(...rotation);
  ctx.world.addBody(body);
  return { mesh, body };
}

export function addPhysicsCylinder(
  ctx: SceneCtx,
  radii: [number, number],
  height: number,
  position: [number, number, number],
  material: THREE.Material,
): { mesh: THREE.Mesh; body: CANNON.Body } {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radii[0], radii[1], height, 36), material);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  ctx.scene.add(mesh);

  const body = new CANNON.Body({ mass: 0, material: ctx.dustMaterial });
  const shape = new CANNON.Cylinder(radii[0], radii[1], height, 36);
  body.addShape(shape);
  body.position.set(...position);
  ctx.world.addBody(body);

  return { mesh, body };
}

export function buildEnvironment(ctx: SceneCtx): void {
  const { materials } = ctx;

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(48, 110, 12, 28), materials.dust);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  ctx.scene.add(ground);

  const lane = addBox(ctx, [7.2, 0.035, 74], [0, 0.025, -22], materials.lane, false);
  lane.castShadow = false;

  addPhysicsBox(ctx, [0.7, 3.2, 58], [-4.1, 1.6, -14], materials.wall);
  addPhysicsBox(ctx, [0.6, 2.0, 44], [4.2, 1.0, -20], materials.wallDark);

  for (let z = 0; z > -52; z -= 4.7) {
    addBox(ctx, [0.12, 3.45, 0.18], [-3.72, 1.72, z], materials.wallDark);
    addBox(ctx, [0.09, 2.1, 0.13], [3.88, 1.05, z - 1.2], materials.wall);
  }

  for (let i = 0; i < 10; i += 1) {
    const z = -5 - i * 5.3;
    const x = i % 2 === 0 ? 6.1 : 5.15;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.2, 2.0, 9), materials.trunk);
    trunk.position.set(x, 1, z);
    trunk.castShadow = true;
    ctx.scene.add(trunk);

    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1.25 + (i % 3) * 0.18, 2), materials.leaf);
    crown.position.set(x - 0.18, 2.45, z - 0.12);
    crown.castShadow = true;
    crown.receiveShadow = true;
    ctx.scene.add(crown);
  }

  const pathLine = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.03, 64),
    new THREE.MeshStandardMaterial({ color: 0xe0c48e, roughness: 1 }),
  );
  pathLine.position.set(-2.9, 0.055, -22);
  ctx.scene.add(pathLine);
}
