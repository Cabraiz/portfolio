// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrians.types.ts

import type { HomeDriveVector2 } from "../homeDrive.types";

import type { HomeDriveCrosswalkRuntimeState } from "../crosswalks";

import type { HomeDrivePedestrianPopulationRuntime } from "./homeDrive.pedestrianPopulationRuntime.types";
import type {
  HomeDrivePedestrianSidewalkZone,
  HomeDrivePedestrianBehavior,
  HomeDrivePedestrianAnimationKey,
  HomeDrivePedestrianProp,
} from "./homeDrive.pedestrians.types.basics";
import type {
  HomeDrivePedestrianAgent,
} from "./homeDrive.pedestrians.types.agent";

export type {
  HomeDrivePedestrianRole,
  HomeDrivePedestrianBehavior,
  HomeDrivePedestrianAnimationKey,
  HomeDrivePedestrianProp,
  HomeDrivePedestrianSidewalkSide,
  HomeDrivePedestrianGroupKind,
  HomeDrivePedestrianSkinToneKey,
  HomeDrivePedestrianClothingPaletteKey,
  HomeDrivePedestrianWalkStyleKey,
  HomeDrivePedestrianVector2,
  HomeDrivePedestrianAppearance,
  HomeDrivePedestrianSidewalkZone,
  HomeDrivePedestrianViewportBand,
  HomeDrivePedestrianViewportOccupancyBand,
} from "./homeDrive.pedestrians.types.basics";
export type {
  HomeDrivePedestrianGroupMemberDraft,
  HomeDrivePedestrianGroupDraft,
  HomeDrivePedestrianAgent,
} from "./homeDrive.pedestrians.types.agent";

export type HomeDrivePedestrianRuntimeState = Readonly<{

  agents: readonly HomeDrivePedestrianAgent[];

  zones: readonly HomeDrivePedestrianSidewalkZone[];

  elapsedSeconds: number;

  seed: number;

  populationRuntime?: HomeDrivePedestrianPopulationRuntime;

}>;

export type HomeDrivePedestrianGenerationOptions = Readonly<{

  enabled?: boolean;

  seed?: number;

  maxPedestrians?: number;

  density?: number;

  minRoadLengthMeters?: number;

  maxRoads?: number;

  initialFocusCenter?: HomeDriveVector2;

  initialFocusRadiusMeters?: number;

  initialFocusPedestrianRatio?: number;

  maxInitialFocusPedestrians?: number;

  cornerExclusionMeters?: number;

  maxCornerPedestrianRatio?: number;

  minGroupDistanceMeters?: number;

  maxAgentsPerDistributionCell?: number;

}>;

export type HomeDrivePedestrianTickOptions = Readonly<{

  enabled?: boolean;

  maxDeltaSeconds?: number;

  /**
   * Relógio absoluto da simulação principal.
   *
   * O impacto do pedestre nasce no mesmo relógio de `runtime.elapsedSeconds`.
   * Se o runtime dos pedestres usar apenas `pedestrians.elapsedSeconds + delta`,
   * ele pode ficar atrasado e recalcular o arremesso com tempo zero/negativo,
   * causando o bug visual de alternar entre a origem e o ponto final.
   */
  simulationTimeSeconds?: number;

  crosswalks?: HomeDriveCrosswalkRuntimeState;

  activeCenter?: HomeDriveVector2;

  activeRadiusMeters?: number;

  warmRadiusMeters?: number;

  warmTickModulo?: number;

  coldTickModulo?: number;

  tickIndex?: number;

  activeHeadingRad?: number;

  activeSpeedMps?: number;

  pedestrianResidentPoolEnabled?: boolean;

  pedestrianResidentPoolSize?: number;

  pedestrianResidentPoolMinFrontAgents?: number;

  pedestrianResidentPoolMinFarAgents?: number;

  pedestrianResidentPoolTeleportMinForwardMeters?: number;

  pedestrianResidentPoolTeleportMaxForwardMeters?: number;

  pedestrianResidentPoolTeleportHorizonMaxForwardMeters?: number;

  pedestrianResidentPoolRecycleBehindMeters?: number;

  pedestrianResidentPoolRecycleSideMeters?: number;

  pedestrianResidentPoolMaxTeleportsPerTick?: number;

  pedestrianResidentPoolMaxInitialTeleports?: number;

  pedestrianResidentPoolProtectVisibleConeMeters?: number;

  pedestrianResidentPoolProtectVisibleConeRadians?: number;

  pedestrianResidentPoolDebug?: boolean;

  pedestrianResidentPoolViewportOccupancyEnabled?: boolean;

  pedestrianResidentPoolForceAllAgentsIntoViewport?: boolean;

  pedestrianResidentPoolVisibleNearMinMeters?: number;

  pedestrianResidentPoolVisibleNearMaxMeters?: number;

  pedestrianResidentPoolVisibleNearCount?: number;

  pedestrianResidentPoolVisibleMidMinMeters?: number;

  pedestrianResidentPoolVisibleMidMaxMeters?: number;

  pedestrianResidentPoolVisibleMidCount?: number;

  pedestrianResidentPoolVisibleFarMinMeters?: number;

  pedestrianResidentPoolVisibleFarMaxMeters?: number;

  pedestrianResidentPoolVisibleFarCount?: number;

  pedestrianResidentPoolSideMinForwardMeters?: number;

  pedestrianResidentPoolSideMaxForwardMeters?: number;

  pedestrianResidentPoolSideLateralMinMeters?: number;

  pedestrianResidentPoolSideLateralMaxMeters?: number;

  pedestrianResidentPoolSideCount?: number;

  pedestrianResidentPoolMaxViewportTeleportsPerTick?: number;

  pedestrianResidentPoolViewportMinSpacingMeters?: number;
  pedestrianResidentPoolLockAfterBoot?: boolean;
  pedestrianResidentPoolAllowRuntimeExpansion?: boolean;

  populateRadiusMeters?: number;

  density?: number;

  seed?: number;

  forceRepopulate?: boolean;

  populationEnabled?: boolean;

}>;

export type HomeDrivePedestrianBehaviorAssignment = Readonly<{

  behavior: HomeDrivePedestrianBehavior;

  animationKey: HomeDrivePedestrianAnimationKey;

  props: readonly HomeDrivePedestrianProp[];

  targetSpeedMps: number;

  durationSeconds: number;

}>;
