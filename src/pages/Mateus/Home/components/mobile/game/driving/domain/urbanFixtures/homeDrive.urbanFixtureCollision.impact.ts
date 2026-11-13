// src/pages/Mateus/Home/components/mobile/game/driving/domain/urbanFixtures/homeDrive.urbanFixtureCollision.impact.ts

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
  HomeDriveUrbanFixtureCollisionRuntimeState,
} from "./homeDrive.urbanFixtureCollision.types";
import {
  getForwardVector,
  getRightVector,
  normalizeVectorOrFallback,
  clamp,
  DEFAULT_TRAFFIC_LIGHT_MAX_FALL_RAD,
  DEFAULT_STREET_LIGHT_MAX_FALL_RAD,
  DEFAULT_TRAFFIC_LIGHT_MIN_FALL_RAD,
  DEFAULT_STREET_LIGHT_MIN_FALL_RAD,
  getDistanceSq,
} from "./homeDrive.urbanFixtureCollision.helpers";

export function createFixtureCollisionImpact(params: Readonly<{
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

export function createCollisionEvent(
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

export function addImpactToState(
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

export function collectFixtureCandidates(
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
