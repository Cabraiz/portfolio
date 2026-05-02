// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianResidentPoolDiagnostics.ts

import type { HomeDrivePedestrianResidentPoolDiagnostics } from "./homeDrive.pedestrianResidentPoolDiagnostics.types";

export function createEmptyHomeDrivePedestrianResidentPoolDiagnostics(
  elapsedSeconds = 0,
): HomeDrivePedestrianResidentPoolDiagnostics {
  return {
    id: `resident-pool:empty:${Math.round(elapsedSeconds * 10)}`,
    enabled: false,
    elapsedSeconds,
    activeSpeedMps: 0,
    requestedPoolSize: 0,
    finalAgentCount: 0,
    createdAgentCount: 0,
    reusedAgentCount: 0,
    teleportedAgentCount: 0,
    protectedAgentCount: 0,
    frontAgentCount: 0,
    farAgentCount: 0,
    behindAgentCount: 0,
    sideAgentCount: 0,
    recyclableAgentCount: 0,
    slotCount: 0,
    frontSlotCount: 0,
    farSlotCount: 0,
    horizonSlotCount: 0,
    reason: "empty",
  };
}
