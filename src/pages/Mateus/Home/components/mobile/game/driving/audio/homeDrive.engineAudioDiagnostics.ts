// src/pages/Mateus/Home/components/mobile/game/driving/audio/homeDrive.engineAudioDiagnostics.ts

export type HomeDriveEngineAudioDiagnosticLevel =
  | "debug"
  | "info"
  | "warn"
  | "error";

export type HomeDriveEngineAudioDiagnosticDetails = Record<
  string,
  unknown
>;

export type HomeDriveEngineAudioDiagnosticPayload = Readonly<{
  event: string;
  key?: string;
  src?: string;
  status?: string;
  readyState?: number;
  readyStateLabel?: string;
  networkState?: number;
  networkStateLabel?: string;
  paused?: boolean;
  muted?: boolean;
  volume?: number;
  playbackRate?: number;
  currentTime?: number;
  duration?: number;
  error?: unknown;
  errorMessage?: string;
  details?: HomeDriveEngineAudioDiagnosticDetails;
}>;

export type HomeDriveEngineAudioElementSnapshot = Readonly<{
  key?: string;
  src: string;
  currentSrc: string;
  readyState: number;
  readyStateLabel: string;
  networkState: number;
  networkStateLabel: string;
  paused: boolean;
  muted: boolean;
  volume: number;
  playbackRate: number;
  currentTime: number;
  duration: number;
  errorCode?: number;
  errorMessage?: string;
}>;

export const HOME_DRIVE_ENGINE_AUDIO_DEBUG_STORAGE_KEY =
  "homeDrive:engineAudioDebug";

const CONSOLE_PREFIX = "[HomeDriveEngineAudio]";

function canUseWindowStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function safeReadLocalStorage(key: string): string | null {
  if (!canUseWindowStorage()) {
    return null;
  }

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeWriteLocalStorage(key: string, value: string): void {
  if (!canUseWindowStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage can fail in private mode or restricted browser contexts.
  }
}

function safeRemoveLocalStorage(key: string): void {
  if (!canUseWindowStorage()) {
    return;
  }

  try {
    window.localStorage.removeItem(key);
  } catch {
    // Storage can fail in private mode or restricted browser contexts.
  }
}

export function isHomeDriveEngineAudioDebugEnabled(): boolean {
  return safeReadLocalStorage(HOME_DRIVE_ENGINE_AUDIO_DEBUG_STORAGE_KEY) === "true";
}

export function setHomeDriveEngineAudioDebugEnabled(enabled: boolean): void {
  if (enabled) {
    safeWriteLocalStorage(HOME_DRIVE_ENGINE_AUDIO_DEBUG_STORAGE_KEY, "true");
    return;
  }

  safeRemoveLocalStorage(HOME_DRIVE_ENGINE_AUDIO_DEBUG_STORAGE_KEY);
}

export function getHomeDriveEngineAudioReadyStateLabel(
  readyState: number,
): string {
  switch (readyState) {
    case HTMLMediaElement.HAVE_NOTHING:
      return "HAVE_NOTHING";
    case HTMLMediaElement.HAVE_METADATA:
      return "HAVE_METADATA";
    case HTMLMediaElement.HAVE_CURRENT_DATA:
      return "HAVE_CURRENT_DATA";
    case HTMLMediaElement.HAVE_FUTURE_DATA:
      return "HAVE_FUTURE_DATA";
    case HTMLMediaElement.HAVE_ENOUGH_DATA:
      return "HAVE_ENOUGH_DATA";
    default:
      return `UNKNOWN_READY_STATE_${readyState}`;
  }
}

export function getHomeDriveEngineAudioNetworkStateLabel(
  networkState: number,
): string {
  switch (networkState) {
    case HTMLMediaElement.NETWORK_EMPTY:
      return "NETWORK_EMPTY";
    case HTMLMediaElement.NETWORK_IDLE:
      return "NETWORK_IDLE";
    case HTMLMediaElement.NETWORK_LOADING:
      return "NETWORK_LOADING";
    case HTMLMediaElement.NETWORK_NO_SOURCE:
      return "NETWORK_NO_SOURCE";
    default:
      return `UNKNOWN_NETWORK_STATE_${networkState}`;
  }
}

export function getHomeDriveEngineAudioMediaErrorMessage(
  error: MediaError | null,
): string | undefined {
  if (!error) {
    return undefined;
  }

  switch (error.code) {
    case MediaError.MEDIA_ERR_ABORTED:
      return "MEDIA_ERR_ABORTED: media loading was aborted.";
    case MediaError.MEDIA_ERR_NETWORK:
      return "MEDIA_ERR_NETWORK: network error while loading media.";
    case MediaError.MEDIA_ERR_DECODE:
      return "MEDIA_ERR_DECODE: decoding failed or format is invalid.";
    case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
      return "MEDIA_ERR_SRC_NOT_SUPPORTED: source is missing or unsupported.";
    default:
      return `UNKNOWN_MEDIA_ERROR_${error.code}`;
  }
}

export function normalizeHomeDriveEngineAudioErrorMessage(
  error: unknown,
): string {
  if (error instanceof DOMException) {
    return `${error.name}: ${error.message}`;
  }

  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

export function getHomeDriveEngineAudioElementSnapshot(
  audio: HTMLAudioElement,
  key?: string,
): HomeDriveEngineAudioElementSnapshot {
  const readyState = audio.readyState;
  const networkState = audio.networkState;
  const mediaErrorMessage = getHomeDriveEngineAudioMediaErrorMessage(audio.error);

  return {
    key,
    src: audio.src,
    currentSrc: audio.currentSrc,
    readyState,
    readyStateLabel: getHomeDriveEngineAudioReadyStateLabel(readyState),
    networkState,
    networkStateLabel: getHomeDriveEngineAudioNetworkStateLabel(networkState),
    paused: audio.paused,
    muted: audio.muted,
    volume: audio.volume,
    playbackRate: audio.playbackRate,
    currentTime: audio.currentTime,
    duration: Number.isFinite(audio.duration) ? audio.duration : 0,
    errorCode: audio.error?.code,
    errorMessage: mediaErrorMessage,
  };
}

export function logHomeDriveEngineAudioDiagnostic(
  level: HomeDriveEngineAudioDiagnosticLevel,
  payload: HomeDriveEngineAudioDiagnosticPayload,
): void {
  if (level === "debug" && !isHomeDriveEngineAudioDebugEnabled()) {
    return;
  }

  const normalizedPayload: HomeDriveEngineAudioDiagnosticPayload = {
    ...payload,
    errorMessage:
      payload.errorMessage ??
      (payload.error
        ? normalizeHomeDriveEngineAudioErrorMessage(payload.error)
        : undefined),
  };

  const label = `${CONSOLE_PREFIX} ${normalizedPayload.event}`;

  switch (level) {
    case "debug":
      console.debug(label, normalizedPayload);
      return;
    case "info":
      console.info(label, normalizedPayload);
      return;
    case "warn":
      console.warn(label, normalizedPayload);
      return;
    case "error":
      console.error(label, normalizedPayload);
      return;
    default:
      console.log(label, normalizedPayload);
  }
}

export function logHomeDriveEngineAudioElementDiagnostic(
  level: HomeDriveEngineAudioDiagnosticLevel,
  event: string,
  audio: HTMLAudioElement,
  key?: string,
  details?: HomeDriveEngineAudioDiagnosticDetails,
): void {
  const snapshot = getHomeDriveEngineAudioElementSnapshot(audio, key);

  logHomeDriveEngineAudioDiagnostic(level, {
    event,
    key,
    src: snapshot.currentSrc || snapshot.src,
    readyState: snapshot.readyState,
    readyStateLabel: snapshot.readyStateLabel,
    networkState: snapshot.networkState,
    networkStateLabel: snapshot.networkStateLabel,
    paused: snapshot.paused,
    muted: snapshot.muted,
    volume: snapshot.volume,
    playbackRate: snapshot.playbackRate,
    currentTime: snapshot.currentTime,
    duration: snapshot.duration,
    errorMessage: snapshot.errorMessage,
    details,
  });
}

export function attachHomeDriveEngineAudioDiagnostics(
  audio: HTMLAudioElement,
  key?: string,
): () => void {
  const handleLoadStart = () => {
    logHomeDriveEngineAudioElementDiagnostic("debug", "loadstart", audio, key);
  };

  const handleCanPlay = () => {
    logHomeDriveEngineAudioElementDiagnostic("debug", "canplay", audio, key);
  };

  const handleCanPlayThrough = () => {
    logHomeDriveEngineAudioElementDiagnostic(
      "debug",
      "canplaythrough",
      audio,
      key,
    );
  };

  const handlePlay = () => {
    logHomeDriveEngineAudioElementDiagnostic("debug", "play", audio, key);
  };

  const handlePlaying = () => {
    logHomeDriveEngineAudioElementDiagnostic("debug", "playing", audio, key);
  };

  const handlePause = () => {
    logHomeDriveEngineAudioElementDiagnostic("debug", "pause", audio, key);
  };

  const handleEnded = () => {
    logHomeDriveEngineAudioElementDiagnostic("debug", "ended", audio, key);
  };

  const handleStalled = () => {
    logHomeDriveEngineAudioElementDiagnostic("warn", "stalled", audio, key);
  };

  const handleSuspend = () => {
    logHomeDriveEngineAudioElementDiagnostic("debug", "suspend", audio, key);
  };

  const handleWaiting = () => {
    logHomeDriveEngineAudioElementDiagnostic("debug", "waiting", audio, key);
  };

  const handleError = () => {
    logHomeDriveEngineAudioElementDiagnostic("error", "media-error", audio, key);
  };

  audio.addEventListener("loadstart", handleLoadStart);
  audio.addEventListener("canplay", handleCanPlay);
  audio.addEventListener("canplaythrough", handleCanPlayThrough);
  audio.addEventListener("play", handlePlay);
  audio.addEventListener("playing", handlePlaying);
  audio.addEventListener("pause", handlePause);
  audio.addEventListener("ended", handleEnded);
  audio.addEventListener("stalled", handleStalled);
  audio.addEventListener("suspend", handleSuspend);
  audio.addEventListener("waiting", handleWaiting);
  audio.addEventListener("error", handleError);

  return () => {
    audio.removeEventListener("loadstart", handleLoadStart);
    audio.removeEventListener("canplay", handleCanPlay);
    audio.removeEventListener("canplaythrough", handleCanPlayThrough);
    audio.removeEventListener("play", handlePlay);
    audio.removeEventListener("playing", handlePlaying);
    audio.removeEventListener("pause", handlePause);
    audio.removeEventListener("ended", handleEnded);
    audio.removeEventListener("stalled", handleStalled);
    audio.removeEventListener("suspend", handleSuspend);
    audio.removeEventListener("waiting", handleWaiting);
    audio.removeEventListener("error", handleError);
  };
}
