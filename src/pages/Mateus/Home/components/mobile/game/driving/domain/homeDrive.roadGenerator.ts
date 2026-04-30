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
  HomeDrivePedestrianRoadSegmentQueryOptions,
  HomeDriveRoadVisibilityOptions,
  HomeDriveVisibleRoadSegment,
  HomeDriveWorldCrosswalkRoadSettings,
  HomeDriveWorldPedestrianRoadSettings,
  HomeDriveWorldPosition,
  HomeDriveWorldRoad,
} from "./homeDrive.worldMap.types";

const DEFAULT_ROAD_VISIBILITY_RADIUS_METERS = 680;
const DEFAULT_MAX_VISIBLE_ROAD_SEGMENTS = 96;

let cachedRoadSource: readonly HomeDriveWorldRoad[] | undefined;
let cachedGeneratedSegments: readonly HomeDriveGeneratedRoadSegment[] | undefined;

function getRoadTags(road: Readonly<{ tags?: readonly string[] }>): readonly string[] {
  return Array.isArray(road.tags) ? road.tags : [];
}

function getRoadPedestrianSettings(
  road: HomeDriveWorldRoad,
): HomeDriveWorldPedestrianRoadSettings | undefined {
  return road.pedestrians;
}


function getRoadCrosswalkSettings(
  road: HomeDriveWorldRoad,
): HomeDriveWorldCrosswalkRoadSettings | undefined {
  return road.crosswalks;
}

function inferCrosswalkAllowed(segment: HomeDriveGeneratedRoadSegment): boolean {
  const tags = getRoadTags(segment);
  const settings = getRoadCrosswalkSettings(segment.sourceRoad);

  if (settings?.enabled === false) {
    return false;
  }

  if (
    tags.includes("no-crosswalks") ||
    tags.includes("safe-endcap") ||
    tags.includes("no-pedestrians")
  ) {
    return false;
  }

  if (segment.surface === "water") {
    return false;
  }

  if (segment.kind === "service" && segment.length < 120) {
    return false;
  }

  return true;
}

function inferCrosswalkDensity(segment: HomeDriveGeneratedRoadSegment): number | undefined {
  const settings = getRoadCrosswalkSettings(segment.sourceRoad);

  if (typeof settings?.density === "number") {
    return settings.density;
  }

  if (segment.kind === "commercial") {
    return 1.2;
  }

  if (segment.kind === "avenue") {
    return 1;
  }

  if (segment.kind === "coastal") {
    return 0.84;
  }

  if (segment.kind === "street") {
    return 0.72;
  }

  if (segment.kind === "service") {
    return 0.24;
  }

  return undefined;
}

function inferCrosswalkYieldControl(segment: HomeDriveGeneratedRoadSegment): boolean | undefined {
  const settings = getRoadCrosswalkSettings(segment.sourceRoad);

  if (typeof settings?.yieldControl === "boolean") {
    return settings.yieldControl;
  }

  return segment.kind !== "service";
}

function inferPedestrianAllowed(segment: HomeDriveGeneratedRoadSegment): boolean {
  const tags = getRoadTags(segment);
  const settings = getRoadPedestrianSettings(segment.sourceRoad);

  if (settings?.enabled === false) {
    return false;
  }

  if (tags.includes("no-pedestrians") || tags.includes("safe-endcap")) {
    return false;
  }

  if (segment.surface === "water") {
    return false;
  }

  if (segment.kind === "service" && segment.length < 92) {
    return false;
  }

  return true;
}

function inferPedestrianDensity(segment: HomeDriveGeneratedRoadSegment): number | undefined {
  const settings = getRoadPedestrianSettings(segment.sourceRoad);

  if (typeof settings?.density === "number") {
    return settings.density;
  }

  if (segment.kind === "commercial") {
    return 1.12;
  }

  if (segment.kind === "coastal") {
    return 1.08;
  }

  if (segment.kind === "avenue") {
    return 0.82;
  }

  if (segment.kind === "service") {
    return 0.34;
  }

  return undefined;
}

function enrichRoadSegmentForUrbanSystems(
  segment: HomeDriveGeneratedRoadSegment,
): HomeDriveGeneratedRoadSegment {
  const settings = getRoadPedestrianSettings(segment.sourceRoad);

  return {
    ...segment,
    pedestrianAllowed: inferPedestrianAllowed(segment),
    pedestrianDensity: inferPedestrianDensity(segment),
    pedestrianZoneTone: settings?.zoneTone,
    sidewalkGapMeters: settings?.sidewalkGapMeters,
    sidewalkWidthMeters: settings?.sidewalkWidthMeters,
    sidewalkLeftWidthMeters:
      settings?.sidewalkLeftWidthMeters ?? settings?.sidewalkWidthMeters,
    sidewalkRightWidthMeters:
      settings?.sidewalkRightWidthMeters ?? settings?.sidewalkWidthMeters,
    crosswalkAllowed: inferCrosswalkAllowed(segment),
    crosswalkDensity: inferCrosswalkDensity(segment),
    crosswalkZoneTone: getRoadCrosswalkSettings(segment.sourceRoad)?.zoneTone,
    crosswalkYieldControl: inferCrosswalkYieldControl(segment),
  };
}

export function generateHomeDriveRoadSegments(
  roads: readonly HomeDriveWorldRoad[] = HOME_DRIVE_WORLD_ROADS,
): readonly HomeDriveGeneratedRoadSegment[] {
  if (cachedRoadSource === roads && cachedGeneratedSegments) {
    return cachedGeneratedSegments;
  }

  cachedRoadSource = roads;
  cachedGeneratedSegments = buildHomeDriveRoadSegments(roads).map(
    enrichRoadSegmentForUrbanSystems,
  );

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

export function getHomeDriveRoadSegmentsForPedestrians(
  options: HomeDrivePedestrianRoadSegmentQueryOptions = {},
): readonly HomeDriveGeneratedRoadSegment[] {
  const minLengthMeters = options.minLengthMeters ?? 56;
  const maxSegments = options.maxSegments ?? Number.POSITIVE_INFINITY;
  const includeServiceRoads = options.includeServiceRoads ?? false;

  return generateHomeDriveRoadSegments()
    .filter((segment) => {
      if (segment.pedestrianAllowed === false) {
        return false;
      }

      if (segment.length < minLengthMeters) {
        return false;
      }

      if (!includeServiceRoads && segment.kind === "service") {
        return segment.length >= Math.max(92, minLengthMeters);
      }

      return true;
    })
    .sort((first, second) => {
      const densityDiff =
        (second.pedestrianDensity ?? 1) - (first.pedestrianDensity ?? 1);

      if (Math.abs(densityDiff) > 0.0001) {
        return densityDiff;
      }

      return second.length - first.length;
    })
    .slice(0, maxSegments);
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
