import type { HomeDriveRoadCurveState } from "./homeDrive.roadCurves";

export type HomeDriveAssistPhase =
  | "idle"
  | "intro"
  | "countdown"
  | "playing"
  | "paused"
  | "finished"
  | "gameOver"
  | string;

export type HomeDriveAssistInput = Readonly<{
  phase?: HomeDriveAssistPhase;
  speedKmh: number;
  steering: number;
  laneOffset: number;
  throttleIntent?: number;
  brakeIntent?: number;
  previousDriveFlow?: number;
  elapsedMs?: number;
  roadCurveState?: Pick<HomeDriveRoadCurveState, "curve" | "bank" | "hill">;
}>;

export type HomeDriveAssistState = Readonly<{
  autoThrottle: number;
  playerThrottle: number;
  throttle: number;
  autoBrake: number;
  playerBrake: number;
  brake: number;
  driveFlow: number;
  driveSyncPct: number;
  stability: number;
  curveRisk: number;
  laneRisk: number;
  steeringRisk: number;
  speedRisk: number;
  targetSpeedKmh: number;
  maxSafeSpeedKmh: number;
  isBoosting: boolean;
  isBraking: boolean;
  status: "auto" | "boost" | "control" | "danger" | "paused";
}>;

const DEFAULT_DRIVE_FLOW = 0.46;

const BASE_TARGET_SPEED_KMH = 42;
const MAX_TARGET_SPEED_KMH = 118;
const MIN_TARGET_SPEED_KMH = 18;

const AUTO_THROTTLE_MIN = 0.28;
const AUTO_THROTTLE_MAX = 0.76;

const BOOST_THROTTLE_BONUS = 0.28;
const CONTROL_BRAKE_BONUS = 0.82;

const FLOW_GAIN_PER_SECOND = 0.16;
const FLOW_LOSS_PER_SECOND = 0.28;

const CURVE_RISK_START = 0.14;
const CURVE_RISK_FULL = 0.92;

const STEERING_RISK_START = 0.38;
const STEERING_RISK_FULL = 0.96;

const LANE_RISK_START = 0.34;
const LANE_RISK_FULL = 0.98;

const SPEED_RISK_START_KMH = 74;
const SPEED_RISK_FULL_KMH = 126;

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

function lerp(from: number, to: number, progress: number): number {
  return from + (to - from) * clampNumber(progress, 0, 1);
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  if (edge0 === edge1) {
    return value >= edge1 ? 1 : 0;
  }

  const t = clampNumber((value - edge0) / (edge1 - edge0), 0, 1);

  return t * t * (3 - 2 * t);
}

function getElapsedSeconds(elapsedMs?: number): number {
  return clampNumber((elapsedMs ?? 16.6667) / 1000, 0, 0.08);
}

function getCurveRisk(
  roadCurveState?: Pick<HomeDriveRoadCurveState, "curve" | "bank" | "hill">,
): number {
  if (!roadCurveState) {
    return 0;
  }

  const curve = Math.abs(clampNumber(roadCurveState.curve, -1, 1));
  const bank = Math.abs(clampNumber(roadCurveState.bank, -1, 1));
  const hill = Math.abs(clampNumber(roadCurveState.hill, -1, 1));

  const combinedCurvePressure = curve * 0.74 + bank * 0.22 + hill * 0.08;

  return smoothstep(CURVE_RISK_START, CURVE_RISK_FULL, combinedCurvePressure);
}

function getSteeringRisk(steering: number): number {
  return smoothstep(
    STEERING_RISK_START,
    STEERING_RISK_FULL,
    Math.abs(clampNumber(steering, -1, 1)),
  );
}

function getLaneRisk(laneOffset: number): number {
  return smoothstep(
    LANE_RISK_START,
    LANE_RISK_FULL,
    Math.abs(clampNumber(laneOffset, -1, 1)),
  );
}

function getSpeedRisk(speedKmh: number): number {
  return smoothstep(
    SPEED_RISK_START_KMH,
    SPEED_RISK_FULL_KMH,
    clampNumber(speedKmh, 0, 240),
  );
}

function getStability(params: {
  curveRisk: number;
  laneRisk: number;
  steeringRisk: number;
  speedRisk: number;
}): number {
  const instability =
    params.curveRisk * 0.22 +
    params.laneRisk * 0.34 +
    params.steeringRisk * 0.3 +
    params.speedRisk * 0.14;

  return clampNumber(1 - instability, 0, 1);
}

