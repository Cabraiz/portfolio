// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianBootPreload.types.ts

import type { HomeDriveVector2 } from "../homeDrive.types";
import type { HomeDrivePedestrianPerformanceProfile } from "./homeDrive.pedestrianPerformance";
import type { HomeDrivePedestrianRuntimeState } from "./homeDrive.pedestrians.types";

export type HomeDrivePedestrianBootPreloadPhase =
  | "disabled"
  | "warming-pool"
  | "locked";

export type HomeDrivePedestrianBootPreloadDiagnostics = Readonly<{
  phase: HomeDrivePedestrianBootPreloadPhase;
  enabled: boolean;
  steps: number;
  stepSeconds: number;
  startedAtSeconds: number;
  finishedAtSeconds: number;
  requestedPoolSize: number;
  finalAgentCount: number;
  lockedAgentCount: number;
  createdAgentCountDuringBoot: number;
  teleportedAgentCountDuringBoot: number;
  bakeLibraryClipCount?: number;
  bakeLibrarySampleCount?: number;
  runtimeExpansionAllowed: boolean;
}>;

export type HomeDrivePedestrianBootPreloadOptions = Readonly<{
  enabled?: boolean;
  activeCenter: HomeDriveVector2;
  activeHeadingRad: number;
  activeSpeedMps?: number;
  seed?: number;
  profile: HomeDrivePedestrianPerformanceProfile;
  steps?: number;
  stepSeconds?: number;
  debug?: boolean;
  bakeLibraryClipCount?: number;
  bakeLibrarySampleCount?: number;
}>;

export type HomeDrivePedestrianBootPreloadResult = Readonly<{
  pedestrians: HomeDrivePedestrianRuntimeState;
  diagnostics: HomeDrivePedestrianBootPreloadDiagnostics;
}>;
