// src/pages/Mateus/Home/components/mobile/game/driving/domain/crosswalks/homeDrive.crosswalks.ts

import { hashVector } from "../homeDrive.math";
import { generateHomeDriveRoadSegments } from "../homeDrive.roadGenerator";
import type { HomeDriveVector2 } from "../homeDrive.types";
import type { HomeDriveGeneratedRoadSegment } from "../homeDrive.worldMap.types";
import { resolveHomeDriveCrosswalkSignalPhase } from "./homeDrive.crosswalkSignals";
import type {
  HomeDriveCrosswalk,
  HomeDriveCrosswalkGenerationOptions,
  HomeDriveCrosswalkQueryResult,
  HomeDriveCrosswalkRuntimeState,
  HomeDriveCrosswalkSide,
  HomeDriveCrosswalkTickOptions,
} from "./homeDrive.crosswalks.types";
import {
  DEFAULT_MAX_CROSSWALKS,
  DEFAULT_MIN_ROAD_LENGTH_METERS,
  DEFAULT_CROSSWALK_DENSITY,
  CROSSWALK_SIDEWALK_REACH_METERS,
  clamp,
  clamp01,
  normalizeVector2,
  getStableRoadSeed,
  getCrosswalkRoadChance,
  getCrosswalkSlotSpacingMeters,
  getCrosswalkKind,
  getCrosswalkLengthMeters,
  getCrosswalkStripeCount,
  getCrosswalkStripeLengthMeters,
  getCrosswalkStripeWidthMeters,
  getPointOnRoad,
  getCrosswalkT,
} from "./homeDrive.crosswalks.geometry";
import type { CrosswalkCandidate } from "./homeDrive.crosswalks.geometry";

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
