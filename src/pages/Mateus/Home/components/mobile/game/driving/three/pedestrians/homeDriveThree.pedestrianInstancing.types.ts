// src/pages/Mateus/Home/components/mobile/game/driving/three/pedestrians/homeDriveThree.pedestrianInstancing.types.ts

import type { ColorRepresentation, InstancedMesh, Matrix4 } from "three";
import type { HomeDrivePedestrianAgent } from "../../domain/pedestrians";

export type HomeDriveThreePedestrianInstanceDetailLevel =
  | "medium"
  | "proxy";

export type HomeDriveThreePedestrianInstancedEntry = Readonly<{
  agent: HomeDrivePedestrianAgent;
  detailLevel: HomeDriveThreePedestrianInstanceDetailLevel;
  distanceMeters?: number;
}>;

export type HomeDriveThreePedestrianInstancedBucketKey =
  | "adult"
  | "worker"
  | "shopper"
  | "runner"
  | "elder"
  | "child"
  | "parent"
  | "smoker"
  | "generic";

export type HomeDriveThreePedestrianInstancedBucket = Readonly<{
  key: HomeDriveThreePedestrianInstancedBucketKey;
  entries: readonly HomeDriveThreePedestrianInstancedEntry[];
}>;

export type HomeDriveThreePedestrianInstancePalette = Readonly<{
  body: ColorRepresentation;
  head: ColorRepresentation;
  accent: ColorRepresentation;
}>;

export type HomeDriveThreePedestrianTransformSample = Readonly<{
  matrix: Matrix4;
  color: ColorRepresentation;
}>;

export type HomeDriveThreePedestrianInstancedMeshRef = InstancedMesh | null;

export type HomeDriveThreePedestrianInstancedCrowdProps = Readonly<{
  entries: readonly HomeDriveThreePedestrianInstancedEntry[];
  enabled?: boolean;
  renderOrder?: number;
  maxInstances?: number;
  elapsedSeconds?: number;
}>;
