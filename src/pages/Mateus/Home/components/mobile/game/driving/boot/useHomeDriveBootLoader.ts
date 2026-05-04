// src/pages/Mateus/Home/components/mobile/game/driving/boot/useHomeDriveBootLoader.ts

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  HomeDriveRuntimeState,
  HomeDriveViewportMetrics,
} from "../domain/homeDrive.types";
import { HOME_DRIVE_BOOT_MIN_VISIBLE_MS } from "./homeDriveBootConfig";
import {
  createHomeDriveBootAssets,
  type HomeDriveBootAssets,
  type HomeDriveBootProgressSnapshot,
} from "./homeDriveBootAssets";

type HomeDriveMutableRef<T> = {
  current: T;
};

export type HomeDriveBootLoaderStatus = "loading" | "ready" | "error";

export type UseHomeDriveBootLoaderOptions = Readonly<{
  viewport: HomeDriveViewportMetrics;
  runtimeRef: HomeDriveMutableRef<HomeDriveRuntimeState>;
}>;

export type UseHomeDriveBootLoaderResult = Readonly<{
  status: HomeDriveBootLoaderStatus;
  snapshot: HomeDriveBootProgressSnapshot;
  assets: HomeDriveBootAssets | null;
  retry: () => void;
}>;

function getNowMs(): number {
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return performance.now();
  }

  return Date.now();
}

function createInitialSnapshot(): HomeDriveBootProgressSnapshot {
  const now = getNowMs();

  return {
    phase: "idle",
    label: "Iniciando Drive",
    detail: "Preparando carregamento completo.",
    progress: 0,
    loaded: 0,
    total: 0,
    startedAtMs: now,
    updatedAtMs: now,
    elapsedMs: 0,
  };
}

function waitMs(milliseconds: number): Promise<void> {
  if (milliseconds <= 0) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

function getBootKey(viewport: HomeDriveViewportMetrics, retryNonce: number): string {
  return `${viewport.isPortrait ? "portrait" : "landscape"}:${retryNonce}`;
}

export function useHomeDriveBootLoader({
  viewport,
  runtimeRef,
}: UseHomeDriveBootLoaderOptions): UseHomeDriveBootLoaderResult {
  const [retryNonce, setRetryNonce] = useState(0);
  const [snapshot, setSnapshot] = useState<HomeDriveBootProgressSnapshot>(() =>
    createInitialSnapshot(),
  );
  const [status, setStatus] = useState<HomeDriveBootLoaderStatus>("loading");
  const [assets, setAssets] = useState<HomeDriveBootAssets | null>(null);
  const bootSerialRef = useRef(0);
  const viewportRef = useRef(viewport);

  useEffect(() => {
    viewportRef.current = viewport;
  }, [viewport]);

  const bootKey = useMemo(() => {
    return getBootKey(viewport, retryNonce);
  }, [retryNonce, viewport.isPortrait]);

  useEffect(() => {
    let cancelled = false;
    const serial = bootSerialRef.current + 1;

    bootSerialRef.current = serial;
    setStatus("loading");
    setAssets(null);
    setSnapshot(createInitialSnapshot());

    const startedAtMs = getNowMs();

    const run = async () => {
      try {
        const nextAssets = await createHomeDriveBootAssets({
          viewport: viewportRef.current,
          runtime: runtimeRef.current,
          onProgress: (nextSnapshot) => {
            if (cancelled || bootSerialRef.current !== serial) {
              return;
            }

            setSnapshot(nextSnapshot);
          },
        });

        const elapsedMs = getNowMs() - startedAtMs;
        await waitMs(HOME_DRIVE_BOOT_MIN_VISIBLE_MS - elapsedMs);

        if (cancelled || bootSerialRef.current !== serial) {
          return;
        }

        setAssets(nextAssets);
        setStatus("ready");
      } catch (error) {
        if (cancelled || bootSerialRef.current !== serial) {
          return;
        }

        const now = getNowMs();
        setSnapshot({
          phase: "error",
          label: "Falha ao carregar Drive",
          detail:
            error instanceof Error && error.message.trim()
              ? error.message
              : "Falha desconhecida no boot do Drive.",
          progress: 100,
          loaded: 0,
          total: 0,
          startedAtMs,
          updatedAtMs: now,
          elapsedMs: Math.max(0, Math.round(now - startedAtMs)),
          errorMessage:
            error instanceof Error && error.message.trim()
              ? error.message
              : "Falha desconhecida no boot do Drive.",
        });
        setStatus("error");
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [bootKey, runtimeRef]);

  const retry = useCallback(() => {
    setRetryNonce((current) => current + 1);
  }, []);

  return useMemo(
    () => ({
      status,
      snapshot,
      assets,
      retry,
    }),
    [assets, retry, snapshot, status],
  );
}

export default useHomeDriveBootLoader;
