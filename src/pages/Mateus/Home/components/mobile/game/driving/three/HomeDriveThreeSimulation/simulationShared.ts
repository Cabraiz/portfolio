// src/pages/Mateus/Home/components/mobile/game/driving/three/HomeDriveThreeSimulation/simulationShared.ts
// Tipos, constantes do passo fixo e ajudantes numéricos.

import type {
  HomeDriveBuildingCollisionRuntimeState,
} from "../../domain/buildingCollisions";
import type { HomeDriveCrosswalkRuntimeState } from "../../domain/crosswalks";
import type { HomeDriveBuilding } from "../../domain/homeDrive.building.types";
import type {
  HomeDriveTrafficRuntimeState,
} from "../../domain/homeDrive.traffic.types";
import type {
  HomeDriveInputState,
  HomeDriveRuntimeState,
} from "../../domain/homeDrive.types";
import type {
  HomeDriveParkedVehicleRuntimeState,
} from "../../domain/parkedVehicles";
import type {
  HomeDriveUrbanFixtureCollisionRuntimeState,
  HomeDriveUrbanStreetLight,
} from "../../domain/urbanFixtures";
import type { HomeDrivePedestrianRuntimeState } from "../../domain/pedestrians";
import type {
  HomeDrivePedestrianPerformanceProfile,
} from "../../domain/pedestrians/homeDrive.pedestrianPerformance";
import type { HomeDriveRuntimeProfilerState } from "../../domain/diagnostics";

export type HomeDriveMutableRef<T> = {

  current: T;

};


export type HomeDriveThreeSimulationProps = Readonly<{

  runtimeRef: HomeDriveMutableRef<HomeDriveRuntimeState>;

  inputRef: HomeDriveMutableRef<HomeDriveInputState>;

  trafficRef?: HomeDriveMutableRef<HomeDriveTrafficRuntimeState>;

  parkedVehiclesRef?: HomeDriveMutableRef<HomeDriveParkedVehicleRuntimeState>;

  urbanFixtureCollisionsRef?: HomeDriveMutableRef<HomeDriveUrbanFixtureCollisionRuntimeState>;

  urbanStreetLights?: readonly HomeDriveUrbanStreetLight[];

  buildingCollisionsRef?: HomeDriveMutableRef<HomeDriveBuildingCollisionRuntimeState>;

  buildings?: readonly HomeDriveBuilding[];

  pedestriansRef?: HomeDriveMutableRef<HomeDrivePedestrianRuntimeState>;

  crosswalksRef?: HomeDriveMutableRef<HomeDriveCrosswalkRuntimeState>;

  pedestrianPerformance?: HomeDrivePedestrianPerformanceProfile;

  isPortrait?: boolean;

  enabled?: boolean;

  publishRuntimeSnapshot?: () => void;

  snapshotHz?: number;

  runtimeProfilerRef?: HomeDriveMutableRef<HomeDriveRuntimeProfilerState>;

}>;


export type SimulationStepResult = Readonly<{

  runtime: HomeDriveRuntimeState;

  hadCollision: boolean;

}>;


export const FIXED_STEP_SECONDS = 1 / 60;

export const MAX_ACCUMULATED_SECONDS = 0.12;

export const MAX_STEPS_PER_FRAME = 5;

export const DEFAULT_SNAPSHOT_HZ = 8;

export function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
}


export function sanitizeDeltaSeconds(deltaSeconds: number): number {

  if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) {

    return 0;

  }


  return Math.min(deltaSeconds, MAX_ACCUMULATED_SECONDS);

}
