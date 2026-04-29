// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.physics.ts

import {
  FREE_DRIVE_ACCELERATION_MPS2,
  FREE_DRIVE_BRAKE_MPS2,
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
const FREE_DRIVE_MAX_REVERSE_SPEED_MPS = 22;

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
  const accelerationBudget =
    FREE_DRIVE_ACCELERATION_MPS2 *
    deltaSeconds *
    Math.max(normalizedThrottle, 0.32 * controlFactor);

  let speedMps = moveTowards(
    current.car.speedMps,
    cruiseTargetSpeed,
    accelerationBudget,
  );

  speedMps -=
    FREE_DRIVE_NATURAL_DRAG_MPS2 * deltaSeconds * (1 - normalizedThrottle);
  speedMps -= FREE_DRIVE_BRAKE_MPS2 * deltaSeconds * normalizedBrake;
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
