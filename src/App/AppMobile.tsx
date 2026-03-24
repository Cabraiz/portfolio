import { useCallback, useEffect, useMemo, useState } from "react";
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
  normalizeLandingSectionId,
  type LandingSectionId,
} from "../features/navigation/landingSections";
import type {
  LenisScrollSettings,
  ScrollHardwareInfo,
  ScrollViewport,
} from "../features/scroll/lenisScrollProfiles";

const APP_LENIS_SCROLL_CLASS = "desktop-lenis-scroll";

const links: LandingSectionId[] = [
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
    ],
    [],
  );

  const isNavHidden = hiddenNavbarRoutes.includes(location.pathname);

  const selectedLink = useMemo(() => {
    return getSectionIdByPath(location.pathname) ?? "";
  }, [location.pathname]);

  const handleSelectLink = useCallback(
    (nextLink: string) => {
      const normalizedSectionId = normalizeLandingSectionId(nextLink);

      if (!normalizedSectionId) {
        return;
      }

      navigate(getPathBySectionId(normalizedSectionId));
      setMenuOpen(false);
    },
    [navigate],
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

    const previousHtmlOverflow = html.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    const previousHtmlOverscroll = html.style.overscrollBehavior;
    const previousBodyOverscroll = body.style.overscrollBehavior;

    html.classList.add(APP_LENIS_SCROLL_CLASS);
    body.classList.add(APP_LENIS_SCROLL_CLASS);

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    html.style.overscrollBehavior = "none";
    body.style.overscrollBehavior = "none";

    return () => {
      html.classList.remove(APP_LENIS_SCROLL_CLASS);
      body.classList.remove(APP_LENIS_SCROLL_CLASS);

      html.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
      html.style.overscrollBehavior = previousHtmlOverscroll;
      body.style.overscrollBehavior = previousBodyOverscroll;
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
      <div className="app-lenis-content">
        <TitleWebsite title1="Bem Vindo! 🤝" title2="Cabraiz" />

        {!isNavHidden && (
          <AppNavbar
            isMobileView={true}
            selectedLink={selectedLink}
            setSelectedLink={handleSelectLink}
            menuOpen={menuOpen}
            setMenuOpen={setMenuOpen}
            links={links}
          />
        )}

        <AppRoutes />

        <ToastContainer />
      </div>
    </ReactLenis>
  );
}

export default AppMobile;
