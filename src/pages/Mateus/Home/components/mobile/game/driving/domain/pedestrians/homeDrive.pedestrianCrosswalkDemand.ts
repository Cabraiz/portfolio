// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianCrosswalkDemand.ts

import type { HomeDriveVector2 } from "../homeDrive.types";
import type {
  HomeDriveCrosswalk,
  HomeDriveCrosswalkRuntimeState,
  HomeDriveCrosswalkSide,
} from "../crosswalks";
import {
  createHomeDrivePedestrianSeed,
  seededRange,
  seededSign,
} from "./homeDrive.pedestrianRandom";
import {
  getHomeDrivePedestrianPointOnSidewalk,
  getHomeDrivePedestrianSideForCrosswalkSide,
  getHomeDrivePedestrianZoneBySegmentAndSide,
} from "./homeDrive.pedestrianSidewalks";
import type {
  HomeDrivePedestrianAgent,
  HomeDrivePedestrianSidewalkZone,
} from "./homeDrive.pedestrians.types";
import type {
  HomeDrivePedestrianCrosswalkDemandOptions,
  HomeDrivePedestrianCrosswalkDemandResult,
  HomeDrivePedestrianCrosswalkDemandSlot,
} from "./homeDrive.pedestrianStreaming.types";

const DEFAULT_CROSSWALK_SEARCH_RADIUS_METERS = 420;
const DEFAULT_MIN_PEDESTRIANS_PER_CROSSWALK = 6;
const DEFAULT_MAX_CROSSWALK_SLOTS = 72;

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

function getDistanceSquared(
  first: Readonly<{ x: number; z: number }>,
  second: Readonly<{ x: number; z: number }>,
): number {
  const dx = first.x - second.x;
  const dz = first.z - second.z;

  return dx * dx + dz * dz;
}

function getDistanceMeters(
  first: Readonly<{ x: number; z: number }>,
  second: Readonly<{ x: number; z: number }>,
): number {
  return Math.sqrt(getDistanceSquared(first, second));
}

function normalizeHeading(headingRad = 0): HomeDriveVector2 {
  if (!Number.isFinite(headingRad)) {
    return {
      x: 0,
      z: 1,
    };
  }

  return {
    x: Math.sin(headingRad),
    z: Math.cos(headingRad),
  };
}

function dot(
  first: Readonly<{ x: number; z: number }>,
  second: Readonly<{ x: number; z: number }>,
): number {
  return first.x * second.x + first.z * second.z;
}

function subtract(
  first: Readonly<{ x: number; z: number }>,
  second: Readonly<{ x: number; z: number }>,
): HomeDriveVector2 {
  return {
    x: first.x - second.x,
    z: first.z - second.z,
  };
}

function getCrosswalkForwardPriority(
  crosswalk: HomeDriveCrosswalk,
  activeCenter: HomeDriveVector2,
  activeHeadingRad = 0,
): number {
  const heading = normalizeHeading(activeHeadingRad);
  const relative = subtract(crosswalk.position, activeCenter);
  const forwardMeters = dot(relative, heading);
  const distanceMeters = Math.max(1, Math.hypot(relative.x, relative.z));
  const frontalBias = clamp((forwardMeters / distanceMeters + 1) * 0.5, 0, 1);

  return 0.45 + frontalBias * 0.55;
}

function getCrosswalkPointForSide(
  crosswalk: HomeDriveCrosswalk,
  side: HomeDriveCrosswalkSide,
): HomeDriveVector2 {
  return side === -1 ? crosswalk.sideA : crosswalk.sideB;
}

function getAgentsNearCrosswalkSideCount(
  agents: readonly HomeDrivePedestrianAgent[],
  crosswalk: HomeDriveCrosswalk,
  side: HomeDriveCrosswalkSide,
  radiusMeters: number,
): number {
  const point = getCrosswalkPointForSide(crosswalk, side);
  const radiusSquared = radiusMeters * radiusMeters;

  return agents.filter((agent) => {
    if (agent.crosswalkId === crosswalk.id) {
      return true;
    }

    return getDistanceSquared(agent.position, point) <= radiusSquared;
  }).length;
}

