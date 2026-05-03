// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianResidentPoolDiagnostics.types.ts

export type HomeDrivePedestrianResidentPoolDiagnostics = Readonly<{
  id: string;
  enabled: boolean;
  elapsedSeconds: number;
  activeSpeedMps: number;
  requestedPoolSize: number;
  finalAgentCount: number;
  createdAgentCount: number;
  reusedAgentCount: number;
  teleportedAgentCount: number;
  protectedAgentCount: number;
  frontAgentCount: number;
  farAgentCount: number;
  behindAgentCount: number;
  sideAgentCount: number;
  recyclableAgentCount: number;
  slotCount: number;
  frontSlotCount: number;
  farSlotCount: number;
  horizonSlotCount: number;
  visibleNearCount?: number;
  visibleMidCount?: number;
  visibleFarCount?: number;
  sideLeftCount?: number;
  sideRightCount?: number;
  offViewportCount?: number;
  teleportedToViewportCount?: number;
  missingSlotCount?: number;
  safeEntryGateCount?: number;
  blockedCenterConeCount?: number;
  bootLocked?: boolean;
  lockedPoolSize?: number;
  runtimeSpawnViolationCount?: number;
  runtimeSpawnBlockedCount?: number;
  collisionLockedCount?: number;
  collisionGuardBlockedTeleportCount?: number;
  reason: string;
}>;


