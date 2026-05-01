// src/pages/Mateus/Home/components/mobile/game/driving/three/pedestrians/homeDriveThree.pedestrianInstanceUpdateScheduler.ts

import type {
  HomeDriveThreePedestrianInstanceUpdateSchedulerOptions,
  HomeDriveThreePedestrianInstanceUpdateSchedulerState,
  HomeDriveThreePedestrianInstanceUpdateWindow,
} from "./homeDriveThree.pedestrianInstanceUpdateScheduler.types";

export function createHomeDriveThreePedestrianInstanceUpdateSchedulerState(): HomeDriveThreePedestrianInstanceUpdateSchedulerState {
  return {
    cursor: 0,
    frameIndex: 0,
    lastUpdateSeconds: Number.NEGATIVE_INFINITY,
  };
}

export function getHomeDriveThreePedestrianInstanceUpdateWindow(
  state: HomeDriveThreePedestrianInstanceUpdateSchedulerState,
  options: HomeDriveThreePedestrianInstanceUpdateSchedulerOptions,
): HomeDriveThreePedestrianInstanceUpdateWindow {
  const instanceCount = Math.max(0, Math.floor(options.instanceCount));

  if (instanceCount <= 0) {
    return {
      shouldUpdate: false,
      startIndex: 0,
      endIndex: 0,
      wraps: false,
    };
  }

  const updateHz = Math.max(1, Math.min(60, options.updateHz ?? 16));
  const intervalSeconds = 1 / updateHz;

  if (
    Number.isFinite(state.lastUpdateSeconds) &&
    options.elapsedSeconds - state.lastUpdateSeconds < intervalSeconds
  ) {
    return {
      shouldUpdate: false,
      startIndex: state.cursor,
      endIndex: state.cursor,
      wraps: false,
    };
  }

  const stride = Math.max(1, Math.floor(options.stride ?? 1));
  const maxUpdatesPerFrame = Math.max(
    1,
    Math.floor(options.maxUpdatesPerFrame ?? Math.ceil(instanceCount / stride)),
  );
  const updateCount = Math.min(instanceCount, maxUpdatesPerFrame);
  const startIndex = Math.max(0, Math.min(instanceCount - 1, state.cursor));
  const endIndex = Math.min(instanceCount, startIndex + updateCount);
  const wraps = endIndex >= instanceCount;

  state.frameIndex += 1;
  state.lastUpdateSeconds = options.elapsedSeconds;
  state.cursor = wraps ? 0 : endIndex;

  return {
    shouldUpdate: true,
    startIndex,
    endIndex,
    wraps,
  };
}
