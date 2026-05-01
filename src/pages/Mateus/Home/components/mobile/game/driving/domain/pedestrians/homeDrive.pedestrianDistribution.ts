// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianDistribution.ts

import {
  HOME_DRIVE_PEDESTRIAN_CROWD_TUNING,
  clampHomeDrivePedestrianCrowdDensity,
  getHomeDrivePedestrianDistanceSquared,
  getHomeDrivePedestrianGenerationCellKey,
  getHomeDrivePedestrianGroupKindMultipliers,
  getHomeDrivePedestrianMaxGroupsPerZone,
  getHomeDrivePedestrianNeighborCellKeys,
  getHomeDrivePedestrianRoadDensityCap,
  getHomeDrivePedestrianRoadKindCrowdTuning,
  getHomeDrivePedestrianTargetSpacingMeters,
} from "./homeDrive.pedestrianCrowdTuning";
import {
  canAcceptHomeDrivePedestrianCornerSlot,
  classifyHomeDrivePedestrianCornerSlot,
  getHomeDrivePedestrianCornerProgressClamp,
  type HomeDrivePedestrianCornerBudgetState,
} from "./homeDrive.pedestrianCornerControl";
import {
  getHomeDrivePedestrianSpawnFocusForZone,
  normalizeHomeDrivePedestrianSpawnFocusOptions,
  shouldReserveHomeDrivePedestrianSlotForSpawnFocus,
} from "./homeDrive.pedestrianSpawnFocus";
import {
  createHomeDrivePedestrianSeed,
  seededRange,
  seededSign,
} from "./homeDrive.pedestrianRandom";
import {
  getHomeDrivePedestrianPointOnSidewalk,
  getHomeDrivePedestrianSidewalkSlotCount,
} from "./homeDrive.pedestrianSidewalks";
import type {
  HomeDrivePedestrianDistributedSlot,
  HomeDrivePedestrianDistributionOptions,
  HomeDrivePedestrianDistributionProfile,
  HomeDrivePedestrianDistributionRejectedSlot,
  HomeDrivePedestrianDistributionResult,
  HomeDrivePedestrianGroupKindBias,
  HomeDrivePedestrianZoneDistributionPlan,
} from "./homeDrive.pedestrianDistribution.types";
import type { HomeDrivePedestrianSidewalkZone } from "./homeDrive.pedestrians.types";

const DEFAULT_PEDESTRIAN_SEED = 7429;
const DEFAULT_MAX_PEDESTRIANS = 1800;

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

