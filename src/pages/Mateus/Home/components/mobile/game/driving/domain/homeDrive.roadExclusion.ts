// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.roadExclusion.ts

import { generateHomeDriveRoadSegments } from "./homeDrive.roadGenerator";
import type { HomeDriveVector2 } from "./homeDrive.types";
import type { HomeDriveGeneratedRoadSegment } from "./homeDrive.worldMap.types";

const ROAD_EXCLUSION_EXTRA_MARGIN_METERS = 4.5;

function getSidewalkWidthMeters(road: HomeDriveGeneratedRoadSegment): number {
  switch (road.kind) {
    case "coastal":
      return 9.2;
    case "avenue":
      return 6.4;
    case "commercial":
      return 5.8;
    case "ring":
      return 5.2;
    case "service":
      return 2.8;
    case "street":
      return 3.6;
    default:
      if (road.roadTone === "boulevard") {
        return 7.4;
      }

      if (road.roadTone === "urban-core") {
        return 4.8;
      }

      return 4.4;
  }
}

function getCurbWidthMeters(road: HomeDriveGeneratedRoadSegment): number {
  return road.kind === "service" ? 0.32 : 0.48;
}

function getPointToSegmentDistanceMeters(
  point: HomeDriveVector2,
  road: HomeDriveGeneratedRoadSegment,
): number {
  const segmentX = road.to.x - road.from.x;
  const segmentZ = road.to.z - road.from.z;
  const segmentLengthSquared = segmentX * segmentX + segmentZ * segmentZ;

  if (segmentLengthSquared <= 0.000001) {
    return Math.hypot(point.x - road.from.x, point.z - road.from.z);
  }

  const rawT =
    ((point.x - road.from.x) * segmentX + (point.z - road.from.z) * segmentZ) /
    segmentLengthSquared;

  const t = Math.max(0, Math.min(1, rawT));

  const nearestX = road.from.x + segmentX * t;
  const nearestZ = road.from.z + segmentZ * t;

  return Math.hypot(point.x - nearestX, point.z - nearestZ);
}

function getRoadExclusionRadiusMeters(
  road: HomeDriveGeneratedRoadSegment,
  objectRadiusMeters: number,
): number {
  return (
    road.width / 2 +
    getSidewalkWidthMeters(road) +
    getCurbWidthMeters(road) +
    objectRadiusMeters +
    ROAD_EXCLUSION_EXTRA_MARGIN_METERS
  );
}

export function isHomeDrivePositionBlockedByRoad(
  position: HomeDriveVector2,
  objectRadiusMeters = 1,
): boolean {
  const roads = generateHomeDriveRoadSegments();

  return roads.some((road) => {
    const distance = getPointToSegmentDistanceMeters(position, road);
    const blockedRadius = getRoadExclusionRadiusMeters(road, objectRadiusMeters);

    return distance <= blockedRadius;
  });
}
