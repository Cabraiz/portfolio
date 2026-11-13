// src/pages/Mateus/Home/components/mobile/game/driving/three/pedestrians/homeDriveThree.pedestrianAnimationBake.ts



import type { HomeDrivePedestrianAnimationKey } from "../../domain/pedestrians";

import type {

  HomeDriveThreePedestrianAnimationBakeClip,

  HomeDriveThreePedestrianAnimationBakeLibrary,

  HomeDriveThreePedestrianAnimationBakeOptions,

  HomeDriveThreePedestrianBakedPose,

} from "./homeDriveThree.pedestrianAnimationBake.types";

import { HOME_DRIVE_THREE_PEDESTRIAN_ZERO_BAKED_POSE } from "./homeDriveThree.pedestrianAnimationBake.types";
import {
	TWO_PI,
	getSampleCount,
	createPoseForPhase,
} from "./homeDriveThree.pedestrianAnimationBake.pose";



export const HOME_DRIVE_THREE_PEDESTRIAN_BAKED_ANIMATION_KEYS: readonly HomeDrivePedestrianAnimationKey[] =

  Object.freeze([

    "idle",

    "walk",

    "slow-walk",

    "fast-walk",

    "smoke",

    "phone",

    "talk",

    "carry-bags",

    "child-walk",

  ]);



export function createHomeDriveThreePedestrianAnimationBakeClip(

  animationKey: HomeDrivePedestrianAnimationKey,

  options?: HomeDriveThreePedestrianAnimationBakeOptions,

): HomeDriveThreePedestrianAnimationBakeClip {

  const sampleCount = getSampleCount(options);

  const samples: HomeDriveThreePedestrianBakedPose[] = [];



  for (let index = 0; index < sampleCount; index += 1) {

    const phase = (index / sampleCount) * TWO_PI;

    samples.push(createPoseForPhase(animationKey, phase));

  }



  return Object.freeze({

    animationKey,

    sampleCount,

    durationPhase: TWO_PI,

    samples: Object.freeze(samples),

  });

}



export function createHomeDriveThreePedestrianAnimationBakeLibrary(

  options?: HomeDriveThreePedestrianAnimationBakeOptions,

): HomeDriveThreePedestrianAnimationBakeLibrary {

  return HOME_DRIVE_THREE_PEDESTRIAN_BAKED_ANIMATION_KEYS.reduce(

    (library, animationKey) => {

      return {

        ...library,

        [animationKey]: createHomeDriveThreePedestrianAnimationBakeClip(

          animationKey,

          options,

        ),

      };

    },

    {} as HomeDriveThreePedestrianAnimationBakeLibrary,

  );

}



export const HOME_DRIVE_THREE_PEDESTRIAN_ANIMATION_BAKE_LIBRARY =

  createHomeDriveThreePedestrianAnimationBakeLibrary();



export function getHomeDriveThreePedestrianAnimationBakeClip(

  animationKey: HomeDrivePedestrianAnimationKey,

): HomeDriveThreePedestrianAnimationBakeClip {

  return (

    HOME_DRIVE_THREE_PEDESTRIAN_ANIMATION_BAKE_LIBRARY[animationKey] ??

    HOME_DRIVE_THREE_PEDESTRIAN_ANIMATION_BAKE_LIBRARY.walk ??

    Object.freeze({

      animationKey,

      sampleCount: 1,

      durationPhase: TWO_PI,

      samples: Object.freeze([HOME_DRIVE_THREE_PEDESTRIAN_ZERO_BAKED_POSE]),

    })

  );

}




let homeDriveThreePedestrianAnimationBakePrewarmSummary:
  | import("./homeDriveThree.pedestrianAnimationBake.types").HomeDriveThreePedestrianAnimationBakePrewarmSummary
  | null = null;

function getPoseScalarChecksum(pose: HomeDriveThreePedestrianBakedPose): number {
  return (
    pose.bobY +
    pose.torsoPitchRad +
    pose.torsoRollRad +
    pose.headYawRad +
    pose.headPitchRad +
    pose.leftArmPitchRad +
    pose.rightArmPitchRad +
    pose.leftArmSideRad +
    pose.rightArmSideRad +
    pose.leftForearmPitchRad +
    pose.rightForearmPitchRad +
    pose.leftLegPitchRad +
    pose.rightLegPitchRad +
    pose.leftFootPitchRad +
    pose.rightFootPitchRad
  );
}

export function prewarmHomeDriveThreePedestrianAnimationBakeCache(): import("./homeDriveThree.pedestrianAnimationBake.types").HomeDriveThreePedestrianAnimationBakePrewarmSummary {
  if (homeDriveThreePedestrianAnimationBakePrewarmSummary) {
    return homeDriveThreePedestrianAnimationBakePrewarmSummary;
  }

  let sampleCount = 0;
  let poseScalarChecksum = 0;

  for (const animationKey of HOME_DRIVE_THREE_PEDESTRIAN_BAKED_ANIMATION_KEYS) {
    const clip = getHomeDriveThreePedestrianAnimationBakeClip(animationKey);

    sampleCount += clip.samples.length;

    for (const pose of clip.samples) {
      poseScalarChecksum += getPoseScalarChecksum(pose);
    }
  }

  homeDriveThreePedestrianAnimationBakePrewarmSummary = Object.freeze({
    clipCount: HOME_DRIVE_THREE_PEDESTRIAN_BAKED_ANIMATION_KEYS.length,
    sampleCount,
    poseScalarChecksum: Number(poseScalarChecksum.toFixed(6)),
  });

  return homeDriveThreePedestrianAnimationBakePrewarmSummary;
}

export function getHomeDriveThreePedestrianAnimationBakePrewarmSummary(): import("./homeDriveThree.pedestrianAnimationBake.types").HomeDriveThreePedestrianAnimationBakePrewarmSummary | null {
  return homeDriveThreePedestrianAnimationBakePrewarmSummary;
}
