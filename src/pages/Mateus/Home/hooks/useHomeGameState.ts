import { useCallback, useMemo, useState } from "react";

import type { HomeGamePhase } from "../components/mobile/game/homeGame.types";

export type UseHomeGameStateParams = Readonly<{
  totalCollectibles?: number;
  defaultOpen?: boolean;
  onComplete?: (collectedIds: readonly string[]) => void;
}>;

export type UseHomeGameStateResult = Readonly<{
  isOpen: boolean;
  phase: HomeGamePhase;
  collectedIds: readonly string[];
  collectedSet: ReadonlySet<string>;
  progress: number;
  hasCompleted: boolean;
  openGame: () => void;
  requestCloseGame: () => void;
  finishCloseGame: () => void;
  resetGame: () => void;
  restartFromIntro: () => void;
  startPlaying: () => void;
  collectItem: (itemId: string) => boolean;
  hasCollected: (itemId: string) => boolean;
}>;

function clampProgress(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export default function useHomeGameState({
  totalCollectibles = 0,
  defaultOpen = false,
  onComplete,
}: UseHomeGameStateParams): UseHomeGameStateResult {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [phase, setPhase] = useState<HomeGamePhase>(
    defaultOpen ? "intro" : "idle",
  );
  const [collectedIds, setCollectedIds] = useState<readonly string[]>([]);

  const collectedSet = useMemo(() => {
    return new Set(collectedIds);
  }, [collectedIds]);

  const progress = useMemo(() => {
    if (totalCollectibles <= 0) {
      return 0;
    }

    return clampProgress(collectedIds.length / totalCollectibles);
  }, [collectedIds.length, totalCollectibles]);

  const hasCompleted = isOpen && totalCollectibles > 0 && collectedIds.length >= totalCollectibles;

  const openGame = useCallback(() => {
    setCollectedIds([]);
    setIsOpen(true);
    setPhase("intro");
  }, []);

  const requestCloseGame = useCallback(() => {
    setPhase((current) => {
      if (current === "idle") {
        return "idle";
      }

      return "exiting";
    });
  }, []);

  const finishCloseGame = useCallback(() => {
    setIsOpen(false);
    setPhase("idle");
    setCollectedIds([]);
  }, []);

  const resetGame = useCallback(() => {
    setCollectedIds([]);
    setPhase((current) => {
      if (!isOpen) {
        return "idle";
      }

      if (current === "intro") {
        return "intro";
      }

      return "playing";
    });
  }, [isOpen]);

  const restartFromIntro = useCallback(() => {
    if (!isOpen) {
      setIsOpen(true);
    }

    setCollectedIds([]);
    setPhase("intro");
  }, [isOpen]);

  const startPlaying = useCallback(() => {
    if (!isOpen) {
      return;
    }

    setPhase((current) => {
      if (current === "completed") {
        return "completed";
      }

      if (current === "exiting") {
        return "exiting";
      }

      return "playing";
    });
  }, [isOpen]);

  const collectItem = useCallback(
    (itemId: string) => {
      if (!isOpen || !itemId) {
        return false;
      }

      let added = false;

      setCollectedIds((current) => {
        if (current.includes(itemId)) {
          return current;
        }

        added = true;

        const next = [...current, itemId];

        if (totalCollectibles > 0 && next.length >= totalCollectibles) {
          setPhase("completed");
          onComplete?.(next);
        } else if (phase !== "completed" && phase !== "exiting") {
          setPhase("playing");
        }

        return next;
      });

      return added;
    },
    [isOpen, onComplete, phase, totalCollectibles],
  );

  const hasCollected = useCallback(
    (itemId: string) => {
      return collectedSet.has(itemId);
    },
    [collectedSet],
  );

  return useMemo<UseHomeGameStateResult>(() => {
    return {
      isOpen,
      phase,
      collectedIds,
      collectedSet,
      progress,
      hasCompleted,
      openGame,
      requestCloseGame,
      finishCloseGame,
      resetGame,
      restartFromIntro,
      startPlaying,
      collectItem,
      hasCollected,
    };
  }, [
    isOpen,
    phase,
    collectedIds,
    collectedSet,
    progress,
    hasCompleted,
    openGame,
    requestCloseGame,
    finishCloseGame,
    resetGame,
    restartFromIntro,
    startPlaying,
    collectItem,
    hasCollected,
  ]);
}
