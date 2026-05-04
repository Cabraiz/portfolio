// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.trafficIntersectionFlow.ts

import type { HomeDriveCrosswalkRuntimeState } from "./crosswalks";
import {
  getHomeDriveRoadEndpointCutKey,
  type HomeDriveRoadEndpointSide,
  type HomeDriveRoadTopology,
} from "./homeDrive.roadTopology";
import {
  getHomeDriveTrafficHeadingOnRoad,
  getHomeDriveTrafficPositionOnRoad,
  resolveHomeDriveTrafficRoadStep,
} from "./homeDrive.trafficRouter";
import type {
  HomeDriveTrafficVehicle,
  HomeDriveTrafficVector2,
} from "./homeDrive.traffic.types";
import type { HomeDriveVector2 } from "./homeDrive.types";
import type { HomeDriveGeneratedRoadSegment } from "./homeDrive.worldMap.types";

export type HomeDriveTrafficIntersectionFlowOptions = Readonly<{
  elapsedSeconds: number;
  activeCenter?: HomeDriveVector2;
  activeHeadingRad?: number;
  crosswalks?: HomeDriveCrosswalkRuntimeState;
  enabled?: boolean;
  maxRepairsPerTick?: number;
}>;

type HoldZoneKind = "endpoint" | "crosswalk";

type HoldZoneRef = Readonly<{
  key: string;
  kind: HoldZoneKind;
  targetT: number;
  exitEndpointSide: HomeDriveRoadEndpointSide | null;
}>;

type HoldZoneItem = Readonly<{
  index: number;
  vehicle: HomeDriveTrafficVehicle;
  road: HomeDriveGeneratedRoadSegment;
  zone: HoldZoneRef;
  distanceToPlayerMeters: number;
  forwardProgress: number;
}>;

const HOLD_ZONE_SPEED_MPS = 2.15;
const HARD_STOP_SPEED_MPS = 0.72;
const ENDPOINT_HOLD_DISTANCE_METERS = 36;
const CROSSWALK_HOLD_BEHIND_METERS = 44;
const CROSSWALK_HOLD_AHEAD_METERS = 8;
const HOLD_CLUSTER_MIN_SIZE = 5;
const HOLD_CLUSTER_MIN_STOPPED = 3;
const KEEP_NEAR_PLAYER_METERS = 52;
const MAX_DEFAULT_REPAIRS_PER_TICK = 18;
const RELEASE_CLEARANCE_METERS = 34;
const RELEASE_STAGGER_METERS = 16;
const RELEASE_MIN_SPEED_MPS = 5.6;
const RELEASE_LANE_CHANGE_COOLDOWN_SECONDS = 0.28;
const RELEASE_JUNCTION_COOLDOWN_SECONDS = 0.42;
const RECENT_DAMAGE_PROTECTION_SECONDS = 2.4;
const MIN_ROAD_LENGTH_METERS = 0.000001;

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

