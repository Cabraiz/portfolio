// src/pages/Mateus/Home/components/mobile/game/driving/audio/homeDrive.engineAudioController.mix.ts

import type {
	HomeDriveEngineAudioRuntimeSnapshot,
	HomeDriveEngineAudioSettings,
	HomeDriveEngineAudioTrackKey,
} from "./homeDrive.engineAudio.types";
import {
	type InternalTrack,
	clampNumber,
	lerpNumber,
	normalizeVolume,
	safePlaybackRate,
	getIdleTargetVolume,
	getLowTargetVolume,
	getHighTargetVolume,
	getSingleSourceTargetVolume,
	applyTrackAudioState,
} from "./homeDrive.engineAudioController.tracks";

// estado do controller lido (sem alterar) pelas funções de mixagem
export type EngineAudioMixContext = Readonly<{
  tracks: Map<HomeDriveEngineAudioTrackKey, InternalTrack>;
  settings: HomeDriveEngineAudioSettings;
  useSingleSharedSource: boolean;
  masterVolume: number;
  isMuted: boolean;
  isStarted: boolean;
  attemptTrackPlay: (track: InternalTrack) => void;
}>;

export function primeTracksForAudibleStart(
  context: EngineAudioMixContext,
): void {
  const { tracks, settings, useSingleSharedSource, masterVolume } = context;

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

export function updateSingleSharedSource(
  context: EngineAudioMixContext,
  snapshot: HomeDriveEngineAudioRuntimeSnapshot,
): void {
  const { tracks, settings, masterVolume, isMuted, isStarted, attemptTrackPlay } =
    context;

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

export function updateLayeredSources(
  context: EngineAudioMixContext,
  snapshot: HomeDriveEngineAudioRuntimeSnapshot,
): void {
  const { tracks, settings, masterVolume, isMuted, isStarted, attemptTrackPlay } =
    context;

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