function getProgressJitter(seed: number, index: number, slotCount: number): number {
  const normalizedIndex =
    slotCount <= 1 ? 0 : index / Math.max(1, slotCount - 1);
  const centered = normalizedIndex - 0.5;
  const randomJitter = seededRange(seed, 31 + index * 11, -0.028, 0.028);

  return centered * 0.055 + randomJitter;
}

function getDemandGroupKind(
  crosswalk: HomeDriveCrosswalk,
  seed: number,
): HomeDrivePedestrianCrosswalkDemandSlot["preferredGroupKind"] {
  if (crosswalk.kind === "school") {
    return seed % 3 === 0 ? "adult-child" : "solo";
  }

  if (crosswalk.kind === "commercial" || crosswalk.roadKind === "commercial") {
    return seed % 4 === 0 ? "shopper" : "solo";
  }

  return seed % 5 === 0 ? "chat-pair" : "solo";
}

function createCrosswalkDemandSlot(
  crosswalk: HomeDriveCrosswalk,
  zone: HomeDrivePedestrianSidewalkZone,
  side: HomeDriveCrosswalkSide,
  slotIndex: number,
  slotCount: number,
  priority: number,
  seed: number,
): HomeDrivePedestrianCrosswalkDemandSlot {
  const slotSeed = createHomeDrivePedestrianSeed(
    crosswalk.id,
    seed,
    side,
    slotIndex,
    917,
  );
  const progress = clamp01(crosswalk.t + getProgressJitter(slotSeed, slotIndex, slotCount));
  const lateralOffsetMeters = seededRange(
    slotSeed,
    43,
    -zone.widthMeters * 0.32,
    zone.widthMeters * 0.32,
  );
  const worldPosition = getHomeDrivePedestrianPointOnSidewalk(
    zone,
    progress,
    lateralOffsetMeters,
  );

  return {
    id: `crosswalk-demand:${crosswalk.id}:${side}:${slotIndex}`,
    zone,
    zoneId: zone.id,
    segmentId: zone.segmentId,
    side: zone.side,
    progress,
    lateralOffsetMeters,
    directionSign: seededSign(slotSeed, 47),
    worldPosition,
    seed: slotSeed,
    priority,
    sectorKey: "crosswalk-demand",
    spawnReason: "crosswalk-demand",
    crosswalkId: crosswalk.id,
    crosswalkSide: side,
    crosswalk,
    preferredBehavior:
      crosswalk.signalPhase === "walk" ? "wait-crossing" : "cross-wait",
    preferredGroupKind: getDemandGroupKind(crosswalk, slotSeed),
    forceSolo: crosswalk.kind !== "commercial" && slotIndex % 4 !== 0,
    crowdPressure: clamp(crosswalk.pedestrianDemand, 0.4, 1.8),
  };
}

function getCrosswalkTargetCount(
  crosswalk: HomeDriveCrosswalk,
  minPedestriansPerCrosswalk: number,
): number {
  const demand = clamp(crosswalk.pedestrianDemand, 0.45, 2.2);
  const kindMultiplier =
    crosswalk.kind === "commercial"
      ? 1.45
      : crosswalk.kind === "school"
        ? 1.25
        : crosswalk.kind === "avenue-zebra"
          ? 1.18
          : 1;

  return Math.max(
    2,
    Math.round(minPedestriansPerCrosswalk * demand * kindMultiplier),
  );
}

function getVisibleCrosswalks(
  crosswalks: HomeDriveCrosswalkRuntimeState | undefined,
  activeCenter: HomeDriveVector2,
  searchRadiusMeters: number,
): readonly HomeDriveCrosswalk[] {
  if (!crosswalks || crosswalks.crosswalks.length <= 0) {
    return [];
  }

  const radiusSquared = searchRadiusMeters * searchRadiusMeters;

  return crosswalks.crosswalks
    .filter((crosswalk) => {
      return getDistanceSquared(crosswalk.position, activeCenter) <= radiusSquared;
    })
    .sort((first, second) => {
      return (
        getDistanceSquared(first.position, activeCenter) -
        getDistanceSquared(second.position, activeCenter)
      );
    });
}

