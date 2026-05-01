// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianSidewalks.ts

import { generateHomeDriveRoadSegments } from "../homeDrive.roadGenerator";
import type { HomeDriveVector2 } from "../homeDrive.types";
import type { HomeDriveGeneratedRoadSegment } from "../homeDrive.worldMap.types";
import {
  HOME_DRIVE_PEDESTRIAN_CROWD_TUNING,
  clampHomeDrivePedestrianCrowdDensity,
  getHomeDrivePedestrianRoadDensityCap,
  getHomeDrivePedestrianRoadKindCrowdTuning,
  getHomeDrivePedestrianTargetSpacingMeters,
} from "./homeDrive.pedestrianCrowdTuning";
import type {
  HomeDrivePedestrianSidewalkSide,
  HomeDrivePedestrianSidewalkZone,
  HomeDrivePedestrianVector2,
} from "./homeDrive.pedestrians.types";
import { clamp, clamp01 } from "./homeDrive.pedestrianRandom";

export type HomeDrivePedestrianSidewalkBuildOptions = Readonly<{
  minRoadLengthMeters?: number;
  maxRoads?: number;
  density?: number;
}>;

const DEFAULT_MIN_ROAD_LENGTH_METERS = 28;
const DEFAULT_SIDEWALK_GAP_METERS = 1.35;
const DEFAULT_SIDEWALK_WIDTH_METERS = 2.85;
const MIN_ZONE_LENGTH_METERS = 0.000001;

let cachedSidewalkZonesKey = "";
let cachedSidewalkZones: readonly HomeDrivePedestrianSidewalkZone[] | null =
  null;

function getCacheKey(options: HomeDrivePedestrianSidewalkBuildOptions): string {
  return JSON.stringify({
    minRoadLengthMeters:
      options.minRoadLengthMeters ?? DEFAULT_MIN_ROAD_LENGTH_METERS,
    maxRoads: options.maxRoads ?? null,
    density: options.density ?? 1,
  });
}

function getRoadTags(road: HomeDriveGeneratedRoadSegment): readonly string[] {
  return Array.isArray(road.tags) ? road.tags : [];
}

function isRoadEligibleForPedestrians(
  road: HomeDriveGeneratedRoadSegment,
  minRoadLengthMeters: number,
): boolean {
  const tags = getRoadTags(road);

  if (road.length < minRoadLengthMeters) {
    return false;
  }

  if (tags.includes("safe-endcap") || tags.includes("no-pedestrians")) {
    return false;
  }

  if (road.kind === "service" && road.length < 42) {
    return false;
  }

  return road.surface !== "water";
}

function getSidewalkWidthMeters(road: HomeDriveGeneratedRoadSegment): number {
  const tags = getRoadTags(road);

  if (tags.includes("main") || road.kind === "coastal") {
    return 4.2;
  }

  switch (road.kind) {
    case "avenue":
      return 3.75;

    case "commercial":
      return 3.45;

    case "street":
      return 2.65;

    case "ring":
      return 2.5;

    case "service":
      return 2.15;

    default:
      return DEFAULT_SIDEWALK_WIDTH_METERS;
  }
}

function getBaseRoadDensity(roadKind: string): number {
  const cap = getHomeDrivePedestrianRoadDensityCap(roadKind);

  switch (roadKind) {
    case "commercial":
      return cap * 0.78;

    case "coastal":
      return cap * 0.74;

    case "avenue":
      return cap * 0.68;

    case "street":
      return cap * 0.58;

    case "ring":
      return cap * 0.42;

    case "service":
      return cap * 0.36;

    default:
      return cap * 0.52;
  }
}

function getSidewalkDensity(road: HomeDriveGeneratedRoadSegment): number {
  const tags = getRoadTags(road);
  const densityCap = getHomeDrivePedestrianRoadDensityCap(road.kind);
  let density = getBaseRoadDensity(road.kind);

  if (tags.includes("main")) {
    density += 0.22;
  }

  if (tags.includes("fast")) {
    density -= 0.12;
  }

  return clamp(
    density,
    0.08,
    Math.max(0.08, densityCap),
  );
}

