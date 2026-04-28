export type HomeDriveVehicleDynamicsInput = Readonly<{
  steering: number;
  throttle: boolean;
  brake: boolean;
  laneOffset: number;
  deltaMs: number;
}>;

export type HomeDriveVehicleDynamicsState = Readonly<{
  laneOffset: number;
  lateralVelocity: number;
  roadDriftPx: number;
  cameraRollDeg: number;
  horizonShiftPx: number;
  parallaxPx: number;
  steeringIntensity: number;
}>;

export type HomeDriveVehicleDynamicsConfig = Readonly<{
  maxLaneOffset: number;
  steeringAcceleration: number;
  steeringDirectBias: number;
  autoCentering: number;
  lateralFriction: number;
  brakeFrictionBonus: number;
  throttleGripBonus: number;
  maxLateralVelocity: number;
  roadDriftMultiplier: number;
  cameraRollMultiplier: number;
  horizonShiftMultiplier: number;
  parallaxMultiplier: number;
}>;

export const HOME_DRIVE_VEHICLE_DYNAMICS_CONFIG: HomeDriveVehicleDynamicsConfig =
  {
    maxLaneOffset: 1.18,

    /*
      Mais forte para o volante deixar de ser cosmético.
    */
    steeringAcceleration: 5.2,

    /*
      Pequeno ganho imediato para a cena responder no mesmo frame do gesto.
    */
    steeringDirectBias: 0.026,

    /*
      Retorno natural para o centro quando solta o volante.
    */
    autoCentering: 0.42,

    /*
      Menor fricção = mais sensação de peso/inércia.
    */
    lateralFriction: 3.35,

    /*
      Freio estabiliza lateralmente, mas não deve matar a direção do nada.
    */
    brakeFrictionBonus: 1.9,

    /*
      Acelerando, o carro tem um pouco mais de aderência.
    */
    throttleGripBonus: 0.48,

    maxLateralVelocity: 1.72,

    /*
      Saídas visuais mais fortes.
      Esses valores são o que fazem pista, horizonte e paralaxe reagirem.
    */
    roadDriftMultiplier: 62,
    cameraRollMultiplier: 5.6,
    horizonShiftMultiplier: 40,
    parallaxMultiplier: 52,
  } as const;

export function clampHomeDriveNumber(
  value: number,
  min: number,
  max: number,
): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

function dampValue(value: number, damping: number, deltaSeconds: number): number {
  const safeDeltaSeconds = clampHomeDriveNumber(deltaSeconds, 0, 0.08);
  const factor = Math.exp(-damping * safeDeltaSeconds);

  return value * factor;
}

export function createInitialHomeDriveVehicleDynamics(): HomeDriveVehicleDynamicsState {
  return {
    laneOffset: 0,
    lateralVelocity: 0,
    roadDriftPx: 0,
    cameraRollDeg: 0,
    horizonShiftPx: 0,
    parallaxPx: 0,
    steeringIntensity: 0,
  };
}

export function resolveHomeDriveVehicleDynamics(
  previousState: HomeDriveVehicleDynamicsState,
  input: HomeDriveVehicleDynamicsInput,
  config: HomeDriveVehicleDynamicsConfig = HOME_DRIVE_VEHICLE_DYNAMICS_CONFIG,
): HomeDriveVehicleDynamicsState {
  const deltaSeconds = clampHomeDriveNumber(input.deltaMs / 1000, 0, 0.08);
  const steering = clampHomeDriveNumber(input.steering, -1, 1);
  const steeringIntensity = Math.abs(steering);

  const throttleGrip = input.throttle ? config.throttleGripBonus : 0;
  const brakeFriction = input.brake ? config.brakeFrictionBonus : 0;
  const friction = config.lateralFriction + throttleGrip + brakeFriction;

  const acceleration = steering * config.steeringAcceleration;
  const rawVelocity =
    previousState.lateralVelocity + acceleration * deltaSeconds;

  const dampedVelocity = dampValue(rawVelocity, friction, deltaSeconds);

  const lateralVelocity = clampHomeDriveNumber(
    dampedVelocity,
    -config.maxLateralVelocity,
    config.maxLateralVelocity,
  );

  /*
    A direção agora tem 3 partes:
    1. velocidade lateral acumulada;
    2. resposta direta do volante;
    3. retorno físico ao centro.
  */
  const lateralMotion = lateralVelocity * deltaSeconds;
  const directSteeringMotion = steering * config.steeringDirectBias;
  const autoCenteringMotion =
    -input.laneOffset * config.autoCentering * deltaSeconds;

  const rawLaneOffset =
    input.laneOffset +
    lateralMotion +
    directSteeringMotion +
    autoCenteringMotion;

  const laneOffset = clampHomeDriveNumber(
    rawLaneOffset,
    -config.maxLaneOffset,
    config.maxLaneOffset,
  );

  /*
    Saídas visuais.
    Sinal negativo mantém a câmera reagindo em sentido coerente com o carro.
  */
  const roadDriftPx = -laneOffset * config.roadDriftMultiplier;
  const cameraRollDeg = -steering * config.cameraRollMultiplier;
  const horizonShiftPx = -laneOffset * config.horizonShiftMultiplier;
  const parallaxPx = -laneOffset * config.parallaxMultiplier;

  return {
    laneOffset,
    lateralVelocity,
    roadDriftPx,
    cameraRollDeg,
    horizonShiftPx,
    parallaxPx,
    steeringIntensity,
  };
}

export function getHomeDriveSteeringSceneIntensity(
  steering: number,
  laneOffset: number,
): number {
  const steeringIntensity = Math.abs(clampHomeDriveNumber(steering, -1, 1));
  const laneIntensity = Math.abs(clampHomeDriveNumber(laneOffset, -1, 1));

  return clampHomeDriveNumber(
    steeringIntensity * 0.66 + laneIntensity * 0.34,
    0,
    1,
  );
}

export function getHomeDriveSteeringDirection(steering: number): -1 | 0 | 1 {
  if (steering < -0.08) {
    return -1;
  }

  if (steering > 0.08) {
    return 1;
  }

  return 0;
}
