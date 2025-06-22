import { useEffect, useRef, useState } from "react";
import { ToastContainer } from "react-toastify";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import AppRoutes from "../routes/AppRoutes";
import AppNavbar from "./NavBar/AppNavbar";
import TitleWebsite from "../pages/PrincipalPage/TitleWebsite/title_website";
import LandingPage from "../pages/Mateus/LandingPage/LandingPage";
import FloatingButtons from "./FloatingButtons";

import { useSectionVisibility } from "../hooks/useSectionVisibility";

import "react-toastify/dist/ReactToastify.css";

gsap.registerPlugin(ScrollTrigger);

const links = ["home", "portfolio", "roadMap", "pricing", "live", "contact"];

export default function AppDesktop() {
  const appWrapperRef = useRef<HTMLDivElement>(null);

  const { isNavHidden, isFloatingHidden, isLandingHidden } =
    useSectionVisibility();

  const [selectedLink, setSelectedLink] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);

  // 🔥 Dropdown Animation
  useEffect(() => {
    const wrapper = appWrapperRef.current;
    if (!wrapper) return;

    const y = menuOpen ? 270 : 0;
    const backdrop = menuOpen
      ? "blur(8px) brightness(0.9)"
      : "blur(0) brightness(1)";
    const bg = menuOpen ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0)";

    gsap.to(wrapper, {
      y,
      backdropFilter: backdrop,
      backgroundColor: bg,
      ease: menuOpen ? "elastic.out(1, 0.5)" : "expo.inOut",
      duration: menuOpen ? 0.8 : 0.5,
    });
  }, [menuOpen]);

  return (
    <>
      <TitleWebsite title1="Bem Vindo! 🤝" title2="Cabraiz" />

      {/* 🔥 Navbar */}
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
        {/* 🔥 LandingPage */}
        {!isLandingHidden && <LandingPage />}
        <AppRoutes />
      </div>

      {/* 🔥 Floating Buttons */}
      {!isFloatingHidden && (
        <FloatingButtons
          links={links}
          selectedLink={selectedLink}
          setSelectedLink={setSelectedLink}
        />
      )}

      <ToastContainer />
    </>
  );
}
