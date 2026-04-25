export type HomeDriveViewportKind =
  | "narrow-short"
  | "narrow"
  | "short"
  | "tall"
  | "normal";

export type HomeDriveCameraNumberRange = Readonly<{
  min: number;
  max: number;
}>;

export type HomeDriveCameraTokens = Readonly<{
  design: Readonly<{
    width: number;
    height: number;
  }>;

  thresholds: Readonly<{
    narrowWidth: number;
    compactWidth: number;
    shortHeight: number;
    veryShortHeight: number;
    tallHeight: number;
    reducedVisualViewportPx: number;
    systemBottomInsetPx: number;
  }>;

  bottomSafeZone: Readonly<{
    minPx: number;
    basePx: number;
    maxPx: number;
    extraWhenShortPx: number;
  }>;

  cockpit: Readonly<{
    aspectRatio: number;

    /*
      O cockpit deve escalar pela largura, não pela altura.
      Essa é a correção principal para evitar zoom-in/zoom-out
      diferente entre celulares.
    */
    widthMultiplier: number;
    widthMultiplierNarrowBonus: number;
    widthMultiplierTallBonus: number;
    widthMultiplierShortPenalty: number;

    minWidthPx: number;
    maxWidthPx: number;

    bottomRatio: number;
    bottomMinPx: number;
    bottomMaxPx: number;
    bottomShortLiftPx: number;
    bottomTallDropPx: number;
    bottomSystemInsetLiftRatio: number;
    bottomSystemInsetLiftMaxPx: number;
  }>;

  steering: Readonly<{
    widthMultiplier: number;
    minWidthPx: number;
    maxWidthPx: number;

    bottomHeightRatio: number;
    bottomMinPx: number;
    bottomMaxPx: number;
    bottomShortDropPx: number;
    bottomSystemInsetDropRatio: number;
    bottomSystemInsetDropMaxPx: number;
  }>;

  speedometer: Readonly<{
    sizeWidthRatio: number;
    sizeHeightRatio: number;
    minSizePx: number;
    maxSizePx: number;

    leftShiftWidthRatio: number;
    leftShiftMinPx: number;
    leftShiftMaxPx: number;

    bottomHeightRatio: number;
    bottomMinPx: number;
    bottomMaxPx: number;
    bottomSafeOffsetPx: number;
  }>;
}>;

export const HOME_DRIVE_CAMERA_DEBUG_STORAGE_KEY = "homeDriveDebug";

export const HOME_DRIVE_CAMERA_TOKENS: HomeDriveCameraTokens = {
  design: {
    width: 390,
    height: 844,
  },

  thresholds: {
    narrowWidth: 360,
    compactWidth: 390,
    shortHeight: 700,
    veryShortHeight: 640,
    tallHeight: 860,
    reducedVisualViewportPx: 34,
    systemBottomInsetPx: 20,
  },

  bottomSafeZone: {
    minPx: 14,
    basePx: 18,
    maxPx: 92,
    extraWhenShortPx: -4,
  },

  cockpit: {
    aspectRatio: 16 / 9,

    /*
      2.48 significa: viewport de 390px gera cockpit perto de 967px.
      Isso mantém o enquadramento estável sem depender da altura.
    */
    widthMultiplier: 2.48,
    widthMultiplierNarrowBonus: 0.04,
    widthMultiplierTallBonus: 0.06,
    widthMultiplierShortPenalty: 0.08,

    minWidthPx: 840,
    maxWidthPx: 1120,

    /*
      bottom em px negativo.
      Menos negativo = cockpit sobe.
      Mais negativo = cockpit desce.
    */
    bottomRatio: 0.074,
    bottomMinPx: 48,
    bottomMaxPx: 90,
    bottomShortLiftPx: 16,
    bottomTallDropPx: 8,
    bottomSystemInsetLiftRatio: 0.45,
    bottomSystemInsetLiftMaxPx: 26,
  },

  steering: {
    widthMultiplier: 1.67,
    minWidthPx: 576,
    maxWidthPx: 692,

    /*
      Mantém compatibilidade visual com o antigo bottom em %,
      mas agora convertido para px pela câmera.
    */
    bottomHeightRatio: 0.225,
    bottomMinPx: 150,
    bottomMaxPx: 205,
    bottomShortDropPx: 10,
    bottomSystemInsetDropRatio: 0.25,
    bottomSystemInsetDropMaxPx: 18,
  },

  speedometer: {
    sizeWidthRatio: 0.245,
    sizeHeightRatio: 0.138,
    minSizePx: 84,
    maxSizePx: 112,

    /*
      Menor shift = velocímetro mais para a direita.
      Maior shift = velocímetro mais para a esquerda.
    */
    leftShiftWidthRatio: 0.09,
    leftShiftMinPx: 26,
    leftShiftMaxPx: 50,

    bottomHeightRatio: 0.18,
    bottomMinPx: 112,
    bottomMaxPx: 150,
    bottomSafeOffsetPx: 78,
  },
} as const;

export function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

export function roundNumber(value: number, precision = 2): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

export function roundPixel(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.round(value);
}

export function toPx(value: number): string {
  return `${roundPixel(value)}px`;
}

export function getViewportKind(width: number, height: number): HomeDriveViewportKind {
  const { thresholds } = HOME_DRIVE_CAMERA_TOKENS;
  const isNarrow = width <= thresholds.narrowWidth;
  const isShort = height <= thresholds.shortHeight;
  const isTall = height >= thresholds.tallHeight;

  if (isNarrow && isShort) {
    return "narrow-short";
  }

  if (isNarrow) {
    return "narrow";
  }

  if (isShort) {
    return "short";
  }

  if (isTall) {
    return "tall";
  }

  return "normal";
}
