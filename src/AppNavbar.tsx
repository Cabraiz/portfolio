import React, { useEffect, useRef, useState } from "react";
import { Button, Image, Nav, Navbar } from "react-bootstrap";
import logo from "./assets/icones/logo.svg";
import LiveAnimation from "./pages/PrincipalPage/Animation/live_animation";
import GoogleSignInButton from "./GoogleSignInButton";
import { useTranslation } from "react-i18next";
import { useLenis } from "./pages/Mateus/Context/LenisContext";

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
  const lenis = useLenis();

  const navRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const navContainerRef = useRef<HTMLDivElement>(null);
  const [underlineStyle, setUnderlineStyle] = useState<React.CSSProperties>({
    width: 0,
    left: 0,
    opacity: 0,
  });

  const handleScrollTo = (link: string) => {
  const section = document.querySelector(`#${link.toLowerCase()}`);
  if (section instanceof HTMLElement && lenis) {
    lenis.scrollTo(section, { offset: -100, duration: 1.3, easing: (t: number) => t });
  }
    setSelectedLink(link);
    setMenuOpen(false);
  };

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
          height: isMobileView ? "8vh" : "11vh",
          fontWeight: "600",
          marginTop: "0.1vh",
        }}
      >
        {isMobileView ? (
          <>
            <Button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                backgroundColor: "transparent",
                border: "none",
                marginLeft: "5vw",
                padding: "0",
                width: "7vw",
                height: "7vw",
                display: menuOpen ? "block" : "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                gap: menuOpen ? undefined : "8px",
                position: "relative",
                zIndex: 2,
              }}
            >
              <div
                style={{
                  width: "7vw",
                  height: "3px",
                  backgroundColor: "#fff",
                  borderRadius: "2px",
                  position: menuOpen ? "absolute" : "static",
                  top: menuOpen ? "50%" : undefined,
                  left: menuOpen ? "0" : undefined,
                  transform: menuOpen
                    ? "translateY(-50%) rotate(45deg)"
                    : "none",
                  transition: "0.4s",
                }}
              />
              <div
                style={{
                  width: "7vw",
                  height: "3px",
                  backgroundColor: "#fff",
                  borderRadius: "2px",
                  position: menuOpen ? "absolute" : "static",
                  top: menuOpen ? "50%" : undefined,
                  left: menuOpen ? "0" : undefined,
                  opacity: menuOpen ? 0 : 1,
                  transform: menuOpen ? "translateY(-50%)" : "none",
                  transition: "0.4s",
                }}
              />
              <div
                style={{
                  width: "7vw",
                  height: "3px",
                  backgroundColor: "#fff",
                  borderRadius: "2px",
                  position: menuOpen ? "absolute" : "static",
                  top: menuOpen ? "50%" : undefined,
                  left: menuOpen ? "0" : undefined,
                  transform: menuOpen
                    ? "translateY(-50%) rotate(-45deg)"
                    : "none",
                  transition: "0.4s",
                }}
              />
            </Button>

            <Image
              src={logo}
              alt="Logo"
              style={{
                marginLeft: "4vw",
                marginRight: "1vw",
                borderRadius: "20%",
                width: "4.8vh",
                height: "4.8vh",
                cursor: "pointer",
              }}
            />

            <div style={{ position: "relative", flexGrow: 1 }}>
              <span
                style={{
                  position: "absolute",
                  left: "40%",
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
          </>
        ) : (
          <>
            <Image
              src={logo}
              alt="Logo"
              style={{
                marginLeft: `${convertMultiplyVwToPx()}px`,
                marginRight: "20px",
                marginTop: "0.5vh",
                borderRadius: "20%",
                width: "8.5vh",
                height: "8.5vh",
                cursor: "pointer",
              }}
            />

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
                  onClick={() => handleScrollTo(link)}
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
                      fontSize: "1.5vw",
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
                      {link === "live" && (
                        <div
                          style={{
                            position: "absolute",
                            left: "-2rem",
                            top: "0",
                            transform: "translateY(-50%) scale(0.5)",
                            pointerEvents: "none",
                          }}
                        >
                          <LiveAnimation />
                        </div>
                      )}
                      <span>{t(`nav.${link}`)}</span>
                    </div>
                  </Nav.Link>
                </button>
              ))}
              <div style={underlineStyle} />
            </Nav>

            <div
              style={{
                width: "16vw",
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                marginRight: "2vw",
              }}
            >
              <GoogleSignInButton />
            </div>
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
              onClick={() => handleScrollTo(link)}
              style={{
                color: "#fff",
                textDecoration: "none",
                fontSize: "1.1rem",
                fontWeight: "500",
                cursor: "pointer",
              }}
            >
              {t(`nav.${link}`)}
            </a>
          ))}
        </div>
      )}
    </>
  );
};

export default AppNavbar;
