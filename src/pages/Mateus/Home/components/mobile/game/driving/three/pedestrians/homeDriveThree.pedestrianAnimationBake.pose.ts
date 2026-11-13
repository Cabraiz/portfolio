// src/pages/Mateus/Home/components/mobile/game/driving/three/pedestrians/homeDriveThree.pedestrianAnimationBake.pose.ts

import type { HomeDrivePedestrianAnimationKey } from "../../domain/pedestrians";
import {
	getHomeDriveThreePedestrianAnimationRuntime,
} from "./homeDriveThree.pedestrianAssets";
import type {
	HomeDriveThreePedestrianAnimationBakeOptions,
	HomeDriveThreePedestrianBakedPose,
} from "./homeDriveThree.pedestrianAnimationBake.types";

export const TWO_PI = Math.PI * 2;

const DEFAULT_SAMPLE_COUNT = 32;

const MIN_SAMPLE_COUNT = 8;

const MAX_SAMPLE_COUNT = 64;



function clamp(value: number, min: number, max: number): number {

  return Math.max(min, Math.min(max, value));

}



export function getSampleCount(options?: HomeDriveThreePedestrianAnimationBakeOptions): number {

  if (typeof options?.sampleCount === "number") {

    return Math.floor(clamp(options.sampleCount, MIN_SAMPLE_COUNT, MAX_SAMPLE_COUNT));

  }



  switch (options?.quality) {

    case "low":

      return 16;



    case "high":

      return 48;



    case "balanced":

    default:

      return DEFAULT_SAMPLE_COUNT;

  }

}



export function createPoseForPhase(

  animationKey: HomeDrivePedestrianAnimationKey,

  phase: number,

): HomeDriveThreePedestrianBakedPose {

  const animationRuntime = getHomeDriveThreePedestrianAnimationRuntime(animationKey);

  const walkSin = Math.sin(phase);

  const walkCos = Math.cos(phase);

  const idleSway = Math.sin(phase * 0.42);



  let leftArmPitchRad = -walkSin * animationRuntime.armSwingAmplitude;

  let rightArmPitchRad = walkSin * animationRuntime.armSwingAmplitude;

  let leftArmSideRad = 0.12 + idleSway * 0.025;

  let rightArmSideRad = -0.12 - idleSway * 0.025;

  let leftForearmPitchRad = 0.08;

  let rightForearmPitchRad = 0.08;

  let headYawRad = 0;

  let headPitchRad = idleSway * 0.035;

  let torsoPitchRad = Math.abs(walkSin) * 0.025;

  let torsoRollRad = walkCos * 0.025;



  if (animationKey === "smoke") {

    rightArmPitchRad = -1.18 + Math.sin(phase * 0.38) * 0.08;

    rightArmSideRad = -0.28;

    rightForearmPitchRad = -0.62;

    leftArmPitchRad = 0.12 + idleSway * 0.04;

    headPitchRad = -0.08 + Math.sin(phase * 0.26) * 0.025;

    headYawRad += Math.sin(phase * 0.2) * 0.08;

    torsoPitchRad = -0.03;

    torsoRollRad *= 0.28;

  }



  if (animationKey === "phone") {

    rightArmPitchRad = -1.04;

    rightArmSideRad = -0.2;

    rightForearmPitchRad = -0.84;

    headPitchRad = 0.12;

    headYawRad += Math.sin(phase * 0.18) * 0.04;

    torsoPitchRad *= 0.22;

    torsoRollRad *= 0.22;

  }



  if (animationKey === "talk") {

    rightArmPitchRad = -0.38 + Math.sin(phase * 0.72) * 0.28;

    rightArmSideRad = -0.32 + Math.cos(phase * 0.6) * 0.08;

    rightForearmPitchRad = -0.42 + Math.sin(phase * 0.5) * 0.18;

    leftArmPitchRad = -0.12 + Math.cos(phase * 0.54) * 0.12;

    headYawRad += Math.sin(phase * 0.34) * 0.16;

    torsoPitchRad *= 0.35;

    torsoRollRad *= 0.35;

  }



  if (animationKey === "carry-bags") {

    leftArmPitchRad = 0.16 + walkSin * 0.06;

    rightArmPitchRad = 0.14 - walkSin * 0.06;

    leftArmSideRad = 0.22;

    rightArmSideRad = -0.22;

    leftForearmPitchRad = 0.18;

    rightForearmPitchRad = 0.18;

    torsoPitchRad += 0.035;

  }



  if (animationKey === "child-walk") {

    leftArmSideRad += 0.05;

    rightArmSideRad -= 0.05;

    headYawRad += Math.sin(phase * 0.52) * 0.08;

  }



  if (animationKey === "idle") {

    leftArmPitchRad *= 0.22;

    rightArmPitchRad *= 0.22;

    torsoPitchRad *= 0.35;

    torsoRollRad *= 0.35;

  }



  return {

    bobY:

      Math.abs(walkSin) * animationRuntime.bobAmplitude +

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

    leftLegPitchRad: animationKey === "idle"

      ? 0

      : walkSin * animationRuntime.stepAmplitude,

    rightLegPitchRad: animationKey === "idle"

      ? 0

      : -walkSin * animationRuntime.stepAmplitude,

    leftFootPitchRad: animationKey === "idle" ? 0 : -walkSin * 0.22,

    rightFootPitchRad: animationKey === "idle" ? 0 : walkSin * 0.22,

  };

}
