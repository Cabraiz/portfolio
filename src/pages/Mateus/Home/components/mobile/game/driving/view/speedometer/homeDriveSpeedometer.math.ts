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

function lerpNumber(start: number, end: number, amount: number): number {
  return start + (end - start) * clampNumber(amount, 0, 1);
}

export function convertHomeDriveSpeedMpsToKmh(speedMps: number): number {
  if (!Number.isFinite(speedMps)) {
    return 0;
  }

  /**
   * Importante:
   * Não usar Math.abs aqui.
   *
   * Quando uma colisão joga o carro para trás, speedMps pode ficar negativo.
   * Em um velocímetro analógico de cockpit, isso deve derrubar o ponteiro.
   */
  return Math.max(0, speedMps) * 3.6;
}

export function getHomeDriveSpeedometerProgress(speedKmh: number): number {
  return clampNumber(speedKmh / HOME_DRIVE_SPEEDOMETER_MAX_SPEED_KMH, 0, 1);
}

export function getHomeDriveSpeedometerTickDeg(valueKmh: number): number {
  const progress = getHomeDriveSpeedometerProgress(valueKmh);

  return lerpNumber(
    HOME_DRIVE_SPEEDOMETER_MIN_SWEEP_DEG,
    HOME_DRIVE_SPEEDOMETER_MAX_SWEEP_DEG,
    progress,
  );
}

export function getHomeDriveSpeedometerNeedleState(
  speedMps: number,
): HomeDriveSpeedometerNeedleState {
  const speedKmh = convertHomeDriveSpeedMpsToKmh(speedMps);
  const progress = getHomeDriveSpeedometerProgress(speedKmh);
  const needleDeg = lerpNumber(
    HOME_DRIVE_SPEEDOMETER_MIN_SWEEP_DEG,
    HOME_DRIVE_SPEEDOMETER_MAX_SWEEP_DEG,
    progress,
  );

  return {
    speedKmh,
    displaySpeedKmh: Math.round(speedKmh),
    progress,
    needleDeg,
  };
}
