// src/pages/Mateus/Home/components/mobile/game/driving/three/HomeDriveThreeBuildings/buildingEntranceExtras.ts
// Pilares, marquise, placa, interfone, desgaste e garagem.

import type { HomeDriveBuilding } from "../../domain/homeDrive.building.types";

import { clamp } from "./buildingShared";
import type { FacadeDetail } from "./buildingShared";
import { createFacadeDetail, getFrontLocalZ } from "./buildingFacadeStyle";
import {
  getEntranceCanopyKind,
  getEntranceSignKind,
} from "./buildingEntranceFrame";

export function pushEntrancePillars(
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

export function pushEntranceCanopy(
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

export function pushEntranceSign(
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

export function pushEntranceIntercom(
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

export function pushEntranceDamage(
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

export function pushGarageMarkings(
  details: FacadeDetail[],
  building: HomeDriveBuilding,
  idPrefix: string,
  localX: number,
  baseY: number,
  width: number,
  height: number,
): void {
  const entrance = building.entranceProfile;

  if (
    entrance?.kind !== "garage-door" &&
    entrance?.material !== "rolling-steel"
  ) {
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
