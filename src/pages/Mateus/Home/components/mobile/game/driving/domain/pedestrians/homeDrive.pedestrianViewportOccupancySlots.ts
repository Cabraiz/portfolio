// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianViewportOccupancySlots.ts

import type { HomeDriveVector2 } from "../homeDrive.types";
import {
  getHomeDrivePedestrianHeadingRadians,
  getHomeDrivePedestrianPointOnSidewalk,
} from "./homeDrive.pedestrianSidewalks";
import type { HomeDrivePedestrianViewportOccupancyBand } from "./homeDrive.pedestrianViewportOccupancy.types";
import {
  createHomeDrivePedestrianViewportEntryGateConfig,
  getHomeDrivePedestrianViewportEntryGateResult,
} from "./homeDrive.pedestrianViewportEntryGates";
import type {
  HomeDrivePedestrianViewportOccupancySlot,
  HomeDrivePedestrianViewportOccupancySlotOptions,
  HomeDrivePedestrianViewportOccupancySlotResult,
} from "./homeDrive.pedestrianViewportOccupancySlots.types";
import type { HomeDrivePedestrianSidewalkZone } from "./homeDrive.pedestrians.types";

const EMPTY_COUNTS = Object.freeze({
  "visible-near": 0,
  "visible-mid": 0,
  "visible-far": 0,
  "side-left": 0,
  "side-right": 0,
});

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

