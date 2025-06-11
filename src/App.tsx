
import React, { useEffect, useState } from "react";
import { Routes, Route, useLocation, Link } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import "./App.css";
import "./pages/LoginHubLocal/login.css";
import "./pages/Mateus/Mateus.css";
import "./pages/Surprise/Surprise.css";
import GoogleSignInButton from "./GoogleSignInButton";

import { Row, Navbar, Image, Button, Nav } from "react-bootstrap";

import logo from "./assets/icones/logo.svg?url";
import logoGmail from "./assets/icones/7.svg?url";

import "react-toastify/dist/ReactToastify.css";


import RegisterHubLocal from "./pages/RegisterHubLocal/Register";
import LoginHubLocal from "./pages/LoginHubLocal/login";
import Hublocal from "./pages/Hublocal/Hublocal";
import Surprise from "./pages/Surprise/Surprise";
import Resume from "./pages/Resume/Resume";
import Doris from "./pages/Doris.mobi/principal";
import CasaNova from "./pages/CasaNova/CasaNova";


import { PrivateOutlet } from "./redux/shared/utils/PrivateOutlet";

import Mateus from "./pages/Mateus/Mateus";
import LiveAnimation from "./pages/PrincipalPage/Animation/live_animation";
import TitleWebsite from "./pages/PrincipalPage/TitleWebsite/title_website";

import { isMobile } from "react-device-detect";
import { useTranslation } from "react-i18next";

