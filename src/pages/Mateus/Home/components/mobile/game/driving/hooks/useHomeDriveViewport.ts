// src/pages/Mateus/Home/components/mobile/game/driving/hooks/useHomeDriveViewport.ts

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";

import type { HomeDriveViewportMetrics } from "../domain/homeDrive.types";

export type UseHomeDriveViewportResult = Readonly<{
  rootRef: RefObject<HTMLDivElement | null>;
  viewport: HomeDriveViewportMetrics;
}>;

function getFallbackViewport(): HomeDriveViewportMetrics {
  if (typeof window === "undefined") {
    return {
      width: 390,
      height: 844,
      dpr: 1,
      isPortrait: true,
    };
  }

  const visualViewport = window.visualViewport;
  const width = Math.max(visualViewport?.width ?? window.innerWidth, 1);
  const height = Math.max(visualViewport?.height ?? window.innerHeight, 1);

  return {
    width,
    height,
    dpr: Math.max(window.devicePixelRatio || 1, 1),
    isPortrait: height >= width,
  };
}

function areViewportMetricsEqual(
  first: HomeDriveViewportMetrics,
  second: HomeDriveViewportMetrics,
): boolean {
  return (
    first.width === second.width &&
    first.height === second.height &&
    first.dpr === second.dpr &&
    first.isPortrait === second.isPortrait
  );
}

export function useHomeDriveViewport(): UseHomeDriveViewportResult {
  const rootRef = useRef<HTMLDivElement | null>(null);

  const [viewport, setViewport] = useState<HomeDriveViewportMetrics>(() => {
    return getFallbackViewport();
  });

  const syncViewport = useCallback(() => {
    const element = rootRef.current;
    const fallback = getFallbackViewport();

    if (!element) {
      setViewport((current) => {
        return areViewportMetricsEqual(current, fallback) ? current : fallback;
      });
      return;
    }

    const rect = element.getBoundingClientRect();
    const width = Math.max(rect.width || fallback.width, 1);
    const height = Math.max(rect.height || fallback.height, 1);

    const nextViewport: HomeDriveViewportMetrics = {
      width,
      height,
      dpr: fallback.dpr,
      isPortrait: height >= width,
    };

    setViewport((current) => {
      return areViewportMetricsEqual(current, nextViewport)
        ? current
        : nextViewport;
    });
  }, []);

  useEffect(() => {
    syncViewport();

    const element = rootRef.current;
    const visualViewport = window.visualViewport;

    const resizeObserver =
      typeof ResizeObserver !== "undefined" && element
        ? new ResizeObserver(syncViewport)
        : null;

    if (element && resizeObserver) {
      resizeObserver.observe(element);
    }

    window.addEventListener("resize", syncViewport);
    window.addEventListener("orientationchange", syncViewport);
    visualViewport?.addEventListener("resize", syncViewport);
    visualViewport?.addEventListener("scroll", syncViewport);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", syncViewport);
      window.removeEventListener("orientationchange", syncViewport);
      visualViewport?.removeEventListener("resize", syncViewport);
      visualViewport?.removeEventListener("scroll", syncViewport);
    };
  }, [syncViewport]);

  return {
    rootRef,
    viewport,
  };
}
