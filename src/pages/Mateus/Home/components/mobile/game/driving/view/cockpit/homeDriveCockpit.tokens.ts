// src/pages/Mateus/Home/components/mobile/game/driving/view/cockpit/homeDriveCockpit.tokens.ts

export type HomeDriveCockpitCssVariableMap = Partial<
  Record<HomeDriveCockpitCssVarName, string>
>;

export type HomeDriveCockpitCssVariableOptions = Readonly<{
  steering?: number;
  bobRatio?: number;
}>;

export const HOME_DRIVE_COCKPIT_LAYOUT_TOKENS = Object.freeze({
  /**
   * Unidade visual base.
   *
   * No CSS, isso continua vindo de:
   * min(var(--home-drive-vw), var(--home-drive-vh))
   *
   * Assim o layout escala pelo menor lado útil da tela, mantendo a proporção
   * visual mais parecida entre celulares diferentes.
   */
  cockpitUnitCssVar: "--home-drive-cockpit-unit",

  /**
   * Cockpit principal.
   *
   * Para aumentar/diminuir a cabine, mexa principalmente em:
   * - cockpitScale
   * - cockpitMinWidthPx
   * - cockpitMaxWidthPx
   */
cockpitScale: 4.2,
cockpitMinWidthPx: 840,
cockpitMaxWidthPx: 2100,

    cockpitBottomRatio: -0.35,

  /**
   * Deslocamento horizontal fixo da cabine.
   *
   * positivo = move para direita
   * negativo = move para esquerda
   *
   * Ajuste fino:
   * 12 = pouco
   * 24 = moderado
   * 40 = bastante
   */
  cockpitOffsetXPx: 10,

  /**
   * Proporção da arte do cockpit.
   * Mude apenas se a imagem cockpit.png não for 16:9.
   */
  cockpitAspectRatio: "16 / 9",

  /**
   * Inclinação lateral visual do cockpit quando esterça.
   * Não altera física. Só dá sensação de cabine reagindo ao volante.
   */
  cockpitLeanMaxPx: 7,

  /**
   * Bob vertical opcional da cabine.
   * Mantido zerado para o cockpit não ficar tremendo.
   */
  cockpitBobMaxPx: 0,

  /**
   * Camadas visuais leves sobre o cockpit.
   */
  cockpitShadeOpacity: 0.38,
  cockpitGlassOpacity: 0.14,

  /**
   * Volante.
   *
   * Para ajustar o volante, mexa principalmente em:
   * - steeringWheelScale
   * - steeringWheelBottomRatio
   * - steeringWheelMinPx
   * - steeringWheelMaxPx
   */
    steeringWheelScale: 1.35,
    steeringWheelMinPx: 310,
    steeringWheelMaxPx: 560,

    steeringWheelBottomRatio: -0.5,

  /**
   * Área invisível de toque ao redor do volante.
   * 0.2 = 20% para fora do tamanho visual.
   */
  steeringWheelTouchInsetRatio: 0.2,

  /**
   * Transição visual do retorno/rotação do volante.
   */
  steeringWheelTransitionMs: 120,

  /**
   * Sombra do volante.
   */
  steeringWheelShadowOpacity: 0.38,
} as const);

export const HOME_DRIVE_COCKPIT_CSS_VARS = Object.freeze({
  unit: "--home-drive-cockpit-unit",

  cockpitScale: "--home-drive-cockpit-scale",
  cockpitBottomRatio: "--home-drive-cockpit-bottom-ratio",
  cockpitMinWidthPx: "--home-drive-cockpit-min-width-px",
  cockpitMaxWidthPx: "--home-drive-cockpit-max-width-px",
  cockpitOffsetX: "--home-drive-cockpit-offset-x",
  cockpitLeanOffset: "--home-drive-cockpit-lean-offset",
  cockpitBobOffset: "--home-drive-cockpit-bob-offset",
  cockpitShadeOpacity: "--home-drive-cockpit-shade-opacity",
  cockpitGlassOpacity: "--home-drive-cockpit-glass-opacity",

  steeringWheelScale: "--home-drive-steering-wheel-scale",
  steeringWheelBottomRatio: "--home-drive-steering-wheel-bottom-ratio",
  steeringWheelMinPx: "--home-drive-steering-wheel-min-px",
  steeringWheelMaxPx: "--home-drive-steering-wheel-max-px",
  steeringWheelTouchInsetRatio: "--home-drive-steering-wheel-touch-inset-ratio",
  steeringWheelTransitionMs: "--home-drive-steering-wheel-transition-ms",
  steeringWheelShadowOpacity: "--home-drive-steering-wheel-shadow-opacity",
} as const);

