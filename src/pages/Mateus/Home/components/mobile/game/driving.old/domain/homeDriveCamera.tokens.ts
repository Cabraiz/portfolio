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
      O cockpit escala pela largura, não pela altura.
      Isso evita zoom diferente entre celulares altos, baixos,
      com barra de navegador ou com navegação Android por botões.
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
    /*
      Tamanho responsivo do velocímetro.

      sizeWidthRatio é a referência principal.
      sizeHeightRatio fica como limite auxiliar para não ficar
      grande demais em aparelhos muito baixos.
    */
    sizeWidthRatio: number;
    sizeHeightRatio: number;
    minSizePx: number;
    maxSizePx: number;

    /*
      Horizontal.

      Maior = mais para a esquerda.
      Menor = mais para a direita.
    */
    leftShiftWidthRatio: number;
    leftShiftMinPx: number;
    leftShiftMaxPx: number;

    /*
      Vertical ancorado no cockpit.

      O velocímetro pertence visualmente ao dashboard/cockpit,
      então ele deve seguir a geometria do cockpit, não apenas
      viewportHeight.

      cockpitAnchorRatio maior = mais para cima.
      cockpitAnchorRatio menor = mais para baixo.
    */
    cockpitAnchorRatio: number;
    cockpitAnchorOffsetPx: number;
    cockpitAnchorMinPx: number;
    cockpitAnchorMaxPx: number;

    /*
      Safe area inferior.

      Só impede colisão com barra inferior/botões do sistema.
    */
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
      Mantido como você calibrou, porque o cockpit está correto.
    */
    widthMultiplier: 5.5,
    widthMultiplierNarrowBonus: 0.04,
    widthMultiplierTallBonus: 0.06,
    widthMultiplierShortPenalty: 0.08,

    minWidthPx: 840,
    maxWidthPx: 3000,

    /*
      Menos negativo = cockpit sobe.
      Mais negativo = cockpit desce.

      O hook transforma esse valor em bottom negativo.
    */
    bottomRatio: 0.18,
    bottomMinPx: 48,
    bottomMaxPx: 500,
    bottomShortLiftPx: 16,
    bottomTallDropPx: 8,
    bottomSystemInsetLiftRatio: 0.45,
    bottomSystemInsetLiftMaxPx: 26,
  },

  steering: {
    widthMultiplier: 1.67,
    minWidthPx: 576,
    maxWidthPx: 692,

    bottomHeightRatio: 0.225,
    bottomMinPx: 150,
    bottomMaxPx: 205,
    bottomShortDropPx: 10,
    bottomSystemInsetDropRatio: 0.25,
    bottomSystemInsetDropMaxPx: 18,
  },

  speedometer: {
    /*
      Tamanho.
    */
    sizeWidthRatio: 0.225,
    sizeHeightRatio: 0.124,
    minSizePx: 74,
    maxSizePx: 100,

    /*
      Horizontal.
    */
    leftShiftWidthRatio: 0.105,
    leftShiftMinPx: 26,
    leftShiftMaxPx: 50,

    /*
      Vertical.

      Agora o velocímetro acompanha o cockpit.

      Se precisar subir em todos:
      cockpitAnchorRatio: 0.425

      Se precisar descer em todos:
      cockpitAnchorRatio: 0.405

      Para ajuste fino sem mexer na escala:
      cockpitAnchorOffsetPx: 4 sobe
      cockpitAnchorOffsetPx: -4 desce
    */
    cockpitAnchorRatio: 0.415,
    cockpitAnchorOffsetPx: 3,
    cockpitAnchorMinPx: 84,
    cockpitAnchorMaxPx: 160,

    /*
      Safe area.
    */
    bottomSafeOffsetPx: 44,
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

export function getViewportKind(
  width: number,
  height: number,
): HomeDriveViewportKind {
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
