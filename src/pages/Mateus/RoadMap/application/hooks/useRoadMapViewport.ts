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

    const handleResize = () => {
      setViewport(getViewportState());
    };

    handleResize();
    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const isMobile = viewport.width > 0 && viewport.width < mobileBreakpoint;
  const isDesktop = !isMobile;
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
    [viewport.width, viewport.height, viewport.isClient, isMobile, isDesktop, mode],
  );
}