function getNumber(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function getDistanceMeters(
  first: HomeDriveVector2,
  second: HomeDriveVector2,
): number {
  return Math.hypot(first.x - second.x, first.z - second.z);
}

function getZeroTrafficVector(): HomeDriveTrafficVector2 {
  return { x: 0, z: 0 };
}

function getForwardProgress(vehicle: HomeDriveTrafficVehicle): number {
  const t = clamp01(getNumber(vehicle.t, 0.5));

  return vehicle.directionSign === 1 ? t : 1 - t;
}

function getExitEndpointSide(
  vehicle: HomeDriveTrafficVehicle,
): HomeDriveRoadEndpointSide {
  return vehicle.directionSign === 1 ? "to" : "from";
}

function getDistanceToExitEndpointMeters(
  vehicle: HomeDriveTrafficVehicle,
  road: HomeDriveGeneratedRoadSegment,
): number {
  const progress = getForwardProgress(vehicle);

  return Math.max(0, (1 - progress) * Math.max(MIN_ROAD_LENGTH_METERS, road.length));
}

function getEndpointHoldZone(
  vehicle: HomeDriveTrafficVehicle,
  road: HomeDriveGeneratedRoadSegment,
): HoldZoneRef | null {
  const distanceMeters = getDistanceToExitEndpointMeters(vehicle, road);

  if (distanceMeters > ENDPOINT_HOLD_DISTANCE_METERS) {
    return null;
  }

  const side = getExitEndpointSide(vehicle);
  const key = `endpoint:${getHomeDriveRoadEndpointCutKey(road, side)}`;

  return {
    key,
    kind: "endpoint",
    targetT: side === "to" ? 1 : 0,
    exitEndpointSide: side,
  };
}

function getCrosswalkHoldZone(
  vehicle: HomeDriveTrafficVehicle,
  road: HomeDriveGeneratedRoadSegment,
  crosswalks: HomeDriveCrosswalkRuntimeState | undefined,
): HoldZoneRef | null {
  if (!crosswalks) {
    return null;
  }

  let best: HoldZoneRef | null = null;
  let bestAbsDistanceMeters = Number.POSITIVE_INFINITY;

  for (const crosswalk of crosswalks.crosswalks) {
    if (crosswalk.segmentId !== vehicle.segmentId) {
      continue;
    }

    if (!crosswalk.hasYieldControl && crosswalk.signalPhase === "off") {
      continue;
    }

    const signedDistanceMeters =
      (crosswalk.t - vehicle.t) * vehicle.directionSign *
      Math.max(MIN_ROAD_LENGTH_METERS, road.length);

    if (
      signedDistanceMeters < -CROSSWALK_HOLD_AHEAD_METERS ||
      signedDistanceMeters > CROSSWALK_HOLD_BEHIND_METERS
    ) {
      continue;
    }

    const absDistanceMeters = Math.abs(signedDistanceMeters);

    if (absDistanceMeters < bestAbsDistanceMeters) {
      bestAbsDistanceMeters = absDistanceMeters;
      best = {
        key: `crosswalk:${crosswalk.id}`,
        kind: "crosswalk",
        targetT: crosswalk.t,
        exitEndpointSide: null,
      };
    }
  }

  return best;
}

function getHoldZoneForVehicle(
  vehicle: HomeDriveTrafficVehicle,
  road: HomeDriveGeneratedRoadSegment,
  crosswalks: HomeDriveCrosswalkRuntimeState | undefined,
): HoldZoneRef | null {
  const crosswalkZone = getCrosswalkHoldZone(vehicle, road, crosswalks);

  if (crosswalkZone) {
    return crosswalkZone;
  }

  return getEndpointHoldZone(vehicle, road);
}

function isVehiclePotentiallyBlocked(vehicle: HomeDriveTrafficVehicle): boolean {
  return (
    vehicle.speedMps <= HOLD_ZONE_SPEED_MPS ||
    Boolean(vehicle.yieldingToCrosswalkId) ||
    Boolean(vehicle.followingVehicleId) ||
    vehicle.brakeLightIntensity > 0.55
  );
}

function createVehicleAtRoadProgress(params: Readonly<{
  vehicle: HomeDriveTrafficVehicle;
  road: HomeDriveGeneratedRoadSegment;
  t: number;
  previousSegmentId: string | null;
  minSpeedMps: number;
}>): HomeDriveTrafficVehicle {
  const t = clamp01(params.t);
  const position = getHomeDriveTrafficPositionOnRoad(
    params.road,
    t,
    params.vehicle.laneOffsetMeters,
  );
  const speedMps = Math.max(
    getNumber(params.vehicle.speedMps, 0),
    Math.min(
      getNumber(params.vehicle.cruiseSpeedMps, params.minSpeedMps),
      params.minSpeedMps,
    ),
  );

  return {
    ...params.vehicle,
    roadId: params.road.roadId,
    segmentId: params.road.id,
    segmentIndex: params.road.segmentIndex,
    previousSegmentId: params.previousSegmentId,
    junctionCooldownSeconds: RELEASE_JUNCTION_COOLDOWN_SECONDS,
    t,
    laneIndex: params.vehicle.laneIndex,
    targetLaneIndex: params.vehicle.laneIndex,
    targetLaneOffsetMeters: params.vehicle.laneOffsetMeters,
    laneChangeDirection: 0,
    laneChangeCooldownSeconds: RELEASE_LANE_CHANGE_COOLDOWN_SECONDS,
    turnSignal: null,
    brakeLightIntensity: 0,
    followingVehicleId: null,
    position: {
      x: position.x,
      z: position.z,
    },
    headingRad: getHomeDriveTrafficHeadingOnRoad(
      params.road,
      params.vehicle.directionSign,
    ),
    speedMps,
    impactOffset: getZeroTrafficVector(),
    impactVelocity: getZeroTrafficVector(),
    visualRollRad: 0,
    visualPitchRad: 0,
    visualYawOffsetRad: 0,
    impactAngularVelocityRadps: 0,
    yieldingToCrosswalkId: null,
    yieldTimerSeconds: 0,
  };
}

function createVehicleFromRoadStep(params: Readonly<{
  vehicle: HomeDriveTrafficVehicle;
  step: ReturnType<typeof resolveHomeDriveTrafficRoadStep>;
  minSpeedMps: number;
}>): HomeDriveTrafficVehicle {
  const position = getHomeDriveTrafficPositionOnRoad(
    params.step.road,
    params.step.t,
    params.step.laneOffsetMeters,
  );
  const speedMps = Math.max(
    getNumber(params.vehicle.speedMps, 0),
    Math.min(
      getNumber(params.vehicle.cruiseSpeedMps, params.minSpeedMps),
      params.minSpeedMps,
    ),
  );

  return {
    ...params.vehicle,
    roadId: params.step.roadId,
    segmentId: params.step.segmentId,
    segmentIndex: params.step.segmentIndex,
    previousSegmentId: params.step.previousSegmentId,
    junctionCooldownSeconds: RELEASE_JUNCTION_COOLDOWN_SECONDS,
    t: clamp01(params.step.t),
    directionSign: params.step.directionSign,
    laneIndex: params.step.laneIndex,
    targetLaneIndex: params.step.laneIndex,
    targetLaneOffsetMeters: params.step.laneOffsetMeters,
    laneChangeDirection: 0,
    laneChangeCooldownSeconds: RELEASE_LANE_CHANGE_COOLDOWN_SECONDS,
    turnSignal: null,
    brakeLightIntensity: 0,
    followingVehicleId: null,
    laneOffsetMeters: params.step.laneOffsetMeters,
    position: {
      x: position.x,
      z: position.z,
    },
    headingRad: getHomeDriveTrafficHeadingOnRoad(
      params.step.road,
      params.step.directionSign,
    ),
    speedMps,
    impactOffset: getZeroTrafficVector(),
    impactVelocity: getZeroTrafficVector(),
    visualRollRad: 0,
    visualPitchRad: 0,
    visualYawOffsetRad: 0,
    impactAngularVelocityRadps: 0,
    yieldingToCrosswalkId: null,
    yieldTimerSeconds: 0,
  };
}

function releaseVehicleFromHoldZone(params: Readonly<{
  item: HoldZoneItem;
  vehicles: readonly HomeDriveTrafficVehicle[];
  roads: readonly HomeDriveGeneratedRoadSegment[];
  topology: HomeDriveRoadTopology;
  releaseIndex: number;
}>): HomeDriveTrafficVehicle {
  const { item, releaseIndex } = params;
  const roadLength = Math.max(MIN_ROAD_LENGTH_METERS, item.road.length);
  const releaseMeters = RELEASE_CLEARANCE_METERS + releaseIndex * RELEASE_STAGGER_METERS;
  const deltaT = (releaseMeters / roadLength) * item.vehicle.directionSign;
  const targetT = item.zone.targetT + deltaT;
  const minSpeedMps = RELEASE_MIN_SPEED_MPS + Math.min(3.4, releaseIndex * 0.32);

  if (targetT > 0.035 && targetT < 0.965) {
    return createVehicleAtRoadProgress({
      vehicle: item.vehicle,
      road: item.road,
      t: targetT,
      previousSegmentId: item.vehicle.previousSegmentId,
      minSpeedMps,
    });
  }

  const step = resolveHomeDriveTrafficRoadStep({
    roads: params.roads,
    topology: params.topology,
    vehicle: item.vehicle,
    currentRoad: item.road,
    nextT: targetT,
    routeSeed: item.vehicle.routeSeed + releaseIndex * 17,
  });

  return createVehicleFromRoadStep({
    vehicle: item.vehicle,
    step,
    minSpeedMps,
  });
}

function shouldKeepVehicleInVisibleQueue(
  item: HoldZoneItem,
  keptCount: number,
): boolean {
  /*
    Mesmo perto do player não dá para preservar a fila inteira. Se todos ficam
    protegidos por visibilidade, o cruzamento vira um estacionamento. Mantém só
    os carros necessários para a cena ainda parecer natural e libera o restante.
  */
  if (keptCount < 2) {
    return true;
  }

  return item.distanceToPlayerMeters <= KEEP_NEAR_PLAYER_METERS * 0.58 && keptCount < 3;
}

export function repairHomeDriveTrafficIntersectionAccumulation(params: Readonly<{
  vehicles: readonly HomeDriveTrafficVehicle[];
  roads: readonly HomeDriveGeneratedRoadSegment[];
  roadsBySegmentId: ReadonlyMap<string, HomeDriveGeneratedRoadSegment>;
  topology: HomeDriveRoadTopology;
  options: HomeDriveTrafficIntersectionFlowOptions;
}>): readonly HomeDriveTrafficVehicle[] {
  if (params.options.enabled === false) {
    return params.vehicles;
  }

  const activeCenter = params.options.activeCenter;
  const buckets = new Map<string, HoldZoneItem[]>();

  params.vehicles.forEach((vehicle, index) => {
    if (
      params.options.elapsedSeconds - vehicle.lastCollisionAt <=
      RECENT_DAMAGE_PROTECTION_SECONDS
    ) {
      return;
    }

    const road = params.roadsBySegmentId.get(vehicle.segmentId);

    if (!road || road.length <= MIN_ROAD_LENGTH_METERS) {
      return;
    }

    if (!isVehiclePotentiallyBlocked(vehicle)) {
      return;
    }

    const zone = getHoldZoneForVehicle(
      vehicle,
      road,
      params.options.crosswalks,
    );

    if (!zone) {
      return;
    }

    const item: HoldZoneItem = {
      index,
      vehicle,
      road,
      zone,
      distanceToPlayerMeters: activeCenter
        ? getDistanceMeters(vehicle.position, activeCenter)
        : Number.POSITIVE_INFINITY,
      forwardProgress: getForwardProgress(vehicle),
    };

    const bucket = buckets.get(zone.key);

    if (bucket) {
      bucket.push(item);
    } else {
      buckets.set(zone.key, [item]);
    }
  });

  let changed = false;
  let repairs = 0;
  const maxRepairs = Math.max(
    0,
    params.options.maxRepairsPerTick ?? MAX_DEFAULT_REPAIRS_PER_TICK,
  );
  const nextVehicles = params.vehicles.slice();

  for (const bucket of buckets.values()) {
    if (repairs >= maxRepairs || bucket.length < HOLD_CLUSTER_MIN_SIZE) {
      continue;
    }

    const stoppedCount = bucket.filter(
      (item) => item.vehicle.speedMps <= HARD_STOP_SPEED_MPS,
    ).length;

    if (stoppedCount < HOLD_CLUSTER_MIN_STOPPED) {
      continue;
    }

    bucket.sort((first, second) => {
      if (first.distanceToPlayerMeters !== second.distanceToPlayerMeters) {
        return first.distanceToPlayerMeters - second.distanceToPlayerMeters;
      }

      return second.forwardProgress - first.forwardProgress;
    });

    let kept = 0;
    let releaseIndex = 0;

    for (const item of bucket) {
      if (repairs >= maxRepairs) {
        break;
      }

      if (shouldKeepVehicleInVisibleQueue(item, kept)) {
        kept += 1;
        continue;
      }

      nextVehicles[item.index] = releaseVehicleFromHoldZone({
        item,
        vehicles: nextVehicles,
        roads: params.roads,
        topology: params.topology,
        releaseIndex,
      });
      releaseIndex += 1;
      repairs += 1;
      changed = true;
    }
  }

  return changed ? nextVehicles : params.vehicles;
}
