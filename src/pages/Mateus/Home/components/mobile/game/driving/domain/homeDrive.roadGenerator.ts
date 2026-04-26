// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.roadGenerator.ts

import { HOME_DRIVE_WORLD_ROADS } from "./homeDrive.worldMap";
import {
  attachDistanceToRoadSegment,
  buildHomeDriveRoadSegments,
  doesRoadBoundsIntersectRadius,
  getWorldDistance,
} from "./homeDrive.roadGeometry";
import type {
  HomeDriveCameraRoadPoint,
  HomeDriveCameraRoadProjection,
  HomeDriveGeneratedRoadSegment,
  HomeDriveRoadVisibilityOptions,
  HomeDriveVisibleRoadSegment,
  HomeDriveWorldPosition,
  HomeDriveWorldRoad,
} from "./homeDrive.worldMap.types";

const DEFAULT_ROAD_VISIBILITY_RADIUS_METERS = 680;
const DEFAULT_MAX_VISIBLE_ROAD_SEGMENTS = 96;

let cachedRoadSource: readonly HomeDriveWorldRoad[] | undefined;
let cachedGeneratedSegments: readonly HomeDriveGeneratedRoadSegment[] | undefined;

export function generateHomeDriveRoadSegments(
  roads: readonly HomeDriveWorldRoad[] = HOME_DRIVE_WORLD_ROADS,
): readonly HomeDriveGeneratedRoadSegment[] {
  if (cachedRoadSource === roads && cachedGeneratedSegments) {
    return cachedGeneratedSegments;
  }

  cachedRoadSource = roads;
  cachedGeneratedSegments = buildHomeDriveRoadSegments(roads);

  return cachedGeneratedSegments;
}

export function getVisibleHomeDriveRoadSegments(
  carPosition: HomeDriveWorldPosition,
  options: HomeDriveRoadVisibilityOptions = {},
): readonly HomeDriveVisibleRoadSegment[] {
  const radiusMeters =
    options.radiusMeters ?? DEFAULT_ROAD_VISIBILITY_RADIUS_METERS;

  const maxSegments =
    options.maxSegments ?? DEFAULT_MAX_VISIBLE_ROAD_SEGMENTS;

  const segments = generateHomeDriveRoadSegments();

  return segments
    .filter((segment) => {
      return doesRoadBoundsIntersectRadius(segment.bounds, carPosition, radiusMeters);
    })
    .map((segment) => attachDistanceToRoadSegment(segment, carPosition))
    .filter((segment) => segment.distanceToCar <= radiusMeters)
    .sort((a, b) => a.distanceToCar - b.distanceToCar)
    .slice(0, maxSegments);
}

export function getNearestHomeDriveRoadSegment(
  carPosition: HomeDriveWorldPosition,
): HomeDriveVisibleRoadSegment | undefined {
  const segments = generateHomeDriveRoadSegments();

  let nearest: HomeDriveVisibleRoadSegment | undefined;

  for (const segment of segments) {
    const candidate = attachDistanceToRoadSegment(segment, carPosition);

    if (!nearest || candidate.distanceToCar < nearest.distanceToCar) {
      nearest = candidate;
    }
  }

  return nearest;
}

function projectWorldPointToCarCamera(
  point: HomeDriveWorldPosition,
  carPosition: HomeDriveWorldPosition,
  headingRad: number,
): HomeDriveCameraRoadPoint {
  const dx = point.x - carPosition.x;
  const dz = point.z - carPosition.z;

  const sin = Math.sin(headingRad);
  const cos = Math.cos(headingRad);

  return {
    world: point,
    right: dx * cos - dz * sin,
    forward: dx * sin + dz * cos,
  };
}

export function projectRoadSegmentForCamera(
  segment: HomeDriveVisibleRoadSegment,
  car: Readonly<{
    position: HomeDriveWorldPosition;
    headingRad: number;
  }>,
): HomeDriveCameraRoadProjection {
  const from = projectWorldPointToCarCamera(
    segment.from,
    car.position,
    car.headingRad,
  );

  const to = projectWorldPointToCarCamera(
    segment.to,
    car.position,
    car.headingRad,
  );

  const center = projectWorldPointToCarCamera(
    segment.center,
    car.position,
    car.headingRad,
  );

  const nearestForward = Math.max(Math.min(from.forward, to.forward), 0);

  return {
    segment,
    from,
    to,
    center,
    isBehindCamera: from.forward < -segment.width && to.forward < -segment.width,
    nearestForward,
  };
}

export function getProjectedVisibleHomeDriveRoadSegments(
  car: Readonly<{
    position: HomeDriveWorldPosition;
    headingRad: number;
  }>,
  options: HomeDriveRoadVisibilityOptions = {},
): readonly HomeDriveCameraRoadProjection[] {
  const includeBehindCar = options.includeBehindCar ?? false;

  return getVisibleHomeDriveRoadSegments(car.position, options)
    .map((segment) => projectRoadSegmentForCamera(segment, car))
    .filter((projection) => {
      if (includeBehindCar) {
        return true;
      }

      return !projection.isBehindCamera;
    })
    .sort((a, b) => {
      const distanceA = getWorldDistance(car.position, a.segment.center);
      const distanceB = getWorldDistance(car.position, b.segment.center);

      return distanceB - distanceA;
    });
}

export function clearHomeDriveRoadGeneratorCache(): void {
  cachedRoadSource = undefined;
  cachedGeneratedSegments = undefined;
}
