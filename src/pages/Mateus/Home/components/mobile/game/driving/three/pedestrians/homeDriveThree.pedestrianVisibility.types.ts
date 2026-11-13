// src/pages/Mateus/Home/components/mobile/game/driving/three/pedestrians/homeDriveThree.pedestrianVisibility.types.ts

import type { HomeDriveRuntimeState } from "../../domain/homeDrive.types";
import type {
	HomeDrivePedestrianAgent,
	HomeDrivePedestrianRuntimeState,
} from "../../domain/pedestrians";
import type {
	HomeDriveThreePedestrianDetailLevel,
} from "./HomeDriveThreePedestrianAgent";

export type HomeDriveThreeVisiblePedestrianEntry = Readonly<{

  agent: HomeDrivePedestrianAgent;

  distanceSquared: number;

  detailLevel: HomeDriveThreePedestrianDetailLevel;

  visibilityCellKey: string;

  angularSectorKey: string;

  visibilityRank: number;

}>;



export type HomeDriveThreePedestrianVisibilityOptions = Readonly<{

  agents: readonly HomeDrivePedestrianAgent[];

  runtime?: HomeDriveRuntimeState;

  pedestrianState?: HomeDrivePedestrianRuntimeState;

  visibleRadiusMeters: number;

  maxVisiblePedestrians: number;

  fullDetailRadiusMeters: number;

  mediumDetailRadiusMeters: number;

  cellSizeMeters?: number;

  relocatedFadeInSeconds?: number;

  relocatedVisibleBlockMeters?: number;

  relocatedVisibleConeRadians?: number;

}>;
