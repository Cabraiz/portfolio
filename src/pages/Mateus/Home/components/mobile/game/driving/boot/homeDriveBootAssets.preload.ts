// src/pages/Mateus/Home/components/mobile/game/driving/boot/homeDriveBootAssets.preload.ts

import {
	runHomeDriveEngineAudioPreflight,
} from "../audio/homeDrive.engineAudioPreflight";
import type { HomeDriveBootAssetLoadResult } from "./homeDriveBootAssets.types";
import {
	IMAGE_PRELOAD_PATIENCE_MS,
	AUDIO_PRELOAD_PATIENCE_MS,
	AUDIO_HTTP_CACHE_PATIENCE_MS,
	getNowMs,
	getErrorMessage,
	isAbortError,
	createTimeout,
} from "./homeDriveBootAssets.utils";

function preloadImageSource(source: string): Promise<HomeDriveBootAssetLoadResult> {
  const startedAtMs = getNowMs();

  if (typeof Image === "undefined") {
    return Promise.resolve({
      source,
      ok: true,
      kind: "image",
      elapsedMs: 0,
      status: "skipped-server-runtime",
    });
  }

  return new Promise((resolve) => {
    const image = new Image();
    let settled = false;

    const cleanupTimeout = createTimeout(IMAGE_PRELOAD_PATIENCE_MS, () => {
      finish(
        true,
        "deferred-timeout",
        "Imagem demorou além da janela de boot e continuará como carregamento sob demanda.",
      );
    });

    const cleanup = () => {
      cleanupTimeout();
      image.onload = null;
      image.onerror = null;
    };

    const finish = async (ok: boolean, status: string, errorMessage?: string) => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();

      if (ok && status !== "deferred-timeout" && typeof image.decode === "function") {
        try {
          await image.decode();
        } catch {
          /*
            decode() pode falhar mesmo após load em alguns browsers.
            Se o arquivo já carregou, mantemos o preload como OK.
          */
        }
      }

      resolve({
        source,
        ok,
        kind: "image",
        elapsedMs: Math.round(getNowMs() - startedAtMs),
        status,
        errorMessage,
      });
    };

    image.decoding = "async";
    image.loading = "eager";
    image.onload = () => {
      void finish(true, "loaded");
    };
    image.onerror = () => {
      void finish(false, "error", `Não foi possível carregar imagem: ${source}`);
    };
    image.src = source;

    if (image.complete && image.naturalWidth > 0) {
      void finish(true, "cached");
    }
  });
}

function createAbortableTimeout(timeoutMs: number): {
  signal?: AbortSignal;
  cleanup: () => void;
} {
  if (typeof AbortController === "undefined" || timeoutMs <= 0) {
    return {
      signal: undefined,
      cleanup: () => undefined,
    };
  }

  const controller = new AbortController();
  const timeoutId = typeof window === "undefined"
    ? globalThis.setTimeout(() => controller.abort(), timeoutMs)
    : window.setTimeout(() => controller.abort(), timeoutMs);

  return {
    signal: controller.signal,
    cleanup: () => {
      if (typeof window === "undefined") {
        globalThis.clearTimeout(timeoutId);
      } else {
        window.clearTimeout(timeoutId);
      }
    },
  };
}

function createDeferredTimeoutResult(params: {
  source: string;
  kind: "image" | "audio";
  startedAtMs: number;
  status: string;
  errorMessage: string;
}): HomeDriveBootAssetLoadResult {
  return {
    source: params.source,
    ok: true,
    kind: params.kind,
    elapsedMs: Math.round(getNowMs() - params.startedAtMs),
    status: params.status,
    errorMessage: params.errorMessage,
  };
}

async function fetchAudioIntoHttpCache(
  source: string,
): Promise<HomeDriveBootAssetLoadResult> {
  const startedAtMs = getNowMs();

  if (typeof fetch !== "function") {
    return {
      source,
      ok: false,
      kind: "audio",
      elapsedMs: 0,
      status: "fetch-unavailable",
      errorMessage: "Fetch API indisponível para preload de áudio.",
    };
  }

  const timeout = createAbortableTimeout(AUDIO_HTTP_CACHE_PATIENCE_MS);

  try {
    const response = await fetch(source, {
      cache: "force-cache",
      credentials: "same-origin",
      signal: timeout.signal,
    });

    if (!response.ok) {
      return {
        source,
        ok: false,
        kind: "audio",
        elapsedMs: Math.round(getNowMs() - startedAtMs),
        status: `http-${response.status}`,
        errorMessage: `Áudio indisponível (${response.status}): ${source}`,
      };
    }

    const buffer = await response.arrayBuffer();

    return {
      source,
      ok: true,
      kind: "audio",
      elapsedMs: Math.round(getNowMs() - startedAtMs),
      status: "cached",
      bytes: buffer.byteLength,
    };
  } catch (error) {
    if (isAbortError(error)) {
      return createDeferredTimeoutResult({
        source,
        kind: "audio",
        startedAtMs,
        status: "deferred-timeout",
        errorMessage:
          "Áudio demorou além da janela de boot e continuará como carregamento sob demanda.",
      });
    }

    throw error;
  } finally {
    timeout.cleanup();
  }
}

