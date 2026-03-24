import { useEffect, useMemo, useState } from "react";

import { navbarLayoutTokens } from "../NavbarStyles";

export type UseNavbarViewportParams = Readonly<{
  isMobileView: boolean;
  desktopCompactMinWidth?: number;
  desktopCompactMaxHeight?: number;
}>;

export type UseNavbarViewportResult = Readonly<{
  viewportWidth: number;
  viewportHeight: number;
  isCompactDesktop: boolean;
  navbarHeight: number;
  desktopGoogleButtonWidth: string;
  desktopSideColumnWidth: string;
}>;

const DEFAULT_VIEWPORT_WIDTH = 1440;
const DEFAULT_VIEWPORT_HEIGHT = 900;

/**
 * Alinhado ao comportamento atual do AppNavbar:
 * desktop compacto depende da altura do viewport,
 * desde que já esteja fora do modo mobile.
 */
const DEFAULT_DESKTOP_COMPACT_MIN_WIDTH = 961;
const DEFAULT_DESKTOP_COMPACT_MAX_HEIGHT = 1080;

function getBrowserWindow(): Window | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window;
}

function getInitialViewportWidth(): number {
  const browserWindow = getBrowserWindow();

  if (!browserWindow) {
    return DEFAULT_VIEWPORT_WIDTH;
  }

  return browserWindow.innerWidth;
}

function getInitialViewportHeight(): number {
  const browserWindow = getBrowserWindow();

  if (!browserWindow) {
    return DEFAULT_VIEWPORT_HEIGHT;
  }

  return browserWindow.innerHeight;
}

function getIsCompactDesktopViewport(
  isMobileView: boolean,
  viewportWidth: number,
  viewportHeight: number,
  desktopCompactMinWidth: number,
  desktopCompactMaxHeight: number,
): boolean {
  if (isMobileView) {
    return false;
  }

  if (viewportWidth < desktopCompactMinWidth) {
    return false;
  }

  return viewportHeight <= desktopCompactMaxHeight;
}

function getNavbarHeight(isMobileView: boolean): number {
  return isMobileView
    ? navbarLayoutTokens.heights.mobile
    : navbarLayoutTokens.heights.desktop;
}

function getDesktopSideColumnWidth(isCompactDesktop: boolean): string {
  return isCompactDesktop
    ? navbarLayoutTokens.desktop.sideColumnWidth.compact
    : navbarLayoutTokens.desktop.sideColumnWidth.default;
}

function getDesktopGoogleButtonWidth(isCompactDesktop: boolean): string {
  return getDesktopSideColumnWidth(isCompactDesktop);
}

export function useNavbarViewport({
  isMobileView,
  desktopCompactMinWidth = DEFAULT_DESKTOP_COMPACT_MIN_WIDTH,
  desktopCompactMaxHeight = DEFAULT_DESKTOP_COMPACT_MAX_HEIGHT,
}: UseNavbarViewportParams): UseNavbarViewportResult {
  const [viewportWidth, setViewportWidth] = useState<number>(
    getInitialViewportWidth,
  );
  const [viewportHeight, setViewportHeight] = useState<number>(
    getInitialViewportHeight,
  );

  useEffect(() => {
    const browserWindow = getBrowserWindow();

    if (!browserWindow) {
      return;
    }

    const handleResize = () => {
      setViewportWidth(browserWindow.innerWidth);
      setViewportHeight(browserWindow.innerHeight);
    };

    handleResize();
    browserWindow.addEventListener("resize", handleResize);

    return () => {
      browserWindow.removeEventListener("resize", handleResize);
    };
  }, []);

  const isCompactDesktop = useMemo(() => {
    return getIsCompactDesktopViewport(
      isMobileView,
      viewportWidth,
      viewportHeight,
      desktopCompactMinWidth,
      desktopCompactMaxHeight,
    );
  }, [
    desktopCompactMaxHeight,
    desktopCompactMinWidth,
    isMobileView,
    viewportHeight,
    viewportWidth,
  ]);

  const navbarHeight = useMemo(() => {
    return getNavbarHeight(isMobileView);
  }, [isMobileView]);

  const desktopSideColumnWidth = useMemo(() => {
    return getDesktopSideColumnWidth(isCompactDesktop);
  }, [isCompactDesktop]);

  const desktopGoogleButtonWidth = useMemo(() => {
    return getDesktopGoogleButtonWidth(isCompactDesktop);
  }, [isCompactDesktop]);

  return {
    viewportWidth,
    viewportHeight,
    isCompactDesktop,
    navbarHeight,
    desktopGoogleButtonWidth,
    desktopSideColumnWidth,
  };
}

export default useNavbarViewport;
