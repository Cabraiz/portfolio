import {
  blendHomeDriveAngleDeg,
  clampHomeDriveWorldNumber,
  getHomeDrivePointFromHeadingDistance,
  normalizeHomeDriveAngleDeg,
} from "./homeDrive.worldGeometry";
import {
  findHomeDriveTurnCandidateRoad,
  findNearestHomeDriveWorldRoad,
  snapHomeDriveCarToRoad,
} from "./homeDrive.worldNavigation";
import type {
  HomeDriveWorldCarState,
  HomeDriveWorldInputState,
  HomeDriveWorldMap,
  HomeDriveWorldPhysicsConfig,
} from "./homeDrive.worldTypes";

export const HOME_DRIVE_WORLD_PHYSICS_CONFIG: HomeDriveWorldPhysicsConfig = {
  maxSpeedKmh: 68,
  reverseMaxSpeedKmh: 12,
  accelerationKmhPerSecond: 18,
  brakeKmhPerSecond: 34,
  naturalDecelerationKmhPerSecond: 4.8,
  dragPerSecond: 0.018,
  maxSteeringInput: 1,
  steeringResponsePerSecond: 10.2,
  steeringReturnPerSecond: 5.8,
  minTurnSpeedKmh: 2,
  maxTurnRateDegPerSecond: 148,
  lowSpeedTurnMultiplier: 0.64,
  roadGrip: 0.98,
  offRoadGrip: 0.72,
  offRoadSpeedPenalty: 0.78,
  snap: {
    enabled: true,
    snapDistanceMeters: 46,
    offRoadAllowed: true,
    headingSnapStrength: 0.012,
    maxHeadingSnapDeg: 28,
  },
};

export type ResolveHomeDriveWorldPhysicsParams = Readonly<{
  previous: HomeDriveWorldCarState;
  input: HomeDriveWorldInputState;
  deltaSeconds: number;
  map: HomeDriveWorldMap;
  config?: Partial<HomeDriveWorldPhysicsConfig>;
}>;

function normalizeInputAmount(value: boolean | number): number {
  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }

  return clampHomeDriveWorldNumber(value, 0, 1);
}

function resolveConfig(
  config?: Partial<HomeDriveWorldPhysicsConfig>,
): HomeDriveWorldPhysicsConfig {
  return {
    ...HOME_DRIVE_WORLD_PHYSICS_CONFIG,
    ...config,
    snap: {
      ...HOME_DRIVE_WORLD_PHYSICS_CONFIG.snap,
      ...config?.snap,
    },
  };
}

function resolveSteering({
  previousSteering,
  targetSteering,
  speedKmh,
  deltaSeconds,
  config,
}: Readonly<{
  previousSteering: number;
  targetSteering: number;
  speedKmh: number;
  deltaSeconds: number;
  config: HomeDriveWorldPhysicsConfig;
}>): number {
  const safeDelta = clampHomeDriveWorldNumber(deltaSeconds, 0, 0.08);
  const safeTarget = clampHomeDriveWorldNumber(
    targetSteering,
    -config.maxSteeringInput,
    config.maxSteeringInput,
  );
  const response =
    Math.abs(safeTarget) > 0.001
      ? config.steeringResponsePerSecond
      : config.steeringReturnPerSecond;

  /*
    Em baixa velocidade, deixa o volante responder visualmente, mas evita
    giro absurdo parado.
  */
  const speedWeight = clampHomeDriveWorldNumber(speedKmh / 18, 0.35, 1);
  const progress = clampHomeDriveWorldNumber(response * safeDelta * speedWeight, 0, 1);

  return previousSteering + (safeTarget - previousSteering) * progress;
}

