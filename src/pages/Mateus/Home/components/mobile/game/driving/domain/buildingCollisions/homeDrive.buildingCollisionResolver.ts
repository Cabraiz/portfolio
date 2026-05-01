// src/pages/Mateus/Home/components/mobile/game/driving/domain/buildingCollisions/homeDrive.buildingCollisionResolver.ts

import type { HomeDriveBuilding } from "../homeDrive.building.types";
import {
  createHomeDriveImpactFromCollision,
  mergeHomeDriveImpactStates,
  type HomeDriveRuntimeImpactState,
} from "../homeDrive.impact";
import type { HomeDriveCarState, HomeDriveVector2 } from "../homeDrive.types";
import {
  getHomeDriveBuildingsNearPosition,
  resolveHomeDriveCarBuildingCollisionHit,
} from "./homeDrive.buildingCollisionBounds";
import {
  addHomeDriveBuildingCollisionEventToState,
  tickHomeDriveBuildingCollisionState,
} from "./homeDrive.buildingCollisionImpact";
import { getHomeDriveBuildingCollisionQuip } from "./homeDrive.buildingCollisionQuips";
import type {
  HomeDriveBuildingCollisionEvent,
  HomeDriveBuildingCollisionOptions,
  HomeDriveBuildingCollisionResolution,
  HomeDriveBuildingCollisionRuntimeState,
} from "./homeDrive.buildingCollision.types";

const DEFAULT_PLAYER_RADIUS_METERS = 1.62;
const DEFAULT_COOLDOWN_SECONDS = 0.24;
const DEFAULT_MIN_IMPACT_SPEED_MPS = 0.72;
const DEFAULT_BRUTALITY = 1.68;
const DEFAULT_PLAYER_PUSH_MULTIPLIER = 0.92;
const DEFAULT_REVERSE_KICK_MULTIPLIER = 0.58;
const DEFAULT_MAX_REVERSE_KICK_MPS = 12.5;
const DEFAULT_CANDIDATE_RADIUS_METERS = 96;
const DEFAULT_MAX_CANDIDATE_BUILDINGS = 32;

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

function getCarForwardVector(headingRad: number): HomeDriveVector2 {
  return {
    x: Math.sin(headingRad),
    z: Math.cos(headingRad),
  };
}

function dot(first: HomeDriveVector2, second: HomeDriveVector2): number {
  return first.x * second.x + first.z * second.z;
}

function getRelativeImpactSpeedMps(
  car: HomeDriveCarState,
  normalFromBuildingToPlayer: HomeDriveVector2,
): number {
  const forward = getCarForwardVector(car.headingRad);
  const velocity = {
    x: forward.x * car.speedMps,
    z: forward.z * car.speedMps,
  };

  const closingSpeed =
    velocity.x * -normalFromBuildingToPlayer.x +
    velocity.z * -normalFromBuildingToPlayer.z;

  return Math.max(Math.abs(car.speedMps), closingSpeed, 0);
}

function getCollisionImpulse(params: Readonly<{
  overlapMeters: number;
  relativeSpeedMps: number;
  buildingHeightMeters: number;
  brutality: number;
}>): number {
  const heightFactor = clamp(params.buildingHeightMeters / 14, 0.82, 1.72);

  return clamp(
    (params.overlapMeters * 2.15 + params.relativeSpeedMps * 0.64) *
      heightFactor *
      params.brutality,
    0.75,
    32,
  );
}

