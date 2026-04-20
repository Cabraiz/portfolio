import React, { useEffect, useState, type CSSProperties } from "react";

import RoadMapErrorBoundary from "../RoadMap/ui/chrome/RoadMapErrorBoundary";
import LandingPage from "./LandingPage";
import LandingPageMobile from "./LandingPageMobile";
import { resolveLandingSectionMinHeight } from "./landingLayout.tokens";

const MOBILE_BREAKPOINT_PX = 992;

const routerRootStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  justifyContent: "flex-start",
  boxSizing: "border-box",
};

function getBrowserWindow(): Window | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window;
}

function resolveIsMobileFromWindow(browserWindow: Window): boolean {
  return browserWindow.innerWidth < MOBILE_BREAKPOINT_PX;
}

function useIsMobileLanding(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    const browserWindow = getBrowserWindow();

    if (browserWindow === null) {
      return false;
    }

    return resolveIsMobileFromWindow(browserWindow);
  });

  useEffect(() => {
    const browserWindow = getBrowserWindow();

    if (browserWindow === null) {
      return;
    }

    const mediaQuery = browserWindow.matchMedia(
      `(max-width: ${MOBILE_BREAKPOINT_PX - 1}px)`,
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
      setIsMobile(resolveIsMobileFromWindow(browserWindow));
    };

    browserWindow.addEventListener("resize", handleResize, {
      passive: true,
    });

    return () => {
      browserWindow.removeEventListener("resize", handleResize);
    };
  }, []);

  return isMobile;
}

const LandingRouterPage: React.FC = () => {
  const isMobile = useIsMobileLanding();

  const mobileRootMinHeight = resolveLandingSectionMinHeight("mobile", {
    preferDynamicViewport: false,
    sectionRole: "hero",
  });

  return (
    <RoadMapErrorBoundary
      sectionLabel={`Landing ${isMobile ? "mobile" : "desktop"}`}
      fallbackTitle={`A página principal (${isMobile ? "mobile" : "desktop"}) quebrou`}
      resetKey={isMobile ? "mobile" : "desktop"}
      minHeight={isMobile ? mobileRootMinHeight : undefined}
      fullHeight={isMobile}
    >
      <div
        data-landing-router-root="true"
        data-landing-viewport={isMobile ? "mobile" : "desktop"}
        style={{
          ...routerRootStyle,
          ...(isMobile ? { minHeight: mobileRootMinHeight } : null),
        }}
      >
        {isMobile ? <LandingPageMobile /> : <LandingPage />}
      </div>
    </RoadMapErrorBoundary>
  );
};

export default LandingRouterPage;
