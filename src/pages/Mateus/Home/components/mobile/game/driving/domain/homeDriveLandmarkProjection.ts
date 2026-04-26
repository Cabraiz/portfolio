export type HomeDriveLandmarkProjectionInput = Readonly<{
  /*
    Distância atual até o landmark.

    0 = chegou
    maxDistanceMeters = muito longe
  */
  distanceMeters: number;

  /*
    Distância máxima usada para projetar escala/opacidade.
    Exemplo: 420m.
  */
  maxDistanceMeters?: number;
}>;

export type HomeDriveLandmarkProjection = Readonly<{
  progress: number;
  scale: number;
  opacity: number;
  translateY: number;
  blur: number;
  zIndex: number;
}>;

const DEFAULT_MAX_DISTANCE_METERS = 420;

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

function lerp(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}

/*
  Suaviza a aproximação.

  Sem isso, o pin cresce de forma muito linear/artificial.
  Com smoothstep:
  - longe muda pouco;
  - perto ganha presença de forma mais natural.
*/
function smoothstep(progress: number): number {
  const value = clampNumber(progress, 0, 1);

  return value * value * (3 - 2 * value);
}

/*
  0 = longe
  1 = perto
*/
export function getHomeDriveLandmarkDistanceProgress({
  distanceMeters,
  maxDistanceMeters = DEFAULT_MAX_DISTANCE_METERS,
}: HomeDriveLandmarkProjectionInput): number {
  const safeMaxDistance = Math.max(1, maxDistanceMeters);
  const normalizedDistance = clampNumber(distanceMeters / safeMaxDistance, 0, 1);

  return 1 - normalizedDistance;
}

export function projectHomeDriveLandmark(
  input: HomeDriveLandmarkProjectionInput,
): HomeDriveLandmarkProjection {
  const rawProgress = getHomeDriveLandmarkDistanceProgress(input);
  const progress = smoothstep(rawProgress);

  /*
    Longe:
    - menor
    - mais transparente
    - levemente alto
    - leve blur

    Perto:
    - maior
    - mais opaco
    - mais baixo/frontal
    - sem blur
  */
  return {
    progress,
    scale: lerp(0.34, 1.16, progress),
    opacity: lerp(0.38, 1, progress),
    translateY: lerp(-32, 18, progress),
    blur: lerp(1.2, 0, progress),
    zIndex: Math.round(10 + progress * 40),
  };
}
