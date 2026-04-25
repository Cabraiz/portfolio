import type { CSSProperties } from "react";

export type HomeDriveRoadCurveKind =
  | "straight"
  | "soft-left"
  | "soft-right"
  | "medium-left"
  | "medium-right"
  | "hard-left"
  | "hard-right"
  | "s-curve-left"
  | "s-curve-right";

export type HomeDriveRoadShoulderStyle =
  | "coast-sand"
  | "classic-rumble"
  | "urban-dark"
  | "stadium-night";

export type HomeDriveRoadCurveSegment = Readonly<{
  id: string;
  label: string;
  kind: HomeDriveRoadCurveKind;
  lengthMeters: number;

  /**
   * Curva horizontal da pista.
   * -1 = curva forte para esquerda.
   *  0 = reta.
   *  1 = curva forte para direita.
   */
  curve: number;

  /**
   * Inclinação visual lateral da pista.
   */
  bank: number;

  /**
   * Tendência base de subida/descida do trecho.
   * Positivo = subida.
   * Negativo = descida.
   */
  hill: number;

  /**
   * Intensidade do asfalto texturizado.
   */
  textureStrength: number;

  /**
   * Frequência da zebra lateral.
   */
  rumbleLengthMeters: number;

  /**
   * Frequência das faixas centrais.
   */
  laneDashLengthMeters: number;

  /**
   * Visual da lateral da pista.
   */
  shoulderStyle: HomeDriveRoadShoulderStyle;
}>;

export type HomeDriveRoadCurveSample = Readonly<{
  segment: HomeDriveRoadCurveSegment;
  previousSegment: HomeDriveRoadCurveSegment;
  nextSegment: HomeDriveRoadCurveSegment;
  segmentIndex: number;
  previousSegmentIndex: number;
  nextSegmentIndex: number;
  totalLengthMeters: number;
  loopedMeters: number;
  segmentStartMeters: number;
  segmentEndMeters: number;
  localMeters: number;
  localProgress: number;
}>;

export type HomeDriveRoadCurveState = HomeDriveRoadCurveSample &
  Readonly<{
    /**
     * Curva suavizada, pronta para o renderer.
     */
    curve: number;

    /**
     * Curva alvo do trecho atual.
     */
    targetCurve: number;

    /**
     * Inclinação lateral suavizada.
     */
    bank: number;

    /**
     * Relevo final da pista.
     * Positivo = sensação de subida.
     * Negativo = sensação de descida.
     */
    hill: number;

    /**
     * Tendência base do trecho, antes da procedural wave.
     */
    baseHill: number;

    /**
     * Onda procedural para alternar subidas e descidas.
     */
    proceduralHill: number;

    /**
     * Drift do centro da pista perto do jogador.
     */
    centerDrift: number;

    /**
     * Drift do horizonte.
     */
    horizonDrift: number;

    /**
     * Fase de textura.
     */
    texturePhase: number;

    /**
     * Fase da zebra lateral.
     */
    rumblePhase: number;

    /**
     * Fase da faixa central.
     */
    laneDashPhase: number;

    /**
     * Fator de movimento visual.
     */
    motionFactor: number;
  }>;

const MIN_SEGMENT_LENGTH_METERS = 40;

const ROAD_CURVE_LIMIT = 0.92;
const ROAD_BANK_LIMIT = 0.36;
/**
 * Reduzido para evitar aquela subida exagerada constante.
 */
const ROAD_HILL_LIMIT = 0.16;

