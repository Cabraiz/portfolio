// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianResidentPoolPlacement.ts

import type { HomeDriveVector2 } from "../homeDrive.types";
import {
  getHomeDrivePedestrianHeadingRadians,
  getHomeDrivePedestrianPointOnSidewalk,
} from "./homeDrive.pedestrianSidewalks";
import type {
  HomeDrivePedestrianResidentPoolPlacementOptions,
  HomeDrivePedestrianResidentPoolPlacementResult,
} from "./homeDrive.pedestrianResidentPoolPlacement.types";
import type {
  HomeDrivePedestrianResidentPoolSlot,
  HomeDrivePedestrianResidentPoolSlotBand,
} from "./homeDrive.pedestrianResidentPool.types";
import type { HomeDrivePedestrianSidewalkZone } from "./homeDrive.pedestrians.types";

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
  const mixed = Math.sin((seed + 1) * 12.9898 + (salt + 1) * 78.233) * 43758.5453;
  return mixed - Math.floor(mixed);
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

function getFrame(
  point: HomeDriveVector2,
  center: HomeDriveVector2,
  headingRad: number,
): Readonly<{
  forwardMeters: number;
  lateralMeters: number;
  absoluteLateralMeters: number;
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
    absoluteLateralMeters: Math.abs(lateralMeters),
    distanceMeters: Math.hypot(dx, dz),
  };
}

function getBand(forwardMeters: number, config: import("./homeDrive.pedestrianResidentPool.types").HomeDrivePedestrianResidentPoolConfig): HomeDrivePedestrianResidentPoolSlotBand {
  const frontLimit = config.teleportMinForwardMeters +
    (config.teleportMaxForwardMeters - config.teleportMinForwardMeters) * 0.38;

  if (forwardMeters <= frontLimit) {
    return "front";
  }

  if (forwardMeters <= config.teleportMaxForwardMeters) {
    return "far";
  }

  return "horizon";
}

function createSlot(params: Readonly<{
  zone: HomeDrivePedestrianSidewalkZone;
  activeCenter: HomeDriveVector2;
  activeHeadingRad: number;
  slotIndex: number;
  seed: number;
  config: import("./homeDrive.pedestrianResidentPool.types").HomeDrivePedestrianResidentPoolConfig;
}>): HomeDrivePedestrianResidentPoolSlot | null {
  const { zone, activeCenter, activeHeadingRad, slotIndex, seed, config } = params;
  const zoneSeed = hashString(`${zone.id}:${slotIndex}:${seed}`);
  const progress = clamp(0.08 + seeded01(zoneSeed, 11) * 0.84, 0.06, 0.94);
  const directionSign: 1 | -1 = seeded01(zoneSeed, 17) >= 0.5 ? 1 : -1;
  const lateralOffsetMeters = clamp(
    (seeded01(zoneSeed, 23) - 0.5) * zone.widthMeters * 0.64,
    -zone.widthMeters * 0.42,
    zone.widthMeters * 0.42,
  );
  const position = getHomeDrivePedestrianPointOnSidewalk(
    zone,
    progress,
    lateralOffsetMeters,
  );
  const frame = getFrame(position, activeCenter, activeHeadingRad);

  if (
    frame.forwardMeters < config.teleportMinForwardMeters ||
    frame.forwardMeters > config.teleportHorizonMaxForwardMeters ||
    frame.absoluteLateralMeters > config.recycleSideMeters * 1.35
  ) {
    return null;
  }

  const band = getBand(frame.forwardMeters, config);
  const preferredForward =
    band === "front"
      ? config.teleportMinForwardMeters * 1.22
      : band === "far"
        ? (config.teleportMinForwardMeters + config.teleportMaxForwardMeters) * 0.5
        : (config.teleportMaxForwardMeters + config.teleportHorizonMaxForwardMeters) * 0.5;
  const priority =
    10000 -
    Math.abs(frame.forwardMeters - preferredForward) * 1.25 -
    frame.absoluteLateralMeters * 1.6 +
    zone.density * 140 +
    zone.lengthMeters * 0.08;

  return {
    id: `resident-slot:${zone.id}:${slotIndex}:${Math.round(frame.forwardMeters)}`,
    zone,
    zoneId: zone.id,
    segmentId: zone.segmentId,
    side: zone.side,
    position,
    headingRad: getHomeDrivePedestrianHeadingRadians(zone, directionSign),
    progress,
    lateralOffsetMeters,
    directionSign,
    forwardMeters: frame.forwardMeters,
    lateralMeters: frame.lateralMeters,
    distanceMeters: frame.distanceMeters,
    band,
    priority,
    seed: zoneSeed,
  };
}