function resolveSpeedKmh({
  previousSpeedKmh,
  throttle,
  brake,
  nearestSpeedLimitKmh,
  isOffRoad,
  deltaSeconds,
  config,
}: Readonly<{
  previousSpeedKmh: number;
  throttle: number;
  brake: number;
  nearestSpeedLimitKmh?: number;
  isOffRoad: boolean;
  deltaSeconds: number;
  config: HomeDriveWorldPhysicsConfig;
}>): number {
  const safeDelta = clampHomeDriveWorldNumber(deltaSeconds, 0, 0.08);
  const speedLimit = nearestSpeedLimitKmh ?? config.maxSpeedKmh;
  const roadMaxSpeed = Math.min(config.maxSpeedKmh, speedLimit + 8);
  const effectiveMaxSpeed = isOffRoad
    ? roadMaxSpeed * config.offRoadSpeedPenalty
    : roadMaxSpeed;

  let nextSpeed = previousSpeedKmh;

  if (throttle > 0) {
    const speedRoom = clampHomeDriveWorldNumber(
      1 - nextSpeed / Math.max(1, effectiveMaxSpeed),
      0.16,
      1,
    );

    nextSpeed += config.accelerationKmhPerSecond * throttle * speedRoom * safeDelta;
  } else {
    nextSpeed -= config.naturalDecelerationKmhPerSecond * safeDelta;
  }

  if (brake > 0) {
    nextSpeed -= config.brakeKmhPerSecond * brake * safeDelta;
  }

  nextSpeed -= nextSpeed * config.dragPerSecond * safeDelta;

  return clampHomeDriveWorldNumber(nextSpeed, 0, effectiveMaxSpeed);
}

function resolveHeadingDeg({
  previousHeadingDeg,
  steering,
  speedKmh,
  isOffRoad,
  deltaSeconds,
  config,
}: Readonly<{
  previousHeadingDeg: number;
  steering: number;
  speedKmh: number;
  isOffRoad: boolean;
  deltaSeconds: number;
  config: HomeDriveWorldPhysicsConfig;
}>): number {
  const safeDelta = clampHomeDriveWorldNumber(deltaSeconds, 0, 0.08);
  const speedFactor = clampHomeDriveWorldNumber(
    speedKmh / Math.max(1, config.maxSpeedKmh),
    0,
    1,
  );
  const lowSpeedBoost =
    speedKmh < config.minTurnSpeedKmh
      ? config.lowSpeedTurnMultiplier
      : 1;
  const grip = isOffRoad ? config.offRoadGrip : config.roadGrip;
  const turnRate =
    steering *
    config.maxTurnRateDegPerSecond *
    speedFactor *
    lowSpeedBoost *
    grip;

  return normalizeHomeDriveAngleDeg(previousHeadingDeg + turnRate * safeDelta);
}

