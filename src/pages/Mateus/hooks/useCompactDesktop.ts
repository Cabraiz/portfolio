import { useEffect, useState } from "react";
import { COMPACT_DESKTOP_MEDIA_QUERY } from "../mateusDesktop.data";

export function useCompactDesktop(): boolean {
  const [isCompactDesktop, setIsCompactDesktop] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const mediaQuery = window.matchMedia(COMPACT_DESKTOP_MEDIA_QUERY);

    const syncState = (event?: MediaQueryListEvent) => {
      setIsCompactDesktop(event ? event.matches : mediaQuery.matches);
    };

    syncState();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", syncState);

      return () => {
        mediaQuery.removeEventListener("change", syncState);
      };
    }

    mediaQuery.addListener(syncState);

    return () => {
      mediaQuery.removeListener(syncState);
    };
  }, []);

  return isCompactDesktop;
}