function resolvePlayerBuildingImpact(params: Readonly<{
  car: HomeDriveCarState;
  normal: HomeDriveVector2;
  overlapMeters: number;
  impulse: number;
  playerPushMultiplier: number;
  reverseKickMultiplier: number;
  maxReverseKickMps: number;
}>): HomeDriveCarState {
  const impactSeverity = clamp(params.impulse / 32, 0, 1);

  const pushDistance = clamp(
    params.overlapMeters * params.playerPushMultiplier + params.impulse * 0.052,
    0.22,
    5.6,
  );

  const reverseKick = clamp(
    Math.abs(params.car.speedMps) * params.reverseKickMultiplier +
      params.impulse * 0.35,
    2.4,
    params.maxReverseKickMps,
  );

  const forward = getCarForwardVector(params.car.headingRad);
  const wallDot = dot(forward, params.normal);
  const steerKick = clamp(-wallDot * 0.16, -0.24, 0.24);

  return {
    ...params.car,
    position: {
      x: params.car.position.x + params.normal.x * pushDistance,
      z: params.car.position.z + params.normal.z * pushDistance,
    },
    speedMps:
      params.car.speedMps >= 0
        ? -reverseKick
        : params.car.speedMps * (0.25 + impactSeverity * 0.12),
    steerAngleRad: params.car.steerAngleRad * 0.08 + steerKick,
  };
}

function shouldSkipBuildingCollision(params: Readonly<{
  state: HomeDriveBuildingCollisionRuntimeState;
  buildingId: string;
  nowSeconds: number;
  cooldownSeconds: number;
}>): boolean {
  const lastCollisionAt =
    params.state.lastCollisionAtByBuildingId[params.buildingId] ??
    Number.NEGATIVE_INFINITY;

  return params.nowSeconds - lastCollisionAt < params.cooldownSeconds;
}

function createBuildingCollisionEvent(params: Readonly<{
  car: HomeDriveCarState;
  building: HomeDriveBuilding;
  face: HomeDriveBuildingCollisionEvent["face"];
  normal: HomeDriveVector2;
  position: HomeDriveVector2;
  contactYMeters: number;
  overlapMeters: number;
  relativeSpeedMps: number;
  impulse: number;
  nowSeconds: number;
}>): HomeDriveBuildingCollisionEvent {
  const severity = clamp(params.impulse / 32, 0, 1);
  const message = getHomeDriveBuildingCollisionQuip({
    buildingId: params.building.id,
    face: params.face,
    severity,
    impulse: params.impulse,
    relativeSpeedMps: params.relativeSpeedMps,
  });

  return {
    buildingId: params.building.id,
    buildingKind: params.building.kind,
    buildingHeightMeters: params.building.heightMeters,
    buildingWidthMeters: params.building.widthMeters,
    buildingDepthMeters: params.building.depthMeters,
    buildingRotationYRad: params.building.rotationYRad,
    face: params.face,
    position: params.position,
    normal: params.normal,
    contactYMeters: params.contactYMeters,
    overlapMeters: params.overlapMeters,
    relativeSpeedMps: params.relativeSpeedMps,
    impulse: params.impulse,
    severity,
    message,
    occurredAtSeconds: params.nowSeconds,
  };
}

