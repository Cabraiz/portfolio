// src/pages/Mateus/Home/components/mobile/game/driving/audio/homeDrive.engineAudioController.ts

import { HOME_DRIVE_ENGINE_AUDIO_ASSETS } from "./homeDrive.engineAudioAssets";
import {
  attachHomeDriveEngineAudioDiagnostics,
  getHomeDriveEngineAudioMediaErrorMessage,
  isHomeDriveEngineAudioDebugEnabled,
  logHomeDriveEngineAudioDiagnostic,
  logHomeDriveEngineAudioElementDiagnostic,
  normalizeHomeDriveEngineAudioErrorMessage,
} from "./homeDrive.engineAudioDiagnostics";
import { runHomeDriveEngineAudioPreflight } from "./homeDrive.engineAudioPreflight";
import type {
  HomeDriveEngineAudioAssetMap,
  HomeDriveEngineAudioController,
  HomeDriveEngineAudioControllerState,
  HomeDriveEngineAudioPlaybackStatus,
  HomeDriveEngineAudioRuntimeSnapshot,
  HomeDriveEngineAudioSettings,
  HomeDriveEngineAudioTrackKey,
  HomeDriveEngineAudioTrackState,
} from "./homeDrive.engineAudio.types";

const DEFAULT_ENGINE_AUDIO_SETTINGS: HomeDriveEngineAudioSettings = {
  masterVolume: 0.72,

  idleVolume: 0.26,
  lowVolume: 0.42,
  highVolume: 0.34,

  minPlaybackRate: 0.82,
  maxPlaybackRate: 1.42,

  speedForFullBlendMps: 34,
  highLayerStartRatio: 0.48,

  throttleGain: 0.18,
  brakeDucking: 0.32,

  fadeLerp: 0.095,
  preload: "auto",
};

type InternalTrack = {
  key: HomeDriveEngineAudioTrackKey;
  audio: HTMLAudioElement;
  source: string;
  volume: number;
  targetVolume: number;
  playbackRate: number;
  playPromise: Promise<void> | null;
  lastErrorMessage?: string;
  detachDiagnostics: () => void;
};

function canUseAudio(): boolean {
  return typeof window !== "undefined" && typeof Audio !== "undefined";
}

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
}

function lerpNumber(from: number, to: number, amount: number): number {
  return from + (to - from) * clampNumber(amount, 0, 1);
}

function normalizeVolume(value: number): number {
  return clampNumber(value, 0, 1);
}

function safePlaybackRate(value: number): number {
  return clampNumber(value, 0.25, 4);
}

function areAllEngineAssetsTheSame(
  assets: HomeDriveEngineAudioAssetMap,
): boolean {
  return assets.idle === assets.low && assets.low === assets.high;
}

function getMediaElementErrorMessage(audio: HTMLAudioElement): string | undefined {
  return getHomeDriveEngineAudioMediaErrorMessage(audio.error);
}

function createAudioElement(
  key: HomeDriveEngineAudioTrackKey,
  source: string,
  preload: HomeDriveEngineAudioSettings["preload"],
): InternalTrack {
  const audio = new Audio(source);

  audio.loop = true;
  audio.preload = preload;
  audio.volume = 0;
  audio.playbackRate = 1;
  audio.muted = false;
  audio.crossOrigin = "anonymous";

  audio.setAttribute("data-home-drive-engine-track", key);

  const detachDiagnostics = attachHomeDriveEngineAudioDiagnostics(audio, key);

  return {
    key,
    audio,
    source,
    volume: 0,
    targetVolume: 0,
    playbackRate: 1,
    playPromise: null,
    detachDiagnostics,
  };
}

function createTrackStates(
  tracks: ReadonlyMap<HomeDriveEngineAudioTrackKey, InternalTrack>,
): readonly HomeDriveEngineAudioTrackState[] {
  return Array.from(tracks.values()).map((track) => ({
    key: track.key,
    source: track.source,
    currentSource: track.audio.currentSrc || track.audio.src,
    volume: track.volume,
    targetVolume: track.targetVolume,
    playbackRate: track.playbackRate,
    isPlaying: !track.audio.paused,
    isPaused: track.audio.paused,
    readyState: track.audio.readyState,
    networkState: track.audio.networkState,
    errorMessage: track.lastErrorMessage ?? getMediaElementErrorMessage(track.audio),
  }));
}

function getIdleTargetVolume(
  speedRatio: number,
  throttle: number,
  settings: HomeDriveEngineAudioSettings,
): number {
  const stoppedWeight = 1 - speedRatio;
  const throttleLift = throttle * settings.throttleGain;

  return (
    settings.idleVolume *
    clampNumber(0.42 + stoppedWeight * 0.58 + throttleLift, 0, 1.15)
  );
}

