// src/pages/Mateus/Home/components/mobile/game/driving/audio/useHomeDriveEngineAudio.ts

import { useCallback, useEffect, useMemo, useRef } from "react";

import type {
  HomeDriveInputState,
  HomeDriveRuntimeState,
} from "../domain/homeDrive.types";
import { createHomeDriveEngineAudioController } from "./homeDrive.engineAudioController";
import type {
  HomeDriveEngineAudioController,
  HomeDriveEngineAudioControllerState,
  HomeDriveEngineAudioSettings,
} from "./homeDrive.engineAudio.types";

type HomeDriveMutableRef<T> = {
  current: T;
};

export type UseHomeDriveEngineAudioOptions = Readonly<{
  runtimeRef: HomeDriveMutableRef<HomeDriveRuntimeState>;
  inputRef: HomeDriveMutableRef<HomeDriveInputState>;

  enabled: boolean;
  paused?: boolean;
  muted?: boolean;

  masterVolume?: number;
  updateHz?: number;

  settings?: Partial<HomeDriveEngineAudioSettings>;
}>;

export type UseHomeDriveEngineAudioApi = Readonly<{
  unlock: () => Promise<boolean>;
  startFromGesture: () => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  setMuted: (muted: boolean) => void;
  setMasterVolume: (volume: number) => void;
  getState: () => HomeDriveEngineAudioControllerState;
}>;

function canUseRequestAnimationFrame(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.requestAnimationFrame === "function" &&
    typeof window.cancelAnimationFrame === "function"
  );
}

export function useHomeDriveEngineAudio({
  runtimeRef,
  inputRef,
  enabled,
  paused = false,
  muted = false,
  masterVolume = 0.72,
  updateHz = 30,
  settings,
}: UseHomeDriveEngineAudioOptions): UseHomeDriveEngineAudioApi {
  const controllerRef = useRef<HomeDriveEngineAudioController | null>(null);

  if (!controllerRef.current) {
    controllerRef.current = createHomeDriveEngineAudioController({
      muted,
      settings: {
        ...settings,
        masterVolume,
      },
    });
  }

  const controller = controllerRef.current;

  const updateIntervalMs = useMemo(() => {
    return 1000 / Math.max(1, updateHz);
  }, [updateHz]);

  useEffect(() => {
    controller.setMuted(muted);
  }, [controller, muted]);

  useEffect(() => {
    controller.setMasterVolume(masterVolume);
  }, [controller, masterVolume]);

  useEffect(() => {
    if (!enabled) {
      controller.stop();
      return;
    }

    if (paused) {
      controller.pause();
      return;
    }

    /*
      Não iniciar áudio automaticamente no mount/update do React.
      O início real fica em startFromGesture(), chamado pelo pointerdown.
    */
    if (controller.getState().isStarted) {
      controller.resume();
    }
  }, [controller, enabled, paused]);

  useEffect(() => {
    if (!enabled || paused || !canUseRequestAnimationFrame()) {
      return undefined;
    }

    let frameId = 0;
    let lastUpdateMs = 0;
    let isActive = true;

    const tick = (nowMs: number) => {
      if (!isActive) {
        return;
      }

      if (nowMs - lastUpdateMs >= updateIntervalMs) {
        lastUpdateMs = nowMs;

        if (controller.getState().isStarted) {
          const runtime = runtimeRef.current;
          const input = inputRef.current;

          controller.update({
            speedMps: runtime.car.speedMps,
            throttle: input.throttle,
            brake: input.brake,
          });
        }
      }

      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);

    return () => {
      isActive = false;
      window.cancelAnimationFrame(frameId);
    };
  }, [controller, enabled, paused, runtimeRef, inputRef, updateIntervalMs]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        controller.pause();
        return;
      }

      if (enabled && !paused && controller.getState().isStarted) {
        controller.resume();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [controller, enabled, paused]);

  useEffect(() => {
    return () => {
      controller.dispose();
    };
  }, [controller]);

  const unlock = useCallback(() => {
    return controller.unlock();
  }, [controller]);

  const startFromGesture = useCallback(() => {
    controller.startFromGesture();
  }, [controller]);

  const start = useCallback(() => {
    controller.start();
  }, [controller]);

  const pauseAudio = useCallback(() => {
    controller.pause();
  }, [controller]);

  const resume = useCallback(() => {
    controller.resume();
  }, [controller]);

  const stop = useCallback(() => {
    controller.stop();
  }, [controller]);

  const setMuted = useCallback(
    (nextMuted: boolean) => {
      controller.setMuted(nextMuted);
    },
    [controller],
  );

  const setMasterVolume = useCallback(
    (nextVolume: number) => {
      controller.setMasterVolume(nextVolume);
    },
    [controller],
  );

  const getState = useCallback(() => {
    return controller.getState();
  }, [controller]);

  useEffect(() => {
    if (!enabled || paused || !controller.getState().isStarted) {
      return;
    }

    const runtime = runtimeRef.current;
    const input = inputRef.current;

    controller.update({
      speedMps: runtime.car.speedMps,
      throttle: input.throttle,
      brake: input.brake,
    });
  }, [controller, enabled, paused, runtimeRef, inputRef]);

  return useMemo(
    () => ({
      unlock,
      startFromGesture,
      start,
      pause: pauseAudio,
      resume,
      stop,
      setMuted,
      setMasterVolume,
      getState,
    }),
    [
      unlock,
      startFromGesture,
      start,
      pauseAudio,
      resume,
      stop,
      setMuted,
      setMasterVolume,
      getState,
    ],
  );
}

export default useHomeDriveEngineAudio;
