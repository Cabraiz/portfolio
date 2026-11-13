// src/pages/Mateus/Home/components/mobile/game/driving/audio/homeDrive.engineAudioController.ts

import { HOME_DRIVE_ENGINE_AUDIO_ASSETS } from "./homeDrive.engineAudioAssets";
import {
	isHomeDriveEngineAudioDebugEnabled,
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
} from "./homeDrive.engineAudio.types";
import {
	DEFAULT_ENGINE_AUDIO_SETTINGS,
	type InternalTrack,
	canUseAudio,
	normalizeVolume,
	areAllEngineAssetsTheSame,
	createAudioElement,
	createTrackStates,
	applyTrackAudioState,
	isBlockedPlayError,
	isAbortPlayError,
	restoreSourceIfNeeded,
	pauseTrack,
	resetTrackTime,
	logEngineAudioPlayFailed,
} from "./homeDrive.engineAudioController.tracks";
import {
	type EngineAudioMixContext,
	primeTracksForAudibleStart,
	updateSingleSharedSource,
	updateLayeredSources,
} from "./homeDrive.engineAudioController.mix";

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

  function getMixContext(): EngineAudioMixContext {
    return {
      tracks,
      settings,
      useSingleSharedSource,
      masterVolume,
      isMuted,
      isStarted,
      attemptTrackPlay,
    };
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

        logEngineAudioPlayFailed(track, status, error, errorMessage);
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
    primeTracksForAudibleStart(getMixContext());

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

  function update(snapshot: HomeDriveEngineAudioRuntimeSnapshot): void {
    if (!canUseAudio() || isDisposed || !isStarted) {
      return;
    }

    ensureTracks();

    if (useSingleSharedSource) {
      updateSingleSharedSource(getMixContext(), snapshot);
      return;
    }

    updateLayeredSources(getMixContext(), snapshot);
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
