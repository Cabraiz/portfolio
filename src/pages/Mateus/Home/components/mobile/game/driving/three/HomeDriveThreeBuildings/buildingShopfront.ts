// src/pages/Mateus/Home/components/mobile/game/driving/three/HomeDriveThreeBuildings/buildingShopfront.ts
// Fachadas de casa e de loja (placa e toldo).

import type {
  HomeDriveBuilding,
  HomeDriveBuildingFacadeProfile,
} from "../../domain/homeDrive.building.types";

import { clamp } from "./buildingShared";
import type { FacadeDetail } from "./buildingShared";
import {
  createFacadeDetail,
  getAwningKind,
  getFrontLocalZ,
  getWindowKind,
} from "./buildingFacadeStyle";
import {
  pushDoorDetail,
  pushWindowDetail,
  shouldWindowHaveAirConditioner,
  shouldWindowHaveGrille,
} from "./buildingOpenings";

export function pushHouseFacade(
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

export function pushShopfrontSignBoard(
  details: FacadeDetail[],
  building: HomeDriveBuilding,
): void {
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

export function pushShopfrontFacade(
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
