import {
  HOME_DRIVE_CENTER_MARKER_CYCLE_PX,
  HOME_DRIVE_DEFAULT_CURRENT_LANDMARK_LABEL,
  HOME_DRIVE_DEFAULT_DISTRICT_LABEL,
  HOME_DRIVE_HIGH_SPEED_THRESHOLD_KMH,
  HOME_DRIVE_LANDMARK_VISIBLE_AHEAD_METERS,
  HOME_DRIVE_LANDMARK_VISIBLE_BEHIND_METERS,
  HOME_DRIVE_LANDMARK_WRAP_THRESHOLD_METERS,
  HOME_DRIVE_LANE_OFFSET_LIMIT,
  HOME_DRIVE_MAX_SPEED_KMH,
  HOME_DRIVE_MAX_STEER,
  HOME_DRIVE_MIN_SPEED_KMH,
  HOME_DRIVE_ROUTE_LENGTH_METERS,
  HOME_DRIVE_SKYLINE_BARS,
  HOME_DRIVE_STEER_EASING_HIGH_SPEED,
  HOME_DRIVE_STEER_EASING_LOW_SPEED,
} from "./homeDrive.constants";
import type {
  HomeDriveLandmark,
  HomeDriveRuntimeState,
  HomeDriveSkylineBar,
  HomeDriveVisibleLandmark,
} from "./homeDrive.types";

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function lerp(current: number, target: number, amount: number): number {
  return current + (target - current) * amount;
}

export function toMetersPerSecond(speedKmh: number): number {
  return speedKmh / 3.6;
}

export function normalizeSpeedKmh(speedKmh: number): number {
  return clamp(speedKmh, HOME_DRIVE_MIN_SPEED_KMH, HOME_DRIVE_MAX_SPEED_KMH);
}

export function normalizeSteer(value: number): number {
  return clamp(value, -HOME_DRIVE_MAX_STEER, HOME_DRIVE_MAX_STEER);
}

export function normalizeLaneOffset(value: number): number {
  return clamp(value, -HOME_DRIVE_LANE_OFFSET_LIMIT, HOME_DRIVE_LANE_OFFSET_LIMIT);
}

export function getSteerEasing(speedKmh: number): number {
  return speedKmh > HOME_DRIVE_HIGH_SPEED_THRESHOLD_KMH
    ? HOME_DRIVE_STEER_EASING_HIGH_SPEED
    : HOME_DRIVE_STEER_EASING_LOW_SPEED;
}

export function getGearLabel(speedKmh: number): string {
  if (speedKmh < 4) return "N";
  if (speedKmh < 18) return "1";
  if (speedKmh < 34) return "2";
  if (speedKmh < 50) return "3";
  if (speedKmh < 68) return "4";
  return "5";
}

export function getDistrictLabel(
  progressMeters: number,
  landmarks: readonly HomeDriveLandmark[],
): string {
  const landmark = [...landmarks]
    .reverse()
    .find((item) => progressMeters >= item.atMeter);

  return landmark?.district ?? HOME_DRIVE_DEFAULT_DISTRICT_LABEL;
}

export function getCurrentLandmark(
  progressMeters: number,
  landmarks: readonly HomeDriveLandmark[],
): HomeDriveLandmark | undefined {
  return [...landmarks]
    .reverse()
    .find((item) => progressMeters >= item.atMeter);
}

export function getNextLandmark(
  progressMeters: number,
  landmarks: readonly HomeDriveLandmark[],
): HomeDriveLandmark | undefined {
  return landmarks.find((item) => item.atMeter > progressMeters);
}

export function getCurrentLandmarkLabel(
  progressMeters: number,
  landmarks: readonly HomeDriveLandmark[],
): string {
  return (
    getCurrentLandmark(progressMeters, landmarks)?.label ??
    HOME_DRIVE_DEFAULT_CURRENT_LANDMARK_LABEL
  );
}

export function getWrappedProgressMeters(
  traveledMeters: number,
  routeLengthMeters = HOME_DRIVE_ROUTE_LENGTH_METERS,
): number {
  if (traveledMeters < 0) {
    return (
      ((traveledMeters % routeLengthMeters) + routeLengthMeters) %
      routeLengthMeters
    );
  }

  if (traveledMeters >= routeLengthMeters) {
    return traveledMeters % routeLengthMeters;
  }

  return traveledMeters;
}

export function getRouteProgress(
  traveledMeters: number,
  routeLengthMeters = HOME_DRIVE_ROUTE_LENGTH_METERS,
): number {
  if (routeLengthMeters <= 0) {
    return 0;
  }

  return clamp(
    getWrappedProgressMeters(traveledMeters, routeLengthMeters) /
      routeLengthMeters,
    0,
    1,
  );
}

