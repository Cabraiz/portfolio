// src/pages/Mateus/Home/components/mobile/game/driving/domain/urbanFixtures/homeDrive.urbanFixtures.ts

import type { HomeDriveCrosswalk } from "../crosswalks";
import { resolveHomeDriveCrosswalkSignalPhase } from "../crosswalks";
import { hashVector } from "../homeDrive.math";
import { generateHomeDriveRoadSegments } from "../homeDrive.roadGenerator";
import type { HomeDriveVector2 } from "../homeDrive.types";
import type { HomeDriveGeneratedRoadSegment } from "../homeDrive.worldMap.types";
import type {
  HomeDriveUrbanFixtureDistanceSortItem,
  HomeDriveUrbanFixtureSide,
  HomeDriveUrbanStreetLight,
  HomeDriveUrbanStreetLightGenerationOptions,
  HomeDriveUrbanStreetLightStyle,
  HomeDriveUrbanTrafficLight,
} from "./homeDrive.urbanFixtures.types";

const DEFAULT_MAX_STREET_LIGHTS = 920;
const DEFAULT_STREET_LIGHT_DENSITY = 1;
const DEFAULT_MIN_ROAD_LENGTH_METERS = 58;
const DEFAULT_STREET_LIGHT_SEED = 17191;

const MIN_ENDPOINT_PADDING_METERS = 14;
const STREET_LIGHT_CURB_CLEARANCE_METERS = 1.05;
const TRAFFIC_LIGHT_CURB_CLEARANCE_METERS = 1.25;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function normalizeVector2(vector: HomeDriveVector2): HomeDriveVector2 {
  const length = Math.hypot(vector.x, vector.z);

  if (!Number.isFinite(length) || length <= 0.000001) {
    return {
      x: 1,
      z: 0,
    };
  }

  return {
    x: vector.x / length,
    z: vector.z / length,
  };
}

function getStableRoadSeed(road: HomeDriveGeneratedRoadSegment): number {
  let hash = 37;

  for (let index = 0; index < road.id.length; index += 1) {
    hash = (hash * 43 + road.id.charCodeAt(index)) % 2147483647;
  }

  return hash + road.segmentIndex * 193;
}

function getRoadTags(road: HomeDriveGeneratedRoadSegment): readonly string[] {
  return Array.isArray(road.tags) ? road.tags : [];
}

function canRoadReceiveUrbanFixtures(road: HomeDriveGeneratedRoadSegment): boolean {
  const tags = getRoadTags(road);

  if (road.surface === "water") {
    return false;
  }

  if (tags.includes("safe-endcap") || tags.includes("no-urban-fixtures")) {
    return false;
  }

  if (road.kind === "service" && road.length < 92) {
    return false;
  }

  return true;
}

function getRoadFixtureDensityMultiplier(road: HomeDriveGeneratedRoadSegment): number {
  if (road.kind === "commercial") {
    return 1.32;
  }

  if (road.kind === "avenue") {
    return 1.16;
  }

  if (road.kind === "coastal") {
    return 1.06;
  }

  if (road.kind === "street") {
    return 0.92;
  }

  if (road.kind === "service") {
    return 0.48;
  }

  if (road.roadTone === "urban-core") {
    return 1.2;
  }

  return 0.84;
}

function getRoadStreetLightSpacingMeters(road: HomeDriveGeneratedRoadSegment): number {
  if (road.kind === "commercial") {
    return 38;
  }

  if (road.kind === "avenue") {
    return 44;
  }

  if (road.kind === "coastal") {
    return 50;
  }

  if (road.kind === "street") {
    return 56;
  }

  if (road.kind === "service") {
    return 78;
  }

  return 60;
}

function getFallbackSidewalkWidthMeters(road: HomeDriveGeneratedRoadSegment): number {
  if (road.sidewalkWidthMeters) {
    return road.sidewalkWidthMeters;
  }

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
      return road.roadTone === "urban-core" ? 4.8 : 4.2;
  }
}

function getSidewalkWidthForSide(
  road: HomeDriveGeneratedRoadSegment,
  side: HomeDriveUrbanFixtureSide,
): number {
  if (side < 0 && typeof road.sidewalkLeftWidthMeters === "number") {
    return road.sidewalkLeftWidthMeters;
  }

  if (side > 0 && typeof road.sidewalkRightWidthMeters === "number") {
    return road.sidewalkRightWidthMeters;
  }

  return getFallbackSidewalkWidthMeters(road);
}

function getStreetLightOffsetFromRoadCenterMeters(
  road: HomeDriveGeneratedRoadSegment,
  side: HomeDriveUrbanFixtureSide,
): number {
  const sidewalkGap = road.sidewalkGapMeters ?? 0.8;
  const sidewalkWidth = getSidewalkWidthForSide(road, side);

  return road.width / 2 + sidewalkGap + sidewalkWidth * 0.72 + STREET_LIGHT_CURB_CLEARANCE_METERS;
}

