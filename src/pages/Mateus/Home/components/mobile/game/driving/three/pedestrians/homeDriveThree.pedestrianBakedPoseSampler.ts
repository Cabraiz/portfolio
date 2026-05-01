// src/pages/Mateus/Home/components/mobile/game/driving/three/pedestrians/homeDriveThree.pedestrianBakedPoseSampler.ts

import type { HomeDrivePedestrianAgent } from "../../domain/pedestrians";
import { getHomeDriveThreePedestrianAnimationRuntime } from "./homeDriveThree.pedestrianAssets";
import { getHomeDriveThreePedestrianAnimationBakeClip } from "./homeDriveThree.pedestrianAnimationBake";
import type { HomeDriveThreePedestrianBakedPose } from "./homeDriveThree.pedestrianAnimationBake.types";
import type {
  HomeDriveThreePedestrianBakedPoseSample,
  HomeDriveThreePedestrianBakedPoseSamplerOptions,
} from "./homeDriveThree.pedestrianBakedPoseSampler.types";

const TWO_PI = Math.PI * 2;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function lerp(first: number, second: number, mix: number): number {
  return first + (second - first) * mix;
}

function normalizePhase(phaseRad: number): number {
  if (!Number.isFinite(phaseRad)) {
    return 0;
  }

  const phase = phaseRad % TWO_PI;

  return phase < 0 ? phase + TWO_PI : phase;
}

function getMovingFactor(agent: HomeDrivePedestrianAgent): number {
  return clamp(
    Math.abs(agent.speedMps) / Math.max(0.32, agent.baseSpeedMps),
    0,
    1.35,
  );
}

function getElapsedPhaseContribution(
  agent: HomeDrivePedestrianAgent,
  elapsedSeconds: number,
): number {
  if (!Number.isFinite(elapsedSeconds) || elapsedSeconds <= 0) {
    return 0;
  }

  const speedFactor = clamp(Math.abs(agent.speedMps), 0.08, 3.2);
  const styleFactor =
    agent.appearance.walkStyleKey === "hurried"
      ? 1.18
      : agent.appearance.walkStyleKey === "heavy"
        ? 0.86
        : agent.appearance.walkStyleKey === "childlike"
          ? 1.32
          : agent.appearance.walkStyleKey === "relaxed"
            ? 0.92
            : 1;

  return elapsedSeconds * speedFactor * styleFactor * 1.72;
}

function interpolatePose(
  first: HomeDriveThreePedestrianBakedPose,
  second: HomeDriveThreePedestrianBakedPose,
  mix: number,
): HomeDriveThreePedestrianBakedPose {
  return {
    bobY: lerp(first.bobY, second.bobY, mix),
    torsoPitchRad: lerp(first.torsoPitchRad, second.torsoPitchRad, mix),
    torsoRollRad: lerp(first.torsoRollRad, second.torsoRollRad, mix),
    headYawRad: lerp(first.headYawRad, second.headYawRad, mix),
    headPitchRad: lerp(first.headPitchRad, second.headPitchRad, mix),
    leftArmPitchRad: lerp(first.leftArmPitchRad, second.leftArmPitchRad, mix),
    rightArmPitchRad: lerp(first.rightArmPitchRad, second.rightArmPitchRad, mix),
    leftArmSideRad: lerp(first.leftArmSideRad, second.leftArmSideRad, mix),
    rightArmSideRad: lerp(first.rightArmSideRad, second.rightArmSideRad, mix),
    leftForearmPitchRad: lerp(
      first.leftForearmPitchRad,
      second.leftForearmPitchRad,
      mix,
    ),
    rightForearmPitchRad: lerp(
      first.rightForearmPitchRad,
      second.rightForearmPitchRad,
      mix,
    ),
    leftLegPitchRad: lerp(first.leftLegPitchRad, second.leftLegPitchRad, mix),
    rightLegPitchRad: lerp(first.rightLegPitchRad, second.rightLegPitchRad, mix),
    leftFootPitchRad: lerp(first.leftFootPitchRad, second.leftFootPitchRad, mix),
    rightFootPitchRad: lerp(
      first.rightFootPitchRad,
      second.rightFootPitchRad,
      mix,
    ),
  };
}