export function resolveHomeDriveBuildingCollisions(
  car: HomeDriveCarState,
  buildings: readonly HomeDriveBuilding[],
  buildingCollisions: HomeDriveBuildingCollisionRuntimeState,
  nowSeconds: number,
  options: HomeDriveBuildingCollisionOptions = {},
): HomeDriveBuildingCollisionResolution {
  const tickedState = tickHomeDriveBuildingCollisionState(
    buildingCollisions,
    nowSeconds,
  );

  if (options.enabled === false) {
    return {
      car,
      buildingCollisions: tickedState,
      events: [],
      impact: null,
    };
  }

  const playerRadiusMeters =
    options.playerRadiusMeters ?? DEFAULT_PLAYER_RADIUS_METERS;
  const cooldownSeconds =
    options.cooldownSeconds ?? DEFAULT_COOLDOWN_SECONDS;
  const minImpactSpeedMps =
    options.minImpactSpeedMps ?? DEFAULT_MIN_IMPACT_SPEED_MPS;
  const brutality = options.brutality ?? DEFAULT_BRUTALITY;
  const playerPushMultiplier =
    options.playerPushMultiplier ?? DEFAULT_PLAYER_PUSH_MULTIPLIER;
  const reverseKickMultiplier =
    options.reverseKickMultiplier ?? DEFAULT_REVERSE_KICK_MULTIPLIER;
  const maxReverseKickMps =
    options.maxReverseKickMps ?? DEFAULT_MAX_REVERSE_KICK_MPS;

  const candidates = getHomeDriveBuildingsNearPosition(buildings, car.position, {
    radiusMeters: options.candidateRadiusMeters ?? DEFAULT_CANDIDATE_RADIUS_METERS,
    maxBuildings:
      options.maxCandidateBuildings ?? DEFAULT_MAX_CANDIDATE_BUILDINGS,
  });

  let resolvedCar = car;
  let resolvedState = tickedState;
  let mergedImpact: HomeDriveRuntimeImpactState | null = null;
  const events: HomeDriveBuildingCollisionEvent[] = [];

  for (const building of candidates) {
    if (
      shouldSkipBuildingCollision({
        state: resolvedState,
        buildingId: building.id,
        nowSeconds,
        cooldownSeconds,
      })
    ) {
      continue;
    }

    const hit = resolveHomeDriveCarBuildingCollisionHit(
      resolvedCar,
      building,
      playerRadiusMeters,
    );

    if (!hit) {
      continue;
    }

    const relativeSpeedMps = getRelativeImpactSpeedMps(
      resolvedCar,
      hit.normalFromBuildingToPlayer,
    );

    if (
      relativeSpeedMps < minImpactSpeedMps &&
      Math.abs(resolvedCar.speedMps) < minImpactSpeedMps
    ) {
      resolvedCar = {
        ...resolvedCar,
        position: {
          x:
            resolvedCar.position.x +
            hit.normalFromBuildingToPlayer.x * Math.max(0.04, hit.overlapMeters),
          z:
            resolvedCar.position.z +
            hit.normalFromBuildingToPlayer.z * Math.max(0.04, hit.overlapMeters),
        },
      };

      continue;
    }

    const impulse = getCollisionImpulse({
      overlapMeters: hit.overlapMeters,
      relativeSpeedMps,
      buildingHeightMeters: building.heightMeters,
      brutality,
    });

    const event = createBuildingCollisionEvent({
      car: resolvedCar,
      building,
      face: hit.face,
      normal: hit.normalFromBuildingToPlayer,
      position: hit.contactPosition,
      contactYMeters: hit.contactYMeters,
      overlapMeters: hit.overlapMeters,
      relativeSpeedMps,
      impulse,
      nowSeconds,
    });

    events.push(event);

    mergedImpact = mergeHomeDriveImpactStates(
      mergedImpact,
      createHomeDriveImpactFromCollision({
        car: resolvedCar,
        normal: hit.normalFromBuildingToPlayer,
        relativeSpeedMps,
        impulse,
        occurredAt: nowSeconds,
        brutality,
      }),
    );

    resolvedState = addHomeDriveBuildingCollisionEventToState(
      resolvedState,
      event,
      {
        maxDestructions: options.maxDestructions,
        maxDestructionZonesPerBuilding: options.maxDestructionZonesPerBuilding,
        destructionMergeDistanceMeters:
          options.maxDestructionMergeDistanceMeters ?? 2.85,
        destructionBuildingCenter: building.position,
        destructionLocalYMeters: hit.contactYMeters,

        maxRubblePiecesPerImpact: options.maxRubblePiecesPerImpact,
        maxRubblePiecesPerBuilding: options.maxRubblePiecesPerBuilding,
        maxRubblePiecesTotal: options.maxRubblePiecesTotal,
        rubbleIntensity: options.rubbleIntensity,

        buildingLeanIntensity: options.buildingLeanIntensity,
        maxBuildingLeanRad: options.maxBuildingLeanRad,
        basePivotYOffsetMeters: options.basePivotYOffsetMeters,
      },
    );

    resolvedCar = resolvePlayerBuildingImpact({
      car: resolvedCar,
      normal: hit.normalFromBuildingToPlayer,
      overlapMeters: hit.overlapMeters,
      impulse,
      playerPushMultiplier,
      reverseKickMultiplier,
      maxReverseKickMps,
    });
  }

  return {
    car: resolvedCar,
    buildingCollisions: resolvedState,
    events,
    impact: mergedImpact,
  };
}
