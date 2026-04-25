import React, { useCallback, useMemo, useRef, useState } from "react";

import {
  getHomeArcadeAudioEngine,
  playHomeArcadeSound,
} from "../components/mobile/game/homeArcade.audio";
import {
  createHomeArcadeInitialState,
  getHomeArcadeOverlaySnapshot,
  getHomeArcadeProgressSummary,
} from "../components/mobile/game/domain/homeArcade.helpers";
import type {
  HomeArcadeControlState,
  HomeArcadeGameState,
  HomeArcadeOverlaySnapshot,
  HomeArcadeProgressSummary,
  HomeArcadeTickResult,
  MutableHomeArcadeControlState,
} from "../components/mobile/game/domain/homeArcade.types";

export type UseHomeArcadeStateParams = Readonly<{
  onWin?: (state: HomeArcadeGameState) => void;
  onLose?: (state: HomeArcadeGameState) => void;
}>;

export type UseHomeArcadeStateResult = Readonly<{
  game: HomeArcadeGameState;
  controlsRef: React.MutableRefObject<MutableHomeArcadeControlState>;
  controlState: HomeArcadeControlState;
  overlaySnapshot: HomeArcadeOverlaySnapshot;
  progressSummary: HomeArcadeProgressSummary;
  isInteractive: boolean;
  setGame: React.Dispatch<React.SetStateAction<HomeArcadeGameState>>;
  applyTickResult: (result: HomeArcadeTickResult) => void;
  restartGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  togglePause: () => void;
  setControlActive: (
    control: keyof Omit<MutableHomeArcadeControlState, "jumpQueued">,
    active: boolean,
  ) => void;
  queueJump: () => void;
  clearQueuedJump: () => void;
  resetControls: () => void;
  primeAudio: () => Promise<void>;
}>;

const INITIAL_CONTROLS: MutableHomeArcadeControlState = {
  left: false,
  right: false,
  turbo: false,
  jumpQueued: false,
};

export default function useHomeArcadeState({
  onWin,
  onLose,
}: UseHomeArcadeStateParams = {}): UseHomeArcadeStateResult {
  const [game, setGame] = useState<HomeArcadeGameState>(() =>
    createHomeArcadeInitialState(),
  );

  const controlsRef = useRef<MutableHomeArcadeControlState>({
    ...INITIAL_CONTROLS,
  });

  const [controlState, setControlState] = useState<HomeArcadeControlState>({
    ...INITIAL_CONTROLS,
  });

  const primeAudio = useCallback(async () => {
    await getHomeArcadeAudioEngine().prime();
  }, []);

  const resetControls = useCallback(() => {
    controlsRef.current.left = false;
    controlsRef.current.right = false;
    controlsRef.current.turbo = false;
    controlsRef.current.jumpQueued = false;

    setControlState({
      left: false,
      right: false,
      turbo: false,
      jumpQueued: false,
    });
  }, []);

  const setControlActive = useCallback(
    (
      control: keyof Omit<MutableHomeArcadeControlState, "jumpQueued">,
      active: boolean,
    ) => {
      if (controlsRef.current[control] === active) {
        return;
      }

      controlsRef.current[control] = active;

      setControlState((current) => {
        if (current[control] === active) {
          return current;
        }

        return {
          ...current,
          [control]: active,
        };
      });

      if (control === "turbo" && active) {
        playHomeArcadeSound("turbo");
      }
    },
    [],
  );

  const queueJump = useCallback(() => {
    controlsRef.current.jumpQueued = true;

    setControlState((current) => {
      if (current.jumpQueued) {
        return current;
      }

      return {
        ...current,
        jumpQueued: true,
      };
    });
  }, []);

  const clearQueuedJump = useCallback(() => {
    controlsRef.current.jumpQueued = false;

    setControlState((current) => {
      if (!current.jumpQueued) {
        return current;
      }

      return {
        ...current,
        jumpQueued: false,
      };
    });
  }, []);

  const restartGame = useCallback(() => {
    resetControls();
    setGame(createHomeArcadeInitialState());
    playHomeArcadeSound("click");
  }, [resetControls]);

  const pauseGame = useCallback(() => {
    setGame((current) => {
      if (current.phase !== "playing") {
        return current;
      }

      playHomeArcadeSound("pause");

      return {
        ...current,
        phase: "paused",
      };
    });
  }, []);

  const resumeGame = useCallback(() => {
    setGame((current) => {
      if (current.phase !== "paused") {
        return current;
      }

      playHomeArcadeSound("resume");

      return {
        ...current,
        phase: "playing",
      };
    });
  }, []);

  const togglePause = useCallback(() => {
    setGame((current) => {
      if (current.phase === "playing") {
        playHomeArcadeSound("pause");

        return {
          ...current,
          phase: "paused",
        };
      }

      if (current.phase === "paused") {
        playHomeArcadeSound("resume");

        return {
          ...current,
          phase: "playing",
        };
      }

      return current;
    });
  }, []);

  const applyTickResult = useCallback(
    (result: HomeArcadeTickResult) => {
      setGame((current) => {
        const previousPhase = current.phase;
        const nextState = result.nextState;

        if (previousPhase !== nextState.phase) {
          if (nextState.phase === "won") {
            onWin?.(nextState);
          }

          if (nextState.phase === "lost") {
            onLose?.(nextState);
          }
        }

        return nextState;
      });

      if (controlsRef.current.jumpQueued) {
        controlsRef.current.jumpQueued = false;
      }

      setControlState((current) => {
        if (!current.jumpQueued) {
          return current;
        }

        return {
          ...current,
          jumpQueued: false,
        };
      });
    },
    [onLose, onWin],
  );

  const overlaySnapshot = useMemo(() => {
    return getHomeArcadeOverlaySnapshot(game.phase);
  }, [game.phase]);

  const progressSummary = useMemo(() => {
    return getHomeArcadeProgressSummary(game);
  }, [game]);

  const isInteractive = game.phase === "playing";

  return {
    game,
    controlsRef,
    controlState,
    overlaySnapshot,
    progressSummary,
    isInteractive,
    setGame,
    applyTickResult,
    restartGame,
    pauseGame,
    resumeGame,
    togglePause,
    setControlActive,
    queueJump,
    clearQueuedJump,
    resetControls,
    primeAudio,
  };
}
