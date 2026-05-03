// src/pages/Mateus/Home/components/mobile/game/driving/domain/urbanFixtures/homeDrive.urbanFixtureCollision.ts

import {
  createHomeDriveImpactFromCollision,
  mergeHomeDriveImpactStates,
  type HomeDriveRuntimeImpactState,
} from "../homeDrive.impact";
import type { HomeDriveCarState, HomeDriveVector2 } from "../homeDrive.types";
import type {
  HomeDriveUrbanStreetLight,
  HomeDriveUrbanTrafficLight,
} from "./homeDrive.urbanFixtures.types";
import type {
  HomeDriveUrbanFixtureCollisionEvent,
  HomeDriveUrbanFixtureCollisionFixture,
  HomeDriveUrbanFixtureCollisionImpact,
  HomeDriveUrbanFixtureCollisionKind,
  HomeDriveUrbanFixtureCollisionOptions,
  HomeDriveUrbanFixtureCollisionResolution,
  HomeDriveUrbanFixtureCollisionRuntimeState,
} from "./homeDrive.urbanFixtureCollision.types";

const DEFAULT_PLAYER_RADIUS_METERS = 1.68;
const DEFAULT_STREET_LIGHT_RADIUS_METERS = 0.72;
const DEFAULT_TRAFFIC_LIGHT_RADIUS_METERS = 0.88;
const DEFAULT_MIN_IMPACT_SPEED_MPS = 0.68;
const DEFAULT_MAX_CANDIDATE_RADIUS_METERS = 18;
const DEFAULT_MAX_IMPACTS_PER_STEP = 1;
const DEFAULT_MAX_TRACKED_IMPACTS = 360;
const DEFAULT_BRUTALITY = 1.56;
const DEFAULT_PLAYER_PUSH_MULTIPLIER = 0.82;
const DEFAULT_REVERSE_KICK_MULTIPLIER = 0.055;
const DEFAULT_MAX_REVERSE_KICK_MPS = 1.15;
const DEFAULT_STREET_LIGHT_LEAN_MULTIPLIER = 1.04;
const DEFAULT_TRAFFIC_LIGHT_LEAN_MULTIPLIER = 1.18;
const DEFAULT_STREET_LIGHT_MIN_FALL_RAD = 0.92;
const DEFAULT_TRAFFIC_LIGHT_MIN_FALL_RAD = 1.02;
const DEFAULT_STREET_LIGHT_MAX_FALL_RAD = 1.38;
const DEFAULT_TRAFFIC_LIGHT_MAX_FALL_RAD = 1.48;

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

function lerp(start: number, end: number, amount: number): number {
  return start + (end - start) * clamp(amount, 0, 1);
}

function getDistanceSq(first: HomeDriveVector2, second: HomeDriveVector2): number {
  const dx = first.x - second.x;
  const dz = first.z - second.z;

  return dx * dx + dz * dz;
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

  if (!Number.isFinite(length) || length <= 0.000001) {
    return fallback;
  }

  return {
    x: vector.x / length,
    z: vector.z / length,
  };
}

function getFixtureCollisionRadiusMeters(
  fixtureKind: HomeDriveUrbanFixtureCollisionKind,
  options: Required<
    Pick<
      HomeDriveUrbanFixtureCollisionOptions,
      "streetLightRadiusMeters" | "trafficLightRadiusMeters"
    >
  >,
): number {
  return fixtureKind === "traffic-light"
    ? options.trafficLightRadiusMeters
    : options.streetLightRadiusMeters;
}

function getFixtureMassFactor(
  fixtureKind: HomeDriveUrbanFixtureCollisionKind,
): number {
  return fixtureKind === "traffic-light" ? 1.22 : 0.92;
}

function getFixtureLeanMultiplier(
  fixtureKind: HomeDriveUrbanFixtureCollisionKind,
  options: Required<
    Pick<
      HomeDriveUrbanFixtureCollisionOptions,
      "streetLightLeanMultiplier" | "trafficLightLeanMultiplier"
    >
  >,
): number {
  return fixtureKind === "traffic-light"
    ? options.trafficLightLeanMultiplier
    : options.streetLightLeanMultiplier;
}

