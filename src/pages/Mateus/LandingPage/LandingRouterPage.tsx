import React, {
  Suspense,
  lazy,
  useEffect,
  useState,
  type CSSProperties,
} from "react";

import RoadMapErrorBoundary from "../RoadMap/ui/chrome/RoadMapErrorBoundary";

import LandingSectionSkeleton, {
  type LandingSectionSkeletonVariant,
} from "./LandingSectionSkeleton";
import { resolveLandingSectionMinHeight } from "./landingLayout.tokens";

const LandingPage = lazy(() => import("./LandingPage"));
const LandingPageMobile = lazy(() => import("./LandingPageMobile"));

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

type LandingRouterLoadingFallbackProps = Readonly<{
  viewportMode: "desktop" | "mobile";
  minHeight: CSSProperties["minHeight"];
}>;

function resolveRouterSkeletonVariant(
  viewportMode: "desktop" | "mobile",
): LandingSectionSkeletonVariant {
  return viewportMode === "mobile" ? "content" : "hero";
}

function LandingRouterLoadingFallback({
  viewportMode,
  minHeight,
}: LandingRouterLoadingFallbackProps) {
  return (
    <div
      style={{
        ...routerRootStyle,
        minHeight,
      }}
      aria-hidden="true"
      data-landing-router-fallback={viewportMode}
    >
      <LandingSectionSkeleton
        variant={resolveRouterSkeletonVariant(viewportMode)}
        minHeight={minHeight}
        fullHeight
      />
    </div>
  );
}

const LandingRouterPage: React.FC = () => {
  const isMobile = useIsMobileLanding();
  const viewportMode = isMobile ? "mobile" : "desktop";

  const resolvedMinHeight = resolveLandingSectionMinHeight(viewportMode, {
    preferDynamicViewport: viewportMode === "desktop",
  });

  return (
    <RoadMapErrorBoundary
      sectionLabel={`Landing ${viewportMode}`}
      fallbackTitle={`A página principal (${viewportMode}) quebrou`}
      resetKey={viewportMode}
      minHeight={resolvedMinHeight}
      fullHeight
    >
      <Suspense
        fallback={
          <LandingRouterLoadingFallback
            viewportMode={viewportMode}
            minHeight={resolvedMinHeight}
          />
        }
      >
        <div
          data-landing-router-root="true"
          data-landing-viewport={viewportMode}
          style={{
            ...routerRootStyle,
            minHeight: resolvedMinHeight,
          }}
        >
          {isMobile ? <LandingPageMobile /> : <LandingPage />}
        </div>
      </Suspense>
    </RoadMapErrorBoundary>
  );
};

export default LandingRouterPage;