export const HOME_DRIVE_ROAD_CURVE_SEGMENTS: readonly HomeDriveRoadCurveSegment[] =
  [
    {
      id: "beira-mar-opening-straight",
      label: "Reta costeira",
      kind: "straight",
      lengthMeters: 220,
      curve: 0,
      bank: 0,
      hill: 0.02,
      textureStrength: 0.28,
      rumbleLengthMeters: 22,
      laneDashLengthMeters: 34,
      shoulderStyle: "coast-sand",
    },
    {
      id: "beira-mar-soft-right",
      label: "Curva leve à direita",
      kind: "soft-right",
      lengthMeters: 190,
      curve: 0.28,
      bank: 0.08,
      hill: 0.03,
      textureStrength: 0.34,
      rumbleLengthMeters: 20,
      laneDashLengthMeters: 32,
      shoulderStyle: "classic-rumble",
    },
    {
      id: "aldeota-fast-straight",
      label: "Reta rápida",
      kind: "straight",
      lengthMeters: 160,
      curve: 0.04,
      bank: 0.02,
      hill: -0.02,
      textureStrength: 0.3,
      rumbleLengthMeters: 18,
      laneDashLengthMeters: 30,
      shoulderStyle: "urban-dark",
    },
    {
      id: "downtown-medium-left",
      label: "Curva média à esquerda",
      kind: "medium-left",
      lengthMeters: 240,
      curve: -0.48,
      bank: -0.16,
      hill: 0.01,
      textureStrength: 0.42,
      rumbleLengthMeters: 18,
      laneDashLengthMeters: 28,
      shoulderStyle: "classic-rumble",
    },
    {
      id: "downtown-short-straight",
      label: "Respiro urbano",
      kind: "straight",
      lengthMeters: 120,
      curve: -0.04,
      bank: -0.02,
      hill: -0.03,
      textureStrength: 0.38,
      rumbleLengthMeters: 18,
      laneDashLengthMeters: 30,
      shoulderStyle: "urban-dark",
    },
    {
      id: "academic-s-curve-right-entry",
      label: "S para direita",
      kind: "s-curve-right",
      lengthMeters: 150,
      curve: 0.54,
      bank: 0.18,
      hill: 0.02,
      textureStrength: 0.4,
      rumbleLengthMeters: 16,
      laneDashLengthMeters: 28,
      shoulderStyle: "classic-rumble",
    },
    {
      id: "academic-s-curve-left-exit",
      label: "S para esquerda",
      kind: "s-curve-left",
      lengthMeters: 150,
      curve: -0.52,
      bank: -0.17,
      hill: -0.02,
      textureStrength: 0.4,
      rumbleLengthMeters: 16,
      laneDashLengthMeters: 28,
      shoulderStyle: "classic-rumble",
    },
    {
      id: "residential-soft-left",
      label: "Curva residencial",
      kind: "soft-left",
      lengthMeters: 180,
      curve: -0.24,
      bank: -0.08,
      hill: 0.01,
      textureStrength: 0.32,
      rumbleLengthMeters: 20,
      laneDashLengthMeters: 32,
      shoulderStyle: "coast-sand",
    },
    {
      id: "stadium-hard-right",
      label: "Entrada do estádio",
      kind: "hard-right",
      lengthMeters: 210,
      curve: 0.68,
      bank: 0.24,
      hill: 0.03,
      textureStrength: 0.5,
      rumbleLengthMeters: 14,
      laneDashLengthMeters: 26,
      shoulderStyle: "stadium-night",
    },
    {
      id: "stadium-final-straight",
      label: "Reta final",
      kind: "straight",
      lengthMeters: 260,
      curve: 0,
      bank: 0,
      hill: -0.02,
      textureStrength: 0.44,
      rumbleLengthMeters: 16,
      laneDashLengthMeters: 28,
      shoulderStyle: "stadium-night",
    },
  ] as const;

export const HOME_DRIVE_ROAD_CURVE_TOTAL_LENGTH_METERS =
  HOME_DRIVE_ROAD_CURVE_SEGMENTS.reduce((total, segment) => {
    return total + Math.max(MIN_SEGMENT_LENGTH_METERS, segment.lengthMeters);
  }, 0);

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

function normalizeMeters(value: number, totalLengthMeters: number): number {
  if (!Number.isFinite(value) || totalLengthMeters <= 0) {
    return 0;
  }

  const normalized = value % totalLengthMeters;

  if (normalized < 0) {
    return normalized + totalLengthMeters;
  }

  return normalized;
}

function smoothstep(value: number): number {
  const t = clampNumber(value, 0, 1);

  return t * t * (3 - 2 * t);
}

