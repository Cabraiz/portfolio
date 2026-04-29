// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.traffic.ts

import { hashVector } from "./homeDrive.math";
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
import type {
  HomeDriveTrafficGenerationOptions,
  HomeDriveTrafficRuntimeState,
  HomeDriveTrafficTickOptions,
  HomeDriveTrafficVehicle,
  HomeDriveTrafficVehicleColorKey,
  HomeDriveTrafficVehicleKind,
  HomeDriveTrafficVector2,
} from "./homeDrive.traffic.types";

const DEFAULT_MAX_TRAFFIC_VEHICLES = 176;
const DEFAULT_MIN_ROAD_LENGTH_METERS = 90;
const DEFAULT_TRAFFIC_DENSITY = 1.68;

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
 * Espaçamento acompanha parte do tamanho visual para evitar carros grandes
 * nascendo um em cima do outro.
 */
const TRAFFIC_VEHICLE_SPACING_MULTIPLIER = 1.28;

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

type TrafficSpeedProfile = Readonly<{
  minFactor: number;
  maxFactor: number;
  minMps: number;
  maxMps: number;
  accelerationMinMps2: number;
  accelerationMaxMps2: number;
  jitterMps: number;
}>;

type TrafficKindThreshold = Readonly<{
  minSeed: number;
  kind: HomeDriveTrafficVehicleKind;
}>;

type TrafficVehicleCandidate = Readonly<{
  vehicle: HomeDriveTrafficVehicle;
  priority: number;
}>;

type TrafficVehicleDimensions = Readonly<{
  widthMeters: number;
  lengthMeters: number;
  heightMeters: number;
}>;

function defineTrafficKindDistribution(
  distribution: readonly TrafficKindThreshold[],
): readonly TrafficKindThreshold[] {
  return distribution;
}

const DEFAULT_TRAFFIC_KIND_DISTRIBUTION = defineTrafficKindDistribution([
  { minSeed: 0.94, kind: "suv" },
  { minSeed: 0.88, kind: "sport" },
  { minSeed: 0.8, kind: "pickup" },
  { minSeed: 0.68, kind: "taxi" },
  { minSeed: 0.56, kind: "wagon" },
  { minSeed: 0.42, kind: "sedan" },
  { minSeed: 0.2, kind: "hatch" },
  { minSeed: 0, kind: "compact" },
]);

const TRAFFIC_KIND_DISTRIBUTIONS: Readonly<
  Record<string, readonly TrafficKindThreshold[]>
> = {
  service: defineTrafficKindDistribution([
    { minSeed: 0.86, kind: "delivery" },
    { minSeed: 0.68, kind: "truck" },
    { minSeed: 0.46, kind: "pickup" },
    { minSeed: 0, kind: "van" },
  ]),

  coastal: defineTrafficKindDistribution([
    { minSeed: 0.92, kind: "sport" },
    { minSeed: 0.82, kind: "suv" },
    { minSeed: 0.68, kind: "van" },
    { minSeed: 0.52, kind: "sedan" },
    { minSeed: 0.22, kind: "hatch" },
    { minSeed: 0, kind: "compact" },
  ]),

  avenue: defineTrafficKindDistribution([
    { minSeed: 0.94, kind: "bus" },
    { minSeed: 0.86, kind: "microbus" },
    { minSeed: 0.76, kind: "van" },
    { minSeed: 0.66, kind: "delivery" },
    { minSeed: 0.56, kind: "taxi" },
    { minSeed: 0.5, kind: "police" },
    { minSeed: 0.4, kind: "suv" },
    { minSeed: 0.26, kind: "sedan" },
    { minSeed: 0.12, kind: "hatch" },
    { minSeed: 0, kind: "compact" },
  ]),

  ring: defineTrafficKindDistribution([
    { minSeed: 0.9, kind: "truck" },
    { minSeed: 0.8, kind: "sport" },
    { minSeed: 0.68, kind: "suv" },
    { minSeed: 0.58, kind: "police" },
    { minSeed: 0.46, kind: "pickup" },
    { minSeed: 0.3, kind: "wagon" },
    { minSeed: 0.14, kind: "sedan" },
    { minSeed: 0, kind: "compact" },
  ]),

  commercial: defineTrafficKindDistribution([
    { minSeed: 0.86, kind: "delivery" },
    { minSeed: 0.74, kind: "taxi" },
    { minSeed: 0.62, kind: "van" },
    { minSeed: 0.48, kind: "suv" },
    { minSeed: 0.34, kind: "sedan" },
    { minSeed: 0.16, kind: "hatch" },
    { minSeed: 0, kind: "compact" },
  ]),
};

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

