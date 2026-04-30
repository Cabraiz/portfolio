// src/pages/Mateus/Home/components/mobile/game/driving/view/speedometer/homeDriveSpeedometer.math.ts

import {
  HOME_DRIVE_SPEEDOMETER_MAX_SPEED_KMH,
  HOME_DRIVE_SPEEDOMETER_MAX_SWEEP_DEG,
  HOME_DRIVE_SPEEDOMETER_MIN_SWEEP_DEG,
} from "./homeDriveSpeedometer.tokens";

export type HomeDriveSpeedometerNeedleState = Readonly<{
  speedKmh: number;
  displaySpeedKmh: number;
  progress: number;
  needleDeg: number;
}>;

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

function lerpNumber(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

export function getHomeDriveSpeedKmh(speedMps: number): number {
  if (!Number.isFinite(speedMps)) {
    return 0;
  }

  return Math.abs(speedMps) * 3.6;
}

export function clampHomeDriveSpeedometerKmh(speedKmh: number): number {
  return clampNumber(speedKmh, 0, HOME_DRIVE_SPEEDOMETER_MAX_SPEED_KMH);
}

export function getHomeDriveSpeedometerProgress(speedKmh: number): number {
  const clampedSpeedKmh = clampHomeDriveSpeedometerKmh(speedKmh);

  return clampNumber(
    clampedSpeedKmh / HOME_DRIVE_SPEEDOMETER_MAX_SPEED_KMH,
    0,
    1,
  );
}

export function getHomeDriveSpeedometerNeedleDeg(speedKmh: number): number {
  return lerpNumber(
    HOME_DRIVE_SPEEDOMETER_MIN_SWEEP_DEG,
    HOME_DRIVE_SPEEDOMETER_MAX_SWEEP_DEG,
    getHomeDriveSpeedometerProgress(speedKmh),
  );
}

export function getHomeDriveSpeedometerDisplayKmh(speedKmh: number): number {
  return Math.round(clampHomeDriveSpeedometerKmh(speedKmh));
}

export function getHomeDriveSpeedometerNeedleState(
  speedMps: number,
): HomeDriveSpeedometerNeedleState {
  const speedKmh = getHomeDriveSpeedKmh(speedMps);

  return {
    speedKmh,
    displaySpeedKmh: getHomeDriveSpeedometerDisplayKmh(speedKmh),
    progress: getHomeDriveSpeedometerProgress(speedKmh),
    needleDeg: getHomeDriveSpeedometerNeedleDeg(speedKmh),
  };
}

export function getHomeDriveSpeedometerTickDeg(speedKmh: number): number {
  return getHomeDriveSpeedometerNeedleDeg(speedKmh);
}
