// src/pages/Mateus/Home/components/mobile/game/driving/three/pedestrians/homeDriveThree.pedestrianLod.ts

import { HOME_DRIVE_PEDESTRIAN_CROWD_TUNING } from "../../domain/pedestrians/homeDrive.pedestrianCrowdTuning";
import type {
  HomeDriveThreePedestrianLodConfig,
  HomeDriveThreePedestrianLodResult,
} from "./homeDriveThree.pedestrianLod.types";

function normalizeLodConfig(
  config: HomeDriveThreePedestrianLodConfig,
): HomeDriveThreePedestrianLodConfig {
  const fullDetailRadiusMeters = Math.max(
    HOME_DRIVE_PEDESTRIAN_CROWD_TUNING.lod.fullDetailRadiusMinMeters,
    config.fullDetailRadiusMeters,
  );
  const mediumDetailRadiusMeters = Math.max(
    fullDetailRadiusMeters,
    HOME_DRIVE_PEDESTRIAN_CROWD_TUNING.lod.mediumDetailRadiusMinMeters,
    config.mediumDetailRadiusMeters,
  );

  return {
    fullDetailRadiusMeters,
    mediumDetailRadiusMeters,
  };
}

export function getHomeDriveThreePedestrianLodForDistance(
  distanceSquared: number,
  config: HomeDriveThreePedestrianLodConfig,
): HomeDriveThreePedestrianLodResult {
  const normalizedConfig = normalizeLodConfig(config);
  const distanceMeters = Math.sqrt(Math.max(0, distanceSquared));

  if (
    distanceSquared <=
    normalizedConfig.fullDetailRadiusMeters *
      normalizedConfig.fullDetailRadiusMeters
  ) {
    return {
      detailLevel: "full",
      distanceSquared,
      distanceMeters,
    };
  }

  if (
    distanceSquared <=
    normalizedConfig.mediumDetailRadiusMeters *
      normalizedConfig.mediumDetailRadiusMeters
  ) {
    return {
      detailLevel: "medium",
      distanceSquared,
      distanceMeters,
    };
  }

  return {
    detailLevel: "proxy",
    distanceSquared,
    distanceMeters,
  };
}
