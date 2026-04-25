import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";

import {
  HOME_DRIVE_DEFAULT_INPUT_STATE,
  HOME_DRIVE_MAX_STEER,
  HOME_DRIVE_PHASE_PAUSED,
  HOME_DRIVE_PHASE_READY,
} from "../components/mobile/game/driving/domain/homeDrive.constants";
import type {
  HomeDriveInputState,
  HomeDrivePhase,
} from "../components/mobile/game/driving/domain/homeDrive.types";

export type UseHomeDriveInputParams = Readonly<{
  enabled?: boolean;
  phase?: HomeDrivePhase;
  onStart?: () => void;
  onPauseToggle?: () => void;
  onClose?: () => void;
}>;

export type UseHomeDriveInputResult = Readonly<{
  controlsRef: RefObject<HomeDriveInputState>;
  controlState: HomeDriveInputState;
  setSteer: (_value: number) => void;
  setThrottle: (_active: boolean) => void;
  setBrake: (_active: boolean) => void;
  resetControls: () => void;
}>;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export default function useHomeDriveInput({
  enabled = true,
  phase = HOME_DRIVE_PHASE_READY,
  onStart,
  onPauseToggle,
  onClose,
}: UseHomeDriveInputParams = {}): UseHomeDriveInputResult {
  const [controlState, setControlState] = useState<HomeDriveInputState>(
    HOME_DRIVE_DEFAULT_INPUT_STATE,
  );

  const controlsRef = useRef<HomeDriveInputState>(HOME_DRIVE_DEFAULT_INPUT_STATE);
  const phaseRef = useRef<HomeDrivePhase>(phase);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const commitControls = useCallback((next: HomeDriveInputState) => {
    controlsRef.current = next;
    setControlState(next);
  }, []);

  const setSteer = useCallback(
    (value: number) => {
      commitControls({
        ...controlsRef.current,
        steer: clamp(value, -HOME_DRIVE_MAX_STEER, HOME_DRIVE_MAX_STEER),
      });
    },
    [commitControls],
  );

  const setThrottle = useCallback(
    (active: boolean) => {
      if (active && phaseRef.current === HOME_DRIVE_PHASE_READY) {
        onStart?.();
      }

      if (phaseRef.current === HOME_DRIVE_PHASE_PAUSED) {
        commitControls({
          ...controlsRef.current,
          throttle: 0,
        });
        return;
      }

      commitControls({
        ...controlsRef.current,
        throttle: active ? 1 : 0,
      });
    },
    [commitControls, onStart],
  );

  const setBrake = useCallback(
    (active: boolean) => {
      if (phaseRef.current === HOME_DRIVE_PHASE_PAUSED) {
        commitControls({
          ...controlsRef.current,
          brake: 0,
        });
        return;
      }

      commitControls({
        ...controlsRef.current,
        brake: active ? 1 : 0,
      });
    },
    [commitControls],
  );

  const resetControls = useCallback(() => {
    commitControls(HOME_DRIVE_DEFAULT_INPUT_STATE);
  }, [commitControls]);

  useEffect(() => {
    if (!enabled) {
      resetControls();
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) {
        return;
      }

      const key = event.key.toLowerCase();

      if (key === "arrowleft" || key === "a") {
        event.preventDefault();
        setSteer(-1);
        return;
      }

      if (key === "arrowright" || key === "d") {
        event.preventDefault();
        setSteer(1);
        return;
      }

      if (key === "arrowup" || key === "w") {
        event.preventDefault();
        setThrottle(true);
        return;
      }

      if (key === "arrowdown" || key === "s") {
        event.preventDefault();
        setBrake(true);
        return;
      }

      if (event.key === " ") {
        event.preventDefault();
        onPauseToggle?.();
        return;
      }

      if (event.key === "Escape") {
        onClose?.();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      if (
        key === "arrowleft" ||
        key === "a" ||
        key === "arrowright" ||
        key === "d"
      ) {
        event.preventDefault();
        setSteer(0);
        return;
      }

      if (key === "arrowup" || key === "w") {
        event.preventDefault();
        setThrottle(false);
        return;
      }

      if (key === "arrowdown" || key === "s") {
        event.preventDefault();
        setBrake(false);
      }
    };

    globalThis.addEventListener("keydown", handleKeyDown, { passive: false });
    globalThis.addEventListener("keyup", handleKeyUp, { passive: false });

    return () => {
      globalThis.removeEventListener("keydown", handleKeyDown);
      globalThis.removeEventListener("keyup", handleKeyUp);
    };
  }, [
    enabled,
    onClose,
    onPauseToggle,
    resetControls,
    setBrake,
    setSteer,
    setThrottle,
  ]);

  return useMemo(
    () => ({
      controlsRef,
      controlState,
      setSteer,
      setThrottle,
      setBrake,
      resetControls,
    }),
    [controlState, resetControls, setBrake, setSteer, setThrottle],
  );
}
