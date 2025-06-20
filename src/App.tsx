import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import Lenis from "@studio-freight/lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import "./App.css";
import "./pages/LoginHubLocal/login.css";
import "./pages/Mateus/Mateus.css";
import "./pages/Surprise/Surprise.css";

import AppRoutes from "./routes/AppRoutes";
import AppNavbar from "./AppNavbar";
import LandingPage from "./pages/Mateus/LandingPage/LandingPage";

import "react-toastify/dist/ReactToastify.css";

import TitleWebsite from "./pages/PrincipalPage/TitleWebsite/title_website";
import { Button } from "react-bootstrap";
import { LenisContext } from "./pages/Mateus/Context/LenisContext";

gsap.registerPlugin(ScrollTrigger);

function App() {
  const lenis = useRef<Lenis | null>(null);

  const [windowSize, setWindowSize] = useState(getWindowSize());
  const [selectedLink, setSelectedLink] = useState("home");
  const [animateGoogle, setAnimateGoogle] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const isMobileView = windowSize.innerWidth < 768;
  const dropdownHeight = 270;

  const baseLinks = ["home", "portfolio", "roadMap", "pricing", "live", "contact"];
  const links = isMobileView ? baseLinks.filter(link => link !== "home") : baseLinks;

  const appWrapperRef = useRef<HTMLDivElement>(null);

  // 🚀 Lenis + ScrollTrigger
  useEffect(() => {
    const l = new Lenis({
      lerp: 0.07,
      wheelMultiplier: 1.2,
      smoothWheel: true,
    });

    lenis.current = l;

    function raf(time: number) {
      l.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    ScrollTrigger.scrollerProxy(document.body, {
      scrollTop(value) {
        if (value !== undefined) {
          l.scrollTo(value);
        }
        return l.scroll;
      },
      getBoundingClientRect() {
        return {
          top: 0,
          left: 0,
          width: window.innerWidth,
          height: window.innerHeight,
        };
      },
      pinType: document.body.style.transform ? "transform" : "fixed",
    });

    const update = () => ScrollTrigger.update();

    l.on("scroll", update);
    ScrollTrigger.addEventListener("refresh", update);
    ScrollTrigger.defaults({ scroller: document.body });
    ScrollTrigger.refresh();

    return () => {
      l.destroy();
      ScrollTrigger.removeEventListener("refresh", update);
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  // 🎯 Sanfona com animação nível Apple
  useEffect(() => {
    const wrapper = appWrapperRef.current;
    if (!wrapper) return;

    if (menuOpen && isMobileView) {
      gsap.to(wrapper, {
        y: dropdownHeight,
        duration: 0.8,
        ease: "elastic.out(1, 0.5)",
        backdropFilter: "blur(8px) brightness(0.9)",
        backgroundColor: "rgba(0,0,0,0.3)",
      });
    } else {
      gsap.to(wrapper, {
        y: 0,
        duration: 0.5,
        ease: "expo.inOut",
        backdropFilter: "blur(0px) brightness(1)",
        backgroundColor: "rgba(0,0,0,0)",
      });
    }
  }, [menuOpen, isMobileView]);

  // 🎯 Resize
  useEffect(() => {
    function handleWindowResize() {
      setWindowSize(getWindowSize());
    }
    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  }, []);

  function getWindowSize() {
    const { innerWidth, innerHeight } = window;
    return { innerWidth, innerHeight };
  }

  const convertMultiplyVwToPx = () => {
    return (windowSize.innerWidth / 100) * 14;
  };

  const createButton = (buttonNumber: number, selected: boolean) => (
    <Button
      key={buttonNumber}
      variant="primary"
      size="sm"
      style={{
        width: selected ? "24px" : "12px",
        height: selected ? "24px" : "12px",
        marginBottom: "2vh",
        transform: selected ? "none" : "rotate(45deg) scaleX(0.8)",
        transformOrigin: "center",
        background: selected
          ? "radial-gradient(circle at 30% 30%, #0b0b0b, #1a1a1a)"
          : "linear-gradient(135deg, #fcd535, #ffb347)",
        border: selected ? "3px solid #fcd535" : "none",
        borderRadius: selected ? "8px" : "2px",
        boxShadow: selected
          ? "0 0 12px #fcd535, inset 0 0 8px #fcd53588"
          : "0 0 8px rgba(252, 213, 53, 0.6)",
        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = selected
          ? "scale(1.15)"
          : "rotate(45deg) scale(1.15)";
        e.currentTarget.style.boxShadow = selected
          ? "0 0 20px #fcd535, inset 0 0 12px #fcd53588"
          : "0 0 14px rgba(252, 213, 53, 0.8)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = selected
          ? "none"
          : "rotate(45deg) scaleX(0.8)";
        e.currentTarget.style.boxShadow = selected
          ? "0 0 12px #fcd535, inset 0 0 8px #fcd53588"
          : "0 0 8px rgba(252, 213, 53, 0.6)";
      }}
      onClick={() => setSelectedLink(links[buttonNumber - 1])}
    />
  );

  const buttons = Array.from({ length: links.length }).map((_, index) =>
    createButton(index + 1, links[index] === selectedLink)
  );

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
    const body = document.body;
    if (isNavHidden) {
      body.classList.add("no-background");
    } else {
      body.classList.remove("no-background");
    }
  }, [isNavHidden]);

  return (
    <LenisContext.Provider value={lenis.current}>
      <TitleWebsite title1="Bem Vindo! 🤝" title2="Cabraiz" />

      {/* 🔥 Navbar */}
      {!isNavHidden && (
        <AppNavbar
          isMobileView={isMobileView}
          selectedLink={selectedLink}
          setSelectedLink={setSelectedLink}
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          links={links}
          convertMultiplyVwToPx={convertMultiplyVwToPx}
        />
      )}

      {/* 🔥 App Wrapper — Aqui entra a sanfona */}
      <div ref={appWrapperRef}>
        {!isNavHidden && <LandingPage />}
        <AppRoutes />
      </div>

      {/* 🔥 Floating Buttons */}
      {!isNavHidden && !isMobileView && (
        <div
          style={{
            position: "fixed",
            bottom: "10px",
            right: "10px",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            marginBottom: "8vh",
            marginRight: "3vw",
          }}
        >
          {buttons}
        </div>
      )}

      <ToastContainer />
    </LenisContext.Provider>
  );
}

export default App;
