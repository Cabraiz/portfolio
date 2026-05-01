// src/pages/Mateus/Home/components/mobile/game/driving/three/buildingCollisions/homeDriveThree.buildingRubbleMaterials.ts

import { MeshStandardMaterial, type Material } from "three";

export type HomeDriveThreeBuildingRubbleMaterialSet = Readonly<{
  concreteBoulder: Material;
  concreteRock: Material;
  smallStone: Material;
  plasterShard: Material;
  brokenSlab: Material;
  dustMound: Material;
  rebarPiece: Material;
}>;

function createRubbleMaterial(params: Readonly<{
  color: string;
  roughness?: number;
  metalness?: number;
  opacity?: number;
}>): MeshStandardMaterial {
  const opacity = params.opacity ?? 1;

  return new MeshStandardMaterial({
    color: params.color,
    roughness: params.roughness ?? 0.94,
    metalness: params.metalness ?? 0.02,
    transparent: opacity < 1,
    opacity,
    depthWrite: opacity >= 1,
  });
}

export function createHomeDriveThreeBuildingRubbleMaterials(): HomeDriveThreeBuildingRubbleMaterialSet {
  return {
    concreteBoulder: createRubbleMaterial({
      color: "#7f7b70",
      roughness: 0.97,
    }),
    concreteRock: createRubbleMaterial({
      color: "#918b7e",
      roughness: 0.96,
    }),
    smallStone: createRubbleMaterial({
      color: "#a29b8e",
      roughness: 0.98,
    }),
    plasterShard: createRubbleMaterial({
      color: "#c3b7a0",
      roughness: 0.92,
    }),
    brokenSlab: createRubbleMaterial({
      color: "#69655d",
      roughness: 0.98,
    }),
    dustMound: createRubbleMaterial({
      color: "#8f8778",
      roughness: 1,
      opacity: 0.68,
    }),
    rebarPiece: createRubbleMaterial({
      color: "#342b25",
      roughness: 0.74,
      metalness: 0.42,
    }),
  };
}

export function disposeHomeDriveThreeBuildingRubbleMaterials(
  materials: HomeDriveThreeBuildingRubbleMaterialSet,
): void {
  materials.concreteBoulder.dispose();
  materials.concreteRock.dispose();
  materials.smallStone.dispose();
  materials.plasterShard.dispose();
  materials.brokenSlab.dispose();
  materials.dustMound.dispose();
  materials.rebarPiece.dispose();
}
