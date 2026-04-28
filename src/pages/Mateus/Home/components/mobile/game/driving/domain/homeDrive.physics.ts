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

  const normalizedSteering = clamp(input.steering, -1, 1);
  const normalizedThrottle = clamp(input.throttle, 0, 1);
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
    Math.max(normalizedThrottle, 0.32);

  let speedMps = moveTowards(
    current.car.speedMps,
    cruiseTargetSpeed,
    accelerationBudget,
  );

  speedMps -=
    FREE_DRIVE_NATURAL_DRAG_MPS2 * deltaSeconds * (1 - normalizedThrottle);
  speedMps -= FREE_DRIVE_BRAKE_MPS2 * deltaSeconds * normalizedBrake;
  speedMps = clamp(speedMps, 0, FREE_DRIVE_MAX_SPEED_MPS);

  const speedForTurning = Math.max(speedMps, 0.1);
  const turnRateRad =
    (Math.tan(steerAngleRad) * speedForTurning) / FREE_DRIVE_WHEEL_BASE_METERS;

  const headingRad = wrapAngleRad(
    current.car.headingRad + turnRateRad * deltaSeconds,
  );

  const forwardX = Math.sin(headingRad);
  const forwardZ = Math.cos(headingRad);

  const proposedPosition = {
    x: current.car.position.x + forwardX * speedMps * deltaSeconds,
    z: current.car.position.z + forwardZ * speedMps * deltaSeconds,
  };

  const boundaryResolution = resolveHomeDriveBoundaryCollision(
    current.car,
    proposedPosition,
    {
      collisionSpeedRetention: BOUNDARY_COLLISION_SPEED_RETENTION,
    },
  );

  const boundaryDragMultiplier = getHomeDriveBoundaryDragMultiplier(
    boundaryResolution.position,
  );

  return {
    elapsedSeconds: current.elapsedSeconds + deltaSeconds,
    car: {
      position: boundaryResolution.position,
      headingRad,
      speedMps: boundaryResolution.didCollide
        ? boundaryResolution.speedMps
        : boundaryResolution.speedMps * boundaryDragMultiplier,
      steerAngleRad,
    },
  };
}