function getLowTargetVolume(
  speedRatio: number,
  throttle: number,
  settings: HomeDriveEngineAudioSettings,
): number {
  const movementWeight = clampNumber(speedRatio * 1.25, 0, 1);
  const throttleLift = throttle * settings.throttleGain;

  return (
    settings.lowVolume *
    clampNumber(0.16 + movementWeight + throttleLift, 0, 1.25)
  );
}

function getHighTargetVolume(
  speedRatio: number,
  throttle: number,
  settings: HomeDriveEngineAudioSettings,
): number {
  const denominator = Math.max(0.001, 1 - settings.highLayerStartRatio);
  const highRatio = clampNumber(
    (speedRatio - settings.highLayerStartRatio) / denominator,
    0,
    1,
  );

  const throttleLift = throttle * settings.throttleGain;

  return (
    settings.highVolume *
    clampNumber(highRatio + throttleLift * 0.72, 0, 1.18)
  );
}

function getSingleSourceTargetVolume(
  speedRatio: number,
  throttle: number,
  brake: number,
  settings: HomeDriveEngineAudioSettings,
): number {
  const speedLift = speedRatio * 0.42;
  const throttleLift = throttle * 0.18;
  const brakeDrop = brake * 0.16;

  return (
    settings.idleVolume *
    clampNumber(0.58 + speedLift + throttleLift - brakeDrop, 0, 1.22)
  );
}

function applyTrackAudioState(track: InternalTrack, muted: boolean): void {
  track.audio.volume = muted ? 0 : normalizeVolume(track.volume);
  track.audio.playbackRate = safePlaybackRate(track.playbackRate);
}

function isBlockedPlayError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "NotAllowedError";
}

function isAbortPlayError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function restoreSourceIfNeeded(track: InternalTrack): void {
  if (track.audio.src) {
    return;
  }

  track.audio.src = track.source;
  track.audio.load();
}

function pauseTrack(track: InternalTrack): void {
  track.audio.pause();
  track.playPromise = null;
}

function resetTrackTime(track: InternalTrack): void {
  try {
    track.audio.currentTime = 0;
  } catch {
    // Some browsers can throw if metadata is not ready. Safe to ignore.
  }
}