function pickTrafficVehicleKind(
  seed: number,
  distribution: readonly TrafficKindThreshold[],
): HomeDriveTrafficVehicleKind {
  const safeSeed = clamp01(seed);

  for (const threshold of distribution) {
    if (safeSeed >= threshold.minSeed) {
      return threshold.kind;
    }
  }

  return distribution[distribution.length - 1]?.kind ?? "compact";
}

function getTrafficVehicleKind(
  road: HomeDriveGeneratedRoadSegment,
  seed: number,
): HomeDriveTrafficVehicleKind {
  const distribution =
    TRAFFIC_KIND_DISTRIBUTIONS[road.kind] ?? DEFAULT_TRAFFIC_KIND_DISTRIBUTION;

  return pickTrafficVehicleKind(seed, distribution);
}

function getTrafficVehicleColor(
  kind: HomeDriveTrafficVehicleKind,
  seed: number,
): HomeDriveTrafficVehicleColorKey {
  const toneSeed = clamp01(seed);

  switch (kind) {
    case "bus":
      if (toneSeed > 0.78) return "cream";
      if (toneSeed > 0.54) return "yellow";
      if (toneSeed > 0.28) return "green";
      return "blue";

    case "microbus":
      if (toneSeed > 0.72) return "green";
      if (toneSeed > 0.48) return "cream";
      if (toneSeed > 0.24) return "silver";
      return "beige";

    case "truck":
      if (toneSeed > 0.82) return "darkBlue";
      if (toneSeed > 0.62) return "blue";
      if (toneSeed > 0.42) return "white";
      if (toneSeed > 0.22) return "orange";
      return "charcoal";

    case "delivery":
      if (toneSeed > 0.84) return "orange";
      if (toneSeed > 0.64) return "cyan";
      if (toneSeed > 0.42) return "white";
      if (toneSeed > 0.22) return "cream";
      return "silver";

    case "police":
      if (toneSeed > 0.72) return "white";
      if (toneSeed > 0.44) return "black";
      if (toneSeed > 0.22) return "darkBlue";
      return "silver";

    case "taxi":
      if (toneSeed > 0.82) return "cream";
      if (toneSeed > 0.16) return "yellow";
      return "white";

    case "sport":
      if (toneSeed > 0.86) return "orange";
      if (toneSeed > 0.68) return "darkRed";
      if (toneSeed > 0.5) return "purple";
      if (toneSeed > 0.32) return "blue";
      if (toneSeed > 0.14) return "red";
      return "black";

    case "suv":
      if (toneSeed > 0.82) return "darkBlue";
      if (toneSeed > 0.64) return "brown";
      if (toneSeed > 0.46) return "black";
      if (toneSeed > 0.28) return "silver";
      if (toneSeed > 0.12) return "beige";
      return "white";

    case "pickup":
      if (toneSeed > 0.8) return "orange";
      if (toneSeed > 0.62) return "charcoal";
      if (toneSeed > 0.44) return "black";
      if (toneSeed > 0.26) return "silver";
      return "brown";

    case "van":
      if (toneSeed > 0.78) return "cyan";
      if (toneSeed > 0.58) return "white";
      if (toneSeed > 0.38) return "cream";
      if (toneSeed > 0.18) return "silver";
      return "green";

    case "wagon":
      if (toneSeed > 0.76) return "lime";
      if (toneSeed > 0.56) return "darkBlue";
      if (toneSeed > 0.36) return "blue";
      if (toneSeed > 0.18) return "beige";
      return "white";

    case "hatch":
      if (toneSeed > 0.84) return "lime";
      if (toneSeed > 0.66) return "orange";
      if (toneSeed > 0.48) return "cyan";
      if (toneSeed > 0.3) return "red";
      if (toneSeed > 0.14) return "blue";
      return "white";

    case "sedan":
      if (toneSeed > 0.86) return "darkRed";
      if (toneSeed > 0.7) return "darkBlue";
      if (toneSeed > 0.54) return "silver";
      if (toneSeed > 0.38) return "beige";
      if (toneSeed > 0.2) return "white";
      return "black";

    case "compact":
    default:
      if (toneSeed > 0.88) return "lime";
      if (toneSeed > 0.74) return "cyan";
      if (toneSeed > 0.58) return "orange";
      if (toneSeed > 0.42) return "red";
      if (toneSeed > 0.26) return "blue";
      if (toneSeed > 0.12) return "white";
      return "silver";
  }
}

