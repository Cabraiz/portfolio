// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianOrchestrator.types.ts

import type { HomeDriveVector2 } from "../homeDrive.types";
import type {
  HomeDrivePedestrianAgent,
  HomeDrivePedestrianSidewalkZone,
} from "./homeDrive.pedestrians.types";
import type { HomeDrivePedestrianResidentPoolConfig } from "./homeDrive.pedestrianResidentPool.types";
import type { HomeDrivePedestrianResidentPoolDiagnostics } from "./homeDrive.pedestrianResidentPoolDiagnostics.types";
import type { HomeDrivePedestrianResidentPoolRuntime } from "./homeDrive.pedestrianResidentPoolRuntime.types";

export type HomeDrivePedestrianOrchestratorRuntime = Readonly<{
  generation: number;
  residentPoolRuntime?: HomeDrivePedestrianResidentPoolRuntime;
  lastDiagnostics?: HomeDrivePedestrianOrchestratorDiagnostics;
}>;

export type HomeDrivePedestrianOrchestratorDiagnostics = Readonly<{
  id: string;
  enabled: boolean;
  elapsedSeconds: number;
  previousAgentCount: number;
  finalAgentCount: number;
  createdAgentCount: number;
  teleportedAgentCount: number;
  reusedAgentCount: number;
  residentPoolDiagnostics?: HomeDrivePedestrianResidentPoolDiagnostics;
  reason: "disabled" | "resident-pool" | "no-active-center";
}>;

export type HomeDrivePedestrianOrchestratorInput = Readonly<{
  agents: readonly HomeDrivePedestrianAgent[];
  zones: readonly HomeDrivePedestrianSidewalkZone[];
  activeCenter: HomeDriveVector2 | null;
  activeHeadingRad: number;
  activeSpeedMps: number;
  elapsedSeconds: number;
  seed: number;
  runtime?: HomeDrivePedestrianOrchestratorRuntime;
  config: HomeDrivePedestrianResidentPoolConfig;
}>;

export type HomeDrivePedestrianOrchestratorResult = Readonly<{
  agents: readonly HomeDrivePedestrianAgent[];
  runtime: HomeDrivePedestrianOrchestratorRuntime;
  diagnostics: HomeDrivePedestrianOrchestratorDiagnostics;
  didRepopulate: boolean;
  createdAgentCount: number;
  teleportedAgentCount: number;
}>;
