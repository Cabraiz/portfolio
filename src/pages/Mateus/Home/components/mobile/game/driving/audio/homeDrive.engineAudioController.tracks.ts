// src/pages/Mateus/Home/components/mobile/game/driving/audio/homeDrive.engineAudioController.tracks.ts

import {
	attachHomeDriveEngineAudioDiagnostics,
	getHomeDriveEngineAudioMediaErrorMessage,
	logHomeDriveEngineAudioDiagnostic,
} from "./homeDrive.engineAudioDiagnostics";
import type {
	HomeDriveEngineAudioAssetMap,
	HomeDriveEngineAudioPlaybackStatus,
	HomeDriveEngineAudioSettings,
	HomeDriveEngineAudioTrackKey,
	HomeDriveEngineAudioTrackState,
} from "./homeDrive.engineAudio.types";

export const DEFAULT_ENGINE_AUDIO_SETTINGS: HomeDriveEngineAudioSettings = {
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

export type InternalTrack = {
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

export function canUseAudio(): boolean {
  return typeof window !== "undefined" && typeof Audio !== "undefined";
}

export function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
}

export function lerpNumber(from: number, to: number, amount: number): number {
  return from + (to - from) * clampNumber(amount, 0, 1);
}

export function normalizeVolume(value: number): number {
  return clampNumber(value, 0, 1);
}

export function safePlaybackRate(value: number): number {
  return clampNumber(value, 0.25, 4);
}

export function areAllEngineAssetsTheSame(
  assets: HomeDriveEngineAudioAssetMap,
): boolean {
  return assets.idle === assets.low && assets.low === assets.high;
}

export function getMediaElementErrorMessage(audio: HTMLAudioElement): string | undefined {
  return getHomeDriveEngineAudioMediaErrorMessage(audio.error);
}

export function createAudioElement(
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

export function createTrackStates(
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

export function getIdleTargetVolume(
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

export function getLowTargetVolume(
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

export function getHighTargetVolume(
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

export function getSingleSourceTargetVolume(
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

export function applyTrackAudioState(track: InternalTrack, muted: boolean): void {
  track.audio.volume = muted ? 0 : normalizeVolume(track.volume);
  track.audio.playbackRate = safePlaybackRate(track.playbackRate);
}

export function isBlockedPlayError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "NotAllowedError";
}

export function isAbortPlayError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export function restoreSourceIfNeeded(track: InternalTrack): void {
  if (track.audio.src) {
    return;
  }

  track.audio.src = track.source;
  track.audio.load();
}

export function pauseTrack(track: InternalTrack): void {
  track.audio.pause();
  track.playPromise = null;
}

export function resetTrackTime(track: InternalTrack): void {
  try {
    track.audio.currentTime = 0;
  } catch {
    // Some browsers can throw if metadata is not ready. Safe to ignore.
  }
}

// log de falha do play() com o estado atual do elemento
export function logEngineAudioPlayFailed(
  track: InternalTrack,
  status: HomeDriveEngineAudioPlaybackStatus,
  error: unknown,
  errorMessage: string,
): void {
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
}
