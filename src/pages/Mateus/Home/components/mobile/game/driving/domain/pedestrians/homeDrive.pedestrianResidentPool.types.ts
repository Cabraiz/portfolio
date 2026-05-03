// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianResidentPool.types.ts

import type { HomeDriveVector2 } from "../homeDrive.types";
import type {
  HomeDrivePedestrianAgent,
  HomeDrivePedestrianSidewalkZone,
} from "./homeDrive.pedestrians.types";

export type HomeDrivePedestrianResidentPoolSlotBand =
  | "front"
  | "far"
  | "horizon"
  | "visible-near"
  | "visible-mid"
  | "visible-far"
  | "side-left"
  | "side-right";

export type HomeDrivePedestrianResidentPoolAgentStatus =
  | "visible"
  | "front"
  | "far"
  | "behind"
  | "side"
  | "recyclable";

export type HomeDrivePedestrianResidentPoolConfig = Readonly<{
  enabled: boolean;
  size: number;
  minFrontAgents: number;
  minFarAgents: number;
  teleportMinForwardMeters: number;
  teleportMaxForwardMeters: number;
  teleportHorizonMaxForwardMeters: number;
  recycleBehindMeters: number;
  recycleSideMeters: number;
  maxTeleportsPerTick: number;
  maxInitialTeleports: number;
  protectVisibleConeMeters: number;
  protectVisibleConeRadians: number;
  debug: boolean;

  /** Viewport occupancy: força 100% do resident pool dentro do raio visual útil. */
  viewportOccupancyEnabled?: boolean;
  viewportForceAllAgentsIntoViewport?: boolean;
  viewportVisibleNearMinMeters?: number;
  viewportVisibleNearMaxMeters?: number;
  viewportVisibleNearCount?: number;
  viewportVisibleMidMinMeters?: number;
  viewportVisibleMidMaxMeters?: number;
  viewportVisibleMidCount?: number;
  viewportVisibleFarMinMeters?: number;
  viewportVisibleFarMaxMeters?: number;
  viewportVisibleFarCount?: number;
  viewportSideMinForwardMeters?: number;
  viewportSideMaxForwardMeters?: number;
  viewportSideLateralMinMeters?: number;
  viewportSideLateralMaxMeters?: number;
  viewportSideCount?: number;
  viewportMaxTeleportsPerTick?: number;
  viewportMinSpacingMeters?: number;

  /**
   * Quando true, o pool vira tamanho fixo após o boot/preload.
   * Depois disso o runtime só reaproveita/teleporta agentes existentes.
   */
  lockAfterBoot?: boolean;

  /**
   * Deve ficar false no jogo normal. Permite criação tardia apenas em modo debug/fallback.
   */
  allowRuntimeExpansion?: boolean;
}>;

export type HomeDrivePedestrianResidentPoolSlot = Readonly<{
  id: string;
  zone: HomeDrivePedestrianSidewalkZone;
  zoneId: string;
  segmentId: string;
  side: HomeDrivePedestrianSidewalkZone["side"];
  position: HomeDriveVector2;
  headingRad: number;
  progress: number;
  lateralOffsetMeters: number;
  directionSign: 1 | -1;
  forwardMeters: number;
  lateralMeters: number;
  distanceMeters: number;
  band: HomeDrivePedestrianResidentPoolSlotBand;
  priority: number;
  seed: number;
}>;

export type HomeDrivePedestrianResidentPoolAgentFrame = Readonly<{
  agentId: string;
  forwardMeters: number;
  lateralMeters: number;
  absoluteLateralMeters: number;
  distanceMeters: number;
  status: HomeDrivePedestrianResidentPoolAgentStatus;
  protected: boolean;
}>;

export type HomeDrivePedestrianResidentPoolCreationOptions = Readonly<{
  zones: readonly HomeDrivePedestrianSidewalkZone[];
  activeCenter: HomeDriveVector2;
  activeHeadingRad: number;
  elapsedSeconds: number;
  seed: number;
  poolSize: number;
  slots: readonly HomeDrivePedestrianResidentPoolSlot[];
}>;

export type HomeDrivePedestrianResidentPoolUpdateOptions = Readonly<{
  agents: readonly HomeDrivePedestrianAgent[];
  zones: readonly HomeDrivePedestrianSidewalkZone[];
  activeCenter: HomeDriveVector2;
  activeHeadingRad: number;
  activeSpeedMps: number;
  elapsedSeconds: number;
  seed: number;
  config: HomeDrivePedestrianResidentPoolConfig;
  runtime?: import("./homeDrive.pedestrianResidentPoolRuntime.types").HomeDrivePedestrianResidentPoolRuntime;
}>;


