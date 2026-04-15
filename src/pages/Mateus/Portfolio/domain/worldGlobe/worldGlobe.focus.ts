// src/pages/Mateus/Portfolio/domain/worldGlobe/worldGlobe.focus.ts

import type { GlobeGeoPoint, GlobeFocus } from "./worldGlobe.types";

/**
 * ============================================================
 * AJUSTES PRINCIPAIS DO FOCO
 * ============================================================
 *
 * Estes valores são os mais importantes para calibrar:
 *
 * 1) LONGITUDE_SIGN
 *    -  1  => usa longitude como está
 *    - -1  => inverte longitude
 *
 * 2) THETA_SIGN
 *    -  1  => mantém o sentido vertical
 *    - -1  => inverte o sentido vertical
 *
 * 3) LONGITUDE_OFFSET_DEG
 *    deslocamento horizontal fixo em graus
 *
 * 4) THETA_OFFSET_DEG
 *    deslocamento vertical fixo em graus
 *
 * 5) THETA_LATITUDE_FACTOR
 *    ganho vertical real da latitude
 *
 * ------------------------------------------------------------
 * SOBRE O PROBLEMA REAL
 * ------------------------------------------------------------
 * O erro anterior era tentar corrigir Winnipeg com um offset
 * gigantesco no hemisfério norte.
 *
 * Se foi necessário usar:
 *   NORTHERN_HEMISPHERE_THETA_OFFSET_DEG = 100
 *
 * então a conta estrutural estava errada.
 *
 * Isso não é ajuste fino.
 * Isso é saturação do clamp para mascarar fórmula ruim.
 *
 * A correção correta é separar:
 * - direção vertical
 * - intensidade vertical
 * - offset residual
 *
 * Em outras palavras:
 * latitude não deve ser "consertada no grito" com +100.
 *
 * ------------------------------------------------------------
 * ESTRATÉGIA ADOTADA AQUI
 * ------------------------------------------------------------
 * A lógica vertical agora fica assim:
 *
 * thetaInputDeg =
 *   normalizedLat * THETA_SIGN * THETA_LATITUDE_FACTOR
 *   + dynamicBias.thetaDeg
 *
 * Com isso:
 * - THETA_SIGN controla a direção
 * - THETA_LATITUDE_FACTOR controla o peso da latitude
 * - THETA_OFFSET_DEG vira só ajuste fino residual
 *
 * Isso é muito mais estável do que depender de bias por hemisfério.
 *
 * ------------------------------------------------------------
 * ESTADO ATUAL SUGERIDO
 * ------------------------------------------------------------
 * Mantive sua estrutura e comentários, mas troquei a base
 * matemática do theta.
 */

const LONGITUDE_SIGN: 1 | -1 = -1;

/**
 * Este é o sinal vertical principal.
 *
 * Se o destino do hemisfério norte estiver subindo demais
 * na tela, troque:
 *   1  <-> -1
 *
 * Pelo seu relato e pelo comportamento observado,
 * o candidato mais promissor agora é 1.
 */
const THETA_SIGN: 1 | -1 = 1;

const LONGITUDE_OFFSET_DEG = -90;

/**
 * Offset vertical residual.
 *
 * Agora ele volta a ser um ajuste fino de verdade.
 * Não mais uma gambiarra de +100.
 */
const THETA_OFFSET_DEG = 0;

/**
 * Ganho vertical real da latitude.
 *
 * 1.00 => latitude entra crua
 * 0.50 => latitude entra pela metade
 * 0.40 => resposta vertical mais suave
 *
 * Começando em 0.42 porque:
 * - reduz agressividade vertical
 * - evita depender de offsets enormes
 * - tende a preservar melhor Fortaleza
 */
const THETA_LATITUDE_FACTOR = 0.42;

/**
 * Ajustes finos opcionais por região.
 *
 * Agora estes começam zerados de verdade.
 * Só mexa neles depois de validar:
 * - THETA_SIGN
 * - THETA_LATITUDE_FACTOR
 */
const NORTHERN_HEMISPHERE_THETA_OFFSET_DEG = 0;
const SOUTHERN_HEMISPHERE_THETA_OFFSET_DEG = 0;

const EASTERN_HEMISPHERE_LONGITUDE_OFFSET_DEG = 0;
const WESTERN_HEMISPHERE_LONGITUDE_OFFSET_DEG = 0;

const HIGH_LATITUDE_THETA_OFFSET_DEG = 0;
const NEAR_EQUATOR_THETA_OFFSET_DEG = 0;

/**
 * Limites e thresholds
 */
const MIN_LAT = -62;
const MAX_LAT = 62;

const MIN_THETA = -0.92;
const MAX_THETA = 0.92;

const HIGH_LATITUDE_THRESHOLD = 42;
const NEAR_EQUATOR_THRESHOLD = 12;

/**
 * ============================================================
 * UTILS
 * ============================================================
 */

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
}

function degToRad(value: number): number {
  return (value * Math.PI) / 180;
}

function radToDeg(value: number): number {
  return (value * 180) / Math.PI;
}