function preloadAudioWithElement(
  source: string,
): Promise<HomeDriveBootAssetLoadResult> {
  const startedAtMs = getNowMs();

  if (typeof Audio === "undefined") {
    return Promise.resolve({
      source,
      ok: false,
      kind: "audio",
      elapsedMs: 0,
      status: "audio-element-unavailable",
      errorMessage: "HTMLAudioElement indisponível para preload de áudio.",
    });
  }

  return new Promise((resolve) => {
    const audio = new Audio();
    let settled = false;

    const cleanupTimeout = createTimeout(AUDIO_PRELOAD_PATIENCE_MS, () => {
      finish(
        true,
        "deferred-timeout",
        "Áudio demorou além da janela de boot e continuará como carregamento sob demanda.",
      );
    });

    const cleanup = () => {
      cleanupTimeout();
      audio.oncanplaythrough = null;
      audio.onerror = null;
      audio.onloadeddata = null;
    };

    const finish = (ok: boolean, status: string, errorMessage?: string) => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();

      resolve({
        source,
        ok,
        kind: "audio",
        elapsedMs: Math.round(getNowMs() - startedAtMs),
        status,
        errorMessage,
      });
    };

    audio.preload = "auto";
    audio.muted = true;
    audio.oncanplaythrough = () => finish(true, "canplaythrough");
    audio.onloadeddata = () => finish(true, "loadeddata");
    audio.onerror = () => {
      finish(false, "error", `Não foi possível carregar áudio: ${source}`);
    };
    audio.src = source;
    audio.load();
  });
}

async function preloadAudioSource(
  source: string,
): Promise<HomeDriveBootAssetLoadResult> {
  const preflight = await runHomeDriveEngineAudioPreflight(source, {
    timeoutMs: AUDIO_PRELOAD_PATIENCE_MS,
    requireAudioContentType: false,
    logResult: false,
  });

  if (!preflight.ok) {
    return {
      source,
      ok: false,
      kind: "audio",
      elapsedMs: preflight.elapsedMs,
      status: preflight.status,
      errorMessage: preflight.errorMessage ?? `Falha no preflight de áudio: ${source}`,
    };
  }

  try {
    return await fetchAudioIntoHttpCache(preflight.resolvedUrl);
  } catch {
    return preloadAudioWithElement(source);
  }
}

export async function preloadSources(
  sources: readonly string[],
  kind: "image" | "audio",
  reportItem: (source: string, result: HomeDriveBootAssetLoadResult) => void,
): Promise<readonly HomeDriveBootAssetLoadResult[]> {
  const loader = kind === "image" ? preloadImageSource : preloadAudioSource;

  return Promise.all(
    sources.map(async (source) => {
      try {
        const result = await loader(source);
        reportItem(source, result);

        return result;
      } catch (error) {
        const result: HomeDriveBootAssetLoadResult = {
          source,
          ok: false,
          kind,
          elapsedMs: 0,
          status: "loader-exception",
          errorMessage: getErrorMessage(error),
        };

        reportItem(source, result);

        return result;
      }
    }),
  );
}

export function getAssetPreloadSummary(
  results: readonly HomeDriveBootAssetLoadResult[],
): string {
  const failed = results.filter((result) => !result.ok).length;
  const deferred = results.filter((result) => result.status === "deferred-timeout").length;

  if (failed <= 0 && deferred <= 0) {
    return "Assets preparados.";
  }

  const fragments: string[] = [];

  if (deferred > 0) {
    fragments.push(`${deferred} asset(s) lento(s) mantido(s) como sob demanda`);
  }

  if (failed > 0) {
    fragments.push(`${failed} asset(s) indisponível(is) ignorado(s) sem quebrar o boot`);
  }

  return fragments.join("; ") + ".";
}
