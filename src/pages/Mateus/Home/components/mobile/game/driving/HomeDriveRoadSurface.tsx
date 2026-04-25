import React, { useMemo, type CSSProperties } from "react";

import type { HomeDriveRouteSegment } from "./domain/homeDrive.fortalezaRoute";
import {
  getHomeDriveRoadCurveState,
  type HomeDriveRoadCurveState,
} from "./domain/homeDrive.roadCurves";
import {
  getHomeDriveRoadProfile,
  type HomeDriveRoadProfile,
} from "./domain/homeDrive.roadProfile";
import { getHomeDriveRoadTuning } from "./domain/homeDrive.roadTuning";
import type { HomeDriveRuntimeState } from "./domain/homeDrive.types";

export type HomeDriveRoadSurfaceProps = Readonly<{
  runtime: HomeDriveRuntimeState;
  routeSegment: HomeDriveRouteSegment;
  laneMarkerTranslateY?: number;
  roadCurveState?: HomeDriveRoadCurveState;
  className?: string;
}>;

type RoadTuning = ReturnType<typeof getHomeDriveRoadTuning>;

type RoadSlice = Readonly<{
  id: string;
  index: number;
  yTop: number;
  yBottom: number;
  rightTopY: number;
  rightBottomY: number;
  centerTop: number;
  centerBottom: number;
  leftTop: number;
  rightTop: number;
  leftBottom: number;
  rightBottom: number;
  leftRumbleOuterTop: number;
  leftRumbleOuterBottom: number;
  rightRumbleOuterTop: number;
  rightRumbleOuterBottom: number;
  laneLeftTop: number;
  laneRightTop: number;
  laneLeftBottom: number;
  laneRightBottom: number;
  roadFill: string;
  sideFill: string;
  sidewalkMarkFill: string;
  sidewalkMarkOpacity: number;
  rumbleFill: string;
  laneFill: string;
  roadStrokeOpacity: number;
  showLaneMark: boolean;
  showSidewalkMark: boolean;
  showTextureLine: boolean;
}>;

type ProjectedRoadShadow = Readonly<{
  centerNearX: number;
  centerFarX: number;
  nearY: number;
  farY: number;
  nearWidth: number;
  farWidth: number;
  opacity: number;
}>;

/**
 * Mais fatias = afunilamento mais suave e sensação melhor de profundidade.
 */
const ROAD_SLICE_COUNT = 96;

/**
 * Offset global da rua.
 *
 * Negativo = rua inteira para a esquerda.
 * Positivo = rua inteira para a direita.
 *
 * Mantido em -14 para preservar a posição anterior.
 */
const ROAD_GLOBAL_LEFT_OFFSET_X = -14;

/**
 * Expansão assimétrica base da pista.
 *
 * A borda esquerda NÃO muda.
 * Apenas a borda direita é puxada para a direita.
 */
const RIGHT_SIDE_ROAD_TOP_EXPANSION_X = 3.8;
const RIGHT_SIDE_ROAD_BOTTOM_EXPANSION_X = 11.5;
const RIGHT_SIDE_ROAD_EXPANSION_POWER = 1.16;

/**
 * Puxa BEM MAIS somente a região direita inferior.
 *
 * Este extra tem power alto para quase não afetar o topo
 * e aparecer com força apenas quando a pista chega perto da câmera.
 *
 * Aumente RIGHT_BOTTOM_EDGE_EXTRA_PULL_X para puxar mais.
 */
const RIGHT_BOTTOM_EDGE_EXTRA_PULL_X = 18.5;
const RIGHT_BOTTOM_EDGE_EXTRA_PULL_POWER = 4.8;

/**
 * Sobe somente a direita inferior da pista.
 *
 * Não move a pista.
 * Não altera a esquerda.
 * Não altera o topo de forma perceptível.
 *
 * Maior valor = direita inferior sobe mais.
 */
const RIGHT_BOTTOM_EDGE_LIFT_Y = 4.6;
const RIGHT_BOTTOM_EDGE_LIFT_POWER = 2.85;

/**
 * Curva visual do tracejado central.
 *
 * Negativo = tracejado curva para a esquerda.
 * Positivo = tracejado curva para a direita.
 */
