import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { ReactLenis } from "lenis/react";

import "./App.css";
import "../pages/LoginHubLocal/login.css";
import "../pages/Mateus/Mateus.css";
import "../pages/Surprise/Surprise.css";

import AppRoutes from "../routes/AppRoutes";
import AppNavbar from "./NavBar/AppNavbar";

import "react-toastify/dist/ReactToastify.css";

import TitleWebsite from "../pages/PrincipalPage/TitleWebsite/title_website";
import { getLenisScrollSettings } from "../features/scroll/getLenisScrollSettings";
import {
  getPathBySectionId,
  getSectionIdByPath,
  type LandingSectionId,
} from "../features/navigation/landingSections";
import type {
  LenisScrollSettings,
  ScrollHardwareInfo,
  ScrollViewport,
} from "../features/scroll/lenisScrollProfiles";
import {
  isHomeGameRoutePath,
  isHomeGameStandaloneHost,
} from "./appHostRouting";

const APP_LENIS_SCROLL_CLASS = "desktop-lenis-scroll";
const APP_LENIS_MOBILE_SCROLL_CLASS = "mobile-lenis-scroll";

const MOBILE_APP_BACKGROUND =
  "linear-gradient(180deg, #050505 0%, #0a0a0a 38%, #0d0d0d 100%)";

