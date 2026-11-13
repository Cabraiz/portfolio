// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.trafficIntersectionFlow.ts

import type { HomeDriveCrosswalkRuntimeState } from "./crosswalks";
import type { HomeDriveRoadTopology } from "./homeDrive.roadTopology";

import type { HomeDriveTrafficVehicle } from "./homeDrive.traffic.types";
import type { HomeDriveVector2 } from "./homeDrive.types";
import type { HomeDriveGeneratedRoadSegment } from "./homeDrive.worldMap.types";
import {
  RECENT_DAMAGE_PROTECTION_SECONDS,
  MIN_ROAD_LENGTH_METERS,
  isVehiclePotentiallyBlocked,
  getHoldZoneForVehicle,
  getDistanceMeters,
  getForwardProgress,
  MAX_DEFAULT_REPAIRS_PER_TICK,
  HOLD_CLUSTER_MIN_SIZE,
  HARD_STOP_SPEED_MPS,
  HOLD_CLUSTER_MIN_STOPPED,
} from "./homeDrive.trafficIntersectionFlow.holdZones";
import type {
  HoldZoneItem,
} from "./homeDrive.trafficIntersectionFlow.holdZones";
import {
  shouldKeepVehicleInVisibleQueue,
  releaseVehicleFromHoldZone,
} from "./homeDrive.trafficIntersectionFlow.release";

export type HomeDriveTrafficIntersectionFlowOptions = Readonly<{
  elapsedSeconds: number;
  activeCenter?: HomeDriveVector2;
  activeHeadingRad?: number;
  crosswalks?: HomeDriveCrosswalkRuntimeState;
  enabled?: boolean;
  maxRepairsPerTick?: number;
}>;

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
