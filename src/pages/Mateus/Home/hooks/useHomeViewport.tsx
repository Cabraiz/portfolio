import { useEffect, useState } from "react";

const MOBILE_BREAKPOINT_PX = 992;

function getBrowserWindow(): Window | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window;
}

function resolveIsMobileViewport(browserWindow: Window): boolean {
  return browserWindow.innerWidth < MOBILE_BREAKPOINT_PX;
}

export function useMateusViewport() {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    const browserWindow = getBrowserWindow();

    if (browserWindow === null) {
      return false;
    }

    return resolveIsMobileViewport(browserWindow);
  });

  useEffect(() => {
    const browserWindow = getBrowserWindow();

    if (browserWindow === null) {
      return;
    }

    const mediaQuery = browserWindow.matchMedia(
      `(max-width: ${MOBILE_BREAKPOINT_PX - 1}px)`
    );

    const applyMatch = (): void => {
      setIsMobile(mediaQuery.matches);
    };

    applyMatch();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", applyMatch);

      return () => {
        mediaQuery.removeEventListener("change", applyMatch);
      };
    }

    const handleResize = (): void => {
      setIsMobile(resolveIsMobileViewport(browserWindow));
    };

    browserWindow.addEventListener("resize", handleResize, {
      passive: true,
    });

    return () => {
      browserWindow.removeEventListener("resize", handleResize);
    };
  }, []);

  return {
    isMobile,
    isDesktop: !isMobile,
    mobileBreakpointPx: MOBILE_BREAKPOINT_PX,
  };
}
