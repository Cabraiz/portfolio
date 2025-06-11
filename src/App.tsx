import React, { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import "./App.css";
import "./pages/LoginHubLocal/login.css";
import "./pages/Mateus/Mateus.css";
import "./pages/Surprise/Surprise.css";

import GoogleSignInButton from "./GoogleSignInButton";
import AppRoutes from "./AppRoutes";

import { Row, Navbar, Image, Button, Nav } from "react-bootstrap";

import logo from "./assets/icones/logo.svg";
import logoGmail from "./assets/icones/7.svg";
import "react-toastify/dist/ReactToastify.css";

import LiveAnimation from "./pages/PrincipalPage/Animation/live_animation";
import TitleWebsite from "./pages/PrincipalPage/TitleWebsite/title_website";

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
        <>
          <Navbar
            className="border-gradient-green"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              height: "11vh",
              fontWeight: "600",
              marginTop: "0.1vh",
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
                  {[...Array(3)].map((_, i) => (
                    <div key={i} style={{ width: "24px", height: "2px", backgroundColor: "#fff" }} />
                  ))}
                </Button>
              </>
            ) : (
              <>
                <Nav
                  style={{
                    display: "flex",
                    alignItems: "stretch",
                    marginLeft: "-4vw",
                    marginTop: "1vh",
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
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Nav.Link
                        as="div"
                        className={`nav-link-custom ${selectedLink === link ? "active" : ""}`}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
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
                            }}
                          >
                            <LiveAnimation />
                          </div>
                        )}
                        <span>{t(`nav.${link}`)}</span>
                        {selectedLink === link && (
                          <div
                            style={{
                              width: "50%",
                              height: "3px",
                              backgroundColor: "white",
                              borderRadius: "3px",
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
                }}
              >
                {t(`nav.${link}`)}
              </a>
            ))}
            <div style={{ marginTop: "1rem" }}>
              <GoogleSignInButton animate={animateGoogle} />
            </div>
          </div>
        </>
      )}

      {/* Rotas separadas no componente AppRoutes */}
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
