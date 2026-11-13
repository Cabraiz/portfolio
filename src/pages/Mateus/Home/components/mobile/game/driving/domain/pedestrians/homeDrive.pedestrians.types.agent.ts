// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrians.types.agent.ts

import type { HomeDriveVector2 } from "../homeDrive.types";
import type {
  HomeDrivePedestrianImpactState,
} from "./homeDrive.pedestrianCollision.types";
import type {
  HomeDrivePedestrianRole,
  HomeDrivePedestrianBehavior,
  HomeDrivePedestrianProp,
  HomeDrivePedestrianGroupKind,
  HomeDrivePedestrianSidewalkSide,
  HomeDrivePedestrianAnimationKey,
  HomeDrivePedestrianAppearance,
  HomeDrivePedestrianViewportOccupancyBand,
  HomeDrivePedestrianViewportBand,
} from "./homeDrive.pedestrians.types.basics";

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
