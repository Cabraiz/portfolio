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
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  links: string[];
  convertMultiplyVwToPx: () => number;
}

const AppNavbar: React.FC<AppNavbarProps> = ({
  isMobileView,
  selectedLink,
  setSelectedLink,
  menuOpen,
  setMenuOpen,
  links,
  convertMultiplyVwToPx,
}) => {
  const { t } = useTranslation();
  const lenis = useLenis();

  const [showNavbar, setShowNavbar] = useState(true);
  const lastScrollY = useRef(0);

  const navRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const navContainerRef = useRef<HTMLDivElement>(null);
  const [underlineStyle, setUnderlineStyle] = useState<React.CSSProperties>({
    width: 0,
    left: 0,
    opacity: 0,
  });

  // 🔥 Handle scroll hide/show
  useEffect(() => {
    const handleScroll = () => {
      if (menuOpen) return; // 🔥 Menu aberto → não esconde navbar

      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 150) {
        setShowNavbar(false); // 🔽 Scroll down → hide
      } else {
        setShowNavbar(true);  // 🔼 Scroll up → show
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [menuOpen]);

  // 🔥 Block scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [menuOpen]);

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
      {/* 🔥 Navbar */}
      <Navbar
        className="border-gradient-green"
        style={{
          transform: showNavbar ? "translateY(0)" : "translateY(-120%)",
          opacity: showNavbar ? 1 : 0,
          transition: "transform 0.4s ease, opacity 0.4s ease",
          boxShadow: showNavbar ? "0 4px 18px rgba(0,0,0,0.35)" : "none",
          backdropFilter: showNavbar ? "blur(6px)" : "none",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          height: isMobileView ? "8vh" : "11vh",
          zIndex: 9999,
          position: "fixed",
          width: "100%",
          top: 0,
          left: 0,
        }}
      >
        {/* 🔥 Mobile Navbar */}
        {isMobileView ? (
          <>
            {/* Hamburger Button */}
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
                  transform: menuOpen ? "translateY(-50%) rotate(45deg)" : "none",
                  transition: "0.4s",
                }}
              />
              <div
                style={{
                  width: "7vw",
                  height: "3px",
                  backgroundColor: "#fff",
                  borderRadius: "2px",
                  opacity: menuOpen ? 0 : 1,
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
                  transform: menuOpen ? "translateY(-50%) rotate(-45deg)" : "none",
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
            {/* 🔥 Desktop Navbar */}
            <Image
              src={logo}
              alt="Logo"
              style={{
                marginLeft: `${convertMultiplyVwToPx()}px`,
                marginRight: "20px",
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
                    ref={(el) => (navRefs.current[link] = el)}
                    className={`nav-link-custom ${selectedLink === link ? "active" : ""}`}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 100,
                      letterSpacing: 1.3,
                      fontSize: "1.5vw",
                      cursor: "pointer",
                      userSelect: "none",
                      transition: "all 0.25s ease-in-out",
                      paddingBottom: "10px",
                      position: "relative",
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

      {/* 🔥 Mobile Menu Dropdown */}
      {isMobileView && menuOpen && (
        <>
          <div
            style={{
              position: "fixed",
              top: "8vh",
              left: 0,
              width: "100%",
              backgroundColor: "#121212",
              padding: "2rem",
              display: "flex",
              flexDirection: "column",
              gap: "1.2rem",
              borderBottom: "1px solid #444",
              zIndex: 9998,
              boxShadow: "0 8px 20px rgba(0,0,0,0.5)",
              transition: "opacity 0.3s ease",
              opacity: menuOpen ? 1 : 0,
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

          {/* 🔥 Overlay */}
          <div
            onClick={() => setMenuOpen(false)}
            style={{
              position: "fixed",
              top: "8vh",
              left: 0,
              width: "100%",
              height: "100vh",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              backdropFilter: "blur(2px)",
              zIndex: 9997,
              opacity: menuOpen ? 1 : 0,
              transition: "opacity 0.3s ease",
            }}
          />
        </>
      )}
    </>
  );
};

export default AppNavbar;
