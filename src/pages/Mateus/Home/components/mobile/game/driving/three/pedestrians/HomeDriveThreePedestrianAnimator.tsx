// src/pages/Mateus/Home/components/mobile/game/driving/three/pedestrians/HomeDriveThreePedestrianAnimator.tsx

import { useMemo } from "react";

import type { HomeDrivePedestrianAgent } from "../../domain/pedestrians";
import { getHomeDriveThreePedestrianAnimationRuntime } from "./homeDriveThree.pedestrianAssets";

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

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getMovingFactor(agent: HomeDrivePedestrianAgent): number {
  return clamp(
    Math.abs(agent.speedMps) / Math.max(0.32, agent.baseSpeedMps),
    0,
    1.35,
  );
}

function getIdleSway(agent: HomeDrivePedestrianAgent): number {
  return Math.sin(agent.animationPhase * 0.42 + agent.seed * 0.0007);
}

export function getHomeDriveThreePedestrianPose(
  agent: HomeDrivePedestrianAgent,
): HomeDriveThreePedestrianPose {
  const animationRuntime = getHomeDriveThreePedestrianAnimationRuntime(
    agent.animationKey,
  );
  const movingFactor =
    getMovingFactor(agent) * animationRuntime.baseSpeedMultiplier;
  const phase = agent.animationPhase;
  const walkSin = Math.sin(phase);
  const walkCos = Math.cos(phase);
  const idleSway = getIdleSway(agent);

  let leftArmPitchRad =
    -walkSin * animationRuntime.armSwingAmplitude * movingFactor;
  let rightArmPitchRad =
    walkSin * animationRuntime.armSwingAmplitude * movingFactor;
  let leftArmSideRad = 0.12 + idleSway * 0.025;
  let rightArmSideRad = -0.12 - idleSway * 0.025;
  let leftForearmPitchRad = 0.08;
  let rightForearmPitchRad = 0.08;
  let headYawRad = agent.idleLookYawRad * (agent.speedMps < 0.08 ? 1 : 0.28);
  let headPitchRad = idleSway * 0.035;
  let torsoPitchRad = Math.abs(walkSin) * 0.025 * movingFactor;
  let torsoRollRad = walkCos * 0.025 * movingFactor;

  if (agent.animationKey === "smoke") {
    rightArmPitchRad = -1.18 + Math.sin(phase * 0.38) * 0.08;
    rightArmSideRad = -0.28;
    rightForearmPitchRad = -0.62;
    leftArmPitchRad = 0.12 + idleSway * 0.04;
    headPitchRad = -0.08 + Math.sin(phase * 0.26) * 0.025;
    headYawRad += Math.sin(phase * 0.2) * 0.08;
    torsoPitchRad = -0.03;
  }

  if (agent.animationKey === "phone") {
    rightArmPitchRad = -1.04;
    rightArmSideRad = -0.2;
    rightForearmPitchRad = -0.84;
    headPitchRad = 0.12;
    headYawRad += Math.sin(phase * 0.18) * 0.04;
  }

  if (agent.animationKey === "talk") {
    rightArmPitchRad = -0.38 + Math.sin(phase * 0.72) * 0.28;
    rightArmSideRad = -0.32 + Math.cos(phase * 0.6) * 0.08;
    rightForearmPitchRad = -0.42 + Math.sin(phase * 0.5) * 0.18;
    leftArmPitchRad = -0.12 + Math.cos(phase * 0.54) * 0.12;
    headYawRad += Math.sin(phase * 0.34) * 0.16;
  }

  if (agent.animationKey === "carry-bags") {
    leftArmPitchRad = 0.16 + walkSin * 0.06;
    rightArmPitchRad = 0.14 - walkSin * 0.06;
    leftArmSideRad = 0.22;
    rightArmSideRad = -0.22;
    leftForearmPitchRad = 0.18;
    rightForearmPitchRad = 0.18;
    torsoPitchRad += 0.035;
  }

  if (agent.animationKey === "child-walk") {
    leftArmSideRad += 0.05;
    rightArmSideRad -= 0.05;
    headYawRad += Math.sin(phase * 0.52) * 0.08;
  }

  return {
    bobY:
      Math.abs(walkSin) * animationRuntime.bobAmplitude * movingFactor +
      Math.sin(phase * 0.18) * 0.006,
    torsoPitchRad,
    torsoRollRad,
    headYawRad,
    headPitchRad,
    leftArmPitchRad,
    rightArmPitchRad,
    leftArmSideRad,
    rightArmSideRad,
    leftForearmPitchRad,
    rightForearmPitchRad,
    leftLegPitchRad: walkSin * animationRuntime.stepAmplitude * movingFactor,
    rightLegPitchRad: -walkSin * animationRuntime.stepAmplitude * movingFactor,
    leftFootPitchRad: -walkSin * 0.22 * movingFactor,
    rightFootPitchRad: walkSin * 0.22 * movingFactor,
  };
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
