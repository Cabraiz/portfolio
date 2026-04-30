// src/pages/Mateus/Home/components/mobile/game/driving/view/compass/homeDriveCompass.tokens.ts

export type HomeDriveCompassCardinalMode =
  | "legacy"
  | "ptBR"
  | "international";

export type HomeDriveCompassMarkSize = "minor" | "medium" | "major";

export type HomeDriveCompassCardinalEntry = readonly [
  degrees: number,
  label: string,
];

export const HOME_DRIVE_COMPASS_TOKENS = Object.freeze({
  /**
   * Mantém a bússola mais aberta para aparecerem vários pontos cardeais
   * ao mesmo tempo, como no componente original.
   */
  visibleDegrees: 186,

  /**
   * Escala horizontal usada para transformar graus em pixels.
   */
  pixelsPerDegree: 1.08,

  /**
   * Intervalo base entre marcações.
   * 15° gera 24 marcações no círculo completo.
   */
  markIntervalDegrees: 15,

  /**
   * Marcações de 45° recebem peso visual intermediário.
   */
  mediumEveryDegrees: 45,

  /**
   * Cardeais principais.
   */
  majorEveryDegrees: 90,

  /**
   * Opacidade mínima nas bordas da faixa visível.
   */
  minMarkOpacity: 0.18,

  /**
   * Quanto a opacidade cai conforme a marca se afasta do centro.
   */
  edgeOpacityFalloff: 0.72,

  /**
   * Pequena compressão visual para o centro parecer mais editorial/HUD.
   * Mantido neutro por padrão para não distorcer a leitura.
   */
  centerCompression: 1,
} as const);

/**
 * Preserva o padrão atual do projeto:
 * N W S O
 *
 * ptBR correto geograficamente:
 * N L S O
 *
 * international:
 * N E S W
 */
export const HOME_DRIVE_COMPASS_CARDINAL_LABELS = Object.freeze({
  legacy: [
    [0, "N"],
    [90, "W"],
    [180, "S"],
    [270, "O"],
  ] satisfies readonly HomeDriveCompassCardinalEntry[],

  ptBR: [
    [0, "N"],
    [90, "L"],
    [180, "S"],
    [270, "O"],
  ] satisfies readonly HomeDriveCompassCardinalEntry[],

  international: [
    [0, "N"],
    [90, "E"],
    [180, "S"],
    [270, "W"],
  ] satisfies readonly HomeDriveCompassCardinalEntry[],
} as const);

export const HOME_DRIVE_COMPASS_DEFAULT_CARDINAL_MODE: HomeDriveCompassCardinalMode =
  "ptBR";

export const HOME_DRIVE_COMPASS_MARK_EMPHASIS: Record<
  HomeDriveCompassMarkSize,
  number
> = Object.freeze({
  minor: 0.36,
  medium: 0.66,
  major: 1,
});
