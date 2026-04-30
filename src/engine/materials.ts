import * as THREE from "three";
import type { Theme } from "../lib/themes";

export type Materials = {
  dust: THREE.MeshStandardMaterial;
  lane: THREE.MeshStandardMaterial;
  wall: THREE.MeshStandardMaterial;
  wallDark: THREE.MeshStandardMaterial;
  leaf: THREE.MeshStandardMaterial;
  trunk: THREE.MeshStandardMaterial;
  metal: THREE.MeshStandardMaterial;
  darkMetal: THREE.MeshStandardMaterial;
  rubber: THREE.MeshStandardMaterial;
  rubberSide: THREE.MeshStandardMaterial;
  alloy: THREE.MeshStandardMaterial;
  hubCap: THREE.MeshStandardMaterial;
  accent: THREE.MeshStandardMaterial;
  wood: THREE.MeshStandardMaterial;
  tower: THREE.MeshStandardMaterial;
  towerTop: THREE.MeshStandardMaterial;
};

export function createMaterials(theme: Theme): Materials {
  const accentHex = parseInt(theme.accent.replace("#", ""), 16);
  return {
    dust: new THREE.MeshStandardMaterial({ color: theme.ground, roughness: 0.95 }),
    lane: new THREE.MeshStandardMaterial({ color: theme.lane, roughness: 1 }),
    wall: new THREE.MeshStandardMaterial({ color: theme.wall, roughness: 0.98 }),
    wallDark: new THREE.MeshStandardMaterial({ color: theme.wallDark, roughness: 1 }),
    leaf: new THREE.MeshStandardMaterial({ color: theme.leaf, roughness: 0.9 }),
    trunk: new THREE.MeshStandardMaterial({ color: theme.trunk, roughness: 0.9 }),
    metal: new THREE.MeshStandardMaterial({ color: 0x22635e, roughness: 0.44, metalness: 0.45 }),
    darkMetal: new THREE.MeshStandardMaterial({ color: 0x17221e, roughness: 0.5, metalness: 0.6 }),
    rubber: new THREE.MeshStandardMaterial({ color: 0x0d0f0f, roughness: 0.72 }),
    rubberSide: new THREE.MeshStandardMaterial({ color: 0x252929, roughness: 0.88 }),
    alloy: new THREE.MeshStandardMaterial({ color: 0xb8c1c8, roughness: 0.32, metalness: 0.78 }),
    hubCap: new THREE.MeshStandardMaterial({ color: 0x404549, roughness: 0.4, metalness: 0.7 }),
    accent: new THREE.MeshStandardMaterial({
      color: accentHex,
      roughness: 0.5,
      emissive: new THREE.Color(accentHex).multiplyScalar(0.18),
    }),
    wood: new THREE.MeshStandardMaterial({ color: 0x6b4526, roughness: 0.84 }),
    tower: new THREE.MeshStandardMaterial({ color: theme.tower, roughness: 0.96 }),
    towerTop: new THREE.MeshStandardMaterial({ color: theme.towerCap, roughness: 0.92 }),
  };
}

export function disposeMaterials(materials: Materials): void {
  for (const m of Object.values(materials)) m.dispose();
}