function hashString(value: string): number {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function seeded01(seed: number, salt: number): number {
  const value = Math.sin((seed + 1) * 12.9898 + (salt + 1) * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function getForwardVector(headingRad: number): HomeDriveVector2 {
  return {
    x: Math.sin(headingRad),
    z: Math.cos(headingRad),
  };
}

function getRightVector(headingRad: number): HomeDriveVector2 {
  return {
    x: Math.cos(headingRad),
    z: -Math.sin(headingRad),
  };
}

function getPointFromFrame(
  center: HomeDriveVector2,
  headingRad: number,
  forwardMeters: number,
  lateralMeters: number,
): HomeDriveVector2 {
  const forward = getForwardVector(headingRad);
  const right = getRightVector(headingRad);

  return {
    x: center.x + forward.x * forwardMeters + right.x * lateralMeters,
    z: center.z + forward.z * forwardMeters + right.z * lateralMeters,
  };
}

function getFrame(
  point: HomeDriveVector2,
  center: HomeDriveVector2,
  headingRad: number,
): Readonly<{
  forwardMeters: number;
  lateralMeters: number;
  distanceMeters: number;
}> {
  const forward = getForwardVector(headingRad);
  const right = getRightVector(headingRad);
  const dx = point.x - center.x;
  const dz = point.z - center.z;
  const forwardMeters = dx * forward.x + dz * forward.z;
  const lateralMeters = dx * right.x + dz * right.z;

  return {
    forwardMeters,
    lateralMeters,
    distanceMeters: Math.hypot(dx, dz),
  };
}

function getNearestZone(
  zones: readonly HomeDrivePedestrianSidewalkZone[],
  target: HomeDriveVector2,
): HomeDrivePedestrianSidewalkZone | null {
  if (zones.length <= 0) {
    return null;
  }

  return [...zones].sort((first, second) => {
    const firstCenter = {
      x: (first.from.x + first.to.x) * 0.5,
      z: (first.from.z + first.to.z) * 0.5,
    };
    const secondCenter = {
      x: (second.from.x + second.to.x) * 0.5,
      z: (second.from.z + second.to.z) * 0.5,
    };
    const firstDistance = Math.hypot(firstCenter.x - target.x, firstCenter.z - target.z);
    const secondDistance = Math.hypot(secondCenter.x - target.x, secondCenter.z - target.z);

    if (Math.abs(firstDistance - secondDistance) > 0.0001) {
      return firstDistance - secondDistance;
    }

    return second.lengthMeters - first.lengthMeters;
  })[0] ?? null;
}

function createSlotForBandIndex(params: Readonly<{
  band: HomeDrivePedestrianViewportOccupancyBand;
  slotIndex: number;
  bandSlotCount: number;
  zones: readonly HomeDrivePedestrianSidewalkZone[];
  activeCenter: HomeDriveVector2;
  activeHeadingRad: number;
  seed: number;
}>): HomeDrivePedestrianViewportOccupancySlot | null {
  const bandSlotCount = Math.max(1, params.bandSlotCount);
  const normalized = (params.slotIndex + 0.5) / bandSlotCount;
  const salt = hashString(`${params.band.key}:${params.slotIndex}:${params.seed}`);
  const forwardMeters =
    params.band.minForwardMeters +
    (params.band.maxForwardMeters - params.band.minForwardMeters) * normalized;
  const lateralSign =
    params.band.preferredLateralSign ?? (params.slotIndex % 2 === 0 ? -1 : 1);
  const lateralSpread = params.band.maxAbsLateralMeters - params.band.minAbsLateralMeters;
  const lateralMeters =
    lateralSign *
    (params.band.minAbsLateralMeters + lateralSpread * seeded01(params.seed, salt));
  const targetPosition = getPointFromFrame(
    params.activeCenter,
    params.activeHeadingRad,
    forwardMeters,
    lateralMeters,
  );
  const zone = getNearestZone(params.zones, targetPosition);

  if (!zone) {
    return null;
  }

  const directionSign: 1 | -1 = params.slotIndex % 2 === 0 ? 1 : -1;
  const progress = clamp(0.06 + 0.88 * seeded01(params.seed, salt + 17), 0.04, 0.96);
  const sidewalkPosition = getHomeDrivePedestrianPointOnSidewalk(zone, progress, 0);
  const sidewalkFrame = getFrame(sidewalkPosition, params.activeCenter, params.activeHeadingRad);
  const isSidewalkInsideBand =
    sidewalkFrame.forwardMeters >= params.band.minForwardMeters &&
    sidewalkFrame.forwardMeters <= params.band.maxForwardMeters &&
    Math.abs(sidewalkFrame.lateralMeters) >= params.band.minAbsLateralMeters * 0.45 &&
    Math.abs(sidewalkFrame.lateralMeters) <= params.band.maxAbsLateralMeters * 1.4;

  /*
   * Se a calçada real mais próxima não cai no band visual, usamos a posição
   * sintética do band para garantir que a pessoa apareça no raio da câmera.
   * O zone/side/progress continuam vinculados a uma calçada real para manter
   * comportamento, seed, heading e identidade estáveis.
   */
  const position = isSidewalkInsideBand ? sidewalkPosition : targetPosition;
  const frame = getFrame(position, params.activeCenter, params.activeHeadingRad);
  const entryGate = getHomeDrivePedestrianViewportEntryGateResult(
    {
      position,
      forwardMeters: frame.forwardMeters,
      lateralMeters: frame.lateralMeters,
      distanceMeters: frame.distanceMeters,
      viewportBand: params.band.key,
    },
    createHomeDrivePedestrianViewportEntryGateConfig({
      minForwardMeters: Math.max(70, params.band.minForwardMeters * 0.62),
      maxForwardMeters: params.band.maxForwardMeters + 120,
      centerBlockForwardMeters: Math.max(170, params.band.minForwardMeters + 34),
      centerBlockAbsLateralMeters: Math.max(54, params.band.minAbsLateralMeters * 0.72),
      sideMinAbsLateralMeters: Math.max(42, params.band.minAbsLateralMeters * 0.62),
      sideMaxAbsLateralMeters: Math.max(params.band.maxAbsLateralMeters + 80, 160),
      farEdgeMinForwardMeters: Math.max(160, params.band.maxForwardMeters - 130),
      allowRelaxedFallback: true,
    }),
  );
  const gatePenalty = entryGate.allowed ? 0 : -2800;
  const hardRejected =
    entryGate.rejectReason === "behind-camera" ||
    entryGate.rejectReason === "too-close";

  if (hardRejected) {
    return null;
  }

  return {
    id: `viewport-occupancy:${params.band.key}:${zone.id}:${params.slotIndex}:${Math.round(frame.forwardMeters)}:${Math.round(frame.lateralMeters)}`,
    zone,
    zoneId: zone.id,
    segmentId: zone.segmentId,
    side: zone.side,
    position,
    headingRad: getHomeDrivePedestrianHeadingRadians(zone, directionSign),
    progress,
    lateralOffsetMeters: clamp(
      lateralMeters * 0.03,
      -zone.widthMeters * 0.44,
      zone.widthMeters * 0.44,
    ),
    directionSign,
    forwardMeters: frame.forwardMeters,
    lateralMeters: frame.lateralMeters,
    distanceMeters: frame.distanceMeters,
    band: params.band.key,
    viewportBand: params.band.key,
    priority:
      params.band.priority * 1000 +
      entryGate.score +
      gatePenalty -
      Math.abs(frame.forwardMeters - forwardMeters) * 2.5 -
      Math.abs(Math.abs(frame.lateralMeters) - Math.abs(lateralMeters)) * 1.4,
    seed: hashString(`${params.band.key}:${zone.id}:${params.slotIndex}:${params.seed}`),
  };
}

export function createHomeDrivePedestrianViewportOccupancySlots(
  options: HomeDrivePedestrianViewportOccupancySlotOptions,
): HomeDrivePedestrianViewportOccupancySlotResult {
  const slots: HomeDrivePedestrianViewportOccupancySlot[] = [];

  for (const band of options.plan.bands) {
    for (let slotIndex = 0; slotIndex < band.targetCount; slotIndex += 1) {
      const slot = createSlotForBandIndex({
        band,
        slotIndex,
        bandSlotCount: band.targetCount,
        zones: options.zones,
        activeCenter: options.activeCenter,
        activeHeadingRad: options.activeHeadingRad,
        seed: options.seed + Math.round(options.activeSpeedMps * 10),
      });

      if (slot) {
        slots.push(slot);
      }
    }
  }

  /*
   * Fail-safe: the resident pool must never starve just because strict entry
   * gates could not find mathematically perfect sidewalks. If the strict pass
   * under-filled the plan, run a relaxed deterministic pass with a shifted seed.
   */
  if (slots.length < options.plan.totalTargetCount) {
    const existingSlotIds = new Set(slots.map((slot) => slot.id));

    for (const band of options.plan.bands) {
      for (let slotIndex = 0; slotIndex < band.targetCount; slotIndex += 1) {
        if (slots.length >= options.plan.totalTargetCount) {
          break;
        }

        const slot = createSlotForBandIndex({
          band,
          slotIndex: slotIndex + band.targetCount + 17,
          bandSlotCount: band.targetCount,
          zones: options.zones,
          activeCenter: options.activeCenter,
          activeHeadingRad: options.activeHeadingRad,
          seed: options.seed + Math.round(options.activeSpeedMps * 10) + 991,
        });

        if (slot && !existingSlotIds.has(slot.id)) {
          existingSlotIds.add(slot.id);
          slots.push(slot);
        }
      }
    }
  }

  const sortedSlots = slots.sort((first, second) => {
    if (Math.abs(first.priority - second.priority) > 0.0001) {
      return second.priority - first.priority;
    }

    return first.id.localeCompare(second.id);
  });
  const slotCountByBand = sortedSlots.reduce(
    (counts, slot) => ({
      ...counts,
      [slot.viewportBand]: counts[slot.viewportBand] + 1,
    }),
    { ...EMPTY_COUNTS },
  );

  return {
    id: [
      "viewport-occupancy-slots",
      options.plan.id,
      Math.round(options.activeCenter.x / 8),
      Math.round(options.activeCenter.z / 8),
      Math.round(options.activeHeadingRad * 100),
      sortedSlots.length,
    ].join(":"),
    slots: sortedSlots,
    slotCount: sortedSlots.length,
    slotCountByBand,
  };
}
