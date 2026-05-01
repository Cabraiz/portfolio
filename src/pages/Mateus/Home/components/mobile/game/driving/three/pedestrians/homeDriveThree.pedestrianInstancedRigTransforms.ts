// src/pages/Mateus/Home/components/mobile/game/driving/three/pedestrians/homeDriveThree.pedestrianInstancedRigTransforms.ts

import {
  Euler,
  Matrix4,
  Quaternion,
  Vector3,
} from "three";
import type { HomeDrivePedestrianAgent } from "../../domain/pedestrians";
import { getHomeDriveThreePedestrianProceduralProfile } from "./homeDriveThree.pedestrianAssets";
import type { HomeDriveThreePedestrianBakedPose } from "./homeDriveThree.pedestrianAnimationBake.types";
import { getHomeDriveThreePedestrianInstancedScale } from "./homeDriveThree.pedestrianInstancing";
import type { HomeDriveThreePedestrianInstancedRigPartKey } from "./homeDriveThree.pedestrianInstancedRigGeometry";

export type HomeDriveThreePedestrianInstancedRigVisualOffset = Readonly<{
  x: number;
  z: number;
}>;

export type HomeDriveThreePedestrianInstancedRigTransformInput = Readonly<{
  agent: HomeDrivePedestrianAgent;
  pose: HomeDriveThreePedestrianBakedPose;
  part: HomeDriveThreePedestrianInstancedRigPartKey;

  /**
   * Mantido por compatibilidade com chamadas antigas.
   * O conceito de reveal/scale foi removido: commit entra em escala normal.
   */
  revealAlpha?: number;

  visualOffset?: HomeDriveThreePedestrianInstancedRigVisualOffset;
  out: Matrix4;
}>;

const ROOT_POSITION = new Vector3();
const LOCAL_POSITION = new Vector3();
const LOCAL_SCALE = new Vector3(1, 1, 1);
const ROOT_SCALE = new Vector3(1, 1, 1);
const ROOT_QUATERNION = new Quaternion();
const LOCAL_QUATERNION = new Quaternion();
const ROOT_MATRIX = new Matrix4();
const TORSO_MATRIX = new Matrix4();
const LOCAL_MATRIX = new Matrix4();
const Y_AXIS = new Vector3(0, 1, 0);
const TEMP_EULER = new Euler(0, 0, 0, "XYZ");

function composeLocalMatrix(
  matrix: Matrix4,
  position: Vector3,
  rotation: Euler,
  scale: Vector3,
): Matrix4 {
  LOCAL_QUATERNION.setFromEuler(rotation);
  matrix.compose(position, LOCAL_QUATERNION, scale);

  return matrix;
}

function getHairScaleVariant(
  variant: number,
): Readonly<{ x: number; y: number; z: number }> {
  const normalized = Math.abs(variant) % 4;

  if (normalized === 0) {
    return { x: 1.08, y: 0.48, z: 1 };
  }

  if (normalized === 1) {
    return { x: 0.9, y: 0.28, z: 0.92 };
  }

  if (normalized === 2) {
    return { x: 1.18, y: 0.62, z: 1.12 };
  }

  return { x: 0.76, y: 0.22, z: 0.78 };
}

function composeRootMatrix(
  agent: HomeDrivePedestrianAgent,
  pose: HomeDriveThreePedestrianBakedPose,
  visualOffset: HomeDriveThreePedestrianInstancedRigVisualOffset | undefined,
): Matrix4 {
  const instancedScale = getHomeDriveThreePedestrianInstancedScale(agent);

  ROOT_POSITION.set(
    agent.position.x + (visualOffset?.x ?? 0),
    pose.bobY,
    agent.position.z + (visualOffset?.z ?? 0),
  );
  ROOT_QUATERNION.setFromAxisAngle(Y_AXIS, agent.headingRad);
  ROOT_SCALE.set(instancedScale.x, instancedScale.y, instancedScale.z);
  ROOT_MATRIX.compose(ROOT_POSITION, ROOT_QUATERNION, ROOT_SCALE);

  return ROOT_MATRIX;
}

