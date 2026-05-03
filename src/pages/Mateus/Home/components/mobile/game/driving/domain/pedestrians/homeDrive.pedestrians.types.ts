// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrians.types.ts



import type { HomeDriveVector2 } from "../homeDrive.types";

import type { HomeDriveCrosswalkRuntimeState } from "../crosswalks";

import type { HomeDriveGeneratedRoadSegment } from "../homeDrive.worldMap.types";

import type { HomeDrivePedestrianPopulationRuntime } from "./homeDrive.pedestrianPopulationRuntime.types";
import type { HomeDrivePedestrianImpactState } from "./homeDrive.pedestrianCollision.types";



export type HomeDrivePedestrianRole =

  | "adult"

  | "child"

  | "elder"

  | "parent"

  | "shopper"

  | "smoker"

  | "worker"

  | "runner";



export type HomeDrivePedestrianBehavior =

  | "idle"

  | "walk"

  | "smoke"

  | "phone"

  | "talk"

  | "shop-walk"

  | "hold-child-hand"

  | "wait-crossing"

  | "cross-wait"

  | "cross-walk"

  | "cross-run"

  | "cross-panic";



export type HomeDrivePedestrianAnimationKey =

  | "idle"

  | "walk"

  | "slow-walk"

  | "fast-walk"

  | "smoke"

  | "phone"

  | "talk"

  | "carry-bags"

  | "child-walk";



export type HomeDrivePedestrianProp =

  | "cigarette"

  | "shopping-bag-left"

  | "shopping-bag-right"

  | "phone"

  | "backpack"

  | "cap"

  | "child-hand-link";



export type HomeDrivePedestrianSidewalkSide = "left" | "right";



export type HomeDrivePedestrianGroupKind =

  | "solo"

  | "shopper"

  | "smoker"

  | "couple"

  | "adult-child"

  | "chat-pair"

  | "worker";



export type HomeDrivePedestrianSkinToneKey =

  | "tone-1"

  | "tone-2"

  | "tone-3"

  | "tone-4"

  | "tone-5"

  | "tone-6";



export type HomeDrivePedestrianClothingPaletteKey =

  | "coastal-light"

  | "urban-dark"

  | "office-neutral"

  | "market-colorful"

  | "sport"

  | "casual-blue"

  | "casual-earth";



export type HomeDrivePedestrianWalkStyleKey =

  | "neutral"

  | "relaxed"

  | "hurried"

  | "heavy"

  | "childlike";



export type HomeDrivePedestrianVector2 = Readonly<{

  x: number;

  z: number;

}>;



export type HomeDrivePedestrianAppearance = Readonly<{

  skinToneKey: HomeDrivePedestrianSkinToneKey;

  clothingPaletteKey: HomeDrivePedestrianClothingPaletteKey;

  walkStyleKey: HomeDrivePedestrianWalkStyleKey;

  heightMeters: number;

  shoulderWidthMeters: number;

  bodyScale: number;

  headScale: number;

  hairVariant: number;

  outfitVariant: number;

}>;



export type HomeDrivePedestrianSidewalkZone = Readonly<{

  id: string;

  roadId: string;

  segmentId: string;

  segmentIndex: number;

  districtId: string;

  roadKind: string;

  roadTone: string;

  side: HomeDrivePedestrianSidewalkSide;

  from: HomeDriveVector2;

  to: HomeDriveVector2;

  center: HomeDriveVector2;

  direction: HomeDrivePedestrianVector2;

  normal: HomeDrivePedestrianVector2;

  lengthMeters: number;

  widthMeters: number;

  offsetFromRoadCenterMeters: number;

  density: number;

  tags: readonly string[];

  road: HomeDriveGeneratedRoadSegment;

}>;



export type HomeDrivePedestrianViewportBand =

  | "visible"

  | "far-visible"

  | "entering-soon"

  | "offscreen";



export type HomeDrivePedestrianViewportOccupancyBand =

  | "visible-near"

  | "visible-mid"

  | "visible-far"

  | "side-left"

  | "side-right";



