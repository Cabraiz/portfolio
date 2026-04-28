// src/pages/Mateus/Home/components/mobile/game/driving/view/HomeDriveGame.tsx

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type CSSProperties,
} from "react";

import useHomeDriveEngineAudio from "../audio/useHomeDriveEngineAudio";
import { useHomeDriveRuntimeRefs } from "../hooks/useHomeDriveRuntimeRefs";
import { useHomeDriveSteeringWheel } from "../hooks/useHomeDriveSteeringWheel";
import { useHomeDriveViewport } from "../hooks/useHomeDriveViewport";
import HomeDriveThreeScene from "../three/HomeDriveThreeScene";
import HomeDriveCompass from "./HomeDriveCompass";
import styles from "./HomeDriveGame.module.css";
import HomeDriveSteeringWheel from "./HomeDriveSteeringWheel";

export type HomeDriveGameProps = Readonly<{
  onClose?: () => void;
}>;

type HiddenCloseTapState = {
  count: number;
  lastTapAt: number;
};

type HomeDriveRawAudioWindow = Window &
  typeof globalThis & {
    __homeDriveRawAudio?: HTMLAudioElement;
  };

/**
 * Temporário para diagnosticar.
 *
 * true  = mostra botão "Testar motor".
 * false = esconde depois que confirmar o áudio.
 */
const SHOW_RAW_ENGINE_AUDIO_TEST_BUTTON = true;

const HOME_DRIVE_RAW_ENGINE_AUDIO_SOURCE =
  "/audio/home-drive/engine/engine-idle-loop.mp3";

function getEventTargetElement(
  target: EventTarget | null,
): HTMLElement | null {
  return target instanceof HTMLElement ? target : null;
}

function isRawAudioTestTarget(target: EventTarget | null): boolean {
  const element = getEventTargetElement(target);

  if (!element) {
    return false;
  }

  return Boolean(element.closest("[data-home-drive-engine-audio-test='true']"));
}

