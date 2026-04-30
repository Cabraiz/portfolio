// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.physics.ts

import {
  FREE_DRIVE_ACCELERATION_MPS2,
  FREE_DRIVE_BRAKE_MPS2,
  FREE_DRIVE_CORNERING_DRAG_MPS2,
  FREE_DRIVE_CORNERING_MIN_RETAINED_SPEED_MPS,
  FREE_DRIVE_CORNERING_SPEED_EXPONENT,
  FREE_DRIVE_CORNERING_STEER_EXPONENT,
  FREE_DRIVE_CRUISE_SPEED_MPS,
  FREE_DRIVE_LOOP_MAX_DELTA_SECONDS,
  FREE_DRIVE_MAX_SPEED_MPS,
  FREE_DRIVE_MAX_STEER_ANGLE_DEG,
  FREE_DRIVE_NATURAL_DRAG_MPS2,
  FREE_DRIVE_STEER_SMOOTHING,
  FREE_DRIVE_WHEEL_BASE_METERS,
} from "./homeDrive.constants";
import {
  applyHomeDriveImpactToCar,
  getHomeDriveImpactControlFactor,
  normalizeHomeDriveImpactState,
  tickHomeDriveImpact,
} from "./homeDrive.impact";
import {
  clamp,
  degToRad,
  lerp,
  moveTowards,
  wrapAngleRad,
} from "./homeDrive.math";
import type {
  HomeDriveInputState,
  HomeDriveRuntimeState,
} from "./homeDrive.types";
import {
  getHomeDriveBoundaryDragMultiplier,
  resolveHomeDriveBoundaryCollision,
} from "./homeDrive.worldBoundary";

const BOUNDARY_COLLISION_SPEED_RETENTION = 0.12;
const FREE_DRIVE_MAX_REVERSE_SPEED_MPS = 8.5;

function getHomeDriveThrottleAccelerationBudget(params: {
  throttle: number;
  controlFactor: number;
  currentSpeedMps: number;
  targetSpeedMps: number;
  deltaSeconds: number;
}): number {
  const normalizedThrottle = clamp(params.throttle, 0, 1);
  const controlFactor = clamp(params.controlFactor, 0, 1);

  if (controlFactor <= 0) {
    return 0;
  }

  const throttleFloor = 0.2 * controlFactor;
  const throttleForce = Math.max(normalizedThrottle, throttleFloor);

  const currentAbsSpeed = Math.abs(params.currentSpeedMps);
  const targetAbsSpeed = Math.max(Math.abs(params.targetSpeedMps), 0.001);
  const speedRatio = clamp(currentAbsSpeed / targetAbsSpeed, 0, 1);

  /*
    O carro acelera melhor no começo e perde força perto do alvo,
    como carro comum, não como movimento linear de jogo.
  */
  const highSpeedEase = lerp(1, 0.48, Math.pow(speedRatio, 1.15));

  return (
    FREE_DRIVE_ACCELERATION_MPS2 *
    params.deltaSeconds *
    throttleForce *
    highSpeedEase
  );
}

function applyHomeDriveNaturalDrag(params: {
  speedMps: number;
  throttle: number;
  brake: number;
  deltaSeconds: number;
}): number {
  const normalizedThrottle = clamp(params.throttle, 0, 1);
  const normalizedBrake = clamp(params.brake, 0, 1);

  let speedMps = params.speedMps;

  const naturalDragFactor = clamp(1 - normalizedThrottle * 0.78, 0.14, 1);

  speedMps -=
    FREE_DRIVE_NATURAL_DRAG_MPS2 *
    params.deltaSeconds *
    naturalDragFactor *
    Math.sign(speedMps || 1);

  if (normalizedBrake > 0) {
    const brakeAmount =
      FREE_DRIVE_BRAKE_MPS2 * params.deltaSeconds * normalizedBrake;

    if (speedMps > 0) {
      speedMps = Math.max(0, speedMps - brakeAmount);
    } else if (speedMps < 0) {
      speedMps = Math.min(0, speedMps + brakeAmount);
    }
  }

  return speedMps;
}

function applyHomeDriveCorneringSpeedLoss(params: {
  speedMps: number;
  steerAngleRad: number;
  deltaSeconds: number;
}): number {
  const absSpeedMps = Math.abs(params.speedMps);

  if (absSpeedMps <= 0.001) {
    return 0;
  }

  const maxSteerRad = Math.max(
    degToRad(FREE_DRIVE_MAX_STEER_ANGLE_DEG),
    0.001,
  );

  const steeringIntensity = clamp(
    Math.abs(params.steerAngleRad) / maxSteerRad,
    0,
    1,
  );

  if (steeringIntensity <= 0.015) {
    return params.speedMps;
  }

  const speedIntensity = clamp(absSpeedMps / FREE_DRIVE_MAX_SPEED_MPS, 0, 1);

  const corneringDragMps =
    FREE_DRIVE_CORNERING_DRAG_MPS2 *
    Math.pow(steeringIntensity, FREE_DRIVE_CORNERING_STEER_EXPONENT) *
    Math.pow(speedIntensity, FREE_DRIVE_CORNERING_SPEED_EXPONENT) *
    params.deltaSeconds;

  if (corneringDragMps <= 0) {
    return params.speedMps;
  }

  const minimumRetainedAbsSpeed =
    absSpeedMps >= FREE_DRIVE_CORNERING_MIN_RETAINED_SPEED_MPS
      ? FREE_DRIVE_CORNERING_MIN_RETAINED_SPEED_MPS
      : absSpeedMps;

  const nextAbsSpeedMps = Math.max(
    absSpeedMps - corneringDragMps,
    minimumRetainedAbsSpeed,
  );

  return Math.sign(params.speedMps) * nextAbsSpeedMps;
}