function normalizeProfile(
  options: HomeDrivePedestrianDistributionOptions,
): HomeDrivePedestrianDistributionProfile {
  const density = clampHomeDrivePedestrianCrowdDensity(
    options.profile?.density ??
      options.density ??
      HOME_DRIVE_PEDESTRIAN_CROWD_TUNING.generation.defaultDensity,
  );

  return {
    density,
    maxPedestrians: Math.max(
      0,
      Math.floor(
        options.profile?.maxPedestrians ??
          options.maxPedestrians ??
          DEFAULT_MAX_PEDESTRIANS,
      ),
    ),
    seed: Math.floor(options.profile?.seed ?? options.seed ?? DEFAULT_PEDESTRIAN_SEED),
    occupancyCellSizeMeters: Math.max(
      1,
      options.profile?.occupancyCellSizeMeters ??
        HOME_DRIVE_PEDESTRIAN_CROWD_TUNING.generation.occupancyCellSizeMeters,
    ),
    maxGroupsPerCell: Math.max(
      1,
      Math.floor(
        options.maxAgentsPerDistributionCell ??
          options.profile?.maxGroupsPerCell ??
          HOME_DRIVE_PEDESTRIAN_CROWD_TUNING.generation.maxGroupsPerCell,
      ),
    ),
    maxGroupsPerCellOnMainRoad: Math.max(
      1,
      Math.floor(
        options.profile?.maxGroupsPerCellOnMainRoad ??
          HOME_DRIVE_PEDESTRIAN_CROWD_TUNING.generation.maxGroupsPerCellOnMainRoad,
      ),
    ),
    minGroupDistanceMeters: Math.max(
      0,
      options.minGroupDistanceMeters ??
        options.profile?.minGroupDistanceMeters ??
        HOME_DRIVE_PEDESTRIAN_CROWD_TUNING.generation.minGroupDistanceMeters,
    ),
    minGroupDistanceBusyMeters: Math.max(
      0,
      options.profile?.minGroupDistanceBusyMeters ??
        HOME_DRIVE_PEDESTRIAN_CROWD_TUNING.generation.minGroupDistanceBusyMeters,
    ),
    minProgressGapMeters: Math.max(
      0,
      options.profile?.minProgressGapMeters ??
        HOME_DRIVE_PEDESTRIAN_CROWD_TUNING.generation.minProgressGapMeters,
    ),
    lateralLaneCount: Math.max(
      1,
      Math.floor(
        options.profile?.lateralLaneCount ??
          HOME_DRIVE_PEDESTRIAN_CROWD_TUNING.generation.lateralLaneCount,
      ),
    ),
    cornerExclusionMeters: Math.max(
      0,
      options.cornerExclusionMeters ??
        options.profile?.cornerExclusionMeters ??
        HOME_DRIVE_PEDESTRIAN_CROWD_TUNING.corner.hardExclusionMeters,
    ),
    maxCornerSlotRatio: clamp(
      options.maxCornerPedestrianRatio ??
        options.profile?.maxCornerSlotRatio ??
        HOME_DRIVE_PEDESTRIAN_CROWD_TUNING.corner.maxCornerSlotRatio,
      0,
      0.45,
    ),
  };
}

function getPlanPriority(
  zone: HomeDrivePedestrianSidewalkZone,
  density: number,
  spawnFocusPriorityBoost: number,
): number {
  const roadTuning = getHomeDrivePedestrianRoadKindCrowdTuning(zone.roadKind);
  const mainBoost = zone.tags.includes("main") ? 38 : 0;
  const fastPenalty = zone.tags.includes("fast") ? -12 : 0;

  return (
    zone.lengthMeters * 0.04 +
    zone.density * 34 +
    density * 8 +
    roadTuning.priorityBoost +
    mainBoost +
    fastPenalty +
    spawnFocusPriorityBoost
  );
}

export function createHomeDrivePedestrianZoneDistributionPlans(
  options: HomeDrivePedestrianDistributionOptions,
): readonly HomeDrivePedestrianZoneDistributionPlan[] {
  const profile = normalizeProfile(options);

  return options.zones
    .map((zone): HomeDrivePedestrianZoneDistributionPlan => {
      const roadDensityCap = getHomeDrivePedestrianRoadDensityCap(zone.roadKind);
      const density = clamp(zone.density * profile.density, 0, roadDensityCap);
      const targetSpacingMeters = getHomeDrivePedestrianTargetSpacingMeters(
        zone.roadKind,
      );
      const rawSlotCount = getHomeDrivePedestrianSidewalkSlotCount(zone, density);
      const maxGroups = Math.max(
        0,
        Math.min(
          getHomeDrivePedestrianMaxGroupsPerZone(zone.roadKind),
          Math.floor(
            (zone.lengthMeters / Math.max(1, targetSpacingMeters)) *
              Math.max(0.25, density),
          ),
        ),
      );
      const spawnFocus = getHomeDrivePedestrianSpawnFocusForZone(zone, {
        center: options.initialFocusCenter,
        radiusMeters: options.initialFocusRadiusMeters,
        pedestrianRatio: options.initialFocusPedestrianRatio,
        maxPedestrians: options.maxInitialFocusPedestrians,
      });

      return {
        zone,
        zoneId: zone.id,
        segmentId: zone.segmentId,
        side: zone.side,
        roadKind: zone.roadKind,
        density,
        targetSpacingMeters,
        slotCount: Math.max(0, Math.min(rawSlotCount, maxGroups)),
        maxGroups,
        priority: getPlanPriority(zone, density, spawnFocus.priorityBoost),
        spawnFocusWeight: spawnFocus.weight,
        spawnFocusPriorityBoost: spawnFocus.priorityBoost,
      };
    })
    .filter((plan) => plan.slotCount > 0)
    .sort((first, second) => {
      if (Math.abs(second.priority - first.priority) > 0.0001) {
        return second.priority - first.priority;
      }

      return second.zone.lengthMeters - first.zone.lengthMeters;
    });
}

