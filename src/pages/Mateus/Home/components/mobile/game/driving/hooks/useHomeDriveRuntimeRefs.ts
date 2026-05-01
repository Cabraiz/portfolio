// src/pages/Mateus/Home/components/mobile/game/driving/hooks/useHomeDriveRuntimeRefs.ts

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
  type RefObject,
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
  runtimeRef: RefObject<HomeDriveRuntimeState>;
  inputRef: RefObject<HomeDriveInputState>;

  /**
   * Snapshot lento para UI React.
   * Não use para física/câmera 3D frame a frame.
   */
  runtimeSnapshot: HomeDriveRuntimeState;

  setRuntimeRef: (
    next: HomeDriveRuntimeState | HomeDriveRuntimeRefUpdater,
  ) => void;

  setInputRef: (
    next: HomeDriveInputState | HomeDriveInputRefUpdater,
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

function areNumbersEquivalent(
  first: number,
  second: number,
  epsilon = 0.0001,
): boolean {
  return Math.abs(first - second) <= epsilon;
}

function areInputStatesEquivalent(
  first: HomeDriveInputState,
  second: HomeDriveInputState,
): boolean {
  return (
    areNumbersEquivalent(first.steering, second.steering) &&
    areNumbersEquivalent(first.throttle, second.throttle) &&
    areNumbersEquivalent(first.brake, second.brake)
  );
}

function patchHomeDriveInputState(
  current: HomeDriveInputState,
  patch: Partial<HomeDriveInputState>,
): HomeDriveInputState {
  const next: HomeDriveInputState = {
    steering: patch.steering ?? current.steering,
    throttle: patch.throttle ?? current.throttle,
    brake: patch.brake ?? current.brake,
  };

  return areInputStatesEquivalent(current, next) ? current : next;
}

export function useHomeDriveRuntimeRefs(): UseHomeDriveRuntimeRefsResult {
  const runtimeRef = useRef<HomeDriveRuntimeState>(
    createInitialHomeDriveRuntimeState(),
  );

  const inputRef = useRef<HomeDriveInputState>({
    ...DEFAULT_INPUT_STATE,
  });

  const snapshotRef = useRef<HomeDriveRuntimeState>(runtimeRef.current);
  const listenersRef = useRef<Set<() => void>>(new Set());
  const notificationFrameRef = useRef<number | null>(null);

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

  const notifySnapshotListeners = useCallback(() => {
    listenersRef.current.forEach((listener) => {
      listener();
    });
  }, []);

  const cancelScheduledNotification = useCallback(() => {
    if (notificationFrameRef.current === null) {
      return;
    }

    window.cancelAnimationFrame(notificationFrameRef.current);
    notificationFrameRef.current = null;
  }, []);

  const scheduleSnapshotNotification = useCallback(() => {
    if (notificationFrameRef.current !== null) {
      return;
    }

    if (typeof window === "undefined") {
      notifySnapshotListeners();
      return;
    }

    notificationFrameRef.current = window.requestAnimationFrame(() => {
      notificationFrameRef.current = null;
      notifySnapshotListeners();
    });
  }, [notifySnapshotListeners]);

  const publishRuntimeSnapshot = useCallback(() => {
    if (snapshotRef.current === runtimeRef.current) {
      return;
    }

    snapshotRef.current = runtimeRef.current;

    /*
      Importante:
      colisões podem chamar publishRuntimeSnapshot muitas vezes em sequência.
      A notificação é agrupada em 1 RAF para impedir cascata de render/update
      dentro do mesmo ciclo do React.
    */
    scheduleSnapshotNotification();
  }, [scheduleSnapshotNotification]);

  const setRuntimeRef = useCallback(
    (next: HomeDriveRuntimeState | HomeDriveRuntimeRefUpdater) => {
      const nextRuntime = isRuntimeUpdater(next)
        ? next(runtimeRef.current)
        : next;

      if (nextRuntime === runtimeRef.current) {
        return;
      }

      runtimeRef.current = nextRuntime;
    },
    [],
  );

  const setInputRef = useCallback(
    (next: HomeDriveInputState | HomeDriveInputRefUpdater) => {
      const nextInput = isInputUpdater(next) ? next(inputRef.current) : next;

      if (areInputStatesEquivalent(inputRef.current, nextInput)) {
        return;
      }

      inputRef.current = nextInput;
    },
    [],
  );

  const patchInputRef = useCallback((patch: Partial<HomeDriveInputState>) => {
    const nextInput = patchHomeDriveInputState(inputRef.current, patch);

    if (nextInput === inputRef.current) {
      return;
    }

    inputRef.current = nextInput;
  }, []);

  const resetRuntimeRef = useCallback(() => {
    cancelScheduledNotification();

    runtimeRef.current = createInitialHomeDriveRuntimeState();
    snapshotRef.current = runtimeRef.current;

    notifySnapshotListeners();
  }, [cancelScheduledNotification, notifySnapshotListeners]);

  useEffect(() => {
    return () => {
      cancelScheduledNotification();
    };
  }, [cancelScheduledNotification]);

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
      patchInputRef,
      publishRuntimeSnapshot,
      resetRuntimeRef,
      runtimeSnapshot,
      setInputRef,
      setRuntimeRef,
    ],
  );
}
