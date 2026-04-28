// src/pages/Mateus/Home/components/mobile/game/driving/audio/homeDrive.engineAudio.types.ts

export type HomeDriveEngineAudioTrackKey = "idle" | "low" | "high";

export type HomeDriveEngineAudioAssetMap = Readonly<
  Record<HomeDriveEngineAudioTrackKey, string>
>;

export type HomeDriveEngineAudioPreloadMode = "none" | "metadata" | "auto";

export type HomeDriveEngineAudioPlaybackStatus =
  | "idle"
  | "ready"
  | "starting"
  | "playing"
  | "paused"
  | "blocked"
  | "error"
  | "disposed";

export type HomeDriveEngineAudioSettings = Readonly<{
  masterVolume: number;

  idleVolume: number;
  lowVolume: number;
  highVolume: number;

  minPlaybackRate: number;
  maxPlaybackRate: number;

  speedForFullBlendMps: number;
  highLayerStartRatio: number;

  throttleGain: number;
  brakeDucking: number;

  fadeLerp: number;
  preload: HomeDriveEngineAudioPreloadMode;
}>;

export type HomeDriveEngineAudioRuntimeSnapshot = Readonly<{
  speedMps: number;
  throttle: number;
  brake: number;
}>;

export type HomeDriveEngineAudioTrackState = Readonly<{
  key: HomeDriveEngineAudioTrackKey;
  source: string;
  currentSource: string;
  volume: number;
  targetVolume: number;
  playbackRate: number;
  isPlaying: boolean;
  isPaused: boolean;
  readyState: number;
  networkState: number;
  errorMessage?: string;
}>;

export type HomeDriveEngineAudioControllerState = Readonly<{
  isSupported: boolean;
  isUnlocked: boolean;
  isStarted: boolean;
  isMuted: boolean;
  masterVolume: number;
  status: HomeDriveEngineAudioPlaybackStatus;
  lastErrorMessage?: string;
  tracks: readonly HomeDriveEngineAudioTrackState[];
}>;

export type HomeDriveEngineAudioController = Readonly<{
  unlock: () => Promise<boolean>;
  startFromGesture: () => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  dispose: () => void;
  update: (snapshot: HomeDriveEngineAudioRuntimeSnapshot) => void;
  setMuted: (muted: boolean) => void;
  setMasterVolume: (volume: number) => void;
  getState: () => HomeDriveEngineAudioControllerState;
}>;