const links: readonly LandingSectionId[] = [
  "portfolio",
  "roadMap",
  "technologies",
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

function getBrowserDocument(): Document | null {
  if (globalThis.document === undefined) {
    return null;
  }

  return globalThis.document;
}

function getViewportInfo(): ScrollViewport {
  const browserWindow = getBrowserWindow();

  if (!browserWindow) {
    return {
      width: 390,
      height: 844,
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

function buildSmoothSettings(): LenisScrollSettings {
  return getLenisScrollSettings({
    viewport: getViewportInfo(),
    hardware: getHardwareInfo(),
    prefersReducedMotion: getPrefersReducedMotion(),
    platform: "mobile",
  });
}

function AppMobile() {
  const location = useLocation();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const navigationCleanupRef = useRef<(() => void) | null>(null);
  const [smoothOptions, setSmoothOptions] = useState<LenisScrollSettings>(() =>
    buildSmoothSettings(),
  );

  const hiddenNavbarRoutes = useMemo(
    () => [
      "/enigma",
      "/libras-unlock",
      "/libras",
      "/rosa-unlock",
      "/rosa",
      "/vinho-unlock",
      "/vinho",
      "/loginhublocal",
      "/registerhublocal",
      "/resume",
      "/doris",
      "/casanova",
      "/hublocal",
      "/drive",
      "/elevator",
    ],
    [],
  );

  const isGameStandaloneSurface = useMemo(() => {
    return isHomeGameStandaloneHost() || isHomeGameRoutePath(location.pathname);
  }, [location.pathname]);

  const isNavHidden =
    isGameStandaloneSurface || hiddenNavbarRoutes.includes(location.pathname);

  const activeSectionId = useMemo<LandingSectionId | "">(() => {
    return getSectionIdByPath(location.pathname) ?? "";
  }, [location.pathname]);

  const handleNavigateToSection = useCallback(
    (sectionId: LandingSectionId) => {
      navigationCleanupRef.current?.();
      navigationCleanupRef.current = null;

      const browserWindow = getBrowserWindow();
      const browserDocument = getBrowserDocument();
      const target = browserDocument?.getElementById(sectionId) ?? null;

      if (browserWindow !== null && browserDocument !== null && target !== null) {
        const activeWindow = browserWindow;
        const activeDocument = browserDocument;
        let cancelled = false;
        const timerIds: number[] = [];

        function cancelAlignment(): void {
          cleanup();
        }

        function cleanup(): void {
          cancelled = true;
          timerIds.forEach((timerId) => activeWindow.clearTimeout(timerId));
          activeWindow.removeEventListener("wheel", cancelAlignment);
          activeWindow.removeEventListener("touchstart", cancelAlignment);

          if (navigationCleanupRef.current === cleanup) {
            navigationCleanupRef.current = null;
          }
        }

        function alignTarget(): void {
          if (cancelled) {
            return;
          }

          const currentTarget = activeDocument.getElementById(sectionId);
          const navbar =
            activeDocument.querySelector<HTMLElement>("nav.navbar");

          if (!currentTarget) {
            return;
          }

          const navbarOffset = navbar
            ? Math.ceil(navbar.getBoundingClientRect().height + 2)
            : 76;
          const targetTop =
            activeWindow.scrollY +
            currentTarget.getBoundingClientRect().top -
            navbarOffset;

          activeWindow.scrollTo({
            top: Math.max(0, targetTop),
            behavior: getPrefersReducedMotion() ? "auto" : "smooth",
          });
        }

        navigationCleanupRef.current = cleanup;
        browserWindow.addEventListener("wheel", cancelAlignment, {
          passive: true,
          once: true,
        });
        browserWindow.addEventListener("touchstart", cancelAlignment, {
          passive: true,
          once: true,
        });

        alignTarget();
        [360, 760, 1180].forEach((delay) => {
          timerIds.push(browserWindow.setTimeout(alignTarget, delay));
        });
        timerIds.push(browserWindow.setTimeout(cleanup, 1800));
      } else {
        navigate(getPathBySectionId(sectionId));
      }

      setMenuOpen(false);
    },
    [navigate],
  );

  useEffect(() => {
    return () => {
      navigationCleanupRef.current?.();
    };
  }, []);

  useEffect(() => {
    const browserWindow = getBrowserWindow();

    if (!browserWindow) {
      return;
    }

    let frame = 0;

    const updateSmoothOptions = () => {
      browserWindow.cancelAnimationFrame(frame);

      frame = browserWindow.requestAnimationFrame(() => {
        setSmoothOptions(buildSmoothSettings());
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
      browserWindow.removeEventListener("orientationchange", updateSmoothOptions);
    };
  }, []);

  useEffect(() => {
    const browserDocument = getBrowserDocument();

    if (!browserDocument) {
      return;
    }

    const html = browserDocument.documentElement;
    const { body } = browserDocument;

    html.classList.remove(APP_LENIS_SCROLL_CLASS);
    body.classList.remove(APP_LENIS_SCROLL_CLASS);

    html.classList.add(APP_LENIS_MOBILE_SCROLL_CLASS);
    body.classList.add(APP_LENIS_MOBILE_SCROLL_CLASS);

    const previousHtmlBackground = html.style.background;
    const previousBodyBackground = body.style.background;

    html.style.background = "#050505";
    body.style.background = "#050505";

    return () => {
      html.classList.remove(APP_LENIS_MOBILE_SCROLL_CLASS);
      body.classList.remove(APP_LENIS_MOBILE_SCROLL_CLASS);

      html.style.background = previousHtmlBackground;
      body.style.background = previousBodyBackground;
    };
  }, []);

  const mobileLayoutStyle = useMemo<React.CSSProperties>(() => {
    return {
      "--mobile-safe-top": "max(env(safe-area-inset-top), 0px)",
      "--mobile-safe-bottom": "max(env(safe-area-inset-bottom), 0px)",
      position: "relative",
      width: "100%",
      minHeight: "100dvh",
      background: MOBILE_APP_BACKGROUND,
      display: "flex",
      flexDirection: "column",
    } as React.CSSProperties;
  }, []);

  const mobilePageContentStyle = useMemo<React.CSSProperties>(() => {
    return {
      position: "relative",
      width: "100%",
      flex: 1,
      minHeight: "0",
      paddingTop: "0px",
      paddingBottom: "var(--mobile-safe-bottom, 0px)",
      boxSizing: "border-box",
      background: MOBILE_APP_BACKGROUND,
    };
  }, []);

  return (
    <ReactLenis
      root
      className="app-lenis-root"
      options={{
        autoRaf: true,
        orientation: "vertical",
        gestureOrientation: "vertical",
        smoothWheel: smoothOptions.smoothWheel,
        lerp: smoothOptions.lerp,
        wheelMultiplier: smoothOptions.wheelMultiplier,
        touchMultiplier: smoothOptions.touchMultiplier,
      }}
    >
      <div className="app-lenis-content" style={mobileLayoutStyle}>
        {!isGameStandaloneSurface ? (
          <TitleWebsite
            title1="Mateus Cardoso Cabral | Fundador e Investidor em IA"
            title2="Cabraiz | IA, Tecnologia e Software"
          />
        ) : null}

        {!isNavHidden && (
          <AppNavbar
            isMobileView={true}
            activeSectionId={activeSectionId}
            onNavigateToSection={handleNavigateToSection}
            menuOpen={menuOpen}
            setMenuOpen={setMenuOpen}
            items={links}
          />
        )}

        <main style={mobilePageContentStyle}>
          <AppRoutes />
        </main>

        <ToastContainer />
      </div>
    </ReactLenis>
  );
}

export default AppMobile;
