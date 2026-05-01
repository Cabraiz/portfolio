// src/pages/Mateus/Home/components/mobile/game/driving/domain/buildingCollisions/homeDrive.buildingCollisionLean.ts

import type { HomeDriveVector2 } from "../homeDrive.types";
import type { HomeDriveBuildingCollisionEvent } from "./homeDrive.buildingCollision.types";
import type {
  HomeDriveBuildingLeanCreationOptions,
  HomeDriveBuildingLeanState,
} from "./homeDrive.buildingCollisionLean.types";

const DEFAULT_BUILDING_LEAN_INTENSITY = 1;
const DEFAULT_MAX_BUILDING_LEAN_RAD = 0.115;
const DEFAULT_BASE_PIVOT_Y_OFFSET_METERS = 0;

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

function normalizeVector(vector: HomeDriveVector2): HomeDriveVector2 {
  const length = Math.hypot(vector.x, vector.z);

  if (length <= 0.0001 || !Number.isFinite(length)) {
    return {
      x: 0,
      z: 1,
    };
  }

  return {
    x: vector.x / length,
    z: vector.z / length,
  };
}

function getImpactLeanDirection(event: HomeDriveBuildingCollisionEvent): HomeDriveVector2 {
  /*
   * event.normal aponta do prédio para o carro.
   * O topo do prédio deve ceder para dentro da pancada, então usamos -normal.
   */
  return normalizeVector({
    x: -event.normal.x,
    z: -event.normal.z,
  });
}

function getMaxLeanRad(options: HomeDriveBuildingLeanCreationOptions): number {
  return Math.max(
    0,
    options.maxBuildingLeanRad ?? DEFAULT_MAX_BUILDING_LEAN_RAD,
  );
}

function getLeanMagnitudeRad(
  event: HomeDriveBuildingCollisionEvent,
  options: HomeDriveBuildingLeanCreationOptions,
): number {
  const severity = clamp(event.severity, 0, 1);
  const speedRatio = clamp(event.relativeSpeedMps / 24, 0, 1);
  const impulseRatio = clamp(event.impulse / 32, 0, 1);
  const intensity = clamp(
    options.buildingLeanIntensity ?? DEFAULT_BUILDING_LEAN_INTENSITY,
    0,
    3,
  );

  return clamp(
    (severity * 0.032 + speedRatio * 0.02 + impulseRatio * 0.038) * intensity,
    0,
    getMaxLeanRad(options),
  );
}

function getLeanRotationFromDirection(
  direction: HomeDriveVector2,
  magnitudeRad: number,
): Readonly<{
  leanXRad: number;
  leanZRad: number;
}> {
  /*
   * Em Three.js:
   * - rotação X inclina o eixo Y na direção Z.
   * - rotação Z inclina o eixo Y na direção X.
   */
  return {
    leanXRad: -direction.z * magnitudeRad,
    leanZRad: direction.x * magnitudeRad,
  };
}

function mixVectors(
  first: HomeDriveVector2,
  firstWeight: number,
  second: HomeDriveVector2,
  secondWeight: number,
): HomeDriveVector2 {
  return normalizeVector({
    x: first.x * firstWeight + second.x * secondWeight,
    z: first.z * firstWeight + second.z * secondWeight,
  });
}

export function createHomeDriveBuildingLeanStateFromEvent(
  event: HomeDriveBuildingCollisionEvent,
  options: HomeDriveBuildingLeanCreationOptions = {},
): HomeDriveBuildingLeanState {
  const direction = getImpactLeanDirection(event);
  const magnitudeRad = getLeanMagnitudeRad(event, options);
  const rotation = getLeanRotationFromDirection(direction, magnitudeRad);

  return {
    buildingId: event.buildingId,
    leanXRad: rotation.leanXRad,
    leanZRad: rotation.leanZRad,
    leanDirection: direction,
    visualLeanIntensity: clamp(magnitudeRad / Math.max(0.001, getMaxLeanRad(options)), 0, 1),
    accumulatedImpulse: event.impulse,
    hitCount: 1,
    lastImpactNormal: event.normal,
    basePivotYOffsetMeters:
      options.basePivotYOffsetMeters ?? DEFAULT_BASE_PIVOT_Y_OFFSET_METERS,
    createdAtSeconds: event.occurredAtSeconds,
    updatedAtSeconds: event.occurredAtSeconds,
  };
}

export function mergeHomeDriveBuildingLeanStateFromEvent(
  current: HomeDriveBuildingLeanState,
  event: HomeDriveBuildingCollisionEvent,
  options: HomeDriveBuildingLeanCreationOptions = {},
): HomeDriveBuildingLeanState {
  const incomingDirection = getImpactLeanDirection(event);
  const nextHitCount = current.hitCount + 1;
  const nextAccumulatedImpulse = current.accumulatedImpulse + event.impulse;
  const direction = mixVectors(
    current.leanDirection,
    Math.max(1, current.accumulatedImpulse),
    incomingDirection,
    Math.max(1, event.impulse),
  );

  const maxLeanRad = getMaxLeanRad(options);
  const incomingMagnitude = getLeanMagnitudeRad(event, options);
  const currentMagnitude = Math.hypot(current.leanXRad, current.leanZRad);
  const repeatedHitBonus = clamp(nextHitCount * 0.006, 0, maxLeanRad * 0.32);
  const accumulatedMagnitude = clamp(
    currentMagnitude + incomingMagnitude * 0.42 + repeatedHitBonus,
    0,
    maxLeanRad,
  );
  const rotation = getLeanRotationFromDirection(direction, accumulatedMagnitude);

  return {
    ...current,
    leanXRad: rotation.leanXRad,
    leanZRad: rotation.leanZRad,
    leanDirection: direction,
    visualLeanIntensity: clamp(accumulatedMagnitude / Math.max(0.001, maxLeanRad), 0, 1),
    accumulatedImpulse: nextAccumulatedImpulse,
    hitCount: nextHitCount,
    lastImpactNormal: event.normal,
    basePivotYOffsetMeters:
      options.basePivotYOffsetMeters ?? current.basePivotYOffsetMeters,
    updatedAtSeconds: event.occurredAtSeconds,
  };
}
