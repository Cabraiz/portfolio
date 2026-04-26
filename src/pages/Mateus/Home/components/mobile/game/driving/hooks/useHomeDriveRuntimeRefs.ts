// src/pages/Mateus/Home/components/mobile/game/driving/hooks/useHomeDriveRuntimeRefs.ts

import {
  useCallback,
  useMemo,
  useRef,
  useSyncExternalStore,
  type MutableRefObject,
} from "react";

import type {
  HomeDriveInputState,
  HomeDriveRuntimeState,
} from "../domain/homeDrive.types";
import { createInitialHomeDriveRuntimeState } from "./useHomeDriveState";

export type HomeDriveRuntimeRefUpdater = (
  current: HomeDriveRuntimeState,
) => HomeDriveRuntimeState;

export type HomeDriveInputRefUpdater = (
  current: HomeDriveInputState,
) => HomeDriveInputState;

export type UseHomeDriveRuntimeRefsResult = Readonly<{
  runtimeRef: MutableRefObject<HomeDriveRuntimeState>;
  inputRef: MutableRefObject<HomeDriveInputState>;

  /**
   * Snapshot lento para UI React.
   * Não use para física/câmera 3D frame a frame.
   */
  runtimeSnapshot: HomeDriveRuntimeState;

  setRuntimeRef: (
    next:
      | HomeDriveRuntimeState
      | HomeDriveRuntimeRefUpdater,
  ) => void;

  setInputRef: (
    next:
      | HomeDriveInputState
      | HomeDriveInputRefUpdater,
  ) => void;

  patchInputRef: (patch: Partial<HomeDriveInputState>) => void;

  resetRuntimeRef: () => void;

  /**
   * Chame em baixa frequência para atualizar overlays React,
   * por exemplo bússola. Não chame a cada frame.
   */
  publishRuntimeSnapshot: () => void;
}>;

const DEFAULT_INPUT_STATE: HomeDriveInputState = {
  steering: 0,
  throttle: 1,
  brake: 0,
};

function isRuntimeUpdater(
  next: HomeDriveRuntimeState | HomeDriveRuntimeRefUpdater,
): next is HomeDriveRuntimeRefUpdater {
  return typeof next === "function";
}

function isInputUpdater(
  next: HomeDriveInputState | HomeDriveInputRefUpdater,
): next is HomeDriveInputRefUpdater {
  return typeof next === "function";
}

export function useHomeDriveRuntimeRefs(): UseHomeDriveRuntimeRefsResult {
  const runtimeRef = useRef<HomeDriveRuntimeState>(
    createInitialHomeDriveRuntimeState(),
  );

  const inputRef = useRef<HomeDriveInputState>(DEFAULT_INPUT_STATE);

  const snapshotRef = useRef<HomeDriveRuntimeState>(runtimeRef.current);
  const listenersRef = useRef(new Set<() => void>());

  const subscribe = useCallback((listener: () => void) => {
    listenersRef.current.add(listener);

    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  const getSnapshot = useCallback(() => {
    return snapshotRef.current;
  }, []);

  const runtimeSnapshot = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getSnapshot,
  );

  const publishRuntimeSnapshot = useCallback(() => {
    snapshotRef.current = runtimeRef.current;

    listenersRef.current.forEach((listener) => {
      listener();
    });
  }, []);

  const setRuntimeRef = useCallback(
    (next: HomeDriveRuntimeState | HomeDriveRuntimeRefUpdater) => {
      runtimeRef.current = isRuntimeUpdater(next)
        ? next(runtimeRef.current)
        : next;
    },
    [],
  );

  const setInputRef = useCallback(
    (next: HomeDriveInputState | HomeDriveInputRefUpdater) => {
      inputRef.current = isInputUpdater(next) ? next(inputRef.current) : next;
    },
    [],
  );

  const patchInputRef = useCallback((patch: Partial<HomeDriveInputState>) => {
    inputRef.current = {
      ...inputRef.current,
      ...patch,
    };
  }, []);

  const resetRuntimeRef = useCallback(() => {
    runtimeRef.current = createInitialHomeDriveRuntimeState();
    publishRuntimeSnapshot();
  }, [publishRuntimeSnapshot]);

  return useMemo(
    () => ({
      runtimeRef,
      inputRef,
      runtimeSnapshot,
      setRuntimeRef,
      setInputRef,
      patchInputRef,
      resetRuntimeRef,
      publishRuntimeSnapshot,
    }),
    [
      inputRef,
      patchInputRef,
      publishRuntimeSnapshot,
      resetRuntimeRef,
      runtimeRef,
      runtimeSnapshot,
      setInputRef,
      setRuntimeRef,
    ],
  );
}
