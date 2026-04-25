import React, { useCallback, useEffect, useRef } from "react";

import { playHomeArcadeSound } from "../components/mobile/game/homeArcade.audio";
import { stepHomeArcadeLevel1 } from "../components/mobile/game/domain/homeArcade.helpers";
import type {
  HomeArcadeGameState,
  HomeArcadeSoundCue,
  MutableHomeArcadeControlState,
} from "../components/mobile/game/domain/homeArcade.types";

export type UseHomeArcadeLoopParams = Readonly<{
  game: HomeArcadeGameState;
  controlsRef: React.RefObject<MutableHomeArcadeControlState>;
  onStateChange: (nextState: HomeArcadeGameState) => void;
  onCues?: (cues: readonly HomeArcadeSoundCue[]) => void;
  enabled?: boolean;
}>;

export type UseHomeArcadeLoopResult = Readonly<{
  isRunning: boolean;
  stopLoop: () => void;
}>;

export default function useHomeArcadeLoop({
  game,
  controlsRef,
  onStateChange,
  onCues,
  enabled = true,
}: UseHomeArcadeLoopParams): UseHomeArcadeLoopResult {
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);
  const gameRef = useRef(game);

  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) {
      globalThis.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    lastFrameRef.current = null;
  }, []);

  useEffect(() => {
    if (!enabled || game.phase !== "playing") {
      stopLoop();
      return;
    }

    const tick = (timestamp: number) => {
      if (lastFrameRef.current === null) {
        lastFrameRef.current = timestamp;
      }

      const deltaSeconds = (timestamp - lastFrameRef.current) / 1000;
      lastFrameRef.current = timestamp;

      const controlsSnapshot: MutableHomeArcadeControlState = {
        left: controlsRef.current?.left ?? false,
        right: controlsRef.current?.right ?? false,
        turbo: controlsRef.current?.turbo ?? false,
        jumpQueued: controlsRef.current?.jumpQueued ?? false,
      };

      if (controlsRef.current) {
        controlsRef.current.jumpQueued = false;
      }

      const result = stepHomeArcadeLevel1(
        gameRef.current,
        controlsSnapshot,
        deltaSeconds,
      );

      gameRef.current = result.nextState;
      onStateChange(result.nextState);

      if (result.cues.length) {
        result.cues.forEach((cue) => {
          playHomeArcadeSound(cue);
        });

        onCues?.(result.cues);
      }

      if (result.nextState.phase === "playing") {
        rafRef.current = globalThis.requestAnimationFrame(tick);
        return;
      }

      stopLoop();
    };

    rafRef.current = globalThis.requestAnimationFrame(tick);

    return () => {
      stopLoop();
    };
  }, [controlsRef, enabled, game.phase, onCues, onStateChange, stopLoop]);

  return {
    isRunning: enabled && game.phase === "playing" && rafRef.current !== null,
    stopLoop,
  };
}
