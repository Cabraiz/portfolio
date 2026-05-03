// src/pages/Mateus/Home/components/mobile/game/driving/three/pedestrians/homeDriveThree.pedestrianAnimationBake.types.ts



import type { HomeDrivePedestrianAnimationKey } from "../../domain/pedestrians";



export type HomeDriveThreePedestrianBakedPose = Readonly<{

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



export type HomeDriveThreePedestrianAnimationBakeQuality =

  | "low"

  | "balanced"

  | "high";



export type HomeDriveThreePedestrianAnimationBakeClip = Readonly<{

  animationKey: HomeDrivePedestrianAnimationKey;

  sampleCount: number;

  durationPhase: number;

  samples: readonly HomeDriveThreePedestrianBakedPose[];

}>;



export type HomeDriveThreePedestrianAnimationBakeLibrary = Readonly<

  Record<HomeDrivePedestrianAnimationKey, HomeDriveThreePedestrianAnimationBakeClip>

>;



export type HomeDriveThreePedestrianAnimationBakeOptions = Readonly<{

  sampleCount?: number;

  quality?: HomeDriveThreePedestrianAnimationBakeQuality;

}>;



export type HomeDriveThreePedestrianAnimationBakeSampleOptions = Readonly<{

  animationKey: HomeDrivePedestrianAnimationKey;

  phaseRad: number;

  sampleCount?: number;

}>;



export const HOME_DRIVE_THREE_PEDESTRIAN_ZERO_BAKED_POSE: HomeDriveThreePedestrianBakedPose =

  Object.freeze({

    bobY: 0,

    torsoPitchRad: 0,

    torsoRollRad: 0,

    headYawRad: 0,

    headPitchRad: 0,

    leftArmPitchRad: 0,

    rightArmPitchRad: 0,

    leftArmSideRad: 0.12,

    rightArmSideRad: -0.12,

    leftForearmPitchRad: 0.08,

    rightForearmPitchRad: 0.08,

    leftLegPitchRad: 0,

    rightLegPitchRad: 0,

    leftFootPitchRad: 0,

    rightFootPitchRad: 0,

  });




export type HomeDriveThreePedestrianAnimationBakePrewarmSummary = Readonly<{
  clipCount: number;
  sampleCount: number;
  poseScalarChecksum: number;
}>;
