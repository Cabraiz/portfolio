// src/pages/Mateus/Home/components/mobile/game/driving/domain/urbanFixtures/homeDrive.urbanFixtures.ts

import { resolveHomeDriveCrosswalkSignalPhase } from "../crosswalks";
import type { HomeDriveCrosswalk } from "../crosswalks";
import { hashVector } from "../homeDrive.math";
import type { HomeDriveVector2 } from "../homeDrive.types";
import type {
  HomeDriveUrbanFixtureDistanceSortItem,
  HomeDriveUrbanFixtureSide,
  HomeDriveUrbanTrafficLight,
} from "./homeDrive.urbanFixtures.types";
import { clamp, normalizeVector2 } from "./homeDrive.urbanFixtures.math";
export { createHomeDriveUrbanStreetLights } from "./homeDrive.urbanFixtures.streetLights";

const TRAFFIC_LIGHT_CURB_CLEARANCE_METERS = 1.25;

function getTrafficLightOffsetFromRoadCenterMeters(
  crosswalk: HomeDriveCrosswalk,
): number {
  return (
    crosswalk.roadWidthMeters / 2 +
    crosswalk.sidewalkReachMeters * 0.86 +
    TRAFFIC_LIGHT_CURB_CLEARANCE_METERS
  );
}

function createTrafficLightForCrosswalkSide(
  crosswalk: HomeDriveCrosswalk,
  side: HomeDriveUrbanFixtureSide,
  elapsedSeconds: number,
): HomeDriveUrbanTrafficLight {
  const signalPhase = resolveHomeDriveCrosswalkSignalPhase(
    crosswalk,
    elapsedSeconds,
  );
  const roadNormal = normalizeVector2(crosswalk.roadNormal);
  const roadDirection = normalizeVector2(crosswalk.roadDirection);
  const sideOffset = getTrafficLightOffsetFromRoadCenterMeters(crosswalk);
  const forwardSign = side > 0 ? 1 : -1;
  const forwardOffset = crosswalk.lengthMeters * 0.72 + 1.8;
  const seed = hashVector(Math.floor(crosswalk.seed * 100000), side * 97, 1091);

  return {
    id: `traffic-light-${crosswalk.id}-${side}`,
    crosswalkId: crosswalk.id,
    roadId: crosswalk.roadId,
    segmentId: crosswalk.segmentId,
    districtId: crosswalk.districtId,
    position: {
      x:
        crosswalk.position.x +
        roadNormal.x * sideOffset * side +
        roadDirection.x * forwardOffset * forwardSign,
      z:
        crosswalk.position.z +
        roadNormal.z * sideOffset * side +
        roadDirection.z * forwardOffset * forwardSign,
    },
    roadDirection,
    roadNormal,
    side,
    signalPhase,
    heightMeters: 4.7 + seed * 0.34,
    poleRadiusMeters: 0.105,
    armLengthMeters: clamp(3.1 + crosswalk.roadWidthMeters * 0.11, 3.4, 5.6),
    housingHeightMeters: 1.22,
    seed,
  };
}

export function createHomeDriveUrbanTrafficLights(
  crosswalks: readonly HomeDriveCrosswalk[],
  elapsedSeconds: number,
): readonly HomeDriveUrbanTrafficLight[] {
  const lights: HomeDriveUrbanTrafficLight[] = [];

  for (const crosswalk of crosswalks) {
    if (!crosswalk.hasYieldControl || crosswalk.signalPhase === "off") {
      continue;
    }

    lights.push(createTrafficLightForCrosswalkSide(crosswalk, -1, elapsedSeconds));
    lights.push(createTrafficLightForCrosswalkSide(crosswalk, 1, elapsedSeconds));
  }

  return lights;
}

function getDistanceSq(position: HomeDriveVector2, center: HomeDriveVector2): number {
  const dx = position.x - center.x;
  const dz = position.z - center.z;

  return dx * dx + dz * dz;
}

export function selectHomeDriveUrbanFixturesNearPoint<TFixture extends Readonly<{ id: string; position: HomeDriveVector2 }>>(
  fixtures: readonly TFixture[],
  center: HomeDriveVector2,
  visibleRadiusMeters: number,
  maxFixtures: number,
): readonly TFixture[] {
  const maxDistanceSq = visibleRadiusMeters * visibleRadiusMeters;

  return fixtures
    .map<HomeDriveUrbanFixtureDistanceSortItem<TFixture>>((fixture) => ({
      fixture,
      distanceSq: getDistanceSq(fixture.position, center),
    }))
    .filter((item) => item.distanceSq <= maxDistanceSq)
    .sort((first, second) => {
      if (first.distanceSq !== second.distanceSq) {
        return first.distanceSq - second.distanceSq;
      }

      return first.fixture.id.localeCompare(second.fixture.id);
    })
    .slice(0, Math.max(0, maxFixtures))
    .map((item) => item.fixture);
}
