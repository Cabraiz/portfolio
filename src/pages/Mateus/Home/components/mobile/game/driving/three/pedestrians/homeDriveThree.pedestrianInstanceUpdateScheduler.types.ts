// src/pages/Mateus/Home/components/mobile/game/driving/three/pedestrians/homeDriveThree.pedestrianInstanceUpdateScheduler.types.ts

export type HomeDriveThreePedestrianInstanceUpdateSchedulerState = {
  cursor: number;
  frameIndex: number;
  lastUpdateSeconds: number;
};

export type HomeDriveThreePedestrianInstanceUpdateSchedulerOptions = Readonly<{
  instanceCount: number;
  elapsedSeconds: number;
  updateHz?: number;
  stride?: number;
  maxUpdatesPerFrame?: number;
}>;

export type HomeDriveThreePedestrianInstanceUpdateWindow = Readonly<{
  shouldUpdate: boolean;
  startIndex: number;
  endIndex: number;
  wraps: boolean;
}>;