function getFallbackZones(options: HomeDrivePedestrianResidentPoolPlacementOptions): readonly HomeDrivePedestrianSidewalkZone[] {
  return [...options.zones]
    .map((zone) => ({
      zone,
      frame: getFrame(zone.center, options.activeCenter, options.activeHeadingRad),
    }))
    .filter((item) => item.frame.forwardMeters > -options.config.recycleBehindMeters)
    .sort((first, second) => {
      const firstScore =
        Math.abs(first.frame.forwardMeters - Math.min(options.config.teleportMinForwardMeters, options.config.viewportVisibleNearMaxMeters ?? options.config.teleportMinForwardMeters)) +
        first.frame.absoluteLateralMeters * 1.5;
      const secondScore =
        Math.abs(second.frame.forwardMeters - Math.min(options.config.teleportMinForwardMeters, options.config.viewportVisibleNearMaxMeters ?? options.config.teleportMinForwardMeters)) +
        second.frame.absoluteLateralMeters * 1.5;

      if (Math.abs(firstScore - secondScore) > 0.0001) {
        return firstScore - secondScore;
      }

      return first.zone.id.localeCompare(second.zone.id);
    })
    .map((item) => item.zone);
}

export function createHomeDrivePedestrianResidentPoolPlacement(
  options: HomeDrivePedestrianResidentPoolPlacementOptions,
): HomeDrivePedestrianResidentPoolPlacementResult {
  const config = options.config;
  const speedPushMeters = clamp(options.activeSpeedMps * 18, 0, 1200);
  const candidateZones = [...options.zones]
    .map((zone) => ({
      zone,
      frame: getFrame(zone.center, options.activeCenter, options.activeHeadingRad),
    }))
    .filter((item) => {
      return (
        item.frame.forwardMeters >= config.teleportMinForwardMeters * 0.72 &&
        item.frame.forwardMeters <= config.teleportHorizonMaxForwardMeters + speedPushMeters &&
        item.frame.absoluteLateralMeters <= config.recycleSideMeters * 1.5
      );
    })
    .sort((first, second) => {
      const firstScore =
        Math.abs(first.frame.forwardMeters - config.teleportMaxForwardMeters * 0.58) +
        first.frame.absoluteLateralMeters * 1.75 -
        first.zone.density * 18;
      const secondScore =
        Math.abs(second.frame.forwardMeters - config.teleportMaxForwardMeters * 0.58) +
        second.frame.absoluteLateralMeters * 1.75 -
        second.zone.density * 18;

      if (Math.abs(firstScore - secondScore) > 0.0001) {
        return firstScore - secondScore;
      }

      return first.zone.id.localeCompare(second.zone.id);
    })
    .map((item) => item.zone);

  const zones = candidateZones.length > 0 ? candidateZones : getFallbackZones(options);
  const slots: HomeDrivePedestrianResidentPoolSlot[] = [];
  const slotsPerZone = Math.max(2, Math.ceil(config.size / Math.max(1, Math.min(zones.length, 24))));

  for (const zone of zones) {
    for (let slotIndex = 0; slotIndex < slotsPerZone; slotIndex += 1) {
      const slot = createSlot({
        zone,
        activeCenter: options.activeCenter,
        activeHeadingRad: options.activeHeadingRad,
        slotIndex,
        seed: options.seed + Math.floor(options.elapsedSeconds / 8),
        config,
      });

      if (slot) {
        slots.push(slot);
      }
    }

    if (slots.length >= config.size * 3) {
      break;
    }
  }

  const sortedSlots = slots
    .sort((first, second) => {
      if (Math.abs(first.priority - second.priority) > 0.0001) {
        return second.priority - first.priority;
      }

      return first.id.localeCompare(second.id);
    })
    .slice(0, Math.max(config.size, config.minFrontAgents + config.minFarAgents + 8));

  return {
    id: [
      "resident-placement",
      Math.round(options.activeCenter.x / 64),
      Math.round(options.activeCenter.z / 64),
      Math.round(options.activeHeadingRad * 100),
      Math.round(options.activeSpeedMps * 10),
      sortedSlots.length,
    ].join(":"),
    slots: sortedSlots,
    frontSlotCount: sortedSlots.filter((slot) => slot.band === "front").length,
    farSlotCount: sortedSlots.filter((slot) => slot.band === "far").length,
    horizonSlotCount: sortedSlots.filter((slot) => slot.band === "horizon").length,
  };
}
