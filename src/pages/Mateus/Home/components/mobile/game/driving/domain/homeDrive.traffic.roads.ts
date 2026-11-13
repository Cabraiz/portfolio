// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.traffic.roads.ts

import { buildHomeDriveRoadTopology } from "./homeDrive.roadTopology";
import type { HomeDriveRoadTopology } from "./homeDrive.roadTopology";
import { generateHomeDriveRoadSegments } from "./homeDrive.roadGenerator";
import type { HomeDriveGeneratedRoadSegment } from "./homeDrive.worldMap.types";
import { TRAFFIC_VEHICLE_SIZE_MULTIPLIER } from "./homeDrive.traffic.constants";
import type { TrafficVehicleDimensions } from "./homeDrive.traffic.constants";

let cachedTrafficRoadSegments: readonly HomeDriveGeneratedRoadSegment[] | null =
  null;

let cachedTrafficRoadTopology: HomeDriveRoadTopology | null = null;
let cachedTrafficRoadBySegmentId: ReadonlyMap<string, HomeDriveGeneratedRoadSegment> | null = null;

export function getRoadTags(road: HomeDriveGeneratedRoadSegment): readonly string[] {
  const roadWithTags = road as HomeDriveGeneratedRoadSegment & {
    tags?: readonly string[];
  };

  return Array.isArray(roadWithTags.tags) ? roadWithTags.tags : [];
}

export function getTrafficRoadSegments(): readonly HomeDriveGeneratedRoadSegment[] {
  if (cachedTrafficRoadSegments) {
    return cachedTrafficRoadSegments;
  }

  cachedTrafficRoadSegments = generateHomeDriveRoadSegments().filter((road) => {
    const tags = getRoadTags(road);

    if (road.length < 42) {
      return false;
    }

    if (tags.includes("safe-endcap")) {
      return false;
    }

    return road.kind !== "service" || road.length >= 70;
  });

  return cachedTrafficRoadSegments;
}

export function getTrafficRoadTopology(
  roads: readonly HomeDriveGeneratedRoadSegment[],
): HomeDriveRoadTopology {
  if (cachedTrafficRoadTopology) {
    return cachedTrafficRoadTopology;
  }

  cachedTrafficRoadTopology = buildHomeDriveRoadTopology(roads);

  return cachedTrafficRoadTopology;
}

export function getRoadSpeedLimitKmh(road: HomeDriveGeneratedRoadSegment): number {
  const roadWithSpeed = road as HomeDriveGeneratedRoadSegment & {
    speedLimitKmh?: number;
  };

  return roadWithSpeed.speedLimitKmh ?? 38;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

export function lerp(start: number, end: number, amount: number): number {
  return start + (end - start) * amount;
}

export function smoothstep01(value: number): number {
  const x = clamp01(value);

  return x * x * (3 - 2 * x);
}

export function moveTowards(current: number, target: number, maxDelta: number): number {
  if (!Number.isFinite(current)) {
    return target;
  }

  if (Math.abs(target - current) <= maxDelta) {
    return target;
  }

  return current + Math.sign(target - current) * maxDelta;
}

export function scaleTrafficVehicleDimensions(
  dimensions: TrafficVehicleDimensions,
): TrafficVehicleDimensions {
  return {
    widthMeters: dimensions.widthMeters * TRAFFIC_VEHICLE_SIZE_MULTIPLIER,
    lengthMeters: dimensions.lengthMeters * TRAFFIC_VEHICLE_SIZE_MULTIPLIER,
    heightMeters: dimensions.heightMeters * TRAFFIC_VEHICLE_SIZE_MULTIPLIER,
  };
}

export function getStableRoadSeed(road: HomeDriveGeneratedRoadSegment): number {
  let hash = 23;

  for (let index = 0; index < road.id.length; index += 1) {
    hash = (hash * 37 + road.id.charCodeAt(index)) % 104729;
  }

  return hash + road.segmentIndex * 131;
}

export function getRoadBySegmentIdMap(
  roads: readonly HomeDriveGeneratedRoadSegment[],
): ReadonlyMap<string, HomeDriveGeneratedRoadSegment> {
  if (cachedTrafficRoadBySegmentId) {
    return cachedTrafficRoadBySegmentId;
  }

  cachedTrafficRoadBySegmentId = new Map(roads.map((road) => [road.id, road]));

  return cachedTrafficRoadBySegmentId;
}
