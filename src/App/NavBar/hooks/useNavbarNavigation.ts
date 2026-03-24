import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  getPathBySectionId,
  normalizeLandingSectionId,
  type LandingSectionId,
} from "../../../features/navigation/landingSections";

export type NavbarLenisScrollToOptions = Readonly<{
  offset?: number;
  duration?: number;
  easing?: (value: number) => number;
}>;

export type NavbarLenisLike =
  | Readonly<{
      scrollTo: (
        target: number | HTMLElement,
        options?: NavbarLenisScrollToOptions,
      ) => void;
    }>
  | null
  | undefined;

export type UseNavbarNavigationParams = Readonly<{
  isMobileView: boolean;
  navbarHeight: number;
  lenis?: NavbarLenisLike;
  setMenuOpen: (open: boolean) => void;
  mobileScrollOffset?: number;
  desktopScrollOffset?: number;
}>;

export type UseNavbarNavigationResult = Readonly<{
  handleNavigateToSection: (link: LandingSectionId) => void;
  handleBrandClick: () => void;
  scrollToSectionElement: (sectionId: LandingSectionId) => void;
  scrollToTop: () => void;
}>;

function getBrowserWindow(): Window | null {
  if (typeof globalThis.window === "undefined") {
    return null;
  }

  return globalThis.window;
}

function getBrowserDocument(): Document | null {
  if (typeof globalThis.document === "undefined") {
    return null;
  }

  return globalThis.document;
}

function normalizePathname(pathname: string): string {
  if (!pathname) {
    return "/";
  }

  if (pathname !== "/" && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

function createEaseOutCubic(value: number): number {
  return 1 - Math.pow(1 - value, 3);
}

function getSectionElement(
  browserDocument: Document,
  sectionId: LandingSectionId,
): HTMLElement | null {
  const exactSection = browserDocument.getElementById(sectionId);

  if (exactSection instanceof HTMLElement) {
    return exactSection;
  }

  const loweredSection = browserDocument.getElementById(
    sectionId.toLowerCase(),
  );

  if (loweredSection instanceof HTMLElement) {
    return loweredSection;
  }

  return null;
}

function getScrollOffset(
  isMobileView: boolean,
  navbarHeight: number,
  mobileScrollOffset: number,
  desktopScrollOffset: number,
): number {
  if (isMobileView) {
    return -(navbarHeight + mobileScrollOffset);
  }

  return -(navbarHeight + desktopScrollOffset);
}

export function useNavbarNavigation({
  isMobileView,
  navbarHeight,
  lenis,
  setMenuOpen,
  mobileScrollOffset = 16,
  desktopScrollOffset = 18,
}: UseNavbarNavigationParams): UseNavbarNavigationResult {
  const navigate = useNavigate();
  const location = useLocation();

  const scrollToSectionElement = useCallback(
    (sectionId: LandingSectionId) => {
      const browserDocument = getBrowserDocument();
      const browserWindow = getBrowserWindow();

      if (!browserDocument) {
        return;
      }

      const section = getSectionElement(browserDocument, sectionId);

      if (!section) {
        return;
      }

      const offset = getScrollOffset(
        isMobileView,
        navbarHeight,
        mobileScrollOffset,
        desktopScrollOffset,
      );

      if (lenis) {
        lenis.scrollTo(section, {
          offset,
          duration: 1.05,
          easing: createEaseOutCubic,
        });

        return;
      }

      section.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      if (browserWindow) {
        browserWindow.scrollBy({
          top: offset,
          behavior: "smooth",
        });
      }
    },
    [
      desktopScrollOffset,
      isMobileView,
      lenis,
      mobileScrollOffset,
      navbarHeight,
    ],
  );

  const scrollToTop = useCallback(() => {
    const browserWindow = getBrowserWindow();

    if (lenis) {
      lenis.scrollTo(0, {
        duration: 1,
        easing: createEaseOutCubic,
      });

      return;
    }

    if (!browserWindow) {
      return;
    }

    browserWindow.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [lenis]);

  const handleNavigateToSection = useCallback(
    (link: LandingSectionId) => {
      const normalizedSectionId = normalizeLandingSectionId(link);

      if (!normalizedSectionId) {
        return;
      }

      const targetPath = getPathBySectionId(normalizedSectionId);
      const currentPath = normalizePathname(location.pathname);
      const normalizedTargetPath = normalizePathname(targetPath);

      if (currentPath === normalizedTargetPath) {
        scrollToSectionElement(normalizedSectionId);
      } else {
        navigate(targetPath);
      }

      setMenuOpen(false);
    },
    [location.pathname, navigate, scrollToSectionElement, setMenuOpen],
  );

  const handleBrandClick = useCallback(() => {
    const homePath = getPathBySectionId("home");
    const currentPath = normalizePathname(location.pathname);
    const normalizedHomePath = normalizePathname(homePath);

    if (currentPath === normalizedHomePath) {
      scrollToTop();
    } else {
      navigate(homePath);
    }

    setMenuOpen(false);
  }, [location.pathname, navigate, scrollToTop, setMenuOpen]);

  return {
    handleNavigateToSection,
    handleBrandClick,
    scrollToSectionElement,
    scrollToTop,
  };
}

export default useNavbarNavigation;
