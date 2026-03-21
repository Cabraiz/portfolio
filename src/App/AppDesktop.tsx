import { useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import { ReactLenis } from "lenis/react";

import AppRoutes from "../routes/AppRoutes";
import AppNavbar from "./NavBar/AppNavbar";
import TitleWebsite from "../pages/PrincipalPage/TitleWebsite/title_website";
import LandingPage from "../pages/Mateus/LandingPage/LandingPage";
import FloatingButtons from "./FloatingButtons";
import { useSectionVisibility } from "../hooks/useSectionVisibility";
import { getLenisScrollSettings } from "../features/scroll/getLenisScrollSettings";
import type {
  LenisScrollSettings,
  ScrollHardwareInfo,
  ScrollViewport,
} from "../features/scroll/lenisScrollProfiles";

import "react-toastify/dist/ReactToastify.css";

const links = ["home", "portfolio", "roadMap", "pricing", "live", "contact"];

function getViewportInfo(): ScrollViewport {
  if (typeof window === "undefined") {
    return {
      width: 1366,
      height: 768,
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

function buildSmoothSettings(viewport: ScrollViewport): LenisScrollSettings {
  return getLenisScrollSettings({
    viewport,
    hardware: getHardwareInfo(),
    prefersReducedMotion: getPrefersReducedMotion(),
    platform: "desktop",
  });
}

export default function AppDesktop() {
  const { isNavHidden, isFloatingHidden, isLandingHidden } =
    useSectionVisibility();

  const [selectedLink, setSelectedLink] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);

  const [smoothOptions, setSmoothOptions] = useState<LenisScrollSettings>(() =>
    buildSmoothSettings(getViewportInfo()),
  );

  useEffect(() => {
    let frame = 0;

    const updateSmoothOptions = () => {
      cancelAnimationFrame(frame);

      frame = window.requestAnimationFrame(() => {
        setSmoothOptions(buildSmoothSettings(getViewportInfo()));
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
          selectedLink={selectedLink}
          setSelectedLink={setSelectedLink}
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          links={links}
        />
      )}

      <>
        {!isLandingHidden && <LandingPage />}
        <AppRoutes />
      </>

      {!isFloatingHidden && (
        <FloatingButtons
          links={links}
          selectedLink={selectedLink}
          setSelectedLink={setSelectedLink}
        />
      )}

      <ToastContainer />
    </ReactLenis>
  );
}