function getSideNormal(
  road: HomeDriveGeneratedRoadSegment,
  side: HomeDrivePedestrianSidewalkSide,
): HomeDrivePedestrianVector2 {
  const sign = side === "left" ? 1 : -1;

  return {
    x: road.normal.x * sign,
    z: road.normal.z * sign,
  };
}

function offsetPoint(
  point: HomeDriveVector2,
  normal: HomeDrivePedestrianVector2,
  meters: number,
): HomeDriveVector2 {
  return {
    x: point.x + normal.x * meters,
    z: point.z + normal.z * meters,
  };
}

function getZoneForRoadSide(
  road: HomeDriveGeneratedRoadSegment,
  side: HomeDrivePedestrianSidewalkSide,
  globalDensity: number,
): HomeDrivePedestrianSidewalkZone {
  const widthMeters = getSidewalkWidthMeters(road);
  const normal = getSideNormal(road, side);
  const roadTuning = getHomeDrivePedestrianRoadKindCrowdTuning(road.kind);
  const offsetFromRoadCenterMeters =
    road.width / 2 + DEFAULT_SIDEWALK_GAP_METERS + widthMeters / 2;
  const from = offsetPoint(road.from, normal, offsetFromRoadCenterMeters);
  const to = offsetPoint(road.to, normal, offsetFromRoadCenterMeters);
  const safeGlobalDensity = clampHomeDrivePedestrianCrowdDensity(globalDensity);

  return {
    id: `${road.id}::sidewalk-${side}`,
    roadId: road.roadId,
    segmentId: road.id,
    segmentIndex: road.segmentIndex,
    districtId: road.districtId,
    roadKind: road.kind,
    roadTone: road.roadTone,
    side,
    from,
    to,
    center: {
      x: (from.x + to.x) / 2,
      z: (from.z + to.z) / 2,
    },
    direction: road.direction,
    normal,
    lengthMeters: road.length,
    widthMeters,
    offsetFromRoadCenterMeters,
    density: clamp(
      getSidewalkDensity(road) * safeGlobalDensity,
      0.08,
      roadTuning.densityCap,
    ),
    tags: getRoadTags(road),
    road,
  };
}

export function buildHomeDrivePedestrianSidewalkZones(
  options: HomeDrivePedestrianSidewalkBuildOptions = {},
): readonly HomeDrivePedestrianSidewalkZone[] {
  const cacheKey = getCacheKey(options);

  if (cachedSidewalkZones && cachedSidewalkZonesKey === cacheKey) {
    return cachedSidewalkZones;
  }

  const minRoadLengthMeters =
    options.minRoadLengthMeters ?? DEFAULT_MIN_ROAD_LENGTH_METERS;
  const globalDensity = options.density ?? HOME_DRIVE_PEDESTRIAN_CROWD_TUNING.generation.defaultDensity;
  const maxRoads = options.maxRoads ?? Number.POSITIVE_INFINITY;

  const roads = generateHomeDriveRoadSegments()
    .filter((road) => isRoadEligibleForPedestrians(road, minRoadLengthMeters))
    .sort((first, second) => {
      const densityDiff = getSidewalkDensity(second) - getSidewalkDensity(first);

      if (Math.abs(densityDiff) > 0.0001) {
        return densityDiff;
      }

      return second.length - first.length;
    })
    .slice(0, maxRoads);

  cachedSidewalkZones = roads.flatMap((road) => [
    getZoneForRoadSide(road, "left", globalDensity),
    getZoneForRoadSide(road, "right", globalDensity),
  ]);

  cachedSidewalkZonesKey = cacheKey;

  return cachedSidewalkZones;
}