const LANE_MARK_NEAR_LEFT_CURVE_STRENGTH = -4.2;
const LANE_MARK_NEAR_LEFT_CURVE_POWER = 2.45;

/**
 * Cores da calçada/concreto.
 *
 * Não usa mais sideFar/sideNear/sideAlt da paleta coast,
 * porque essas cores puxavam para amarelo/areia.
 */
const SIDEWALK_FILL_A = "#8f918a";
const SIDEWALK_FILL_B = "#a2a39a";
const SIDEWALK_FILL_FAR = "#b7b7ad";

/**
 * Traços preto/branco na calçada.
 *
 * Eles são desenhados como fatias finas em perspectiva nas laterais,
 * antes da rua e dos rumbles, para ajudar a enganar a profundidade.
 */
const SIDEWALK_MARK_BLACK = "rgba(16, 17, 16, 0.82)";
const SIDEWALK_MARK_WHITE = "rgba(246, 246, 232, 0.78)";

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

function lerp(from: number, to: number, progress: number): number {
  return from + (to - from) * clampNumber(progress, 0, 1);
}

function easeInCubic(value: number): number {
  const t = clampNumber(value, 0, 1);

  return t * t * t;
}

function polygonPoints(
  leftTop: number,
  yTop: number,
  rightTop: number,
  rightBottom: number,
  yBottom: number,
  leftBottom: number,
): string {
  return [
    `${leftTop.toFixed(3)},${yTop.toFixed(3)}`,
    `${rightTop.toFixed(3)},${yTop.toFixed(3)}`,
    `${rightBottom.toFixed(3)},${yBottom.toFixed(3)}`,
    `${leftBottom.toFixed(3)},${yBottom.toFixed(3)}`,
  ].join(" ");
}

function quadPoints(
  leftTopX: number,
  leftTopY: number,
  rightTopX: number,
  rightTopY: number,
  rightBottomX: number,
  rightBottomY: number,
  leftBottomX: number,
  leftBottomY: number,
): string {
  return [
    `${leftTopX.toFixed(3)},${leftTopY.toFixed(3)}`,
    `${rightTopX.toFixed(3)},${rightTopY.toFixed(3)}`,
    `${rightBottomX.toFixed(3)},${rightBottomY.toFixed(3)}`,
    `${leftBottomX.toFixed(3)},${leftBottomY.toFixed(3)}`,
  ].join(" ");
}

/**
 * Curva de largura da rua.
 *
 * Exponent maior que 1 = rua demora mais para abrir,
 * criando a sensação de Z longo/infinito.
 */
function getRoadWidthPerspective(value: number, exponent: number): number {
  const t = clampNumber(value, 0, 1);

  return Math.pow(t, exponent);
}

/**
 * Expansão lateral base apenas para o lado direito.
 *
 * Não desloca a pista inteira.
 * A borda esquerda continua fixa.
 */
function getRightSideRoadExpansion(t: number): number {
  const clampedT = clampNumber(t, 0, 1);
  const depth = Math.pow(clampedT, RIGHT_SIDE_ROAD_EXPANSION_POWER);

  return lerp(
    RIGHT_SIDE_ROAD_TOP_EXPANSION_X,
    RIGHT_SIDE_ROAD_BOTTOM_EXPANSION_X,
    depth,
  );
}

/**
 * Extra horizontal somente para a direita inferior.
 *
 * Power alto = quase zero no topo, forte embaixo.
 */
function getRightBottomExtraPull(t: number): number {
  const clampedT = clampNumber(t, 0, 1);

  return (
    RIGHT_BOTTOM_EDGE_EXTRA_PULL_X *
    Math.pow(clampedT, RIGHT_BOTTOM_EDGE_EXTRA_PULL_POWER)
  );
}

/**
 * Levanta somente a aresta direita conforme aproxima da câmera.
 *
 * Em SVG, menor Y = mais para cima.
 */
function getRightBottomEdgeLift(t: number): number {
  const clampedT = clampNumber(t, 0, 1);

  return (
    RIGHT_BOTTOM_EDGE_LIFT_Y *
    Math.pow(clampedT, RIGHT_BOTTOM_EDGE_LIFT_POWER)
  );
}

