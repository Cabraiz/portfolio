// src/pages/Mateus/Home/components/mobile/game/driving/three/HomeDriveThreeBuildings/buildingFacadeDetails.ts
// Fachadas de grade e galpão, instâncias e lotes de detalhe.

import type {
  HomeDriveBuilding,
  HomeDriveBuildingFacadeProfile,
} from "../../domain/homeDrive.building.types";

import {
  FACADE_DETAIL_MATERIALS,
  MAX_FACADE_DETAILS,
  clamp,
} from "./buildingShared";
import type {
  BuildingInstance,
  FacadeDetail,
  FacadeDetailBatch,
  FacadeDetailGeometryKind,
  FacadeDetailKind,
} from "./buildingShared";
import {
  createFacadeDetail,
  getDerivedFacadeProfile,
  getFrontLocalZ,
  getWindowKind,
} from "./buildingFacadeStyle";
import { pushRoofDetail } from "./buildingEntranceFrame";
import {
  pushDoorDetail,
  pushFacadeTrim,
  pushWindowDetail,
  shouldWindowHaveAirConditioner,
  shouldWindowHaveGrille,
} from "./buildingOpenings";
import {
  pushHouseFacade,
  pushShopfrontFacade,
  pushShopfrontSignBoard,
} from "./buildingShopfront";

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
        (row + column + building.variant) %
          (profile.style === "office-glass" ? 5 : 6) ===
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

export function createBodyInstances(
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

export function createFacadeDetailBatches(
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
