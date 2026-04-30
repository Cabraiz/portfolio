// src/pages/Mateus/Home/components/mobile/game/driving/view/cockpit/homeDriveCockpit.tokens.ts

export type HomeDriveCockpitCssVariableMap = Partial<
  Record<HomeDriveCockpitCssVarName, string>
>;

export type HomeDriveCockpitCssVariableOptions = Readonly<{
  steering?: number;
  bobRatio?: number;
}>;

export const HOME_DRIVE_COCKPIT_LAYOUT_TOKENS = Object.freeze({
  cockpitUnitCssVar: "--home-drive-cockpit-unit",

  cockpitScale: 5.15,
  cockpitMinWidthPx: 1020,
  cockpitMaxWidthPx: 2700,
  cockpitBottomRatio: -0.45,
  cockpitOffsetXPx: 10,
  cockpitAspectRatio: "16 / 9",
  cockpitLeanMaxPx: 7,
  cockpitBobMaxPx: 0,
  cockpitShadeOpacity: 0.38,
  cockpitGlassOpacity: 0.14,

  /**
   * Velocímetro.
   *
   * Usa tamanho proporcional ao frame projetado do cockpit.
   * Deve ficar abaixo do volante.
   */
  speedometerSizeRatio: 0.055,
  speedometerMinPx: 76,
  speedometerMaxPx: 146,
  speedometerAnchorXRatio: 0.005,
  speedometerAnchorYRatio: 0.295,
  speedometerOffsetXPx: -5,
  speedometerOffsetYPx: 5,
  speedometerNeedleTransitionMs: 90,
  speedometerOpacity: 1,
  speedometerZIndex: 120,

  /**
   * Volante.
   *
   * steeringWheelZIndex precisa ser maior que speedometerZIndex
   * para o volante aparecer por cima do velocímetro.
   */
  steeringWheelScale: 1.2,
  steeringWheelMinPx: 310,
  steeringWheelMaxPx: 560,
  steeringWheelBottomRatio: -0.43,
  steeringWheelOffsetXPx: 10,
  steeringWheelZIndex: 170,
  steeringWheelTouchInsetRatio: 0.2,
  steeringWheelTransitionMs: 120,
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

  speedometerSizeRatio: "--home-drive-speedometer-size-ratio",
  speedometerMinPx: "--home-drive-speedometer-min-px",
  speedometerMaxPx: "--home-drive-speedometer-max-px",
  speedometerAnchorXRatio: "--home-drive-speedometer-anchor-x-ratio",
  speedometerAnchorYRatio: "--home-drive-speedometer-anchor-y-ratio",
  speedometerOffsetX: "--home-drive-speedometer-offset-x",
  speedometerOffsetY: "--home-drive-speedometer-offset-y",
  speedometerNeedleTransitionMs:
    "--home-drive-speedometer-needle-transition-ms",
  speedometerOpacity: "--home-drive-speedometer-opacity",
  speedometerZIndex: "--home-drive-speedometer-z-index",

  steeringWheelScale: "--home-drive-steering-wheel-scale",
  steeringWheelBottomRatio: "--home-drive-steering-wheel-bottom-ratio",
  steeringWheelOffsetX: "--home-drive-steering-wheel-offset-x",
  steeringWheelZIndex: "--home-drive-steering-wheel-z-index",
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

function formatHomeDriveCockpitCssPx(value: number): string {
  return `${formatHomeDriveCockpitCssNumber(value)}px`;
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
    [vars.unit]:
      "min(var(--home-drive-vw, 100vw), var(--home-drive-vh, 100vh))",

    [vars.cockpitScale]: formatHomeDriveCockpitCssNumber(tokens.cockpitScale),
    [vars.cockpitBottomRatio]: formatHomeDriveCockpitCssNumber(
      tokens.cockpitBottomRatio,
    ),
    [vars.cockpitMinWidthPx]: String(tokens.cockpitMinWidthPx),
    [vars.cockpitMaxWidthPx]: String(tokens.cockpitMaxWidthPx),
    [vars.cockpitOffsetX]: formatHomeDriveCockpitCssPx(
      tokens.cockpitOffsetXPx,
    ),
    [vars.cockpitLeanOffset]: formatHomeDriveCockpitCssPx(
      safeSteering * tokens.cockpitLeanMaxPx,
    ),
    [vars.cockpitBobOffset]: formatHomeDriveCockpitCssPx(
      safeBobRatio * tokens.cockpitBobMaxPx,
    ),
    [vars.cockpitShadeOpacity]: formatHomeDriveCockpitCssNumber(
      tokens.cockpitShadeOpacity,
    ),
    [vars.cockpitGlassOpacity]: formatHomeDriveCockpitCssNumber(
      tokens.cockpitGlassOpacity,
    ),

    [vars.speedometerSizeRatio]: formatHomeDriveCockpitCssNumber(
      tokens.speedometerSizeRatio,
    ),
    [vars.speedometerMinPx]: String(tokens.speedometerMinPx),
    [vars.speedometerMaxPx]: String(tokens.speedometerMaxPx),
    [vars.speedometerAnchorXRatio]: formatHomeDriveCockpitCssNumber(
      tokens.speedometerAnchorXRatio,
    ),
    [vars.speedometerAnchorYRatio]: formatHomeDriveCockpitCssNumber(
      tokens.speedometerAnchorYRatio,
    ),
    [vars.speedometerOffsetX]: formatHomeDriveCockpitCssPx(
      tokens.speedometerOffsetXPx,
    ),
    [vars.speedometerOffsetY]: formatHomeDriveCockpitCssPx(
      tokens.speedometerOffsetYPx,
    ),
    [vars.speedometerNeedleTransitionMs]: String(
      tokens.speedometerNeedleTransitionMs,
    ),
    [vars.speedometerOpacity]: formatHomeDriveCockpitCssNumber(
      tokens.speedometerOpacity,
    ),
    [vars.speedometerZIndex]: String(tokens.speedometerZIndex),

    [vars.steeringWheelScale]: formatHomeDriveCockpitCssNumber(
      tokens.steeringWheelScale,
    ),
    [vars.steeringWheelBottomRatio]: formatHomeDriveCockpitCssNumber(
      tokens.steeringWheelBottomRatio,
    ),
    [vars.steeringWheelOffsetX]: formatHomeDriveCockpitCssPx(
      tokens.steeringWheelOffsetXPx,
    ),
    [vars.steeringWheelZIndex]: String(tokens.steeringWheelZIndex),
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