/**
 * Offset próprio do tracejado central.
 *
 * Não mexe na rua inteira. Só desloca a faixa central.
 */
function getLaneMarkCurveOffset(t: number): number {
  const clampedT = clampNumber(t, 0, 1);

  return (
    LANE_MARK_NEAR_LEFT_CURVE_STRENGTH *
    Math.pow(clampedT, LANE_MARK_NEAR_LEFT_CURVE_POWER)
  );
}

function getSliceCenterX(
  t: number,
  runtime: HomeDriveRuntimeState,
  roadCurveState: HomeDriveRoadCurveState,
  tuning: RoadTuning,
): number {
  const horizonPull =
    Math.pow(1 - t, 0.72) * roadCurveState.horizonDrift * 100;

  const nearPull = Math.pow(t, 1.62) * roadCurveState.centerDrift * 100;

  const steeringPull =
    clampNumber(runtime.steering, -1, 1) * Math.pow(t, 2.04) * -2.4;

  const lanePull =
    clampNumber(runtime.laneOffset, -1, 1) * Math.pow(t, 2) * -4.8;

  const bankPull = roadCurveState.bank * Math.pow(t, 1.2) * -6;

  const driverLaneBias =
    -tuning.driverLaneBiasPct *
    Math.pow(t, tuning.driverLaneBiasDepthPower);

  return (
    50 +
    ROAD_GLOBAL_LEFT_OFFSET_X +
    driverLaneBias +
    horizonPull +
    nearPull +
    steeringPull +
    lanePull +
    bankPull
  );
}

function getHillProfileOffset(
  t: number,
  hill: number,
  hillStrength: number,
  hillSecondaryStrength: number,
  hillNearStrength: number,
): number {
  const clampedT = clampNumber(t, 0, 1);

  const mainArc = Math.sin(clampedT * Math.PI) * hillStrength;
  const secondaryArc =
    Math.sin(clampedT * Math.PI * 0.76) * hillSecondaryStrength;
  const nearResponse = Math.pow(clampedT, 1.85) * hillNearStrength;

  return hill * (mainArc + secondaryArc + nearResponse);
}

function getSliceY(
  t: number,
  roadProfile: HomeDriveRoadProfile,
  roadCurveState: HomeDriveRoadCurveState,
  tuning: RoadTuning,
): number {
  const horizonBase = clampNumber(
    roadProfile.horizonY + tuning.horizonOffset,
    tuning.horizonMin,
    tuning.horizonMax,
  );

  const horizonY = clampNumber(
    horizonBase - roadCurveState.hill * 0.9,
    tuning.horizonMin,
    tuning.horizonMax + 1,
  );

  const depthProgress = Math.pow(clampNumber(t, 0, 1), 1.42);

  const baseY = lerp(horizonY, roadProfile.roadBottomY + 7, depthProgress);

  const hillProfileOffset = getHillProfileOffset(
    t,
    roadCurveState.hill,
    tuning.hillStrength,
    tuning.hillSecondaryStrength,
    tuning.hillNearStrength,
  );

  return clampNumber(
    baseY - hillProfileOffset,
    horizonY - 2,
    roadProfile.roadBottomY + 9,
  );
}

function getFarRoadWidth(
  roadProfile: HomeDriveRoadProfile,
  tuning: RoadTuning,
): number {
  return Math.max(
    tuning.farRoadWidthMin,
    roadProfile.horizonRoadWidth * tuning.farRoadWidthMultiplier,
  );
}

function getNearRoadWidth(
  roadProfile: HomeDriveRoadProfile,
  tuning: RoadTuning,
): number {
  return Math.max(
    tuning.nearRoadWidthMin,
    roadProfile.baseRoadWidth * tuning.nearRoadWidthMultiplier,
  );
}

function getSliceRoadWidth(
  t: number,
  roadProfile: HomeDriveRoadProfile,
  tuning: RoadTuning,
): number {
  const perspective = getRoadWidthPerspective(
    t,
    tuning.widthPerspectiveExponent,
  );

  return lerp(
    getFarRoadWidth(roadProfile, tuning),
    getNearRoadWidth(roadProfile, tuning),
    perspective,
  );
}

