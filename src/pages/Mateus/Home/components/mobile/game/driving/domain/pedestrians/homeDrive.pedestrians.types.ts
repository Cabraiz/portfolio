// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrians.types.ts

import type { HomeDriveVector2 } from "../homeDrive.types";
import type { HomeDriveCrosswalkRuntimeState } from "../crosswalks";
import type { HomeDriveGeneratedRoadSegment } from "../homeDrive.worldMap.types";
import type { HomeDrivePedestrianPopulationRuntime } from "./homeDrive.pedestrianPopulationRuntime.types";

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
}>;

export type HomeDrivePedestrianRuntimeState = Readonly<{
  agents: readonly HomeDrivePedestrianAgent[];
  zones: readonly HomeDrivePedestrianSidewalkZone[];
  elapsedSeconds: number;
  seed: number;

  /** Runtime da camada dinâmica que mantém civis próximos do carro. */
  populationRuntime?: HomeDrivePedestrianPopulationRuntime;
}>;

export type HomeDrivePedestrianGenerationOptions = Readonly<{
  enabled?: boolean;
  seed?: number;
  maxPedestrians?: number;
  density?: number;
  minRoadLengthMeters?: number;
  maxRoads?: number;

  /** Prioriza pedestres perto do carro/spawn inicial para o jogo não começar vazio. */
  initialFocusCenter?: HomeDriveVector2;
  initialFocusRadiusMeters?: number;
  initialFocusPedestrianRatio?: number;
  maxInitialFocusPedestrians?: number;

  /** Controle de concentração em esquinas e células de distribuição. */
  cornerExclusionMeters?: number;
  maxCornerPedestrianRatio?: number;
  minGroupDistanceMeters?: number;
  maxAgentsPerDistributionCell?: number;
}>;

export type HomeDrivePedestrianTickOptions = Readonly<{
  enabled?: boolean;
  maxDeltaSeconds?: number;
  crosswalks?: HomeDriveCrosswalkRuntimeState;

  /** Centro ativo da simulação: normalmente a posição atual do carro. */
  activeCenter?: HomeDriveVector2;
  activeRadiusMeters?: number;
  warmRadiusMeters?: number;
  warmTickModulo?: number;
  coldTickModulo?: number;
  tickIndex?: number;

  /** Streaming de população local. */
  activeHeadingRad?: number;
  activeSpeedMps?: number;
  populateRadiusMeters?: number;
  localZoneSearchRadiusMeters?: number;
  keepAliveRadiusMeters?: number;
  repopulateDistanceMeters?: number;
  repopulateCooldownSeconds?: number;
  minPedestriansNearPlayer?: number;
  maxActivePedestrians?: number;
  maxSpawnPerRefresh?: number;

  /** Lookahead direcional: mantém calçadas e faixas ocupadas à frente do carro. */
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
  crosswalkSearchRadiusMeters?: number;

  /** Warm ring e prewarm para preparar pedestres antes de o carro chegar. */
  enablePedestrianWarmRing?: boolean;
  pedestrianWarmRingBaseRadiusMeters?: number;
  pedestrianWarmRingFrontBiasMeters?: number;
  pedestrianWarmRingSpeedRadiusMultiplier?: number;
  pedestrianWarmRingSideRadiusMeters?: number;
  pedestrianWarmRingRearRadiusMeters?: number;
  pedestrianWarmRingMaxZoneCount?: number;
  pedestrianPrewarmEnabled?: boolean;
  pedestrianPrewarmFrames?: number;
  pedestrianPrewarmLeadSeconds?: number;
  pedestrianPrewarmFrontMeters?: number;
  pedestrianPrewarmMinReadyPedestrians?: number;
  pedestrianPrewarmSpawnBudgetMultiplier?: number;

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