function getDistributedProgress(
  plan: HomeDrivePedestrianZoneDistributionPlan,
  slotIndex: number,
  seed: number,
  options: HomeDrivePedestrianDistributionOptions,
): number {
  const zone = plan.zone;
  const slotCount = Math.max(1, plan.slotCount);
  const baseRatio = (slotIndex + 0.5) / slotCount;
  const progressClamp = getHomeDrivePedestrianCornerProgressClamp(zone);
  const focusPadding = options.initialFocusCenter
    ? Math.max(
        progressClamp.min,
        Math.min(0.38, HOME_DRIVE_PEDESTRIAN_CROWD_TUNING.spawnFocus.nearSlotProgressPaddingMeters / Math.max(1, zone.lengthMeters)),
      )
    : progressClamp.min;
  const minProgress = plan.spawnFocusWeight > 0.35 ? Math.min(progressClamp.min, focusPadding) : progressClamp.min;
  const maxProgress = 1 - minProgress;
  const jitter = seededRange(seed, 3101, -0.26, 0.26) / slotCount;
  const wave = Math.sin((slotIndex + 1) * 2.399963 + seed * 0.00017) * 0.12 / slotCount;

  return clamp(baseRatio + jitter + wave, minProgress, maxProgress);
}

function getDistributedLateralOffset(
  zone: HomeDrivePedestrianSidewalkZone,
  slotIndex: number,
  profile: HomeDrivePedestrianDistributionProfile,
  seed: number,
): number {
  const laneCount = Math.max(1, profile.lateralLaneCount);
  const laneIndex = Math.abs(slotIndex + seed) % laneCount;
  const centeredLane = laneCount <= 1 ? 0 : laneIndex / (laneCount - 1) - 0.5;
  const maxOffset = zone.widthMeters * 0.31;
  const laneOffset = centeredLane * maxOffset * 2;
  const jitter = seededRange(seed, 3203, -0.22, 0.22);

  return clamp(laneOffset + jitter, -zone.widthMeters * 0.38, zone.widthMeters * 0.38);
}

function getGroupKindBias(
  density: number,
  isCornerSlot: boolean,
  crowdPressure: number,
): HomeDrivePedestrianGroupKindBias {
  const multipliers = getHomeDrivePedestrianGroupKindMultipliers(density);
  const cornerPenalty = isCornerSlot ? 0.6 : 1;
  const pressureSoloBoost = 1 + crowdPressure * 0.42;
  const socialPressurePenalty = Math.max(0.16, 1 - crowdPressure * 0.64);

  return {
    solo: multipliers.solo * pressureSoloBoost,
    shopper: multipliers.shopper,
    worker: multipliers.worker,
    smoker: multipliers.smoker * cornerPenalty * socialPressurePenalty,
    couple: multipliers.couple * cornerPenalty * socialPressurePenalty,
    "adult-child": multipliers["adult-child"] * cornerPenalty * socialPressurePenalty,
    "chat-pair": multipliers["chat-pair"] * cornerPenalty * socialPressurePenalty,
  };
}

function getCellCapacity(
  plan: HomeDrivePedestrianZoneDistributionPlan,
  profile: HomeDrivePedestrianDistributionProfile,
): number {
  return plan.zone.tags.includes("main")
    ? profile.maxGroupsPerCellOnMainRoad
    : profile.maxGroupsPerCell;
}