function getTrafficVehicleDimensions(
  kind: HomeDriveTrafficVehicleKind,
  seed: number,
): TrafficVehicleDimensions {
  switch (kind) {
    case "bus":
      return scaleTrafficVehicleDimensions({ widthMeters: 3.55, lengthMeters: 14.85 + seed * 1.55, heightMeters: 3.95 });
    case "microbus":
      return scaleTrafficVehicleDimensions({ widthMeters: 3.32, lengthMeters: 10.4 + seed * 1.1, heightMeters: 3.58 });
    case "truck":
      return scaleTrafficVehicleDimensions({ widthMeters: 3.72, lengthMeters: 12.8 + seed * 1.8, heightMeters: 4.1 });
    case "delivery":
      return scaleTrafficVehicleDimensions({ widthMeters: 3.18, lengthMeters: 8.28 + seed * 0.88, heightMeters: 3.18 });
    case "van":
      return scaleTrafficVehicleDimensions({ widthMeters: 3.05, lengthMeters: 7.42 + seed * 0.95, heightMeters: 3.05 });
    case "pickup":
      return scaleTrafficVehicleDimensions({ widthMeters: 2.92, lengthMeters: 7.28 + seed * 0.82, heightMeters: 2.52 });
    case "suv":
      return scaleTrafficVehicleDimensions({ widthMeters: 3.08, lengthMeters: 7.12 + seed * 0.72, heightMeters: 2.62 });
    case "police":
      return scaleTrafficVehicleDimensions({ widthMeters: 2.86, lengthMeters: 6.44 + seed * 0.58, heightMeters: 2.18 });
    case "taxi":
      return scaleTrafficVehicleDimensions({ widthMeters: 2.74, lengthMeters: 6.32 + seed * 0.52, heightMeters: 2.12 });
    case "sport":
      return scaleTrafficVehicleDimensions({ widthMeters: 2.78, lengthMeters: 6.08 + seed * 0.56, heightMeters: 1.72 });
    case "wagon":
      return scaleTrafficVehicleDimensions({ widthMeters: 2.78, lengthMeters: 6.72 + seed * 0.56, heightMeters: 2.08 });
    case "hatch":
      return scaleTrafficVehicleDimensions({ widthMeters: 2.62, lengthMeters: 5.72 + seed * 0.48, heightMeters: 2.02 });
    case "sedan":
      return scaleTrafficVehicleDimensions({ widthMeters: 2.72, lengthMeters: 6.22 + seed * 0.58, heightMeters: 2.08 });
    case "compact":
    default:
      return scaleTrafficVehicleDimensions({ widthMeters: 2.54, lengthMeters: 5.42 + seed * 0.52, heightMeters: 1.98 });
  }
}

function getVehicleSpeedMultiplier(
  kind: HomeDriveTrafficVehicleKind,
): number {
  switch (kind) {
    case "truck": return 0.66;
    case "microbus": return 0.74;
    case "bus": return 0.82;
    case "delivery": return 0.82;
    case "van": return 0.92;
    case "suv": return 0.96;
    case "pickup": return 1;
    case "wagon": return 1.04;
    case "sedan": return 1.06;
    case "taxi": return 1.08;
    case "hatch": return 1.12;
    case "police": return 1.16;
    case "sport": return 1.22;
    case "compact":
    default:
      return 1.1;
  }
}

