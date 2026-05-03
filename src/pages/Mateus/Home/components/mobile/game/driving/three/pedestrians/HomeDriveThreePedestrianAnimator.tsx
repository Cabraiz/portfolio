// src/pages/Mateus/Home/components/mobile/game/driving/three/pedestrians/HomeDriveThreePedestrianAnimator.tsx

import { useMemo } from "react";

import type { HomeDrivePedestrianAgent } from "../../domain/pedestrians";
import { getHomeDriveThreePedestrianBakedPose } from "./homeDriveThree.pedestrianBakedPoseSampler";

export type HomeDriveThreePedestrianPose = Readonly<{
  bobY: number;
  torsoPitchRad: number;
  torsoRollRad: number;
  headYawRad: number;
  headPitchRad: number;
  leftArmPitchRad: number;
  rightArmPitchRad: number;
  leftArmSideRad: number;
  rightArmSideRad: number;
  leftForearmPitchRad: number;
  rightForearmPitchRad: number;
  leftLegPitchRad: number;
  rightLegPitchRad: number;
  leftFootPitchRad: number;
  rightFootPitchRad: number;
}>;

export function getHomeDriveThreePedestrianPose(
  agent: HomeDrivePedestrianAgent,
): HomeDriveThreePedestrianPose {
  return getHomeDriveThreePedestrianBakedPose(agent, 0);
}

export function useHomeDriveThreePedestrianPose(
  agent: HomeDrivePedestrianAgent,
): HomeDriveThreePedestrianPose {
  return useMemo(() => getHomeDriveThreePedestrianPose(agent), [
    agent.animationKey,
    agent.animationPhase,
    agent.baseSpeedMps,
    agent.idleLookYawRad,
    agent.seed,
    agent.speedMps,
  ]);
}

export default function HomeDriveThreePedestrianAnimator() {
  return null;
}
