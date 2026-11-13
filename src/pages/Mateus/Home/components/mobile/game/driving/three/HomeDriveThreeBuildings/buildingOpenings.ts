// src/pages/Mateus/Home/components/mobile/game/driving/three/HomeDriveThreeBuildings/buildingOpenings.ts
// Portas, janelas, ar-condicionado, grade e acabamento.

import type {
  HomeDriveBuilding,
  HomeDriveBuildingFacadeProfile,
} from "../../domain/homeDrive.building.types";

import { clamp } from "./buildingShared";
import type { FacadeDetail, FacadeDetailKind } from "./buildingShared";
import {
  createFacadeDetail,
  getFrontLocalZ,
  getStableFacadeSeed,
} from "./buildingFacadeStyle";
import {
  getEntranceDoorKind,
  pushEntranceDividerDetails,
  pushEntranceFrameDetails,
  pushEntranceGlassHighlights,
  pushEntranceHandleDetails,
} from "./buildingEntranceFrame";
import {
  pushEntranceCanopy,
  pushEntranceDamage,
  pushEntranceIntercom,
  pushEntrancePillars,
  pushEntranceSign,
  pushGarageMarkings,
} from "./buildingEntranceExtras";

export function pushDoorDetail(
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

  pushEntrancePillars(details, building, idPrefix, localX, baseY, width, height);

  if (entrance?.hasFrame ?? true) {
    pushEntranceFrameDetails(
      details,
      building,
      idPrefix,
      localX,
      baseY,
      width,
      height,
    );
  }

  details.push(
    createFacadeDetail(
      building,
      `${idPrefix}::main`,
      getEntranceDoorKind(building),
      "plane",
      localX,
      baseY + height * 0.5,
      getFrontLocalZ(building),
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

export function pushWindowDetail(
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

export function shouldWindowHaveAirConditioner(
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

export function shouldWindowHaveGrille(
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

export function pushFacadeTrim(
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