function rejectSlot(
  rejected: HomeDrivePedestrianDistributionRejectedSlot[],
  plan: HomeDrivePedestrianZoneDistributionPlan,
  slotIndex: number,
  reason: HomeDrivePedestrianDistributionRejectedSlot["reason"],
): void {
  rejected.push({
    zoneId: plan.zoneId,
    segmentId: plan.segmentId,
    side: plan.side,
    slotIndex,
    reason,
  });
}

function hasNearbyAcceptedSlot(params: Readonly<{
  position: Readonly<{ x: number; z: number }>;
  cellKey: string;
  acceptedByCell: ReadonlyMap<string, HomeDrivePedestrianDistributedSlot[]>;
  minDistanceMeters: number;
}>): boolean {
  const minDistanceSquared = params.minDistanceMeters * params.minDistanceMeters;

  for (const neighborKey of getHomeDrivePedestrianNeighborCellKeys(params.cellKey)) {
    const neighborSlots = params.acceptedByCell.get(neighborKey) ?? [];

    for (const slot of neighborSlots) {
      if (
        getHomeDrivePedestrianDistanceSquared(slot.worldPosition, params.position) <
        minDistanceSquared
      ) {
        return true;
      }
    }
  }

  return false;
}

function createStreamingDistributedSlots(
  options: HomeDrivePedestrianDistributionOptions,
  profile: HomeDrivePedestrianDistributionProfile,
): readonly HomeDrivePedestrianDistributedSlot[] {
  const streamingSlots = options.streamingSlots ?? [];

  if (streamingSlots.length <= 0) {
    return [];
  }

  const priorityBoost = options.streamingPriorityBoost ?? 220;
  const slotCount = Math.max(1, streamingSlots.length);

  return streamingSlots.map((streamingSlot, index) => {
    const progress = clamp(streamingSlot.progress, 0.025, 0.975);
    const lateralOffsetMeters = clamp(
      streamingSlot.lateralOffsetMeters +
        seededRange(streamingSlot.seed, 3803, -0.24, 0.24),
      -streamingSlot.zone.widthMeters * 0.42,
      streamingSlot.zone.widthMeters * 0.42,
    );
    const worldPosition = getHomeDrivePedestrianPointOnSidewalk(
      streamingSlot.zone,
      progress,
      lateralOffsetMeters,
    );
    const occupancyCellKey = getHomeDrivePedestrianGenerationCellKey(
      worldPosition,
      profile.occupancyCellSizeMeters,
    );
    const crowdPressure = clamp(
      streamingSlot.crowdPressure ??
        (streamingSlot.spawnReason === "crosswalk-demand" ? 0.58 : 0.24),
      0,
      1,
    );

    return {
      id: `ped-stream-slot-${streamingSlot.id}`,
      zone: streamingSlot.zone,
      zoneId: streamingSlot.zoneId,
      segmentId: streamingSlot.segmentId,
      side: streamingSlot.side,
      slotIndex: index,
      slotCount,
      progress,
      lateralOffsetMeters,
      directionSign: streamingSlot.directionSign,
      worldPosition,
      occupancyCellKey,
      cornerCellKey: `streaming:${streamingSlot.id}`,
      groupKindBias: getGroupKindBias(
        profile.density,
        false,
        crowdPressure,
      ),
      priority:
        streamingSlot.priority +
        priorityBoost +
        (streamingSlot.spawnReason === "crosswalk-demand" ? 90 : 0),
      seed: streamingSlot.seed,
      isCornerSlot: false,
      cornerClassification: "middle",
      isInitialFocusSlot: false,
      forceSolo:
        streamingSlot.forceSolo ??
        (streamingSlot.spawnReason === "crosswalk-demand" ||
          streamingSlot.preferredGroupKind === "solo"),
      crowdPressure,
      streamingSlotId: streamingSlot.id,
      streamingSectorKey: streamingSlot.sectorKey,
      spawnReason: streamingSlot.spawnReason,
      crosswalkId: streamingSlot.crosswalkId ?? null,
      crosswalkSide: streamingSlot.crosswalkSide ?? null,
      preferredBehavior: streamingSlot.preferredBehavior,
      preferredGroupKind: streamingSlot.preferredGroupKind,
    } satisfies HomeDrivePedestrianDistributedSlot;
  });
}

