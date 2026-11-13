// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianCollision.ts

import {
  createHomeDriveImpactFromCollision,
  mergeHomeDriveImpactStates,
} from "../homeDrive.impact";
import type { HomeDriveCarState } from "../homeDrive.types";
import { createHomeDriveStablePedestrianCarImpact } from "./homeDrive.pedestrianCarImpact";
import { getHomeDrivePedestrianCollisionGuardFrame } from "./homeDrive.pedestrianCollisionGuard";
import type {
  HomeDrivePedestrianCollisionEvent,
  HomeDrivePedestrianCollisionOptions,
  HomeDrivePedestrianCollisionResolution,
} from "./homeDrive.pedestrianCollision.types";
import type { HomeDrivePedestrianAgent } from "./homeDrive.pedestrians.types";
import {
  DEFAULT_PLAYER_RADIUS_METERS,
  DEFAULT_PEDESTRIAN_RADIUS_METERS,
  DEFAULT_MIN_IMPACT_SPEED_MPS,
  DEFAULT_MAX_CANDIDATE_RADIUS_METERS,
  DEFAULT_IMPACT_FORWARD_METERS,
  DEFAULT_LATERAL_PADDING_METERS,
  DEFAULT_SPEED_LOOKAHEAD_SECONDS,
  DEFAULT_MAX_IMPACT_FORWARD_METERS,
  DEFAULT_COOLDOWN_SECONDS,
  DEFAULT_BRUTALITY,
  DEFAULT_SPEED_LOSS_RATIO,
  DEFAULT_MIN_SPEED_AFTER_HIT_MPS,
  DEFAULT_LOCK_SECONDS,
  DEFAULT_INITIAL_LAUNCH_LEAD_SECONDS,
  DEFAULT_ZERO_CAR_SPIN_ON_PEDESTRIAN_IMPACT,
  DEFAULT_PRESERVE_CAR_HEADING,
  DEFAULT_RESET_STEERING_ON_IMPACT,
  clamp,
  getForwardVector,
  normalizeVectorOrFallback,
  isImpactStateVisible,
  createPedestrianCollisionEvent,
  createPedestrianImpactState,
} from "./homeDrive.pedestrianCollision.helpers";
import { tickHomeDrivePedestrianImpactAgent } from "./homeDrive.pedestrianCollision.impactAgent";
export {
  isHomeDrivePedestrianImpactActive,
  tickHomeDrivePedestrianImpactAgent,
  tickHomeDrivePedestrianImpactAgents,
} from "./homeDrive.pedestrianCollision.impactAgent";

