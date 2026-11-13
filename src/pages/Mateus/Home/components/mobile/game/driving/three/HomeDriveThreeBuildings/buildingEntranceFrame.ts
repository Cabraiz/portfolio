// src/pages/Mateus/Home/components/mobile/game/driving/three/HomeDriveThreeBuildings/buildingEntranceFrame.ts
// Teto e moldura, maçaneta, divisória e vidro da entrada.

import type {
  HomeDriveBuilding,
  HomeDriveBuildingFacadeProfile,
} from "../../domain/homeDrive.building.types";

import { clamp } from "./buildingShared";
import type { FacadeDetail, FacadeDetailKind } from "./buildingShared";
import { createFacadeDetail, getFrontLocalZ } from "./buildingFacadeStyle";

export function pushRoofDetail(
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

export function getEntranceDoorKind(building: HomeDriveBuilding): FacadeDetailKind {
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

export function getEntranceCanopyKind(
  building: HomeDriveBuilding,
): FacadeDetailKind | null {
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

export function getEntranceSignKind(
  building: HomeDriveBuilding,
): FacadeDetailKind | null {
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

export function pushEntranceFrameDetails(
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

export function pushEntranceHandleDetails(
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

export function pushEntranceDividerDetails(
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

export function pushEntranceGlassHighlights(
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
