// src/pages/Mateus/Home/components/mobile/game/driving/domain/crosswalks/homeDrive.crosswalks.ts

import { hashVector } from "../homeDrive.math";
import { generateHomeDriveRoadSegments } from "../homeDrive.roadGenerator";
import type { HomeDriveVector2 } from "../homeDrive.types";
import type { HomeDriveGeneratedRoadSegment } from "../homeDrive.worldMap.types";
import { resolveHomeDriveCrosswalkSignalPhase } from "./homeDrive.crosswalkSignals";
import type {
  HomeDriveCrosswalk,
  HomeDriveCrosswalkGenerationOptions,
  HomeDriveCrosswalkKind,
  HomeDriveCrosswalkQueryResult,
  HomeDriveCrosswalkRuntimeState,
  HomeDriveCrosswalkSide,
  HomeDriveCrosswalkTickOptions,
} from "./homeDrive.crosswalks.types";

const DEFAULT_MAX_CROSSWALKS = 96;
const DEFAULT_MIN_ROAD_LENGTH_METERS = 82;
const DEFAULT_CROSSWALK_DENSITY = 1;

const CROSSWALK_ENDPOINT_PADDING_RATIO = 0.16;
const CROSSWALK_SIDEWALK_REACH_METERS = 5.2;

type CrosswalkCandidate = Readonly<{
  crosswalk: HomeDriveCrosswalk;
  priority: number;
}>;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
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

function getRoadTags(road: HomeDriveGeneratedRoadSegment): readonly string[] {
  return Array.isArray(road.tags) ? road.tags : [];
}

function getStableRoadSeed(road: HomeDriveGeneratedRoadSegment): number {
  let hash = 29;

  for (let index = 0; index < road.id.length; index += 1) {
    hash = (hash * 41 + road.id.charCodeAt(index)) % 130363;
  }

  return hash + road.segmentIndex * 149;
}

function getCrosswalkRoadChance(road: HomeDriveGeneratedRoadSegment): number {
  const tags = getRoadTags(road);

  if (tags.includes("safe-endcap")) {
    return 0;
  }

  if (road.kind === "service") {
    return 0.1;
  }

  if (road.kind === "commercial") {
    return 0.86;
  }

  if (road.kind === "avenue") {
    return 0.72;
  }

  if (road.kind === "street") {
    return 0.62;
  }

  if (road.kind === "coastal") {
    return 0.54;
  }

  if (road.kind === "ring") {
    return 0.32;
  }

  if (tags.includes("main")) {
    return 0.66;
  }

  return 0.48;
}

function getCrosswalkSlotSpacingMeters(
  road: HomeDriveGeneratedRoadSegment,
): number {
  switch (road.kind) {
    case "commercial":
      return 190;

    case "avenue":
      return 235;

    case "street":
      return 215;

    case "coastal":
      return 260;

    case "ring":
      return 310;

    case "service":
      return 360;

    default:
      return 250;
  }
}

function getCrosswalkKind(
  road: HomeDriveGeneratedRoadSegment,
  seed: number,
): HomeDriveCrosswalkKind {
  if (road.kind === "avenue") {
    return seed > 0.28 ? "avenue-zebra" : "double-zebra";
  }

  if (road.kind === "commercial") {
    return seed > 0.2 ? "commercial" : "zebra";
  }

  if (road.districtId === "benfica" || road.districtId === "castelao") {
    return seed > 0.72 ? "school" : "zebra";
  }

  if (road.kind === "coastal") {
    return seed > 0.54 ? "double-zebra" : "zebra";
  }

  return seed > 0.72 ? "double-zebra" : "zebra";
}

function getCrosswalkLengthMeters(kind: HomeDriveCrosswalkKind): number {
  switch (kind) {
    case "avenue-zebra":
      return 8.8;

    case "double-zebra":
      return 7.2;

    case "school":
      return 7.8;

    case "commercial":
      return 7.4;

    case "zebra":
    default:
      return 6.4;
  }
}

