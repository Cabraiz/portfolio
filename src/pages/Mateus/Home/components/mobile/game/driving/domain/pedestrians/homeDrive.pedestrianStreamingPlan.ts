// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianStreamingPlan.ts

import type { HomeDriveVector2 } from "../homeDrive.types";
import {
  createHomeDrivePedestrianSeed,
  seededRange,
  seededSign,
} from "./homeDrive.pedestrianRandom";
import {
  getHomeDrivePedestrianPointOnSidewalk,
} from "./homeDrive.pedestrianSidewalks";
import type {
  HomeDrivePedestrianAgent,
  HomeDrivePedestrianSidewalkZone,
} from "./homeDrive.pedestrians.types";
import { createHomeDrivePedestrianCrosswalkDemandSlots } from "./homeDrive.pedestrianCrosswalkDemand";
import type {
  HomeDrivePedestrianStreamingOptions,
  HomeDrivePedestrianStreamingPlan,
  HomeDrivePedestrianStreamingSector,
  HomeDrivePedestrianStreamingSectorCount,
  HomeDrivePedestrianStreamingSectorKey,
  HomeDrivePedestrianStreamingSectorTarget,
  HomeDrivePedestrianStreamingSlot,
} from "./homeDrive.pedestrianStreaming.types";

const DEFAULT_POPULATE_RADIUS_METERS = 420;
const DEFAULT_LOCAL_ZONE_SEARCH_RADIUS_METERS = 560;
const DEFAULT_FRONT_LOOKAHEAD_METERS = 540;
const DEFAULT_FRONT_LOOKAHEAD_SPEED_MULTIPLIER = 10;
const DEFAULT_SIDE_RADIUS_METERS = 320;
const DEFAULT_REAR_RADIUS_METERS = 180;
const DEFAULT_MAX_SPAWN_PER_REFRESH = 140;
const DEFAULT_MAX_SPAWN_PER_SECTOR_REFRESH = 56;

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