function getRelativeImpactSpeedMps(
  car: HomeDriveCarState,
  normalFromFixtureToPlayer: HomeDriveVector2,
): number {
  const forward = getForwardVector(car.headingRad);
  const velocity = {
    x: forward.x * car.speedMps,
    z: forward.z * car.speedMps,
  };
  const closingSpeed =
    velocity.x * -normalFromFixtureToPlayer.x +
    velocity.z * -normalFromFixtureToPlayer.z;

  return Math.max(Math.abs(car.speedMps), closingSpeed, 0);
}

function getCollisionImpulse(params: {
  fixtureKind: HomeDriveUrbanFixtureCollisionKind;
  overlapMeters: number;
  relativeSpeedMps: number;
  brutality: number;
}): number {
  return clamp(
    (params.overlapMeters * 2.1 + params.relativeSpeedMps * 0.74) *
      getFixtureMassFactor(params.fixtureKind) *
      params.brutality,
    2.2,
    34,
  );
}

function createStableUrbanFixtureCarImpact(params: Readonly<{
  car: HomeDriveCarState;
  normalFromFixtureToPlayer: HomeDriveVector2;
  relativeSpeedMps: number;
  impulse: number;
  occurredAt: number;
  brutality: number;
}>): HomeDriveRuntimeImpactState {
  const baseImpact = createHomeDriveImpactFromCollision({
    car: params.car,
    normal: params.normalFromFixtureToPlayer,
    relativeSpeedMps: params.relativeSpeedMps,
    impulse: params.impulse,
    occurredAt: params.occurredAt,
    brutality: params.brutality,
  });

  const speed = Math.max(0, Math.abs(params.relativeSpeedMps));
  const recoilStrength = clamp(
    (1.8 + speed * 0.16 + params.impulse * 0.065) * params.brutality,
    1.8,
    9.6,
  );

  return {
    ...baseImpact,
    recoilVelocity: {
      x: params.normalFromFixtureToPlayer.x * recoilStrength,
      z: params.normalFromFixtureToPlayer.z * recoilStrength,
    },
    spinVelocityRadps: 0,
    visualRollRad: 0,
    visualPitchRad: clamp(baseImpact.visualPitchRad * 0.42, -0.28, 0.28),
    cameraShake: clamp(baseImpact.cameraShake * 0.72, 0.16, 1.35),
    collisionImpulse: clamp(baseImpact.collisionImpulse * 0.92, 0, 36),
    controlLockSeconds: clamp(baseImpact.controlLockSeconds * 0.88, 0.42, 1.28),
  };
}

function resolvePlayerFixtureImpact(params: {
  car: HomeDriveCarState;
  normalFromFixtureToPlayer: HomeDriveVector2;
  overlapMeters: number;
  impulse: number;
  relativeSpeedMps: number;
  playerPushMultiplier: number;
  reverseKickMultiplier: number;
  maxReverseKickMps: number;
}): HomeDriveCarState {
  const severity = clamp(params.relativeSpeedMps / 24 + params.impulse / 58, 0, 1);
  const pushDistance = clamp(
    params.overlapMeters * params.playerPushMultiplier + params.impulse * 0.018,
    0.12,
    0.74,
  );
  const retainedForwardSpeedMps = Math.max(0, params.car.speedMps) * lerp(0.055, 0.006, severity);
  const reverseKickMps = clamp(
    Math.abs(params.car.speedMps) * params.reverseKickMultiplier +
      params.impulse * 0.028,
    0,
    params.maxReverseKickMps,
  );
  const nextSpeedMps =
    params.car.speedMps >= 0
      ? -reverseKickMps
      : Math.min(0, params.car.speedMps * 0.22);

  return {
    ...params.car,
    position: {
      x:
        params.car.position.x +
        params.normalFromFixtureToPlayer.x * pushDistance,
      z:
        params.car.position.z +
        params.normalFromFixtureToPlayer.z * pushDistance,
    },
    speedMps: clamp(
      nextSpeedMps,
      -params.maxReverseKickMps,
      retainedForwardSpeedMps,
    ),
    steerAngleRad: 0,
  };
}