export function resolveHomeDrivePedestrianCollisions(
  car: HomeDriveCarState,
  agents: readonly HomeDrivePedestrianAgent[],
  nowSeconds: number,
  options: HomeDrivePedestrianCollisionOptions = {},
): HomeDrivePedestrianCollisionResolution {
  if (options.enabled === false || agents.length <= 0) {
    return {
      car,
      agents,
      events: [],
      impact: null,
    };
  }

  const playerRadiusMeters =
    options.playerRadiusMeters ?? DEFAULT_PLAYER_RADIUS_METERS;
  const pedestrianRadiusMeters =
    options.pedestrianRadiusMeters ?? DEFAULT_PEDESTRIAN_RADIUS_METERS;
  const minImpactSpeedMps =
    options.minImpactSpeedMps ?? DEFAULT_MIN_IMPACT_SPEED_MPS;
  const maxCandidateRadiusMeters =
    options.maxCandidateRadiusMeters ?? DEFAULT_MAX_CANDIDATE_RADIUS_METERS;
  const cooldownSeconds = options.cooldownSeconds ?? DEFAULT_COOLDOWN_SECONDS;
  const brutality = options.brutality ?? DEFAULT_BRUTALITY;
  const lockSeconds = options.lockSeconds ?? DEFAULT_LOCK_SECONDS;
  const initialLaunchLeadSeconds = clamp(
    options.initialLaunchLeadSeconds ?? DEFAULT_INITIAL_LAUNCH_LEAD_SECONDS,
    0,
    0.22,
  );
  const speedLossRatio = clamp(
    options.speedLossRatio ?? DEFAULT_SPEED_LOSS_RATIO,
    0.04,
    0.75,
  );
  const minSpeedAfterHitMps =
    options.minSpeedAfterHitMps ?? DEFAULT_MIN_SPEED_AFTER_HIT_MPS;
  const zeroCarSpinOnPedestrianImpact =
    options.zeroCarSpinOnPedestrianImpact ??
    DEFAULT_ZERO_CAR_SPIN_ON_PEDESTRIAN_IMPACT;
  const preserveCarHeading =
    options.preserveCarHeading ?? DEFAULT_PRESERVE_CAR_HEADING;
  const resetSteeringOnImpact =
    options.resetSteeringOnImpact ?? DEFAULT_RESET_STEERING_ON_IMPACT;

  const originalHeadingRad = car.headingRad;
  let resolvedCar = car;
  let mergedImpact = null as HomeDrivePedestrianCollisionResolution["impact"];
  const events: HomeDrivePedestrianCollisionEvent[] = [];
  const impactedAgents = new Map<string, HomeDrivePedestrianAgent>();

  for (const agent of agents) {
    if (events.length >= 3) {
      break;
    }

    if (isImpactStateVisible(agent.pedestrianImpact, nowSeconds)) {
      continue;
    }

    const lastCollisionAtSeconds = agent.lastPedestrianCollisionAtSeconds;

    if (
      typeof lastCollisionAtSeconds === "number" &&
      nowSeconds - lastCollisionAtSeconds < cooldownSeconds
    ) {
      continue;
    }

    const frame = getHomeDrivePedestrianCollisionGuardFrame(agent.position, {
      carPosition: resolvedCar.position,
      carHeadingRad: resolvedCar.headingRad,
      carSpeedMps: resolvedCar.speedMps,
      nowSeconds,
      carRadiusMeters: playerRadiusMeters,
      pedestrianRadiusMeters,
      impactForwardMeters:
        options.impactForwardMeters ?? DEFAULT_IMPACT_FORWARD_METERS,
      lateralPaddingMeters:
        options.lateralPaddingMeters ?? DEFAULT_LATERAL_PADDING_METERS,
      speedLookaheadSeconds:
        options.speedLookaheadSeconds ?? DEFAULT_SPEED_LOOKAHEAD_SECONDS,
      maxImpactForwardMeters:
        options.maxImpactForwardMeters ?? DEFAULT_MAX_IMPACT_FORWARD_METERS,
      nearStabilityForwardMeters:
        options.maxImpactForwardMeters ?? DEFAULT_MAX_IMPACT_FORWARD_METERS,
      nearStabilityLateralMeters:
        playerRadiusMeters + pedestrianRadiusMeters +
        (options.lateralPaddingMeters ?? DEFAULT_LATERAL_PADDING_METERS),
    });

    if (
      frame.distanceMeters > maxCandidateRadiusMeters ||
      !frame.isInsideImpactCapsule ||
      Math.abs(resolvedCar.speedMps) < minImpactSpeedMps
    ) {
      continue;
    }

    const forward = getForwardVector(resolvedCar.headingRad);
    const normal = normalizeVectorOrFallback(
      {
        x: agent.position.x - resolvedCar.position.x,
        z: agent.position.z - resolvedCar.position.z,
      },
      {
        x: -forward.x,
        z: -forward.z,
      },
    );
    const relativeSpeedMps = Math.max(
      minImpactSpeedMps,
      Math.abs(resolvedCar.speedMps),
    );
    const severity = clamp(relativeSpeedMps / 20, 0.32, 2.1);
    const impulse = clamp(
      relativeSpeedMps * (1.42 + severity * 0.58) * brutality,
      3.4,
      74,
    );
    const event = createPedestrianCollisionEvent({
      agent,
      car: resolvedCar,
      normal,
      relativeSpeedMps,
      impulse,
      severity,
      nowSeconds,
    });
    const serial = Math.max(
      1,
      Math.round(nowSeconds * 1000) + events.length + 1,
    );
    const pedestrianImpact = createPedestrianImpactState({
      agent,
      car: resolvedCar,
      event,
      serial,
      lockSeconds,
    });
    const impactedAgent: HomeDrivePedestrianAgent = {
      ...agent,
      behavior: "cross-panic",
      animationKey: "fast-walk",
      speedMps: 0,
      targetSpeedMps: 0,
      pedestrianImpact,
      collisionLockedUntilSeconds: nowSeconds + lockSeconds,
      lastPedestrianCollisionAtSeconds: nowSeconds,
      lastCollisionCandidateAtSeconds: nowSeconds,
    };

    impactedAgents.set(
      agent.id,
      tickHomeDrivePedestrianImpactAgent(
        impactedAgent,
        nowSeconds + initialLaunchLeadSeconds,
      ),
    );
    events.push(event);

    const carImpactNormal = {
      x: -forward.x,
      z: -forward.z,
    };

    const impactState = zeroCarSpinOnPedestrianImpact
      ? createHomeDriveStablePedestrianCarImpact({
          car: resolvedCar,
          normal: carImpactNormal,
          relativeSpeedMps,
          impulse,
          occurredAt: nowSeconds,
          brutality: 1.42 + severity * 0.38,
          options: {
            recoilMultiplier: options.carRecoilMultiplier,
            cameraShakeMultiplier: options.carCameraShakeMultiplier,
            visualPitchMultiplier: options.carVisualPitchMultiplier,
            controlLockMultiplier: options.carControlLockMultiplier,
            collisionImpulseMultiplier: options.carCollisionImpulseMultiplier,
          },
        })
      : createHomeDriveImpactFromCollision({
          car: resolvedCar,
          normal: carImpactNormal,
          relativeSpeedMps,
          impulse,
          occurredAt: nowSeconds,
          brutality: 1.42 + severity * 0.38,
        });

    mergedImpact = mergeHomeDriveImpactStates(mergedImpact, impactState);

    resolvedCar = {
      ...resolvedCar,
      headingRad: preserveCarHeading ? originalHeadingRad : resolvedCar.headingRad,
      steerAngleRad: resetSteeringOnImpact ? 0 : resolvedCar.steerAngleRad,
      speedMps: Math.max(
        minSpeedAfterHitMps,
        resolvedCar.speedMps * speedLossRatio,
      ),
      position: {
        x:
          resolvedCar.position.x -
          forward.x * clamp(0.18 + severity * 0.28, 0.18, 0.72),
        z:
          resolvedCar.position.z -
          forward.z * clamp(0.18 + severity * 0.28, 0.18, 0.72),
      },
    };
  }

  if (events.length <= 0) {
    return {
      car,
      agents,
      events,
      impact: null,
    };
  }

  return {
    car: resolvedCar,
    agents: agents.map((agent) => impactedAgents.get(agent.id) ?? agent),
    events,
    impact: mergedImpact,
  };
}
