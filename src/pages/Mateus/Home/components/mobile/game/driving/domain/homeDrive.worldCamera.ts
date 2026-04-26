import {
  clampHomeDriveWorldNumber,
  getShortestHomeDriveAngleDeg,
  lerpHomeDriveWorldNumber,
} from "./homeDrive.worldGeometry";
import type {
  HomeDriveNearestRoadResult,
  HomeDriveWorldCameraInput,
  HomeDriveWorldCameraState,
  HomeDriveWorldCarState,
} from "./homeDrive.worldTypes";

export const HOME_DRIVE_WORLD_CAMERA_CONFIG = {
  maxVisualSpeedKmh: 68,
  roadDriftMultiplier: 58,
  cameraRollMultiplier: 6.4,
  horizonShiftMultiplier: 34,
  parallaxMultiplier: 48,
  yawMultiplier: 8.5,
  pitchBaseDeg: 0.8,
  pitchSpeedDeg: 1.8,
  roadAlignmentInfluence: 0.36,
  smoothingPerSecond: 9.5,
} as const;

export function createInitialHomeDriveWorldCameraState(): HomeDriveWorldCameraState {
  return {
    roadDriftPx: 0,
    cameraRollDeg: 0,
    horizonShiftPx: 0,
    parallaxPx: 0,
    cameraYaw: 0,
    cameraPitch: HOME_DRIVE_WORLD_CAMERA_CONFIG.pitchBaseDeg,
    steeringIntensity: 0,
    roadAlignmentDeg: 0,
    speedIntensity: 0,
  };
}

function getRoadAlignmentDeg(
  car: HomeDriveWorldCarState,
  nearestRoad?: HomeDriveNearestRoadResult,
): number {
  if (!nearestRoad) {
    return 0;
  }

  return getShortestHomeDriveAngleDeg(
    nearestRoad.usableHeadingDeg,
    car.headingDeg,
  );
}

function dampCameraValue(
  previous: number,
  next: number,
  deltaSeconds: number,
): number {
  const safeDelta = clampHomeDriveWorldNumber(deltaSeconds, 0, 0.08);
  const progress = 1 - Math.exp(
    -HOME_DRIVE_WORLD_CAMERA_CONFIG.smoothingPerSecond * safeDelta,
  );

  return lerpHomeDriveWorldNumber(previous, next, progress);
}

export function resolveHomeDriveWorldCamera(
  input: HomeDriveWorldCameraInput,
  previousState: HomeDriveWorldCameraState = createInitialHomeDriveWorldCameraState(),
): HomeDriveWorldCameraState {
  const deltaSeconds = input.deltaSeconds ?? 1 / 60;
  const steering = clampHomeDriveWorldNumber(input.car.steering, -1, 1);
  const steeringIntensity = Math.abs(steering);
  const speedIntensity = clampHomeDriveWorldNumber(
    input.car.speedKmh / HOME_DRIVE_WORLD_CAMERA_CONFIG.maxVisualSpeedKmh,
    0,
    1,
  );
  const roadAlignmentDeg = clampHomeDriveWorldNumber(
    getRoadAlignmentDeg(input.car, input.nearestRoad),
    -80,
    80,
  );
  const roadAlignmentNormalized = clampHomeDriveWorldNumber(
    roadAlignmentDeg / 80,
    -1,
    1,
  );
  const lateralRoadDistance = input.nearestRoad?.signedDistanceMeters ?? 0;
  const lateralDistanceNormalized = clampHomeDriveWorldNumber(
    lateralRoadDistance / Math.max(8, input.nearestRoad?.road.width ?? 18),
    -1,
    1,
  );

  const steeringComponent = steering * speedIntensity;
  const alignmentComponent =
    roadAlignmentNormalized *
    HOME_DRIVE_WORLD_CAMERA_CONFIG.roadAlignmentInfluence;
  const roadCenteringComponent = lateralDistanceNormalized * 0.28;
  const combinedYaw = clampHomeDriveWorldNumber(
    steeringComponent + alignmentComponent + roadCenteringComponent,
    -1,
    1,
  );

  const targetState: HomeDriveWorldCameraState = {
    roadDriftPx:
      -combinedYaw *
      HOME_DRIVE_WORLD_CAMERA_CONFIG.roadDriftMultiplier,
    cameraRollDeg:
      -combinedYaw *
      HOME_DRIVE_WORLD_CAMERA_CONFIG.cameraRollMultiplier,
    horizonShiftPx:
      -combinedYaw *
      HOME_DRIVE_WORLD_CAMERA_CONFIG.horizonShiftMultiplier,
    parallaxPx:
      -combinedYaw *
      HOME_DRIVE_WORLD_CAMERA_CONFIG.parallaxMultiplier,
    cameraYaw:
      combinedYaw *
      HOME_DRIVE_WORLD_CAMERA_CONFIG.yawMultiplier,
    cameraPitch:
      HOME_DRIVE_WORLD_CAMERA_CONFIG.pitchBaseDeg +
      speedIntensity * HOME_DRIVE_WORLD_CAMERA_CONFIG.pitchSpeedDeg,
    steeringIntensity,
    roadAlignmentDeg,
    speedIntensity,
  };

  return {
    roadDriftPx: dampCameraValue(
      previousState.roadDriftPx,
      targetState.roadDriftPx,
      deltaSeconds,
    ),
    cameraRollDeg: dampCameraValue(
      previousState.cameraRollDeg,
      targetState.cameraRollDeg,
      deltaSeconds,
    ),
    horizonShiftPx: dampCameraValue(
      previousState.horizonShiftPx,
      targetState.horizonShiftPx,
      deltaSeconds,
    ),
    parallaxPx: dampCameraValue(
      previousState.parallaxPx,
      targetState.parallaxPx,
      deltaSeconds,
    ),
    cameraYaw: dampCameraValue(
      previousState.cameraYaw,
      targetState.cameraYaw,
      deltaSeconds,
    ),
    cameraPitch: dampCameraValue(
      previousState.cameraPitch,
      targetState.cameraPitch,
      deltaSeconds,
    ),
    steeringIntensity: dampCameraValue(
      previousState.steeringIntensity,
      targetState.steeringIntensity,
      deltaSeconds,
    ),
    roadAlignmentDeg: dampCameraValue(
      previousState.roadAlignmentDeg,
      targetState.roadAlignmentDeg,
      deltaSeconds,
    ),
    speedIntensity: dampCameraValue(
      previousState.speedIntensity,
      targetState.speedIntensity,
      deltaSeconds,
    ),
  };
}
