// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianResidentPoolViewportRuntime.types.ts

import type { HomeDriveVector2 } from "../homeDrive.types";
import type { HomeDrivePedestrianResidentPoolDiagnostics } from "./homeDrive.pedestrianResidentPoolDiagnostics.types";
import type { HomeDrivePedestrianResidentPoolRuntime } from "./homeDrive.pedestrianResidentPoolRuntime.types";
import type {
  HomeDrivePedestrianResidentPoolConfig,
} from "./homeDrive.pedestrianResidentPool.types";
import type { HomeDrivePedestrianAgent, HomeDrivePedestrianSidewalkZone } from "./homeDrive.pedestrians.types";

export type HomeDrivePedestrianResidentPoolViewportRuntimeOptions = Readonly<{
  agents: readonly HomeDrivePedestrianAgent[];
  zones: readonly HomeDrivePedestrianSidewalkZone[];
  activeCenter: HomeDriveVector2;
  activeHeadingRad: number;
  activeSpeedMps: number;
  elapsedSeconds: number;
  seed: number;
  config: HomeDrivePedestrianResidentPoolConfig;
  runtime?: HomeDrivePedestrianResidentPoolRuntime;
}>;

export type HomeDrivePedestrianResidentPoolViewportRuntimeResult = Readonly<{
  agents: readonly HomeDrivePedestrianAgent[];
  runtime: HomeDrivePedestrianResidentPoolRuntime;
  diagnostics: HomeDrivePedestrianResidentPoolDiagnostics;
  createdAgentCount: number;
  reusedAgentCount: number;
  teleportedAgentCount: number;
}>;