export function getLaneMarkerOffset(
  elapsedSeconds: number,
  speedKmh: number,
): number {
  return (elapsedSeconds * (1.2 + speedKmh / 28)) % 1;
}

export function getLaneMarkerTranslateY(
  elapsedSeconds: number,
  speedKmh: number,
): number {
  return (
    getLaneMarkerOffset(elapsedSeconds, speedKmh) *
    HOME_DRIVE_CENTER_MARKER_CYCLE_PX
  );
}

export function getEnvironmentShift(
  laneOffset: number,
  steering: number,
): number {
  return laneOffset * 28 + steering * 18;
}

export function getVisibleLandmarks(
  landmarks: readonly HomeDriveLandmark[],
  traveledMeters: number,
  routeLengthMeters = HOME_DRIVE_ROUTE_LENGTH_METERS,
): readonly HomeDriveVisibleLandmark[] {
  return landmarks
    .map((item) => {
      const relative = item.atMeter - traveledMeters;
      const wrappedRelative =
        relative < -HOME_DRIVE_LANDMARK_WRAP_THRESHOLD_METERS
          ? relative + routeLengthMeters
          : relative;

      return {
        ...item,
        relativeMeters: wrappedRelative,
      };
    })
    .filter(
      (item) =>
        item.relativeMeters > HOME_DRIVE_LANDMARK_VISIBLE_BEHIND_METERS &&
        item.relativeMeters < HOME_DRIVE_LANDMARK_VISIBLE_AHEAD_METERS,
    )
    .slice(0, 4);
}

export function getSkylineBars(): readonly HomeDriveSkylineBar[] {
  return HOME_DRIVE_SKYLINE_BARS;
}

export function getLandmarkScreenPlacement(
  relativeMeters: number,
  laneOffset: number,
  index: number,
): Readonly<{
  bottom: number;
  opacity: number;
  scale: number;
  horizontal: number;
  side: "left" | "right";
}> {
  const normalized = clamp(
    1 - relativeMeters / HOME_DRIVE_LANDMARK_VISIBLE_AHEAD_METERS,
    0,
    1,
  );

  const side = index % 2 === 0 ? "left" : "right";
  const scale = 0.42 + normalized * 1.15;
  const bottom = 28 + normalized * 34;
  const opacity = 0.2 + normalized * 0.8;
  const horizontalBase = side === "left" ? 16 : 84;
  const horizontal = horizontalBase - laneOffset * 7;

  return {
    bottom,
    opacity,
    scale,
    horizontal,
    side,
  };
}

export function formatDistance(meters: number): string {
  if (!Number.isFinite(meters)) {
    return "0 m";
  }

  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }

  return `${Math.round(meters)} m`;
}

export function buildRuntimeState(
  input: Readonly<{
    phase: HomeDriveRuntimeState["phase"];
    speedKmh: number;
    steering: number;
    laneOffset: number;
    traveledMeters: number;
    elapsedSeconds: number;
    landmarks: readonly HomeDriveLandmark[];
    routeLengthMeters?: number;
    throttleActive?: boolean;
  }>,
): HomeDriveRuntimeState {
  const routeLengthMeters =
    input.routeLengthMeters ?? HOME_DRIVE_ROUTE_LENGTH_METERS;

  const speedKmh = normalizeSpeedKmh(input.speedKmh);
  const steering = normalizeSteer(input.steering);
  const laneOffset = normalizeLaneOffset(input.laneOffset);
  const traveledMeters = getWrappedProgressMeters(
    input.traveledMeters,
    routeLengthMeters,
  );
  const currentLandmark = getCurrentLandmark(traveledMeters, input.landmarks);
  const nextLandmark = getNextLandmark(traveledMeters, input.landmarks);
  const routeProgress = getRouteProgress(traveledMeters, routeLengthMeters);
  const gearLabel = getGearLabel(speedKmh);

  const rpm =
    900 +
    speedKmh * 42 +
    Math.abs(steering) * 420 +
    (input.throttleActive ? 550 : 0);

  return {
    phase: input.phase,
    speedKmh,
    rpm,
    gearLabel,
    routeProgress,
    traveledMeters,
    routeLengthMeters,
    steering,
    laneOffset,
    cameraYaw: laneOffset * 9 + steering * 4,
    cameraPitch: 1.5 + speedKmh * 0.025,
    elapsedSeconds: Math.max(0, input.elapsedSeconds),
    districtLabel: getDistrictLabel(traveledMeters, input.landmarks),
    currentLandmark,
    nextLandmark,
  };
}