function getHighSpeedStreamingIntensity(speedMps: number): number {
  return clamp((speedMps - 22) / 18, 0, 1);
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

function getRightVector(heading: HomeDriveVector2): HomeDriveVector2 {
  return {
    x: heading.z,
    z: -heading.x,
  };
}

function dot(
  first: Readonly<{ x: number; z: number }>,
  second: Readonly<{ x: number; z: number }>,
): number {
  return first.x * second.x + first.z * second.z;
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

function subtract(
  first: Readonly<{ x: number; z: number }>,
  second: Readonly<{ x: number; z: number }>,
): HomeDriveVector2 {
  return {
    x: first.x - second.x,
    z: first.z - second.z,
  };
}

function addScaled(
  point: HomeDriveVector2,
  vector: HomeDriveVector2,
  scale: number,
): HomeDriveVector2 {
  return {
    x: point.x + vector.x * scale,
    z: point.z + vector.z * scale,
  };
}

function projectPointOnZoneProgress(
  point: HomeDriveVector2,
  zone: HomeDrivePedestrianSidewalkZone,
): number {
  const dx = zone.to.x - zone.from.x;
  const dz = zone.to.z - zone.from.z;
  const lengthSquared = dx * dx + dz * dz;

  if (lengthSquared <= 0.000001) {
    return 0.5;
  }

  const relativeX = point.x - zone.from.x;
  const relativeZ = point.z - zone.from.z;

  return clamp01((relativeX * dx + relativeZ * dz) / lengthSquared);
}

function getPointCoordinatesInCarFrame(
  point: HomeDriveVector2,
  activeCenter: HomeDriveVector2,
  heading: HomeDriveVector2,
): Readonly<{
  forwardMeters: number;
  sideMeters: number;
  distanceMeters: number;
}> {
  const right = getRightVector(heading);
  const relative = subtract(point, activeCenter);
  const forwardMeters = dot(relative, heading);
  const sideMeters = dot(relative, right);

  return {
    forwardMeters,
    sideMeters,
    distanceMeters: Math.hypot(relative.x, relative.z),
  };
}

function createSectors(
  activeCenter: HomeDriveVector2,
  activeHeadingRad: number,
  activeSpeedMps: number,
  options: HomeDrivePedestrianStreamingOptions,
): readonly HomeDrivePedestrianStreamingSector[] {
  const heading = normalizeHeading(activeHeadingRad);
  const highSpeedIntensity = getHighSpeedStreamingIntensity(activeSpeedMps);
  const speedLookaheadMeters =
    Math.max(0, activeSpeedMps) *
    clamp(
      options.frontLookaheadSpeedMultiplier ??
        DEFAULT_FRONT_LOOKAHEAD_SPEED_MULTIPLIER,
      0,
      52,
    );
  const baseLookahead = clamp(
    options.frontLookaheadMeters ?? DEFAULT_FRONT_LOOKAHEAD_METERS,
    120,
    highSpeedIntensity > 0 ? 2200 : 1400,
  );
  const frontLookaheadMeters = baseLookahead + speedLookaheadMeters;
  const populateRadiusMeters = clamp(
    options.populateRadiusMeters ?? DEFAULT_POPULATE_RADIUS_METERS,
    90,
    1400,
  );
  const frontNearLength = Math.max(140, Math.min(populateRadiusMeters * 0.86, frontLookaheadMeters * 0.54));
  const frontFarLength = clamp(
    options.frontFarRadiusMeters ?? frontLookaheadMeters,
    frontNearLength + 80,
    highSpeedIntensity > 0 ? 2800 : 1800,
  );
  const sideRadiusMeters = clamp(
    options.sideRadiusMeters ?? DEFAULT_SIDE_RADIUS_METERS,
    80,
    highSpeedIntensity > 0 ? 1100 : 900,
  );
  const rearRadiusMeters = clamp(
    options.rearRadiusMeters ?? DEFAULT_REAR_RADIUS_METERS,
    60,
    520,
  );

  return [
    {
      key: "front-near",
      center: addScaled(activeCenter, heading, frontNearLength * 0.5),
      radiusMeters: Math.max(populateRadiusMeters * 0.74, frontNearLength),
      minForwardMeters: 0,
      maxForwardMeters: frontNearLength,
      minAbsSideMeters: 0,
      maxAbsSideMeters: populateRadiusMeters * 0.72,
      sideSign: 0,
      priority: 1 + highSpeedIntensity * 0.08,
    },
    {
      key: "front-far",
      center: addScaled(activeCenter, heading, frontNearLength + (frontFarLength - frontNearLength) * 0.5),
      radiusMeters: Math.max(220, frontFarLength - frontNearLength),
      minForwardMeters: frontNearLength * 0.72,
      maxForwardMeters: frontFarLength,
      minAbsSideMeters: 0,
      maxAbsSideMeters: populateRadiusMeters * 0.8,
      sideSign: 0,
      priority: 0.86 + highSpeedIntensity * 0.22,
    },
    {
      key: "left-sidewalk",
      center: activeCenter,
      radiusMeters: sideRadiusMeters,
      minForwardMeters: -rearRadiusMeters * 0.25,
      maxForwardMeters: frontNearLength * 0.72,
      minAbsSideMeters: 18,
      maxAbsSideMeters: sideRadiusMeters,
      sideSign: -1,
      priority: 0.74,
    },
    {
      key: "right-sidewalk",
      center: activeCenter,
      radiusMeters: sideRadiusMeters,
      minForwardMeters: -rearRadiusMeters * 0.25,
      maxForwardMeters: frontNearLength * 0.72,
      minAbsSideMeters: 18,
      maxAbsSideMeters: sideRadiusMeters,
      sideSign: 1,
      priority: 0.74,
    },
    {
      key: "rear-buffer",
      center: addScaled(activeCenter, heading, -rearRadiusMeters * 0.42),
      radiusMeters: rearRadiusMeters,
      minForwardMeters: -rearRadiusMeters,
      maxForwardMeters: 0,
      minAbsSideMeters: 0,
      maxAbsSideMeters: sideRadiusMeters * 0.66,
      sideSign: 0,
      priority: 0.3 - highSpeedIntensity * 0.08,
    },
    {
      key: "crosswalk-demand",
      center: addScaled(activeCenter, heading, frontNearLength * 0.45),
      radiusMeters: clamp(options.crosswalkSearchRadiusMeters ?? frontNearLength, 100, 1200),
      minForwardMeters: -rearRadiusMeters * 0.18,
      maxForwardMeters: frontFarLength,
      minAbsSideMeters: 0,
      maxAbsSideMeters: populateRadiusMeters,
      sideSign: 0,
      priority: 0.96,
    },
  ];
}

function getSectorTargetCount(
  key: HomeDrivePedestrianStreamingSectorKey,
  options: HomeDrivePedestrianStreamingOptions,
  activeSpeedMps: number,
): number {
  const highSpeedIntensity = getHighSpeedStreamingIntensity(activeSpeedMps);

  switch (key) {
    case "front-near":
      return Math.max(
        0,
        Math.floor((options.minFrontPedestrians ?? 92) * (1 + highSpeedIntensity * 0.18)),
      );

    case "front-far":
      return Math.max(
        0,
        Math.floor((options.minFarFrontPedestrians ?? 56) * (1 + highSpeedIntensity * 0.58)),
      );

    case "left-sidewalk":
    case "right-sidewalk":
      return Math.max(
        0,
        Math.floor((options.minSideSectorPedestrians ?? 34) * (1 + highSpeedIntensity * 0.08)),
      );

    case "rear-buffer":
      return Math.max(
        0,
        Math.floor((options.minRearBufferPedestrians ?? 18) * (1 - highSpeedIntensity * 0.18)),
      );

    case "crosswalk-demand":
      return Math.max(0, Math.floor(options.minCrosswalkPedestrians ?? 26));

    default:
      return 0;
  }
}

export function getHomeDrivePedestrianStreamingSectorForPoint(
  point: HomeDriveVector2,
  sectors: readonly HomeDrivePedestrianStreamingSector[],
  activeCenter: HomeDriveVector2,
  activeHeadingRad = 0,
): HomeDrivePedestrianStreamingSectorKey | null {
  const heading = normalizeHeading(activeHeadingRad);
  const coordinates = getPointCoordinatesInCarFrame(point, activeCenter, heading);

  let bestSector: HomeDrivePedestrianStreamingSector | null = null;
  let bestPriority = -Infinity;

  for (const sector of sectors) {
    const sideMatches =
      sector.sideSign === 0 ||
      (sector.sideSign === -1 && coordinates.sideMeters < 0) ||
      (sector.sideSign === 1 && coordinates.sideMeters > 0);
    const absSide = Math.abs(coordinates.sideMeters);

    if (!sideMatches) {
      continue;
    }

    if (
      coordinates.forwardMeters < sector.minForwardMeters ||
      coordinates.forwardMeters > sector.maxForwardMeters ||
      absSide < sector.minAbsSideMeters ||
      absSide > sector.maxAbsSideMeters
    ) {
      continue;
    }

    const distanceToSectorCenter = getDistanceMeters(point, sector.center);

    if (distanceToSectorCenter > sector.radiusMeters) {
      continue;
    }

    const distancePriority = 1 - clamp(distanceToSectorCenter / Math.max(1, sector.radiusMeters), 0, 1);
    const priority = sector.priority + distancePriority * 0.18;

    if (priority > bestPriority) {
      bestSector = sector;
      bestPriority = priority;
    }
  }

  return bestSector?.key ?? null;
}

function countAgentsBySector(
  agents: readonly HomeDrivePedestrianAgent[],
  sectors: readonly HomeDrivePedestrianStreamingSector[],
  activeCenter: HomeDriveVector2,
  activeHeadingRad: number,
): Readonly<Record<HomeDrivePedestrianStreamingSectorKey, number>> {
  const counts: Record<HomeDrivePedestrianStreamingSectorKey, number> = {
    "front-near": 0,
    "front-far": 0,
    "left-sidewalk": 0,
    "right-sidewalk": 0,
    "rear-buffer": 0,
    "crosswalk-demand": 0,
  };

  for (const agent of agents) {
    if (agent.crosswalkId) {
      counts["crosswalk-demand"] += 1;
    }

    const sectorKey = getHomeDrivePedestrianStreamingSectorForPoint(
      agent.position,
      sectors,
      activeCenter,
      activeHeadingRad,
    );

    if (sectorKey) {
      counts[sectorKey] += 1;
    }
  }

  return counts;
}

function getZonesForSector(
  zones: readonly HomeDrivePedestrianSidewalkZone[],
  sector: HomeDrivePedestrianStreamingSector,
  activeCenter: HomeDriveVector2,
  activeHeadingRad: number,
  searchRadiusMeters: number,
): readonly HomeDrivePedestrianSidewalkZone[] {
  const heading = normalizeHeading(activeHeadingRad);
  const searchRadiusSquared = searchRadiusMeters * searchRadiusMeters;

  return zones
    .filter((zone) => {
      if (getDistanceSquared(zone.center, activeCenter) > searchRadiusSquared) {
        return false;
      }

      return (
        getHomeDrivePedestrianStreamingSectorForPoint(
          zone.center,
          [sector],
          activeCenter,
          activeHeadingRad,
        ) !== null
      );
    })
    .sort((first, second) => {
      const firstCoords = getPointCoordinatesInCarFrame(
        first.center,
        activeCenter,
        heading,
      );
      const secondCoords = getPointCoordinatesInCarFrame(
        second.center,
        activeCenter,
        heading,
      );
      const firstForwardScore = clamp(firstCoords.forwardMeters / Math.max(1, sector.maxForwardMeters), -1, 1);
      const secondForwardScore = clamp(secondCoords.forwardMeters / Math.max(1, sector.maxForwardMeters), -1, 1);
      const firstDistance = getDistanceMeters(first.center, sector.center);
      const secondDistance = getDistanceMeters(second.center, sector.center);

      return (
        secondForwardScore - firstForwardScore ||
        firstDistance - secondDistance ||
        second.density - first.density
      );
    });
}

function createSlotForZone(
  zone: HomeDrivePedestrianSidewalkZone,
  sector: HomeDrivePedestrianStreamingSector,
  activeCenter: HomeDriveVector2,
  index: number,
  totalForSector: number,
  seed: number,
): HomeDrivePedestrianStreamingSlot {
  const projectedProgress = projectPointOnZoneProgress(sector.center, zone);
  const slotSeed = createHomeDrivePedestrianSeed(
    zone.id,
    seed,
    index,
    totalForSector,
    sector.key.length,
  );
  const spreadSlots = Math.max(1, totalForSector);
  const normalizedIndex = spreadSlots <= 1 ? 0.5 : index / (spreadSlots - 1);
  const localSpreadMeters = Math.min(40, Math.max(8, zone.lengthMeters * 0.18));
  const progressJitter =
    ((normalizedIndex - 0.5) * localSpreadMeters) / Math.max(1, zone.lengthMeters) +
    seededRange(slotSeed, 23, -0.035, 0.035);
  const progress = clamp01(projectedProgress + progressJitter);
  const lateralOffsetMeters = seededRange(
    slotSeed,
    31,
    -zone.widthMeters * 0.38,
    zone.widthMeters * 0.38,
  );
  const worldPosition = getHomeDrivePedestrianPointOnSidewalk(
    zone,
    progress,
    lateralOffsetMeters,
  );
  const distanceToSectorCenter = getDistanceMeters(worldPosition, sector.center);
  const densityPriority = clamp(zone.density, 0.1, 2.2) * 0.12;
  const priority =
    sector.priority +
    densityPriority +
    (1 - clamp(distanceToSectorCenter / Math.max(1, sector.radiusMeters), 0, 1)) *
      0.42;

  return {
    id: `stream:${sector.key}:${zone.id}:${index}`,
    zone,
    zoneId: zone.id,
    segmentId: zone.segmentId,
    side: zone.side,
    progress,
    lateralOffsetMeters,
    directionSign: seededSign(slotSeed, 37),
    worldPosition,
    seed: slotSeed,
    priority,
    sectorKey: sector.key,
    spawnReason:
      sector.key === "front-near" || sector.key === "front-far"
        ? "front-lookahead"
        : sector.key === "rear-buffer"
          ? "rear-buffer"
          : "sidewalk-stream",
    preferredBehavior:
      zone.roadKind === "commercial" && index % 4 === 0 ? "shop-walk" : "walk",
    preferredGroupKind:
      zone.roadKind === "commercial" && index % 5 === 0 ? "shopper" : "solo",
    forceSolo: index % 6 !== 0,
    crowdPressure: clamp(zone.density, 0.25, 1.85),
  };
}

function createSlotsForSector(
  target: HomeDrivePedestrianStreamingSectorTarget,
  zones: readonly HomeDrivePedestrianSidewalkZone[],
  options: HomeDrivePedestrianStreamingOptions,
): readonly HomeDrivePedestrianStreamingSlot[] {
  if (target.maxSpawnCount <= 0 || zones.length <= 0) {
    return [];
  }

  const slots: HomeDrivePedestrianStreamingSlot[] = [];

  for (let index = 0; index < target.maxSpawnCount; index += 1) {
    const zone = zones[index % zones.length];

    slots.push(
      createSlotForZone(
        zone,
        target.sector,
        options.activeCenter,
        index,
        target.maxSpawnCount,
        options.seed ?? 0,
      ),
    );
  }

  return slots;
}

function createSectorTargets(
  sectors: readonly HomeDrivePedestrianStreamingSector[],
  counts: Readonly<Record<HomeDrivePedestrianStreamingSectorKey, number>>,
  options: HomeDrivePedestrianStreamingOptions,
  activeSpeedMps: number,
): readonly HomeDrivePedestrianStreamingSectorTarget[] {
  const maxSpawnPerSectorRefresh = Math.max(
    0,
    Math.floor(
      options.maxSpawnPerSectorRefresh ?? DEFAULT_MAX_SPAWN_PER_SECTOR_REFRESH,
    ),
  );

  const highSpeedIntensity = getHighSpeedStreamingIntensity(activeSpeedMps);

  return sectors.map((sector) => {
    const targetCount = getSectorTargetCount(sector.key, options, activeSpeedMps);
    const currentCount = counts[sector.key] ?? 0;
    const deficitCount = Math.max(0, targetCount - currentCount);
    const sectorSpawnBoost =
      sector.key === "front-far"
        ? 1 + highSpeedIntensity * 0.82
        : sector.key === "front-near"
          ? 1 + highSpeedIntensity * 0.45
          : sector.key === "rear-buffer"
            ? 1 - highSpeedIntensity * 0.2
            : 1 + highSpeedIntensity * 0.08;

    return {
      sector,
      targetCount,
      currentCount,
      deficitCount,
      maxSpawnCount: Math.min(
        deficitCount,
        Math.max(0, Math.ceil(maxSpawnPerSectorRefresh * sectorSpawnBoost)),
      ),
    };
  });
}

function getCandidateZoneIds(
  zones: readonly HomeDrivePedestrianSidewalkZone[],
): readonly string[] {
  return Array.from(new Set(zones.map((zone) => zone.id))).sort((first, second) =>
    first.localeCompare(second),
  );
}

export function createHomeDrivePedestrianStreamingPlan(
  options: HomeDrivePedestrianStreamingOptions,
): HomeDrivePedestrianStreamingPlan {
  const activeHeadingRad = options.activeHeadingRad ?? 0;
  const activeSpeedMps = Math.max(0, options.activeSpeedMps ?? 0);
  const maxSpawnPerRefresh = Math.max(
    0,
    Math.floor(options.maxSpawnPerRefresh ?? DEFAULT_MAX_SPAWN_PER_REFRESH),
  );

  if (maxSpawnPerRefresh <= 0 || options.zones.length <= 0) {
    return {
      id: `ped-stream-empty:${Math.round(options.activeCenter.x)}:${Math.round(options.activeCenter.z)}`,
      activeCenter: options.activeCenter,
      activeHeadingRad,
      activeSpeedMps,
      sectors: [],
      sectorTargets: [],
      sectorCounts: [],
      candidateZoneIds: [],
      spawnSlots: [],
      crosswalkDemandSlots: [],
      totalCurrentCount: options.agents.length,
      totalDeficitCount: 0,
      totalSpawnBudget: 0,
    };
  }

  const sectors = createSectors(
    options.activeCenter,
    activeHeadingRad,
    activeSpeedMps,
    options,
  );
  const counts = countAgentsBySector(
    options.agents,
    sectors,
    options.activeCenter,
    activeHeadingRad,
  );
  const sectorTargets = createSectorTargets(sectors, counts, options, activeSpeedMps);
  const localZoneSearchRadiusMeters = clamp(
    options.localZoneSearchRadiusMeters ??
      DEFAULT_LOCAL_ZONE_SEARCH_RADIUS_METERS,
    120,
    1800,
  );

  const regularSlots: HomeDrivePedestrianStreamingSlot[] = [];
  const collectedCandidateZones: HomeDrivePedestrianSidewalkZone[] = [];

  for (const target of sectorTargets) {
    if (
      target.sector.key === "crosswalk-demand" ||
      target.maxSpawnCount <= 0
    ) {
      continue;
    }

    const sectorZones = getZonesForSector(
      options.zones,
      target.sector,
      options.activeCenter,
      activeHeadingRad,
      localZoneSearchRadiusMeters,
    );
    collectedCandidateZones.push(...sectorZones);
    regularSlots.push(...createSlotsForSector(target, sectorZones, options));
  }

  const crosswalkTarget = sectorTargets.find((target) => {
    return target.sector.key === "crosswalk-demand";
  });
  const crosswalkDemand = createHomeDrivePedestrianCrosswalkDemandSlots({
    zones: options.zones,
    agents: options.agents,
    crosswalks: options.crosswalks,
    activeCenter: options.activeCenter,
    activeHeadingRad,
    activeSpeedMps,
    searchRadiusMeters:
      options.crosswalkSearchRadiusMeters ??
      crosswalkTarget?.sector.radiusMeters ??
      DEFAULT_POPULATE_RADIUS_METERS,
    minPedestriansPerCrosswalk: Math.max(
      2,
      Math.round((options.minCrosswalkPedestrians ?? 26) / 4),
    ),
    maxSlots: Math.min(
      crosswalkTarget?.maxSpawnCount ?? 0,
      Math.max(0, options.maxCrosswalkSpawnPerRefresh ?? 44),
    ),
    seed: options.seed,
    elapsedSeconds: options.elapsedSeconds,
  });

  const allSlots = [...regularSlots, ...crosswalkDemand.slots]
    .sort((first, second) => second.priority - first.priority)
    .slice(0, maxSpawnPerRefresh);

  const sectorCounts: readonly HomeDrivePedestrianStreamingSectorCount[] =
    sectorTargets.map((target) => {
      return {
        sectorKey: target.sector.key,
        currentCount:
          target.sector.key === "crosswalk-demand"
            ? Math.max(target.currentCount, crosswalkDemand.currentDemandCount)
            : target.currentCount,
        targetCount:
          target.sector.key === "crosswalk-demand"
            ? Math.max(target.targetCount, crosswalkDemand.targetDemandCount)
            : target.targetCount,
        deficitCount:
          target.sector.key === "crosswalk-demand"
            ? Math.max(target.deficitCount, crosswalkDemand.deficitDemandCount)
            : target.deficitCount,
      };
    });

  const totalDeficitCount = sectorCounts.reduce((total, item) => {
    return total + item.deficitCount;
  }, 0);

  return {
    id: `ped-stream:${Math.round(options.activeCenter.x)}:${Math.round(options.activeCenter.z)}:${Math.round(activeHeadingRad * 1000)}:${Math.round(activeSpeedMps * 10)}`,
    activeCenter: options.activeCenter,
    activeHeadingRad,
    activeSpeedMps,
    sectors,
    sectorTargets,
    sectorCounts,
    candidateZoneIds: getCandidateZoneIds(collectedCandidateZones),
    spawnSlots: allSlots,
    crosswalkDemandSlots: crosswalkDemand.slots,
    totalCurrentCount: options.agents.length,
    totalDeficitCount,
    totalSpawnBudget: allSlots.length,
  };
}

export function hasHomeDrivePedestrianStreamingDeficit(
  plan: HomeDrivePedestrianStreamingPlan,
): boolean {
  return plan.totalDeficitCount > 0 && plan.totalSpawnBudget > 0;
}
