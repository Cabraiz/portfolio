// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianDistributionDebug.ts

import type {
  HomeDrivePedestrianDistributionDebugSummary,
  HomeDrivePedestrianDistributionResult,
} from "./homeDrive.pedestrianDistribution.types";

function incrementRecord(
  record: Record<string, number>,
  key: string,
  amount = 1,
): void {
  record[key] = (record[key] ?? 0) + amount;
}

export function createHomeDrivePedestrianDistributionDebugSummary(
  result: HomeDrivePedestrianDistributionResult,
): HomeDrivePedestrianDistributionDebugSummary {
  const acceptedByRoadKind: Record<string, number> = {};
  const acceptedByCell: Record<string, number> = {};
  const rejectedByReason: Record<string, number> = {};
  const acceptedBySide = {
    left: 0,
    right: 0,
  };

  result.slots.forEach((slot) => {
    incrementRecord(acceptedByRoadKind, slot.zone.roadKind);
    incrementRecord(acceptedByCell, slot.occupancyCellKey);
    acceptedBySide[slot.side] += 1;
  });

  result.rejected.forEach((slot) => {
    incrementRecord(rejectedByReason, slot.reason);
  });

  return {
    zoneCount: result.plans.length,
    plannedSlotCount: result.plans.reduce(
      (total, plan) => total + plan.slotCount,
      0,
    ),
    acceptedSlotCount: result.acceptedCount,
    rejectedSlotCount: result.rejectedCount,
    initialFocusAcceptedCount: result.initialFocusAcceptedCount,
    cornerAcceptedCount: result.cornerAcceptedCount,
    acceptedByRoadKind,
    acceptedByCell,
    acceptedBySide,
    rejectedByReason,
  };
}

export function formatHomeDrivePedestrianDistributionSummary(
  summary: HomeDrivePedestrianDistributionDebugSummary,
): string {
  const roadKinds = Object.entries(summary.acceptedByRoadKind)
    .sort((first, second) => second[1] - first[1])
    .map(([roadKind, count]) => `${roadKind}:${count}`)
    .join(", ");

  const rejected = Object.entries(summary.rejectedByReason)
    .sort((first, second) => second[1] - first[1])
    .map(([reason, count]) => `${reason}:${count}`)
    .join(", ");

  const maxCellCount = Object.values(summary.acceptedByCell).reduce(
    (maxValue, count) => Math.max(maxValue, count),
    0,
  );

  const cornerRatio =
    summary.acceptedSlotCount <= 0
      ? 0
      : summary.cornerAcceptedCount / summary.acceptedSlotCount;
  const focusRatio =
    summary.acceptedSlotCount <= 0
      ? 0
      : summary.initialFocusAcceptedCount / summary.acceptedSlotCount;

  return [
    `zones=${summary.zoneCount}`,
    `planned=${summary.plannedSlotCount}`,
    `accepted=${summary.acceptedSlotCount}`,
    `rejected=${summary.rejectedSlotCount}`,
    `focus=${summary.initialFocusAcceptedCount}(${focusRatio.toFixed(2)})`,
    `corner=${summary.cornerAcceptedCount}(${cornerRatio.toFixed(2)})`,
    `side.left=${summary.acceptedBySide.left}`,
    `side.right=${summary.acceptedBySide.right}`,
    `maxCell=${maxCellCount}`,
    `roads=[${roadKinds}]`,
    `rejected=[${rejected}]`,
  ].join(" | ");
}
