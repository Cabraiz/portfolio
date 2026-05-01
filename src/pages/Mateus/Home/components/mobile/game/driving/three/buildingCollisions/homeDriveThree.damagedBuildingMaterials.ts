// src/pages/Mateus/Home/components/mobile/game/driving/three/buildingCollisions/homeDriveThree.damagedBuildingMaterials.ts

import {
  MeshStandardMaterial,
  type Material,
} from "three";

import type {
  HomeDriveBuilding,
  HomeDriveBuildingMaterialKey,
} from "../../domain/homeDrive.building.types";
import type {
  HomeDriveThreeDamagedBuildingBoxPart,
  HomeDriveThreeDamagedBuildingMaterialSlot,
} from "./homeDriveThree.damagedBuildingGeometry";

export type HomeDriveThreeDamagedBuildingMaterialSet = Readonly<{
  bodyByKey: Readonly<Record<HomeDriveBuildingMaterialKey, MeshStandardMaterial>>;
  fallbackBody: MeshStandardMaterial;
  interior: MeshStandardMaterial;
  shadow: MeshStandardMaterial;
  fracture: MeshStandardMaterial;
  rim: MeshStandardMaterial;
}>;

function createBodyMaterial(color: string, roughness = 0.86): MeshStandardMaterial {
  return new MeshStandardMaterial({
    color,
    roughness,
    metalness: 0.03,
  });
}

export function createHomeDriveThreeDamagedBuildingMaterials(): HomeDriveThreeDamagedBuildingMaterialSet {
  return {
    bodyByKey: {
      "house-warm": createBodyMaterial("#bf9a71"),
      "house-cool": createBodyMaterial("#9eb3ba"),
      "commerce-warm": createBodyMaterial("#c49b68"),
      "commerce-night": createBodyMaterial("#52606f"),
      "apartment-light": createBodyMaterial("#b8b7a5"),
      "apartment-concrete": createBodyMaterial("#8f9189"),
      "office-blue": createBodyMaterial("#6e8798", 0.7),
      "warehouse-metal": createBodyMaterial("#747978", 0.62),
    },
    fallbackBody: createBodyMaterial("#9c988d"),
    interior: new MeshStandardMaterial({
      color: "#38322b",
      roughness: 0.95,
      metalness: 0.02,
    }),
    shadow: new MeshStandardMaterial({
      color: "#100d0c",
      roughness: 1,
      metalness: 0,
    }),
    fracture: new MeshStandardMaterial({
      color: "#61584d",
      roughness: 0.98,
      metalness: 0.02,
    }),
    rim: new MeshStandardMaterial({
      color: "#766d60",
      roughness: 0.96,
      metalness: 0.025,
    }),
  };
}

export function getHomeDriveThreeDamagedBuildingMaterial(params: Readonly<{
  building: HomeDriveBuilding;
  part: HomeDriveThreeDamagedBuildingBoxPart;
  materials: HomeDriveThreeDamagedBuildingMaterialSet;
}>): Material {
  switch (params.part.materialSlot satisfies HomeDriveThreeDamagedBuildingMaterialSlot) {
    case "interior":
      return params.materials.interior;

    case "shadow":
      return params.materials.shadow;

    case "fracture":
      return params.materials.fracture;

    case "rim":
      return params.materials.rim;

    case "body":
    default:
      return params.materials.bodyByKey[params.building.materialKey] ?? params.materials.fallbackBody;
  }
}

export function disposeHomeDriveThreeDamagedBuildingMaterials(
  materials: HomeDriveThreeDamagedBuildingMaterialSet,
): void {
  Object.values(materials.bodyByKey).forEach((material) => {
    material.dispose();
  });

  materials.fallbackBody.dispose();
  materials.interior.dispose();
  materials.shadow.dispose();
  materials.fracture.dispose();
  materials.rim.dispose();
}