function normalizeAngle(angle: number): number {
  const fullTurn = Math.PI * 2;
  let normalized = angle % fullTurn;

  if (normalized < 0) {
    normalized += fullTurn;
  }

  return normalized;
}

function normalizeLongitude(lng: number): number {
  let value = lng;

  while (value > 180) {
    value -= 360;
  }

  while (value < -180) {
    value += 360;
  }

  return value;
}

type GlobeFocusBias = Readonly<{
  longitudeDeg: number;
  thetaDeg: number;
}>;

/**
 * Bias dinâmico opcional por faixa/região.
 * Deixa a calibração isolada aqui.
 *
 * Agora o bias volta ao papel correto:
 * pequenos refinamentos.
 */
function resolveDynamicFocusBias(point: GlobeGeoPoint): GlobeFocusBias {
  let longitudeDeg = LONGITUDE_OFFSET_DEG;
  let thetaDeg = THETA_OFFSET_DEG;

  if (point.lng >= 0) {
    longitudeDeg += EASTERN_HEMISPHERE_LONGITUDE_OFFSET_DEG;
  } else {
    longitudeDeg += WESTERN_HEMISPHERE_LONGITUDE_OFFSET_DEG;
  }

  if (point.lat >= 0) {
    thetaDeg += NORTHERN_HEMISPHERE_THETA_OFFSET_DEG;
  } else {
    thetaDeg += SOUTHERN_HEMISPHERE_THETA_OFFSET_DEG;
  }

  if (Math.abs(point.lat) >= HIGH_LATITUDE_THRESHOLD) {
    thetaDeg += HIGH_LATITUDE_THETA_OFFSET_DEG;
  }

  if (Math.abs(point.lat) <= NEAR_EQUATOR_THRESHOLD) {
    thetaDeg += NEAR_EQUATOR_THETA_OFFSET_DEG;
  }

  return {
    longitudeDeg,
    thetaDeg,
  };
}

/**
 * ============================================================
 * REGRA DE NEGÓCIO DO FOCO
 * ============================================================
 */

/**
 * Sempre escolhe o destinatário como ponto de foco.
 */
export function resolveInitialFocusPoint(
  _origin: GlobeGeoPoint,
  destination: GlobeGeoPoint
): GlobeGeoPoint {
  return {
    lat: clamp(destination.lat, MIN_LAT, MAX_LAT),
    lng: normalizeLongitude(destination.lng),
  };
}

/**
 * Converte lat/lng em phi/theta do Cobe.
 *
 * Estratégia atual:
 * - phi controla horizontal
 * - theta controla vertical
 * - theta agora tem sinal e ganho próprios
 *
 * Isso substitui a antiga tentativa de empurrar o norte
 * com offsets gigantescos.
 */
export function resolveGlobeFocus(point: GlobeGeoPoint): GlobeFocus {
  const normalizedLat = clamp(point.lat, MIN_LAT, MAX_LAT);
  const normalizedLng = normalizeLongitude(point.lng);

  const dynamicBias = resolveDynamicFocusBias({
    lat: normalizedLat,
    lng: normalizedLng,
  });

  const signedLng = normalizedLng * LONGITUDE_SIGN;

  /**
   * Horizontal:
   * longitude + offset horizontal
   */
  const phi = normalizeAngle(
    degToRad(signedLng + dynamicBias.longitudeDeg)
  );

  /**
   * Vertical:
   * latitude normalizada
   * x sinal vertical próprio
   * x ganho vertical próprio
   * + bias residual
   *
   * Aqui está a mudança central do arquivo.
   */
  const thetaInputDeg =
    normalizedLat * THETA_SIGN * THETA_LATITUDE_FACTOR +
    dynamicBias.thetaDeg;

  const theta = clamp(
    degToRad(thetaInputDeg),
    MIN_THETA,
    MAX_THETA
  );

  return {
    phi,
    theta,
  };
}

/**
 * Helper de debug local
 */
export function resolveFocusDebugSnapshot(point: GlobeGeoPoint): Readonly<{
  input: GlobeGeoPoint;
  normalizedPoint: GlobeGeoPoint;
  bias: GlobeFocusBias;
  thetaSign: 1 | -1;
  thetaLatitudeFactor: number;
  thetaInputDeg: number;
  focus: GlobeFocus;
  focusDeg: Readonly<{
    phiDeg: number;
    thetaDeg: number;
  }>;
}> {
  const normalizedPoint = {
    lat: clamp(point.lat, MIN_LAT, MAX_LAT),
    lng: normalizeLongitude(point.lng),
  };

  const bias = resolveDynamicFocusBias(normalizedPoint);

  const thetaInputDeg =
    normalizedPoint.lat * THETA_SIGN * THETA_LATITUDE_FACTOR +
    bias.thetaDeg;

  const focus = resolveGlobeFocus(normalizedPoint);

  return {
    input: point,
    normalizedPoint,
    bias,
    thetaSign: THETA_SIGN,
    thetaLatitudeFactor: THETA_LATITUDE_FACTOR,
    thetaInputDeg,
    focus,
    focusDeg: {
      phiDeg: radToDeg(focus.phi),
      thetaDeg: radToDeg(focus.theta),
    },
  };
}
