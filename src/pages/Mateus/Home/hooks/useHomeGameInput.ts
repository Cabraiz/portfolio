import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";

import {
  HOME_GAME_COLLECTIBLE_TOKENS,
  HOME_GAME_POINTER_TOKENS,
  HOME_GAME_RIPPLE_DURATION_MS,
  clampHomeGameValue,
  createHomeGameRippleId,
} from "../components/mobile/game/homeGame.tokens";
import type { HomeGameRipple } from "../components/mobile/game/homeGame.types";

export type UseHomeGameInputParams = Readonly<{
  arenaRef: RefObject<HTMLElement | null>;
  rippleSize?: number;
  rippleDurationMs?: number;
}>;

export type UseHomeGameInputResult = Readonly<{
  ripples: readonly HomeGameRipple[];
  clearRipples: () => void;
  emitRipple: (clientX: number, clientY: number, size?: number) => void;
  emitRippleFromElement: (element: Element | null, size?: number) => void;
  updatePointerFromClientPoint: (clientX: number, clientY: number) => void;
  resetPointer: () => void;
  handleArenaPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
  handleArenaPointerLeave: () => void;
}>;

export default function useHomeGameInput({
  arenaRef,
  rippleSize = HOME_GAME_COLLECTIBLE_TOKENS.rippleSizePx,
  rippleDurationMs = HOME_GAME_RIPPLE_DURATION_MS,
}: UseHomeGameInputParams): UseHomeGameInputResult {
  const rippleTimeoutsRef = useRef<number[]>([]);
  const [ripples, setRipples] = useState<readonly HomeGameRipple[]>([]);

  const clearRippleTimeouts = useCallback(() => {
    rippleTimeoutsRef.current.forEach((timeoutId) => {
      window.clearTimeout(timeoutId);
    });

    rippleTimeoutsRef.current = [];
  }, []);

  const resetPointer = useCallback(() => {
    const arena = arenaRef.current;

    if (!arena) {
      return;
    }

    arena.style.setProperty(
      "--pointer-x",
      String(HOME_GAME_POINTER_TOKENS.defaultX),
    );
    arena.style.setProperty(
      "--pointer-y",
      String(HOME_GAME_POINTER_TOKENS.defaultY),
    );
    arena.style.setProperty(
      "--pointer-glow-x",
      HOME_GAME_POINTER_TOKENS.defaultGlowX,
    );
    arena.style.setProperty(
      "--pointer-glow-y",
      HOME_GAME_POINTER_TOKENS.defaultGlowY,
    );
  }, [arenaRef]);

  const updatePointerFromClientPoint = useCallback(
    (clientX: number, clientY: number) => {
      const arena = arenaRef.current;

      if (!arena) {
        return;
      }

      const rect = arena.getBoundingClientRect();

      if (rect.width <= 0 || rect.height <= 0) {
        return;
      }

      const x = clampHomeGameValue((clientX - rect.left) / rect.width, 0, 1);
      const y = clampHomeGameValue((clientY - rect.top) / rect.height, 0, 1);

      arena.style.setProperty("--pointer-x", ((x - 0.5) * 2).toFixed(3));
      arena.style.setProperty("--pointer-y", ((y - 0.5) * 2).toFixed(3));
      arena.style.setProperty("--pointer-glow-x", `${(x * 100).toFixed(2)}%`);
      arena.style.setProperty("--pointer-glow-y", `${(y * 100).toFixed(2)}%`);
    },
    [arenaRef],
  );

  const emitRipple = useCallback(
    (clientX: number, clientY: number, size = rippleSize) => {
      const arena = arenaRef.current;

      if (!arena) {
        return;
      }

      const rect = arena.getBoundingClientRect();
      const ripple: HomeGameRipple = {
        id: createHomeGameRippleId(),
        x: clientX - rect.left,
        y: clientY - rect.top,
        size,
      };

      setRipples((current) => [...current, ripple]);

      const timeoutId = window.setTimeout(() => {
        setRipples((current) => current.filter((item) => item.id !== ripple.id));
      }, rippleDurationMs);

      rippleTimeoutsRef.current.push(timeoutId);
    },
    [arenaRef, rippleDurationMs, rippleSize],
  );

  const emitRippleFromElement = useCallback(
    (element: Element | null, size = rippleSize) => {
      if (!(element instanceof HTMLElement)) {
        return;
      }

      const rect = element.getBoundingClientRect();
      emitRipple(rect.left + rect.width / 2, rect.top + rect.height / 2, size);
    },
    [emitRipple, rippleSize],
  );

  const clearRipples = useCallback(() => {
    clearRippleTimeouts();
    setRipples([]);
  }, [clearRippleTimeouts]);

  const handleArenaPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      updatePointerFromClientPoint(event.clientX, event.clientY);
    },
    [updatePointerFromClientPoint],
  );

  const handleArenaPointerLeave = useCallback(() => {
    resetPointer();
  }, [resetPointer]);

  useEffect(() => {
    resetPointer();

    return () => {
      clearRippleTimeouts();
    };
  }, [clearRippleTimeouts, resetPointer]);

  return useMemo<UseHomeGameInputResult>(() => {
    return {
      ripples,
      clearRipples,
      emitRipple,
      emitRippleFromElement,
      updatePointerFromClientPoint,
      resetPointer,
      handleArenaPointerMove,
      handleArenaPointerLeave,
    };
  }, [
    ripples,
    clearRipples,
    emitRipple,
    emitRippleFromElement,
    updatePointerFromClientPoint,
    resetPointer,
    handleArenaPointerMove,
    handleArenaPointerLeave,
  ]);
}
