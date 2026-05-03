// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianCollision.ts

import {
  createHomeDriveImpactFromCollision,
  mergeHomeDriveImpactStates,
} from "../homeDrive.impact";
import type { HomeDriveCarState, HomeDriveVector2 } from "../homeDrive.types";
import { createHomeDriveStablePedestrianCarImpact } from "./homeDrive.pedestrianCarImpact";
import { getHomeDrivePedestrianCollisionGuardFrame } from "./homeDrive.pedestrianCollisionGuard";
import type {
  HomeDrivePedestrianCollisionEvent,
  HomeDrivePedestrianCollisionOptions,
  HomeDrivePedestrianCollisionResolution,
  HomeDrivePedestrianImpactState,
} from "./homeDrive.pedestrianCollision.types";
import type { HomeDrivePedestrianAgent } from "./homeDrive.pedestrians.types";

const DEFAULT_PLAYER_RADIUS_METERS = 1.72;
const DEFAULT_PEDESTRIAN_RADIUS_METERS = 0.52;
const DEFAULT_MIN_IMPACT_SPEED_MPS = 0.72;
const DEFAULT_MAX_CANDIDATE_RADIUS_METERS = 22;
const DEFAULT_IMPACT_FORWARD_METERS = 5.4;
const DEFAULT_LATERAL_PADDING_METERS = 1.16;
const DEFAULT_SPEED_LOOKAHEAD_SECONDS = 0.38;
const DEFAULT_MAX_IMPACT_FORWARD_METERS = 24;
const DEFAULT_COOLDOWN_SECONDS = 1.45;
const DEFAULT_BRUTALITY = 1.92;
const DEFAULT_SPEED_LOSS_RATIO = 0.18;
const DEFAULT_MIN_SPEED_AFTER_HIT_MPS = -1.2;
const DEFAULT_LOCK_SECONDS = 3.85;
const DEFAULT_INITIAL_LAUNCH_LEAD_SECONDS = 0.105;
const DEFAULT_ZERO_CAR_SPIN_ON_PEDESTRIAN_IMPACT = true;
const DEFAULT_PRESERVE_CAR_HEADING = true;
const DEFAULT_RESET_STEERING_ON_IMPACT = true;
const DEFAULT_LANDED_SETTLE_SECONDS = 45;
const GRAVITY_MPS2 = 8.7;
const HALF_PI = Math.PI * 0.5;
const STALE_IMPACT_TICK_EPSILON_SECONDS = 0.0001;

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

function getForwardVector(headingRad: number): HomeDriveVector2 {
  return {
    x: Math.sin(headingRad),
    z: Math.cos(headingRad),
  };
}

function getRightVector(headingRad: number): HomeDriveVector2 {
  return {
    x: Math.cos(headingRad),
    z: -Math.sin(headingRad),
  };
}

function normalizeVectorOrFallback(
  vector: HomeDriveVector2,
  fallback: HomeDriveVector2,
): HomeDriveVector2 {
  const length = Math.hypot(vector.x, vector.z);

  if (length <= 0.000001) {
    return fallback;
  }

  return {
    x: vector.x / length,
    z: vector.z / length,
  };
}

function normalizeAngleRad(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  let normalized = value;

  while (normalized > Math.PI) {
    normalized -= Math.PI * 2;
  }

  while (normalized < -Math.PI) {
    normalized += Math.PI * 2;
  }

  return normalized;
}

function getImpactTravelYawRelativeToAgent(
  agent: HomeDrivePedestrianAgent,
  impact: HomeDrivePedestrianImpactState,
): number {
  const absoluteTravelYaw = Math.atan2(impact.velocity.x, impact.velocity.z);

  return normalizeAngleRad(absoluteTravelYaw - agent.headingRad);
}

function getLandingPose(params: Readonly<{
  agent: HomeDrivePedestrianAgent;
  impact: HomeDrivePedestrianImpactState;
  position: HomeDriveVector2;
  nowSeconds: number;
}>): Pick<
  HomeDrivePedestrianImpactState,
  | "landedAtSeconds"
  | "settledUntilSeconds"
  | "landedPosition"
  | "landingPitchRad"
  | "landingRollRad"
  | "landingYawRad"
  | "pitchRad"
  | "rollRad"
  | "yawRad"
