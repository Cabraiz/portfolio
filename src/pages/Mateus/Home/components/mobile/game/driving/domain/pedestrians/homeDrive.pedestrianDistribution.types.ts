// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianDistribution.types.ts

import type { HomeDriveVector2 } from "../homeDrive.types";
import type { HomeDriveCrosswalkSide } from "../crosswalks";
import type {
  HomeDrivePedestrianBehavior,
  HomeDrivePedestrianGroupKind,
  HomeDrivePedestrianSidewalkSide,
  HomeDrivePedestrianSidewalkZone,
} from "./homeDrive.pedestrians.types";
import type { HomeDrivePedestrianCornerClassification } from "./homeDrive.pedestrianCornerControl";
import type {
  HomeDrivePedestrianStreamingSectorKey,
  HomeDrivePedestrianStreamingSlot,
  HomeDrivePedestrianStreamingSpawnReason,
} from "./homeDrive.pedestrianStreaming.types";

export type HomeDrivePedestrianGroupKindBias = Readonly<
  Partial<Record<HomeDrivePedestrianGroupKind, number>>
>;

export type HomeDrivePedestrianDistributionProfile = Readonly<{
  density: number;
  maxPedestrians: number;
  seed: number;

  occupancyCellSizeMeters: number;
  maxGroupsPerCell: number;
  maxGroupsPerCellOnMainRoad: number;

  minGroupDistanceMeters: number;
  minGroupDistanceBusyMeters: number;
  minProgressGapMeters: number;
  lateralLaneCount: number;

  cornerExclusionMeters: number;
  maxCornerSlotRatio: number;
}>;

export type HomeDrivePedestrianDistributionOptions = Readonly<{
  zones: readonly HomeDrivePedestrianSidewalkZone[];
  density?: number;
  maxPedestrians?: number;
  seed?: number;
  profile?: Partial<HomeDrivePedestrianDistributionProfile>;

  initialFocusCenter?: HomeDriveVector2;
  initialFocusRadiusMeters?: number;
  initialFocusPedestrianRatio?: number;
  maxInitialFocusPedestrians?: number;

  cornerExclusionMeters?: number;
  maxCornerPedestrianRatio?: number;
  minGroupDistanceMeters?: number;
  maxAgentsPerDistributionCell?: number;

  /** Slots direcionais gerados pelo streaming local/lookahead. */
  streamingSlots?: readonly HomeDrivePedestrianStreamingSlot[];
  streamingPriorityBoost?: number;
}>;

export type HomeDrivePedestrianZoneDistributionPlan = Readonly<{
  zone: HomeDrivePedestrianSidewalkZone;
  zoneId: string;
  segmentId: string;
  side: HomeDrivePedestrianSidewalkSide;
  roadKind: string;

  density: number;
  targetSpacingMeters: number;
  slotCount: number;
  maxGroups: number;
  priority: number;

  spawnFocusWeight: number;
  spawnFocusPriorityBoost: number;
}>;

export type HomeDrivePedestrianDistributedSlot = Readonly<{
  id: string;
  zone: HomeDrivePedestrianSidewalkZone;
  zoneId: string;
  segmentId: string;
  side: HomeDrivePedestrianSidewalkSide;

  slotIndex: number;
  slotCount: number;
  progress: number;
  lateralOffsetMeters: number;
  directionSign: 1 | -1;

  worldPosition: HomeDriveVector2;

  occupancyCellKey: string;
  cornerCellKey: string;
  groupKindBias: HomeDrivePedestrianGroupKindBias;
  priority: number;
  seed: number;

  isCornerSlot: boolean;
  cornerClassification: HomeDrivePedestrianCornerClassification;
  isInitialFocusSlot: boolean;
  forceSolo: boolean;
  crowdPressure: number;

  /** Metadados opcionais usados pelo streaming local de pedestres. */
  streamingSlotId?: string;
  streamingSectorKey?: HomeDrivePedestrianStreamingSectorKey;
  spawnReason?: HomeDrivePedestrianStreamingSpawnReason | "initial" | "local";
  crosswalkId?: string | null;
  crosswalkSide?: HomeDriveCrosswalkSide | null;
  preferredBehavior?: HomeDrivePedestrianBehavior;
  preferredGroupKind?: HomeDrivePedestrianGroupKind;
}>;

export type HomeDrivePedestrianDistributionRejectionReason =
  | "zone-capacity"
  | "cell-capacity"
  | "corner-capacity"
  | "world-distance"
  | "progress-gap"
  | "max-pedestrians"
  | "streaming-duplicate";

export type HomeDrivePedestrianDistributionRejectedSlot = Readonly<{
  zoneId: string;
  segmentId: string;
  side: HomeDrivePedestrianSidewalkSide;
  slotIndex: number;
  reason: HomeDrivePedestrianDistributionRejectionReason;
}>;

export type HomeDrivePedestrianDistributionResult = Readonly<{
  slots: readonly HomeDrivePedestrianDistributedSlot[];
  plans: readonly HomeDrivePedestrianZoneDistributionPlan[];
  rejected: readonly HomeDrivePedestrianDistributionRejectedSlot[];
  acceptedCount: number;
  rejectedCount: number;
  initialFocusAcceptedCount: number;
  cornerAcceptedCount: number;
}>;

export type HomeDrivePedestrianDistributionDebugSummary = Readonly<{
  zoneCount: number;
  plannedSlotCount: number;
  acceptedSlotCount: number;
  rejectedSlotCount: number;
  initialFocusAcceptedCount: number;
  cornerAcceptedCount: number;
  acceptedByRoadKind: Readonly<Record<string, number>>;
  acceptedByCell: Readonly<Record<string, number>>;
  acceptedBySide: Readonly<Record<HomeDrivePedestrianSidewalkSide, number>>;
  rejectedByReason: Readonly<Record<string, number>>;
}>;