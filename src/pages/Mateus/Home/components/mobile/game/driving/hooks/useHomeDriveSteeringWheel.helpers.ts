// src/pages/Mateus/Home/components/mobile/game/driving/hooks/useHomeDriveSteeringWheel.helpers.ts

import {
	FREE_DRIVE_WHEEL_VISUAL_MAX_ROTATION_DEG as HOME_DRIVE_WHEEL_VISUAL_MAX_ROTATION_DEG,
} from "../domain/homeDrive.constants";
import { clamp } from "../domain/homeDrive.math";

const ROTATION_EPSILON_DEG = 0.08;
const STEERING_EPSILON = 0.001;
const STEERING_CALLBACK_EPSILON = 0.0005;

export function isFiniteNumber(value: number): boolean {
  return Number.isFinite(value);
}

export function getPointerAngleDeg(
  element: HTMLElement,
  clientX: number,
  clientY: number,
): number | null {
  const rect = element.getBoundingClientRect();

  if (
    rect.width <= 0 ||
    rect.height <= 0 ||
    !isFiniteNumber(rect.left) ||
    !isFiniteNumber(rect.top) ||
    !isFiniteNumber(clientX) ||
    !isFiniteNumber(clientY)
  ) {
    return null;
  }

  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const angleDeg =
    (Math.atan2(clientY - centerY, clientX - centerX) * 180) / Math.PI;

  return isFiniteNumber(angleDeg) ? angleDeg : null;
}

export function setPointerCaptureSafely(
  element: HTMLElement | null,
  pointerId: number,
): void {
  if (!element) {
    return;
  }

  try {
    if (!element.hasPointerCapture(pointerId)) {
      element.setPointerCapture(pointerId);
    }
  } catch {
    /*
      Alguns browsers mobile podem falhar se o pointer já foi finalizado
      ou se o elemento perdeu o ciclo de interação. Nesse caso ignoramos.
    */
  }
}

export function releasePointerCaptureSafely(
  element: HTMLElement | null,
  pointerId: number,
): void {
  if (!element) {
    return;
  }

  try {
    if (element.hasPointerCapture(pointerId)) {
      element.releasePointerCapture(pointerId);
    }
  } catch {
    /*
      Evita crash quando o browser já liberou a captura automaticamente.
    */
  }
}

export function clampWheelRotationDeg(rotationDeg: number): number {
  if (!isFiniteNumber(rotationDeg)) {
    return 0;
  }

  return clamp(
    rotationDeg,
    -HOME_DRIVE_WHEEL_VISUAL_MAX_ROTATION_DEG,
    HOME_DRIVE_WHEEL_VISUAL_MAX_ROTATION_DEG,
  );
}

export function areRotationsEquivalent(first: number, second: number): boolean {
  if (!isFiniteNumber(first) || !isFiniteNumber(second)) {
    return false;
  }

  return Math.abs(first - second) <= ROTATION_EPSILON_DEG;
}

export function areSteeringValuesEquivalent(first: number, second: number): boolean {
  if (!isFiniteNumber(first) || !isFiniteNumber(second)) {
    return false;
  }

  return Math.abs(first - second) <= STEERING_CALLBACK_EPSILON;
}

export function getSteeringFromRotationDeg(rotationDeg: number): number {
  if (
    HOME_DRIVE_WHEEL_VISUAL_MAX_ROTATION_DEG <= 0 ||
    !isFiniteNumber(rotationDeg)
  ) {
    return 0;
  }

  /*
    Correção do volante invertido:
    - wheelRotationDeg fica visualmente natural.
    - steering é invertido para casar com a física/câmera do mundo 3D.
  */
  const steering = -clamp(
    rotationDeg / HOME_DRIVE_WHEEL_VISUAL_MAX_ROTATION_DEG,
    -1,
    1,
  );

  return Math.abs(steering) <= STEERING_EPSILON ? 0 : steering;
}
