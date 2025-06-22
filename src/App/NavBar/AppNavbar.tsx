import React, { useEffect, useRef, useState } from "react";
import { Button, Image, Nav, Navbar } from "react-bootstrap";
import logo from "../../assets/icones/logo.svg";
import LiveAnimation from "../../pages/PrincipalPage/Animation/live_animation";
import GoogleSignInButton from "./GoogleSignInButton";
import { useTranslation } from "react-i18next";
import { useLenis } from "../../pages/Mateus/Context/LenisContext";
import { navbarStyles } from "./NavbarStyles";

interface AppNavbarProps {
  isMobileView: boolean;
  selectedLink: string;
  setSelectedLink: (link: string) => void;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  links: string[];
}

const AppNavbar: React.FC<AppNavbarProps> = ({
  isMobileView,
  selectedLink,
  setSelectedLink,
  menuOpen,
  setMenuOpen,
  links,
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

  // 🔥 Handle scroll hide/show (Desktop only)
  useEffect(() => {
    if (isMobileView) return;

    const handleScroll = () => {
      if (menuOpen) return;

      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 150) {
        setShowNavbar(false);
      } else {
        setShowNavbar(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [menuOpen, isMobileView]);

  // 🔥 Lock scroll when menu open (Mobile)
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [menuOpen]);

  // 🔥 Scroll to section
  const handleScrollTo = (link: string) => {
    const section = document.querySelector(`#${link.toLowerCase()}`);
    if (section instanceof HTMLElement && lenis) {
      lenis.scrollTo(section, {
        offset: -100,
        duration: 1.3,
        easing: (t: number) => t,
      });
    }
    setSelectedLink(link);
    setMenuOpen(false);
  };

  // 🔥 Underline animation
  useEffect(() => {
    const current = navRefs.current[selectedLink];
    const container = navContainerRef.current;
    if (current && container) {
      setUnderlineStyle({
        width: current.offsetWidth,
        left: current.offsetLeft,
        opacity: 1,
      });
    }
  }, [selectedLink]);

  return (
    <>
      <Navbar
        style={{
          ...navbarStyles.container,
          ...navbarStyles.borderGradient,
          transform: showNavbar ? "translateY(0)" : "translateY(-120%)",
          opacity: showNavbar ? 1 : 0,
          transition: "transform 0.4s ease, opacity 0.4s ease",
          height: isMobileView ? "8vh" : "11vh",
        }}
      >
        {isMobileView ? (
          <>
            {/* 🔥 Mobile */}
            <Button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                backgroundColor: "transparent",
                border: "none",
                marginLeft: "5vw",
                padding: "0",
                width: "7vw",
                height: "7vw",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                gap: menuOpen ? undefined : "8px",
                position: "relative",
                zIndex: 2,
              }}
            >
              {["rotate(45deg)", "", "rotate(-45deg)"].map((rotation, i) => (
                <div
                  key={i}
                  style={{
                    width: "7vw",
                    height: "3px",
                    backgroundColor: "#fff",
                    borderRadius: "2px",
                    position: menuOpen && i !== 1 ? "absolute" : "static",
                    top: menuOpen && i !== 1 ? "50%" : undefined,
                    transform:
                      menuOpen && i === 0
                        ? "translateY(-50%) rotate(45deg)"
                        : menuOpen && i === 2
                          ? "translateY(-50%) rotate(-45deg)"
                          : "none",
                    opacity: menuOpen && i === 1 ? 0 : 1,
                    transition: "0.4s",
                  }}
                />
              ))}
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
            {/* 🔥 Desktop */}
            <Image
              src={logo}
              alt="Logo"
              style={{
                marginLeft: `14vw`,
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
                marginTop: "1.5vh",
                position: "relative",
                display: "flex",
                alignItems: "center",
                marginLeft: "-4vw",
                gap: "3vw",
              }}
            >
              {links.map((link) => (
                <button
                  key={link}
                  onClick={() => handleScrollTo(link)}
                  style={{
                    all: "unset",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <Nav.Link
                    as="div"
                    ref={(el) => {
                      navRefs.current[link] = el;
                    }}
                    style={{
                      ...navbarStyles.navLink,
                      ...(selectedLink === link ? navbarStyles.navLinkActive : {}),
                    }}
                    onMouseEnter={(e) => {
                      if (selectedLink !== link) {
                        Object.assign(e.currentTarget.style, navbarStyles.navLinkHover);
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedLink !== link) {
                        Object.assign(e.currentTarget.style, navbarStyles.navLink);
                      } else {
                        Object.assign(e.currentTarget.style, navbarStyles.navLinkActive);
                      }
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
              <div style={{ ...navbarStyles.underline, ...underlineStyle }} />
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

      {/* 🔥 Mobile Dropdown Menu */}
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
            }}
          />
        </>
      )}
    </>
  );
};

export default AppNavbar;
