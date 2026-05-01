// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianStreaming.types.ts

import type { HomeDriveVector2 } from "../homeDrive.types";
import type {
  HomeDriveCrosswalk,
  HomeDriveCrosswalkRuntimeState,
  HomeDriveCrosswalkSide,
} from "../crosswalks";
import type {
  HomeDrivePedestrianAgent,
  HomeDrivePedestrianBehavior,
  HomeDrivePedestrianGroupKind,
  HomeDrivePedestrianSidewalkSide,
  HomeDrivePedestrianSidewalkZone,
} from "./homeDrive.pedestrians.types";

export type HomeDrivePedestrianStreamingSectorKey =
  | "front-near"
  | "front-far"
  | "left-sidewalk"
  | "right-sidewalk"
  | "rear-buffer"
  | "crosswalk-demand";

export type HomeDrivePedestrianStreamingSpawnReason =
  | "front-lookahead"
  | "sidewalk-stream"
  | "rear-buffer"
  | "crosswalk-demand"
  | "reservoir-retry";

export type HomeDrivePedestrianStreamingPreferredBehavior = Extract<
  HomeDrivePedestrianBehavior,
  "walk" | "shop-walk" | "wait-crossing" | "cross-wait" | "phone" | "talk"
>;

export type HomeDrivePedestrianStreamingSector = Readonly<{
  key: HomeDrivePedestrianStreamingSectorKey;
  center: HomeDriveVector2;
  radiusMeters: number;
  minForwardMeters: number;
  maxForwardMeters: number;
  minAbsSideMeters: number;
  maxAbsSideMeters: number;
  sideSign: -1 | 0 | 1;
  priority: number;
}>;

export type HomeDrivePedestrianStreamingSectorCount = Readonly<{
  sectorKey: HomeDrivePedestrianStreamingSectorKey;
  currentCount: number;
  targetCount: number;
  deficitCount: number;
}>;

export type HomeDrivePedestrianStreamingSectorTarget = Readonly<{
  sector: HomeDrivePedestrianStreamingSector;
  targetCount: number;
  currentCount: number;
  deficitCount: number;
  maxSpawnCount: number;
}>;

export type HomeDrivePedestrianStreamingSlot = Readonly<{
  id: string;

  zone: HomeDrivePedestrianSidewalkZone;
  zoneId: string;
  segmentId: string;
  side: HomeDrivePedestrianSidewalkSide;

  progress: number;
  lateralOffsetMeters: number;
  directionSign: 1 | -1;
  worldPosition: HomeDriveVector2;

  seed: number;
  priority: number;

  sectorKey: HomeDrivePedestrianStreamingSectorKey;
  spawnReason: HomeDrivePedestrianStreamingSpawnReason;

  crosswalkId?: string | null;
  crosswalkSide?: HomeDriveCrosswalkSide | null;
  preferredBehavior?: HomeDrivePedestrianStreamingPreferredBehavior;
  preferredGroupKind?: HomeDrivePedestrianGroupKind;
  forceSolo?: boolean;
  crowdPressure?: number;
}>;

export type HomeDrivePedestrianStreamingPlan = Readonly<{
  id: string;
  activeCenter: HomeDriveVector2;
  activeHeadingRad: number;
  activeSpeedMps: number;

  sectors: readonly HomeDrivePedestrianStreamingSector[];
  sectorTargets: readonly HomeDrivePedestrianStreamingSectorTarget[];
  sectorCounts: readonly HomeDrivePedestrianStreamingSectorCount[];

  candidateZoneIds: readonly string[];
  spawnSlots: readonly HomeDrivePedestrianStreamingSlot[];
  crosswalkDemandSlots: readonly HomeDrivePedestrianStreamingSlot[];

  totalCurrentCount: number;
  totalDeficitCount: number;
  totalSpawnBudget: number;
}>;

