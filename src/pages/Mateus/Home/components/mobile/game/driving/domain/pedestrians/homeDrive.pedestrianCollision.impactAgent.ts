// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianCollision.impactAgent.ts
// Simulação do pedestre atingido.

import type { HomeDrivePedestrianAgent } from "./homeDrive.pedestrians.types";
import {
  GRAVITY_MPS2,
  HALF_PI,
  STALE_IMPACT_TICK_EPSILON_SECONDS,
  getLandingPose,
  isImpactStateVisible,
} from "./homeDrive.pedestrianCollision.helpers";

export function isHomeDrivePedestrianImpactActive(
  agent: HomeDrivePedestrianAgent,
  nowSeconds: number,
): boolean {
  return isImpactStateVisible(agent.pedestrianImpact, nowSeconds);
}

export function tickHomeDrivePedestrianImpactAgent(
  agent: HomeDrivePedestrianAgent,
  nowSeconds: number,
): HomeDrivePedestrianAgent {
  const impact = agent.pedestrianImpact;

  if (!impact) {
    return agent;
  }

  const lastTickedAtSeconds =
    typeof impact.lastTickedAtSeconds === "number"
      ? impact.lastTickedAtSeconds
      : impact.startedAtSeconds;

  if (
    nowSeconds + STALE_IMPACT_TICK_EPSILON_SECONDS < impact.startedAtSeconds ||
    nowSeconds + STALE_IMPACT_TICK_EPSILON_SECONDS < lastTickedAtSeconds
  ) {
    return {
      ...agent,
      behavior: "cross-panic",
      animationKey: "fast-walk",
      speedMps: 0,
      targetSpeedMps: 0,
      collisionLockedUntilSeconds: Math.max(
        agent.collisionLockedUntilSeconds ?? 0,
        impact.expiresAtSeconds,
      ),
    };
  }

  if (typeof impact.landedAtSeconds === "number") {
    const landedPosition = impact.landedPosition ?? agent.position;
    const settledUntilSeconds = Math.max(
      impact.settledUntilSeconds ?? impact.landedAtSeconds,
      nowSeconds + 1.5,
    );

    return {
      ...agent,
      position: landedPosition,
      behavior: "cross-panic",
      animationKey: "idle",
      speedMps: 0,
      targetSpeedMps: 0,
      pedestrianImpact: {
        ...impact,
        active: false,
        lastTickedAtSeconds: Math.max(lastTickedAtSeconds, nowSeconds),
        settledUntilSeconds,
        landedPosition,
        yMeters: 0,
        pitchRad: impact.landingPitchRad ?? HALF_PI,
        rollRad: impact.landingRollRad ?? 0,
        yawRad: impact.landingYawRad ?? impact.yawRad,
      },
      lastPedestrianCollisionAtSeconds:
        agent.lastPedestrianCollisionAtSeconds ?? impact.startedAtSeconds,
      lastCollisionCandidateAtSeconds:
        agent.lastCollisionCandidateAtSeconds ?? impact.startedAtSeconds,
      collisionLockedUntilSeconds: Math.max(
        agent.collisionLockedUntilSeconds ?? 0,
        settledUntilSeconds,
      ),
    };
  }

  const elapsedSeconds = Math.max(0, nowSeconds - impact.startedAtSeconds);
  const yMeters = Math.max(
    0,
    impact.velocity.y * elapsedSeconds -
      0.5 * GRAVITY_MPS2 * elapsedSeconds * elapsedSeconds,
  );
  const landed = elapsedSeconds > 0.18 && yMeters <= 0.025;
  const isStillActive = impact.active && nowSeconds < impact.expiresAtSeconds && !landed;
  const pitchRad = impact.angularVelocity.x * elapsedSeconds;
  const rollRad = impact.angularVelocity.z * elapsedSeconds;
  const yawRad = impact.angularVelocity.y * elapsedSeconds;
  const nextPosition = {
    x: impact.origin.x + impact.velocity.x * elapsedSeconds,
    z: impact.origin.z + impact.velocity.z * elapsedSeconds,
  };

  if (!isStillActive && landed) {
    const landingPose = getLandingPose({
      agent,
      impact,
      position: nextPosition,
      nowSeconds,
    });

    return {
      ...agent,
      position: nextPosition,
      pedestrianImpact: {
        ...impact,
        ...landingPose,
        active: false,
        lastTickedAtSeconds: nowSeconds,
        yMeters: 0,
      },
      behavior: "cross-panic",
      animationKey: "idle",
      speedMps: 0,
      targetSpeedMps: 0,
      collisionLockedUntilSeconds: Math.max(
        agent.collisionLockedUntilSeconds ?? 0,
        landingPose.settledUntilSeconds ?? nowSeconds,
      ),
    };
  }

  return {
    ...agent,
    behavior: "cross-panic",
    animationKey: "fast-walk",
    speedMps: 0,
    targetSpeedMps: 0,
    position: nextPosition,
    pedestrianImpact: {
      ...impact,
      active: isStillActive,
      lastTickedAtSeconds: nowSeconds,
      yMeters,
      pitchRad,
      rollRad,
      yawRad,
    },
    collisionLockedUntilSeconds: Math.max(
      agent.collisionLockedUntilSeconds ?? 0,
      impact.expiresAtSeconds,
    ),
  };
}

export function tickHomeDrivePedestrianImpactAgents(
  agents: readonly HomeDrivePedestrianAgent[],
  nowSeconds: number,
): readonly HomeDrivePedestrianAgent[] {
  return agents.map((agent) => {
    return agent.pedestrianImpact
      ? tickHomeDrivePedestrianImpactAgent(agent, nowSeconds)
      : agent;
  });
}
