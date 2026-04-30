// src/pages/Mateus/Home/components/mobile/game/driving/three/HomeDriveThreeBuildings.tsx

import React, { memo, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import {
  BoxGeometry,
  BufferGeometry,
  InstancedMesh,
  Object3D,
  PlaneGeometry,
  type Material,
} from "three";

import { getHomeDriveBuildings } from "../domain/homeDrive.buildings";
import type {
  HomeDriveBuilding,
  HomeDriveBuildingFacadeProfile,
  HomeDriveBuildingFacadeStyle,
  HomeDriveBuildingMaterialKey,
  HomeDriveBuildingRoofStyle,
} from "../domain/homeDrive.building.types";
import { getHomeDriveStableStringSeed } from "../domain/homeDrive.commerceNames";
import { HOME_DRIVE_THREE_MATERIALS } from "./homeDriveThree.materials";
import {
  createHomeDriveThreeBuildingFacadeTransform,
  getHomeDriveThreeBuildingStreetFacadeLocalZ,
} from "./homeDriveThree.buildingFacadeFrame";

const MAX_BUILDINGS = 16384;
const MAX_FACADE_DETAILS = 327680;
const FACADE_SURFACE_OFFSET_METERS = 0.085;

type BuildingBatch = Readonly<{
  materialKey: HomeDriveBuildingMaterialKey;
  buildings: readonly HomeDriveBuilding[];
}>;

type BuildingInstance = Readonly<{
  id: string;
  position: readonly [number, number, number];
  rotationYRad: number;
  rotationZRad?: number;
  scale: readonly [number, number, number];
}>;

type FacadeDetailKind =
  | "window"
  | "window-dark"
  | "window-glass"
  | "window-glass-bright"
  | "window-wood"
  | "window-open"
  | "window-frame"
  | "window-grille"
  | "door"
  | "door-wood"
  | "door-metal"
  | "door-glass"
  | "door-painted"
  | "door-dark"
  | "door-rolling-steel"
  | "door-broken"
  | "door-frame"
  | "door-handle"
  | "door-crack"
  | "door-board"
  | "door-divider"
  | "portaria-glass"
  | "portaria-pillar"
  | "intercom"
  | "canopy-slab"
  | "canopy-metal"
  | "canopy-glass"
  | "canopy-fabric"
  | "no-parking-sign"
  | "no-parking-bar"
  | "private-sign"
  | "service-sign"
  | "garage-marking"
  | "shop-glass"
  | "awning"
  | "awning-striped"
  | "awning-fabric"
  | "awning-metal"
  | "air-conditioner"
  | "air-conditioner-shadow"
  | "sign-board"
  | "metal-frame"
  | "trim"
  | "shadow-trim"
  | "roof";

type FacadeDetailGeometryKind = "plane" | "box";

type FacadeDetail = Readonly<{
  id: string;
  kind: FacadeDetailKind;
  geometryKind: FacadeDetailGeometryKind;
  position: readonly [number, number, number];
  rotationYRad: number;
  rotationZRad?: number;
  scale: readonly [number, number, number];
}>;

type FacadeDetailBatch = Readonly<{
  id: string;
  kind: FacadeDetailKind;
  geometryKind: FacadeDetailGeometryKind;
  details: readonly FacadeDetail[];
  material: Material;
  renderOrder: number;
}>;

const BUILDING_BODY_MATERIALS: Readonly<Record<HomeDriveBuildingMaterialKey, Material>> =
  Object.freeze({
    "house-warm": HOME_DRIVE_THREE_MATERIALS.houseWarm,
    "house-cool": HOME_DRIVE_THREE_MATERIALS.houseCool,
    "commerce-warm": HOME_DRIVE_THREE_MATERIALS.commerceWarm,
    "commerce-night": HOME_DRIVE_THREE_MATERIALS.commerceNight,
    "apartment-light": HOME_DRIVE_THREE_MATERIALS.apartmentLight,
    "apartment-concrete": HOME_DRIVE_THREE_MATERIALS.apartmentConcrete,
    "office-blue": HOME_DRIVE_THREE_MATERIALS.officeBlue,
    "warehouse-metal": HOME_DRIVE_THREE_MATERIALS.warehouseMetal,
  });

const FACADE_DETAIL_MATERIALS: Readonly<Record<FacadeDetailKind, Material>> =
  Object.freeze({
    window: HOME_DRIVE_THREE_MATERIALS.buildingWindow,
    "window-dark": HOME_DRIVE_THREE_MATERIALS.buildingWindowDark,
    "window-glass": HOME_DRIVE_THREE_MATERIALS.buildingWindowGlass,
    "window-glass-bright": HOME_DRIVE_THREE_MATERIALS.buildingWindowGlassBright,
    "window-wood": HOME_DRIVE_THREE_MATERIALS.buildingWindowWood,
    "window-open": HOME_DRIVE_THREE_MATERIALS.buildingWindowOpen,
    "window-frame": HOME_DRIVE_THREE_MATERIALS.buildingWindowFrame,
    "window-grille": HOME_DRIVE_THREE_MATERIALS.buildingWindowGrille,
    door: HOME_DRIVE_THREE_MATERIALS.buildingDoor,
    "door-wood": HOME_DRIVE_THREE_MATERIALS.buildingDoorWood,
    "door-metal": HOME_DRIVE_THREE_MATERIALS.buildingDoorMetal,
    "door-glass": HOME_DRIVE_THREE_MATERIALS.buildingDoorGlass,
    "door-painted": HOME_DRIVE_THREE_MATERIALS.buildingDoorPainted,
    "door-dark": HOME_DRIVE_THREE_MATERIALS.buildingDoorDark,
    "door-rolling-steel": HOME_DRIVE_THREE_MATERIALS.buildingDoorRollingSteel,
    "door-broken": HOME_DRIVE_THREE_MATERIALS.buildingDoorBroken,
    "door-frame": HOME_DRIVE_THREE_MATERIALS.buildingDoorFrame,
    "door-handle": HOME_DRIVE_THREE_MATERIALS.buildingDoorHandle,
    "door-crack": HOME_DRIVE_THREE_MATERIALS.buildingDoorCrack,
    "door-board": HOME_DRIVE_THREE_MATERIALS.buildingDoorBoard,
    "door-divider": HOME_DRIVE_THREE_MATERIALS.buildingMetalFrame,
    "portaria-glass": HOME_DRIVE_THREE_MATERIALS.buildingPortariaGlass,
    "portaria-pillar": HOME_DRIVE_THREE_MATERIALS.buildingEntrancePillar,
    intercom: HOME_DRIVE_THREE_MATERIALS.buildingIntercom,
    "canopy-slab": HOME_DRIVE_THREE_MATERIALS.buildingCanopySlab,
    "canopy-metal": HOME_DRIVE_THREE_MATERIALS.buildingCanopyMetal,
    "canopy-glass": HOME_DRIVE_THREE_MATERIALS.buildingCanopyGlass,
    "canopy-fabric": HOME_DRIVE_THREE_MATERIALS.buildingCanopyFabric,
    "no-parking-sign": HOME_DRIVE_THREE_MATERIALS.buildingNoParkingSign,
    "no-parking-bar": HOME_DRIVE_THREE_MATERIALS.buildingNoParkingBar,
    "private-sign": HOME_DRIVE_THREE_MATERIALS.buildingPrivateSign,
    "service-sign": HOME_DRIVE_THREE_MATERIALS.buildingServiceSign,
    "garage-marking": HOME_DRIVE_THREE_MATERIALS.buildingGarageMarking,
    "shop-glass": HOME_DRIVE_THREE_MATERIALS.buildingShopGlass,
    awning: HOME_DRIVE_THREE_MATERIALS.buildingAwning,
    "awning-striped": HOME_DRIVE_THREE_MATERIALS.buildingAwningStriped,
    "awning-fabric": HOME_DRIVE_THREE_MATERIALS.buildingAwningFabric,
    "awning-metal": HOME_DRIVE_THREE_MATERIALS.buildingAwningMetal,
    "air-conditioner": HOME_DRIVE_THREE_MATERIALS.buildingAirConditioner,
    "air-conditioner-shadow": HOME_DRIVE_THREE_MATERIALS.buildingAirConditionerShadow,
    "sign-board": HOME_DRIVE_THREE_MATERIALS.buildingSignBoard,
    "metal-frame": HOME_DRIVE_THREE_MATERIALS.buildingMetalFrame,
    trim: HOME_DRIVE_THREE_MATERIALS.buildingTrim,
    "shadow-trim": HOME_DRIVE_THREE_MATERIALS.buildingShadowTrim,
    roof: HOME_DRIVE_THREE_MATERIALS.buildingRoof,
  });

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function groupBuildingsByMaterial(
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

function getDerivedFacadeProfile(
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
        windowColumns: Math.max(2, Math.min(5, Math.floor(building.widthMeters / 4.3))),
        windowRows: Math.max(1, Math.min(4, building.floors - 1)),
        hasDoor: true,
        hasShopfront: true,
        hasAwning: building.awningStyle !== "none",
      };

    case "office-glass":
      return {
        style,
        roofStyle,
        windowColumns: Math.max(3, Math.min(8, Math.floor(building.widthMeters / 3.9))),
        windowRows: Math.max(3, Math.min(12, building.floors)),
        hasDoor: true,
        hasShopfront: false,
        hasAwning: false,
      };

    case "warehouse-bay":
      return {
        style,
        roofStyle,
        windowColumns: Math.max(2, Math.min(5, Math.floor(building.widthMeters / 8.4))),
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
        windowColumns: Math.max(2, Math.min(6, Math.floor(building.widthMeters / 4.2))),
        windowRows: Math.max(2, Math.min(11, building.floors)),
        hasDoor: true,
        hasShopfront: false,
        hasAwning: false,
      };
  }
}