function getCrosswalkStripeCount(
  kind: HomeDriveCrosswalkKind,
  roadWidthMeters: number,
): number {
  const baseCount = Math.max(4, Math.floor(roadWidthMeters / 1.85));

  switch (kind) {
    case "avenue-zebra":
      return clamp(baseCount + 2, 7, 16);

    case "double-zebra":
      return clamp(baseCount + 1, 6, 14);

    case "school":
      return clamp(baseCount + 2, 7, 15);

    case "commercial":
      return clamp(baseCount + 1, 6, 14);

    case "zebra":
    default:
      return clamp(baseCount, 5, 13);
  }
}

function getCrosswalkStripeLengthMeters(
  kind: HomeDriveCrosswalkKind,
  lengthMeters: number,
): number {
  switch (kind) {
    case "avenue-zebra":
      return lengthMeters * 0.9;

    case "school":
      return lengthMeters * 0.88;

    case "commercial":
      return lengthMeters * 0.86;

    case "double-zebra":
      return lengthMeters * 0.84;

    case "zebra":
    default:
      return lengthMeters * 0.82;
  }
}

function getCrosswalkStripeWidthMeters(
  kind: HomeDriveCrosswalkKind,
  widthMeters: number,
  stripeCount: number,
): number {
  const step = widthMeters / Math.max(1, stripeCount);
  const baseWidth = step * 0.48;

  switch (kind) {
    case "avenue-zebra":
      return clamp(baseWidth, 0.58, 1.14);

    case "school":
      return clamp(baseWidth * 1.04, 0.58, 1.18);

    case "commercial":
      return clamp(baseWidth, 0.54, 1.08);

    case "double-zebra":
      return clamp(baseWidth, 0.54, 1.08);

    case "zebra":
    default:
      return clamp(baseWidth, 0.5, 1.02);
  }
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

function getCrosswalkT(
  slotIndex: number,
  slotCount: number,
  roadSeed: number,
): number {
  const safeSlotCount = Math.max(1, slotCount);
  const rawT = (slotIndex + 0.5) / safeSlotCount;
  const slotWidth = 1 / safeSlotCount;
  const jitter = (hashVector(roadSeed, slotIndex, 863) - 0.5) * slotWidth * 0.42;

  return (
    CROSSWALK_ENDPOINT_PADDING_RATIO +
    clamp01(rawT + jitter) * (1 - CROSSWALK_ENDPOINT_PADDING_RATIO * 2)
  );
}

function createCrosswalk(
  road: HomeDriveGeneratedRoadSegment,
  slotIndex: number,
  slotCount: number,
  roadSeed: number,
  globalSeed: number,
): HomeDriveCrosswalk {
  const kindSeed = hashVector(roadSeed, slotIndex, 811 + globalSeed);
  const demandSeed = hashVector(roadSeed, slotIndex, 823 + globalSeed);
  const phaseSeed = hashVector(roadSeed, slotIndex, 829 + globalSeed);
  const visualSeed = hashVector(roadSeed, slotIndex, 839 + globalSeed);

  const kind = getCrosswalkKind(road, kindSeed);
  const t = getCrosswalkT(slotIndex, slotCount, roadSeed);
  const position = getPointOnRoad(road, t);
  const roadDirection = normalizeVector2(road.direction);
  const roadNormal = normalizeVector2(road.normal);

  const roadWidthMeters = Math.max(4, road.width);
  const sidewalkReachMeters =
    CROSSWALK_SIDEWALK_REACH_METERS +
    (road.kind === "avenue" ? 1.8 : road.kind === "commercial" ? 1.2 : 0);

  const widthMeters = roadWidthMeters + sidewalkReachMeters * 2;
  const lengthMeters = getCrosswalkLengthMeters(kind);
  const stripeCount = getCrosswalkStripeCount(kind, roadWidthMeters);
  const stripeLengthMeters = getCrosswalkStripeLengthMeters(
    kind,
    lengthMeters,
  );
  const stripeWidthMeters = getCrosswalkStripeWidthMeters(
    kind,
    widthMeters,
    stripeCount,
  );

  const sideA = {
    x: position.x - roadNormal.x * widthMeters * 0.5,
    z: position.z - roadNormal.z * widthMeters * 0.5,
  };

  const sideB = {
    x: position.x + roadNormal.x * widthMeters * 0.5,
    z: position.z + roadNormal.z * widthMeters * 0.5,
  };

  return {
    id: `crosswalk-${road.id}-${slotIndex}`,
    roadId: road.roadId,
    segmentId: road.id,
    segmentIndex: road.segmentIndex,
    districtId: road.districtId,
    roadKind: road.kind,
    kind,
    signalPhase: phaseSeed > 0.16 ? "wait" : "off",
    position,
    roadDirection,
    roadNormal,
    lengthMeters,
    widthMeters,
    roadWidthMeters,
    sidewalkReachMeters,
    stripeCount,
    stripeLengthMeters,
    stripeWidthMeters,
    t,
    sideA,
    sideB,
    seed: visualSeed,
    pedestrianDemand: clamp(0.35 + demandSeed * 0.8, 0, 1),
    hasYieldControl: road.kind !== "service" && phaseSeed > 0.08,
  };
}

function createCrosswalkCandidate(
  road: HomeDriveGeneratedRoadSegment,
  slotIndex: number,
  slotCount: number,
  roadSeed: number,
  globalSeed: number,
  roadChance: number,
): CrosswalkCandidate {
  const crosswalk = createCrosswalk(
    road,
    slotIndex,
    slotCount,
    roadSeed,
    globalSeed,
  );

  const prioritySeed = hashVector(roadSeed, slotIndex, 853 + globalSeed);
  const priority =
    prioritySeed * 0.68 -
    roadChance * 0.22 -
    crosswalk.pedestrianDemand * 0.1;

  return {
    crosswalk,
    priority,
  };
}

export function createInitialHomeDriveCrosswalkState(
  options: HomeDriveCrosswalkGenerationOptions = {},
): HomeDriveCrosswalkRuntimeState {
  const maxCrosswalks = options.maxCrosswalks ?? DEFAULT_MAX_CROSSWALKS;
  const minRoadLengthMeters =
    options.minRoadLengthMeters ?? DEFAULT_MIN_ROAD_LENGTH_METERS;
  const density = options.density ?? DEFAULT_CROSSWALK_DENSITY;
  const globalSeed = Math.floor((options.seed ?? 0) % 10000);

  const roads = generateHomeDriveRoadSegments();
  const candidates: CrosswalkCandidate[] = [];

  for (const road of roads) {
    if (road.length < minRoadLengthMeters) {
      continue;
    }

    const roadChance = clamp01(getCrosswalkRoadChance(road) * density);

    if (roadChance <= 0) {
      continue;
    }

    const roadSeed = getStableRoadSeed(road);
    const spacing = getCrosswalkSlotSpacingMeters(road);
    const slotCount = Math.max(1, Math.floor(road.length / spacing));

    for (let slotIndex = 0; slotIndex < slotCount; slotIndex += 1) {
      const spawnSeed = hashVector(roadSeed, slotIndex, 797 + globalSeed);

      if (spawnSeed > roadChance) {
        continue;
      }

      candidates.push(
        createCrosswalkCandidate(
          road,
          slotIndex,
          slotCount,
          roadSeed,
          globalSeed,
          roadChance,
        ),
      );
    }
  }

  const crosswalks = candidates
    .sort((first, second) => {
      if (first.priority !== second.priority) {
        return first.priority - second.priority;
      }

      return first.crosswalk.id.localeCompare(second.crosswalk.id);
    })
    .slice(0, maxCrosswalks)
    .map((candidate) => candidate.crosswalk);

  return {
    crosswalks,
    occupancies: [],
    elapsedSeconds: 0,
  };
}

export function tickHomeDriveCrosswalks(
  state: HomeDriveCrosswalkRuntimeState,
  deltaSeconds: number,
  options: HomeDriveCrosswalkTickOptions = {},
): HomeDriveCrosswalkRuntimeState {
  if (options.enabled === false || deltaSeconds <= 0) {
    return state;
  }

  const elapsedSeconds = state.elapsedSeconds + deltaSeconds;

  return {
    ...state,
    elapsedSeconds,
    crosswalks: state.crosswalks.map((crosswalk) => ({
      ...crosswalk,
      signalPhase: resolveHomeDriveCrosswalkSignalPhase(
        crosswalk,
        elapsedSeconds,
      ),
    })),
    occupancies: state.occupancies.filter((occupancy) => {
      return (
        elapsedSeconds - occupancy.startedAtSeconds <=
        occupancy.estimatedDurationSeconds + 1.5
      );
    }),
  };
}

export function getHomeDriveCrosswalkPointAtProgress(
  crosswalk: HomeDriveCrosswalk,
  direction: -1 | 1,
  progress: number,
): HomeDriveVector2 {
  const start = direction === 1 ? crosswalk.sideA : crosswalk.sideB;
  const end = direction === 1 ? crosswalk.sideB : crosswalk.sideA;
  const t = clamp01(progress);

  return {
    x: start.x + (end.x - start.x) * t,
    z: start.z + (end.z - start.z) * t,
  };
}

export function getHomeDriveCrosswalkSideForPoint(
  crosswalk: HomeDriveCrosswalk,
  point: HomeDriveVector2,
): HomeDriveCrosswalkSide {
  const dx = point.x - crosswalk.position.x;
  const dz = point.z - crosswalk.position.z;
  const sideValue = dx * crosswalk.roadNormal.x + dz * crosswalk.roadNormal.z;

  return sideValue >= 0 ? 1 : -1;
}

export function findNearestHomeDriveCrosswalk(
  state: HomeDriveCrosswalkRuntimeState,
  point: HomeDriveVector2,
  maxDistanceMeters = 42,
): HomeDriveCrosswalkQueryResult | null {
  let best: HomeDriveCrosswalkQueryResult | null = null;
  const maxDistanceSq = maxDistanceMeters * maxDistanceMeters;

  for (const crosswalk of state.crosswalks) {
    const dx = point.x - crosswalk.position.x;
    const dz = point.z - crosswalk.position.z;
    const distanceSq = dx * dx + dz * dz;

    if (distanceSq > maxDistanceSq) {
      continue;
    }

    const distanceMeters = Math.sqrt(distanceSq);

    if (!best || distanceMeters < best.distanceMeters) {
      best = {
        crosswalk,
        distanceMeters,
        side: getHomeDriveCrosswalkSideForPoint(crosswalk, point),
      };
    }
  }

  return best;
}

export function getHomeDriveCrosswalksNearPoint(
  state: HomeDriveCrosswalkRuntimeState,
  point: HomeDriveVector2,
  radiusMeters: number,
): readonly HomeDriveCrosswalk[] {
  const radiusSq = radiusMeters * radiusMeters;

  return state.crosswalks.filter((crosswalk) => {
    const dx = point.x - crosswalk.position.x;
    const dz = point.z - crosswalk.position.z;

    return dx * dx + dz * dz <= radiusSq;
  });
}

export function syncHomeDriveCrosswalkOccupanciesFromPedestrians(
  state: HomeDriveCrosswalkRuntimeState,
  pedestrians: readonly Readonly<{
    id: string;
    crosswalkId?: string | null;
    crossingDirection?: -1 | 1;
    crossingProgress?: number;
    crossingStartedAtSeconds?: number;
    crossingDurationSeconds?: number;
  }>[],
): HomeDriveCrosswalkRuntimeState {
  const crosswalkIds = new Set(
    state.crosswalks.map((crosswalk) => crosswalk.id),
  );

  return {
    ...state,
    occupancies: pedestrians
      .filter((agent) => {
        return Boolean(agent.crosswalkId && crosswalkIds.has(agent.crosswalkId));
      })
      .map((agent) => ({
        pedestrianId: agent.id,
        crosswalkId: agent.crosswalkId ?? "",
        direction: agent.crossingDirection ?? 1,
        progress: clamp01(agent.crossingProgress ?? 0),
        startedAtSeconds: agent.crossingStartedAtSeconds ?? state.elapsedSeconds,
        estimatedDurationSeconds: agent.crossingDurationSeconds ?? 6,
      })),
  };
}