export type HomeDriveCockpitCssVarName =
  (typeof HOME_DRIVE_COCKPIT_CSS_VARS)[keyof typeof HOME_DRIVE_COCKPIT_CSS_VARS];

function clampHomeDriveCockpitNumber(
  value: number,
  min: number,
  max: number,
): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(max, Math.max(min, value));
}

function formatHomeDriveCockpitCssNumber(value: number, decimals = 4): string {
  if (!Number.isFinite(value)) {
    return "0";
  }

  const factor = 10 ** Math.max(0, Math.floor(decimals));
  const rounded = Math.round((value + Number.EPSILON) * factor) / factor;

  return Object.is(rounded, -0) ? "0" : String(rounded);
}

export function buildHomeDriveCockpitCssVariables({
  steering = 0,
  bobRatio = 0,
}: HomeDriveCockpitCssVariableOptions = {}): HomeDriveCockpitCssVariableMap {
  const tokens = HOME_DRIVE_COCKPIT_LAYOUT_TOKENS;
  const vars = HOME_DRIVE_COCKPIT_CSS_VARS;

  const safeSteering = clampHomeDriveCockpitNumber(steering, -1, 1);
  const safeBobRatio = clampHomeDriveCockpitNumber(bobRatio, -1, 1);

  return {
    [vars.cockpitScale]: formatHomeDriveCockpitCssNumber(tokens.cockpitScale),
    [vars.cockpitBottomRatio]: formatHomeDriveCockpitCssNumber(
      tokens.cockpitBottomRatio,
    ),
    [vars.cockpitMinWidthPx]: String(tokens.cockpitMinWidthPx),
    [vars.cockpitMaxWidthPx]: String(tokens.cockpitMaxWidthPx),
    [vars.cockpitOffsetX]: `${formatHomeDriveCockpitCssNumber(
      tokens.cockpitOffsetXPx,
    )}px`,
    [vars.cockpitLeanOffset]: `${formatHomeDriveCockpitCssNumber(
      safeSteering * tokens.cockpitLeanMaxPx,
    )}px`,
    [vars.cockpitBobOffset]: `${formatHomeDriveCockpitCssNumber(
      safeBobRatio * tokens.cockpitBobMaxPx,
    )}px`,
    [vars.cockpitShadeOpacity]: formatHomeDriveCockpitCssNumber(
      tokens.cockpitShadeOpacity,
    ),
    [vars.cockpitGlassOpacity]: formatHomeDriveCockpitCssNumber(
      tokens.cockpitGlassOpacity,
    ),

    [vars.steeringWheelScale]: formatHomeDriveCockpitCssNumber(
      tokens.steeringWheelScale,
    ),
    [vars.steeringWheelBottomRatio]: formatHomeDriveCockpitCssNumber(
      tokens.steeringWheelBottomRatio,
    ),
    [vars.steeringWheelMinPx]: String(tokens.steeringWheelMinPx),
    [vars.steeringWheelMaxPx]: String(tokens.steeringWheelMaxPx),
    [vars.steeringWheelTouchInsetRatio]: formatHomeDriveCockpitCssNumber(
      tokens.steeringWheelTouchInsetRatio,
    ),
    [vars.steeringWheelTransitionMs]: String(tokens.steeringWheelTransitionMs),
    [vars.steeringWheelShadowOpacity]: formatHomeDriveCockpitCssNumber(
      tokens.steeringWheelShadowOpacity,
    ),
  };
}