function getFrontLocalZ(building: HomeDriveBuilding): number {
  return getHomeDriveThreeBuildingStreetFacadeLocalZ(
    building,
    FACADE_SURFACE_OFFSET_METERS,
  );
}

function getStableFacadeSeed(
  building: HomeDriveBuilding,
  key: string,
  fallbackSalt: number,
): number {
  return getHomeDriveStableStringSeed(
    `${building.id}:${key}:${building.variant}:${building.facadeSeed ?? 0}`,
    fallbackSalt,
  );
}

function createFacadeDetail(
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

function getWindowKind(
  building: HomeDriveBuilding,
  row: number,
  column: number,
  preferred: "house" | "grid" | "shop" | "warehouse",
): FacadeDetailKind {
  const seed = getStableFacadeSeed(building, `window-${preferred}-${row}-${column}`, 151);
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

function getAwningKind(building: HomeDriveBuilding): FacadeDetailKind | null {
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

function pushRoofDetail(
  details: FacadeDetail[],
  building: HomeDriveBuilding,
  profile: HomeDriveBuildingFacadeProfile,
): void {
  const roofHeight =
    profile.roofStyle === "low-parapet"
      ? 0.55
      : profile.roofStyle === "slab"
        ? 0.36
        : 0.24;

  details.push({
    id: `${building.id}::roof`,
    kind: "roof",
    geometryKind: "box",
    position: [
      building.position.x,
      building.heightMeters + roofHeight / 2,
      building.position.z,
    ],
    rotationYRad: building.rotationYRad,
    scale: [
      building.widthMeters + 0.75,
      roofHeight,
      building.depthMeters + 0.75,
    ],
  });
}

function getEntranceDoorKind(building: HomeDriveBuilding): FacadeDetailKind {
  const entrance = building.entranceProfile;

  if (!entrance) {
    return "door";
  }

  if (entrance.damageLevel >= 2 || entrance.condition === "broken") {
    return "door-broken";
  }

  switch (entrance.material) {
    case "wood":
      return "door-wood";
    case "metal":
      return "door-metal";
    case "glass":
      return entrance.kind === "portaria" ? "portaria-glass" : "door-glass";
    case "painted":
      return "door-painted";
    case "dark":
      return "door-dark";
    case "rolling-steel":
      return "door-rolling-steel";
    default:
      return "door";
  }
}

function getEntranceCanopyKind(building: HomeDriveBuilding): FacadeDetailKind | null {
  switch (building.entranceProfile?.canopyKind) {
    case "flat-slab":
      return "canopy-slab";
    case "thin-metal":
      return "canopy-metal";
    case "glass":
      return "canopy-glass";
    case "fabric":
      return "canopy-fabric";
    case "none":
    default:
      return null;
  }
}

function getEntranceSignKind(building: HomeDriveBuilding): FacadeDetailKind | null {
  switch (building.entranceProfile?.signKind) {
    case "no-parking":
      return "no-parking-sign";
    case "private-property":
    case "reception":
    case "garage":
      return "private-sign";
    case "service":
      return "service-sign";
    case "none":
    default:
      return null;
  }
}

function pushEntranceFrameDetails(
  details: FacadeDetail[],
  building: HomeDriveBuilding,
  idPrefix: string,
  localX: number,
  baseY: number,
  width: number,
  height: number,
): void {
  const frontZ = getFrontLocalZ(building);
  const frameThickness = clamp(width * 0.045, 0.055, 0.12);

  details.push(
    createFacadeDetail(
      building,
      `${idPrefix}::frame-top`,
      "door-frame",
      "plane",
      localX,
      baseY + height + frameThickness * 0.5,
      frontZ,
      width + frameThickness * 2.4,
      frameThickness,
    ),
  );

  details.push(
    createFacadeDetail(
      building,
      `${idPrefix}::frame-left`,
      "door-frame",
      "plane",
      localX - width * 0.5 - frameThickness * 0.5,
      baseY + height * 0.5,
      frontZ,
      frameThickness,
      height + frameThickness * 1.7,
    ),
  );

  details.push(
    createFacadeDetail(
      building,
      `${idPrefix}::frame-right`,
      "door-frame",
      "plane",
      localX + width * 0.5 + frameThickness * 0.5,
      baseY + height * 0.5,
      frontZ,
      frameThickness,
      height + frameThickness * 1.7,
    ),
  );
}

function pushEntranceHandleDetails(
  details: FacadeDetail[],
  building: HomeDriveBuilding,
  idPrefix: string,
  localX: number,
  baseY: number,
  width: number,
  height: number,
): void {
  const frontZ = getFrontLocalZ(building);
  const entrance = building.entranceProfile;
  const handleY = baseY + clamp(height * 0.47, 0.92, 1.42);
  const handleWidth = clamp(width * 0.045, 0.055, 0.1);
  const handleHeight = clamp(height * 0.12, 0.18, 0.34);

  if (entrance?.hasCenterDivider) {
    const offset = clamp(width * 0.09, 0.12, 0.22);

    details.push(
      createFacadeDetail(
        building,
        `${idPrefix}::handle-left`,
        "door-handle",
        "plane",
        localX - offset,
        handleY,
        frontZ,
        handleWidth,
        handleHeight,
      ),
    );

    details.push(
      createFacadeDetail(
        building,
        `${idPrefix}::handle-right`,
        "door-handle",
        "plane",
        localX + offset,
        handleY,
        frontZ,
        handleWidth,
        handleHeight,
      ),
    );

    return;
  }

  details.push(
    createFacadeDetail(
      building,
      `${idPrefix}::handle`,
      "door-handle",
      "plane",
      localX + width * 0.32,
      handleY,
      frontZ,
      handleWidth,
      handleHeight,
    ),
  );
}

function pushEntranceDividerDetails(
  details: FacadeDetail[],
  building: HomeDriveBuilding,
  idPrefix: string,
  localX: number,
  baseY: number,
  width: number,
  height: number,
): void {
  const entrance = building.entranceProfile;

  if (!entrance?.hasCenterDivider) {
    return;
  }

  details.push(
    createFacadeDetail(
      building,
      `${idPrefix}::divider`,
      "door-divider",
      "plane",
      localX,
      baseY + height * 0.5,
      getFrontLocalZ(building),
      clamp(width * 0.035, 0.045, 0.12),
      height * 0.96,
    ),
  );
}

function pushEntranceGlassHighlights(
  details: FacadeDetail[],
  building: HomeDriveBuilding,
  idPrefix: string,
  localX: number,
  baseY: number,
  width: number,
  height: number,
): void {
  const entrance = building.entranceProfile;

  if (!entrance?.hasGlassHighlights) {
    return;
  }

  const frontZ = getFrontLocalZ(building);
  const highlightKind: FacadeDetailKind =
    entrance.kind === "portaria" ? "portaria-glass" : "door-glass";

  details.push(
    createFacadeDetail(
      building,
      `${idPrefix}::glass-highlight-left`,
      highlightKind,
      "plane",
      localX - width * 0.18,
      baseY + height * 0.62,
      frontZ,
      width * 0.18,
      height * 0.46,
    ),
  );

  if (entrance.hasCenterDivider || width > 1.9) {
    details.push(
      createFacadeDetail(
        building,
        `${idPrefix}::glass-highlight-right`,
        highlightKind,
        "plane",
        localX + width * 0.18,
        baseY + height * 0.62,
        frontZ,
        width * 0.18,
        height * 0.46,
      ),
    );
  }
}

function pushEntrancePillars(
  details: FacadeDetail[],
  building: HomeDriveBuilding,
  idPrefix: string,
  localX: number,
  baseY: number,
  width: number,
  height: number,
): void {
  const entrance = building.entranceProfile;

  if (!entrance?.hasSidePillars) {
    return;
  }

  const pillarWidth = clamp(width * 0.11, 0.16, 0.36);
  const pillarHeight = height + clamp(height * 0.14, 0.22, 0.58);
  const frontZ = getFrontLocalZ(building);

  details.push(
    createFacadeDetail(
      building,
      `${idPrefix}::pillar-left`,
      "portaria-pillar",
      "plane",
      localX - width * 0.5 - pillarWidth * 0.68,
      baseY + pillarHeight * 0.5,
      frontZ,
      pillarWidth,
      pillarHeight,
    ),
  );

  details.push(
    createFacadeDetail(
      building,
      `${idPrefix}::pillar-right`,
      "portaria-pillar",
      "plane",
      localX + width * 0.5 + pillarWidth * 0.68,
      baseY + pillarHeight * 0.5,
      frontZ,
      pillarWidth,
      pillarHeight,
    ),
  );
}

function pushEntranceCanopy(
  details: FacadeDetail[],
  building: HomeDriveBuilding,
  idPrefix: string,
  localX: number,
  baseY: number,
  width: number,
  height: number,
): void {
  const canopyKind = getEntranceCanopyKind(building);

  if (!canopyKind) {
    return;
  }

  details.push(
    createFacadeDetail(
      building,
      `${idPrefix}::canopy`,
      canopyKind,
      "plane",
      localX,
      baseY + height + clamp(height * 0.13, 0.24, 0.58),
      getFrontLocalZ(building),
      width * 1.38,
      clamp(height * 0.15, 0.28, 0.62),
    ),
  );
}

function pushEntranceSign(
  details: FacadeDetail[],
  building: HomeDriveBuilding,
  idPrefix: string,
  localX: number,
  baseY: number,
  width: number,
  height: number,
): void {
  const signKind = getEntranceSignKind(building);

  if (!signKind) {
    return;
  }

  const frontZ = getFrontLocalZ(building);
  const signWidth = signKind === "no-parking-sign" ? 0.62 : 0.86;
  const signHeight = signKind === "no-parking-sign" ? 0.62 : 0.34;
  const signX = clamp(
    localX + width * 0.5 + signWidth * 0.72,
    -building.widthMeters * 0.44,
    building.widthMeters * 0.44,
  );
  const signY = baseY + clamp(height * 0.66, 1.15, 2.3);

  details.push(
    createFacadeDetail(
      building,
      `${idPrefix}::sign`,
      signKind,
      "plane",
      signX,
      signY,
      frontZ,
      signWidth,
      signHeight,
    ),
  );

  if (signKind === "no-parking-sign") {
    details.push(
      createFacadeDetail(
        building,
        `${idPrefix}::sign-red-bar-a`,
        "no-parking-bar",
        "plane",
        signX,
        signY,
        frontZ,
        signWidth * 0.82,
        0.075,
        1,
        -0.72,
      ),
    );

    details.push(
      createFacadeDetail(
        building,
        `${idPrefix}::sign-red-bar-b`,
        "no-parking-bar",
        "plane",
        signX,
        signY,
        frontZ,
        signWidth * 0.82,
        0.075,
        1,
        0.72,
      ),
    );
  }
}

function pushEntranceIntercom(
  details: FacadeDetail[],
  building: HomeDriveBuilding,
  idPrefix: string,
  localX: number,
  baseY: number,
  width: number,
  height: number,
): void {
  const entrance = building.entranceProfile;

  if (!entrance?.hasIntercom) {
    return;
  }

  details.push(
    createFacadeDetail(
      building,
      `${idPrefix}::intercom`,
      "intercom",
      "plane",
      clamp(
        localX + width * 0.5 + 0.28,
        -building.widthMeters * 0.43,
        building.widthMeters * 0.43,
      ),
      baseY + clamp(height * 0.46, 1.02, 1.62),
      getFrontLocalZ(building),
      0.16,
      0.32,
    ),
  );
}

function pushEntranceDamage(
  details: FacadeDetail[],
  building: HomeDriveBuilding,
  idPrefix: string,
  localX: number,
  baseY: number,
  width: number,
  height: number,
): void {
  const entrance = building.entranceProfile;

  if (!entrance || entrance.damageLevel <= 0) {
    return;
  }

  const frontZ = getFrontLocalZ(building);
  const seed = entrance.detailSeed;
  const crackX = localX + (seed - 0.5) * width * 0.32;
  const crackY = baseY + height * (0.46 + seed * 0.2);

  details.push(
    createFacadeDetail(
      building,
      `${idPrefix}::crack-main`,
      "door-crack",
      "plane",
      crackX,
      crackY,
      frontZ,
      clamp(width * 0.04, 0.035, 0.08),
      height * 0.46,
      1,
      seed > 0.5 ? -0.32 : 0.32,
    ),
  );

  if (entrance.damageLevel >= 2) {
    details.push(
      createFacadeDetail(
        building,
        `${idPrefix}::broken-board-a`,
        "door-board",
        "plane",
        localX - width * 0.08,
        baseY + height * 0.54,
        frontZ,
        width * 0.78,
        clamp(height * 0.08, 0.13, 0.24),
        1,
        -0.48,
      ),
    );
  }

  if (entrance.damageLevel >= 3) {
    details.push(
      createFacadeDetail(
        building,
        `${idPrefix}::broken-board-b`,
        "door-board",
        "plane",
        localX + width * 0.12,
        baseY + height * 0.34,
        frontZ,
        width * 0.64,
        clamp(height * 0.075, 0.12, 0.22),
        1,
        0.38,
      ),
    );
  }
}

function pushGarageMarkings(
  details: FacadeDetail[],
  building: HomeDriveBuilding,
  idPrefix: string,
  localX: number,
  baseY: number,
  width: number,
  height: number,
): void {
  const entrance = building.entranceProfile;

  if (entrance?.kind !== "garage-door" && entrance?.material !== "rolling-steel") {
    return;
  }

  const frontZ = getFrontLocalZ(building);
  const stripeCount = 4;

  for (let stripe = 1; stripe <= stripeCount; stripe += 1) {
    details.push(
      createFacadeDetail(
        building,
        `${idPrefix}::garage-stripe-${stripe}`,
        "garage-marking",
        "plane",
        localX,
        baseY + (height / (stripeCount + 1)) * stripe,
        frontZ,
        width * 0.92,
        0.045,
      ),
    );
  }
}

function pushDoorDetail(
  details: FacadeDetail[],
  building: HomeDriveBuilding,
  fallbackLocalX: number,
  fallbackWidth: number,
  fallbackHeight: number,
): void {
  const entrance = building.entranceProfile;
  const localX = clamp(
    entrance?.localX ?? fallbackLocalX,
    -building.widthMeters * 0.43,
    building.widthMeters * 0.43,
  );
  const width = clamp(
    entrance?.widthMeters ?? fallbackWidth,
    0.75,
    Math.max(0.9, building.widthMeters * 0.48),
  );
  const height = clamp(
    entrance?.heightMeters ?? fallbackHeight,
    1.75,
    Math.max(2.1, building.heightMeters * 0.72),
  );
  const baseY = entrance?.baseYOffsetMeters ?? 0;
  const idPrefix = `${building.id}::entrance`;
  const frontZ = getFrontLocalZ(building);

  pushEntrancePillars(details, building, idPrefix, localX, baseY, width, height);

  if (entrance?.hasFrame ?? true) {
    pushEntranceFrameDetails(details, building, idPrefix, localX, baseY, width, height);
  }

  details.push(
    createFacadeDetail(
      building,
      `${idPrefix}::main`,
      getEntranceDoorKind(building),
      "plane",
      localX,
      baseY + height * 0.5,
      frontZ,
      width,
      height,
    ),
  );

  pushEntranceGlassHighlights(details, building, idPrefix, localX, baseY, width, height);
  pushEntranceDividerDetails(details, building, idPrefix, localX, baseY, width, height);
  pushGarageMarkings(details, building, idPrefix, localX, baseY, width, height);

  if (entrance?.hasHandle ?? true) {
    pushEntranceHandleDetails(details, building, idPrefix, localX, baseY, width, height);
  }

  pushEntranceIntercom(details, building, idPrefix, localX, baseY, width, height);
  pushEntranceSign(details, building, idPrefix, localX, baseY, width, height);
  pushEntranceCanopy(details, building, idPrefix, localX, baseY, width, height);
  pushEntranceDamage(details, building, idPrefix, localX, baseY, width, height);
}

function pushWindowDetail(
  details: FacadeDetail[],
  building: HomeDriveBuilding,
  id: string,
  kind: FacadeDetailKind,
  localX: number,
  localY: number,
  width: number,
  height: number,
  options: Readonly<{
    frame?: boolean;
    grille?: boolean;
    airConditioner?: boolean;
  }> = {},
): void {
  const frontZ = getFrontLocalZ(building);

  if (options.frame) {
    details.push(
      createFacadeDetail(
        building,
        `${id}::frame`,
        kind === "window-wood" ? "window-frame" : "metal-frame",
        "plane",
        localX,
        localY,
        frontZ,
        width + 0.22,
        height + 0.22,
      ),
    );
  }

  details.push(
    createFacadeDetail(
      building,
      id,
      kind,
      "plane",
      localX,
      localY,
      frontZ,
      width,
      height,
    ),
  );

  if (options.grille) {
    details.push(
      createFacadeDetail(
        building,
        `${id}::grille-horizontal`,
        "window-grille",
        "plane",
        localX,
        localY,
        frontZ,
        width * 0.94,
        Math.max(0.035, height * 0.05),
      ),
    );

    details.push(
      createFacadeDetail(
        building,
        `${id}::grille-vertical`,
        "window-grille",
        "plane",
        localX,
        localY,
        frontZ,
        Math.max(0.035, width * 0.045),
        height * 0.92,
      ),
    );
  }

  if (options.airConditioner) {
    const acWidth = clamp(width * 0.58, 0.55, 1.1);
    const acHeight = clamp(height * 0.28, 0.22, 0.38);

    details.push(
      createFacadeDetail(
        building,
        `${id}::ac-shadow`,
        "air-conditioner-shadow",
        "plane",
        localX + width * 0.16,
        localY - height * 0.68,
        frontZ,
        acWidth * 1.08,
        acHeight * 1.18,
      ),
    );

    details.push(
      createFacadeDetail(
        building,
        `${id}::ac-box`,
        "air-conditioner",
        "box",
        localX + width * 0.16,
        localY - height * 0.68,
        frontZ,
        acWidth,
        acHeight,
        0.28,
      ),
    );
  }
}

function shouldWindowHaveAirConditioner(
  building: HomeDriveBuilding,
  row: number,
  column: number,
): boolean {
  if (!building.hasAirConditioners) {
    return false;
  }

  if (row <= 0 && building.kind !== "house") {
    return false;
  }

  const seed = getStableFacadeSeed(building, `ac-${row}-${column}`, 163);

  switch (building.kind) {
    case "office":
      return seed > 0.66;
    case "apartment":
      return seed > 0.54;
    case "commerce":
      return seed > 0.72;
    case "house":
      return seed > 0.82;
    case "warehouse":
    default:
      return seed > 0.9;
  }
}

function shouldWindowHaveGrille(
  building: HomeDriveBuilding,
  row: number,
  column: number,
): boolean {
  if (building.windowStyle === "gridded") {
    return true;
  }

  const seed = getStableFacadeSeed(building, `grille-${row}-${column}`, 167);

  if (building.kind === "house") {
    return seed > 0.58;
  }

  if (building.kind === "commerce") {
    return seed > 0.78;
  }

  return seed > 0.9;
}

function pushFacadeTrim(
  details: FacadeDetail[],
  building: HomeDriveBuilding,
  profile: HomeDriveBuildingFacadeProfile,
): void {
  const rows = Math.max(1, profile.windowRows);
  const top = Math.max(3.2, building.heightMeters - 1.2);
  const bottom = profile.hasShopfront ? 4.25 : 2.6;
  const interval = (top - bottom) / Math.max(1, rows);

  for (let row = 0; row <= rows; row += 1) {
    const y = bottom + row * interval;

    if (y <= 1.8 || y >= building.heightMeters - 0.7) {
      continue;
    }

    details.push(
      createFacadeDetail(
        building,
        `${building.id}::trim-${row}`,
        row % 2 === 0 ? "trim" : "shadow-trim",
        "plane",
        0,
        y,
        getFrontLocalZ(building),
        building.widthMeters * 0.82,
        0.055,
      ),
    );
  }
}

function pushHouseFacade(
  details: FacadeDetail[],
  building: HomeDriveBuilding,
  profile: HomeDriveBuildingFacadeProfile,
): void {
  if (profile.hasDoor) {
    pushDoorDetail(details, building, -building.widthMeters * 0.24, 1.35, 2.35);
  }

  const windowY = building.floors > 1 ? 2.4 : 2.05;
  const columns = Math.max(2, profile.windowColumns);
  const usableWidth = building.widthMeters * 0.56;

  for (let column = 0; column < columns; column += 1) {
    const localX =
      -usableWidth / 2 + (column + 0.5) * (usableWidth / columns);

    if (Math.abs(localX + building.widthMeters * 0.24) < 1.2) {
      continue;
    }

    pushWindowDetail(
      details,
      building,
      `${building.id}::window-house-${column}`,
      getWindowKind(building, 0, column, "house"),
      localX,
      windowY,
      1.15,
      0.95,
      {
        frame: true,
        grille: shouldWindowHaveGrille(building, 0, column),
        airConditioner: shouldWindowHaveAirConditioner(building, 0, column),
      },
    );
  }

  if (building.floors > 1) {
    for (let column = 0; column < columns; column += 1) {
      const localX =
        -usableWidth / 2 + (column + 0.5) * (usableWidth / columns);

      pushWindowDetail(
        details,
        building,
        `${building.id}::window-house-upper-${column}`,
        getWindowKind(building, 1, column, "house"),
        localX,
        4.9,
        1.05,
        0.9,
        {
          frame: true,
          grille: shouldWindowHaveGrille(building, 1, column),
          airConditioner: shouldWindowHaveAirConditioner(building, 1, column),
        },
      );
    }
  }
}

function pushShopfrontSignBoard(details: FacadeDetail[], building: HomeDriveBuilding): void {
  if (!building.commerceName) {
    return;
  }

  details.push(
    createFacadeDetail(
      building,
      `${building.id}::instanced-sign-board`,
      "sign-board",
      "plane",
      0,
      3.72,
      getFrontLocalZ(building),
      clamp(building.widthMeters * 0.68, 4.6, 12.8),
      clamp(building.heightMeters * 0.09, 0.78, 1.35),
    ),
  );
}

function pushAwningDetail(
  details: FacadeDetail[],
  building: HomeDriveBuilding,
  localY: number,
  widthFactor = 0.78,
): void {
  const awningKind = getAwningKind(building);

  if (!awningKind) {
    return;
  }

  const frontZ = getFrontLocalZ(building);
  const width = building.widthMeters * widthFactor;

  details.push(
    createFacadeDetail(
      building,
      `${building.id}::awning-main`,
      awningKind,
      "plane",
      0,
      localY,
      frontZ,
      width,
      0.48,
    ),
  );

  if (building.awningStyle === "striped") {
    const stripeCount = Math.max(3, Math.min(7, Math.floor(width / 1.35)));

    for (let stripe = 0; stripe < stripeCount; stripe += 1) {
      if (stripe % 2 !== 0) {
        continue;
      }

      const localX = -width / 2 + (stripe + 0.5) * (width / stripeCount);

      details.push(
        createFacadeDetail(
          building,
          `${building.id}::awning-stripe-${stripe}`,
          "awning-fabric",
          "plane",
          localX,
          localY,
          frontZ,
          width / stripeCount,
          0.5,
        ),
      );
    }
  }
}

function pushShopfrontFacade(
  details: FacadeDetail[],
  building: HomeDriveBuilding,
  profile: HomeDriveBuildingFacadeProfile,
): void {
  const frontZ = getFrontLocalZ(building);

  details.push(
    createFacadeDetail(
      building,
      `${building.id}::shop-glass-left`,
      "shop-glass",
      "plane",
      -building.widthMeters * 0.22,
      1.85,
      frontZ,
      building.widthMeters * 0.32,
      2.5,
    ),
  );

  details.push(
    createFacadeDetail(
      building,
      `${building.id}::shop-glass-right`,
      "shop-glass",
      "plane",
      building.widthMeters * 0.22,
      1.85,
      frontZ,
      building.widthMeters * 0.32,
      2.5,
    ),
  );

  details.push(
    createFacadeDetail(
      building,
      `${building.id}::shop-metal-frame-left`,
      "metal-frame",
      "plane",
      -building.widthMeters * 0.22,
      1.85,
      frontZ,
      0.08,
      2.58,
    ),
  );

  details.push(
    createFacadeDetail(
      building,
      `${building.id}::shop-metal-frame-right`,
      "metal-frame",
      "plane",
      building.widthMeters * 0.22,
      1.85,
      frontZ,
      0.08,
      2.58,
    ),
  );

  if (profile.hasDoor) {
    pushDoorDetail(details, building, 0, 1.35, 2.45);
  }

  pushShopfrontSignBoard(details, building);
  pushAwningDetail(details, building, 3.22, 0.82);

  const rows = profile.windowRows;
  const columns = Math.max(2, profile.windowColumns);

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const usableWidth = building.widthMeters * 0.68;
      const localX =
        -usableWidth / 2 + (column + 0.5) * (usableWidth / columns);
      const localY = 4.45 + row * 2.25;

      if (localY >= building.heightMeters - 0.9) {
        continue;
      }

      pushWindowDetail(
        details,
        building,
        `${building.id}::shop-upper-${row}-${column}`,
        getWindowKind(building, row, column, "shop"),
        localX,
        localY,
        1.25,
        0.92,
        {
          frame: true,
          grille: shouldWindowHaveGrille(building, row, column),
          airConditioner: shouldWindowHaveAirConditioner(building, row, column),
        },
      );
    }
  }
}

function pushGridFacade(
  details: FacadeDetail[],
  building: HomeDriveBuilding,
  profile: HomeDriveBuildingFacadeProfile,
): void {
  const rows = Math.max(2, profile.windowRows);
  const columns = Math.max(2, profile.windowColumns);
  const usableWidth = building.widthMeters * 0.72;
  const bottom = profile.style === "office-glass" ? 2.8 : 3.0;
  const top = building.heightMeters - 1.45;
  const usableHeight = Math.max(1, top - bottom);

  if (profile.hasDoor) {
    pushDoorDetail(details, building, 0, 1.55, 2.55);
  }

  if (building.commerceName && building.kind === "apartment") {
    pushShopfrontSignBoard(details, building);
  }

  for (let row = 0; row < rows; row += 1) {
    const localY = bottom + (row + 0.5) * (usableHeight / rows);

    for (let column = 0; column < columns; column += 1) {
      const localX =
        -usableWidth / 2 + (column + 0.5) * (usableWidth / columns);

      const kind = getWindowKind(building, row, column, "grid");
      const isDarkVariant =
        (row + column + building.variant) % (profile.style === "office-glass" ? 5 : 6) ===
        0;

      pushWindowDetail(
        details,
        building,
        `${building.id}::grid-window-${row}-${column}`,
        isDarkVariant && kind === "window" ? "window-dark" : kind,
        localX,
        localY,
        profile.style === "office-glass" ? 1.45 : 1.15,
        profile.style === "office-glass" ? 1.25 : 0.92,
        {
          frame: profile.style !== "office-glass" || column % 2 === 0,
          grille: shouldWindowHaveGrille(building, row, column),
          airConditioner: shouldWindowHaveAirConditioner(building, row, column),
        },
      );
    }
  }

  pushFacadeTrim(details, building, profile);
}

function pushWarehouseFacade(
  details: FacadeDetail[],
  building: HomeDriveBuilding,
  profile: HomeDriveBuildingFacadeProfile,
): void {
  const frontZ = getFrontLocalZ(building);

  if (profile.hasDoor) {
    pushDoorDetail(
      details,
      building,
      -building.widthMeters * 0.18,
      Math.min(5.4, building.widthMeters * 0.24),
      4.2,
    );
  }

  if (building.commerceName) {
    details.push(
      createFacadeDetail(
        building,
        `${building.id}::warehouse-sign-board`,
        "sign-board",
        "plane",
        building.widthMeters * 0.12,
        clamp(building.heightMeters * 0.58, 3.4, building.heightMeters - 1.1),
        frontZ,
        clamp(building.widthMeters * 0.44, 5.4, 13.5),
        clamp(building.heightMeters * 0.12, 1.2, 2.6),
      ),
    );
  }

  const columns = Math.max(2, profile.windowColumns);
  const usableWidth = building.widthMeters * 0.62;

  for (let column = 0; column < columns; column += 1) {
    const localX =
      -usableWidth / 2 + (column + 0.5) * (usableWidth / columns);

    pushWindowDetail(
      details,
      building,
      `${building.id}::warehouse-window-${column}`,
      getWindowKind(building, 0, column, "warehouse"),
      localX,
      building.heightMeters * 0.68,
      1.6,
      0.72,
      {
        frame: true,
        grille: true,
        airConditioner: shouldWindowHaveAirConditioner(building, 0, column),
      },
    );
  }

  details.push(
    createFacadeDetail(
      building,
      `${building.id}::warehouse-trim`,
      "shadow-trim",
      "plane",
      0,
      building.heightMeters * 0.42,
      frontZ,
      building.widthMeters * 0.76,
      0.08,
    ),
  );
}

function createBuildingFacadeDetails(
  building: HomeDriveBuilding,
): readonly FacadeDetail[] {
  const profile = getDerivedFacadeProfile(building);
  const details: FacadeDetail[] = [];

  pushRoofDetail(details, building, profile);

  switch (profile.style) {
    case "simple-house":
      pushHouseFacade(details, building, profile);
      break;
    case "shopfront":
      pushShopfrontFacade(details, building, profile);
      break;
    case "office-glass":
      pushGridFacade(details, building, profile);
      break;
    case "warehouse-bay":
      pushWarehouseFacade(details, building, profile);
      break;
    case "apartment-grid":
    default:
      pushGridFacade(details, building, profile);
      break;
  }

  return details;
}

function createBodyInstances(
  buildings: readonly HomeDriveBuilding[],
): readonly BuildingInstance[] {
  return buildings.map((building) => ({
    id: `${building.id}::body`,
    position: [
      building.position.x,
      building.heightMeters / 2,
      building.position.z,
    ],
    rotationYRad: building.rotationYRad,
    scale: [
      building.widthMeters,
      building.heightMeters,
      building.depthMeters,
    ],
  }));
}

function getFacadeDetailRenderOrder(kind: FacadeDetailKind): number {
  switch (kind) {
    case "roof":
      return 13;
    case "air-conditioner":
      return 22;
    case "sign-board":
    case "no-parking-sign":
    case "no-parking-bar":
    case "private-sign":
    case "service-sign":
      return 24;
    case "intercom":
    case "door-handle":
    case "door-crack":
    case "door-board":
    case "garage-marking":
      return 25;
    case "awning":
    case "awning-striped":
    case "awning-fabric":
    case "awning-metal":
      return 23;
    case "window-frame":
    case "window-grille":
    case "metal-frame":
    case "door-frame":
    case "door-divider":
    case "portaria-pillar":
      return 21;
    default:
      return 18;
  }
}

function createFacadeDetailBatches(
  buildings: readonly HomeDriveBuilding[],
): readonly FacadeDetailBatch[] {
  const details: FacadeDetail[] = [];

  for (const building of buildings) {
    if (details.length >= MAX_FACADE_DETAILS) {
      break;
    }

    for (const detail of createBuildingFacadeDetails(building)) {
      if (details.length >= MAX_FACADE_DETAILS) {
        break;
      }

      details.push(detail);
    }
  }

  const map = new Map<string, FacadeDetail[]>();

  details.forEach((detail) => {
    const key = `${detail.kind}::${detail.geometryKind}`;
    const current = map.get(key);

    if (current) {
      current.push(detail);
      return;
    }

    map.set(key, [detail]);
  });

  return Array.from(map.entries()).map(([id, batchDetails]) => {
    const [kind, geometryKind] = id.split("::") as [
      FacadeDetailKind,
      FacadeDetailGeometryKind,
    ];

    return {
      id,
      kind,
      geometryKind,
      details: batchDetails,
      material: FACADE_DETAIL_MATERIALS[kind],
      renderOrder: getFacadeDetailRenderOrder(kind),
    };
  });
}

function HomeDriveThreeBodyBatch({
  batch,
  geometry,
}: Readonly<{
  batch: BuildingBatch;
  geometry: BoxGeometry;
}>) {
  const meshRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);

  const instances = useMemo(() => {
    return createBodyInstances(batch.buildings);
  }, [batch.buildings]);

  useLayoutEffect(() => {
    const mesh = meshRef.current;

    if (!mesh) {
      return;
    }

    instances.forEach((instance, index) => {
      dummy.position.set(...instance.position);
      dummy.rotation.set(0, instance.rotationYRad, 0);
      dummy.scale.set(...instance.scale);
      dummy.updateMatrix();

      mesh.setMatrixAt(index, dummy.matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [dummy, instances]);

  if (instances.length <= 0) {
    return null;
  }

  return (
    <instancedMesh
      ref={meshRef}
      args={[
        geometry,
        BUILDING_BODY_MATERIALS[batch.materialKey],
        instances.length,
      ]}
      frustumCulled
      renderOrder={12}
    />
  );
}

function HomeDriveThreeFacadeDetailBatch({
  batch,
  geometry,
}: Readonly<{
  batch: FacadeDetailBatch;
  geometry: BufferGeometry;
}>) {
  const meshRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);

  useLayoutEffect(() => {
    const mesh = meshRef.current;

    if (!mesh) {
      return;
    }

    batch.details.forEach((detail, index) => {
      dummy.position.set(...detail.position);
      dummy.rotation.set(0, detail.rotationYRad, detail.rotationZRad ?? 0);
      dummy.scale.set(...detail.scale);
      dummy.updateMatrix();

      mesh.setMatrixAt(index, dummy.matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [batch.details, dummy]);

  if (batch.details.length <= 0) {
    return null;
  }

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, batch.material, batch.details.length]}
      frustumCulled
      renderOrder={batch.renderOrder}
    />
  );
}

function HomeDriveThreeBuildings() {
  const buildings = useMemo(() => {
    return getHomeDriveBuildings({
      maxBuildings: MAX_BUILDINGS,
    });
  }, []);

  const bodyBatches = useMemo(() => {
    return groupBuildingsByMaterial(buildings);
  }, [buildings]);

  const facadeBatches = useMemo(() => {
    return createFacadeDetailBatches(buildings);
  }, [buildings]);

  const boxGeometry = useMemo(() => new BoxGeometry(1, 1, 1), []);
  const planeGeometry = useMemo(() => new PlaneGeometry(1, 1), []);

  useEffect(() => {
    return () => {
      boxGeometry.dispose();
      planeGeometry.dispose();
    };
  }, [boxGeometry, planeGeometry]);

  return (
    <group>
      {bodyBatches.map((batch) => (
        <HomeDriveThreeBodyBatch
          key={batch.materialKey}
          batch={batch}
          geometry={boxGeometry}
        />
      ))}

      {facadeBatches.map((batch) => (
        <HomeDriveThreeFacadeDetailBatch
          key={batch.id}
          batch={batch}
          geometry={batch.geometryKind === "box" ? boxGeometry : planeGeometry}
        />
      ))}
    </group>
  );
}

export default memo(HomeDriveThreeBuildings);