export function createHomeDrivePedestrianCrosswalkDemandSlots(
  options: HomeDrivePedestrianCrosswalkDemandOptions,
): HomeDrivePedestrianCrosswalkDemandResult {
  const searchRadiusMeters = clamp(
    options.searchRadiusMeters ?? DEFAULT_CROSSWALK_SEARCH_RADIUS_METERS,
    90,
    1200,
  );
  const minPedestriansPerCrosswalk = clamp(
    options.minPedestriansPerCrosswalk ?? DEFAULT_MIN_PEDESTRIANS_PER_CROSSWALK,
    1,
    32,
  );
  const maxSlots = Math.max(
    0,
    Math.floor(options.maxSlots ?? DEFAULT_MAX_CROSSWALK_SLOTS),
  );

  if (
    maxSlots <= 0 ||
    options.zones.length <= 0 ||
    !options.crosswalks ||
    options.crosswalks.crosswalks.length <= 0
  ) {
    return {
      slots: [],
      visibleCrosswalkIds: [],
      currentDemandCount: 0,
      targetDemandCount: 0,
      deficitDemandCount: 0,
    };
  }

  const visibleCrosswalks = getVisibleCrosswalks(
    options.crosswalks,
    options.activeCenter,
    searchRadiusMeters,
  );

  const slots: HomeDrivePedestrianCrosswalkDemandSlot[] = [];
  let currentDemandCount = 0;
  let targetDemandCount = 0;

  for (const crosswalk of visibleCrosswalks) {
    if (slots.length >= maxSlots) {
      break;
    }

    const targetForCrosswalk = getCrosswalkTargetCount(
      crosswalk,
      minPedestriansPerCrosswalk,
    );
    const perSideTarget = Math.max(1, Math.ceil(targetForCrosswalk / 2));
    targetDemandCount += targetForCrosswalk;

    for (const crosswalkSide of [-1, 1] as const) {
      if (slots.length >= maxSlots) {
        break;
      }

      const sidewalkSide = getHomeDrivePedestrianSideForCrosswalkSide(crosswalkSide);
      const zone = getHomeDrivePedestrianZoneBySegmentAndSide(
        options.zones,
        crosswalk.segmentId,
        sidewalkSide,
      );

      if (!zone) {
        continue;
      }

      const nearCount = getAgentsNearCrosswalkSideCount(
        options.agents,
        crosswalk,
        crosswalkSide,
        24,
      );
      currentDemandCount += nearCount;

      const deficit = Math.max(0, perSideTarget - nearCount);
      const crosswalkPriority =
        getCrosswalkForwardPriority(
          crosswalk,
          options.activeCenter,
          options.activeHeadingRad,
        ) *
        clamp(1 - getDistanceMeters(crosswalk.position, options.activeCenter) / searchRadiusMeters, 0.08, 1) *
        clamp(crosswalk.pedestrianDemand, 0.6, 2.1);

      for (let index = 0; index < deficit && slots.length < maxSlots; index += 1) {
        const slotSeed = createHomeDrivePedestrianSeed(
          crosswalk.id,
          options.seed ?? 0,
          Math.floor((options.elapsedSeconds ?? 0) * 10),
          crosswalkSide,
          index,
        );

        slots.push(
          createCrosswalkDemandSlot(
            crosswalk,
            zone,
            crosswalkSide,
            index,
            deficit,
            crosswalkPriority + index * 0.0001,
            slotSeed,
          ),
        );
      }
    }
  }

  return {
    slots: slots.sort((first, second) => second.priority - first.priority),
    visibleCrosswalkIds: visibleCrosswalks.map((crosswalk) => crosswalk.id),
    currentDemandCount,
    targetDemandCount,
    deficitDemandCount: Math.max(0, targetDemandCount - currentDemandCount),
  };
}