function getRumbleWidth(
  t: number,
  roadProfile: HomeDriveRoadProfile,
  tuning: RoadTuning,
): number {
  return lerp(
    0.82,
    Math.max(
      tuning.rumbleWidthMin,
      roadProfile.rumbleWidth * tuning.rumbleWidthMultiplier,
    ),
    easeInCubic(t),
  );
}

function getLaneMarkWidth(
  t: number,
  roadProfile: HomeDriveRoadProfile,
  tuning: RoadTuning,
): number {
  return lerp(
    0.1,
    Math.max(
      tuning.laneMarkWidthMin,
      roadProfile.laneMarkWidth * tuning.laneMarkWidthMultiplier,
    ),
    Math.pow(clampNumber(t, 0, 1), 1.28),
  );
}

function getRoadFill(
  index: number,
  roadProfile: HomeDriveRoadProfile,
  roadCurveState: HomeDriveRoadCurveState,
): string {
  const depth = index / ROAD_SLICE_COUNT;
  const wave = Math.floor(index + roadCurveState.texturePhase * 9);
  const isAlt = wave % 2 === 0;

  if (depth < 0.28) {
    return isAlt
      ? roadProfile.palette.asphaltAltFar
      : roadProfile.palette.asphaltFar;
  }

  if (depth < 0.68) {
    return isAlt ? "#444b54" : "#4d5560";
  }

  return isAlt
    ? roadProfile.palette.asphaltAltNear
    : roadProfile.palette.asphaltNear;
}

function getSideFill(
  index: number,
  roadCurveState: HomeDriveRoadCurveState,
): string {
  const depth = index / ROAD_SLICE_COUNT;
  const wave = Math.floor(index * 0.72 + roadCurveState.texturePhase * 6);
  const isAlt = wave % 2 === 0;

  if (depth < 0.22) {
    return SIDEWALK_FILL_FAR;
  }

  return isAlt ? SIDEWALK_FILL_A : SIDEWALK_FILL_B;
}

function getSidewalkMarkFill(
  index: number,
  roadCurveState: HomeDriveRoadCurveState,
): string {
  const wave = Math.floor(index * 1.08 + roadCurveState.texturePhase * 10);

  return wave % 2 === 0 ? SIDEWALK_MARK_WHITE : SIDEWALK_MARK_BLACK;
}

function getSidewalkMarkOpacity(index: number): number {
  const depth = index / ROAD_SLICE_COUNT;

  return lerp(0.24, 0.82, Math.pow(depth, 0.72));
}

function shouldShowSidewalkMark(
  index: number,
  roadCurveState: HomeDriveRoadCurveState,
): boolean {
  const depth = index / ROAD_SLICE_COUNT;

  /**
   * Libera os traços mais cedo no horizonte.
   * Antes era 0.07, o que removia muitos traços distantes.
   */
  if (depth < 0.025) {
    return false;
  }

  /**
   * Mais densidade.
   *
   * Antes:
   *   index * 0.62
   *   wave % 4 === 0
   *
   * Agora:
   *   index * 1.18
   *   wave % 2 === 0
   *
   * Resultado: bem mais blocos preto/branco na calçada.
   */
  const wave = Math.floor(index * 1.18 + roadCurveState.texturePhase * 12);

  return wave % 2 === 0;
}

function getRumbleFill(
  index: number,
  roadProfile: HomeDriveRoadProfile,
  roadCurveState: HomeDriveRoadCurveState,
): string {
  const wave = Math.floor(index * 0.9 + roadCurveState.rumblePhase * 8);

  return wave % 2 === 0
    ? roadProfile.palette.rumbleA
    : roadProfile.palette.rumbleB;
}

function shouldShowLaneMark(
  index: number,
  laneMarkerTranslateY: number,
  roadCurveState: HomeDriveRoadCurveState,
): boolean {
  const phaseOffset = laneMarkerTranslateY / 72;
  const wave = Math.floor(
    index * 0.74 + roadCurveState.laneDashPhase * 7 + phaseOffset,
  );

  return wave % 3 === 0;
}

