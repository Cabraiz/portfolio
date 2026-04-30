// src/pages/Mateus/Home/components/mobile/game/driving/hooks/useHomeDriveState.ts

import {
  useCallback,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

import { createHomeDriveSpawnCarState } from "../domain/homeDrive.spawn";
import type { HomeDriveRuntimeState } from "../domain/homeDrive.types";

export type UseHomeDriveStateResult = Readonly<{
  runtime: HomeDriveRuntimeState;
  setRuntime: Dispatch<SetStateAction<HomeDriveRuntimeState>>;
  resetRuntime: () => void;
}>;

export function createInitialHomeDriveRuntimeState(): HomeDriveRuntimeState {
  return {
    elapsedSeconds: 0,
    car: createHomeDriveSpawnCarState(),
  };
}

export function useHomeDriveState(): UseHomeDriveStateResult {
  const [runtime, setRuntime] = useState<HomeDriveRuntimeState>(() =>
    createInitialHomeDriveRuntimeState(),
  );

  const resetRuntime = useCallback(() => {
    setRuntime(createInitialHomeDriveRuntimeState());
  }, []);

  return {
    runtime,
    setRuntime,
    resetRuntime,
  };
}
