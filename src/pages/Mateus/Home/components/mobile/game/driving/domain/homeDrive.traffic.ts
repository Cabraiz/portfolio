// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.traffic.ts

import { hashVector } from "./homeDrive.math";
import { shouldHomeDriveTrafficYieldAtCrosswalk } from "./crosswalks";
import type { HomeDriveCrosswalkRuntimeState } from "./crosswalks";
import {
  createHomeDriveTrafficAwarenessSnapshot,
  stabilizeHomeDriveTrafficLaneSeparation,
} from "./homeDrive.trafficAwareness";
import type { HomeDriveTrafficAwarenessDecision } from "./homeDrive.trafficAwareness.types";
import {
  buildHomeDriveRoadTopology,
  type HomeDriveRoadTopology,
} from "./homeDrive.roadTopology";
import { generateHomeDriveRoadSegments } from "./homeDrive.roadGenerator";
import {
  getHomeDriveTrafficPositionOnRoad,
  resolveHomeDriveTrafficRoadStep,
} from "./homeDrive.trafficRouter";
import {
  getHomeDriveTrafficHeadingRadians,
  getHomeDriveTrafficSeededDirectionSign,
  getHomeDriveTrafficSeededLaneIndex,
  resolveHomeDriveTrafficLane,
  type HomeDriveTrafficDirectionSign,
} from "./homeDrive.trafficLanes";
import type { HomeDriveVector2 } from "./homeDrive.types";
import type {
  HomeDriveGeneratedRoadSegment,
  HomeDriveWorldPosition,
} from "./homeDrive.worldMap.types";
import {
  getHomeDriveVehicleModelDescriptor,
  pickHomeDriveVehicleModelKey,
  pickHomeDriveVehiclePaintKey,
  type HomeDriveVehicleModelKey,
  type HomeDriveVehiclePaintKey,
} from "./vehicles";
import type {
  HomeDriveTrafficGenerationOptions,
  HomeDriveTrafficRuntimeState,
  HomeDriveTrafficTickOptions,
  HomeDriveTrafficVehicle,
  HomeDriveTrafficVehicleColorKey,
  HomeDriveTrafficVehicleKind,
  HomeDriveTrafficVector2,
} from "./homeDrive.traffic.types";

/**
 * 4x do teto antigo:
 * antes: 176
 * agora: 704
 */
const DEFAULT_MAX_TRAFFIC_VEHICLES = 520;

/**
 * Permite popular ruas um pouco menores.
 */
const DEFAULT_MIN_ROAD_LENGTH_METERS = 64;

/**
 * Densidade alta, mas ainda controlada pelo roadChance e pelo espaçamento.
 */
const DEFAULT_TRAFFIC_DENSITY = 2.15;

/**
 * Aumenta o tamanho visual dos carros.
 *
 * 1.00 = tamanho antigo
 * 1.35 = maior, mas ainda normal
 * 1.65 = grande
 * 2.00+ = grotesco
 */
const TRAFFIC_VEHICLE_SIZE_MULTIPLIER = 1.25;

/**
 * Antes estava alto demais para 4x tráfego.
 *
 * Quanto menor, mais slots por rua.
 * 0.42 deixa a rua bem mais populada sem ficar 100% congestionada.
 */
const TRAFFIC_VEHICLE_SPACING_MULTIPLIER = 0.62;

/**
 * A colisão já cresce porque usa width/length escalados.
 * Este multiplicador deixa a hitbox um pouco mais coerente com o visual grande.
 */
const TRAFFIC_VEHICLE_COLLISION_RADIUS_MULTIPLIER = 1.08;

const IMPACT_OFFSET_DECAY_PER_SECOND = 3.1;
const IMPACT_VELOCITY_DECAY_PER_SECOND = 4.35;
const IMPACT_ROTATION_DECAY_PER_SECOND = 5.2;
const IMPACT_ANGULAR_DECAY_PER_SECOND = 4.6;

const DEFAULT_TRAFFIC_SPEED_RECOVERY_MPS2 = 6.4;
const MIN_TRAFFIC_CRUISE_SPEED_MPS = 6;
const MAX_TRAFFIC_CRUISE_SPEED_MPS = 26;

const JUNCTION_COOLDOWN_SECONDS = 0.34;
const MIN_ROAD_LENGTH_METERS = 0.000001;

const TRAFFIC_CROSSWALK_LOOKAHEAD_METERS = 58;
const TRAFFIC_CROSSWALK_STOP_DISTANCE_METERS = 9.5;
const TRAFFIC_LANE_CHANGE_LATERAL_SPEED_MPS = 3.85;
const TRAFFIC_LANE_CHANGE_COMPLETE_EPSILON_METERS = 0.09;
const TRAFFIC_LANE_CHANGE_COMPLETE_COOLDOWN_SECONDS = 1.1;

type CrosswalkYieldResolution = Readonly<{
  speedFactor: number;
  crosswalkId: string | null;
}>;

type TrafficSpeedProfile = Readonly<{
  minFactor: number;
  maxFactor: number;
  minMps: number;
  maxMps: number;
  accelerationMinMps2: number;
  accelerationMaxMps2: number;
  jitterMps: number;
}>;

type TrafficVehicleCandidate = Readonly<{
  vehicle: HomeDriveTrafficVehicle;
  priority: number;
  segmentLengthMeters: number;
}>;

type TrafficVehicleDimensions = Readonly<{
  widthMeters: number;
  lengthMeters: number;
  heightMeters: number;
}>;

let cachedTrafficRoadSegments: readonly HomeDriveGeneratedRoadSegment[] | null =
  null;

let cachedTrafficRoadTopology: HomeDriveRoadTopology | null = null;

function getRoadTags(road: HomeDriveGeneratedRoadSegment): readonly string[] {
  const roadWithTags = road as HomeDriveGeneratedRoadSegment & {
    tags?: readonly string[];
  };

  return Array.isArray(roadWithTags.tags) ? roadWithTags.tags : [];
}

