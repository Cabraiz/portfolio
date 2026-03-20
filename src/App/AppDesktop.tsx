import { useMemo, useState } from "react";
import { ToastContainer } from "react-toastify";
import { ReactLenis } from "lenis/react";

import AppRoutes from "../routes/AppRoutes";
import AppNavbar from "./NavBar/AppNavbar";
import TitleWebsite from "../pages/PrincipalPage/TitleWebsite/title_website";
import LandingPage from "../pages/Mateus/LandingPage/LandingPage";
import FloatingButtons from "./FloatingButtons";
import { useSectionVisibility } from "../hooks/useSectionVisibility";

import "react-toastify/dist/ReactToastify.css";

const links = ["home", "portfolio", "roadMap", "pricing", "live", "contact"];

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
      lerp: 0.09,
      wheelMultiplier: 1,
      touchMultiplier: 1.12,
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
        lerp: 0.11,
        wheelMultiplier: 0.92,
        touchMultiplier: 1.08,
        smoothWheel: true,
      }
    : {
        lerp: 0.08,
        wheelMultiplier: 1.02,
        touchMultiplier: 1.16,
        smoothWheel: true,
      };
}

export default function AppDesktop() {
  const { isNavHidden, isFloatingHidden, isLandingHidden } =
    useSectionVisibility();

  const [selectedLink, setSelectedLink] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);

  const smoothOptions = useMemo(getSmoothSettings, []);

  return (
    <ReactLenis
      root
      options={{
        autoRaf: false,
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
