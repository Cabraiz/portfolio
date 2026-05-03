import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import AppDesktop from "./AppDesktop";
import AppMobile from "./AppMobile";
import {
  isHomeDriveRoutePath,
  isHomeDriveStandaloneHost,
} from "./appHostRouting";

const DESKTOP_MEDIA_QUERY = "(min-width: 768px)";

function getIsDesktop(): boolean {
  if (typeof globalThis.matchMedia !== "function") {
    return true;
  }

  return globalThis.matchMedia(DESKTOP_MEDIA_QUERY).matches;
}

const App: React.FC = () => {
  const location = useLocation();

  const shouldForceMobileDrive = useMemo(() => {
    return isHomeDriveStandaloneHost() || isHomeDriveRoutePath(location.pathname);
  }, [location.pathname]);

  const [isDesktop, setIsDesktop] = useState<boolean>(() => getIsDesktop());

  useEffect(() => {
    if (shouldForceMobileDrive) {
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
  }, [shouldForceMobileDrive]);

  if (shouldForceMobileDrive) {
    return <AppMobile />;
  }

  return isDesktop ? <AppDesktop /> : <AppMobile />;
};

export default App;