export default function HomeDriveGame({ onClose }: HomeDriveGameProps) {
  const { rootRef, viewport } = useHomeDriveViewport();
  const steeringWheel = useHomeDriveSteeringWheel();

  const {
    runtimeRef,
    inputRef,
    runtimeSnapshot,
    patchInputRef,
    publishRuntimeSnapshot,
  } = useHomeDriveRuntimeRefs();

  const closeTapRef = useRef<HiddenCloseTapState>({
    count: 0,
    lastTapAt: 0,
  });

  const engineAudio = useHomeDriveEngineAudio({
    runtimeRef,
    inputRef,
    enabled: true,
    paused: false,
    muted: false,
    masterVolume: 1,
    updateHz: 30,
    settings: {
      masterVolume: 1,
      idleVolume: 0.72,
      lowVolume: 0.76,
      highVolume: 0.58,
      speedForFullBlendMps: 34,
      minPlaybackRate: 0.78,
      maxPlaybackRate: 1.36,
      fadeLerp: 0.16,
    },
  });

  useEffect(() => {
    patchInputRef({
      steering: steeringWheel.steering,
      throttle: 1,
      brake: 0,
    });
  }, [patchInputRef, steeringWheel.steering]);

  const startEngineAudioFromGesture = useCallback(() => {
    /*
      Único ponto oficial de início do áudio normal do jogo.

      Não chame unlock/start/resume manualmente aqui.
      O controller encapsula a ordem correta para evitar:
      - autoplay fora do gesto;
      - play() duplicado;
      - play() seguido de pause();
      - promise de play travada.
    */
    engineAudio.startFromGesture();
  }, [engineAudio]);

  const testRawEngineAudio = useCallback(() => {
    const previousRawAudio = (window as HomeDriveRawAudioWindow)
      .__homeDriveRawAudio;

    if (previousRawAudio) {
      previousRawAudio.pause();
      previousRawAudio.removeAttribute("src");
      previousRawAudio.load();
    }

    const audio = new Audio(HOME_DRIVE_RAW_ENGINE_AUDIO_SOURCE);

    audio.loop = true;
    audio.volume = 1;
    audio.muted = false;
    audio.preload = "auto";

    (window as HomeDriveRawAudioWindow).__homeDriveRawAudio = audio;

    console.log("[RAW_ENGINE_AUDIO_TEST] created", {
      src: audio.src,
      volume: audio.volume,
      muted: audio.muted,
      paused: audio.paused,
      readyState: audio.readyState,
      networkState: audio.networkState,
    });

    audio.addEventListener("loadstart", () => {
      console.log("[RAW_ENGINE_AUDIO_TEST] loadstart", {
        src: audio.currentSrc || audio.src,
        readyState: audio.readyState,
        networkState: audio.networkState,
      });
    });

    audio.addEventListener("canplay", () => {
      console.log("[RAW_ENGINE_AUDIO_TEST] canplay", {
        src: audio.currentSrc || audio.src,
        readyState: audio.readyState,
        networkState: audio.networkState,
        duration: audio.duration,
      });
    });

    audio.addEventListener("canplaythrough", () => {
      console.log("[RAW_ENGINE_AUDIO_TEST] canplaythrough", {
        src: audio.currentSrc || audio.src,
        readyState: audio.readyState,
        networkState: audio.networkState,
        duration: audio.duration,
      });
    });

    audio.addEventListener("playing", () => {
      console.log("[RAW_ENGINE_AUDIO_TEST] playing", {
        src: audio.currentSrc || audio.src,
        paused: audio.paused,
        muted: audio.muted,
        volume: audio.volume,
        currentTime: audio.currentTime,
        duration: audio.duration,
        readyState: audio.readyState,
        networkState: audio.networkState,
      });
    });

    audio.addEventListener("pause", () => {
      console.log("[RAW_ENGINE_AUDIO_TEST] pause", {
        src: audio.currentSrc || audio.src,
        paused: audio.paused,
        currentTime: audio.currentTime,
      });
    });

    audio.addEventListener("error", () => {
      console.error("[RAW_ENGINE_AUDIO_TEST] media error", {
        src: audio.currentSrc || audio.src,
        readyState: audio.readyState,
        networkState: audio.networkState,
        error: audio.error,
      });
    });

    void audio.play().then(
      () => {
        console.log("[RAW_ENGINE_AUDIO_TEST] play resolved", {
          src: audio.currentSrc || audio.src,
          paused: audio.paused,
          muted: audio.muted,
          volume: audio.volume,
          readyState: audio.readyState,
          networkState: audio.networkState,
        });
      },
      (error) => {
        console.error("[RAW_ENGINE_AUDIO_TEST] play rejected", {
          src: audio.currentSrc || audio.src,
          readyState: audio.readyState,
          networkState: audio.networkState,
          error,
        });
      },
    );
  }, []);

  useEffect(() => {
    if (!onClose) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      event.preventDefault();
      engineAudio.stop();
      onClose();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [engineAudio, onClose]);

  const handlePointerDownCapture = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      /*
        Importante:
        O botão de teste precisa testar o áudio bruto isolado.
        Então, se o pointer veio do botão de teste, não dispara o controller.
      */
      if (isRawAudioTestTarget(event.target)) {
        return;
      }

      startEngineAudioFromGesture();

      if (!onClose) {
        return;
      }

      const isHiddenCloseZone = event.clientX <= 76 && event.clientY <= 76;

      if (!isHiddenCloseZone) {
        return;
      }

      const now = performance.now();
      const previous = closeTapRef.current;
      const count = now - previous.lastTapAt <= 620 ? previous.count + 1 : 1;

      closeTapRef.current = {
        count,
        lastTapAt: now,
      };

      if (count < 2) {
        return;
      }

      closeTapRef.current = {
        count: 0,
        lastTapAt: 0,
      };

      engineAudio.stop();
      onClose();
    },
    [engineAudio, onClose, startEngineAudioFromGesture],
  );

  const rootStyle = useMemo<CSSProperties>(() => {
    return {
      "--home-drive-vw": `${viewport.width}px`,
      "--home-drive-vh": `${viewport.height}px`,
      "--free-drive-vw": `${viewport.width}px`,
      "--free-drive-vh": `${viewport.height}px`,
    } as CSSProperties;
  }, [viewport.height, viewport.width]);

  return (
    <div
      ref={rootRef}
      className={styles.root}
      style={rootStyle}
      onPointerDownCapture={handlePointerDownCapture}
    >
      {SHOW_RAW_ENGINE_AUDIO_TEST_BUTTON ? (
        <button
          type="button"
          data-home-drive-engine-audio-test="true"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            testRawEngineAudio();
          }}
          style={{
            position: "fixed",
            left: 16,
            top: 16,
            zIndex: 999999,
            padding: "12px 16px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.35)",
            background: "rgba(0,0,0,0.78)",
            color: "#fff",
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: "0.02em",
            pointerEvents: "auto",
            touchAction: "manipulation",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          Testar motor
        </button>
      ) : null}

      <HomeDriveThreeScene
        runtimeRef={runtimeRef}
        inputRef={inputRef}
        viewport={viewport}
        publishRuntimeSnapshot={publishRuntimeSnapshot}
      />

      <HomeDriveCompass
        className={styles.compass}
        headingRad={runtimeSnapshot.car.headingRad}
      />

      <HomeDriveSteeringWheel controller={steeringWheel} />
    </div>
  );
}
