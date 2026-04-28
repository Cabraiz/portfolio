// src/pages/Mateus/Home/components/mobile/game/driving/audio/homeDrive.engineAudioPreflight.ts

import {
  logHomeDriveEngineAudioDiagnostic,
  normalizeHomeDriveEngineAudioErrorMessage,
} from "./homeDrive.engineAudioDiagnostics";

export type HomeDriveEngineAudioPreflightStatus =
  | "ok"
  | "unsupported-browser"
  | "fetch-error"
  | "http-error"
  | "missing-source"
  | "invalid-content-type"
  | "unsupported-format";

export type HomeDriveEngineAudioPreflightResult = Readonly<{
  ok: boolean;
  status: HomeDriveEngineAudioPreflightStatus;
  source: string;
  resolvedUrl: string;
  elapsedMs: number;
  statusCode?: number;
  contentType?: string | null;
  contentLength?: number | null;
  canPlayMp3: boolean;
  errorMessage?: string;
}>;

export type HomeDriveEngineAudioPreflightOptions = Readonly<{
  timeoutMs?: number;
  requireAudioContentType?: boolean;
  logResult?: boolean;
}>;

const DEFAULT_PREFLIGHT_TIMEOUT_MS = 3500;

function getNowMs(): number {
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return performance.now();
  }

  return Date.now();
}

function canUseBrowserAudio(): boolean {
  return typeof window !== "undefined" && typeof Audio !== "undefined";
}

function canUseFetch(): boolean {
  return typeof fetch === "function";
}

function resolveSourceUrl(source: string): string {
  if (typeof window === "undefined") {
    return source;
  }

  try {
    return new URL(source, window.location.origin).toString();
  } catch {
    return source;
  }
}

function canPlayMp3(): boolean {
  if (!canUseBrowserAudio()) {
    return false;
  }

  const audio = new Audio();

  return Boolean(
    audio.canPlayType("audio/mpeg") ||
      audio.canPlayType("audio/mp3") ||
      audio.canPlayType("audio/mpeg; codecs=mp3"),
  );
}

