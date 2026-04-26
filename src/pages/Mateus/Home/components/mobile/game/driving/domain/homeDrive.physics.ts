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
	FREE_DRIVE_WORLD_HALF_SIZE_METERS,
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

function clampToWorld(value: number): number {
	return clamp(
		value,
		-FREE_DRIVE_WORLD_HALF_SIZE_METERS,
		FREE_DRIVE_WORLD_HALF_SIZE_METERS
	);
}

function getBoundaryDragMultiplier(nextX: number, nextZ: number): number {
	const marginMeters = 26;
	const distanceToEdge = Math.min(
		FREE_DRIVE_WORLD_HALF_SIZE_METERS - Math.abs(nextX),
		FREE_DRIVE_WORLD_HALF_SIZE_METERS - Math.abs(nextZ)
	);

	if (distanceToEdge >= marginMeters) {
		return 1;
	}

	return clamp(distanceToEdge / marginMeters, 0.22, 1);
}

export function tickHomeDrivePhysics(
	current: HomeDriveRuntimeState,
	input: HomeDriveInputState,
	rawDeltaSeconds: number
): HomeDriveRuntimeState {
	const deltaSeconds = clamp(
		rawDeltaSeconds,
		0,
		FREE_DRIVE_LOOP_MAX_DELTA_SECONDS
	);

	const normalizedSteering = clamp(input.steering, -1, 1);
	const normalizedThrottle = clamp(input.throttle, 0, 1);
	const normalizedBrake = clamp(input.brake, 0, 1);

	const targetSteerAngleRad =
		normalizedSteering * degToRad(FREE_DRIVE_MAX_STEER_ANGLE_DEG);

	const steerAngleRad = lerp(
		current.car.steerAngleRad,
		targetSteerAngleRad,
		1 - Math.exp(-FREE_DRIVE_STEER_SMOOTHING * deltaSeconds)
	);

	const cruiseTargetSpeed = FREE_DRIVE_CRUISE_SPEED_MPS * normalizedThrottle;
	const accelerationBudget =
		FREE_DRIVE_ACCELERATION_MPS2 *
		deltaSeconds *
		Math.max(normalizedThrottle, 0.32);

	let speedMps = moveTowards(
		current.car.speedMps,
		cruiseTargetSpeed,
		accelerationBudget
	);

	speedMps -=
		FREE_DRIVE_NATURAL_DRAG_MPS2 * deltaSeconds * (1 - normalizedThrottle);
	speedMps -= FREE_DRIVE_BRAKE_MPS2 * deltaSeconds * normalizedBrake;
	speedMps = clamp(speedMps, 0, FREE_DRIVE_MAX_SPEED_MPS);

	const speedForTurning = Math.max(speedMps, 0.1);
	const turnRateRad =
		(Math.tan(steerAngleRad) * speedForTurning) / FREE_DRIVE_WHEEL_BASE_METERS;

	const headingRad = wrapAngleRad(
		current.car.headingRad + turnRateRad * deltaSeconds
	);

	const forwardX = Math.sin(headingRad);
	const forwardZ = Math.cos(headingRad);

	const proposedX = current.car.position.x + forwardX * speedMps * deltaSeconds;
	const proposedZ = current.car.position.z + forwardZ * speedMps * deltaSeconds;

	const clampedX = clampToWorld(proposedX);
	const clampedZ = clampToWorld(proposedZ);

	const boundaryDragMultiplier = getBoundaryDragMultiplier(clampedX, clampedZ);
	const didHitBoundary = clampedX !== proposedX || clampedZ !== proposedZ;

	return {
		elapsedSeconds: current.elapsedSeconds + deltaSeconds,
		car: {
			position: {
				x: clampedX,
				z: clampedZ,
			},
			headingRad,
			speedMps: didHitBoundary
				? speedMps * 0.38
				: speedMps * boundaryDragMultiplier,
			steerAngleRad,
		},
	};
}