function App() {
  const [windowSize, setWindowSize] = useState(getWindowSize());
  const [signInStatus] = useState(["", false]);
  const [selectedLink, setSelectedLink] = useState("Home");
  const links = ["home", "portfolio", "roadMap", "pricing", "live", "contact"];
  const [animateGoogle, setAnimateGoogle] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);

  const isMobileView = windowSize.innerWidth < 768;

  useEffect(() => {
    // aguarda página carregada para ativar animação
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

    return () => {
      window.removeEventListener("resize", handleWindowResize);
    };
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
        transformOrigin: selected ? "" :  "center",
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

  const isNavOn =
    pathname === "/hublocal" ||
    pathname === "/loginhublocal" ||
    pathname === "/registerhublocal" ||
    pathname === "/resume" ||
    pathname === "/doris" ||
    pathname === "/casanova";

  const handleLinkClick =
    (link: string) =>
    (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
      event.preventDefault();
      setSelectedLink(link);
  };

  const { t } = useTranslation();
  return (
  <>
    <div>
      <TitleWebsite title1="Bem Vindo! 🤝" title2="Cabraiz" />
    </div>
    {isNavOn ? null : (
      <>
        <Navbar
          className="border-gradient-green"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            height: "11vh",
            fontWeight: "600",
            paddingTop: "0px",
            paddingBottom: "0px",
            marginInline: "0px",
            marginTop: "0.1vh",
            marginBottom: "0",
          }}
        >
          <Link to="/" style={{ textDecoration: "none" }}>
            <Image
              src={logo}
              style={{
                marginLeft: isMobileView ? "5vw" : `${convertMultiplyVwToPx()}px`,
                marginRight: "20px",
                marginTop: "0.5vh",
                borderRadius: "20%",
                width: "8.5vh",
                height: "8.5vh",
                cursor: "pointer",
              }}
              alt="Logo"
            />
          </Link>

          {isMobileView ? (
            <>
              <div style={{ position: "relative", flexGrow: 1 }}>
                {/* Cabraiz centralizado */}
                <span
                  style={{
                    position: "absolute",
                    left: "42%",
                    transform: "translate(-50%, -40%)",
                    fontSize: "1.5rem",
                    fontWeight: "600",
                    color: "#ffffff",
                    whiteSpace: "nowrap",
                    letterSpacing: "1px",
                    zIndex: 1,
                  }}
                >
                  Cabraiz
                </span>
              </div>

              {/* Botão Hamburguer à direita */}
              <Button
                onClick={() => setMenuOpen(!menuOpen)}
                style={{
                  backgroundColor: "transparent",
                  border: "none",
                  marginRight: "5vw",
                  padding: "0",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "4px",
                  zIndex: 2,
                }}
              >
                <div style={{ width: "24px", height: "2px", backgroundColor: "#fff" }} />
                <div style={{ width: "24px", height: "2px", backgroundColor: "#fff" }} />
                <div style={{ width: "24px", height: "2px", backgroundColor: "#fff" }} />
              </Button>
            </>
          ) : (
            <>
              <Nav
                id="nav-dropdown"
                style={{
                  display: "flex",
                  alignItems: "stretch",
                  justifyContent: "flex-start",
                  marginLeft: "-4vw",
                  marginTop: "1vh",
                  height: "100%",
                  gap: "1rem",
                }}
              >
                {links.map((link) => (
                  <button
                    key={link}
                    onClick={() => {
                      window.location.hash = `#${link.toLowerCase()}`;
                      setSelectedLink(link);
                    }}
                    style={{
                      all: "unset",
                      flex: "1 1 auto",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    <Nav.Link
                      as="div"
                      className={`text-nowrap nav-link-custom ${selectedLink === link ? "active" : ""}`}
                      style={{
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                        width: "100%",
                        fontWeight: 500,
                        letterSpacing: 1.5,
                      }}
                    >
                      {link === "live" && (
                        <div
                          style={{
                            position: "absolute",
                            top: "1.5vh",
                            left: "-1.2vw",
                            zIndex: 10,
                            transform: "scale(0.5)",
                            transformOrigin: "top left",
                          }}
                        >
                          <LiveAnimation />
                        </div>
                      )}
                      <span style={{ marginBottom: "0.2rem" }}>{t(`nav.${link}`)}</span>
                      {selectedLink === link && (
                        <div
                          style={{
                            width: "50%",
                            height: "3px",
                            backgroundColor: "white",
                            borderRadius: "3px",
                            transition: "all 0.3s ease",
                          }}
                        />
                      )}
                    </Nav.Link>
                  </button>
                ))}
              </Nav>
              <GoogleSignInButton animate={animateGoogle} />
            </>
          )}
        </Navbar>

        {/* Dropdown menu mobile */}
        <div
  style={{
    maxHeight: menuOpen ? "500px" : "0px",
    overflow: "hidden",
    transition: "max-height 0.4s ease",
    backgroundColor: "#121212",
    padding: menuOpen ? "1rem 2rem" : "0 2rem",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    borderBottom: menuOpen ? "1px solid #444" : "none",
  }}
>
  {links.map((link) => (
    <a
      key={link}
      href={`#${link}`}
      onClick={() => {
        setSelectedLink(link);
        setMenuOpen(false);
      }}
      style={{
        color: "#fff",
        textDecoration: "none",
        fontSize: "1.1rem",
        fontWeight: "500",
        opacity: menuOpen ? 1 : 0,
        transition: "opacity 0.3s ease",
      }}
    >
      {t(`nav.${link}`)}
    </a>
  ))}
  <div style={{ marginTop: "1rem", opacity: menuOpen ? 1 : 0, transition: "opacity 0.3s ease" }}>
    <GoogleSignInButton animate={animateGoogle} />
  </div>
</div>

      </>
    )}

    <Routes>
      <Route path="/" element={<Mateus />} />
      <Route path="/registerhublocal" element={<RegisterHubLocal />} />
      <Route path="/loginhublocal" element={<LoginHubLocal />} />
      <Route path="/resume" element={<Resume />} />
      <Route path="/doris" element={<Doris />} />
      <Route path="/casanova" element={<CasaNova />} />
      <Route path="/hublocal" element={<PrivateOutlet />}>
        <Route index element={<Hublocal />} />
      </Route>
    </Routes>

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