export type HomeDrivePedestrianGroupMemberDraft = Readonly<{

  role: HomeDrivePedestrianRole;

  behaviorHint: HomeDrivePedestrianBehavior;

  props: readonly HomeDrivePedestrianProp[];

  groupForwardOffsetMeters: number;

  groupSideOffsetMeters: number;

  handHoldPeerIndex: number | null;

}>;



export type HomeDrivePedestrianGroupDraft = Readonly<{

  id: string;

  kind: HomeDrivePedestrianGroupKind;

  zoneId: string;

  segmentId: string;

  side: HomeDrivePedestrianSidewalkSide;

  progress: number;

  directionSign: 1 | -1;

  baseSpeedMps: number;

  seed: number;

  originSource?: "initial" | "resident-pool";

  activationBand?: "near" | "mid" | "far" | "horizon" | "visible" | "far-visible" | "entering-soon";

  members: readonly HomeDrivePedestrianGroupMemberDraft[];

}>;



export type HomeDrivePedestrianAgent = Readonly<{

  id: string;

  groupId: string;

  groupKind: HomeDrivePedestrianGroupKind;

  groupMemberIndex: number;

  handHoldTargetId: string | null;



  role: HomeDrivePedestrianRole;

  behavior: HomeDrivePedestrianBehavior;

  animationKey: HomeDrivePedestrianAnimationKey;

  props: readonly HomeDrivePedestrianProp[];

  appearance: HomeDrivePedestrianAppearance;



  zoneId: string;

  segmentId: string;

  sidewalkSide: HomeDrivePedestrianSidewalkSide;

  progress: number;

  directionSign: 1 | -1;

  position: HomeDriveVector2;

  headingRad: number;



  speedMps: number;

  baseSpeedMps: number;

  targetSpeedMps: number;

  lateralOffsetMeters: number;

  forwardOffsetMeters: number;



  behaviorElapsedSeconds: number;

  behaviorDurationSeconds: number;

  animationPhase: number;

  idleLookYawRad: number;



  crosswalkId?: string | null;

  crossingDirection?: 1 | -1;

  crossingProgress?: number;

  crossingStartedAtSeconds?: number;

  crossingDurationSeconds?: number;

  crossingStart?: HomeDriveVector2;

  crossingEnd?: HomeDriveVector2;



  seed: number;



  /** Mantido para compatibilidade com snapshots antigos. */

  lastRelocatedAtSeconds?: number;

  relocationGeneration?: number;

  relocationSlotId?: string;

  relocationForwardMeters?: number;

  relocationSource?: "resident-pool" | "resident-viewport";



  /** Metadados do resident pool / viewport occupancy. */

  residentPoolId?: string;

  residentPoolIndex?: number;

  residentPoolSlotId?: string;

  residentPoolTeleportedAtSeconds?: number;

  residentPoolGeneration?: number;

  residentViewportBand?: HomeDrivePedestrianViewportOccupancyBand;

  residentViewportSlotId?: string;

  lastViewportTeleportAtSeconds?: number;

  viewportOccupancyGeneration?: number;



  /** Mantido opcional para compatibilidade de render/debug antigo. */

  viewportStreetId?: string;

  viewportSlotId?: string;

  viewportVisibilityBand?: Exclude<HomeDrivePedestrianViewportBand, "offscreen">;

  lastSeenInViewportAtSeconds?: number;

  viewportSpawnGeneration?: number;

  bakedAgentId?: string;

  bakedSlotId?: string;

  bakedStreetId?: string;

  activationBand?: "near" | "mid" | "far" | "horizon";

  activatedAtSeconds?: number;

  releasedAtSeconds?: number;

  teleportGeneration?: number;


  /** Estado de colisão/impacto com o carro. Mantém o pedestre visível, bloqueado contra teleporte e com pose aérea. */
  pedestrianImpact?: HomeDrivePedestrianImpactState;
  collisionLockedUntilSeconds?: number;
  lastPedestrianCollisionAtSeconds?: number;
  lastCollisionCandidateAtSeconds?: number;

}>;



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