function getPointOnRoad(
  road: HomeDriveGeneratedRoadSegment,
  t: number,
): HomeDriveVector2 {
  return {
    x: road.from.x + (road.to.x - road.from.x) * t,
    z: road.from.z + (road.to.z - road.from.z) * t,
  };
}

function getStreetLightStyle(
  road: HomeDriveGeneratedRoadSegment,
  seed: number,
): HomeDriveUrbanStreetLightStyle {
  if (road.kind === "coastal") {
    return seed > 0.42 ? "coastal" : "curved";
  }

  if (road.kind === "commercial") {
    return seed > 0.34 ? "banner" : "modern";
  }

  if (road.kind === "avenue") {
    return seed > 0.52 ? "curved" : "modern";
  }

  return seed > 0.7 ? "banner" : "modern";
}

function getStreetLightHeightMeters(
  road: HomeDriveGeneratedRoadSegment,
  seed: number,
): number {
  if (road.kind === "avenue") {
    return 7.2 + seed * 0.8;
  }

  if (road.kind === "commercial") {
    return 6.2 + seed * 0.7;
  }

  if (road.kind === "coastal") {
    return 6.8 + seed * 0.9;
  }

  if (road.kind === "service") {
    return 4.8 + seed * 0.42;
  }

  return 5.6 + seed * 0.72;
}

function createStreetLightForSlot(
  road: HomeDriveGeneratedRoadSegment,
  side: HomeDriveUrbanFixtureSide,
  slotIndex: number,
  slotCount: number,
  roadSeed: number,
  globalSeed: number,
): HomeDriveUrbanStreetLight {
  const normalizedSlotCount = Math.max(1, slotCount);
  const slotT = (slotIndex + 0.5) / normalizedSlotCount;
  const paddingRatio = clamp(
    MIN_ENDPOINT_PADDING_METERS / Math.max(road.length, MIN_ENDPOINT_PADDING_METERS * 4),
    0.04,
    0.18,
  );
  const jitter =
    (hashVector(roadSeed + side * 17, slotIndex, 1009 + globalSeed) - 0.5) *
    (1 / normalizedSlotCount) *
    0.34;
  const t = paddingRatio + clamp(slotT + jitter, 0, 1) * (1 - paddingRatio * 2);
  const point = getPointOnRoad(road, t);
  const offsetMeters = getStreetLightOffsetFromRoadCenterMeters(road, side);
  const visualSeed = hashVector(roadSeed + side * 23, slotIndex, 1019 + globalSeed);
  const heightSeed = hashVector(roadSeed + side * 29, slotIndex, 1031 + globalSeed);
  const armSeed = hashVector(roadSeed + side * 31, slotIndex, 1039 + globalSeed);

  const roadNormal = normalizeVector2(road.normal);
  const roadDirection = normalizeVector2(road.direction);
  const heightMeters = getStreetLightHeightMeters(road, heightSeed);
  const style = getStreetLightStyle(road, visualSeed);

  return {
    id: `street-light-${road.id}-${side}-${slotIndex}`,
    roadId: road.roadId,
    segmentId: road.id,
    districtId: road.districtId,
    position: {
      x: point.x + roadNormal.x * offsetMeters * side,
      z: point.z + roadNormal.z * offsetMeters * side,
    },
    roadDirection,
    roadNormal,
    side,
    heightMeters,
    poleRadiusMeters: road.kind === "avenue" ? 0.105 : 0.085,
    armLengthMeters: clamp(2.1 + armSeed * 1.15 + road.width * 0.04, 2.2, 4.2),
    lampWidthMeters: style === "coastal" ? 0.86 : style === "curved" ? 0.74 : 0.64,
    style,
    seed: visualSeed,
  };
}

export function createHomeDriveUrbanStreetLights(
  options: HomeDriveUrbanStreetLightGenerationOptions = {},
): readonly HomeDriveUrbanStreetLight[] {
  const density = Math.max(0, options.density ?? DEFAULT_STREET_LIGHT_DENSITY);
  const maxLights = Math.max(0, options.maxLights ?? DEFAULT_MAX_STREET_LIGHTS);
  const minRoadLengthMeters = options.minRoadLengthMeters ?? DEFAULT_MIN_ROAD_LENGTH_METERS;
  const globalSeed = Math.floor(options.seed ?? DEFAULT_STREET_LIGHT_SEED);

  if (density <= 0 || maxLights <= 0) {
    return [];
  }

  const lights: HomeDriveUrbanStreetLight[] = [];

  for (const road of generateHomeDriveRoadSegments()) {
    if (lights.length >= maxLights) {
      break;
    }

    if (road.length < minRoadLengthMeters || !canRoadReceiveUrbanFixtures(road)) {
      continue;
    }

    const densityMultiplier = getRoadFixtureDensityMultiplier(road) * density;
    const spacingMeters = getRoadStreetLightSpacingMeters(road) / Math.max(0.25, densityMultiplier);
    const slotCount = clamp(Math.floor(road.length / spacingMeters), 1, 12);
    const roadSeed = getStableRoadSeed(road);

    for (let slotIndex = 0; slotIndex < slotCount; slotIndex += 1) {
      if (lights.length >= maxLights) {
        break;
      }

      const skipSeed = hashVector(roadSeed, slotIndex, 1051 + globalSeed);
      const keepChance = clamp(0.62 + densityMultiplier * 0.24, 0.28, 0.94);

      if (skipSeed > keepChance) {
        continue;
      }

      for (const side of [-1, 1] as const) {
        if (lights.length >= maxLights) {
          break;
        }

        const sideSeed = hashVector(roadSeed + side * 41, slotIndex, 1061 + globalSeed);

        if (sideSeed < 0.12 && road.kind !== "commercial") {
          continue;
        }

        lights.push(
          createStreetLightForSlot(
            road,
            side,
            slotIndex,
            slotCount,
            roadSeed,
            globalSeed,
          ),
        );
      }
    }
  }

  return lights;
}

