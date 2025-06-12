import React, { useEffect, useRef, useState } from "react";
import { Button, Image, Nav, Navbar } from "react-bootstrap";
import { Link } from "react-router-dom";
import logo from "./assets/icones/logo.svg";
import LiveAnimation from "./pages/PrincipalPage/Animation/live_animation";
import GoogleSignInButton from "./GoogleSignInButton";
import { useTranslation } from "react-i18next";

interface AppNavbarProps {
  isMobileView: boolean;
  selectedLink: string;
  setSelectedLink: (link: string) => void;
  animateGoogle: boolean;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  links: string[];
  convertMultiplyVwToPx: () => number;
}

const AppNavbar: React.FC<AppNavbarProps> = ({
  isMobileView,
  selectedLink,
  setSelectedLink,
  animateGoogle,
  menuOpen,
  setMenuOpen,
  links,
  convertMultiplyVwToPx,
}) => {
  const { t } = useTranslation();

  const navRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const navContainerRef = useRef<HTMLDivElement>(null);
  const [underlineStyle, setUnderlineStyle] = useState<React.CSSProperties>({
    width: 0,
    left: 0,
    opacity: 0,
  });

  useEffect(() => {
    const current = navRefs.current[selectedLink];
    const container = navContainerRef.current;
    if (current && container) {
      setUnderlineStyle({
        width: current.offsetWidth,
        left: current.offsetLeft,
        opacity: 1,
        transition: "all 300ms ease-in-out",
        position: "absolute",
        bottom: "-8px",
        height: "3px",
        backgroundColor: "white",
        borderRadius: "3px",
      });
    }
  }, [selectedLink]);

  return (
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
                <div
                  key={i}
                  style={{
                    width: "24px",
                    height: "2px",
                    backgroundColor: "#fff",
                  }}
                />
              ))}
            </Button>
          </>
        ) : (
          <>
            <Nav
              ref={navContainerRef}
              style={{
                position: "relative",
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
                    ref={(el) => {
                      navRefs.current[link] = el;
                    }}
                    className={`nav-link-custom ${selectedLink === link ? "active" : ""}`}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 100,
                      letterSpacing: 1.3,
                      fontSize: "1.8rem",
                      fontFamily: "Modernist, sans-serif",
                      cursor: "pointer",
                      userSelect: "none",
                      transition: "all 0.25s ease-in-out",
                      paddingBottom: "10px",
                      position: "relative",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = "0.85";
                      e.currentTarget.style.transform = "scale(1.035)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = "1";
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                  >
                    <div style={{ position: "relative" }}>
                      {/* bolinha decorativa fixa */}
                      {link === "live" && (
                        <div
                          style={{
                            position: "absolute",
                            left: "-2rem",
                            top: "0",
                            transform: "translateY(-50%) scale(0.5)",
                            pointerEvents: "none", // impede clique
                          }}
                        >
                          <LiveAnimation />
                        </div>
                      )}

                      {/* texto centralizado normalmente */}
                      <span>{t(`nav.${link}`)}</span>
                    </div>
                  </Nav.Link>
                </button>
              ))}
              {/* 🔥 Traço animado */}
              <div style={underlineStyle} />
            </Nav>

            <GoogleSignInButton animate={animateGoogle} />
          </>
        )}
      </Navbar>

      {isMobileView && (
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
      )}
    </>
  );
};

export default AppNavbar;
