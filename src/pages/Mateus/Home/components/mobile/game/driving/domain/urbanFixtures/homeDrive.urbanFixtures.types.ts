// src/pages/Mateus/Home/components/mobile/game/driving/domain/urbanFixtures/homeDrive.urbanFixtures.types.ts

import type { HomeDriveCrosswalkSignalPhase } from "../crosswalks";
import type { HomeDriveVector2 } from "../homeDrive.types";

export type HomeDriveUrbanFixtureSide = -1 | 1;

export type HomeDriveUrbanStreetLightStyle =
  | "modern"
  | "curved"
  | "banner"
  | "coastal";

export type HomeDriveUrbanStreetLight = Readonly<{
  id: string;
  roadId: string;
  segmentId: string;
  districtId: string;
  position: HomeDriveVector2;
  roadDirection: HomeDriveVector2;
  roadNormal: HomeDriveVector2;
  side: HomeDriveUrbanFixtureSide;
  heightMeters: number;
  poleRadiusMeters: number;
  armLengthMeters: number;
  lampWidthMeters: number;
  style: HomeDriveUrbanStreetLightStyle;
  seed: number;
}>;

export type HomeDriveUrbanTrafficLight = Readonly<{
  id: string;
  crosswalkId: string;
  roadId: string;
  segmentId: string;
  districtId: string;
  position: HomeDriveVector2;
  roadDirection: HomeDriveVector2;
  roadNormal: HomeDriveVector2;
  side: HomeDriveUrbanFixtureSide;
  signalPhase: HomeDriveCrosswalkSignalPhase;
  heightMeters: number;
  poleRadiusMeters: number;
  armLengthMeters: number;
  housingHeightMeters: number;
  seed: number;
}>;

export type HomeDriveUrbanStreetLightGenerationOptions = Readonly<{
  density?: number;
  maxLights?: number;
  minRoadLengthMeters?: number;
  seed?: number;
}>;

export type HomeDriveUrbanFixtureDistanceSortItem<TFixture> = Readonly<{
  fixture: TFixture;
  distanceSq: number;
}>;