function createFixtureCollisionImpact(params: Readonly<{
  fixtureId: string;
  fixtureKind: HomeDriveUrbanFixtureCollisionKind;
  fixturePosition: HomeDriveVector2;
  car: HomeDriveCarState;
  normalFromFixtureToPlayer: HomeDriveVector2;
  relativeSpeedMps: number;
  impulse: number;
  nowSeconds: number;
  leanMultiplier: number;
}>): HomeDriveUrbanFixtureCollisionImpact {
  const carForward = getForwardVector(params.car.headingRad);
  const right = getRightVector(params.car.headingRad);

  /*
    Queda visual: usar o vetor do deslocamento do carro no frame do impacto.
    Se usar só a normal fixture->car, o poste tende a "dobrar" para a direção
    do contato em vez de tombar para a frente, o que parece artificial quando o
    carro vem rápido.
  */
  const fallDirection = normalizeVectorOrFallback(
    params.car.speedMps >= 0
      ? carForward
      : { x: -carForward.x, z: -carForward.z },
    {
      x: -params.normalFromFixtureToPlayer.x,
      z: -params.normalFromFixtureToPlayer.z,
    },
  );
  const sideSign =
    fallDirection.x * right.x + fallDirection.z * right.z >= 0 ? 1 : -1;
  const severity = clamp(
    params.relativeSpeedMps / 22 + params.impulse / 54,
    0.18,
    1.65,
  );
  const maxLeanRad =
    params.fixtureKind === "traffic-light"
      ? DEFAULT_TRAFFIC_LIGHT_MAX_FALL_RAD
      : DEFAULT_STREET_LIGHT_MAX_FALL_RAD;
  const minLeanRad =
    params.fixtureKind === "traffic-light"
      ? DEFAULT_TRAFFIC_LIGHT_MIN_FALL_RAD
      : DEFAULT_STREET_LIGHT_MIN_FALL_RAD;
  const fallDurationSeconds = clamp(
    (params.fixtureKind === "traffic-light" ? 0.68 : 0.58) - severity * 0.12,
    0.36,
    0.78,
  );

  return {
    fixtureId: params.fixtureId,
    fixtureKind: params.fixtureKind,
    position: params.fixturePosition,
    normalFromFixtureToPlayer: params.normalFromFixtureToPlayer,
    fallDirection,
    leanDirection: fallDirection,
    leanRad: clamp(
      (0.72 + severity * 0.46 + params.impulse * 0.005) *
        params.leanMultiplier,
      minLeanRad,
      maxLeanRad,
    ),
    twistRad: clamp(sideSign * (0.035 + severity * 0.055), -0.16, 0.16),
    fallDurationSeconds,
    severity,
    impulse: params.impulse,
    relativeSpeedMps: params.relativeSpeedMps,
    struckAtSeconds: params.nowSeconds,
  };
}

function createCollisionEvent(
  impact: HomeDriveUrbanFixtureCollisionImpact,
  nowSeconds: number,
): HomeDriveUrbanFixtureCollisionEvent {
  return {
    id: `urban-fixture-hit-${impact.fixtureId}-${Math.round(nowSeconds * 1000)}`,
    fixtureId: impact.fixtureId,
    fixtureKind: impact.fixtureKind,
    position: impact.position,
    normalFromFixtureToPlayer: impact.normalFromFixtureToPlayer,
    fallDirection: impact.fallDirection,
    leanDirection: impact.leanDirection,
    leanRad: impact.leanRad,
    twistRad: impact.twistRad,
    fallDurationSeconds: impact.fallDurationSeconds,
    severity: impact.severity,
    impulse: impact.impulse,
    relativeSpeedMps: impact.relativeSpeedMps,
    occurredAtSeconds: nowSeconds,
  };
}

function addImpactToState(
  state: HomeDriveUrbanFixtureCollisionRuntimeState,
  impact: HomeDriveUrbanFixtureCollisionImpact,
  maxTrackedImpacts: number,
): HomeDriveUrbanFixtureCollisionRuntimeState {
  const existingIds = state.impactedFixtureIds.filter(
    (fixtureId) => fixtureId !== impact.fixtureId,
  );
  const nextIds = [...existingIds, impact.fixtureId].slice(
    -Math.max(1, maxTrackedImpacts),
  );
  const nextImpactsByFixtureId: Record<string, HomeDriveUrbanFixtureCollisionImpact> = {};

  for (const fixtureId of nextIds) {
    const currentImpact =
      fixtureId === impact.fixtureId
        ? impact
        : state.impactsByFixtureId[fixtureId];

    if (currentImpact) {
      nextImpactsByFixtureId[fixtureId] = currentImpact;
    }
  }

  return {
    serial: state.serial + 1,
    impactedFixtureIds: nextIds,
    impactsByFixtureId: nextImpactsByFixtureId,
  };
}

