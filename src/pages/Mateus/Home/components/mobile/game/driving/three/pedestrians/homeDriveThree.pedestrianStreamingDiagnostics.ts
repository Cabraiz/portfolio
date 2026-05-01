// src/pages/Mateus/Home/components/mobile/game/driving/three/pedestrians/homeDriveThree.pedestrianStreamingDiagnostics.ts

export type HomeDriveThreePedestrianStreamingDiagnosticsSnapshot = Readonly<{
  elapsedSeconds: number;
  sourceCount: number;
  hydratedCount: number;
  warmingCount: number;
  stagedCount: number;
  safeCommitCount: number;
  blockedCommitCount: number;
  committedCount: number;
  culledCount: number;
  changedCommitCount: number;
}>;

export type HomeDriveThreePedestrianStreamingDiagnosticsState = {
  lastSnapshot: HomeDriveThreePedestrianStreamingDiagnosticsSnapshot | null;
};

export function createHomeDriveThreePedestrianStreamingDiagnosticsState(): HomeDriveThreePedestrianStreamingDiagnosticsState {
  return {
    lastSnapshot: null,
  };
}

export function updateHomeDriveThreePedestrianStreamingDiagnostics(
  state: HomeDriveThreePedestrianStreamingDiagnosticsState,
  snapshot: HomeDriveThreePedestrianStreamingDiagnosticsSnapshot,
): HomeDriveThreePedestrianStreamingDiagnosticsSnapshot {
  state.lastSnapshot = snapshot;

  return snapshot;
}

export function getHomeDriveThreePedestrianStreamingDiagnosticsSnapshot(
  state: HomeDriveThreePedestrianStreamingDiagnosticsState,
): HomeDriveThreePedestrianStreamingDiagnosticsSnapshot | null {
  return state.lastSnapshot;
}
