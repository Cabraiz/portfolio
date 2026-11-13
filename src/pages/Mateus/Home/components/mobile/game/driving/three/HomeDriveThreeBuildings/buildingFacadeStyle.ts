// src/pages/Mateus/Home/components/mobile/game/driving/three/HomeDriveThreeBuildings/buildingFacadeStyle.ts
// Estilo, perfil e tipos de detalhe da fachada.

import type {
  HomeDriveBuilding,
  HomeDriveBuildingFacadeProfile,
  HomeDriveBuildingFacadeStyle,
  HomeDriveBuildingMaterialKey,
  HomeDriveBuildingRoofStyle,
} from "../../domain/homeDrive.building.types";
import {
  getHomeDriveStableStringSeed,
} from "../../domain/homeDrive.commerceNames";
import {
  createHomeDriveThreeBuildingFacadeTransform,
  getHomeDriveThreeBuildingStreetFacadeLocalZ,
} from "../homeDriveThree.buildingFacadeFrame";

import { FACADE_SURFACE_OFFSET_METERS } from "./buildingShared";
import type {
  BuildingBatch,
  FacadeDetail,
  FacadeDetailGeometryKind,
  FacadeDetailKind,
} from "./buildingShared";

export function groupBuildingsByMaterial(
  buildings: readonly HomeDriveBuilding[],
): readonly BuildingBatch[] {
  const map = new Map<HomeDriveBuildingMaterialKey, HomeDriveBuilding[]>();

  buildings.forEach((building) => {
    const current = map.get(building.materialKey);

    if (current) {
      current.push(building);
      return;
    }

    map.set(building.materialKey, [building]);
  });

  return Array.from(map.entries()).map(([materialKey, batchBuildings]) => ({
    materialKey,
    buildings: batchBuildings,
  }));
}

function getBuildingFacadeStyle(
  building: HomeDriveBuilding,
): HomeDriveBuildingFacadeStyle {
  if (building.facadeProfile?.style) {
    return building.facadeProfile.style;
  }

  switch (building.kind) {
    case "house":
      return "simple-house";
    case "commerce":
      return "shopfront";
    case "office":
      return "office-glass";
    case "warehouse":
      return "warehouse-bay";
    case "apartment":
    default:
      return "apartment-grid";
  }
}

function getBuildingRoofStyle(
  building: HomeDriveBuilding,
): HomeDriveBuildingRoofStyle {
  if (building.facadeProfile?.roofStyle) {
    return building.facadeProfile.roofStyle;
  }

  if (building.kind === "house") {
    return "slab";
  }

  if (building.kind === "warehouse") {
    return "flat";
  }

  return "low-parapet";
}

export function getDerivedFacadeProfile(
  building: HomeDriveBuilding,
): HomeDriveBuildingFacadeProfile {
  if (building.facadeProfile) {
    return building.facadeProfile;
  }

  const style = getBuildingFacadeStyle(building);
  const roofStyle = getBuildingRoofStyle(building);

  switch (style) {
    case "simple-house":
      return {
        style,
        roofStyle,
        windowColumns: building.variant % 2 === 0 ? 2 : 3,
        windowRows: Math.max(1, building.floors),
        hasDoor: true,
        hasShopfront: false,
        hasAwning: false,
      };

    case "shopfront":
      return {
        style,
        roofStyle,
        windowColumns: Math.max(
          2,
          Math.min(5, Math.floor(building.widthMeters / 4.3)),
        ),
        windowRows: Math.max(1, Math.min(4, building.floors - 1)),
        hasDoor: true,
        hasShopfront: true,
        hasAwning: building.awningStyle !== "none",
      };

    case "office-glass":
      return {
        style,
        roofStyle,
        windowColumns: Math.max(
          3,
          Math.min(8, Math.floor(building.widthMeters / 3.9)),
        ),
        windowRows: Math.max(3, Math.min(12, building.floors)),
        hasDoor: true,
        hasShopfront: false,
        hasAwning: false,
      };

    case "warehouse-bay":
      return {
        style,
        roofStyle,
        windowColumns: Math.max(
          2,
          Math.min(5, Math.floor(building.widthMeters / 8.4)),
        ),
        windowRows: 1,
        hasDoor: true,
        hasShopfront: false,
        hasAwning: false,
      };

    case "apartment-grid":
    default:
      return {
        style,
        roofStyle,
        windowColumns: Math.max(
          2,
          Math.min(6, Math.floor(building.widthMeters / 4.2)),
        ),
        windowRows: Math.max(2, Math.min(11, building.floors)),
        hasDoor: true,
        hasShopfront: false,
        hasAwning: false,
      };
  }
}

export function getFrontLocalZ(building: HomeDriveBuilding): number {
  return getHomeDriveThreeBuildingStreetFacadeLocalZ(
    building,
    FACADE_SURFACE_OFFSET_METERS,
  );
}

export function getStableFacadeSeed(
  building: HomeDriveBuilding,
  key: string,
  fallbackSalt: number,
): number {
  return getHomeDriveStableStringSeed(
    `${building.id}:${key}:${building.variant}:${building.facadeSeed ?? 0}`,
    fallbackSalt,
  );
}

export function createFacadeDetail(
  building: HomeDriveBuilding,
  id: string,
  kind: FacadeDetailKind,
  geometryKind: FacadeDetailGeometryKind,
  localX: number,
  localY: number,
  localZ: number,
  width: number,
  height: number,
  depth = 1,
  rotationZRad = 0,
): FacadeDetail {
  const transform = createHomeDriveThreeBuildingFacadeTransform(building, {
    localX,
    localY,
    localZ,
    width,
    height,
    depth,
    geometryKind,
    surfaceOffsetMeters: FACADE_SURFACE_OFFSET_METERS,
  });

  return {
    id,
    kind,
    geometryKind,
    position: transform.position,
    rotationYRad: transform.rotationYRad,
    rotationZRad,
    scale: transform.scale,
  };
}

export function getWindowKind(
  building: HomeDriveBuilding,
  row: number,
  column: number,
  preferred: "house" | "grid" | "shop" | "warehouse",
): FacadeDetailKind {
  const seed = getStableFacadeSeed(
    building,
    `window-${preferred}-${row}-${column}`,
    151,
  );
  const style = building.windowStyle ?? "mixed";

  if (style === "glass") {
    return seed > 0.28 ? "window-glass" : "window-glass-bright";
  }

  if (style === "wood") {
    return seed > 0.22 ? "window-wood" : "window";
  }

  if (style === "open") {
    return seed > 0.48 ? "window-open" : "window-wood";
  }

  if (style === "gridded") {
    return seed > 0.34 ? "window-dark" : "window-glass";
  }

  if (style === "dark") {
    return seed > 0.18 ? "window-dark" : "window";
  }

  if (preferred === "warehouse") {
    return seed > 0.52 ? "window-dark" : "window-glass";
  }

  if (preferred === "shop") {
    if (seed > 0.72) return "window-wood";
    if (seed > 0.42) return "window-glass";
    return "window";
  }

  if (seed > 0.78) return "window-open";
  if (seed > 0.58) return "window-wood";
  if (seed > 0.32) return "window-glass";
  if (seed > 0.16) return "window-dark";

  return "window";
}

export function getAwningKind(building: HomeDriveBuilding): FacadeDetailKind | null {
  switch (building.awningStyle) {
    case "striped":
      return "awning-striped";
    case "fabric":
      return "awning-fabric";
    case "metal":
      return "awning-metal";
    case "flat":
      return "awning";
    case "none":
    default:
      return null;
  }
}
