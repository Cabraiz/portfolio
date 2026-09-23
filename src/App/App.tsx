import React, { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  isHomeGameRoutePath,
  isHomeGameStandaloneHost,
} from "./appHostRouting";

const DESKTOP_MEDIA_QUERY = "(min-width: 768px)";

const AppDesktop = lazy(() => import("./AppDesktop"));
const AppMobile = lazy(() => import("./AppMobile"));

const appShellFallback = (
  <div
    aria-label="Carregando portfólio"
    role="status"
    style={{ minHeight: "100dvh", background: "#050505" }}
  />
);

function getIsDesktop(): boolean {
  if (typeof globalThis.matchMedia !== "function") {
    return true;
  }

  return globalThis.matchMedia(DESKTOP_MEDIA_QUERY).matches;
}

const App: React.FC = () => {
  const location = useLocation();

  const shouldForceMobileGame = useMemo(() => {
    return isHomeGameStandaloneHost() || isHomeGameRoutePath(location.pathname);
  }, [location.pathname]);

  const [isDesktop, setIsDesktop] = useState<boolean>(() => getIsDesktop());

  useEffect(() => {
    if (shouldForceMobileGame) {
      return undefined;
    }

    if (typeof globalThis.matchMedia !== "function") {
      return undefined;
    }

    const mediaQuery = globalThis.matchMedia(DESKTOP_MEDIA_QUERY);

    const handleChange = (event: MediaQueryListEvent) => {
      setIsDesktop(event.matches);
    };

    setIsDesktop(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [shouldForceMobileGame]);

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