export function createHomeDrivePedestrianDistributedSlots(
  options: HomeDrivePedestrianDistributionOptions,
): HomeDrivePedestrianDistributionResult {
  const profile = normalizeProfile(options);
  const plans = createHomeDrivePedestrianZoneDistributionPlans(options);
  const slots: HomeDrivePedestrianDistributedSlot[] = [];
  const rejected: HomeDrivePedestrianDistributionRejectedSlot[] = [];
  const acceptedByCell = new Map<string, HomeDrivePedestrianDistributedSlot[]>();
  const acceptedProgressByZone = new Map<string, number[]>();
  const acceptedByCornerCell = new Map<string, number>();
  const acceptedByZoneEnd = new Map<string, number>();
  const maxAcceptedSlots = Math.ceil(
    profile.maxPedestrians *
      HOME_DRIVE_PEDESTRIAN_CROWD_TUNING.generation.maxAcceptedSlotMultiplier,
  );
  const spawnFocusOptions = normalizeHomeDrivePedestrianSpawnFocusOptions({
    center: options.initialFocusCenter,
    radiusMeters: options.initialFocusRadiusMeters,
    pedestrianRatio: options.initialFocusPedestrianRatio,
    maxPedestrians: options.maxInitialFocusPedestrians,
  });
  const streamingDistributedSlots = createStreamingDistributedSlots(
    options,
    profile,
  );

  let acceptedFocusCount = 0;
  let acceptedCornerCount = 0;
  const maxSlotCount = plans.reduce(
    (maxValue, plan) => Math.max(maxValue, plan.slotCount),
    0,
  );

  for (let slotIndex = 0; slotIndex < maxSlotCount; slotIndex += 1) {
    for (const plan of plans) {
      if (slots.length >= maxAcceptedSlots || slots.length >= profile.maxPedestrians) {
        rejectSlot(rejected, plan, slotIndex, "max-pedestrians");
        continue;
      }

      if (slotIndex >= plan.slotCount) {
        continue;
      }

      const candidateSeed = createHomeDrivePedestrianSeed(
        plan.zone.id,
        profile.seed,
        slotIndex,
        plan.slotCount,
      );
      const progress = getDistributedProgress(plan, slotIndex, candidateSeed, options);
      const lateralOffsetMeters = getDistributedLateralOffset(
        plan.zone,
        slotIndex,
        profile,
        candidateSeed,
      );
      const worldPosition = getHomeDrivePedestrianPointOnSidewalk(
        plan.zone,
        progress,
        lateralOffsetMeters,
      );
      const occupancyCellKey = getHomeDrivePedestrianGenerationCellKey(
        worldPosition,
        profile.occupancyCellSizeMeters,
      );
      const corner = classifyHomeDrivePedestrianCornerSlot(
        plan.zone,
        progress,
        worldPosition,
      );
      const isCornerSlot = corner.classification !== "middle";
      const cornerBudget: HomeDrivePedestrianCornerBudgetState = {
        acceptedCornerSlots: acceptedCornerCount,
        acceptedTotalSlots: slots.length,
        acceptedByCornerCell,
        acceptedByZoneEnd,
      };

      const projectedCornerRatio = isCornerSlot
        ? (acceptedCornerCount + 1) / Math.max(1, slots.length + 1)
        : acceptedCornerCount / Math.max(1, slots.length + 1);

      if (isCornerSlot && projectedCornerRatio > profile.maxCornerSlotRatio) {
        rejectSlot(rejected, plan, slotIndex, "corner-capacity");
        continue;
      }

      if (!canAcceptHomeDrivePedestrianCornerSlot(corner, cornerBudget)) {
        rejectSlot(rejected, plan, slotIndex, "corner-capacity");
        continue;
      }

      const currentCellSlots = acceptedByCell.get(occupancyCellKey) ?? [];
      const cellCapacity = getCellCapacity(plan, profile);

      if (currentCellSlots.length >= cellCapacity) {
        rejectSlot(rejected, plan, slotIndex, "cell-capacity");
        continue;
      }

      const acceptedProgress = acceptedProgressByZone.get(plan.zoneId) ?? [];
      const minProgressGap = profile.minProgressGapMeters / Math.max(1, plan.zone.lengthMeters);
      const tooCloseByProgress = acceptedProgress.some((accepted) => {
        return Math.abs(accepted - progress) < minProgressGap;
      });

      if (tooCloseByProgress) {
        rejectSlot(rejected, plan, slotIndex, "progress-gap");
        continue;
      }

      const crowdPressure = clamp(currentCellSlots.length / Math.max(1, cellCapacity), 0, 1);
      const minDistanceMeters =
        crowdPressure > 0.45
          ? profile.minGroupDistanceBusyMeters
          : profile.minGroupDistanceMeters;

      if (
        hasNearbyAcceptedSlot({
          position: worldPosition,
          cellKey: occupancyCellKey,
          acceptedByCell,
          minDistanceMeters,
        })
      ) {
        rejectSlot(rejected, plan, slotIndex, "world-distance");
        continue;
      }

      const focus = getHomeDrivePedestrianSpawnFocusForZone(plan.zone, spawnFocusOptions);
      const reserveForFocus = shouldReserveHomeDrivePedestrianSlotForSpawnFocus(
        acceptedFocusCount,
        slots.length,
        spawnFocusOptions,
      );
      const isInitialFocusSlot = focus.enabled && focus.weight > 0.08;

      if (reserveForFocus && !isInitialFocusSlot) {
        rejectSlot(rejected, plan, slotIndex, "zone-capacity");
        continue;
      }

      const slot: HomeDrivePedestrianDistributedSlot = {
        id: `ped-slot-${plan.zone.id}-${slotIndex}-${candidateSeed}`,
        zone: plan.zone,
        zoneId: plan.zoneId,
        segmentId: plan.segmentId,
        side: plan.side,
        slotIndex,
        slotCount: plan.slotCount,
        progress,
        lateralOffsetMeters,
        directionSign: seededSign(candidateSeed, 3307),
        worldPosition,
        occupancyCellKey,
        cornerCellKey: corner.cornerCellKey,
        groupKindBias: getGroupKindBias(plan.density, isCornerSlot, crowdPressure),
        priority:
          plan.priority * corner.priorityMultiplier +
          focus.priorityBoost +
          seededRange(candidateSeed, 3319, -4, 4),
        seed: candidateSeed,
        isCornerSlot,
        cornerClassification: corner.classification,
        isInitialFocusSlot,
        forceSolo: crowdPressure > 0.62 || corner.classification === "soft-corner",
        crowdPressure,
      };

      slots.push(slot);
      acceptedByCell.set(occupancyCellKey, [...currentCellSlots, slot]);
      acceptedProgressByZone.set(plan.zoneId, [...acceptedProgress, progress]);

      if (isInitialFocusSlot) {
        acceptedFocusCount += 1;
      }

      if (isCornerSlot) {
        acceptedCornerCount += 1;
        acceptedByCornerCell.set(
          corner.cornerCellKey,
          (acceptedByCornerCell.get(corner.cornerCellKey) ?? 0) + 1,
        );
        acceptedByZoneEnd.set(
          corner.zoneEndKey,
          (acceptedByZoneEnd.get(corner.zoneEndKey) ?? 0) + 1,
        );
      }
    }
  }

  const finalSlots = [...streamingDistributedSlots, ...slots]
    .sort((first, second) => {
      if (Math.abs(second.priority - first.priority) > 0.0001) {
        return second.priority - first.priority;
      }

      return first.id.localeCompare(second.id);
    })
    .slice(0, profile.maxPedestrians);

  return {
    slots: finalSlots,
    plans,
    rejected,
    acceptedCount: finalSlots.length,
    rejectedCount: rejected.length,
    initialFocusAcceptedCount: acceptedFocusCount,
    cornerAcceptedCount: acceptedCornerCount,
  };
}