function getVehicleAccelerationMultiplier(
  kind: HomeDriveTrafficVehicleKind,
): number {
  switch (kind) {
    case "truck": return 0.52;
    case "microbus": return 0.64;
    case "bus": return 0.68;
    case "delivery": return 0.78;
    case "van": return 0.82;
    case "pickup": return 0.92;
    case "suv": return 0.92;
    case "wagon": return 1.02;
    case "sedan": return 1.08;
    case "taxi": return 1.08;
    case "hatch": return 1.12;
    case "police": return 1.18;
    case "sport": return 1.32;
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
): number {
  /*
    Hitbox de gameplay, não raio físico perfeito.

    Como os carros agora podem ser aumentados por TRAFFIC_VEHICLE_SIZE_MULTIPLIER,
    o teto da colisão também acompanha a escala. Sem isso, o carro ficaria grande
    visualmente, mas com bolha de colisão pequena.
  */
  const gameplayRadius =
    Math.hypot(widthMeters * 0.46, lengthMeters * 0.24) *
    TRAFFIC_VEHICLE_COLLISION_RADIUS_MULTIPLIER;

  const minRadius = 1.08 * Math.min(TRAFFIC_VEHICLE_SIZE_MULTIPLIER, 1.35);
  const maxRadius = 3.15 * TRAFFIC_VEHICLE_SIZE_MULTIPLIER;

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
  const kindSeed = hashVector(roadSeed, slotIndex, 521);
  const colorSeed = hashVector(roadSeed, slotIndex, 523);
  const dimensionSeed = hashVector(roadSeed, slotIndex, 541);
  const speedSeed = hashVector(roadSeed, slotIndex, 547);
  const variantSeed = hashVector(roadSeed, slotIndex, 557);
  const speedJitterSeed = hashVector(roadSeed, slotIndex, 569);
  const accelerationSeed = hashVector(roadSeed, slotIndex, 571);
  const initialSpeedSeed = hashVector(roadSeed, slotIndex, 577);

  const t =
    slotCount <= 1
      ? 0.5
      : clamp01((slotIndex + 0.18 + tSeed * 0.64) / slotCount);

  const kind = getTrafficVehicleKind(road, kindSeed);
  const dimensions = getTrafficVehicleDimensions(kind, dimensionSeed);

  const position = getPositionOnTrafficRoad(
    road,
    t,
    lane.laneOffsetMeters,
  );

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
    kind,
    colorKey: getTrafficVehicleColor(kind, colorSeed),

    roadId: road.roadId,
    segmentId: road.id,
    segmentIndex: road.segmentIndex,
    previousSegmentId: null,
    routeSeed: getTrafficVehicleRouteSeed(roadSeed, slotIndex),
    junctionCooldownSeconds: 0,

    t,
    directionSign: lane.directionSign,
    laneIndex: lane.laneIndex,
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

  return getTrafficVehicleRecoveryMps2(
    road,
    vehicle.kind,
    accelerationSeed,
  );
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

function tickTrafficVehicle(
  vehicle: HomeDriveTrafficVehicle,
  road: HomeDriveGeneratedRoadSegment,
  roads: readonly HomeDriveGeneratedRoadSegment[],
  topology: HomeDriveRoadTopology,
  deltaSeconds: number,
): HomeDriveTrafficVehicle {
  if (road.length <= MIN_ROAD_LENGTH_METERS) {
    return vehicle;
  }

  const recoveredSpeedMps = getRecoveredVehicleSpeedMps(
    vehicle,
    road,
    deltaSeconds,
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

  const basePosition = getPositionOnTrafficRoad(
    roadStep.road,
    roadStep.t,
    roadStep.laneOffsetMeters,
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

  const routedToNewSegment = roadStep.segmentId !== vehicle.segmentId;
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
    laneIndex: roadStep.laneIndex,
    laneOffsetMeters: roadStep.laneOffsetMeters,

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
  };
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

  const vehicles = candidates
    .sort((first, second) => {
      if (first.priority !== second.priority) {
        return first.priority - second.priority;
      }

      return first.vehicle.id.localeCompare(second.vehicle.id);
    })
    .slice(0, maxVehicles)
    .map((candidate) => candidate.vehicle);

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

  return {
    ...traffic,
    elapsedSeconds: traffic.elapsedSeconds + deltaSeconds,
    vehicles: traffic.vehicles.map((vehicle) => {
      const road = getRoadBySegmentId(roads, vehicle.segmentId);

      if (!road) {
        return vehicle;
      }

      return tickTrafficVehicle(vehicle, road, roads, topology, deltaSeconds);
    }),
  };
}
