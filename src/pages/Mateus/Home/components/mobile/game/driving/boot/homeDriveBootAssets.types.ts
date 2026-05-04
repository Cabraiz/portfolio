// src/pages/Mateus/Home/components/mobile/game/driving/boot/homeDriveBootAssets.types.ts

import type {
  HomeDriveBuildingCollisionRuntimeState,
} from "../domain/buildingCollisions";
import type { HomeDriveBuilding } from "../domain/homeDrive.building.types";
import type { HomeDriveTrafficRuntimeState } from "../domain/homeDrive.traffic.types";
import type { HomeDriveRuntimeState, HomeDriveViewportMetrics } from "../domain/homeDrive.types";
import type { HomeDriveRuntimeProfilerState } from "../domain/diagnostics";
import type {
  HomeDriveCrosswalkRuntimeState,
} from "../domain/crosswalks";
import type {
  HomeDriveParkedVehicleRuntimeState,
} from "../domain/parkedVehicles";
import type {
  HomeDrivePedestrianRuntimeState,
} from "../domain/pedestrians";
import type {
  HomeDrivePedestrianPerformanceProfile,
} from "../domain/pedestrians/homeDrive.pedestrianPerformance";
import type {
  HomeDriveUrbanFixtureCollisionRuntimeState,
  HomeDriveUrbanStreetLight,
} from "../domain/urbanFixtures";

export type HomeDriveBootPhase =
  | "idle"
  | "images"
  | "audio"
  | "buildings"
  | "cars"
  | "city-fixtures"
  | "pedestrians"
  | "finalizing"
  | "rendering"
  | "ready"
  | "error";

export type HomeDriveBootProgressSnapshot = Readonly<{
  phase: HomeDriveBootPhase;
  label: string;
  detail: string;
  progress: number;
  loaded: number;
  total: number;
  startedAtMs: number;
  updatedAtMs: number;
  elapsedMs: number;
  errorMessage?: string;
}>;

export type HomeDriveBootAssetLoadResult = Readonly<{
  source: string;
  ok: boolean;
  kind: "image" | "audio";
  elapsedMs: number;
  status?: string;
  bytes?: number | null;
  errorMessage?: string;
}>;

export type HomeDriveBootDiagnostics = Readonly<{
  imageResults: readonly HomeDriveBootAssetLoadResult[];
  audioResults: readonly HomeDriveBootAssetLoadResult[];
  buildingCount: number;
  movingVehicleCount: number;
  parkedVehicleCount: number;
  pedestrianAgentCount: number;
  pedestrianZoneCount: number;
  crosswalkCount: number;
  streetLightCount: number;
  bakeClipCount: number;
  bakeSampleCount: number;
}>;

export type HomeDriveBootAssets = Readonly<{
  viewportKey: string;
  buildings: readonly HomeDriveBuilding[];
  trafficState: HomeDriveTrafficRuntimeState;
  parkedVehicleState: HomeDriveParkedVehicleRuntimeState;
  buildingCollisionState: HomeDriveBuildingCollisionRuntimeState;
  urbanFixtureCollisionState: HomeDriveUrbanFixtureCollisionRuntimeState;
  crosswalkState: HomeDriveCrosswalkRuntimeState;
  urbanStreetLights: readonly HomeDriveUrbanStreetLight[];
  pedestriansState: HomeDrivePedestrianRuntimeState;
  pedestrianPerformance: HomeDrivePedestrianPerformanceProfile;
  runtimeProfilerState: HomeDriveRuntimeProfilerState;
  diagnostics: HomeDriveBootDiagnostics;
}>;

export type HomeDriveBootCreateOptions = Readonly<{
  viewport: HomeDriveViewportMetrics;
  runtime: HomeDriveRuntimeState;
  onProgress?: (snapshot: HomeDriveBootProgressSnapshot) => void;
}>;
