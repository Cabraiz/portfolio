import { useEffect, useState } from "react";
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

type ViewportInfo = Readonly<{
  width: number;
  height: number;
}>;

function getViewportInfo(): ViewportInfo {
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

function getSmoothSettings(viewport: ViewportInfo): SmoothSettings {
  const hasNavigator = "navigator" in globalThis;

  const prefersReducedMotion =
    "matchMedia" in globalThis &&
    globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReducedMotion) {
    return {
      lerp: 1,
      wheelMultiplier: 1,
      touchMultiplier: 1,
      smoothWheel: false,
    };
  }

  if (!hasNavigator) {
    return {
      lerp: 0.1,
      wheelMultiplier: 0.96,
      touchMultiplier: 1.04,
      smoothWheel: true,
    };
  }

  const nav = globalThis.navigator as Navigator & { deviceMemory?: number };
  const cores = nav.hardwareConcurrency ?? 4;
  const memory = nav.deviceMemory ?? 4;

  const isWeakMachine = cores <= 4 || memory <= 4;

  /**
   * Desktop “alto”, típico de 1080p ou próximo disso.
   * Aqui reduzimos a sensação de inércia e o tempo
   * que o Lenis passa interpolando cada scroll.
   */
  const isTallDesktop = viewport.width >= 1280 && viewport.height >= 900;

  /**
   * Perfil ainda um pouco mais conservador para janelas grandes.
   * A ideia não é deixar “duro”, e sim evitar arrasto excessivo.
   */
  if (isTallDesktop && isWeakMachine) {
    return {
      lerp: 0.16,
      wheelMultiplier: 0.84,
      touchMultiplier: 1,
      smoothWheel: true,
    };
  }

  if (isTallDesktop) {
    return {
      lerp: 0.14,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.02,
      smoothWheel: true,
    };
  }

  if (isWeakMachine) {
    return {
      lerp: 0.12,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.04,
      smoothWheel: true,
    };
  }

  return {
    lerp: 0.1,
    wheelMultiplier: 0.98,
    touchMultiplier: 1.08,
    smoothWheel: true,
  };
}

export default function AppDesktop() {
  const { isNavHidden, isFloatingHidden, isLandingHidden } =
    useSectionVisibility();

  const [selectedLink, setSelectedLink] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);

  const [smoothOptions, setSmoothOptions] = useState<SmoothSettings>(() =>
    getSmoothSettings(getViewportInfo())
  );

  useEffect(() => {
    let frame = 0;

    const updateSmoothOptions = () => {
      cancelAnimationFrame(frame);

      frame = window.requestAnimationFrame(() => {
        setSmoothOptions(getSmoothSettings(getViewportInfo()));
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
