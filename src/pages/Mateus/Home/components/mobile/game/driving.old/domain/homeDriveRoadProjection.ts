export type HomeDriveRoadProjectionInput = Readonly<{
  distanceMeters: number;
  maxDistanceMeters?: number;
  minBottomPct?: number;
  maxBottomPct?: number;
  minScale?: number;
  maxScale?: number;
}>;

export type HomeDriveRoadProjection = Readonly<{
  rawProgress: number;
  progress: number;
  depth: number;
  scale: number;
  opacity: number;
  bottomPct: number;
  widthPct: number;
  blurPx: number;
  zIndex: number;
}>;

const DEFAULT_MAX_DISTANCE_METERS = 460;

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

function lerp(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}

function smoothstep(progress: number): number {
  const value = clampNumber(progress, 0, 1);

  return value * value * (3 - 2 * value);
}

/*
  0 = longe
  1 = perto
*/
export function getHomeDriveRoadDepthProgress(
  distanceMeters: number,
  maxDistanceMeters = DEFAULT_MAX_DISTANCE_METERS,
): number {
  const safeMaxDistance = Math.max(1, maxDistanceMeters);
  const normalizedDistance = clampNumber(distanceMeters / safeMaxDistance, 0, 1);

  return 1 - normalizedDistance;
}

export function projectHomeDriveRoadDepth({
  distanceMeters,
  maxDistanceMeters = DEFAULT_MAX_DISTANCE_METERS,
  minBottomPct = 36,
  maxBottomPct = 72,
  minScale = 0.34,
  maxScale = 1.14,
}: HomeDriveRoadProjectionInput): HomeDriveRoadProjection {
  const rawProgress = getHomeDriveRoadDepthProgress(
    distanceMeters,
    maxDistanceMeters,
  );
  const progress = smoothstep(rawProgress);
  const depth = 1 - progress;

  return {
    rawProgress,
    progress,
    depth,
    scale: lerp(minScale, maxScale, progress),
    opacity: lerp(0.18, 0.88, progress),
    bottomPct: lerp(minBottomPct, maxBottomPct, progress),
    widthPct: lerp(9, 34, progress),
    blurPx: lerp(1.4, 0, progress),
    zIndex: Math.round(2 + progress * 8),
  };
}

export function projectHomeDriveSideRoadHorizontalPct(
  side: "left" | "right",
  progress: number,
  steering: number,
  laneOffset: number,
): number {
  const safeProgress = clampNumber(progress, 0, 1);
  const sideDirection = side === "left" ? -1 : 1;

  /*
    Quanto mais perto, mais a rua lateral abre para as bordas.
    Steering/laneOffset adicionam sensação de câmera.
  */
  const base = side === "left"
    ? lerp(37, 18, safeProgress)
    : lerp(63, 82, safeProgress);

  const steeringDrift = clampNumber(steering, -1, 1) * -4.8;
  const laneDrift = clampNumber(laneOffset, -1, 1) * -3.2;

  return clampNumber(base + steeringDrift + laneDrift * sideDirection, 3, 97);
}

export function projectHomeDriveRoadSkewDeg(
  side: "left" | "right",
  progress: number,
  steering: number,
): number {
  const sideDirection = side === "left" ? -1 : 1;
  const safeProgress = clampNumber(progress, 0, 1);
  const steeringInfluence = clampNumber(steering, -1, 1) * 4;

  return sideDirection * lerp(11, 24, safeProgress) + steeringInfluence;
}