function getTrafficRoadSegments(): readonly HomeDriveGeneratedRoadSegment[] {
  if (cachedTrafficRoadSegments) {
    return cachedTrafficRoadSegments;
  }

  cachedTrafficRoadSegments = generateHomeDriveRoadSegments().filter((road) => {
    const tags = getRoadTags(road);

    if (road.length < 42) {
      return false;
    }

    if (tags.includes("safe-endcap")) {
      return false;
    }

    return road.kind !== "service" || road.length >= 70;
  });

  return cachedTrafficRoadSegments;
}

function getTrafficRoadTopology(
  roads: readonly HomeDriveGeneratedRoadSegment[],
): HomeDriveRoadTopology {
  if (cachedTrafficRoadTopology) {
    return cachedTrafficRoadTopology;
  }

  cachedTrafficRoadTopology = buildHomeDriveRoadTopology(roads);

  return cachedTrafficRoadTopology;
}

function getRoadSpeedLimitKmh(road: HomeDriveGeneratedRoadSegment): number {
  const roadWithSpeed = road as HomeDriveGeneratedRoadSegment & {
    speedLimitKmh?: number;
  };

  return roadWithSpeed.speedLimitKmh ?? 38;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

function lerp(start: number, end: number, amount: number): number {
  return start + (end - start) * amount;
}

function smoothstep01(value: number): number {
  const x = clamp01(value);

  return x * x * (3 - 2 * x);
}

function moveTowards(current: number, target: number, maxDelta: number): number {
  if (!Number.isFinite(current)) {
    return target;
  }

  if (Math.abs(target - current) <= maxDelta) {
    return target;
  }

  return current + Math.sign(target - current) * maxDelta;
}

function scaleTrafficVehicleDimensions(
  dimensions: TrafficVehicleDimensions,
): TrafficVehicleDimensions {
  return {
    widthMeters: dimensions.widthMeters * TRAFFIC_VEHICLE_SIZE_MULTIPLIER,
    lengthMeters: dimensions.lengthMeters * TRAFFIC_VEHICLE_SIZE_MULTIPLIER,
    heightMeters: dimensions.heightMeters * TRAFFIC_VEHICLE_SIZE_MULTIPLIER,
  };
}

function getStableRoadSeed(road: HomeDriveGeneratedRoadSegment): number {
  let hash = 23;

  for (let index = 0; index < road.id.length; index += 1) {
    hash = (hash * 37 + road.id.charCodeAt(index)) % 104729;
  }

  return hash + road.segmentIndex * 131;
}

function getTrafficRoadChance(road: HomeDriveGeneratedRoadSegment): number {
  const tags = getRoadTags(road);

  if (road.kind === "coastal") {
    return 0.76;
  }

  if (road.kind === "avenue") {
    return 0.72;
  }

  if (road.kind === "commercial") {
    return 0.66;
  }

  if (road.kind === "ring") {
    return 0.52;
  }

  if (tags.includes("main") || tags.includes("fast")) {
    return 0.72;
  }

  if (road.kind === "service") {
    return 0.16;
  }

  return 0.48;
}

function getTrafficSlotSpacingMeters(
  road: HomeDriveGeneratedRoadSegment,
): number {
  const baseSpacing = (() => {
    switch (road.kind) {
      case "coastal":
        return 150;

      case "avenue":
        return 138;

      case "commercial":
        return 128;

      case "ring":
        return 142;

      case "street":
        return 122;

      case "service":
        return 165;

      default:
        return 142;
    }
  })();

  return baseSpacing * TRAFFIC_VEHICLE_SPACING_MULTIPLIER;
}

function getTrafficSpeedProfile(
  road: HomeDriveGeneratedRoadSegment,
): TrafficSpeedProfile {
  switch (road.kind) {
    case "coastal":
      return {
        minFactor: 0.78,
        maxFactor: 1.1,
        minMps: 7.0,
        maxMps: 18.8,
        accelerationMinMps2: 5.2,
        accelerationMaxMps2: 7.8,
        jitterMps: 0.9,
      };

    case "avenue":
      return {
        minFactor: 0.82,
        maxFactor: 1.2,
        minMps: 8.0,
        maxMps: 21.2,
        accelerationMinMps2: 5.8,
        accelerationMaxMps2: 9.2,
        jitterMps: 1.15,
      };

    case "commercial":
      return {
        minFactor: 0.68,
        maxFactor: 1.0,
        minMps: 6.4,
        maxMps: 15.8,
        accelerationMinMps2: 4.4,
        accelerationMaxMps2: 6.8,
        jitterMps: 0.8,
      };

    case "ring":
      return {
        minFactor: 0.9,
        maxFactor: 1.24,
        minMps: 9.2,
        maxMps: 23.5,
        accelerationMinMps2: 6.2,
        accelerationMaxMps2: 9.6,
        jitterMps: 1.25,
      };

    case "street":
      return {
        minFactor: 0.68,
        maxFactor: 1.02,
        minMps: 6.2,
        maxMps: 16.6,
        accelerationMinMps2: 4.8,
        accelerationMaxMps2: 7.4,
        jitterMps: 0.95,
      };

    case "service":
      return {
        minFactor: 0.5,
        maxFactor: 0.74,
        minMps: 5.4,
        maxMps: 11.4,
        accelerationMinMps2: 3.2,
        accelerationMaxMps2: 5.2,
        jitterMps: 0.5,
      };

    default:
      return {
        minFactor: 0.72,
        maxFactor: 1.04,
        minMps: 6.4,
        maxMps: 17.2,
        accelerationMinMps2: 5.0,
        accelerationMaxMps2: 7.8,
        jitterMps: 0.9,
      };
  }
}

function getTrafficVehicleModelKind(
  modelKey: HomeDriveVehicleModelKey,
): HomeDriveTrafficVehicleKind {
  switch (modelKey) {
    case "compact-hatch":
    case "mini-hatch":
      return "compact";

    case "popular-hatch":
    case "classic-beetle":
      return "hatch";

    case "small-sedan":
    case "mid-sedan":
    case "executive-sedan":
    case "app-driver-sedan":
      return "sedan";

    case "retro-station-wagon":
      return "wagon";

    case "sport-coupe":
    case "muscle-coupe":
      return "sport";

    case "compact-suv":
    case "mid-suv":
    case "luxury-suv":
    case "offroad-suv":
      return "suv";

    case "light-pickup":
    case "hilux-pickup":
    case "double-cab-pickup":
    case "flatbed-pickup":
      return "pickup";

    case "delivery-van":
    case "ambulance-van":
      return "delivery";

    case "dump-truck":
    case "box-truck":
    case "semi-truck":
      return "truck";

    case "city-bus":
    case "articulated-bus":
    case "school-bus":
      return "bus";

    case "minibus":
      return "microbus";

    case "taxi-sedan":
      return "taxi";

    case "police-suv":
      return "police";

    case "street-motorcycle":
    case "delivery-motorcycle":
      return "motorcycle";

    case "urban-bicycle":
      return "bicycle";

    default:
      return "compact";
  }
}

function getTrafficVehicleModelDimensions(
  modelKey: HomeDriveVehicleModelKey,
): TrafficVehicleDimensions {
  const model = getHomeDriveVehicleModelDescriptor(modelKey);

  return scaleTrafficVehicleDimensions({
    widthMeters: model.dimensions.widthMeters,
    lengthMeters: model.dimensions.lengthMeters,
    heightMeters: model.dimensions.heightMeters,
  });
}

function getTrafficVehicleColorFromPaint(
  paintKey: HomeDriveVehiclePaintKey,
): HomeDriveTrafficVehicleColorKey {
  switch (paintKey) {
    case "white":
    case "delivery-white":
      return "white";

    case "silver":
      return "silver";

    case "black":
      return "black";

    case "graphite":
    case "utility-gray":
      return "charcoal";

    case "red":
      return "red";

    case "blue":
      return "blue";

    case "beige":
      return "beige";

    case "taxi-yellow":
    case "bus-yellow":
      return "yellow";

    case "construction-orange":
      return "constructionOrange";

    case "police-blue":
      return "policeBlue";

    case "emergency-white":
      return "emergencyWhite";

    case "motorcycle-black":
      return "motorcycleBlack";

    case "bicycle-teal":
      return "bicycleTeal";

    default:
      return "white";
  }
}

function getVehicleSpeedMultiplier(
  kind: HomeDriveTrafficVehicleKind,
): number {
  switch (kind) {
    case "bicycle":
      return 0.42;

    case "motorcycle":
      return 1.18;

    case "truck":
      return 0.66;

    case "microbus":
      return 0.74;

    case "bus":
      return 0.82;

    case "delivery":
      return 0.82;

    case "van":
      return 0.92;

    case "suv":
      return 0.96;

    case "pickup":
      return 1;

    case "wagon":
      return 1.04;

    case "sedan":
      return 1.06;

    case "taxi":
      return 1.08;

    case "hatch":
      return 1.12;

    case "police":
      return 1.16;

    case "sport":
      return 1.22;

    case "compact":
    default:
      return 1.1;
  }
}

function getVehicleAccelerationMultiplier(
  kind: HomeDriveTrafficVehicleKind,
): number {
  switch (kind) {
    case "bicycle":
      return 0.42;

    case "motorcycle":
      return 1.28;

    case "truck":
      return 0.52;

    case "microbus":
      return 0.64;

    case "bus":
      return 0.68;

    case "delivery":
      return 0.78;

    case "van":
      return 0.82;

    case "pickup":
      return 0.92;

    case "suv":
      return 0.92;

    case "wagon":
      return 1.02;

    case "sedan":
      return 1.08;

    case "taxi":
      return 1.08;

    case "hatch":
      return 1.12;

    case "police":
      return 1.18;

    case "sport":
      return 1.32;

    case "compact":
    default:
      return 1.18;
  }
}

function getPositionOnTrafficRoad(
  road: HomeDriveGeneratedRoadSegment,
  t: number,
  laneOffsetMeters: number,
): HomeDriveVector2 {
  const position = getHomeDriveTrafficPositionOnRoad(
    road,
    t,
    laneOffsetMeters,
  );

  return toHomeDriveVector2(position);
}

function toHomeDriveVector2(position: HomeDriveWorldPosition): HomeDriveVector2 {
  return {
    x: position.x,
    z: position.z,
  };
}

function getVehicleCollisionRadiusMeters(
  widthMeters: number,
  lengthMeters: number,
  kind: HomeDriveTrafficVehicleKind,
): number {
  const gameplayRadius =
    Math.hypot(widthMeters * 0.46, lengthMeters * 0.24) *
    TRAFFIC_VEHICLE_COLLISION_RADIUS_MULTIPLIER;

  if (kind === "bicycle") {
    return clamp(gameplayRadius, 0.46, 0.92);
  }

  if (kind === "motorcycle") {
    return clamp(gameplayRadius, 0.64, 1.18);
  }

  const minRadius = 1.08 * Math.min(TRAFFIC_VEHICLE_SIZE_MULTIPLIER, 1.35);
  const maxRadius = kind === "bus" || kind === "truck" ? 4.85 : 3.15 * TRAFFIC_VEHICLE_SIZE_MULTIPLIER;

  return clamp(gameplayRadius, minRadius, maxRadius);
}

function getTrafficVehicleCruiseSpeedMps(
  road: HomeDriveGeneratedRoadSegment,
  kind: HomeDriveTrafficVehicleKind,
  speedSeed: number,
  jitterSeed: number,
): number {
  const profile = getTrafficSpeedProfile(road);
  const speedLimitMps = getRoadSpeedLimitKmh(road) / 3.6;

  const shapedSeed = speedSeed * 0.58 + smoothstep01(jitterSeed) * 0.42;
  const speedFactor = lerp(profile.minFactor, profile.maxFactor, shapedSeed);

  const jitter = (jitterSeed - 0.5) * profile.jitterMps;
  const kindMultiplier = getVehicleSpeedMultiplier(kind);

  const rawSpeedMps = speedLimitMps * speedFactor * kindMultiplier + jitter;

  return clamp(
    rawSpeedMps,
    Math.max(MIN_TRAFFIC_CRUISE_SPEED_MPS, profile.minMps),
    Math.min(MAX_TRAFFIC_CRUISE_SPEED_MPS, profile.maxMps),
  );
}

function getTrafficVehicleRecoveryMps2(
  road: HomeDriveGeneratedRoadSegment,
  kind: HomeDriveTrafficVehicleKind,
  seed: number,
): number {
  const profile = getTrafficSpeedProfile(road);
  const kindMultiplier = getVehicleAccelerationMultiplier(kind);

  return Math.max(
    1.8,
    lerp(profile.accelerationMinMps2, profile.accelerationMaxMps2, seed) *
      kindMultiplier,
  );
}

function getInitialRuntimeSpeedMps(
  cruiseSpeedMps: number,
  seed: number,
): number {
  const startFactor = lerp(0.72, 0.94, smoothstep01(seed));

  return Math.max(MIN_TRAFFIC_CRUISE_SPEED_MPS, cruiseSpeedMps * startFactor);
}

function getTrafficVehicleRouteSeed(
  roadSeed: number,
  slotIndex: number,
): number {
  return Math.floor(hashVector(roadSeed, slotIndex, 563) * 1_000_000);
}

function getInitialDirectionSign(
  road: HomeDriveGeneratedRoadSegment,
  roadSeed: number,
  slotIndex: number,
): HomeDriveTrafficDirectionSign {
  return getHomeDriveTrafficSeededDirectionSign(
    road,
    hashVector(roadSeed, slotIndex, 503),
  );
}

function getInitialLaneIndex(
  road: HomeDriveGeneratedRoadSegment,
  directionSign: HomeDriveTrafficDirectionSign,
  roadSeed: number,
  slotIndex: number,
): number {
  return getHomeDriveTrafficSeededLaneIndex(
    road,
    directionSign,
    hashVector(roadSeed, slotIndex, 401),
  );
}

function createTrafficVehicle(
  road: HomeDriveGeneratedRoadSegment,
  slotIndex: number,
  slotCount: number,
  roadSeed: number,
): HomeDriveTrafficVehicle {
  const directionSign = getInitialDirectionSign(road, roadSeed, slotIndex);
  const laneIndex = getInitialLaneIndex(
    road,
    directionSign,
    roadSeed,
    slotIndex,
  );
  const lane = resolveHomeDriveTrafficLane(road, directionSign, laneIndex);

  const tSeed = hashVector(roadSeed, slotIndex, 509);
  const modelSeed = hashVector(roadSeed, slotIndex, 521);
  const paintSeed = hashVector(roadSeed, slotIndex, 523);
  const speedSeed = hashVector(roadSeed, slotIndex, 547);
  const variantSeed = hashVector(roadSeed, slotIndex, 557);
  const speedJitterSeed = hashVector(roadSeed, slotIndex, 569);
  const accelerationSeed = hashVector(roadSeed, slotIndex, 571);
  const initialSpeedSeed = hashVector(roadSeed, slotIndex, 577);

  const t =
    slotCount <= 1
      ? 0.5
      : clamp01((slotIndex + 0.18 + tSeed * 0.64) / slotCount);

  const modelKey = pickHomeDriveVehicleModelKey(modelSeed, {
    roadKind: road.kind,
    parked: false,
    commercialBias: road.kind === "commercial",
    serviceBias: road.kind === "service",
  });
  const paintKey = pickHomeDriveVehiclePaintKey(paintSeed, modelKey);
  const kind = getTrafficVehicleModelKind(modelKey);
  const dimensions = getTrafficVehicleModelDimensions(modelKey);

  const position = getPositionOnTrafficRoad(road, t, lane.laneOffsetMeters);

  const cruiseSpeedMps = getTrafficVehicleCruiseSpeedMps(
    road,
    kind,
    speedSeed,
    speedJitterSeed,
  );

  const speedRecoveryMps2 = getTrafficVehicleRecoveryMps2(
    road,
    kind,
    accelerationSeed,
  );

  return {
    id: `traffic-${road.id}-${slotIndex}-${directionSign}-${lane.laneIndex}`,
    modelKey,
    kind,
    colorKey: getTrafficVehicleColorFromPaint(paintKey),

    roadId: road.roadId,
    segmentId: road.id,
    segmentIndex: road.segmentIndex,
    previousSegmentId: null,
    routeSeed: getTrafficVehicleRouteSeed(roadSeed, slotIndex),
    junctionCooldownSeconds: 0,

    t,
    directionSign: lane.directionSign,
    laneIndex: lane.laneIndex,
    targetLaneIndex: lane.laneIndex,
    targetLaneOffsetMeters: lane.laneOffsetMeters,
    laneChangeDirection: 0,
    laneChangeCooldownSeconds: 0,
    turnSignal: null,
    brakeLightIntensity: 0,
    followingVehicleId: null,
    laneOffsetMeters: lane.laneOffsetMeters,

    position,
    headingRad: getHomeDriveTrafficHeadingRadians(road, lane.directionSign),
    speedMps: getInitialRuntimeSpeedMps(cruiseSpeedMps, initialSpeedSeed),
    cruiseSpeedMps,
    speedRecoveryMps2,

    widthMeters: dimensions.widthMeters,
    lengthMeters: dimensions.lengthMeters,
    heightMeters: dimensions.heightMeters,
    collisionRadiusMeters: getVehicleCollisionRadiusMeters(
      dimensions.widthMeters,
      dimensions.lengthMeters,
      kind,
    ),

    variant: Math.floor(variantSeed * 6),
    damage: 0,

    impactOffset: {
      x: 0,
      z: 0,
    },
    impactVelocity: {
      x: 0,
      z: 0,
    },
    visualRollRad: 0,
    visualPitchRad: 0,
    visualYawOffsetRad: 0,
    impactAngularVelocityRadps: 0,

    yieldingToCrosswalkId: null,
    yieldTimerSeconds: 0,

    lastCollisionAt: -999,
  };
}

function getRoadBySegmentId(
  roads: readonly HomeDriveGeneratedRoadSegment[],
  segmentId: string,
): HomeDriveGeneratedRoadSegment | undefined {
  return roads.find((road) => road.id === segmentId);
}

function decayVector(
  vector: HomeDriveTrafficVector2,
  decayPerSecond: number,
  deltaSeconds: number,
): HomeDriveTrafficVector2 {
  const decay = Math.exp(-decayPerSecond * deltaSeconds);

  return {
    x: vector.x * decay,
    z: vector.z * decay,
  };
}

function decayScalar(
  value: number,
  decayPerSecond: number,
  deltaSeconds: number,
): number {
  const decay = Math.exp(-decayPerSecond * deltaSeconds);
  const nextValue = value * decay;

  return Math.abs(nextValue) <= 0.0001 ? 0 : nextValue;
}

function getCruiseSpeedForVehicleOnRoad(
  vehicle: HomeDriveTrafficVehicle,
  road: HomeDriveGeneratedRoadSegment,
): number {
  const speedSeed = hashVector(vehicle.routeSeed, road.segmentIndex, 733);
  const jitterSeed = hashVector(vehicle.routeSeed, road.segmentIndex, 739);

  return getTrafficVehicleCruiseSpeedMps(
    road,
    vehicle.kind,
    speedSeed,
    jitterSeed,
  );
}

function getRecoveryForVehicleOnRoad(
  vehicle: HomeDriveTrafficVehicle,
  road: HomeDriveGeneratedRoadSegment,
): number {
  const accelerationSeed = hashVector(vehicle.routeSeed, road.segmentIndex, 751);

  return getTrafficVehicleRecoveryMps2(road, vehicle.kind, accelerationSeed);
}

function getSafeVehicleCruiseSpeedMps(
  vehicle: HomeDriveTrafficVehicle,
  road: HomeDriveGeneratedRoadSegment,
): number {
  if (Number.isFinite(vehicle.cruiseSpeedMps) && vehicle.cruiseSpeedMps > 0) {
    const profile = getTrafficSpeedProfile(road);

    return clamp(
      vehicle.cruiseSpeedMps,
      Math.max(MIN_TRAFFIC_CRUISE_SPEED_MPS, profile.minMps),
      Math.min(MAX_TRAFFIC_CRUISE_SPEED_MPS, profile.maxMps),
    );
  }

  return getCruiseSpeedForVehicleOnRoad(vehicle, road);
}

function getSafeVehicleSpeedRecoveryMps2(
  vehicle: HomeDriveTrafficVehicle,
): number {
  if (
    Number.isFinite(vehicle.speedRecoveryMps2) &&
    vehicle.speedRecoveryMps2 > 0
  ) {
    return vehicle.speedRecoveryMps2;
  }

  return DEFAULT_TRAFFIC_SPEED_RECOVERY_MPS2;
}

function hasCrosswalkOccupancy(
  crosswalks: HomeDriveCrosswalkRuntimeState,
  crosswalkId: string,
): boolean {
  return crosswalks.occupancies.some((occupancy) => {
    return occupancy.crosswalkId === crosswalkId;
  });
}

function resolveCrosswalkYieldForVehicle(
  vehicle: HomeDriveTrafficVehicle,
  road: HomeDriveGeneratedRoadSegment,
  crosswalks: HomeDriveCrosswalkRuntimeState | undefined,
): CrosswalkYieldResolution {
  if (!crosswalks || road.length <= MIN_ROAD_LENGTH_METERS) {
    return {
      speedFactor: 1,
      crosswalkId: null,
    };
  }

  let bestDistanceMeters = Number.POSITIVE_INFINITY;
  let bestCrosswalkId: string | null = null;
  let shouldYield = false;

  for (const crosswalk of crosswalks.crosswalks) {
    if (crosswalk.segmentId !== vehicle.segmentId) {
      continue;
    }

    const deltaT = (crosswalk.t - vehicle.t) * vehicle.directionSign;

    if (deltaT <= 0) {
      continue;
    }

    const distanceMeters = deltaT * road.length;

    if (distanceMeters > TRAFFIC_CROSSWALK_LOOKAHEAD_METERS) {
      continue;
    }

    const occupied = hasCrosswalkOccupancy(crosswalks, crosswalk.id);
    const yieldNow = shouldHomeDriveTrafficYieldAtCrosswalk(
      crosswalk,
      crosswalks.elapsedSeconds,
      occupied,
    );

    if (!yieldNow) {
      continue;
    }

    if (distanceMeters < bestDistanceMeters) {
      bestDistanceMeters = distanceMeters;
      bestCrosswalkId = crosswalk.id;
      shouldYield = true;
    }
  }

  if (!shouldYield || !bestCrosswalkId) {
    return {
      speedFactor: 1,
      crosswalkId: null,
    };
  }

  if (bestDistanceMeters <= TRAFFIC_CROSSWALK_STOP_DISTANCE_METERS) {
    return {
      speedFactor: 0,
      crosswalkId: bestCrosswalkId,
    };
  }

  return {
    speedFactor: clamp(
      (bestDistanceMeters - TRAFFIC_CROSSWALK_STOP_DISTANCE_METERS) /
        (TRAFFIC_CROSSWALK_LOOKAHEAD_METERS -
          TRAFFIC_CROSSWALK_STOP_DISTANCE_METERS),
      0.08,
      0.86,
    ),
    crosswalkId: bestCrosswalkId,
  };
}

function getRecoveredVehicleSpeedMps(
  vehicle: HomeDriveTrafficVehicle,
  road: HomeDriveGeneratedRoadSegment,
  deltaSeconds: number,
): number {
  const cruiseSpeedMps = getSafeVehicleCruiseSpeedMps(vehicle, road);
  const recoveryMps2 = getSafeVehicleSpeedRecoveryMps2(vehicle);
  const currentSpeedMps = clamp(
    Number.isFinite(vehicle.speedMps) ? vehicle.speedMps : cruiseSpeedMps,
    0,
    MAX_TRAFFIC_CRUISE_SPEED_MPS * 1.25,
  );

  const maxDelta =
    currentSpeedMps > cruiseSpeedMps
      ? recoveryMps2 * 1.55 * deltaSeconds
      : recoveryMps2 * deltaSeconds;

  return moveTowards(currentSpeedMps, cruiseSpeedMps, Math.max(0, maxDelta));
}

function getNextVehicleT(
  vehicle: HomeDriveTrafficVehicle,
  road: HomeDriveGeneratedRoadSegment,
  deltaSeconds: number,
  speedMps: number,
): number {
  if (road.length <= MIN_ROAD_LENGTH_METERS) {
    return vehicle.t;
  }

  return (
    vehicle.t +
    (speedMps * vehicle.directionSign * deltaSeconds) / road.length
  );
}

function getNextCruiseSpeedMps(
  vehicle: HomeDriveTrafficVehicle,
  road: HomeDriveGeneratedRoadSegment,
  routedToNewSegment: boolean,
): number {
  if (routedToNewSegment) {
    return getCruiseSpeedForVehicleOnRoad(vehicle, road);
  }

  return getSafeVehicleCruiseSpeedMps(vehicle, road);
}

function getNextRecoveryMps2(
  vehicle: HomeDriveTrafficVehicle,
  road: HomeDriveGeneratedRoadSegment,
  routedToNewSegment: boolean,
): number {
  if (routedToNewSegment) {
    return getRecoveryForVehicleOnRoad(vehicle, road);
  }

  return getSafeVehicleSpeedRecoveryMps2(vehicle);
}

function getLaneChangeDirection(
  fromLaneIndex: number,
  toLaneIndex: number,
): -1 | 0 | 1 {
  if (toLaneIndex > fromLaneIndex) {
    return 1;
  }

  if (toLaneIndex < fromLaneIndex) {
    return -1;
  }

  return 0;
}

function getTurnSignalFromDirection(
  direction: -1 | 0 | 1,
): HomeDriveTrafficVehicle["turnSignal"] {
  if (direction > 0) {
    return "left";
  }

  if (direction < 0) {
    return "right";
  }

  return null;
}

function getNumberOrFallback(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function resolveAwarenessLaneTarget(
  vehicle: HomeDriveTrafficVehicle,
  road: HomeDriveGeneratedRoadSegment,
  decision: HomeDriveTrafficAwarenessDecision | undefined,
): Readonly<{
  laneIndex: number;
  laneOffsetMeters: number;
}> {
  const requestedLaneIndex = getNumberOrFallback(
    decision?.targetLaneIndex ?? vehicle.targetLaneIndex,
    vehicle.laneIndex,
  );

  const lane = resolveHomeDriveTrafficLane(
    road,
    vehicle.directionSign,
    requestedLaneIndex,
  );

  return {
    laneIndex: lane.laneIndex,
    laneOffsetMeters: lane.laneOffsetMeters,
  };
}

function tickTrafficVehicle(
  vehicle: HomeDriveTrafficVehicle,
  road: HomeDriveGeneratedRoadSegment,
  roads: readonly HomeDriveGeneratedRoadSegment[],
  topology: HomeDriveRoadTopology,
  deltaSeconds: number,
  crosswalks?: HomeDriveCrosswalkRuntimeState,
  awarenessDecision?: HomeDriveTrafficAwarenessDecision,
): HomeDriveTrafficVehicle {
  if (road.length <= MIN_ROAD_LENGTH_METERS) {
    return vehicle;
  }

  const baseRecoveredSpeedMps = getRecoveredVehicleSpeedMps(
    vehicle,
    road,
    deltaSeconds,
  );
  const crosswalkYield = resolveCrosswalkYieldForVehicle(
    vehicle,
    road,
    crosswalks,
  );
  const awarenessSpeedFactor = clamp01(awarenessDecision?.speedFactor ?? 1);
  const recoveredSpeedMps =
    baseRecoveredSpeedMps * crosswalkYield.speedFactor * awarenessSpeedFactor;
  const awarenessBrakeLight = clamp01(
    awarenessDecision?.brakeLightIntensity ?? 0,
  );
  const crosswalkBrakeLight = clamp01(1 - crosswalkYield.speedFactor);
  const brakeLightIntensity = Math.max(
    awarenessBrakeLight,
    crosswalkBrakeLight,
    recoveredSpeedMps + 0.25 < vehicle.speedMps ? 0.48 : 0,
  );

  const rawNextT = getNextVehicleT(
    vehicle,
    road,
    deltaSeconds,
    recoveredSpeedMps,
  );

  const roadStep = resolveHomeDriveTrafficRoadStep({
    roads,
    topology,
    vehicle,
    currentRoad: road,
    nextT: rawNextT,
    routeSeed: vehicle.routeSeed,
  });

  const decayedImpactVelocity = decayVector(
    vehicle.impactVelocity,
    IMPACT_VELOCITY_DECAY_PER_SECOND,
    deltaSeconds,
  );

  const nextImpactOffsetBeforeDecay = {
    x: vehicle.impactOffset.x + decayedImpactVelocity.x * deltaSeconds,
    z: vehicle.impactOffset.z + decayedImpactVelocity.z * deltaSeconds,
  };

  const nextImpactOffset = decayVector(
    nextImpactOffsetBeforeDecay,
    IMPACT_OFFSET_DECAY_PER_SECOND,
    deltaSeconds,
  );

  const routedToNewSegment = roadStep.segmentId !== vehicle.segmentId;
  const laneTarget = routedToNewSegment
    ? {
        laneIndex: roadStep.laneIndex,
        laneOffsetMeters: roadStep.laneOffsetMeters,
      }
    : resolveAwarenessLaneTarget(vehicle, roadStep.road, awarenessDecision);
  const currentLaneOffsetMeters = getNumberOrFallback(
    vehicle.laneOffsetMeters,
    roadStep.laneOffsetMeters,
  );
  const nextLaneOffsetMeters = routedToNewSegment
    ? laneTarget.laneOffsetMeters
    : moveTowards(
        currentLaneOffsetMeters,
        laneTarget.laneOffsetMeters,
        TRAFFIC_LANE_CHANGE_LATERAL_SPEED_MPS * deltaSeconds,
      );
  const laneChangeComplete =
    Math.abs(nextLaneOffsetMeters - laneTarget.laneOffsetMeters) <=
    TRAFFIC_LANE_CHANGE_COMPLETE_EPSILON_METERS;
  const nextLaneIndex = laneChangeComplete
    ? laneTarget.laneIndex
    : vehicle.laneIndex;
  const laneChangeDirection = routedToNewSegment
    ? 0
    : laneChangeComplete
      ? 0
      : getLaneChangeDirection(vehicle.laneIndex, laneTarget.laneIndex);
  const laneChangeCompletedThisTick =
    !routedToNewSegment &&
    vehicle.laneChangeDirection !== 0 &&
    laneChangeDirection === 0;
  const nextLaneChangeCooldownSeconds = routedToNewSegment
    ? JUNCTION_COOLDOWN_SECONDS
    : laneChangeCompletedThisTick
      ? TRAFFIC_LANE_CHANGE_COMPLETE_COOLDOWN_SECONDS
      : Math.max(0, vehicle.laneChangeCooldownSeconds - deltaSeconds);
  const nextTurnSignal = routedToNewSegment
    ? null
    : laneChangeDirection !== 0
      ? awarenessDecision?.turnSignal ?? getTurnSignalFromDirection(laneChangeDirection)
      : null;

  const basePosition = getPositionOnTrafficRoad(
    roadStep.road,
    roadStep.t,
    nextLaneOffsetMeters,
  );

  const impactMagnitude = Math.hypot(
    decayedImpactVelocity.x,
    decayedImpactVelocity.z,
  );

  const decayedAngularVelocityRadps = decayScalar(
    vehicle.impactAngularVelocityRadps,
    IMPACT_ANGULAR_DECAY_PER_SECOND,
    deltaSeconds,
  );

  const decayedVisualYawOffsetRad = decayScalar(
    vehicle.visualYawOffsetRad + decayedAngularVelocityRadps * deltaSeconds,
    IMPACT_ROTATION_DECAY_PER_SECOND,
    deltaSeconds,
  );

  const decayedVisualRollRad = decayScalar(
    vehicle.visualRollRad +
      Math.sign(decayedImpactVelocity.x + decayedImpactVelocity.z) *
        Math.min(0.22, impactMagnitude * 0.018),
    IMPACT_ROTATION_DECAY_PER_SECOND,
    deltaSeconds,
  );

  const decayedVisualPitchRad = decayScalar(
    vehicle.visualPitchRad + Math.min(0.16, impactMagnitude * 0.01),
    IMPACT_ROTATION_DECAY_PER_SECOND,
    deltaSeconds,
  );

  const nextCruiseSpeedMps = getNextCruiseSpeedMps(
    vehicle,
    roadStep.road,
    routedToNewSegment,
  );
  const nextRecoveryMps2 = getNextRecoveryMps2(
    vehicle,
    roadStep.road,
    routedToNewSegment,
  );

  return {
    ...vehicle,

    roadId: roadStep.roadId,
    segmentId: roadStep.segmentId,
    segmentIndex: roadStep.segmentIndex,
    previousSegmentId: roadStep.previousSegmentId,
    junctionCooldownSeconds: routedToNewSegment
      ? JUNCTION_COOLDOWN_SECONDS
      : Math.max(0, vehicle.junctionCooldownSeconds - deltaSeconds),

    t: clamp01(roadStep.t),
    directionSign: roadStep.directionSign,
    laneIndex: nextLaneIndex,
    targetLaneIndex: laneTarget.laneIndex,
    targetLaneOffsetMeters: laneTarget.laneOffsetMeters,
    laneChangeDirection,
    laneChangeCooldownSeconds: nextLaneChangeCooldownSeconds,
    turnSignal: nextTurnSignal,
    brakeLightIntensity,
    followingVehicleId: awarenessDecision?.followingVehicleId ?? null,
    laneOffsetMeters: nextLaneOffsetMeters,

    position: {
      x: basePosition.x + nextImpactOffset.x,
      z: basePosition.z + nextImpactOffset.z,
    },

    headingRad: getHomeDriveTrafficHeadingRadians(
      roadStep.road,
      roadStep.directionSign,
    ),

    speedMps: recoveredSpeedMps,
    cruiseSpeedMps: nextCruiseSpeedMps,
    speedRecoveryMps2: nextRecoveryMps2,

    impactOffset: nextImpactOffset,
    impactVelocity: decayedImpactVelocity,
    visualRollRad: decayedVisualRollRad,
    visualPitchRad: decayedVisualPitchRad,
    visualYawOffsetRad: decayedVisualYawOffsetRad,
    impactAngularVelocityRadps: decayedAngularVelocityRadps,
    yieldingToCrosswalkId: crosswalkYield.crosswalkId,
    yieldTimerSeconds: crosswalkYield.crosswalkId
      ? vehicle.yieldTimerSeconds + deltaSeconds
      : Math.max(0, vehicle.yieldTimerSeconds - deltaSeconds * 2),
  };
}

function createTrafficVehicleCandidate(
  road: HomeDriveGeneratedRoadSegment,
  slotIndex: number,
  slotCount: number,
  roadSeed: number,
  roadChance: number,
): TrafficVehicleCandidate {
  const vehicle = createTrafficVehicle(road, slotIndex, slotCount, roadSeed);

  const prioritySeed = hashVector(roadSeed, slotIndex, 599);
  const roadImportance = getTrafficRoadChance(road);
  const normalizedChance = Math.max(0.001, roadChance);

  const priority =
    prioritySeed * 0.72 -
    roadImportance * 0.18 +
    (vehicle.cruiseSpeedMps / MAX_TRAFFIC_CRUISE_SPEED_MPS) * 0.1 +
    normalizedChance * 0.04;

  return {
    vehicle,
    priority,
    segmentLengthMeters: road.length,
  };
}

function getMaxTrafficVehiclesForSegment(
  candidate: TrafficVehicleCandidate,
): number {
  return clamp(Math.floor(candidate.segmentLengthMeters / 118) + 1, 2, 7);
}

function selectTrafficSpawnCandidates(
  candidates: readonly TrafficVehicleCandidate[],
  maxVehicles: number,
): readonly TrafficVehicleCandidate[] {
  const rankedCandidates = candidates
    .slice()
    .sort((first, second) => {
      if (first.priority !== second.priority) {
        return first.priority - second.priority;
      }

      return first.vehicle.id.localeCompare(second.vehicle.id);
    });

  const selected: TrafficVehicleCandidate[] = [];
  const selectedIds = new Set<string>();
  const countBySegmentId = new Map<string, number>();

  for (const candidate of rankedCandidates) {
    if (selected.length >= maxVehicles) {
      break;
    }

    const currentCount = countBySegmentId.get(candidate.vehicle.segmentId) ?? 0;

    if (currentCount >= getMaxTrafficVehiclesForSegment(candidate)) {
      continue;
    }

    selected.push(candidate);
    selectedIds.add(candidate.vehicle.id);
    countBySegmentId.set(candidate.vehicle.segmentId, currentCount + 1);
  }

  if (selected.length >= maxVehicles) {
    return selected;
  }

  for (const candidate of rankedCandidates) {
    if (selected.length >= maxVehicles) {
      break;
    }

    if (selectedIds.has(candidate.vehicle.id)) {
      continue;
    }

    selected.push(candidate);
    selectedIds.add(candidate.vehicle.id);
  }

  return selected;
}

export function createInitialHomeDriveTrafficState(
  options: HomeDriveTrafficGenerationOptions = {},
): HomeDriveTrafficRuntimeState {
  const maxVehicles = options.maxVehicles ?? DEFAULT_MAX_TRAFFIC_VEHICLES;
  const minRoadLengthMeters =
    options.minRoadLengthMeters ?? DEFAULT_MIN_ROAD_LENGTH_METERS;
  const density = options.density ?? DEFAULT_TRAFFIC_DENSITY;

  const roads = getTrafficRoadSegments();
  const candidates: TrafficVehicleCandidate[] = [];

  for (const road of roads) {
    if (road.length < minRoadLengthMeters) {
      continue;
    }

    const roadSeed = getStableRoadSeed(road);
    const roadChance = clamp01(getTrafficRoadChance(road) * density);
    const spacing = getTrafficSlotSpacingMeters(road);
    const slotCount = Math.max(1, Math.floor(road.length / spacing));

    for (let slotIndex = 0; slotIndex < slotCount; slotIndex += 1) {
      const spawnSeed = hashVector(roadSeed, slotIndex, 491);

      if (spawnSeed > roadChance) {
        continue;
      }

      candidates.push(
        createTrafficVehicleCandidate(
          road,
          slotIndex,
          slotCount,
          roadSeed,
          roadChance,
        ),
      );
    }
  }

  const vehicles = selectTrafficSpawnCandidates(candidates, maxVehicles).map(
    (candidate) => candidate.vehicle,
  );

  return {
    vehicles,
    elapsedSeconds: 0,
    lastCollisionAt: -999,
  };
}

export function tickHomeDriveTraffic(
  traffic: HomeDriveTrafficRuntimeState,
  deltaSeconds: number,
  options: HomeDriveTrafficTickOptions = {},
): HomeDriveTrafficRuntimeState {
  if (options.enabled === false || deltaSeconds <= 0) {
    return traffic;
  }

  const roads = getTrafficRoadSegments();
  const topology = getTrafficRoadTopology(roads);

  const awareness = createHomeDriveTrafficAwarenessSnapshot(traffic, roads);
  const movedVehicles = traffic.vehicles.map((vehicle) => {
    const road = getRoadBySegmentId(roads, vehicle.segmentId);

    if (!road) {
      return vehicle;
    }

    return tickTrafficVehicle(
      vehicle,
      road,
      roads,
      topology,
      deltaSeconds,
      options.crosswalks,
      awareness.decisionsByVehicleId.get(vehicle.id),
    );
  });

  return {
    ...traffic,
    elapsedSeconds: traffic.elapsedSeconds + deltaSeconds,
    vehicles: stabilizeHomeDriveTrafficLaneSeparation(movedVehicles, roads),
  };
}
