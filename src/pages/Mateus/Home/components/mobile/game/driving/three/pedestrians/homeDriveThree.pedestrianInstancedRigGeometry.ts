// src/pages/Mateus/Home/components/mobile/game/driving/three/pedestrians/homeDriveThree.pedestrianInstancedRigGeometry.ts

import {
  BoxGeometry,
  CapsuleGeometry,
  SphereGeometry,
  type BufferGeometry,
} from "three";

export type HomeDriveThreePedestrianInstancedRigPartKey =
  | "torso"
  | "hips"
  | "head"
  | "hair"
  | "leftUpperArm"
  | "rightUpperArm"
  | "leftLowerArm"
  | "rightLowerArm"
  | "leftLeg"
  | "rightLeg"
  | "leftFoot"
  | "rightFoot";

export const HOME_DRIVE_THREE_PEDESTRIAN_INSTANCED_RIG_PARTS: readonly HomeDriveThreePedestrianInstancedRigPartKey[] =
  Object.freeze([
    "torso",
    "hips",
    "head",
    "hair",
    "leftUpperArm",
    "rightUpperArm",
    "leftLowerArm",
    "rightLowerArm",
    "leftLeg",
    "rightLeg",
    "leftFoot",
    "rightFoot",
  ]);

export type HomeDriveThreePedestrianInstancedRigGeometryMap = Readonly<
  Record<HomeDriveThreePedestrianInstancedRigPartKey, BufferGeometry>
>;

export function createHomeDriveThreePedestrianInstancedRigGeometries(): HomeDriveThreePedestrianInstancedRigGeometryMap {
  const torso = new BoxGeometry(1, 1, 1);
  const hips = new BoxGeometry(1, 1, 1);
  const head = new SphereGeometry(0.5, 10, 8);
  const hair = new SphereGeometry(
    0.5,
    10,
    6,
    0,
    Math.PI * 2,
    0,
    Math.PI * 0.58,
  );
  const limb = new CapsuleGeometry(0.5, 1, 3, 6);
  const lowerLimb = new CapsuleGeometry(0.5, 1, 3, 6);
  const leg = new CapsuleGeometry(0.5, 1, 3, 6);
  const foot = new BoxGeometry(1, 1, 1);

  return {
    torso,
    hips,
    head,
    hair,
    leftUpperArm: limb.clone(),
    rightUpperArm: limb.clone(),
    leftLowerArm: lowerLimb.clone(),
    rightLowerArm: lowerLimb.clone(),
    leftLeg: leg.clone(),
    rightLeg: leg.clone(),
    leftFoot: foot.clone(),
    rightFoot: foot.clone(),
  };
}

export function disposeHomeDriveThreePedestrianInstancedRigGeometries(
  geometries: HomeDriveThreePedestrianInstancedRigGeometryMap,
): void {
  HOME_DRIVE_THREE_PEDESTRIAN_INSTANCED_RIG_PARTS.forEach((part) => {
    geometries[part].dispose();
  });
}
