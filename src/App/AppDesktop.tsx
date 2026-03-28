import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { ReactLenis } from "lenis/react";

import AppRoutes from "../routes/AppRoutes";
import AppNavbar from "./NavBar/AppNavbar";
import TitleWebsite from "../pages/PrincipalPage/TitleWebsite/title_website";
import FloatingButtons from "./FloatingButtons";
import { useSectionVisibility } from "../hooks/useSectionVisibility";
import { getLenisScrollSettings } from "../features/scroll/getLenisScrollSettings";
import useLandingSectionNavigation from "../features/navigation/useLandingSectionNavigation";
import {
  getSectionIdByPath,
  isLandingPath,
  type LandingSectionId,
} from "../features/navigation/landingSections";
import type {
  LenisScrollSettings,
  ScrollHardwareInfo,
  ScrollViewport,
} from "../features/scroll/lenisScrollProfiles";

import "react-toastify/dist/ReactToastify.css";

const links: LandingSectionId[] = [
  "home",
  "portfolio",
  "roadMap",
  "pricing",
  "live",
  "contact",
];

function getBrowserWindow(): Window | null {
  if (globalThis.window === undefined) {
    return null;
  }

  return globalThis.window;
}

function getBrowserNavigator(): Navigator | null {
  if (globalThis.navigator === undefined) {
    return null;
  }

  return globalThis.navigator;
}

function getViewportInfo(): ScrollViewport {
  const browserWindow = getBrowserWindow();

  if (!browserWindow) {
    return {
      width: 1366,
      height: 768,
    };
  }

  return {
    width: browserWindow.innerWidth,
    height: browserWindow.innerHeight,
  };
}

function getHardwareInfo(): ScrollHardwareInfo {
  const browserNavigator = getBrowserNavigator();

  if (!browserNavigator) {
    return {};
  }

  const nav = browserNavigator as Navigator & { deviceMemory?: number };

  return {
    deviceMemoryGb: nav.deviceMemory ?? null,
    hardwareConcurrency: nav.hardwareConcurrency ?? null,
  };
}

function getPrefersReducedMotion(): boolean {
  return (
    typeof globalThis.matchMedia === "function" &&
    globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function buildSmoothSettings(viewport: ScrollViewport): LenisScrollSettings {
  return getLenisScrollSettings({
    viewport,
    hardware: getHardwareInfo(),
    prefersReducedMotion: getPrefersReducedMotion(),
    platform: "desktop",
  });
}

export default function AppDesktop() {
  const { isNavHidden, isFloatingHidden } = useSectionVisibility();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);

  const [smoothOptions, setSmoothOptions] = useState<LenisScrollSettings>(() =>
    buildSmoothSettings(getViewportInfo()),
  );

  const {
    activeSectionId,
    routeSectionId,
    controllerReady,
    navigateToSection,
  } = useLandingSectionNavigation();

  const resolvedActiveSectionId = useMemo<LandingSectionId | "">(() => {
    const pathnameSectionId = getSectionIdByPath(location.pathname) ?? "";

    if (!isLandingPath(location.pathname)) {
      return pathnameSectionId;
    }

    if (controllerReady) {
      return activeSectionId;
    }

    return routeSectionId || pathnameSectionId;
  }, [
    activeSectionId,
    controllerReady,
    location.pathname,
    routeSectionId,
  ]);

  const handleNavigateToSection = useCallback(
    (sectionId: LandingSectionId) => {
      navigateToSection(sectionId, {
        replace: isLandingPath(location.pathname),
        syncUrl: true,
      });

      setMenuOpen(false);
    },
    [location.pathname, navigateToSection],
  );

  useEffect(() => {
    const browserWindow = getBrowserWindow();

    if (!browserWindow) {
      return;
    }

    let frame = 0;

    const updateSmoothOptions = () => {
      browserWindow.cancelAnimationFrame(frame);

      frame = browserWindow.requestAnimationFrame(() => {
        setSmoothOptions(buildSmoothSettings(getViewportInfo()));
      });
    };

    updateSmoothOptions();

    browserWindow.addEventListener("resize", updateSmoothOptions, {
      passive: true,
    });
    browserWindow.addEventListener("orientationchange", updateSmoothOptions, {
      passive: true,
    });

    return () => {
      browserWindow.cancelAnimationFrame(frame);
      browserWindow.removeEventListener("resize", updateSmoothOptions);
      browserWindow.removeEventListener(
        "orientationchange",
        updateSmoothOptions,
      );
    };
  }, []);

  return (
    <ReactLenis
      root
      options={{
        autoRaf: false,
        autoResize: true,
        orientation: "vertical",
        gestureOrientation: "vertical",
        smoothWheel: smoothOptions.smoothWheel,
        lerp: smoothOptions.lerp,
        wheelMultiplier: smoothOptions.wheelMultiplier,
        touchMultiplier: smoothOptions.touchMultiplier,
      }}
    >
      <TitleWebsite title1="Bem Vindo! 🤝" title2="Cabraiz" />

      {!isNavHidden && (
        <AppNavbar
          isMobileView={false}
          activeSectionId={resolvedActiveSectionId}
          onNavigateToSection={handleNavigateToSection}
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          items={links}
        />
      )}

      <AppRoutes />

      {!isFloatingHidden && (
        <FloatingButtons
          items={links}
          activeSectionId={resolvedActiveSectionId}
          onNavigateToSection={handleNavigateToSection}
        />
      )}

      <ToastContainer />
    </ReactLenis>
  );
}
