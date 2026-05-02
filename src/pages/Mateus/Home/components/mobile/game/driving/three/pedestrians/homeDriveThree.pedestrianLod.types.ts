// src/pages/Mateus/Home/components/mobile/game/driving/three/pedestrians/homeDriveThree.pedestrianLod.types.ts

import type { HomeDriveThreePedestrianDetailLevel } from "./HomeDriveThreePedestrianAgent";

export type HomeDriveThreePedestrianLodLevel = HomeDriveThreePedestrianDetailLevel;

export type HomeDriveThreePedestrianLodConfig = Readonly<{
  fullDetailRadiusMeters: number;
  mediumDetailRadiusMeters: number;
}>;

export type HomeDriveThreePedestrianLodResult = HomeDriveThreePedestrianLodLevel | null;