> {
  const sideSign = Math.sign(params.impact.angularVelocity.z) || 1;
  const landingYawRad = getImpactTravelYawRelativeToAgent(
    params.agent,
    params.impact,
  );
  const landingRollRad = sideSign * 0.08;

  /**
   * A pessoa precisa finalizar deitada, com o eixo vertical do rig tombado.
   * Mantemos a rotação final congelada para evitar o efeito de alternar entre
   * a origem do arremesso e o ponto de pouso a cada tick.
   */
  const landingPitchRad = HALF_PI;

  return {
    landedAtSeconds: params.nowSeconds,
    settledUntilSeconds: params.nowSeconds + DEFAULT_LANDED_SETTLE_SECONDS,
    landedPosition: params.position,
    landingPitchRad,
    landingRollRad,
    landingYawRad,
    pitchRad: landingPitchRad,
    rollRad: landingRollRad,
    yawRad: landingYawRad,
  };
}

function isImpactStateVisible(
  impact: HomeDrivePedestrianImpactState | undefined,
  nowSeconds: number,
): impact is HomeDrivePedestrianImpactState {
  if (!impact) {
    return false;
  }

  /**
   * Depois do pouso o agente não deve voltar para a pose/posição de calçada.
   * O estado abatido passa a ser a fonte de verdade visual e física até que a
   * sessão reinicie ou o pool seja reconstruído. Isso remove o snap em que a
   * pessoa ficava alguns segundos no chão e voltava para a posição inicial.
   */
  if (typeof impact.landedAtSeconds === "number") {
    return true;
  }

  if (impact.active && impact.expiresAtSeconds > nowSeconds) {
    return true;
  }

  return impact.yMeters > 0.025;
}

function createPedestrianCollisionEvent(params: Readonly<{
  agent: HomeDrivePedestrianAgent;
  car: HomeDriveCarState;
  normal: HomeDriveVector2;
  relativeSpeedMps: number;
  impulse: number;
  severity: number;
  nowSeconds: number;
}>): HomeDrivePedestrianCollisionEvent {
  return {
    id: [
      "pedestrian-collision",
      params.agent.id,
      Math.round(params.nowSeconds * 1000),
      Math.round(params.impulse * 100),
    ].join(":"),
    agentId: params.agent.id,
    position: params.agent.position,
    normal: params.normal,
    relativeSpeedMps: params.relativeSpeedMps,
    impulse: params.impulse,
    severity: params.severity,
    occurredAtSeconds: params.nowSeconds,
  };
}

function createPedestrianImpactState(params: Readonly<{
  agent: HomeDrivePedestrianAgent;
  car: HomeDriveCarState;
  event: HomeDrivePedestrianCollisionEvent;
  serial: number;
  lockSeconds: number;
}>): HomeDrivePedestrianImpactState {
  const forward = getForwardVector(params.car.headingRad);
  const right = getRightVector(params.car.headingRad);
  const sideSign =
    Math.sign(
      (params.agent.position.x - params.car.position.x) * right.x +
        (params.agent.position.z - params.car.position.z) * right.z,
    ) || (params.serial % 2 === 0 ? 1 : -1);
  const severity = params.event.severity;
  const speed = Math.max(
    2.4,
    Math.abs(params.car.speedMps),
    params.event.relativeSpeedMps,
  );

  /**
   * O arremesso precisa ser visualmente legível em escala de tela pequena.
   * Por isso o impulso vertical/frontal é mais forte que a resposta aplicada
   * no carro. O carro perde velocidade, mas não transfere spin para si mesmo.
   */
  const upwardMps = clamp(7.4 + speed * 0.34 + severity * 3.4, 7.4, 18.5);
  const forwardKickMps = clamp(
    4.5 + speed * (0.62 + severity * 0.22),
    6.5,
    30,
  );
  const sideKickMps = sideSign * clamp(2.4 + speed * 0.08 + severity * 0.9, 2.2, 8.4);
  const startedAtSeconds = params.event.occurredAtSeconds;
  const durationSeconds = clamp(params.lockSeconds, 2.2, 5.2);

  return {
    active: true,
    serial: params.serial,
    startedAtSeconds,
    expiresAtSeconds: startedAtSeconds + durationSeconds,
    origin: params.agent.position,
    velocity: {
      x: forward.x * forwardKickMps + right.x * sideKickMps,
      y: upwardMps,
      z: forward.z * forwardKickMps + right.z * sideKickMps,
    },
    angularVelocity: {
      x: sideSign * clamp(10 + speed * 0.42 + severity * 2.2, 10, 34),
      y: sideSign * clamp(7 + speed * 0.34 + severity * 2.4, 7, 30),
      z: -sideSign * clamp(13 + speed * 0.48 + severity * 3.2, 13, 42),
    },
    yMeters: 0,
    pitchRad: 0,
    rollRad: 0,
    yawRad: 0,
    severity,
  };
}

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
