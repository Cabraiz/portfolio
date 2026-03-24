import React, { useEffect, useState } from "react";

import LandingPage from "./LandingPage";
import LandingPageMobile from "./LandingPageMobile";
import {
  resolveLandingSectionMinHeight,
  resolveLandingViewportModeByWidth,
} from "./landingLayout.tokens";

const MOBILE_BREAKPOINT_PX = 992;

function useIsMobileLanding(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.innerWidth < MOBILE_BREAKPOINT_PX;
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia(
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

    mediaQuery.addListener(applyMatch);

    return () => {
      mediaQuery.removeListener(applyMatch);
    };
  }, []);

  return isMobile;
}

const LandingRouterPage: React.FC = () => {
  const isMobile = useIsMobileLanding();
  const viewportMode = isMobile ? "mobile" : "desktop";

  return (
    <div
      data-landing-router-root="true"
      data-landing-viewport={viewportMode}
      style={{
        width: "100%",
        minHeight: resolveLandingSectionMinHeight(viewportMode, {
          preferDynamicViewport: viewportMode === "desktop",
        }),
      }}
    >
      {isMobile ? <LandingPageMobile /> : <LandingPage />}
    </div>
  );
};

export default LandingRouterPage;
