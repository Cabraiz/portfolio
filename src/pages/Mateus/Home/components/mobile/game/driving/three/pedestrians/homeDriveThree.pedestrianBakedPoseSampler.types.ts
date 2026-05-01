// src/pages/Mateus/Home/components/mobile/game/driving/three/pedestrians/homeDriveThree.pedestrianBakedPoseSampler.types.ts

import type { HomeDrivePedestrianAgent } from "../../domain/pedestrians";
import type { HomeDriveThreePedestrianBakedPose } from "./homeDriveThree.pedestrianAnimationBake.types";

export type HomeDriveThreePedestrianBakedPoseSamplerOptions = Readonly<{
  agent: HomeDrivePedestrianAgent;
  elapsedSeconds?: number;
  distanceMeters?: number;
  phaseOffsetRad?: number;
  interpolation?: boolean;
}>;

export type HomeDriveThreePedestrianBakedPoseSample = Readonly<{
  pose: HomeDriveThreePedestrianBakedPose;
  phaseRad: number;
  movingFactor: number;
  sampleIndexA: number;
  sampleIndexB: number;
  sampleMix: number;
}>;