function applyAgentRuntimeToPose(
  pose: HomeDriveThreePedestrianBakedPose,
  agent: HomeDrivePedestrianAgent,
  movingFactor: number,
): HomeDriveThreePedestrianBakedPose {
  const animationRuntime = getHomeDriveThreePedestrianAnimationRuntime(
    agent.animationKey,
  );
  const runtimeMovingFactor = movingFactor * animationRuntime.baseSpeedMultiplier;
  const stationaryHeadFactor = agent.speedMps < 0.08 ? 1 : 0.28;
  const seedSway = Math.sin(agent.animationPhase * 0.42 + agent.seed * 0.0007);
  const distanceFade = 1;

  return {
    bobY: pose.bobY * runtimeMovingFactor * distanceFade,
    torsoPitchRad: pose.torsoPitchRad * runtimeMovingFactor,
    torsoRollRad: pose.torsoRollRad * runtimeMovingFactor,
    headYawRad:
      pose.headYawRad +
      agent.idleLookYawRad * stationaryHeadFactor +
      Math.sin(agent.seed * 0.0013) * 0.018,
    headPitchRad: pose.headPitchRad + seedSway * 0.012,
    leftArmPitchRad: pose.leftArmPitchRad * runtimeMovingFactor,
    rightArmPitchRad: pose.rightArmPitchRad * runtimeMovingFactor,
    leftArmSideRad: pose.leftArmSideRad + seedSway * 0.008,
    rightArmSideRad: pose.rightArmSideRad - seedSway * 0.008,
    leftForearmPitchRad: pose.leftForearmPitchRad,
    rightForearmPitchRad: pose.rightForearmPitchRad,
    leftLegPitchRad: pose.leftLegPitchRad * runtimeMovingFactor,
    rightLegPitchRad: pose.rightLegPitchRad * runtimeMovingFactor,
    leftFootPitchRad: pose.leftFootPitchRad * runtimeMovingFactor,
    rightFootPitchRad: pose.rightFootPitchRad * runtimeMovingFactor,
  };
}

export function sampleHomeDriveThreePedestrianBakedPose(
  options: HomeDriveThreePedestrianBakedPoseSamplerOptions,
): HomeDriveThreePedestrianBakedPoseSample {
  const { agent } = options;
  const clip = getHomeDriveThreePedestrianAnimationBakeClip(agent.animationKey);
  const sampleCount = Math.max(1, clip.samples.length);
  const phaseRad = normalizePhase(
    agent.animationPhase +
      getElapsedPhaseContribution(agent, options.elapsedSeconds ?? 0) +
      (options.phaseOffsetRad ?? 0),
  );
  const normalized = phaseRad / clip.durationPhase;
  const rawIndex = normalized * sampleCount;
  const sampleIndexA = Math.floor(rawIndex) % sampleCount;
  const sampleIndexB = (sampleIndexA + 1) % sampleCount;
  const sampleMix = options.interpolation === false ? 0 : rawIndex - sampleIndexA;
  const basePose = interpolatePose(
    clip.samples[sampleIndexA],
    clip.samples[sampleIndexB],
    sampleMix,
  );
  const movingFactor = getMovingFactor(agent);

  return {
    pose: applyAgentRuntimeToPose(basePose, agent, movingFactor),
    phaseRad,
    movingFactor,
    sampleIndexA,
    sampleIndexB,
    sampleMix,
  };
}

export function getHomeDriveThreePedestrianBakedPose(
  agent: HomeDrivePedestrianAgent,
  elapsedSeconds = 0,
): HomeDriveThreePedestrianBakedPose {
  return sampleHomeDriveThreePedestrianBakedPose({
    agent,
    elapsedSeconds,
  }).pose;
}
