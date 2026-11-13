// src/pages/Mateus/Home/components/mobile/game/driving/domain/urbanFixtures/homeDrive.urbanFixtureCollision.ts

import { mergeHomeDriveImpactStates } from "../homeDrive.impact";
import type { HomeDriveRuntimeImpactState } from "../homeDrive.impact";
import type { HomeDriveCarState } from "../homeDrive.types";
import type {
  HomeDriveUrbanStreetLight,
  HomeDriveUrbanTrafficLight,
} from "./homeDrive.urbanFixtures.types";
import type {
  HomeDriveUrbanFixtureCollisionEvent,
  HomeDriveUrbanFixtureCollisionImpact,
  HomeDriveUrbanFixtureCollisionOptions,
  HomeDriveUrbanFixtureCollisionResolution,
  HomeDriveUrbanFixtureCollisionRuntimeState,
} from "./homeDrive.urbanFixtureCollision.types";
import {
  DEFAULT_PLAYER_RADIUS_METERS,
  DEFAULT_MIN_IMPACT_SPEED_MPS,
  DEFAULT_MAX_CANDIDATE_RADIUS_METERS,
  DEFAULT_MAX_IMPACTS_PER_STEP,
  DEFAULT_MAX_TRACKED_IMPACTS,
  DEFAULT_BRUTALITY,
  DEFAULT_PLAYER_PUSH_MULTIPLIER,
  DEFAULT_REVERSE_KICK_MULTIPLIER,
  DEFAULT_MAX_REVERSE_KICK_MPS,
  DEFAULT_STREET_LIGHT_RADIUS_METERS,
  DEFAULT_TRAFFIC_LIGHT_RADIUS_METERS,
  DEFAULT_STREET_LIGHT_LEAN_MULTIPLIER,
  DEFAULT_TRAFFIC_LIGHT_LEAN_MULTIPLIER,
  getFixtureCollisionRadiusMeters,
  getForwardVector,
  normalizeVectorOrFallback,
  getRelativeImpactSpeedMps,
  getCollisionImpulse,
  getFixtureLeanMultiplier,
  createStableUrbanFixtureCarImpact,
  resolvePlayerFixtureImpact,
} from "./homeDrive.urbanFixtureCollision.helpers";
import {
  collectFixtureCandidates,
  createFixtureCollisionImpact,
  addImpactToState,
  createCollisionEvent,
} from "./homeDrive.urbanFixtureCollision.impact";

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
