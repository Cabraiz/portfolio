import { useEffect, useMemo, useState } from "react";
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

const APP_LENIS_SCROLL_CLASS = "desktop-lenis-scroll";

type SmoothSettings = Readonly<{
  lerp: number;
  wheelMultiplier: number;
  touchMultiplier: number;
  smoothWheel: boolean;
}>;

function getSmoothSettings(): SmoothSettings {
  const hasNavigator = "navigator" in globalThis;

  if (!hasNavigator) {
    return {
      lerp: 0.1,
      wheelMultiplier: 1,
      touchMultiplier: 1.08,
      smoothWheel: true,
    };
  }

  const nav = globalThis.navigator as Navigator & { deviceMemory?: number };
  const cores = nav.hardwareConcurrency ?? 4;
  const memory = nav.deviceMemory ?? 4;

  const prefersReducedMotion =
    "matchMedia" in globalThis &&
    globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const isWeak = cores <= 4 || memory <= 4;

  if (prefersReducedMotion) {
    return {
      lerp: 1,
      wheelMultiplier: 1,
      touchMultiplier: 1,
      smoothWheel: false,
    };
  }

  return isWeak
    ? {
        lerp: 0.12,
        wheelMultiplier: 0.94,
        touchMultiplier: 1.02,
        smoothWheel: true,
      }
    : {
        lerp: 0.09,
        wheelMultiplier: 1,
        touchMultiplier: 1.1,
        smoothWheel: true,
      };
}

function AppMobile() {
  const [selectedLink, setSelectedLink] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);

  const smoothOptions = useMemo(getSmoothSettings, []);

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
