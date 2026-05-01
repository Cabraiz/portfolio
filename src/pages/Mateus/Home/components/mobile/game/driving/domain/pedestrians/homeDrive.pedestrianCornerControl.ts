// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianCornerControl.ts

import type { HomeDrivePedestrianSidewalkZone } from "./homeDrive.pedestrians.types";
import {
  HOME_DRIVE_PEDESTRIAN_CROWD_TUNING,
  getHomeDrivePedestrianGenerationCellKey,
} from "./homeDrive.pedestrianCrowdTuning";

export type HomeDrivePedestrianCornerClassification =
  | "middle"
  | "soft-corner"
  | "hard-corner";

export type HomeDrivePedestrianCornerControlResult = Readonly<{
  classification: HomeDrivePedestrianCornerClassification;
  distanceToNearestCornerMeters: number;
  cornerRatio: number;
  priorityMultiplier: number;
  canAcceptAsCornerSlot: boolean;
  cornerCellKey: string;
  zoneEndKey: string;
}>;

export type HomeDrivePedestrianCornerBudgetState = Readonly<{
  acceptedCornerSlots: number;
  acceptedTotalSlots: number;
  acceptedByCornerCell: ReadonlyMap<string, number>;
  acceptedByZoneEnd: ReadonlyMap<string, number>;
}>;

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

export function getHomeDrivePedestrianDistanceToNearestSidewalkCornerMeters(
  zone: HomeDrivePedestrianSidewalkZone,
  progress: number,
): number {
  const normalizedProgress = clamp(progress, 0, 1);
  const distanceFromStart = normalizedProgress * zone.lengthMeters;
  const distanceFromEnd = (1 - normalizedProgress) * zone.lengthMeters;

  return Math.min(distanceFromStart, distanceFromEnd);
}

export function getHomeDrivePedestrianCornerZoneEndKey(
  zone: HomeDrivePedestrianSidewalkZone,
  progress: number,
): string {
  return `${zone.id}:${progress <= 0.5 ? "start" : "end"}`;
}

export function classifyHomeDrivePedestrianCornerSlot(
  zone: HomeDrivePedestrianSidewalkZone,
  progress: number,
  worldPosition: Readonly<{ x: number; z: number }>,
): HomeDrivePedestrianCornerControlResult {
  const distanceToNearestCornerMeters =
    getHomeDrivePedestrianDistanceToNearestSidewalkCornerMeters(zone, progress);
  const hardExclusionMeters =
    HOME_DRIVE_PEDESTRIAN_CROWD_TUNING.corner.hardExclusionMeters;
  const softExclusionMeters =
    HOME_DRIVE_PEDESTRIAN_CROWD_TUNING.corner.softExclusionMeters;

  const classification: HomeDrivePedestrianCornerClassification =
    distanceToNearestCornerMeters <= hardExclusionMeters
      ? "hard-corner"
      : distanceToNearestCornerMeters <= softExclusionMeters
        ? "soft-corner"
        : "middle";

  const cornerRatio = clamp(
    1 - distanceToNearestCornerMeters / Math.max(1, softExclusionMeters),
    0,
    1,
  );

  return {
    classification,
    distanceToNearestCornerMeters,
    cornerRatio,
    priorityMultiplier:
      classification === "middle"
        ? HOME_DRIVE_PEDESTRIAN_CROWD_TUNING.corner.middlePriorityMultiplier
        : HOME_DRIVE_PEDESTRIAN_CROWD_TUNING.corner.cornerPriorityMultiplier,
    canAcceptAsCornerSlot: classification !== "hard-corner",
    cornerCellKey: getHomeDrivePedestrianGenerationCellKey(
      worldPosition,
      HOME_DRIVE_PEDESTRIAN_CROWD_TUNING.corner.cornerCellSizeMeters,
    ),
    zoneEndKey: getHomeDrivePedestrianCornerZoneEndKey(zone, progress),
  };
}

export function canAcceptHomeDrivePedestrianCornerSlot(
  corner: HomeDrivePedestrianCornerControlResult,
  budget: HomeDrivePedestrianCornerBudgetState,
): boolean {
  if (corner.classification === "middle") {
    return true;
  }

  if (!corner.canAcceptAsCornerSlot) {
    return false;
  }

  const totalAfterAccept = Math.max(1, budget.acceptedTotalSlots + 1);
  const nextCornerRatio = (budget.acceptedCornerSlots + 1) / totalAfterAccept;

  if (nextCornerRatio > HOME_DRIVE_PEDESTRIAN_CROWD_TUNING.corner.maxCornerSlotRatio) {
    return false;
  }

  const currentCellCount = budget.acceptedByCornerCell.get(corner.cornerCellKey) ?? 0;

  if (currentCellCount >= HOME_DRIVE_PEDESTRIAN_CROWD_TUNING.corner.maxCornerGroupsPerCell) {
    return false;
  }

  const currentZoneEndCount = budget.acceptedByZoneEnd.get(corner.zoneEndKey) ?? 0;

  return currentZoneEndCount < HOME_DRIVE_PEDESTRIAN_CROWD_TUNING.corner.maxCornerGroupsPerZoneEnd;
}

export function getHomeDrivePedestrianCornerProgressClamp(
  zone: HomeDrivePedestrianSidewalkZone,
): Readonly<{ min: number; max: number }> {
  const hardPaddingRatio = clamp(
    HOME_DRIVE_PEDESTRIAN_CROWD_TUNING.corner.hardExclusionMeters /
      Math.max(1, zone.lengthMeters),
    0.035,
    0.34,
  );

  return {
    min: hardPaddingRatio,
    max: 1 - hardPaddingRatio,
  };
}