function buildRoadSlices(
  runtime: HomeDriveRuntimeState,
  roadProfile: HomeDriveRoadProfile,
  roadCurveState: HomeDriveRoadCurveState,
  laneMarkerTranslateY: number,
  tuning: RoadTuning,
): readonly RoadSlice[] {
  return Array.from({ length: ROAD_SLICE_COUNT }, (_, index) => {
    const tTop = index / ROAD_SLICE_COUNT;
    const tBottom = (index + 1) / ROAD_SLICE_COUNT;

    const yTop = getSliceY(tTop, roadProfile, roadCurveState, tuning);
    const yBottom = getSliceY(tBottom, roadProfile, roadCurveState, tuning);

    const centerTop = getSliceCenterX(tTop, runtime, roadCurveState, tuning);
    const centerBottom = getSliceCenterX(
      tBottom,
      runtime,
      roadCurveState,
      tuning,
    );

    const roadWidthTop = getSliceRoadWidth(tTop, roadProfile, tuning);
    const roadWidthBottom = getSliceRoadWidth(tBottom, roadProfile, tuning);

    const rumbleWidthTop = getRumbleWidth(tTop, roadProfile, tuning);
    const rumbleWidthBottom = getRumbleWidth(tBottom, roadProfile, tuning);

    const laneMarkWidthTop = getLaneMarkWidth(tTop, roadProfile, tuning);
    const laneMarkWidthBottom = getLaneMarkWidth(tBottom, roadProfile, tuning);

    const baseRightExpansionTop = getRightSideRoadExpansion(tTop);
    const baseRightExpansionBottom = getRightSideRoadExpansion(tBottom);

    const extraRightPullTop = getRightBottomExtraPull(tTop);
    const extraRightPullBottom = getRightBottomExtraPull(tBottom);

    const rightExpansionTop = baseRightExpansionTop + extraRightPullTop;
    const rightExpansionBottom =
      baseRightExpansionBottom + extraRightPullBottom;

    const rightLiftTop = getRightBottomEdgeLift(tTop);
    const rightLiftBottom = getRightBottomEdgeLift(tBottom);

    /**
     * Borda esquerda ancorada.
     *
     * A pista não é movida.
     * A esquerda não sobe.
     * Apenas a direita recebe expansão X e elevação Y.
     */
    const leftTop = centerTop - roadWidthTop / 2;
    const leftBottom = centerBottom - roadWidthBottom / 2;

    const rightTop = centerTop + roadWidthTop / 2 + rightExpansionTop;
    const rightBottom =
      centerBottom + roadWidthBottom / 2 + rightExpansionBottom;

    /**
     * Menor Y = mais para cima no SVG.
     *
     * Isso afeta apenas a aresta direita.
     */
    const rightTopY = yTop - rightLiftTop;
    const rightBottomY = yBottom - rightLiftBottom;

    const leftRumbleOuterTop = leftTop - rumbleWidthTop;
    const leftRumbleOuterBottom = leftBottom - rumbleWidthBottom;
    const rightRumbleOuterTop = rightTop + rumbleWidthTop;
    const rightRumbleOuterBottom = rightBottom + rumbleWidthBottom;

    const laneMarkCenterTop =
      centerTop + rightExpansionTop / 2 + getLaneMarkCurveOffset(tTop);

    const laneMarkCenterBottom =
      centerBottom +
      rightExpansionBottom / 2 +
      getLaneMarkCurveOffset(tBottom);

    const laneLeftTop = laneMarkCenterTop - laneMarkWidthTop / 2;
    const laneRightTop = laneMarkCenterTop + laneMarkWidthTop / 2;
    const laneLeftBottom = laneMarkCenterBottom - laneMarkWidthBottom / 2;
    const laneRightBottom = laneMarkCenterBottom + laneMarkWidthBottom / 2;

    const depthShade = index / ROAD_SLICE_COUNT;
    const laneFill =
      depthShade > 0.5
        ? roadProfile.palette.laneMark
        : "rgba(255, 241, 188, 0.62)";

    return {
      id: `road-slice-${index}`,
      index,
      yTop,
      yBottom,
      rightTopY,
      rightBottomY,
      centerTop,
      centerBottom,
      leftTop,
      rightTop,
      leftBottom,
      rightBottom,
      leftRumbleOuterTop,
      leftRumbleOuterBottom,
      rightRumbleOuterTop,
      rightRumbleOuterBottom,
      laneLeftTop,
      laneRightTop,
      laneLeftBottom,
      laneRightBottom,
      roadFill: getRoadFill(index, roadProfile, roadCurveState),
      sideFill: getSideFill(index, roadCurveState),
      sidewalkMarkFill: getSidewalkMarkFill(index, roadCurveState),
      sidewalkMarkOpacity: getSidewalkMarkOpacity(index),
      rumbleFill: getRumbleFill(index, roadProfile, roadCurveState),
      laneFill,
      roadStrokeOpacity: lerp(
        tuning.roadStrokeOpacityFar,
        tuning.roadStrokeOpacityNear,
        depthShade,
      ),
      showLaneMark: shouldShowLaneMark(
        index,
        laneMarkerTranslateY,
        roadCurveState,
      ),
      showSidewalkMark: shouldShowSidewalkMark(index, roadCurveState),
      showTextureLine: index % 3 === 0,
    };
  });
}

