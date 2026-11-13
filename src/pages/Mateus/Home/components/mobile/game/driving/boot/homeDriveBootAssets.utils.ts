// src/pages/Mateus/Home/components/mobile/game/driving/boot/homeDriveBootAssets.utils.ts

import {
	HOME_DRIVE_ENGINE_AUDIO_ASSETS,
} from "../audio/homeDrive.engineAudioAssets";
import { getHomeDriveMissionDestinations } from "../domain/missions";
import { HOME_DRIVE_COCKPIT_ASSETS } from "../view/cockpit";
import type {
	HomeDriveBootCreateOptions,
	HomeDriveBootPhase,
	HomeDriveBootProgressSnapshot,
} from "./homeDriveBootAssets.types";

/**
 * Preload não deve derrubar o Drive em rede fria/celular.
 * Antes o boot quebrava com 8,5–9s; isso era curto para imagens grandes,
 * áudio MP3 em cache frio e throttling do browser.
 *
 * Estes tempos são janelas de paciência do loading, não erro fatal.
 * Se passar disso, o asset fica marcado como `deferred-timeout` e o jogo
 * continua sem travar a pessoa na tela de erro.
 */
export const IMAGE_PRELOAD_PATIENCE_MS = 60_000;
export const AUDIO_PRELOAD_PATIENCE_MS = 90_000;
export const AUDIO_HTTP_CACHE_PATIENCE_MS = 90_000;

export function getNowMs(): number {
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return performance.now();
  }

  return Date.now();
}

export function createViewportKey(isPortrait: boolean): string {
  return isPortrait ? "portrait" : "landscape";
}

function clampProgress(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Falha desconhecida no preload do Drive.";
}

export function isAbortError(error: unknown): boolean {
  if (typeof DOMException !== "undefined" && error instanceof DOMException) {
    return error.name === "AbortError";
  }

  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name?: unknown }).name === "AbortError"
  );
}

export function createProgressReporter(
  onProgress: HomeDriveBootCreateOptions["onProgress"],
): (
  phase: HomeDriveBootPhase,
  label: string,
  detail: string,
  progress: number,
  loaded: number,
  total: number,
  errorMessage?: string,
) => HomeDriveBootProgressSnapshot {
  const startedAtMs = getNowMs();

  return (phase, label, detail, progress, loaded, total, errorMessage) => {
    const updatedAtMs = getNowMs();
    const snapshot: HomeDriveBootProgressSnapshot = {
      phase,
      label,
      detail,
      progress: clampProgress(progress),
      loaded,
      total,
      startedAtMs,
      updatedAtMs,
      elapsedMs: Math.max(0, Math.round(updatedAtMs - startedAtMs)),
      errorMessage,
    };

    onProgress?.(snapshot);

    return snapshot;
  };
}

export function waitForBrowserPaint(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    window.requestAnimationFrame(() => {
      window.setTimeout(resolve, 0);
    });
  });
}

function uniqueStrings(values: readonly string[]): readonly string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

export function getDriveImageSources(): readonly string[] {
  const missionImages = getHomeDriveMissionDestinations()
    .map((destination) => destination.imageSrc)
    .filter((source): source is string => typeof source === "string");

  return uniqueStrings([
    HOME_DRIVE_COCKPIT_ASSETS.cockpitSrc,
    HOME_DRIVE_COCKPIT_ASSETS.steeringWheelSrc,
    ...missionImages,
  ]);
}

export function getDriveAudioSources(): readonly string[] {
  return uniqueStrings(Object.values(HOME_DRIVE_ENGINE_AUDIO_ASSETS));
}

export function createTimeout(timeoutMs: number, onTimeout: () => void): () => void {
  if (typeof window === "undefined") {
    const id = globalThis.setTimeout(onTimeout, timeoutMs);

    return () => {
      globalThis.clearTimeout(id);
    };
  }

  const id = window.setTimeout(onTimeout, timeoutMs);

  return () => {
    window.clearTimeout(id);
  };
}
