import React, { useCallback, useEffect, useMemo, useRef } from "react";

export type HomeArcadeHoldControl = "left" | "right" | "turbo";

export type UseHomeArcadeInputParams = Readonly<{
  enabled?: boolean;
  setControlActive: (control: HomeArcadeHoldControl, active: boolean) => void;
  queueJump: () => void;
  clearQueuedJump?: () => void;
  resetControls: () => void;
  togglePause?: () => void;
  restartGame?: () => void;
  onClose?: () => void;
  primeAudio?: () => Promise<void> | void;
}>;

export type HomeArcadeButtonBinding = Readonly<{
  onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerUp: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerLeave: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerCancel: (event: React.PointerEvent<HTMLButtonElement>) => void;
}>;

export type UseHomeArcadeInputResult = Readonly<{
  bindLeftButton: HomeArcadeButtonBinding;
  bindRightButton: HomeArcadeButtonBinding;
  bindTurboButton: HomeArcadeButtonBinding;
  bindJumpButton: Readonly<{
    onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => void;
  }>;
  bindResetButton: Readonly<{
    onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => void;
  }>;
  handleGlobalPointerUnlock: () => void;
}>;

export default function useHomeArcadeInput({
  enabled = true,
  setControlActive,
  queueJump,
  clearQueuedJump,
  resetControls,
  togglePause,
  restartGame,
  onClose,
  primeAudio,
}: UseHomeArcadeInputParams): UseHomeArcadeInputResult {
  const audioPrimedRef = useRef(false);

  const ensureAudioPrimed = useCallback(() => {
    if (audioPrimedRef.current) {
      return;
    }

    audioPrimedRef.current = true;
    void primeAudio?.();
  }, [primeAudio]);

  const handleHoldStart = useCallback(
    (control: HomeArcadeHoldControl) => {
      if (!enabled) {
        return;
      }

      ensureAudioPrimed();
      setControlActive(control, true);
    },
    [enabled, ensureAudioPrimed, setControlActive],
  );

  const handleHoldEnd = useCallback(
    (control: HomeArcadeHoldControl) => {
      setControlActive(control, false);
    },
    [setControlActive],
  );

  const createHoldBinding = useCallback(
    (control: HomeArcadeHoldControl): HomeArcadeButtonBinding => {
      return {
        onPointerDown: (event) => {
          event.preventDefault();
          handleHoldStart(control);
        },
        onPointerUp: (event) => {
          event.preventDefault();
          handleHoldEnd(control);
        },
        onPointerLeave: (event) => {
          event.preventDefault();
          handleHoldEnd(control);
        },
        onPointerCancel: (event) => {
          event.preventDefault();
          handleHoldEnd(control);
        },
      };
    },
    [handleHoldEnd, handleHoldStart],
  );

  const handleJumpPress = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      event.preventDefault();

      if (!enabled) {
        return;
      }

      ensureAudioPrimed();
      queueJump();
    },
    [enabled, ensureAudioPrimed, queueJump],
  );

  const handleResetPress = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      event.preventDefault();

      if (!enabled) {
        return;
      }

      ensureAudioPrimed();
      restartGame?.();
    },
    [enabled, ensureAudioPrimed, restartGame],
  );

  const handleGlobalPointerUnlock = useCallback(() => {
    resetControls();
    clearQueuedJump?.();
  }, [clearQueuedJump, resetControls]);

  useEffect(() => {
    if (!enabled) {
      handleGlobalPointerUnlock();
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) {
        return;
      }

      ensureAudioPrimed();

      const key = event.key.toLowerCase();

      if (event.key === "ArrowLeft" || key === "a") {
        setControlActive("left", true);
      }

      if (event.key === "ArrowRight" || key === "d") {
        setControlActive("right", true);
      }

      if (event.key === "Shift") {
        setControlActive("turbo", true);
      }

      if (event.key === "ArrowUp" || event.key === " " || key === "w") {
        event.preventDefault();
        queueJump();
      }

      if (key === "p") {
        togglePause?.();
      }

      if (key === "r") {
        restartGame?.();
      }

      if (event.key === "Escape") {
        onClose?.();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      if (event.key === "ArrowLeft" || key === "a") {
        setControlActive("left", false);
      }

      if (event.key === "ArrowRight" || key === "d") {
        setControlActive("right", false);
      }

      if (event.key === "Shift") {
        setControlActive("turbo", false);
      }
    };

    const handleWindowBlur = () => {
      handleGlobalPointerUnlock();
    };

    window.addEventListener("keydown", handleKeyDown, { passive: false });
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("pointerup", handleWindowBlur);
    window.addEventListener("pointercancel", handleWindowBlur);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("pointerup", handleWindowBlur);
      window.removeEventListener("pointercancel", handleWindowBlur);
    };
  }, [
    enabled,
    ensureAudioPrimed,
    handleGlobalPointerUnlock,
    onClose,
    queueJump,
    restartGame,
    setControlActive,
    togglePause,
  ]);

  return useMemo<UseHomeArcadeInputResult>(() => {
    return {
      bindLeftButton: createHoldBinding("left"),
      bindRightButton: createHoldBinding("right"),
      bindTurboButton: createHoldBinding("turbo"),
      bindJumpButton: {
        onPointerDown: handleJumpPress,
      },
      bindResetButton: {
        onPointerDown: handleResetPress,
      },
      handleGlobalPointerUnlock,
    };
  }, [
    createHoldBinding,
    handleGlobalPointerUnlock,
    handleJumpPress,
    handleResetPress,
  ]);
}
