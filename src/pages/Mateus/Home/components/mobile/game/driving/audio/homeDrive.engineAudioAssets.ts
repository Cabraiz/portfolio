// src/pages/Mateus/Home/components/mobile/game/driving/audio/homeDrive.engineAudioAssets.ts

import type { HomeDriveEngineAudioAssetMap } from "./homeDrive.engineAudio.types";

/**
 * Arquivo físico esperado:
 *
 * public/audio/home-drive/engine/engine-idle-loop.mp3
 *
 * URL servida pelo Vite/browser:
 *
 * /audio/home-drive/engine/engine-idle-loop.mp3
 */
export const HOME_DRIVE_ENGINE_AUDIO_IDLE_SOURCE =
  "/audio/home-drive/engine/engine-idle-loop.mp3";

/**
 * Por enquanto existe apenas 1 áudio de motor.
 * Então os 3 layers usam a mesma fonte.
 *
 * Quando houver arquivos separados, troque para:
 *
 * idle: "/audio/home-drive/engine/engine-idle-loop.mp3"
 * low: "/audio/home-drive/engine/engine-low-loop.mp3"
 * high: "/audio/home-drive/engine/engine-high-loop.mp3"
 */
export const HOME_DRIVE_ENGINE_AUDIO_ASSETS: HomeDriveEngineAudioAssetMap =
  Object.freeze({
    idle: HOME_DRIVE_ENGINE_AUDIO_IDLE_SOURCE,
    low: HOME_DRIVE_ENGINE_AUDIO_IDLE_SOURCE,
    high: HOME_DRIVE_ENGINE_AUDIO_IDLE_SOURCE,
  });
