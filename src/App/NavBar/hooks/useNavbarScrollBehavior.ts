import { useEffect, useRef, useState } from "react";

export type LenisScrollEvent = Readonly<{
  scroll?: number;
  animatedScroll?: number;
  actualScroll?: number;
}>;

export type LenisLike = Readonly<{
  on: (event: "scroll", callback: (event: LenisScrollEvent) => void) => void;
  off: (event: "scroll", callback: (event: LenisScrollEvent) => void) => void;
}> | null | undefined;

export type UseNavbarScrollBehaviorParams = Readonly<{
  isMobileView: boolean;
  menuOpen: boolean;
  lenis?: LenisLike;
  enabled?: boolean;
  hideThreshold?: number;
}>;

export type UseNavbarScrollBehaviorResult = Readonly<{
  showNavbar: boolean;
}>;

function getBrowserWindow(): Window | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window;
}

function getScrollValue(event?: LenisScrollEvent): number {
  if (!event) {
    return 0;
  }

  if (typeof event.animatedScroll === "number") {
    return event.animatedScroll;
  }

  if (typeof event.actualScroll === "number") {
    return event.actualScroll;
  }

  if (typeof event.scroll === "number") {
    return event.scroll;
  }

  return 0;
}

function getCurrentWindowScroll(): number {
  const browserWindow = getBrowserWindow();

  if (!browserWindow) {
    return 0;
  }

  return browserWindow.scrollY;
}

export function useNavbarScrollBehavior({
  isMobileView,
  menuOpen,
  lenis,
  enabled = false,
  hideThreshold = 150,
}: UseNavbarScrollBehaviorParams): UseNavbarScrollBehaviorResult {
  const [showNavbar, setShowNavbar] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const browserWindow = getBrowserWindow();

    if (!enabled) {
      setShowNavbar(true);
      lastScrollY.current = 0;
      return;
    }

    if (!browserWindow) {
      return;
    }

    if (isMobileView || menuOpen) {
      setShowNavbar(true);
      lastScrollY.current = getCurrentWindowScroll();
      return;
    }

    if (lenis) {
      const handleLenisScroll = (event: LenisScrollEvent) => {
        const currentScrollY = getScrollValue(event);
        const isScrollingDown = currentScrollY > lastScrollY.current;

        if (isScrollingDown && currentScrollY > hideThreshold) {
          setShowNavbar(false);
        } else {
          setShowNavbar(true);
        }

        lastScrollY.current = currentScrollY;
      };

      lastScrollY.current = getCurrentWindowScroll();
      lenis.on("scroll", handleLenisScroll);

      return () => {
        lenis.off("scroll", handleLenisScroll);
      };
    }

    const handleWindowScroll = () => {
      const currentScrollY = browserWindow.scrollY;
      const isScrollingDown = currentScrollY > lastScrollY.current;

      if (isScrollingDown && currentScrollY > hideThreshold) {
        setShowNavbar(false);
      } else {
        setShowNavbar(true);
      }

      lastScrollY.current = currentScrollY;
    };

    lastScrollY.current = browserWindow.scrollY;
    browserWindow.addEventListener("scroll", handleWindowScroll, {
      passive: true,
    });

    return () => {
      browserWindow.removeEventListener("scroll", handleWindowScroll);
    };
  }, [enabled, hideThreshold, isMobileView, lenis, menuOpen]);

  return {
    showNavbar,
  };
}

export default useNavbarScrollBehavior;
