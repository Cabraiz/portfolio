import { useRef, useState } from "react";
import { ToastContainer } from "react-toastify";

import AppRoutes from "../routes/AppRoutes";
import AppNavbar from "./NavBar/AppNavbar";
import TitleWebsite from "../pages/PrincipalPage/TitleWebsite/title_website";
import LandingPage from "../pages/Mateus/LandingPage/LandingPage";
import FloatingButtons from "./FloatingButtons";

import { useSectionVisibility } from "../hooks/useSectionVisibility";

import "react-toastify/dist/ReactToastify.css";
import { LenisRef, ReactLenis } from "lenis/react";

const links = ["home", "portfolio", "roadMap", "pricing", "live", "contact"];

// ✅ Detectar máquina fraca
function getSmoothSettings() {
  const cores = navigator.hardwareConcurrency || 4;
  const memory = (navigator as any).deviceMemory || 4;
  const isWeak = cores <= 4 || memory <= 4;

  return {
    lerp: isWeak ? 0.15 : 0.07,
    wheelMultiplier: isWeak ? 0.6 : 1,
    touchMultiplier: isWeak ? 1.05 : 1.2,
  };
}

export default function AppDesktop() {
  const appWrapperRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<LenisRef>(null);

  const { isNavHidden, isFloatingHidden, isLandingHidden } =
    useSectionVisibility();

  const [selectedLink, setSelectedLink] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);

  const smoothOptions = getSmoothSettings();

  return (
    <ReactLenis
      ref={lenisRef}
      className="lenis-wrapper"
      style={{ height: "100vh", overflow: "hidden" }}
      options={{
        autoRaf: false, // mantém compatibilidade com GSAP ScrollTrigger
        smoothWheel: true,
        gestureOrientation: "vertical",
        orientation: "vertical",
        ...smoothOptions, // ✅ ajusta automaticamente para máquinas fracas
      }}
    >
      <div
        className="lenis-content"
        style={{ height: "auto", minHeight: "100%" }}
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

        <div ref={appWrapperRef}>
          {!isLandingHidden && <LandingPage />}
          <AppRoutes />
        </div>

        {!isFloatingHidden && (
          <FloatingButtons
            links={links}
            selectedLink={selectedLink}
            setSelectedLink={setSelectedLink}
          />
        )}
      </div>
      <ToastContainer />
    </ReactLenis>
  );
}
