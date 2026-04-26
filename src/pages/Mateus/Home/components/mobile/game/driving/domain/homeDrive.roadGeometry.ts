// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.roadGeometry.ts

import { mapPointToWorldPosition } from "./homeDrive.worldMap";
import type {
  HomeDriveGeneratedRoadSegment,
  HomeDriveRoadBounds,
  HomeDriveRoadVector,
  HomeDriveVisibleRoadSegment,
  HomeDriveWorldPosition,
  HomeDriveWorldRoad,
} from "./homeDrive.worldMap.types";

const EPSILON = 0.000001;

export function getRoadVector(
  from: HomeDriveWorldPosition,
  to: HomeDriveWorldPosition,
): HomeDriveRoadVector {
  return {
    x: to.x - from.x,
    z: to.z - from.z,
  };
}

export function getRoadVectorLength(vector: HomeDriveRoadVector): number {
  return Math.hypot(vector.x, vector.z);
}

export function normalizeRoadVector(
  vector: HomeDriveRoadVector,
): HomeDriveRoadVector {
  const length = getRoadVectorLength(vector);

  if (length <= EPSILON) {
    return {
      x: 0,
      z: 1,
    };
  }

  return {
    x: vector.x / length,
    z: vector.z / length,
  };
}

export function getRoadSegmentLength(
  from: HomeDriveWorldPosition,
  to: HomeDriveWorldPosition,
): number {
  return getRoadVectorLength(getRoadVector(from, to));
}

export function getRoadSegmentCenter(
  from: HomeDriveWorldPosition,
  to: HomeDriveWorldPosition,
): HomeDriveWorldPosition {
  return {
    x: (from.x + to.x) / 2,
    z: (from.z + to.z) / 2,
  };
}

/**
 * O motor do carro usa:
 * x += sin(heading) * speed
 * z += cos(heading) * speed
 *
 * Por isso o ângulo visual da rua também usa atan2(dx, dz).
 */
export function getRoadSegmentAngleRad(
  from: HomeDriveWorldPosition,
  to: HomeDriveWorldPosition,
): number {
  const vector = getRoadVector(from, to);

  return Math.atan2(vector.x, vector.z);
}

export function getRoadSegmentNormal(
  from: HomeDriveWorldPosition,
  to: HomeDriveWorldPosition,
): HomeDriveRoadVector {
  const direction = normalizeRoadVector(getRoadVector(from, to));

  return {
    x: direction.z,
    z: -direction.x,
  };
}

export function getRoadSegmentBounds(
  from: HomeDriveWorldPosition,
  to: HomeDriveWorldPosition,
  padding = 0,
): HomeDriveRoadBounds {
  return {
    minX: Math.min(from.x, to.x) - padding,
    maxX: Math.max(from.x, to.x) + padding,
    minZ: Math.min(from.z, to.z) - padding,
    maxZ: Math.max(from.z, to.z) + padding,
  };
}

export function getWorldDistance(
  a: HomeDriveWorldPosition,
  b: HomeDriveWorldPosition,
): number {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

export function getRoadClosestPointOnSegment(
  point: HomeDriveWorldPosition,
  from: HomeDriveWorldPosition,
  to: HomeDriveWorldPosition,
): HomeDriveWorldPosition {
  const segment = getRoadVector(from, to);
  const lengthSquared = segment.x * segment.x + segment.z * segment.z;

  if (lengthSquared <= EPSILON) {
    return from;
  }

  const pointVector = {
    x: point.x - from.x,
    z: point.z - from.z,
  };

  const t =
    (pointVector.x * segment.x + pointVector.z * segment.z) / lengthSquared;

  const clampedT = Math.min(1, Math.max(0, t));

  return {
    x: from.x + segment.x * clampedT,
    z: from.z + segment.z * clampedT,
  };
}

export function getRoadDistanceToPoint(
  point: HomeDriveWorldPosition,
  from: HomeDriveWorldPosition,
  to: HomeDriveWorldPosition,
): number {
  return getWorldDistance(point, getRoadClosestPointOnSegment(point, from, to));
}

export function doesRoadBoundsIntersectRadius(
  bounds: HomeDriveRoadBounds,
  center: HomeDriveWorldPosition,
  radius: number,
): boolean {
  const closestX = Math.min(bounds.maxX, Math.max(bounds.minX, center.x));
  const closestZ = Math.min(bounds.maxZ, Math.max(bounds.minZ, center.z));

  return Math.hypot(center.x - closestX, center.z - closestZ) <= radius;
}

export function buildHomeDriveRoadSegments(
  roads: readonly HomeDriveWorldRoad[],
): readonly HomeDriveGeneratedRoadSegment[] {
  const segments: HomeDriveGeneratedRoadSegment[] = [];

  for (const road of roads) {
    if (road.points.length < 2) {
      continue;
    }

    for (let index = 0; index < road.points.length - 1; index += 1) {
      const from = mapPointToWorldPosition(road.points[index]);
      const to = mapPointToWorldPosition(road.points[index + 1]);
      const length = getRoadSegmentLength(from, to);

      if (length <= EPSILON) {
        continue;
      }

      const direction = normalizeRoadVector(getRoadVector(from, to));
      const normal = getRoadSegmentNormal(from, to);
      const center = getRoadSegmentCenter(from, to);
      const angleRad = getRoadSegmentAngleRad(from, to);
      const bounds = getRoadSegmentBounds(from, to, road.width / 2);

      segments.push({
        id: `${road.id}::segment-${index}`,
        roadId: road.id,
        segmentIndex: index,
        label: road.label,
        districtId: road.districtId,
        kind: road.kind,
        roadTone: road.roadTone,
        laneCount: road.laneCount,
        width: road.width,
        speedLimitKmh: road.speedLimitKmh,
        bidirectional: road.bidirectional,
        surface: road.surface,
        tags: road.tags,
        from,
        to,
        center,
        direction,
        normal,
        length,
        angleRad,
        bounds,
        sourceRoad: road,
      });
    }
  }

  return segments;
}

export function attachDistanceToRoadSegment(
  segment: HomeDriveGeneratedRoadSegment,
  carPosition: HomeDriveWorldPosition,
): HomeDriveVisibleRoadSegment {
  const closestPointToCar = getRoadClosestPointOnSegment(
    carPosition,
    segment.from,
    segment.to,
  );

  return {
    ...segment,
    distanceToCar: getWorldDistance(carPosition, closestPointToCar),
    closestPointToCar,
  };
}
