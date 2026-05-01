// src/pages/Mateus/Home/components/mobile/game/driving/three/pedestrians/homeDriveThree.pedestrianTransformBuffer.ts

import { Matrix4, Object3D } from "three";
import type { HomeDrivePedestrianAgent } from "../../domain/pedestrians";
import { getHomeDriveThreePedestrianInstancedScale } from "./homeDriveThree.pedestrianInstancing";

const TEMP_OBJECT = new Object3D();
const TEMP_MATRIX = new Matrix4();

function getWalkBob(agent: HomeDrivePedestrianAgent, elapsedSeconds: number): number {
  const phase = agent.animationPhase + elapsedSeconds * Math.max(0.6, agent.speedMps) * 3.2;

  return Math.sin(phase) * Math.min(0.045, Math.max(0, agent.speedMps) * 0.018);
}

export function composeHomeDriveThreePedestrianInstanceMatrix(
  agent: HomeDrivePedestrianAgent,
  elapsedSeconds = 0,
  detailScale = 1,
): Matrix4 {
  const scale = getHomeDriveThreePedestrianInstancedScale(agent);
  const bob = getWalkBob(agent, elapsedSeconds);

  TEMP_OBJECT.position.set(agent.position.x, 0.92 + bob, agent.position.z);
  TEMP_OBJECT.rotation.set(0, agent.headingRad, 0);
  TEMP_OBJECT.scale.set(scale.x * detailScale, scale.y * detailScale, scale.z * detailScale);
  TEMP_OBJECT.updateMatrix();

  return TEMP_MATRIX.copy(TEMP_OBJECT.matrix);
}

export function writeHomeDriveThreePedestrianInstanceMatrices(
  agents: readonly HomeDrivePedestrianAgent[],
  matrices: Matrix4[],
  elapsedSeconds = 0,
  detailScale = 1,
): readonly Matrix4[] {
  matrices.length = 0;

  agents.forEach((agent) => {
    matrices.push(
      composeHomeDriveThreePedestrianInstanceMatrix(agent, elapsedSeconds, detailScale).clone(),
    );
  });

  return matrices;
}