function collectFixtureCandidates(
  car: HomeDriveCarState,
  streetLights: readonly HomeDriveUrbanStreetLight[],
  trafficLights: readonly HomeDriveUrbanTrafficLight[],
  maxCandidateRadiusMeters: number,
): readonly (HomeDriveUrbanFixtureCollisionFixture & { distanceSq: number })[] {
  const maxDistanceSq = maxCandidateRadiusMeters * maxCandidateRadiusMeters;
  const candidates: (HomeDriveUrbanFixtureCollisionFixture & { distanceSq: number })[] = [];

  for (const fixture of streetLights) {
    const distanceSq = getDistanceSq(car.position, fixture.position);

    if (distanceSq <= maxDistanceSq) {
      candidates.push({ kind: "street-light", fixture, distanceSq });
    }
  }

  for (const fixture of trafficLights) {
    const distanceSq = getDistanceSq(car.position, fixture.position);

    if (distanceSq <= maxDistanceSq) {
      candidates.push({ kind: "traffic-light", fixture, distanceSq });
    }
  }

  return candidates.sort((first, second) => first.distanceSq - second.distanceSq);
}

export function createInitialHomeDriveUrbanFixtureCollisionState(): HomeDriveUrbanFixtureCollisionRuntimeState {
  return {
    serial: 0,
    impactedFixtureIds: [],
    impactsByFixtureId: {},
  };
}

export function getHomeDriveUrbanFixtureCollisionImpact(
  state: HomeDriveUrbanFixtureCollisionRuntimeState | null | undefined,
  fixtureId: string,
): HomeDriveUrbanFixtureCollisionImpact | null {
  return state?.impactsByFixtureId[fixtureId] ?? null;
}

export function hasHomeDriveUrbanFixtureCollisionImpact(
  state: HomeDriveUrbanFixtureCollisionRuntimeState | null | undefined,
  fixtureId: string,
): boolean {
  return Boolean(getHomeDriveUrbanFixtureCollisionImpact(state, fixtureId));
}