export function resolveHomeDriveWorldPhysics({
  previous,
  input,
  deltaSeconds,
  map,
  config,
}: ResolveHomeDriveWorldPhysicsParams): HomeDriveWorldCarState {
  const resolvedConfig = resolveConfig(config);
  const safeDelta = clampHomeDriveWorldNumber(deltaSeconds, 0, 0.08);
  const throttle = normalizeInputAmount(input.throttle);
  const brake = normalizeInputAmount(input.brake);

  const nearestBeforeMove = findNearestHomeDriveWorldRoad(
    map,
    { x: previous.x, y: previous.y },
    previous.headingDeg,
  );
  const isOffRoadBeforeMove =
    Boolean(nearestBeforeMove) &&
    nearestBeforeMove!.distanceMeters > resolvedConfig.snap.snapDistanceMeters;

  const nextSpeedKmh = resolveSpeedKmh({
    previousSpeedKmh: previous.speedKmh,
    throttle,
    brake,
    nearestSpeedLimitKmh: nearestBeforeMove?.road.speedLimitKmh,
    isOffRoad: isOffRoadBeforeMove,
    deltaSeconds: safeDelta,
    config: resolvedConfig,
  });

  const nextSteering = resolveSteering({
    previousSteering: previous.steering,
    targetSteering: input.steer,
    speedKmh: nextSpeedKmh,
    deltaSeconds: safeDelta,
    config: resolvedConfig,
  });

  const turnCandidate = findHomeDriveTurnCandidateRoad(
    map,
    previous,
    nextSteering,
    {
      currentRoadId: previous.currentRoadId ?? nearestBeforeMove?.road.id,
      maxDistanceMeters: 82,
      maxForwardMeters: 108,
      maxLateralMeters: 64,
    },
  );

  const naturalHeadingDeg = resolveHeadingDeg({
    previousHeadingDeg: previous.headingDeg,
    steering: nextSteering,
    speedKmh: nextSpeedKmh,
    isOffRoad: isOffRoadBeforeMove,
    deltaSeconds: safeDelta,
    config: resolvedConfig,
  });

  /*
    Quando existe uma rua candidata no lado do volante, fazemos a transição
    para ela. Isso é o que faltava para o carro "dobrar" em vez de só
    balançar o volante e ser puxado de volta para a reta.
  */
  const turnBlend = turnCandidate
    ? clampHomeDriveWorldNumber(
        0.12 + Math.abs(nextSteering) * 0.18 + nextSpeedKmh / 420,
        0.12,
        0.38,
      )
    : 0;

  const nextHeadingDeg = turnCandidate
    ? normalizeHomeDriveAngleDeg(
        naturalHeadingDeg +
          (turnCandidate.angleDeg * turnBlend),
      )
    : naturalHeadingDeg;

  const metersPerSecond = nextSpeedKmh / 3.6;
  const distanceMeters = metersPerSecond * safeDelta;
  const nextPosition = getHomeDrivePointFromHeadingDistance(
    previous,
    nextHeadingDeg,
    distanceMeters,
  );

  const rawNextCar: HomeDriveWorldCarState = {
    ...previous,
    x: nextPosition.x,
    y: nextPosition.y,
    headingDeg: nextHeadingDeg,
    speedKmh: nextSpeedKmh,
    steering: nextSteering,
    currentRoadId: turnCandidate?.roadId ?? previous.currentRoadId,
    currentDistrictId:
      turnCandidate?.road.districtId ?? previous.currentDistrictId,
    odometerMeters: previous.odometerMeters + distanceMeters,
  };

  if (turnCandidate) {
    /*
      Aproxima o carro da nova rua sem teleporte seco. O snap normal não serve
      aqui porque ele tende a escolher a rua antiga, já que ainda é a mais
      próxima no início da curva.
    */
    const turnSnapStrength = clampHomeDriveWorldNumber(
      0.08 + Math.abs(nextSteering) * 0.11,
      0.08,
      0.22,
    );
    const turnedCar: HomeDriveWorldCarState = {
      ...rawNextCar,
      x:
        rawNextCar.x +
        (turnCandidate.snapPoint.x - rawNextCar.x) * turnSnapStrength,
      y:
        rawNextCar.y +
        (turnCandidate.snapPoint.y - rawNextCar.y) * turnSnapStrength,
      headingDeg: blendHomeDriveAngleDeg(
        rawNextCar.headingDeg,
        turnCandidate.targetHeadingDeg,
        turnSnapStrength,
      ),
      currentRoadId: turnCandidate.roadId,
      currentDistrictId: turnCandidate.road.districtId,
      offRoadMeters: 0,
    };

    return turnedCar;
  }

  const dynamicSnapConfig =
    Math.abs(nextSteering) > 0.28
      ? {
          ...resolvedConfig.snap,
          snapDistanceMeters: 12,
          offRoadAllowed: true,
          headingSnapStrength: 0.003,
          maxHeadingSnapDeg: 18,
        }
      : resolvedConfig.snap;

  const snapped = snapHomeDriveCarToRoad(map, rawNextCar, dynamicSnapConfig);

  return snapped.car;
}

export function stopHomeDriveWorldCar(
  car: HomeDriveWorldCarState,
): HomeDriveWorldCarState {
  return {
    ...car,
    speedKmh: 0,
    steering: 0,
  };
}

export function resetHomeDriveWorldCarToSpawn(
  map: HomeDriveWorldMap,
): HomeDriveWorldCarState {
  const spawnRoad = map.roads.find((road) => road.id === map.spawn.roadId);

  return {
    x: map.spawn.position.x,
    y: map.spawn.position.y,
    headingDeg: map.spawn.headingDeg,
    speedKmh: map.spawn.speedKmh,
    steering: 0,
    currentRoadId: map.spawn.roadId,
    currentDistrictId: spawnRoad?.districtId,
    odometerMeters: 0,
    offRoadMeters: 0,
  };
}
