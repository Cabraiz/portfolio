// src/pages/Mateus/RoadMap/application/hooks/useRoadMapViewport.ts
import { useEffect, useMemo, useState } from "react";

type RoadMapViewportMode = "mobile" | "desktop";

type UseRoadMapViewportParams = Readonly<{
  mobileBreakpoint?: number;
}>;

type UseRoadMapViewportResult = Readonly<{
  width: number;
  height: number;
  isClient: boolean;
  isMobile: boolean;
  isDesktop: boolean;
  mode: RoadMapViewportMode;
  positionKey: "mobile" | "desktop";
}>;

type ViewportState = Readonly<{
  width: number;
  height: number;
  isClient: boolean;
}>;

function getViewportState(): ViewportState {
  if (typeof window === "undefined") {
    return {
      width: 0,
      height: 0,
      isClient: false,
    };
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
    isClient: true,
  };
}

export function useRoadMapViewport({
  mobileBreakpoint = 992,
}: UseRoadMapViewportParams = {}): UseRoadMapViewportResult {
  const [viewport, setViewport] = useState<ViewportState>(() =>
    getViewportState(),
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    let frameId = 0;

    const updateViewport = () => {
      setViewport((current) => {
        const next = getViewportState();

        if (
          current.width === next.width &&
          current.height === next.height &&
          current.isClient === next.isClient
        ) {
          return current;
        }

        return next;
      });
    };

    const handleResize = () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }

      frameId = window.requestAnimationFrame(() => {
        updateViewport();
      });
    };

    updateViewport();

    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("orientationchange", handleResize, {
      passive: true,
    });

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }

      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  const isMobile =
    viewport.isClient &&
    viewport.width > 0 &&
    viewport.width < mobileBreakpoint;

  const isDesktop = viewport.isClient ? !isMobile : false;
  const mode: RoadMapViewportMode = isMobile ? "mobile" : "desktop";

  return useMemo(
    () => ({
      width: viewport.width,
      height: viewport.height,
      isClient: viewport.isClient,
      isMobile,
      isDesktop,
      mode,
      positionKey: mode,
    }),
    [
      viewport.width,
      viewport.height,
      viewport.isClient,
      isMobile,
      isDesktop,
      mode,
    ],
  );
}