export function getHomeDrivePedestrianPointOnSidewalk(
  zone: HomeDrivePedestrianSidewalkZone,
  progress: number,
  lateralOffsetMeters = 0,
): HomeDriveVector2 {
  const t = clamp01(progress);
  const sideOffset = clamp(
    lateralOffsetMeters,
    -zone.widthMeters * 0.42,
    zone.widthMeters * 0.42,
  );

  return {
    x: zone.from.x + (zone.to.x - zone.from.x) * t + zone.normal.x * sideOffset,
    z: zone.from.z + (zone.to.z - zone.from.z) * t + zone.normal.z * sideOffset,
  };
}

export function getHomeDrivePedestrianHeadingRadians(
  zone: HomeDrivePedestrianSidewalkZone,
  directionSign: 1 | -1,
): number {
  const normalizedDirectionSign = directionSign >= 0 ? 1 : -1;

  return Math.atan2(
    zone.direction.x * normalizedDirectionSign,
    zone.direction.z * normalizedDirectionSign,
  );
}

export function resolveHomeDrivePedestrianSidewalkProgressAfterDistance(
  zone: HomeDrivePedestrianSidewalkZone,
  progress: number,
  directionSign: 1 | -1,
  distanceMeters: number,
): Readonly<{
  progress: number;
  directionSign: 1 | -1;
  reachedEnd: boolean;
}> {
  if (zone.lengthMeters <= MIN_ZONE_LENGTH_METERS) {
    return {
      progress,
      directionSign,
      reachedEnd: false,
    };
  }

  const nextProgress =
    progress + (distanceMeters / zone.lengthMeters) * directionSign;

  if (nextProgress > 0.975) {
    return {
      progress: 0.975,
      directionSign: -1,
      reachedEnd: true,
    };
  }

  if (nextProgress < 0.025) {
    return {
      progress: 0.025,
      directionSign: 1,
      reachedEnd: true,
    };
  }

  return {
    progress: nextProgress,
    directionSign,
    reachedEnd: false,
  };
}

export function getHomeDrivePedestrianZoneById(
  zones: readonly HomeDrivePedestrianSidewalkZone[],
  zoneId: string,
): HomeDrivePedestrianSidewalkZone | undefined {
  return zones.find((zone) => zone.id === zoneId);
}

function getPedestrianSlotSpacingMeters(
  zone: HomeDrivePedestrianSidewalkZone,
): number {
  return getHomeDrivePedestrianTargetSpacingMeters(zone.roadKind);
}

export function getHomeDrivePedestrianSidewalkSlotCount(
  zone: HomeDrivePedestrianSidewalkZone,
  density: number,
): number {
  const spacingMeters = getPedestrianSlotSpacingMeters(zone);
  const safeDensity = clampHomeDrivePedestrianCrowdDensity(density);
  const rawCount = Math.floor(
    (zone.lengthMeters / spacingMeters) * zone.density * Math.max(0.35, safeDensity),
  );

  if (zone.density > 0.12 && zone.lengthMeters >= 24) {
    return Math.max(1, rawCount);
  }

  return Math.max(0, rawCount);
}

export function getHomeDrivePedestrianOppositeSidewalkSide(
  side: HomeDrivePedestrianSidewalkSide,
): HomeDrivePedestrianSidewalkSide {
  return side === "left" ? "right" : "left";
}

export function getHomeDrivePedestrianZoneBySegmentAndSide(
  zones: readonly HomeDrivePedestrianSidewalkZone[],
  segmentId: string,
  side: HomeDrivePedestrianSidewalkSide,
): HomeDrivePedestrianSidewalkZone | undefined {
  return zones.find((zone) => {
    return zone.segmentId === segmentId && zone.side === side;
  });
}

export function getHomeDrivePedestrianSideForCrosswalkSide(
  side: -1 | 1,
): HomeDrivePedestrianSidewalkSide {
  return side === 1 ? "left" : "right";
}