/**
 * A camada da rua não deve pintar um fundo amarelo.
 *
 * O céu precisa continuar aparecendo acima da estrada.
 * A calçada é desenhada separadamente apenas nas laterais.
 */
function getSurfaceBackground(): string {
  return "transparent";
}

function getProjectedRoadShadow(
  runtime: HomeDriveRuntimeState,
  roadCurveState: HomeDriveRoadCurveState,
  tuning: RoadTuning,
): ProjectedRoadShadow {
  const speedFactor = clampNumber(runtime.speedKmh / 120, 0, 1);
  const steering = clampNumber(runtime.steering, -1, 1);
  const laneOffset = clampNumber(runtime.laneOffset, -1, 1);
  const hill = clampNumber(roadCurveState.hill, -1, 1);

  const nearY = 90;
  const projectedLength =
    lerp(tuning.shadowLengthMin, tuning.shadowLengthMax, speedFactor) *
    (hill > 0 ? 1 - hill * 0.32 : 1 + Math.abs(hill) * 0.14);

  const farY = clampNumber(nearY - projectedLength, 60, 82);

  const centerNearX = 50 - laneOffset * 1.8 - steering * 0.9;
  const centerFarX =
    centerNearX -
    steering * 3.2 -
    laneOffset * 2.1 +
    roadCurveState.bank * 2.8 +
    roadCurveState.curve * 4.1;

  const nearWidth = lerp(
    tuning.shadowNearWidthMin,
    tuning.shadowNearWidthMax,
    speedFactor,
  );
  const farWidth = lerp(
    tuning.shadowFarWidthMin,
    tuning.shadowFarWidthMax,
    speedFactor,
  );

  const opacity = lerp(
    tuning.shadowOpacityMin,
    tuning.shadowOpacityMax,
    speedFactor,
  );

  return {
    centerNearX,
    centerFarX,
    nearY,
    farY,
    nearWidth,
    farWidth,
    opacity: clampNumber(opacity, 0, 0.4),
  };
}

function getContainerStyle(
  roadCurveState: HomeDriveRoadCurveState,
  tuning: RoadTuning,
): CSSProperties {
  const bankDeg = clampNumber(roadCurveState.bank * -5.4, -3.4, 3.4);
  const sideBleed = `${tuning.viewportSideBleedPct}%`;

  return {
    position: "absolute",
    left: `-${sideBleed}`,
    right: `-${sideBleed}`,
    bottom: `${tuning.viewportBottomPct}%`,
    height: `${tuning.viewportHeightPct}%`,
    zIndex: 3,
    overflow: "hidden",
    pointerEvents: "none",
    background: getSurfaceBackground(),
    transform: `skewX(${bankDeg}deg)`,
    transformOrigin: "center bottom",
  };
}

function getSvgStyle(): CSSProperties {
  return {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    display: "block",
    shapeRendering: "crispEdges",
  };
}

