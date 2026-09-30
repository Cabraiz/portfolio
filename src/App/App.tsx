import React, { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { isLandingPath } from "../features/navigation/landingSections";
import {
  isHomeGameRoutePath,
  isHomeGameStandaloneHost,
} from "./appHostRouting";

const DESKTOP_MEDIA_QUERY = "(min-width: 768px)";
const LANDING_DESKTOP_MEDIA_QUERY = "(min-width: 992px)";

const AppDesktop = lazy(() => import("./AppDesktop"));
const AppMobile = lazy(() => import("./AppMobile"));

const appShellFallback = (
  <div
    aria-label="Carregando portfólio"
    role="status"
    style={{ minHeight: "100dvh", background: "#050505" }}
  />
);

function getIsDesktop(mediaQuery: string): boolean {
  if (typeof globalThis.matchMedia !== "function") {
    return true;
  }

  return globalThis.matchMedia(mediaQuery).matches;
}

const App: React.FC = () => {
  const location = useLocation();
  const desktopMediaQuery = isLandingPath(location.pathname)
    ? LANDING_DESKTOP_MEDIA_QUERY
    : DESKTOP_MEDIA_QUERY;

  const shouldForceMobileGame = useMemo(() => {
    return isHomeGameStandaloneHost() || isHomeGameRoutePath(location.pathname);
  }, [location.pathname]);

  const [isDesktop, setIsDesktop] = useState<boolean>(() => getIsDesktop(desktopMediaQuery));

  useEffect(() => {
    if (shouldForceMobileGame) {
      return undefined;
    }

    if (typeof globalThis.matchMedia !== "function") {
      return undefined;
    }

    const mediaQuery = globalThis.matchMedia(desktopMediaQuery);

    const handleChange = (event: MediaQueryListEvent) => {
      setIsDesktop(event.matches);
    };

    setIsDesktop(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [shouldForceMobileGame, desktopMediaQuery]);

  if (shouldForceMobileGame) {
    return (
      <Suspense fallback={appShellFallback}>
        <AppMobile />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={appShellFallback}>
      {isDesktop ? <AppDesktop /> : <AppMobile />}
    </Suspense>
  );
};

export default App;