export type HomeDrivePedestrianStreamingOptions = Readonly<{
  agents: readonly HomeDrivePedestrianAgent[];
  zones: readonly HomeDrivePedestrianSidewalkZone[];

  activeCenter: HomeDriveVector2;
  activeHeadingRad?: number;
  activeSpeedMps?: number;

  elapsedSeconds?: number;
  seed?: number;

  populateRadiusMeters?: number;
  localZoneSearchRadiusMeters?: number;
  maxSpawnPerRefresh?: number;

  frontLookaheadMeters?: number;
  frontLookaheadSpeedMultiplier?: number;
  frontFarRadiusMeters?: number;
  sideRadiusMeters?: number;
  rearRadiusMeters?: number;

  minFrontPedestrians?: number;
  minFarFrontPedestrians?: number;
  minSideSectorPedestrians?: number;
  minRearBufferPedestrians?: number;
  minCrosswalkPedestrians?: number;

  maxSpawnPerSectorRefresh?: number;
  maxCrosswalkSpawnPerRefresh?: number;

  crosswalks?: HomeDriveCrosswalkRuntimeState;
  crosswalkSearchRadiusMeters?: number;
}>;

export type HomeDrivePedestrianCrosswalkDemandSlot = HomeDrivePedestrianStreamingSlot &
  Readonly<{
    spawnReason: "crosswalk-demand";
    sectorKey: "crosswalk-demand";
    crosswalkId: string;
    crosswalkSide: HomeDriveCrosswalkSide;
    crosswalk: HomeDriveCrosswalk;
  }>;

export type HomeDrivePedestrianCrosswalkDemandOptions = Readonly<{
  zones: readonly HomeDrivePedestrianSidewalkZone[];
  agents: readonly HomeDrivePedestrianAgent[];
  crosswalks?: HomeDriveCrosswalkRuntimeState;

  activeCenter: HomeDriveVector2;
  activeHeadingRad?: number;
  activeSpeedMps?: number;

  searchRadiusMeters?: number;
  minPedestriansPerCrosswalk?: number;
  maxSlots?: number;
  seed?: number;
  elapsedSeconds?: number;
}>;

export type HomeDrivePedestrianCrosswalkDemandResult = Readonly<{
  slots: readonly HomeDrivePedestrianCrosswalkDemandSlot[];
  visibleCrosswalkIds: readonly string[];
  currentDemandCount: number;
  targetDemandCount: number;
  deficitDemandCount: number;
}>;

export type HomeDrivePedestrianSpawnReservoirSlotState = Readonly<{
  slotId: string;
  zoneId: string;
  sectorKey: HomeDrivePedestrianStreamingSectorKey;
  spawnReason: HomeDrivePedestrianStreamingSpawnReason;
  worldPosition: HomeDriveVector2;
  reservedAtSeconds: number;
  lastTouchedAtSeconds: number;
  attempts: number;
}>;

export type HomeDrivePedestrianSpawnReservoirSnapshot = Readonly<{
  slotsById: Readonly<Record<string, HomeDrivePedestrianSpawnReservoirSlotState>>;
  zoneSpawnCounts: Readonly<Record<string, number>>;
  sectorSpawnCounts: Readonly<Record<HomeDrivePedestrianStreamingSectorKey, number>>;
}>;

export type HomeDrivePedestrianSpawnReservoirUpdateOptions = Readonly<{
  reservoir?: HomeDrivePedestrianSpawnReservoirSnapshot;
  slots: readonly HomeDrivePedestrianStreamingSlot[];
  elapsedSeconds: number;
  maxAgeSeconds?: number;
  maxAttemptsPerSlot?: number;
}>;

export type HomeDrivePedestrianSpawnReservoirUpdateResult = Readonly<{
  reservoir: HomeDrivePedestrianSpawnReservoirSnapshot;
  acceptedSlots: readonly HomeDrivePedestrianStreamingSlot[];
  rejectedSlotIds: readonly string[];
}>;
