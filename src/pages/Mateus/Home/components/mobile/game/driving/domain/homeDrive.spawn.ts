// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.spawn.ts

import {
  FREE_DRIVE_START_HEADING_RAD,
  FREE_DRIVE_START_POSITION_X,
  FREE_DRIVE_START_POSITION_Z,
  FREE_DRIVE_START_SPEED_MPS,
} from "./homeDrive.constants";
import { generateHomeDriveRoadSegments } from "./homeDrive.roadGenerator";
import type { HomeDriveCarState, HomeDriveVector2 } from "./homeDrive.types";
import type { HomeDriveGeneratedRoadSegment } from "./homeDrive.worldMap.types";

const DEFAULT_SPAWN_PROGRESS = 0.38;
const DEFAULT_MIN_SPAWN_ROAD_LENGTH_METERS = 90;

/**
 * Mantém o carro na faixa correta do sentido inicial.
 *
 * O offset negativo em road.normal é o lado direito para o sentido
 * from -> to. Antes usava +1 e o carro nascia visualmente na contramão.
 */
const DEFAULT_SPAWN_LANE_SIDE: -1 | 1 = -1;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

function getRoadPriority(road: HomeDriveGeneratedRoadSegment): number {
  let priority = 0;

  switch (road.kind) {
    case "avenue":
      priority += 90;
      break;

    case "commercial":
      priority += 82;
      break;

    case "street":
      priority += 74;
      break;

    case "coastal":
      priority += 68;
      break;

    case "ring":
      priority += 56;
      break;

    case "service":
      priority += 24;
      break;

    default:
      priority += 40;
      break;
  }

  if (road.roadTone === "urban-core") {
    priority += 14;
  }

  if (road.roadTone === "boulevard") {
    priority += 12;
  }

  if (Array.isArray(road.tags)) {
    if (road.tags.includes("main")) {
      priority += 18;
    }

    if (road.tags.includes("fast")) {
      priority += 8;
    }

    if (road.tags.includes("service")) {
      priority -= 18;
    }

    if (road.tags.includes("short")) {
      priority -= 10;
    }
  }

  priority += clamp(road.length / 12, 0, 32);

  return priority;
}

function getSpawnRoad(
  roads: readonly HomeDriveGeneratedRoadSegment[],
): HomeDriveGeneratedRoadSegment | null {
  const candidates = roads
    .filter((road) => road.length >= DEFAULT_MIN_SPAWN_ROAD_LENGTH_METERS)
    .filter((road) => road.width >= 7)
    .sort((first, second) => {
      const priorityDiff = getRoadPriority(second) - getRoadPriority(first);

      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      return first.id.localeCompare(second.id);
    });

  return candidates[0] ?? roads[0] ?? null;
}

function getPointOnRoad(
  road: HomeDriveGeneratedRoadSegment,
  progress: number,
): HomeDriveVector2 {
  const t = clamp01(progress);

  return {
    x: road.from.x + (road.to.x - road.from.x) * t,
    z: road.from.z + (road.to.z - road.from.z) * t,
  };
}

function getSpawnLaneOffsetMeters(
  road: HomeDriveGeneratedRoadSegment,
  laneSide: -1 | 1,
): number {
  const halfRoadWidth = Math.max(road.width / 2, 3.5);

  /*
    Fica dentro da faixa, mas longe de calçada/grama.
    Para rua width 10, dá algo perto de 1.8m a partir do centro.
  */
  const laneOffset = clamp(halfRoadWidth * 0.36, 1.45, halfRoadWidth - 1.35);

  return laneOffset * laneSide;
}

function getHeadingFromRoadDirection(
  road: HomeDriveGeneratedRoadSegment,
): number {
  /*
    A física usa:
      forwardX = Math.sin(headingRad)
      forwardZ = Math.cos(headingRad)

    Logo:
      heading = atan2(direction.x, direction.z)
  */
  return Math.atan2(road.direction.x, road.direction.z);
}

export function createHomeDriveSpawnCarState(): HomeDriveCarState {
  const roads = generateHomeDriveRoadSegments();
  const road = getSpawnRoad(roads);

  if (!road) {
    return {
      position: {
        x: FREE_DRIVE_START_POSITION_X,
        z: FREE_DRIVE_START_POSITION_Z,
      },
      headingRad: FREE_DRIVE_START_HEADING_RAD,
      speedMps: FREE_DRIVE_START_SPEED_MPS,
      steerAngleRad: 0,
    };
  }

  const center = getPointOnRoad(road, DEFAULT_SPAWN_PROGRESS);
  const laneOffsetMeters = getSpawnLaneOffsetMeters(
    road,
    DEFAULT_SPAWN_LANE_SIDE,
  );

  return {
    position: {
      x: center.x + road.normal.x * laneOffsetMeters,
      z: center.z + road.normal.z * laneOffsetMeters,
    },
    headingRad: getHeadingFromRoadDirection(road),
    speedMps: FREE_DRIVE_START_SPEED_MPS,
    steerAngleRad: 0,
  };
}