function smootherstep(value: number): number {
  const t = clampNumber(value, 0, 1);

  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(from: number, to: number, progress: number): number {
  return from + (to - from) * clampNumber(progress, 0, 1);
}

function getCircularIndex(index: number, length: number): number {
  if (length <= 0) {
    return 0;
  }

  const normalizedIndex = index % length;

  if (normalizedIndex < 0) {
    return normalizedIndex + length;
  }

  return normalizedIndex;
}

function getSegmentLength(segment: HomeDriveRoadCurveSegment): number {
  return Math.max(MIN_SEGMENT_LENGTH_METERS, segment.lengthMeters);
}

export function getHomeDriveRoadCurveSample(
  traveledMeters: number,
  segments: readonly HomeDriveRoadCurveSegment[] = HOME_DRIVE_ROAD_CURVE_SEGMENTS,
): HomeDriveRoadCurveSample {
  const safeSegments =
    segments.length > 0 ? segments : HOME_DRIVE_ROAD_CURVE_SEGMENTS;

  const totalLengthMeters = safeSegments.reduce((total, segment) => {
    return total + getSegmentLength(segment);
  }, 0);

  const loopedMeters = normalizeMeters(traveledMeters, totalLengthMeters);

  let cursorMeters = 0;

  for (let index = 0; index < safeSegments.length; index += 1) {
    const segment = safeSegments[index];
    const segmentLength = getSegmentLength(segment);
    const segmentStartMeters = cursorMeters;
    const segmentEndMeters = cursorMeters + segmentLength;

    if (loopedMeters >= segmentStartMeters && loopedMeters < segmentEndMeters) {
      const previousSegmentIndex = getCircularIndex(index - 1, safeSegments.length);
      const nextSegmentIndex = getCircularIndex(index + 1, safeSegments.length);

      const localMeters = loopedMeters - segmentStartMeters;
      const localProgress = clampNumber(localMeters / segmentLength, 0, 1);

      return {
        segment,
        previousSegment: safeSegments[previousSegmentIndex],
        nextSegment: safeSegments[nextSegmentIndex],
        segmentIndex: index,
        previousSegmentIndex,
        nextSegmentIndex,
        totalLengthMeters,
        loopedMeters,
        segmentStartMeters,
        segmentEndMeters,
        localMeters,
        localProgress,
      };
    }

    cursorMeters = segmentEndMeters;
  }

  const lastIndex = safeSegments.length - 1;
  const previousSegmentIndex = getCircularIndex(lastIndex - 1, safeSegments.length);
  const nextSegmentIndex = 0;
  const lastSegment = safeSegments[lastIndex];
  const lastSegmentLength = getSegmentLength(lastSegment);

  return {
    segment: lastSegment,
    previousSegment: safeSegments[previousSegmentIndex],
    nextSegment: safeSegments[nextSegmentIndex],
    segmentIndex: lastIndex,
    previousSegmentIndex,
    nextSegmentIndex,
    totalLengthMeters,
    loopedMeters,
    segmentStartMeters: Math.max(0, totalLengthMeters - lastSegmentLength),
    segmentEndMeters: totalLengthMeters,
    localMeters: lastSegmentLength,
    localProgress: 1,
  };
}

function getBlendedRoadValue(
  previousValue: number,
  currentValue: number,
  nextValue: number,
  localProgress: number,
): number {
  const enterProgress = smoothstep(localProgress / 0.34);
  const exitProgress = smoothstep((localProgress - 0.66) / 0.34);

  const enteredValue = lerp(previousValue, currentValue, enterProgress);

  return lerp(enteredValue, nextValue, exitProgress * 0.42);
}

function getMotionFactor(speedKmh: number): number {
  const normalizedSpeed = clampNumber(speedKmh / 110, 0, 1.35);

  return 0.72 + normalizedSpeed * 0.88;
}

/**
 * Gera subidas e descidas suaves ao longo do percurso.
 * A ideia é não deixar a pista “travada” numa única subida alta.
 */
function getProceduralHillWave(loopedMeters: number): number {
  const longWave = Math.sin(loopedMeters / 220 + 0.8) * 0.055;
  const mediumWave = Math.sin(loopedMeters / 118 - 1.15) * 0.03;
  const slowWave = Math.cos(loopedMeters / 340 + 0.35) * 0.038;

  return clampNumber(longWave + mediumWave + slowWave, -0.11, 0.11);
}

export function getHomeDriveRoadCurveState(
  traveledMeters: number,
  speedKmh = 0,
  segments: readonly HomeDriveRoadCurveSegment[] = HOME_DRIVE_ROAD_CURVE_SEGMENTS,
): HomeDriveRoadCurveState {
  const sample = getHomeDriveRoadCurveSample(traveledMeters, segments);

  const localEase = smootherstep(sample.localProgress);

  const targetCurve = clampNumber(
    sample.segment.curve,
    -ROAD_CURVE_LIMIT,
    ROAD_CURVE_LIMIT,
  );

  const curve = clampNumber(
    getBlendedRoadValue(
      sample.previousSegment.curve,
      sample.segment.curve,
      sample.nextSegment.curve,
      sample.localProgress,
    ),
    -ROAD_CURVE_LIMIT,
    ROAD_CURVE_LIMIT,
  );

  const bank = clampNumber(
    getBlendedRoadValue(
      sample.previousSegment.bank,
      sample.segment.bank,
      sample.nextSegment.bank,
      sample.localProgress,
    ),
    -ROAD_BANK_LIMIT,
    ROAD_BANK_LIMIT,
  );

  const baseHill = clampNumber(
    getBlendedRoadValue(
      sample.previousSegment.hill,
      sample.segment.hill,
      sample.nextSegment.hill,
      sample.localProgress,
    ),
    -ROAD_HILL_LIMIT,
    ROAD_HILL_LIMIT,
  );

  const proceduralHill = getProceduralHillWave(sample.loopedMeters);

  /**
   * Mistura leve do hill do trecho com uma onda procedural.
   * Assim você ganha subidas/descidas variadas sem ficar artificial.
   */
  const hill = clampNumber(
    baseHill * 0.45 + proceduralHill,
    -ROAD_HILL_LIMIT,
    ROAD_HILL_LIMIT,
  );

  const motionFactor = getMotionFactor(speedKmh);

  const textureLengthMeters = Math.max(8, 20 - sample.segment.textureStrength * 8);
  const texturePhase =
    normalizeMeters(sample.loopedMeters * motionFactor, textureLengthMeters) /
    textureLengthMeters;

  const rumbleLengthMeters = Math.max(8, sample.segment.rumbleLengthMeters);
  const laneDashLengthMeters = Math.max(12, sample.segment.laneDashLengthMeters);

  const rumblePhase =
    normalizeMeters(sample.loopedMeters * motionFactor, rumbleLengthMeters) /
    rumbleLengthMeters;

  const laneDashPhase =
    normalizeMeters(sample.loopedMeters * motionFactor, laneDashLengthMeters) /
    laneDashLengthMeters;

  const centerDrift = clampNumber(curve * (0.105 + localEase * 0.075), -0.22, 0.22);
  const horizonDrift = clampNumber(
    curve * (0.18 + Math.abs(bank) * 0.14),
    -0.34,
    0.34,
  );

  return {
    ...sample,
    curve,
    targetCurve,
    bank,
    hill,
    baseHill,
    proceduralHill,
    centerDrift,
    horizonDrift,
    texturePhase,
    rumblePhase,
    laneDashPhase,
    motionFactor,
  };
}

export function getHomeDriveRoadCurveCssVars(
  state: HomeDriveRoadCurveState,
): Readonly<Record<`--${string}`, string | number>> {
  return {
    "--home-drive-road-curve": state.curve,
    "--home-drive-road-target-curve": state.targetCurve,
    "--home-drive-road-bank": state.bank,
    "--home-drive-road-hill": state.hill,
    "--home-drive-road-base-hill": state.baseHill,
    "--home-drive-road-procedural-hill": state.proceduralHill,
    "--home-drive-road-center-drift": state.centerDrift,
    "--home-drive-road-horizon-drift": state.horizonDrift,
    "--home-drive-road-texture-phase": state.texturePhase,
    "--home-drive-road-rumble-phase": state.rumblePhase,
    "--home-drive-road-lane-dash-phase": state.laneDashPhase,
    "--home-drive-road-motion-factor": state.motionFactor,
  };
}

export type HomeDriveRoadCurveCssVars = CSSProperties &
  Readonly<Record<`--${string}`, string | number>>;