function getNextDriveFlow(params: {
  previousDriveFlow?: number;
  elapsedSeconds: number;
  stability: number;
  curveRisk: number;
  laneRisk: number;
  steeringRisk: number;
  brakeIntent: number;
  phase?: HomeDriveAssistPhase;
}): number {
  const previousDriveFlow = clampNumber(
    params.previousDriveFlow ?? DEFAULT_DRIVE_FLOW,
    0,
    1,
  );

  if (params.phase && params.phase !== "playing") {
    return previousDriveFlow;
  }

  const isStable = params.stability >= 0.68;
  const flowDelta = isStable
    ? FLOW_GAIN_PER_SECOND * params.elapsedSeconds
    : -FLOW_LOSS_PER_SECOND * params.elapsedSeconds;

  const dangerPenalty =
    (params.curveRisk * 0.035 +
      params.laneRisk * 0.06 +
      params.steeringRisk * 0.045 +
      params.brakeIntent * 0.028) *
    params.elapsedSeconds *
    12;

  return clampNumber(previousDriveFlow + flowDelta - dangerPenalty, 0, 1);
}

function getAutoBrake(params: {
  curveRisk: number;
  laneRisk: number;
  steeringRisk: number;
  speedRisk: number;
}): number {
  const curveBrake = params.curveRisk * (0.28 + params.speedRisk * 0.52);
  const laneBrake = params.laneRisk * 0.78;
  const steeringBrake = params.steeringRisk * params.speedRisk * 0.42;
  const speedBrake = params.speedRisk * Math.max(params.curveRisk, 0.2) * 0.34;

  return clampNumber(
    Math.max(curveBrake, laneBrake, steeringBrake, speedBrake),
    0,
    1,
  );
}

function getAutoThrottle(params: {
  driveFlow: number;
  autoBrake: number;
  curveRisk: number;
  laneRisk: number;
  steeringRisk: number;
  phase?: HomeDriveAssistPhase;
}): number {
  if (params.phase && params.phase !== "playing") {
    return 0;
  }

  const flowThrottle = lerp(
    AUTO_THROTTLE_MIN,
    AUTO_THROTTLE_MAX,
    params.driveFlow,
  );

  const safetyReduction =
    params.autoBrake * 0.58 +
    params.curveRisk * 0.14 +
    params.laneRisk * 0.22 +
    params.steeringRisk * 0.08;

  return clampNumber(flowThrottle - safetyReduction, 0, 1);
}

function getTargetSpeedKmh(params: {
  driveFlow: number;
  throttleIntent: number;
  brake: number;
  curveRisk: number;
  laneRisk: number;
  steeringRisk: number;
  speedRisk: number;
  phase?: HomeDriveAssistPhase;
}): number {
  if (params.phase && params.phase !== "playing") {
    return 0;
  }

  const flowSpeed = lerp(BASE_TARGET_SPEED_KMH, MAX_TARGET_SPEED_KMH, params.driveFlow);
  const boostBonus = params.throttleIntent * 18;

  const safetyReduction =
    params.brake * 42 +
    params.curveRisk * 18 +
    params.laneRisk * 24 +
    params.steeringRisk * 10 +
    params.speedRisk * 8;

  return clampNumber(
    flowSpeed + boostBonus - safetyReduction,
    MIN_TARGET_SPEED_KMH,
    MAX_TARGET_SPEED_KMH,
  );
}

function getMaxSafeSpeedKmh(params: {
  driveFlow: number;
  curveRisk: number;
  laneRisk: number;
  steeringRisk: number;
}): number {
  const baseSafeSpeed = lerp(66, 122, params.driveFlow);

  const safetyReduction =
    params.curveRisk * 34 + params.laneRisk * 38 + params.steeringRisk * 18;

  return clampNumber(baseSafeSpeed - safetyReduction, 22, 128);
}

function getAssistStatus(params: {
  phase?: HomeDriveAssistPhase;
  brake: number;
  autoBrake: number;
  throttleIntent: number;
  brakeIntent: number;
  stability: number;
}): HomeDriveAssistState["status"] {
  if (params.phase && params.phase !== "playing") {
    return "paused";
  }

  if (params.autoBrake >= 0.58 || params.stability <= 0.36) {
    return "danger";
  }

  if (params.brakeIntent >= 0.18 || params.brake >= 0.42) {
    return "control";
  }

  if (params.throttleIntent >= 0.18) {
    return "boost";
  }

  return "auto";
}

