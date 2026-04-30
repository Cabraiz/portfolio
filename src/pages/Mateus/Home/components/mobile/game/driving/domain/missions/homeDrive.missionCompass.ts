// src/pages/Mateus/Home/components/mobile/game/driving/domain/missions/homeDrive.missionCompass.ts

import { getHomeDriveMissionDestinations } from "./homeDrive.missionDestinations";
import {
  getHomeDriveMissionActiveDestination,
  HOME_DRIVE_MISSION_DEFAULT_CHECK_IN_HOLD_SECONDS,
} from "./homeDrive.missionRuntime";
import type {
  HomeDriveMissionCompassResolveInput,
  HomeDriveMissionCompassTarget,
  HomeDriveMissionDestination,
} from "./homeDrive.mission.types";

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

function wrapAngleRad(angleRad: number): number {
  let angle = angleRad;

  while (angle <= -Math.PI) {
    angle += Math.PI * 2;
  }

  while (angle > Math.PI) {
    angle -= Math.PI * 2;
  }

  return angle;
}

function getDistanceMeters(
  first: Readonly<{ x: number; z: number }>,
  second: Readonly<{ x: number; z: number }>,
): number {
  return Math.hypot(first.x - second.x, first.z - second.z);
}

function formatDistanceMeters(distanceMeters: number): string {
  if (distanceMeters >= 1000) {
    return `${(distanceMeters / 1000).toFixed(1)} km`;
  }

  return `${Math.round(distanceMeters)} m`;
}

function getCheckInProgress(params: {
  destination: HomeDriveMissionDestination;
  distanceMeters: number;
  activeInsideSeconds: number;
  checkInHoldSeconds: number;
}): number {
  if (params.distanceMeters > params.destination.radiusMeters) {
    return 0;
  }

  return clamp01(
    params.activeInsideSeconds / Math.max(0.001, params.checkInHoldSeconds),
  );
}

export function resolveHomeDriveMissionCompassTarget({
  runtime,
  carPosition,
  carHeadingRad,
  destinations = getHomeDriveMissionDestinations(),
  checkInHoldSeconds = HOME_DRIVE_MISSION_DEFAULT_CHECK_IN_HOLD_SECONDS,
}: HomeDriveMissionCompassResolveInput): HomeDriveMissionCompassTarget | null {
  const activeDestination = getHomeDriveMissionActiveDestination(
    runtime,
    destinations,
  );

  if (!activeDestination) {
    return null;
  }

  const dx = activeDestination.position.x - carPosition.x;
  const dz = activeDestination.position.z - carPosition.z;
  const distanceMeters = getDistanceMeters(carPosition, activeDestination.position);

  const absoluteAngleRad = Math.atan2(dx, dz);
  const relativeAngleRad = wrapAngleRad(absoluteAngleRad - carHeadingRad);

  const directionLength = Math.hypot(dx, dz) || 1;
  const directionX = dx / directionLength;
  const directionZ = dz / directionLength;

  const isInsideCheckInRadius =
    distanceMeters <= activeDestination.radiusMeters;

  return {
    destinationId: activeDestination.id,
    label: activeDestination.label,
    imageSrc: activeDestination.imageSrc,
    distanceMeters,
    distanceLabel: formatDistanceMeters(distanceMeters),
    relativeAngleRad,
    absoluteAngleRad,
    directionX,
    directionZ,
    isInsideCheckInRadius,
    checkInProgress: getCheckInProgress({
      destination: activeDestination,
      distanceMeters,
      activeInsideSeconds: runtime.activeInsideSeconds,
      checkInHoldSeconds,
    }),
    isBehind: Math.cos(relativeAngleRad) < -0.15,
  };
}