function parseContentLength(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

function isAcceptableAudioContentType(contentType: string | null): boolean {
  if (!contentType) {
    return true;
  }

  const normalized = contentType.toLowerCase();

  return (
    normalized.includes("audio/") ||
    normalized.includes("application/octet-stream") ||
    normalized.includes("binary/octet-stream")
  );
}

function createTimeoutSignal(timeoutMs: number): {
  signal?: AbortSignal;
  cleanup: () => void;
} {
  if (typeof AbortController === "undefined") {
    return {
      signal: undefined,
      cleanup: () => undefined,
    };
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  return {
    signal: controller.signal,
    cleanup: () => {
      window.clearTimeout(timeoutId);
    },
  };
}

function buildResult(
  result: Omit<HomeDriveEngineAudioPreflightResult, "elapsedMs">,
  startedAtMs: number,
): HomeDriveEngineAudioPreflightResult {
  return {
    ...result,
    elapsedMs: Math.max(0, Math.round(getNowMs() - startedAtMs)),
  };
}

function logPreflightResult(result: HomeDriveEngineAudioPreflightResult): void {
  logHomeDriveEngineAudioDiagnostic(result.ok ? "info" : "warn", {
    event: "preflight-result",
    src: result.source,
    status: result.status,
    details: {
      resolvedUrl: result.resolvedUrl,
      elapsedMs: result.elapsedMs,
      statusCode: result.statusCode,
      contentType: result.contentType,
      contentLength: result.contentLength,
      canPlayMp3: result.canPlayMp3,
      errorMessage: result.errorMessage,
    },
  });
}

export async function runHomeDriveEngineAudioPreflight(
  source: string,
  options: HomeDriveEngineAudioPreflightOptions = {},
): Promise<HomeDriveEngineAudioPreflightResult> {
  const startedAtMs = getNowMs();
  const resolvedUrl = resolveSourceUrl(source);
  const timeoutMs = options.timeoutMs ?? DEFAULT_PREFLIGHT_TIMEOUT_MS;
  const shouldRequireAudioContentType = options.requireAudioContentType ?? false;
  const shouldLogResult = options.logResult ?? true;

  if (!source.trim()) {
    const result = buildResult(
      {
        ok: false,
        status: "missing-source",
        source,
        resolvedUrl,
        canPlayMp3: canPlayMp3(),
        errorMessage: "Audio source is empty.",
      },
      startedAtMs,
    );

    if (shouldLogResult) {
      logPreflightResult(result);
    }

    return result;
  }

  if (!canUseBrowserAudio()) {
    const result = buildResult(
      {
        ok: false,
        status: "unsupported-browser",
        source,
        resolvedUrl,
        canPlayMp3: false,
        errorMessage: "Audio API is not available in this runtime.",
      },
      startedAtMs,
    );

    if (shouldLogResult) {
      logPreflightResult(result);
    }

    return result;
  }

  const supportsMp3 = canPlayMp3();

  if (!supportsMp3) {
    const result = buildResult(
      {
        ok: false,
        status: "unsupported-format",
        source,
        resolvedUrl,
        canPlayMp3: false,
        errorMessage: "Browser reports no MP3 playback support.",
      },
      startedAtMs,
    );

    if (shouldLogResult) {
      logPreflightResult(result);
    }

    return result;
  }

  if (!canUseFetch()) {
    const result = buildResult(
      {
        ok: true,
        status: "ok",
        source,
        resolvedUrl,
        canPlayMp3: supportsMp3,
        errorMessage:
          "Fetch API is unavailable; skipped network validation but MP3 is supported.",
      },
      startedAtMs,
    );

    if (shouldLogResult) {
      logPreflightResult(result);
    }

    return result;
  }

  const timeout = createTimeoutSignal(timeoutMs);

  try {
    const response = await fetch(resolvedUrl, {
      method: "GET",
      cache: "no-store",
      signal: timeout.signal,
    });

    const contentType = response.headers.get("content-type");
    const contentLength = parseContentLength(response.headers.get("content-length"));

    if (!response.ok) {
      const result = buildResult(
        {
          ok: false,
          status: "http-error",
          source,
          resolvedUrl,
          statusCode: response.status,
          contentType,
          contentLength,
          canPlayMp3: supportsMp3,
          errorMessage: `Audio asset request failed with HTTP ${response.status}.`,
        },
        startedAtMs,
      );

      if (shouldLogResult) {
        logPreflightResult(result);
      }

      return result;
    }

    const hasAcceptableContentType = isAcceptableAudioContentType(contentType);

    if (shouldRequireAudioContentType && !hasAcceptableContentType) {
      const result = buildResult(
        {
          ok: false,
          status: "invalid-content-type",
          source,
          resolvedUrl,
          statusCode: response.status,
          contentType,
          contentLength,
          canPlayMp3: supportsMp3,
          errorMessage: `Unexpected content-type for audio asset: ${contentType ?? "missing"}.`,
        },
        startedAtMs,
      );

      if (shouldLogResult) {
        logPreflightResult(result);
      }

      return result;
    }

    const result = buildResult(
      {
        ok: true,
        status: "ok",
        source,
        resolvedUrl,
        statusCode: response.status,
        contentType,
        contentLength,
        canPlayMp3: supportsMp3,
        errorMessage:
          hasAcceptableContentType || !contentType
            ? undefined
            : `Content-type is unusual for audio: ${contentType}. Browser may still play it.`,
      },
      startedAtMs,
    );

    if (shouldLogResult) {
      logPreflightResult(result);
    }

    return result;
  } catch (error) {
    const result = buildResult(
      {
        ok: false,
        status: "fetch-error",
        source,
        resolvedUrl,
        canPlayMp3: supportsMp3,
        errorMessage: normalizeHomeDriveEngineAudioErrorMessage(error),
      },
      startedAtMs,
    );

    if (shouldLogResult) {
      logPreflightResult(result);
    }

    return result;
  } finally {
    timeout.cleanup();
  }
}
