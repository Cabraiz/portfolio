import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import "./App.css";
import "./pages/LoginHubLocal/login.css";
import "./pages/Mateus/Mateus.css";
import "./pages/Surprise/Surprise.css";

import AppRoutes from "./AppRoutes";
import GoogleSignInButton from "./GoogleSignInButton";
import AppNavbar from "./AppNavbar";

import "react-toastify/dist/ReactToastify.css";

import TitleWebsite from "./pages/PrincipalPage/TitleWebsite/title_website";
import { useTranslation } from "react-i18next";
import { Button } from "react-bootstrap";

function App() {
  const [windowSize, setWindowSize] = useState(getWindowSize());
  const [signInStatus] = useState(["", false]);
  const [selectedLink, setSelectedLink] = useState("Home");
  const [animateGoogle, setAnimateGoogle] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const links = ["home", "portfolio", "roadMap", "pricing", "live", "contact"];
  const isMobileView = windowSize.innerWidth < 768;

  useEffect(() => {
    const timeout = setTimeout(() => {
      setAnimateGoogle(true);
    }, 200);
    return () => clearTimeout(timeout);
  }, []);

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
        width: selected ? "23px" : "",
        height: selected ? "22px" : "12px",
        marginRight: selected ? "-2px" : "",
        marginBottom: selected ? "2.5vh" : "3vh",
        transform: selected ? "" : "rotate(45deg) scaleX(0.7)",
        transformOrigin: selected ? "" : "center",
        backgroundColor: selected ? "#00000000" : "#9b59b6",
        borderColor: selected ? "#9b59b6" : "#00000000",
        borderWidth: selected ? "3px" : "",
        borderRadius: "1px",
      }}
    ></Button>
  );

  const buttons = Array.from({ length: links.length }).map((_, index) =>
    createButton(index + 1, links[index] === selectedLink),
  );

  const { pathname } = useLocation();
  const isNavOn = [
    "/hublocal",
    "/loginhublocal",
    "/registerhublocal",
    "/resume",
    "/doris",
    "/casanova",
  ].includes(pathname);

  const { t } = useTranslation();

  return (
    <>
      <TitleWebsite title1="Bem Vindo! 🤝" title2="Cabraiz" />

      {!isNavOn && (
        <AppNavbar
          isMobileView={isMobileView}
          selectedLink={selectedLink}
          setSelectedLink={setSelectedLink}
          animateGoogle={animateGoogle}
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          links={links}
          convertMultiplyVwToPx={convertMultiplyVwToPx}
        />
      )}

      <AppRoutes />

      {!isNavOn && !isMobileView && (
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
    </>
  );
}

export default App;