export default function HomeDriveRoadSurface({
  runtime,
  routeSegment,
  laneMarkerTranslateY = 0,
  roadCurveState,
  className,
}: HomeDriveRoadSurfaceProps) {
  const roadProfile = useMemo(() => {
    return getHomeDriveRoadProfile(routeSegment);
  }, [routeSegment]);

  const tuning = useMemo(() => {
    return getHomeDriveRoadTuning();
  }, []);

  const resolvedRoadCurveState = useMemo(() => {
    return (
      roadCurveState ??
      getHomeDriveRoadCurveState(runtime.traveledMeters, runtime.speedKmh)
    );
  }, [roadCurveState, runtime.speedKmh, runtime.traveledMeters]);

  const slices = useMemo(() => {
    return buildRoadSlices(
      runtime,
      roadProfile,
      resolvedRoadCurveState,
      laneMarkerTranslateY,
      tuning,
    );
  }, [
    laneMarkerTranslateY,
    resolvedRoadCurveState,
    roadProfile,
    runtime,
    tuning,
  ]);

  const projectedRoadShadow = useMemo(() => {
    return getProjectedRoadShadow(runtime, resolvedRoadCurveState, tuning);
  }, [runtime, resolvedRoadCurveState, tuning]);

  const containerStyle = useMemo(() => {
    return getContainerStyle(resolvedRoadCurveState, tuning);
  }, [resolvedRoadCurveState, tuning]);

  return (
    <div
      className={className}
      data-home-drive-road="arcade-pseudo-3d"
      data-home-drive-road-segment={resolvedRoadCurveState.segment.id}
      data-home-drive-road-kind={resolvedRoadCurveState.segment.kind}
      style={containerStyle}
    >
      <svg
        aria-hidden="true"
        focusable="false"
        preserveAspectRatio="none"
        style={getSvgStyle()}
        viewBox="0 0 100 100"
      >
        <defs>
          <linearGradient id="home-drive-road-depth" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
            <stop offset="42%" stopColor="rgba(255,255,255,0.018)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.08)" />
          </linearGradient>

          <linearGradient
            id="home-drive-road-edge-light"
            x1="0"
            x2="1"
            y1="0"
            y2="0"
          >
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="12%" stopColor="rgba(255,255,255,0.18)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.04)" />
            <stop offset="88%" stopColor="rgba(255,255,255,0.18)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>

          <linearGradient id="home-drive-road-texture" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.13)" />
            <stop offset="48%" stopColor="rgba(255,255,255,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.12)" />
          </linearGradient>

          <linearGradient
            id="home-drive-player-shadow-gradient"
            x1="0"
            x2="0"
            y1="1"
            y2="0"
          >
            <stop offset="0%" stopColor="rgba(0,0,0,0.2)" />
            <stop offset="35%" stopColor="rgba(0,0,0,0.08)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </linearGradient>

          <filter
            id="home-drive-player-shadow-blur"
            x="-30%"
            y="-30%"
            width="160%"
            height="160%"
          >
            <feGaussianBlur stdDeviation="1.1" />
          </filter>
        </defs>

        {slices.map((slice) => (
          <React.Fragment key={`${slice.id}-sidewalk`}>
            <polygon
              fill={slice.sideFill}
              points={quadPoints(
                0,
                slice.yTop,
                slice.leftRumbleOuterTop,
                slice.yTop,
                slice.leftRumbleOuterBottom,
                slice.yBottom,
                0,
                slice.yBottom,
              )}
            />

            <polygon
              fill={slice.sideFill}
              points={quadPoints(
                slice.rightRumbleOuterTop,
                slice.rightTopY,
                100,
                slice.rightTopY,
                100,
                slice.rightBottomY,
                slice.rightRumbleOuterBottom,
                slice.rightBottomY,
              )}
            />
          </React.Fragment>
        ))}

        {slices.map((slice) =>
          slice.showSidewalkMark ? (
            <React.Fragment key={`${slice.id}-sidewalk-mark`}>
              <polygon
                fill={slice.sidewalkMarkFill}
                opacity={slice.sidewalkMarkOpacity}
                points={quadPoints(
                  0,
                  slice.yTop,
                  slice.leftRumbleOuterTop,
                  slice.yTop,
                  slice.leftRumbleOuterBottom,
                  slice.yBottom,
                  0,
                  slice.yBottom,
                )}
              />

              <polygon
                fill={slice.sidewalkMarkFill}
                opacity={slice.sidewalkMarkOpacity}
                points={quadPoints(
                  slice.rightRumbleOuterTop,
                  slice.rightTopY,
                  100,
                  slice.rightTopY,
                  100,
                  slice.rightBottomY,
                  slice.rightRumbleOuterBottom,
                  slice.rightBottomY,
                )}
              />
            </React.Fragment>
          ) : null,
        )}

        {slices.map((slice) => (
          <React.Fragment key={slice.id}>
            <polygon
              fill={slice.rumbleFill}
              points={polygonPoints(
                slice.leftRumbleOuterTop,
                slice.yTop,
                slice.leftTop,
                slice.leftBottom,
                slice.yBottom,
                slice.leftRumbleOuterBottom,
              )}
            />

            <polygon
              fill={slice.rumbleFill}
              points={quadPoints(
                slice.rightTop,
                slice.rightTopY,
                slice.rightRumbleOuterTop,
                slice.rightTopY,
                slice.rightRumbleOuterBottom,
                slice.rightBottomY,
                slice.rightBottom,
                slice.rightBottomY,
              )}
            />

            <polygon
              fill={slice.roadFill}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="0.08"
              strokeOpacity={slice.roadStrokeOpacity}
              points={quadPoints(
                slice.leftTop,
                slice.yTop,
                slice.rightTop,
                slice.rightTopY,
                slice.rightBottom,
                slice.rightBottomY,
                slice.leftBottom,
                slice.yBottom,
              )}
            />

            {slice.showTextureLine ? (
              <line
                opacity={Math.max(
                  tuning.textureOpacityMin,
                  roadProfile.textureOpacity,
                )}
                stroke="url(#home-drive-road-texture)"
                strokeWidth={Math.max(
                  0.08,
                  slice.index / (ROAD_SLICE_COUNT * 1.14),
                )}
                x1={slice.leftBottom}
                x2={slice.rightBottom}
                y1={slice.yBottom}
                y2={slice.rightBottomY}
              />
            ) : null}

            {slice.showLaneMark ? (
              <polygon
                fill={slice.laneFill}
                opacity="0.96"
                points={polygonPoints(
                  slice.laneLeftTop,
                  slice.yTop,
                  slice.laneRightTop,
                  slice.laneRightBottom,
                  slice.yBottom,
                  slice.laneLeftBottom,
                )}
              />
            ) : null}
          </React.Fragment>
        ))}

        <polygon
          filter="url(#home-drive-player-shadow-blur)"
          fill="url(#home-drive-player-shadow-gradient)"
          opacity={projectedRoadShadow.opacity}
          points={polygonPoints(
            projectedRoadShadow.centerFarX - projectedRoadShadow.farWidth / 2,
            projectedRoadShadow.farY,
            projectedRoadShadow.centerFarX + projectedRoadShadow.farWidth / 2,
            projectedRoadShadow.centerNearX + projectedRoadShadow.nearWidth / 2,
            projectedRoadShadow.nearY,
            projectedRoadShadow.centerNearX - projectedRoadShadow.nearWidth / 2,
          )}
        />

        <polygon
          fill="url(#home-drive-road-edge-light)"
          opacity={Math.max(
            0.22,
            roadProfile.edgeLightOpacity * tuning.edgeLightOpacityMultiplier,
          )}
          points="0,0 100,0 100,100 0,100"
        />

        <polygon
          fill="url(#home-drive-road-depth)"
          opacity={tuning.depthOverlayOpacity}
          points="0,0 100,0 100,100 0,100"
        />

        <g
          opacity={Math.max(
            0.1,
            roadProfile.scanlineOpacity * tuning.scanlineOpacityMultiplier,
          )}
        >
          {Array.from({ length: 18 }, (_, index) => {
            const y = 18 + index * 4.4;

            return (
              <line
                key={`road-scanline-${index}`}
                stroke="rgba(255,255,255,0.058)"
                strokeWidth="0.1"
                x1="0"
                x2="100"
                y1={y}
                y2={y}
              />
            );
          })}
        </g>
      </svg>
    </div>
  );
}
