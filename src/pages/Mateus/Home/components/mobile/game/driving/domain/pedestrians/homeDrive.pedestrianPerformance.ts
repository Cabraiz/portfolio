// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianPerformance.ts

import type {
  HomeDrivePedestrianPerformanceProfile,
} from "./homeDrive.pedestrianPerformance.types";
import {
  HOME_DRIVE_PEDESTRIAN_PERFORMANCE,
} from "./homeDrive.pedestrianPerformance.profiles";

export type {
  HomeDrivePedestrianPerformanceProfileKey,
  HomeDrivePedestrianPerformanceProfile,
} from "./homeDrive.pedestrianPerformance.types";
export {
  HOME_DRIVE_PEDESTRIAN_PERFORMANCE,
} from "./homeDrive.pedestrianPerformance.profiles";

export function getHomeDrivePedestrianPerformanceProfile(

  isPortrait: boolean,

): HomeDrivePedestrianPerformanceProfile {

  return HOME_DRIVE_PEDESTRIAN_PERFORMANCE[isPortrait ? "portrait" : "landscape"];

}

export function getHomeDrivePedestrianSimulationStepSeconds(

  profile: HomeDrivePedestrianPerformanceProfile,

): number {

  return 1 / Math.max(1, Math.min(60, profile.simulationHz));

}

