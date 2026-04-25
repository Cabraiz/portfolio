import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import HomeArcadeCanvas from "./HomeArcadeCanvas";
import HomeArcadeControls from "./HomeArcadeControls";
import HomeArcadeHud from "./HomeArcadeHud";
import {
  getHomeArcadeAudioEngine,
  playHomeArcadeSound,
} from "./homeArcade.audio";
import {
  createHomeArcadeInitialState,
  getHomeArcadeProgress,
  stepHomeArcadeLevel1,
} from "./domain/homeArcade.helpers";
import type {
  HomeArcadeGameState,
  HomeArcadeSoundCue,
  MutableHomeArcadeControlState,
} from "./domain/homeArcade.types";

export type HomeArcadeGameProps = Readonly<{
  portraitSrc: string;
  portraitAlt?: string;
  onClose: () => void;
}>;

export default function HomeArcadeGame({
  portraitSrc,
  portraitAlt = "Mateus Cabral",
  onClose,
}: HomeArcadeGameProps) {
  const [game, setGame] = useState<HomeArcadeGameState>(() =>
    createHomeArcadeInitialState(),
  );
  const [avatarLoaded, setAvatarLoaded] = useState(false);

  const controlsRef = useRef<MutableHomeArcadeControlState>({
    left: false,
    right: false,
    turbo: false,
    jumpQueued: false,
  });

  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);
  const gameRef = useRef(game);
  const audioPrimedRef = useRef(false);

  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  const primeAudio = useCallback(async () => {
    if (audioPrimedRef.current) {
      return;
    }

    audioPrimedRef.current = true;
    await getHomeArcadeAudioEngine().prime();
  }, []);

  const resetControls = useCallback(() => {
    controlsRef.current.left = false;
    controlsRef.current.right = false;
    controlsRef.current.turbo = false;
    controlsRef.current.jumpQueued = false;
  }, []);

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) {
      globalThis.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    lastFrameRef.current = null;
  }, []);

  const restartGame = useCallback(() => {
    stopLoop();
    resetControls();
    setGame(createHomeArcadeInitialState());
    playHomeArcadeSound("click");
  }, [resetControls, stopLoop]);

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

  const handleJumpPress = useCallback(() => {
    void primeAudio();

    if (gameRef.current.phase !== "playing") {
      return;
    }

    controlsRef.current.jumpQueued = true;
  }, [primeAudio]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      if (key === " " || key === "arrowup" || key === "w") {
        event.preventDefault();
        handleJumpPress();
      }

      if (key === "p") {
        togglePause();
      }

      if (key === "r") {
        restartGame();
      }

      if (event.key === "Escape") {
        onClose();
      }
    };

    const handleBlur = () => {
      resetControls();
    };

    window.addEventListener("keydown", handleKeyDown, { passive: false });
    window.addEventListener("blur", handleBlur);
    window.addEventListener("pointerup", handleBlur);
    window.addEventListener("pointercancel", handleBlur);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("pointerup", handleBlur);
      window.removeEventListener("pointercancel", handleBlur);
    };
  }, [handleJumpPress, onClose, resetControls, restartGame, togglePause]);

  useEffect(() => {
    if (game.phase !== "playing") {
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
        left: false,
        right: false,
        turbo: false,
        jumpQueued: controlsRef.current.jumpQueued,
      };

      controlsRef.current.jumpQueued = false;

      const result = stepHomeArcadeLevel1(
        gameRef.current,
        controlsSnapshot,
        deltaSeconds,
      );

      gameRef.current = result.nextState;
      setGame(result.nextState);

      if (result.cues.length) {
        result.cues.forEach((cue: HomeArcadeSoundCue) => {
          playHomeArcadeSound(cue);
        });
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
  }, [game.phase, stopLoop]);

  useEffect(() => {
    return () => {
      stopLoop();
    };
  }, [stopLoop]);

  const progress = useMemo(() => {
    return getHomeArcadeProgress(game.timeLeft);
  }, [game.timeLeft]);

  const shellStyle = useMemo<CSSProperties>(() => {
    return {
      position: "relative",
      width: "100%",
      height: "100%",
      minHeight: 0,
      display: "grid",
      gridTemplateRows: "auto minmax(0, 1fr)",
      borderRadius: "30px",
      overflow: "hidden",
      background:
        "linear-gradient(180deg, rgba(10,12,32,0.98) 0%, rgba(15,10,26,0.99) 100%)",
      border: "1px solid rgba(154, 176, 255, 0.18)",
      boxShadow:
        "0 32px 90px rgba(0,0,0,0.48), 0 0 0 1px rgba(255,255,255,0.03) inset, 0 0 64px rgba(121, 84, 255, 0.18)",
      boxSizing: "border-box",
      isolation: "isolate",
    };
  }, []);

  const ambientStyle = useMemo<CSSProperties>(() => {
    return {
      position: "absolute",
      inset: 0,
      background:
        "radial-gradient(circle at 50% 16%, rgba(255, 94, 193, 0.22) 0%, rgba(255,255,255,0) 26%), radial-gradient(circle at 18% 24%, rgba(78, 195, 255, 0.2) 0%, rgba(255,255,255,0) 24%), radial-gradient(circle at 80% 26%, rgba(255, 198, 62, 0.16) 0%, rgba(255,255,255,0) 20%), linear-gradient(180deg, rgba(18,19,54,0.78) 0%, rgba(12, 8, 22, 0.56) 50%, rgba(14, 12, 18, 0.92) 100%)",
      pointerEvents: "none",
    };
  }, []);

  const contentStyle = useMemo<CSSProperties>(() => {
    return {
      position: "relative",
      zIndex: 1,
      minHeight: 0,
      display: "grid",
      gridTemplateRows: "auto auto minmax(0, 1fr) auto",
      gap: "10px",
      padding: "12px 12px 10px",
      boxSizing: "border-box",
    };
  }, []);

  const progressBarTrackStyle = useMemo<CSSProperties>(() => {
    return {
      position: "relative",
      width: "100%",
      height: "10px",
      borderRadius: "999px",
      background: "rgba(255,255,255,0.08)",
      overflow: "hidden",
      boxShadow: "inset 0 1px 2px rgba(0,0,0,0.28)",
      boxSizing: "border-box",
    };
  }, []);

  const progressBarFillStyle = useMemo<CSSProperties>(() => {
    return {
      position: "absolute",
      inset: 0,
      width: `${Math.max(0, Math.min(100, progress * 100))}%`,
      borderRadius: "inherit",
      background:
        "linear-gradient(90deg, #4be1ff 0%, #8b6dff 38%, #ff5db5 72%, #ffd04c 100%)",
      boxShadow:
        "0 0 18px rgba(139, 109, 255, 0.25), 0 0 20px rgba(255, 93, 181, 0.18)",
      transition: "width 120ms linear",
    };
  }, [progress]);

  const canvasWrapStyle = useMemo<CSSProperties>(() => {
    return {
      position: "relative",
      minHeight: 0,
      height: "100%",
      display: "flex",
      overflow: "hidden",
      borderRadius: "24px",
    };
  }, []);

  const controlsWrapStyle = useMemo<CSSProperties>(() => {
    return {
      position: "relative",
      zIndex: 2,
    };
  }, []);

  const isInteractive = game.phase === "playing";

  return (
    <div style={shellStyle}>
      <div style={ambientStyle} />

      <HomeArcadeHud
        portraitSrc={portraitSrc}
        portraitAlt={portraitAlt}
        avatarLoaded={avatarLoaded}
        onAvatarLoad={() => setAvatarLoaded(true)}
        score={game.score}
        lives={game.lives}
        timeLeft={game.timeLeft}
        phase={game.phase}
        onTogglePause={togglePause}
        onClose={onClose}
      />

      <div style={contentStyle}>
        <div style={progressBarTrackStyle}>
          <div style={progressBarFillStyle} />
        </div>

        <div style={canvasWrapStyle}>
          <HomeArcadeCanvas
            portraitSrc={portraitSrc}
            portraitAlt={portraitAlt}
            phase={game.phase}
            player={game.player}
            coins={game.coins}
            hazards={game.hazards}
            score={game.score}
            bestCombo={game.bestCombo}
            onPrimaryAction={restartGame}
            onSecondaryAction={game.phase === "paused" ? resumeGame : onClose}
          />
        </div>

        <div style={controlsWrapStyle}>
          <HomeArcadeControls
            isInteractive={isInteractive}
            onJumpPress={handleJumpPress}
          />
        </div>
      </div>
    </div>
  );
}
