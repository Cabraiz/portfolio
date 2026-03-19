import React, { useEffect, useState } from "react";
import AppDesktop from "./AppDesktop";
import AppMobile from "./AppMobile";

const DESKTOP_MEDIA_QUERY = "(min-width: 768px)";

function getIsDesktop(): boolean {
  if (typeof globalThis.matchMedia !== "function") {
    return true;
  }

  return globalThis.matchMedia(DESKTOP_MEDIA_QUERY).matches;
}

const App: React.FC = () => {
  const [isDesktop, setIsDesktop] = useState<boolean>(() => getIsDesktop());

  useEffect(() => {
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
  }, []);

  return isDesktop ? <AppDesktop /> : <AppMobile />;
};

export default App;