function getTrafficLightOffsetFromRoadCenterMeters(
  crosswalk: HomeDriveCrosswalk,
): number {
  return (
    crosswalk.roadWidthMeters / 2 +
    crosswalk.sidewalkReachMeters * 0.86 +
    TRAFFIC_LIGHT_CURB_CLEARANCE_METERS
  );
}

function createTrafficLightForCrosswalkSide(
  crosswalk: HomeDriveCrosswalk,
  side: HomeDriveUrbanFixtureSide,
  elapsedSeconds: number,
): HomeDriveUrbanTrafficLight {
  const signalPhase = resolveHomeDriveCrosswalkSignalPhase(
    crosswalk,
    elapsedSeconds,
  );
  const roadNormal = normalizeVector2(crosswalk.roadNormal);
  const roadDirection = normalizeVector2(crosswalk.roadDirection);
  const sideOffset = getTrafficLightOffsetFromRoadCenterMeters(crosswalk);
  const forwardSign = side > 0 ? 1 : -1;
  const forwardOffset = crosswalk.lengthMeters * 0.72 + 1.8;
  const seed = hashVector(Math.floor(crosswalk.seed * 100000), side * 97, 1091);

  return {
    id: `traffic-light-${crosswalk.id}-${side}`,
    crosswalkId: crosswalk.id,
    roadId: crosswalk.roadId,
    segmentId: crosswalk.segmentId,
    districtId: crosswalk.districtId,
    position: {
      x:
        crosswalk.position.x +
        roadNormal.x * sideOffset * side +
        roadDirection.x * forwardOffset * forwardSign,
      z:
        crosswalk.position.z +
        roadNormal.z * sideOffset * side +
        roadDirection.z * forwardOffset * forwardSign,
    },
    roadDirection,
    roadNormal,
    side,
    signalPhase,
    heightMeters: 4.7 + seed * 0.34,
    poleRadiusMeters: 0.105,
    armLengthMeters: clamp(3.1 + crosswalk.roadWidthMeters * 0.11, 3.4, 5.6),
    housingHeightMeters: 1.22,
    seed,
  };
}

export function createHomeDriveUrbanTrafficLights(
  crosswalks: readonly HomeDriveCrosswalk[],
  elapsedSeconds: number,
): readonly HomeDriveUrbanTrafficLight[] {
  const lights: HomeDriveUrbanTrafficLight[] = [];

  for (const crosswalk of crosswalks) {
    if (!crosswalk.hasYieldControl || crosswalk.signalPhase === "off") {
      continue;
    }

    lights.push(createTrafficLightForCrosswalkSide(crosswalk, -1, elapsedSeconds));
    lights.push(createTrafficLightForCrosswalkSide(crosswalk, 1, elapsedSeconds));
  }

  return lights;
}

function getDistanceSq(position: HomeDriveVector2, center: HomeDriveVector2): number {
  const dx = position.x - center.x;
  const dz = position.z - center.z;

  return dx * dx + dz * dz;
}

export function selectHomeDriveUrbanFixturesNearPoint<TFixture extends Readonly<{ id: string; position: HomeDriveVector2 }>>(
  fixtures: readonly TFixture[],
  center: HomeDriveVector2,
  visibleRadiusMeters: number,
  maxFixtures: number,
): readonly TFixture[] {
  const maxDistanceSq = visibleRadiusMeters * visibleRadiusMeters;

  return fixtures
    .map<HomeDriveUrbanFixtureDistanceSortItem<TFixture>>((fixture) => ({
      fixture,
      distanceSq: getDistanceSq(fixture.position, center),
    }))
    .filter((item) => item.distanceSq <= maxDistanceSq)
    .sort((first, second) => {
      if (first.distanceSq !== second.distanceSq) {
        return first.distanceSq - second.distanceSq;
      }

      return first.fixture.id.localeCompare(second.fixture.id);
    })
    .slice(0, Math.max(0, maxFixtures))
    .map((item) => item.fixture);
}
