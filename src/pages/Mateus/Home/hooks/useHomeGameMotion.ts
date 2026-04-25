import { useEffect, useMemo, useRef } from "react";

import {
  HOME_GAME_EXIT_ANIMATION_MS,
  HOME_GAME_RIPPLE_DURATION_MS,
} from "../components/mobile/game/homeGame.tokens";
import type { HomeGamePhase } from "../components/mobile/game/homeGame.types";

export type UseHomeGameMotionParams = Readonly<{
  isOpen: boolean;
  phase: HomeGamePhase;
  introDurationMs?: number;
  exitDurationMs?: number;
  completedHoldMs?: number;
  onIntroComplete?: () => void;
  onExitComplete?: () => void;
  onCompletedHoldComplete?: () => void;
}>;

export type UseHomeGameMotionResult = Readonly<{
  isIntroPhase: boolean;
  isPlayingPhase: boolean;
  isCompletedPhase: boolean;
  isExitingPhase: boolean;
  isStageInteractive: boolean;
  shouldPauseAttractMode: boolean;
  stageMotionPreset: "hidden" | "intro" | "playing" | "completed" | "exiting";
}>;

const DEFAULT_INTRO_DURATION_MS = 460;
const DEFAULT_COMPLETED_HOLD_MS = HOME_GAME_RIPPLE_DURATION_MS;

export default function useHomeGameMotion({
  isOpen,
  phase,
  introDurationMs = DEFAULT_INTRO_DURATION_MS,
  exitDurationMs = HOME_GAME_EXIT_ANIMATION_MS,
  completedHoldMs = DEFAULT_COMPLETED_HOLD_MS,
  onIntroComplete,
  onExitComplete,
  onCompletedHoldComplete,
}: UseHomeGameMotionParams): UseHomeGameMotionResult {
  const introTimerRef = useRef<number | null>(null);
  const exitTimerRef = useRef<number | null>(null);
  const completedTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (introTimerRef.current !== null) {
        window.clearTimeout(introTimerRef.current);
      }

      if (exitTimerRef.current !== null) {
        window.clearTimeout(exitTimerRef.current);
      }

      if (completedTimerRef.current !== null) {
        window.clearTimeout(completedTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (introTimerRef.current !== null) {
      window.clearTimeout(introTimerRef.current);
      introTimerRef.current = null;
    }

    if (!isOpen || phase !== "intro") {
      return;
    }

    introTimerRef.current = window.setTimeout(() => {
      onIntroComplete?.();
      introTimerRef.current = null;
    }, introDurationMs);

    return () => {
      if (introTimerRef.current !== null) {
        window.clearTimeout(introTimerRef.current);
        introTimerRef.current = null;
      }
    };
  }, [introDurationMs, isOpen, onIntroComplete, phase]);

  useEffect(() => {
    if (exitTimerRef.current !== null) {
      window.clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }

    if (!isOpen || phase !== "exiting") {
      return;
    }

    exitTimerRef.current = window.setTimeout(() => {
      onExitComplete?.();
      exitTimerRef.current = null;
    }, exitDurationMs);

    return () => {
      if (exitTimerRef.current !== null) {
        window.clearTimeout(exitTimerRef.current);
        exitTimerRef.current = null;
      }
    };
  }, [exitDurationMs, isOpen, onExitComplete, phase]);

  useEffect(() => {
    if (completedTimerRef.current !== null) {
      window.clearTimeout(completedTimerRef.current);
      completedTimerRef.current = null;
    }

    if (!isOpen || phase !== "completed") {
      return;
    }

    if (completedHoldMs <= 0) {
      onCompletedHoldComplete?.();
      return;
    }

    completedTimerRef.current = window.setTimeout(() => {
      onCompletedHoldComplete?.();
      completedTimerRef.current = null;
    }, completedHoldMs);

    return () => {
      if (completedTimerRef.current !== null) {
        window.clearTimeout(completedTimerRef.current);
        completedTimerRef.current = null;
      }
    };
  }, [
    completedHoldMs,
    isOpen,
    onCompletedHoldComplete,
    phase,
  ]);

  return useMemo<UseHomeGameMotionResult>(() => {
    const isIntroPhase = isOpen && phase === "intro";
    const isPlayingPhase = isOpen && phase === "playing";
    const isCompletedPhase = isOpen && phase === "completed";
    const isExitingPhase = isOpen && phase === "exiting";

    let stageMotionPreset: UseHomeGameMotionResult["stageMotionPreset"] = "hidden";

    if (isIntroPhase) {
      stageMotionPreset = "intro";
    } else if (isPlayingPhase) {
      stageMotionPreset = "playing";
    } else if (isCompletedPhase) {
      stageMotionPreset = "completed";
    } else if (isExitingPhase) {
      stageMotionPreset = "exiting";
    }

    return {
      isIntroPhase,
      isPlayingPhase,
      isCompletedPhase,
      isExitingPhase,
      isStageInteractive: isPlayingPhase || isCompletedPhase,
      shouldPauseAttractMode: isOpen,
      stageMotionPreset,
    };
  }, [isOpen, phase]);
}