/**
 * Calcula o assistente de direção automática.
 *
 * Uso esperado:
 * - o carro acelera sozinho quando phase === "playing";
 * - o usuário não precisa segurar botão de acelerar/frear;
 * - gesto vertical pode adicionar intenção:
 *   - throttleIntent: arrastar para cima;
 *   - brakeIntent: arrastar para baixo;
 * - curva, volante agressivo e saída de faixa geram freio automático.
 */
export function getHomeDriveAssistState(
  input: HomeDriveAssistInput,
): HomeDriveAssistState {
  const phase = input.phase;
  const elapsedSeconds = getElapsedSeconds(input.elapsedMs);

  const steering = clampNumber(input.steering, -1, 1);
  const laneOffset = clampNumber(input.laneOffset, -1, 1);
  const speedKmh = clampNumber(input.speedKmh, 0, 240);

  const throttleIntent = clampNumber(input.throttleIntent ?? 0, 0, 1);
  const brakeIntent = clampNumber(input.brakeIntent ?? 0, 0, 1);

  const curveRisk = getCurveRisk(input.roadCurveState);
  const laneRisk = getLaneRisk(laneOffset);
  const steeringRisk = getSteeringRisk(steering);
  const speedRisk = getSpeedRisk(speedKmh);

  const stability = getStability({
    curveRisk,
    laneRisk,
    steeringRisk,
    speedRisk,
  });

  const driveFlow = getNextDriveFlow({
    previousDriveFlow: input.previousDriveFlow,
    elapsedSeconds,
    stability,
    curveRisk,
    laneRisk,
    steeringRisk,
    brakeIntent,
    phase,
  });

  const autoBrake = getAutoBrake({
    curveRisk,
    laneRisk,
    steeringRisk,
    speedRisk,
  });

  const playerBrake = brakeIntent * CONTROL_BRAKE_BONUS;

  const brake = clampNumber(Math.max(autoBrake, playerBrake), 0, 1);

  const autoThrottle = getAutoThrottle({
    driveFlow,
    autoBrake: brake,
    curveRisk,
    laneRisk,
    steeringRisk,
    phase,
  });

  const playerThrottle = throttleIntent * BOOST_THROTTLE_BONUS;

  const throttle = clampNumber(autoThrottle + playerThrottle - brake * 0.34, 0, 1);

  const targetSpeedKmh = getTargetSpeedKmh({
    driveFlow,
    throttleIntent,
    brake,
    curveRisk,
    laneRisk,
    steeringRisk,
    speedRisk,
    phase,
  });

  const maxSafeSpeedKmh = getMaxSafeSpeedKmh({
    driveFlow,
    curveRisk,
    laneRisk,
    steeringRisk,
  });

  const status = getAssistStatus({
    phase,
    brake,
    autoBrake,
    throttleIntent,
    brakeIntent,
    stability,
  });

  return {
    autoThrottle,
    playerThrottle,
    throttle,
    autoBrake,
    playerBrake,
    brake,
    driveFlow,
    driveSyncPct: Math.round(driveFlow * 100),
    stability,
    curveRisk,
    laneRisk,
    steeringRisk,
    speedRisk,
    targetSpeedKmh,
    maxSafeSpeedKmh,
    isBoosting: throttleIntent >= 0.18 && status === "boost",
    isBraking: brake >= 0.28,
    status,
  };
}

/**
 * Helper opcional para o hook de física.
 *
 * Ele aproxima a velocidade atual da velocidade-alvo calculada pelo assistente.
 * Use apenas se quiser centralizar a evolução da velocidade neste arquivo.
 */
export function getHomeDriveAssistedSpeedKmh(params: {
  currentSpeedKmh: number;
  assist: HomeDriveAssistState;
  elapsedMs?: number;
}): number {
  const elapsedSeconds = getElapsedSeconds(params.elapsedMs);
  const currentSpeedKmh = clampNumber(params.currentSpeedKmh, 0, 240);

  const accelerationForce = lerp(18, 54, params.assist.throttle);
  const brakeForce = lerp(26, 92, params.assist.brake);

  const speedGap = params.assist.targetSpeedKmh - currentSpeedKmh;
  const targetPull = clampNumber(speedGap * 0.9, -brakeForce, accelerationForce);

  const nextSpeed =
    currentSpeedKmh +
    targetPull * elapsedSeconds -
    params.assist.brake * brakeForce * elapsedSeconds;

  return clampNumber(
    nextSpeed,
    0,
    Math.max(params.assist.maxSafeSpeedKmh, params.assist.targetSpeedKmh),
  );
}