export function resolveHomeDriveUrbanFixtureCollisions(
  car: HomeDriveCarState,
  urbanFixtureCollisions: HomeDriveUrbanFixtureCollisionRuntimeState,
  nowSeconds: number,
  streetLights: readonly HomeDriveUrbanStreetLight[],
  trafficLights: readonly HomeDriveUrbanTrafficLight[],
  options: HomeDriveUrbanFixtureCollisionOptions = {},
): HomeDriveUrbanFixtureCollisionResolution {
  if (options.enabled === false) {
    return {
      car,
      urbanFixtureCollisions,
      impact: null,
      events: [],
    };
  }

  const playerRadiusMeters = options.playerRadiusMeters ?? DEFAULT_PLAYER_RADIUS_METERS;
  const minImpactSpeedMps = options.minImpactSpeedMps ?? DEFAULT_MIN_IMPACT_SPEED_MPS;
  const maxCandidateRadiusMeters =
    options.maxCandidateRadiusMeters ?? DEFAULT_MAX_CANDIDATE_RADIUS_METERS;
  const maxImpactsPerStep = Math.max(
    1,
    options.maxImpactsPerStep ?? DEFAULT_MAX_IMPACTS_PER_STEP,
  );
  const maxTrackedImpacts = Math.max(
    1,
    options.maxTrackedImpacts ?? DEFAULT_MAX_TRACKED_IMPACTS,
  );
  const brutality = options.brutality ?? DEFAULT_BRUTALITY;
  const playerPushMultiplier =
    options.playerPushMultiplier ?? DEFAULT_PLAYER_PUSH_MULTIPLIER;
  const reverseKickMultiplier =
    options.reverseKickMultiplier ?? DEFAULT_REVERSE_KICK_MULTIPLIER;
  const maxReverseKickMps =
    options.maxReverseKickMps ?? DEFAULT_MAX_REVERSE_KICK_MPS;
  const radiusOptions = {
    streetLightRadiusMeters:
      options.streetLightRadiusMeters ?? DEFAULT_STREET_LIGHT_RADIUS_METERS,
    trafficLightRadiusMeters:
      options.trafficLightRadiusMeters ?? DEFAULT_TRAFFIC_LIGHT_RADIUS_METERS,
  };
  const leanOptions = {
    streetLightLeanMultiplier:
      options.streetLightLeanMultiplier ?? DEFAULT_STREET_LIGHT_LEAN_MULTIPLIER,
    trafficLightLeanMultiplier:
      options.trafficLightLeanMultiplier ?? DEFAULT_TRAFFIC_LIGHT_LEAN_MULTIPLIER,
  };

  let resolvedCar = car;
  let resolvedState = urbanFixtureCollisions;
  let mergedImpact: HomeDriveRuntimeImpactState | null = null;
  const events: HomeDriveUrbanFixtureCollisionEvent[] = [];
  const candidates = collectFixtureCandidates(
    car,
    streetLights,
    trafficLights,
    maxCandidateRadiusMeters,
  );

  for (const candidate of candidates) {
    if (events.length >= maxImpactsPerStep) {
      break;
    }

    if (resolvedState.impactsByFixtureId[candidate.fixture.id]) {
      continue;
    }

    const collisionDistance =
      playerRadiusMeters +
      getFixtureCollisionRadiusMeters(candidate.kind, radiusOptions);
    const distanceMeters = Math.sqrt(candidate.distanceSq);

    if (distanceMeters > collisionDistance) {
      continue;
    }

    const forward = getForwardVector(resolvedCar.headingRad);
    const normalFromFixtureToPlayer = normalizeVectorOrFallback(
      {
        x: resolvedCar.position.x - candidate.fixture.position.x,
        z: resolvedCar.position.z - candidate.fixture.position.z,
      },
      {
        x: -forward.x,
        z: -forward.z,
      },
    );
    const relativeSpeedMps = getRelativeImpactSpeedMps(
      resolvedCar,
      normalFromFixtureToPlayer,
    );

    if (
      relativeSpeedMps < minImpactSpeedMps &&
      Math.abs(resolvedCar.speedMps) < minImpactSpeedMps
    ) {
      continue;
    }

    const overlapMeters = collisionDistance - distanceMeters;
    const impulse = getCollisionImpulse({
      fixtureKind: candidate.kind,
      overlapMeters,
      relativeSpeedMps,
      brutality,
    });
    const fixtureImpact = createFixtureCollisionImpact({
      fixtureId: candidate.fixture.id,
      fixtureKind: candidate.kind,
      fixturePosition: candidate.fixture.position,
      car: resolvedCar,
      normalFromFixtureToPlayer,
      relativeSpeedMps,
      impulse,
      nowSeconds,
      leanMultiplier: getFixtureLeanMultiplier(candidate.kind, leanOptions),
    });

    resolvedState = addImpactToState(
      resolvedState,
      fixtureImpact,
      maxTrackedImpacts,
    );
    events.push(createCollisionEvent(fixtureImpact, nowSeconds));

    mergedImpact = mergeHomeDriveImpactStates(
      mergedImpact,
      createStableUrbanFixtureCarImpact({
        car: resolvedCar,
        normalFromFixtureToPlayer,
        relativeSpeedMps,
        impulse,
        occurredAt: nowSeconds,
        brutality: 1.18 + fixtureImpact.severity * 0.22,
      }),
    );

    resolvedCar = resolvePlayerFixtureImpact({
      car: resolvedCar,
      normalFromFixtureToPlayer,
      overlapMeters,
      impulse,
      relativeSpeedMps,
      playerPushMultiplier,
      reverseKickMultiplier,
      maxReverseKickMps,
    });
  }

  return {
    car: resolvedCar,
    urbanFixtureCollisions: resolvedState,
    impact: mergedImpact,
    events,
  };
}