export function tickHomeDrivePhysics(
  current: HomeDriveRuntimeState,
  input: HomeDriveInputState,
  rawDeltaSeconds: number,
): HomeDriveRuntimeState {
  const deltaSeconds = clamp(
    rawDeltaSeconds,
    0,
    FREE_DRIVE_LOOP_MAX_DELTA_SECONDS,
  );

  const currentImpact = normalizeHomeDriveImpactState(current.impact);
  const controlFactor = getHomeDriveImpactControlFactor(currentImpact);

  const normalizedSteering = clamp(input.steering, -1, 1) * controlFactor;
  const normalizedThrottle = clamp(input.throttle, 0, 1) * controlFactor;
  const normalizedBrake = clamp(input.brake, 0, 1);

  const targetSteerAngleRad =
    normalizedSteering * degToRad(FREE_DRIVE_MAX_STEER_ANGLE_DEG);

  const steerAngleRad = lerp(
    current.car.steerAngleRad,
    targetSteerAngleRad,
    1 - Math.exp(-FREE_DRIVE_STEER_SMOOTHING * deltaSeconds),
  );

  const cruiseTargetSpeed = FREE_DRIVE_CRUISE_SPEED_MPS * normalizedThrottle;

  const accelerationBudget = getHomeDriveThrottleAccelerationBudget({
    throttle: normalizedThrottle,
    controlFactor,
    currentSpeedMps: current.car.speedMps,
    targetSpeedMps: cruiseTargetSpeed,
    deltaSeconds,
  });

  let speedMps = moveTowards(
    current.car.speedMps,
    cruiseTargetSpeed,
    accelerationBudget,
  );

  speedMps = applyHomeDriveNaturalDrag({
    speedMps,
    throttle: normalizedThrottle,
    brake: normalizedBrake,
    deltaSeconds,
  });

  speedMps = clamp(
    speedMps,
    -FREE_DRIVE_MAX_REVERSE_SPEED_MPS,
    FREE_DRIVE_MAX_SPEED_MPS,
  );

  speedMps = applyHomeDriveCorneringSpeedLoss({
    speedMps,
    steerAngleRad,
    deltaSeconds,
  });

  speedMps = clamp(
    speedMps,
    -FREE_DRIVE_MAX_REVERSE_SPEED_MPS,
    FREE_DRIVE_MAX_SPEED_MPS,
  );

  const speedForTurning = Math.max(Math.abs(speedMps), 0.1);
  const turnDirection = speedMps >= 0 ? 1 : -1;
  const turnRateRad =
    (Math.tan(steerAngleRad) * speedForTurning * turnDirection) /
    FREE_DRIVE_WHEEL_BASE_METERS;

  const headingRad = wrapAngleRad(
    current.car.headingRad + turnRateRad * deltaSeconds,
  );

  const forwardX = Math.sin(headingRad);
  const forwardZ = Math.cos(headingRad);

  const proposedCar = applyHomeDriveImpactToCar(
    {
      position: {
        x: current.car.position.x + forwardX * speedMps * deltaSeconds,
        z: current.car.position.z + forwardZ * speedMps * deltaSeconds,
      },
      headingRad,
      speedMps,
      steerAngleRad,
    },
    currentImpact,
    deltaSeconds,
    {
      allowReverseKick: true,
      maxRecoilSpeedMps: 48,
      maxSpinVelocityRadps: 38,
    },
  );

  const boundaryResolution = resolveHomeDriveBoundaryCollision(
    proposedCar,
    proposedCar.position,
    {
      collisionSpeedRetention: BOUNDARY_COLLISION_SPEED_RETENTION,
    },
  );

  const boundaryDragMultiplier = getHomeDriveBoundaryDragMultiplier(
    boundaryResolution.position,
  );

  const nextSpeedMps = boundaryResolution.didCollide
    ? boundaryResolution.speedMps
    : boundaryResolution.speedMps * boundaryDragMultiplier;

  return {
    elapsedSeconds: current.elapsedSeconds + deltaSeconds,
    impact: tickHomeDriveImpact(currentImpact, deltaSeconds),
    car: {
      position: boundaryResolution.position,
      headingRad: proposedCar.headingRad,
      speedMps: clamp(
        nextSpeedMps,
        -FREE_DRIVE_MAX_REVERSE_SPEED_MPS,
        FREE_DRIVE_MAX_SPEED_MPS,
      ),
      steerAngleRad: proposedCar.steerAngleRad,
    },
  };
}
