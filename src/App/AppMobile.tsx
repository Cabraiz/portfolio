import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { ReactLenis } from "lenis/react";

import "./App.css";
import "../pages/LoginHubLocal/login.css";
import "../pages/Mateus/Mateus.css";
import "../pages/Surprise/Surprise.css";

import AppRoutes from "../routes/AppRoutes";
import AppNavbar from "./NavBar/AppNavbar";
import LandingPageMobile from "../pages/Mateus/LandingPage/LandingPageMobile";

import "react-toastify/dist/ReactToastify.css";

import TitleWebsite from "../pages/PrincipalPage/TitleWebsite/title_website";
import { getLenisScrollSettings } from "../features/scroll/getLenisScrollSettings";
import type {
  LenisScrollSettings,
  ScrollHardwareInfo,
  ScrollViewport,
} from "../features/scroll/lenisScrollProfiles";

const APP_LENIS_SCROLL_CLASS = "desktop-lenis-scroll";

function getViewportInfo(): ScrollViewport {
  if (typeof window === "undefined") {
    return {
      width: 390,
      height: 844,
    };
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

function getHardwareInfo(): ScrollHardwareInfo {
  if (typeof navigator === "undefined") {
    return {};
  }

  const nav = navigator as Navigator & { deviceMemory?: number };

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
  const [selectedLink, setSelectedLink] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [smoothOptions, setSmoothOptions] = useState<LenisScrollSettings>(() =>
    buildSmoothSettings(),
  );

  const baseLinks = ["portfolio", "roadMap", "pricing", "live", "contact"];
  const links = baseLinks;

  const { pathname } = useLocation();

  const hiddenNavbarRoutes = [
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
  ];

  const isNavHidden = hiddenNavbarRoutes.includes(pathname);

  useEffect(() => {
    let frame = 0;

    const updateSmoothOptions = () => {
      cancelAnimationFrame(frame);

      frame = window.requestAnimationFrame(() => {
        setSmoothOptions(buildSmoothSettings());
      });
    };

    updateSmoothOptions();

    window.addEventListener("resize", updateSmoothOptions, { passive: true });
    window.addEventListener("orientationchange", updateSmoothOptions, {
      passive: true,
    });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateSmoothOptions);
      window.removeEventListener("orientationchange", updateSmoothOptions);
    };
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    const { body } = document;

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
        /**
         * No mobile, manter autoRaf ligado é a opção mais segura
         * até a LandingPageMobile estar 100% integrada com bridge
         * manual de Lenis + GSAP.
         */
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
            setSelectedLink={setSelectedLink}
            menuOpen={menuOpen}
            setMenuOpen={setMenuOpen}
            links={links}
          />
        )}

        {!isNavHidden && <LandingPageMobile />}

        <AppRoutes />

        <ToastContainer />
      </div>
    </ReactLenis>
  );
}

export default AppMobile;