function composeTorsoMatrix(
  agent: HomeDrivePedestrianAgent,
  pose: HomeDriveThreePedestrianBakedPose,
  visualOffset: HomeDriveThreePedestrianInstancedRigVisualOffset | undefined,
): Matrix4 {
  const root = composeRootMatrix(agent, pose, visualOffset);

  composeLocalMatrix(
    LOCAL_MATRIX,
    LOCAL_POSITION.set(0, 0, 0),
    TEMP_EULER.set(pose.torsoPitchRad, 0, pose.torsoRollRad),
    LOCAL_SCALE.set(1, 1, 1),
  );

  TORSO_MATRIX.multiplyMatrices(root, LOCAL_MATRIX);

  return TORSO_MATRIX;
}

function writePartMatrixFromTorso(
  out: Matrix4,
  position: Vector3,
  rotation: Euler,
  scale: Vector3,
): Matrix4 {
  composeLocalMatrix(LOCAL_MATRIX, position, rotation, scale);
  out.multiplyMatrices(TORSO_MATRIX, LOCAL_MATRIX);

  return out;
}

export function writeHomeDriveThreePedestrianInstancedRigPartMatrix({
  agent,
  pose,
  part,
  visualOffset,
  out,
}: HomeDriveThreePedestrianInstancedRigTransformInput): Matrix4 {
  const profile = getHomeDriveThreePedestrianProceduralProfile(agent);
  composeTorsoMatrix(agent, pose, visualOffset);

  switch (part) {
    case "torso":
      return writePartMatrixFromTorso(
        out,
        LOCAL_POSITION.set(0, profile.hipY + profile.torsoHeightMeters * 0.45, 0),
        TEMP_EULER.set(0, 0, 0),
        LOCAL_SCALE.set(
          profile.torsoWidthMeters,
          profile.torsoHeightMeters,
          profile.torsoDepthMeters,
        ),
      );

    case "hips":
      return writePartMatrixFromTorso(
        out,
        LOCAL_POSITION.set(0, profile.hipY - profile.legLengthMeters * 0.08, 0),
        TEMP_EULER.set(0, 0, 0),
        LOCAL_SCALE.set(
          profile.hipWidthMeters,
          profile.torsoHeightMeters * 0.28,
          profile.torsoDepthMeters * 0.9,
        ),
      );

    case "head":
      return writePartMatrixFromTorso(
        out,
        LOCAL_POSITION.set(0, profile.headY, 0),
        TEMP_EULER.set(pose.headPitchRad, pose.headYawRad, 0),
        LOCAL_SCALE.set(
          profile.headRadiusMeters * 2,
          profile.headRadiusMeters * 2,
          profile.headRadiusMeters * 2,
        ),
      );

    case "hair": {
      const hairScale = getHairScaleVariant(agent.appearance.hairVariant);

      return writePartMatrixFromTorso(
        out,
        LOCAL_POSITION.set(
          0,
          profile.headY + profile.headRadiusMeters * 0.58,
          -profile.headRadiusMeters * 0.03,
        ),
        TEMP_EULER.set(pose.headPitchRad, pose.headYawRad, 0),
        LOCAL_SCALE.set(
          profile.headRadiusMeters * 2 * hairScale.x,
          profile.headRadiusMeters * 2 * hairScale.y,
          profile.headRadiusMeters * 2 * hairScale.z,
        ),
      );
    }

    case "leftUpperArm":
      return writePartMatrixFromTorso(
        out,
        LOCAL_POSITION.set(
          profile.torsoWidthMeters * 0.56,
          profile.shoulderY - profile.armLengthMeters * 0.28,
          0,
        ),
        TEMP_EULER.set(pose.leftArmPitchRad, 0, pose.leftArmSideRad),
        LOCAL_SCALE.set(
          profile.armRadiusMeters * 1.95,
          profile.armLengthMeters * 0.55,
          profile.armRadiusMeters * 1.95,
        ),
      );

    case "rightUpperArm":
      return writePartMatrixFromTorso(
        out,
        LOCAL_POSITION.set(
          -profile.torsoWidthMeters * 0.56,
          profile.shoulderY - profile.armLengthMeters * 0.28,
          0,
        ),
        TEMP_EULER.set(pose.rightArmPitchRad, 0, pose.rightArmSideRad),
        LOCAL_SCALE.set(
          profile.armRadiusMeters * 1.95,
          profile.armLengthMeters * 0.55,
          profile.armRadiusMeters * 1.95,
        ),
      );

    case "leftLowerArm":
      return writePartMatrixFromTorso(
        out,
        LOCAL_POSITION.set(
          profile.torsoWidthMeters * 0.56,
          profile.shoulderY - profile.armLengthMeters * 0.76,
          0,
        ),
        TEMP_EULER.set(
          pose.leftArmPitchRad + pose.leftForearmPitchRad,
          0,
          pose.leftArmSideRad,
        ),
        LOCAL_SCALE.set(
          profile.armRadiusMeters * 1.78,
          profile.armLengthMeters * 0.38,
          profile.armRadiusMeters * 1.78,
        ),
      );

    case "rightLowerArm":
      return writePartMatrixFromTorso(
        out,
        LOCAL_POSITION.set(
          -profile.torsoWidthMeters * 0.56,
          profile.shoulderY - profile.armLengthMeters * 0.76,
          0,
        ),
        TEMP_EULER.set(
          pose.rightArmPitchRad + pose.rightForearmPitchRad,
          0,
          pose.rightArmSideRad,
        ),
        LOCAL_SCALE.set(
          profile.armRadiusMeters * 1.78,
          profile.armLengthMeters * 0.38,
          profile.armRadiusMeters * 1.78,
        ),
      );

    case "leftLeg":
      return writePartMatrixFromTorso(
        out,
        LOCAL_POSITION.set(
          profile.hipWidthMeters * 0.24,
          profile.hipY - profile.legLengthMeters * 0.42,
          0,
        ),
        TEMP_EULER.set(pose.leftLegPitchRad, 0, 0),
        LOCAL_SCALE.set(
          profile.legRadiusMeters * 1.95,
          profile.legLengthMeters * 0.78,
          profile.legRadiusMeters * 1.95,
        ),
      );

    case "rightLeg":
      return writePartMatrixFromTorso(
        out,
        LOCAL_POSITION.set(
          -profile.hipWidthMeters * 0.24,
          profile.hipY - profile.legLengthMeters * 0.42,
          0,
        ),
        TEMP_EULER.set(pose.rightLegPitchRad, 0, 0),
        LOCAL_SCALE.set(
          profile.legRadiusMeters * 1.95,
          profile.legLengthMeters * 0.78,
          profile.legRadiusMeters * 1.95,
        ),
      );

    case "leftFoot":
      return writePartMatrixFromTorso(
        out,
        LOCAL_POSITION.set(
          profile.hipWidthMeters * 0.24,
          profile.hipY - profile.legLengthMeters * 0.86,
          profile.footLengthMeters * 0.2,
        ),
        TEMP_EULER.set(pose.leftFootPitchRad, 0, 0),
        LOCAL_SCALE.set(
          profile.footWidthMeters,
          profile.legRadiusMeters * 0.84,
          profile.footLengthMeters,
        ),
      );

    case "rightFoot":
    default:
      return writePartMatrixFromTorso(
        out,
        LOCAL_POSITION.set(
          -profile.hipWidthMeters * 0.24,
          profile.hipY - profile.legLengthMeters * 0.86,
          profile.footLengthMeters * 0.2,
        ),
        TEMP_EULER.set(pose.rightFootPitchRad, 0, 0),
        LOCAL_SCALE.set(
          profile.footWidthMeters,
          profile.legRadiusMeters * 0.84,
          profile.footLengthMeters,
        ),
      );
  }
}


/**
 * Matriz de descarte para slots internos legados.
 *
 * O pipeline novo prefere nÃ£o incluir pending/staged-hidden em `mesh.count`.
 * Esta funÃ§Ã£o fica disponÃ­vel para qualquer fallback antigo que ainda precise
 * estacionar uma instÃ¢ncia fora do frustum sem usar material preto.
 */
const HIDDEN_ROOT_POSITION = new Vector3(0, -10000, 0);

export function writeHomeDriveThreePedestrianInstancedRigHiddenPartMatrix(
  out: Matrix4,
): Matrix4 {
  ROOT_QUATERNION.identity();
  ROOT_SCALE.set(0.0001, 0.0001, 0.0001);
  out.compose(HIDDEN_ROOT_POSITION, ROOT_QUATERNION, ROOT_SCALE);

  return out;
}


