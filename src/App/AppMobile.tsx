import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import "./App.css";
import "../pages/LoginHubLocal/login.css";
import "../pages/Mateus/Mateus.css";
import "../pages/Surprise/Surprise.css";

import AppRoutes from "../routes/AppRoutes";
import AppNavbar from "./NavBar/AppNavbar";
import LandingPage from "../pages/Mateus/LandingPage/LandingPage";

import "react-toastify/dist/ReactToastify.css";

import TitleWebsite from "../pages/PrincipalPage/TitleWebsite/title_website";
import { Button } from "react-bootstrap";

function AppMobile() {
  const [windowSize, setWindowSize] = useState(getWindowSize());
  const [selectedLink, setSelectedLink] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);

  const appWrapperRef = useRef<HTMLDivElement>(null);

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
      onClick={() => setSelectedLink(links[buttonNumber - 1])}
    />
  );

  const buttons = Array.from({ length: links.length }).map((_, index) =>
    createButton(index + 1, links[index] === selectedLink)
  );

  useEffect(() => {
    const body = document.body;
    if (isNavHidden) {
      body.classList.add("no-background");
    } else {
      body.classList.remove("no-background");
    }
  }, [isNavHidden]);

  return (
    <>
      <TitleWebsite title1="Bem Vindo! 🤝" title2="Cabraiz" />

      {!isNavHidden && (
        <AppNavbar
          isMobileView={true}
          selectedLink={selectedLink}
          setSelectedLink={setSelectedLink}
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          links={links}
          convertMultiplyVwToPx={convertMultiplyVwToPx}
        />
      )}

      {!isNavHidden && <LandingPage />}

      <div ref={appWrapperRef}>
        <AppRoutes />
      </div>

      <ToastContainer />
    </>
  );
}

export default AppMobile;