export function createHomeDriveEngineAudioController(
  options: Partial<{
    assets: HomeDriveEngineAudioAssetMap;
    settings: Partial<HomeDriveEngineAudioSettings>;
    muted: boolean;
  }> = {},
): HomeDriveEngineAudioController {
  const settings: HomeDriveEngineAudioSettings = {
    ...DEFAULT_ENGINE_AUDIO_SETTINGS,
    ...options.settings,
  };

  const assets = options.assets ?? HOME_DRIVE_ENGINE_AUDIO_ASSETS;
  const useSingleSharedSource = areAllEngineAssetsTheSame(assets);

  const tracks = new Map<HomeDriveEngineAudioTrackKey, InternalTrack>();

  let isUnlocked = false;
  let isStarted = false;
  let isMuted = Boolean(options.muted);
  let masterVolume = normalizeVolume(settings.masterVolume);
  let isDisposed = false;
  let status: HomeDriveEngineAudioPlaybackStatus = "idle";
  let lastErrorMessage: string | undefined;
  let hasRunPreflight = false;

  function setStatus(nextStatus: HomeDriveEngineAudioPlaybackStatus): void {
    if (status === "disposed") {
      return;
    }

    status = nextStatus;
  }

  function setLastError(error: unknown): void {
    lastErrorMessage = normalizeHomeDriveEngineAudioErrorMessage(error);
  }

  function clearLastError(): void {
    lastErrorMessage = undefined;
  }

  function maybeRunPreflight(): void {
    if (hasRunPreflight || !isHomeDriveEngineAudioDebugEnabled()) {
      return;
    }

    hasRunPreflight = true;

    const uniqueSources = new Set(Object.values(assets));

    for (const source of uniqueSources) {
      void runHomeDriveEngineAudioPreflight(source, {
        logResult: true,
        requireAudioContentType: false,
      });
    }
  }

  function ensureTracks(): void {
    if (!canUseAudio() || isDisposed || tracks.size > 0) {
      return;
    }

    maybeRunPreflight();

    if (useSingleSharedSource) {
      tracks.set(
        "idle",
        createAudioElement("idle", assets.idle, settings.preload),
      );

      setStatus("ready");
      return;
    }

    tracks.set("idle", createAudioElement("idle", assets.idle, settings.preload));
    tracks.set("low", createAudioElement("low", assets.low, settings.preload));
    tracks.set("high", createAudioElement("high", assets.high, settings.preload));

    setStatus("ready");
  }

  function primeTracksForAudibleStart(): void {
    for (const track of tracks.values()) {
      if (track.key !== "idle" && useSingleSharedSource) {
        continue;
      }

      if (track.volume > 0) {
        continue;
      }

      const baseVolume =
        track.key === "idle"
          ? settings.idleVolume
          : track.key === "low"
            ? settings.lowVolume
            : settings.highVolume;

      const initialVolume =
        track.key === "idle"
          ? Math.max(0.18, baseVolume * masterVolume)
          : Math.max(0, baseVolume * masterVolume * 0.18);

      track.volume = normalizeVolume(initialVolume);
      track.targetVolume = track.volume;
    }
  }

  function attemptTrackPlay(track: InternalTrack): void {
    if (!canUseAudio() || isDisposed) {
      return;
    }

    restoreSourceIfNeeded(track);

    if (!track.audio.paused) {
      track.playPromise = null;
      track.lastErrorMessage = undefined;
      return;
    }

    if (track.playPromise) {
      return;
    }

    applyTrackAudioState(track, isMuted);

    setStatus("starting");

    const playPromise = track.audio.play();

    track.playPromise = playPromise;

    playPromise
      .then(() => {
        if (track.playPromise === playPromise) {
          track.playPromise = null;
        }

        track.lastErrorMessage = undefined;
        clearLastError();
        setStatus("playing");

        logHomeDriveEngineAudioElementDiagnostic(
          "debug",
          "play-resolved",
          track.audio,
          track.key,
        );
      })
      .catch((error) => {
        if (track.playPromise === playPromise) {
          track.playPromise = null;
        }

        const errorMessage = normalizeHomeDriveEngineAudioErrorMessage(error);

        track.lastErrorMessage = errorMessage;
        setLastError(error);

        if (isBlockedPlayError(error)) {
          setStatus("blocked");
        } else if (!isAbortPlayError(error)) {
          setStatus("error");
        }

        logHomeDriveEngineAudioDiagnostic(
          isAbortPlayError(error) ? "debug" : "warn",
          {
            event: "play-failed",
            key: track.key,
            src: track.audio.currentSrc || track.audio.src || track.source,
            status,
            readyState: track.audio.readyState,
            networkState: track.audio.networkState,
            paused: track.audio.paused,
            muted: track.audio.muted,
            volume: track.audio.volume,
            playbackRate: track.audio.playbackRate,
            error,
            errorMessage,
            details: {
              mediaError: getMediaElementErrorMessage(track.audio),
            },
          },
        );
      });
  }

  async function unlock(): Promise<boolean> {
    if (!canUseAudio() || isDisposed) {
      return false;
    }

    /*
      Não fazer play() seguido de pause() aqui.
      Unlock agora apenas prepara os elementos e marca o controller como liberado.
    */
    ensureTracks();

    isUnlocked = tracks.size > 0;

    if (isUnlocked && status === "idle") {
      setStatus("ready");
    }

    return isUnlocked;
  }

  function startFromGesture(): void {
    if (!canUseAudio() || isDisposed) {
      return;
    }

    ensureTracks();

    isUnlocked = tracks.size > 0;
    isStarted = true;

    if (!isUnlocked) {
      setStatus("error");
      lastErrorMessage = "No engine audio tracks were created.";
      return;
    }

    clearLastError();
    primeTracksForAudibleStart();

    for (const track of tracks.values()) {
      attemptTrackPlay(track);
    }
  }

  function start(): void {
    /*
      Mantido por compatibilidade.
      Preferir startFromGesture() no componente.
    */
    startFromGesture();
  }

  function pause(): void {
    if (isDisposed) {
      return;
    }

    for (const track of tracks.values()) {
      pauseTrack(track);
    }

    if (isStarted) {
      setStatus("paused");
    }
  }

  function resume(): void {
    if (!canUseAudio() || isDisposed || !isStarted) {
      return;
    }

    ensureTracks();

    for (const track of tracks.values()) {
      attemptTrackPlay(track);
    }
  }

  function stop(): void {
    if (isDisposed) {
      return;
    }

    isStarted = false;

    for (const track of tracks.values()) {
      track.volume = 0;
      track.targetVolume = 0;
      track.playbackRate = 1;
      track.lastErrorMessage = undefined;

      track.audio.volume = 0;
      track.audio.playbackRate = 1;

      pauseTrack(track);
      resetTrackTime(track);
    }

    clearLastError();
    setStatus("idle");
  }

  function dispose(): void {
    if (isDisposed) {
      return;
    }

    stop();

    for (const track of tracks.values()) {
      track.detachDiagnostics();
      track.audio.removeAttribute("src");
      track.audio.load();
      track.playPromise = null;
    }

    tracks.clear();
    isDisposed = true;
    status = "disposed";
  }

  function setMuted(muted: boolean): void {
    const wasMuted = isMuted;

    isMuted = muted;

    for (const track of tracks.values()) {
      applyTrackAudioState(track, isMuted);
    }

    if (wasMuted && !isMuted && isStarted) {
      resume();
    }
  }

  function setMasterVolume(volume: number): void {
    masterVolume = normalizeVolume(volume);

    for (const track of tracks.values()) {
      applyTrackAudioState(track, isMuted);
    }
  }

  function updateSingleSharedSource(
    snapshot: HomeDriveEngineAudioRuntimeSnapshot,
  ): void {
    const track = tracks.get("idle");

    if (!track) {
      return;
    }

    const speedMps = Math.max(0, snapshot.speedMps || 0);
    const throttle = clampNumber(snapshot.throttle, 0, 1);
    const brake = clampNumber(snapshot.brake, 0, 1);
    const speedRatio = clampNumber(speedMps / settings.speedForFullBlendMps, 0, 1);

    const brakeDucking = 1 - brake * settings.brakeDucking;
    const effectiveMasterVolume = masterVolume * brakeDucking;

    track.targetVolume =
      getSingleSourceTargetVolume(speedRatio, throttle, brake, settings) *
      effectiveMasterVolume;

    track.volume = lerpNumber(track.volume, track.targetVolume, settings.fadeLerp);

    /*
      Quando só existe 1 arquivo longo, não altere playbackRate.
      Alterar playbackRate faz o áudio terminar antes/depois e dá sensação
      de loop prematuro.
    */
    track.playbackRate = 1;

    applyTrackAudioState(track, isMuted);

    if (isStarted && !isMuted) {
      attemptTrackPlay(track);
    }
  }

  function updateLayeredSources(
    snapshot: HomeDriveEngineAudioRuntimeSnapshot,
  ): void {
    const speedMps = Math.max(0, snapshot.speedMps || 0);
    const throttle = clampNumber(snapshot.throttle, 0, 1);
    const brake = clampNumber(snapshot.brake, 0, 1);
    const speedRatio = clampNumber(speedMps / settings.speedForFullBlendMps, 0, 1);

    const brakeDucking = 1 - brake * settings.brakeDucking;
    const effectiveMasterVolume = masterVolume * brakeDucking;

    const idleTarget = getIdleTargetVolume(speedRatio, throttle, settings);
    const lowTarget = getLowTargetVolume(speedRatio, throttle, settings);
    const highTarget = getHighTargetVolume(speedRatio, throttle, settings);

    const basePlaybackRate = lerpNumber(
      settings.minPlaybackRate,
      settings.maxPlaybackRate,
      speedRatio,
    );

    const throttlePlaybackLift = throttle * 0.08;
    const brakePlaybackDrop = brake * 0.05;

    const idle = tracks.get("idle");
    const low = tracks.get("low");
    const high = tracks.get("high");

    if (idle) {
      idle.targetVolume = idleTarget * effectiveMasterVolume;
      idle.volume = lerpNumber(idle.volume, idle.targetVolume, settings.fadeLerp);
      idle.playbackRate = safePlaybackRate(
        basePlaybackRate * 0.88 + throttlePlaybackLift,
      );
      applyTrackAudioState(idle, isMuted);
    }

    if (low) {
      low.targetVolume = lowTarget * effectiveMasterVolume;
      low.volume = lerpNumber(low.volume, low.targetVolume, settings.fadeLerp);
      low.playbackRate = safePlaybackRate(
        basePlaybackRate + throttlePlaybackLift - brakePlaybackDrop,
      );
      applyTrackAudioState(low, isMuted);
    }

    if (high) {
      high.targetVolume = highTarget * effectiveMasterVolume;
      high.volume = lerpNumber(high.volume, high.targetVolume, settings.fadeLerp);
      high.playbackRate = safePlaybackRate(
        basePlaybackRate * 1.08 + throttlePlaybackLift - brakePlaybackDrop,
      );
      applyTrackAudioState(high, isMuted);
    }

    if (!isStarted || isMuted) {
      return;
    }

    for (const track of tracks.values()) {
      attemptTrackPlay(track);
    }
  }

  function update(snapshot: HomeDriveEngineAudioRuntimeSnapshot): void {
    if (!canUseAudio() || isDisposed || !isStarted) {
      return;
    }

    ensureTracks();

    if (useSingleSharedSource) {
      updateSingleSharedSource(snapshot);
      return;
    }

    updateLayeredSources(snapshot);
  }

  function getState(): HomeDriveEngineAudioControllerState {
    return {
      isSupported: canUseAudio(),
      isUnlocked,
      isStarted,
      isMuted,
      masterVolume,
      status,
      lastErrorMessage,
      tracks: createTrackStates(tracks),
    };
  }

  return {
    unlock,
    startFromGesture,
    start,
    pause,
    resume,
    stop,
    dispose,
    update,
    setMuted,
    setMasterVolume,
    getState,
  };
}
