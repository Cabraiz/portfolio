import React, {
  type CSSProperties,
  useEffect,
  useRef,
  useState,
} from "react";
import { Image, Navbar } from "react-bootstrap";
import { useLenis } from "lenis/react";
import { useTranslation } from "react-i18next";

import logo from "../../assets/icones/logo.svg";
import LiveAnimation from "../../pages/PrincipalPage/Animation/live_animation";
import GoogleSignInButton from "./GoogleSignInButton";
import { navbarLayoutTokens, navbarStyles } from "./NavbarStyles";

interface AppNavbarProps {
  isMobileView: boolean;
  selectedLink: string;
  setSelectedLink: (link: string) => void;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  links: string[];
}

interface MobileMenuToggleButtonProps {
  menuOpen: boolean;
  onToggle: () => void;
}

interface BrandButtonProps {
  onClick: () => void;
  mobile?: boolean;
  compactDesktop?: boolean;
}

interface DesktopNavItemButtonProps {
  link: string;
  label: string;
  isActive: boolean;
  isCompactDesktop: boolean;
  onClick: () => void;
  navRef: (element: HTMLButtonElement | null) => void;
}

interface MobileNavItemButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

type LenisScrollEvent = Readonly<{
  scroll?: number;
  animatedScroll?: number;
  actualScroll?: number;
}>;

/**
 * Alinhado ao hero desktop:
 * o modo compacto agora depende da altura do viewport,
 * não mais só da largura.
 */
const DESKTOP_COMPACT_MIN_WIDTH = 961;
const DESKTOP_COMPACT_MAX_HEIGHT = 1080;

/**
 * Toggle de teste:
 * false = navbar sempre visível, sem esconder no scroll
 * true = comportamento atual de esconder/exibir no scroll
 */
const ENABLE_NAVBAR_HIDE_ON_SCROLL = false;

const MOBILE_NAV_HEIGHT = navbarLayoutTokens.heights.mobile;
const DESKTOP_NAV_HEIGHT = navbarLayoutTokens.heights.desktop;

function getInitialViewportWidth(): number {
  if (!("innerWidth" in globalThis)) {
    return 1440;
  }

  return globalThis.innerWidth;
}

function getInitialViewportHeight(): number {
  if (!("innerHeight" in globalThis)) {
    return 900;
  }

  return globalThis.innerHeight;
}

function getUnderlineHiddenStyle(): CSSProperties {
  return {
    width: 0,
    left: 0,
    opacity: 0,
  };
}

function getNavbarHeight(isMobileView: boolean): number {
  return isMobileView ? MOBILE_NAV_HEIGHT : DESKTOP_NAV_HEIGHT;
}

function getIsCompactDesktopViewport(
  isMobileView: boolean,
  viewportWidth: number,
  viewportHeight: number,
): boolean {
  if (isMobileView) {
    return false;
  }

  if (viewportWidth < DESKTOP_COMPACT_MIN_WIDTH) {
    return false;
  }

  return viewportHeight <= DESKTOP_COMPACT_MAX_HEIGHT;
}

function getDesktopNavGap(isCompactDesktop: boolean): string {
  return isCompactDesktop
    ? navbarLayoutTokens.desktop.navGap.compact
    : navbarLayoutTokens.desktop.navGap.default;
}

function getDesktopSideColumnWidth(isCompactDesktop: boolean): string {
  return isCompactDesktop
    ? navbarLayoutTokens.desktop.sideColumnWidth.compact
    : navbarLayoutTokens.desktop.sideColumnWidth.default;
}

function getDesktopGoogleButtonWidth(isCompactDesktop: boolean): string {
  return getDesktopSideColumnWidth(isCompactDesktop);
}

function getLiveAnimationLeft(isCompactDesktop: boolean): string {
  return isCompactDesktop
    ? navbarLayoutTokens.desktop.liveAnimationLeft.compact
    : navbarLayoutTokens.desktop.liveAnimationLeft.default;
}

function getDesktopLogoSize(isCompactDesktop: boolean): string {
  return isCompactDesktop
    ? navbarLayoutTokens.desktop.logoSize.compact
    : navbarLayoutTokens.desktop.logoSize.default;
}

function getDesktopLogoGap(isCompactDesktop: boolean): string {
  return isCompactDesktop
    ? navbarLayoutTokens.desktop.logoGap.compact
    : navbarLayoutTokens.desktop.logoGap.default;
}

function getBurgerLineStyle(index: number, menuOpen: boolean): CSSProperties {
  let top = "21px";
  let transform = "none";
  let opacity = 1;

  if (index === 0) {
    top = menuOpen ? "21px" : "14px";

    if (menuOpen) {
      transform = "rotate(45deg)";
    }
  }

  if (index === 1) {
    top = "21px";

    if (menuOpen) {
      transform = "scaleX(0)";
      opacity = 0;
    }
  }

  if (index === 2) {
    top = menuOpen ? "21px" : "28px";

    if (menuOpen) {
      transform = "rotate(-45deg)";
    }
  }

  return {
    position: "absolute",
    width: "22px",
    height: "2px",
    borderRadius: "999px",
    backgroundColor: "#ffffff",
    transition: "transform 0.3s ease, opacity 0.25s ease, top 0.3s ease",
    top,
    transform,
    opacity,
  };
}

function applyDesktopNavStyle(
  element: HTMLButtonElement,
  isActive: boolean,
  hover: boolean,
): void {
  Object.assign(element.style, navbarStyles.navLink);

  if (isActive) {
    Object.assign(element.style, navbarStyles.navLinkActive);
    return;
  }

  if (hover) {
    Object.assign(element.style, navbarStyles.navLinkHover);
    return;
  }
}

function getScrollValue(event?: LenisScrollEvent): number {
  if (!event) {
    return 0;
  }

  if (typeof event.animatedScroll === "number") {
    return event.animatedScroll;
  }

  if (typeof event.actualScroll === "number") {
    return event.actualScroll;
  }

  if (typeof event.scroll === "number") {
    return event.scroll;
  }

  return 0;
}

const MobileMenuToggleButton: React.FC<MobileMenuToggleButtonProps> = ({
  menuOpen,
  onToggle,
}) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
      aria-expanded={menuOpen}
      aria-controls="primary-navigation-mobile"
      style={{
        width: "44px",
        height: "44px",
        padding: 0,
        border: "none",
        background: "transparent",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        cursor: "pointer",
        borderRadius: "12px",
      }}
    >
      {[0, 1, 2].map((index) => (
        <span key={index} style={getBurgerLineStyle(index, menuOpen)} />
      ))}
    </button>
  );
};

const BrandButton: React.FC<BrandButtonProps> = ({
  onClick,
  mobile = false,
  compactDesktop = false,
}) => {
  if (mobile) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label="Ir para o topo"
        style={{
          flex: "1 1 auto",
          minWidth: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: navbarLayoutTokens.mobile.brandGap,
          background: "transparent",
          border: "none",
          padding: 0,
          cursor: "pointer",
          transform: `translateX(${navbarLayoutTokens.mobile.logoOffsetX})`,
        }}
      >
        <Image
          src={logo}
          alt="Logo"
          style={{
            borderRadius: "16px",
            width: navbarLayoutTokens.mobile.logoSize,
            height: navbarLayoutTokens.mobile.logoSize,
            objectFit: "cover",
            flex: "0 0 auto",
          }}
        />
        <span
          style={{
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontSize: "1.05rem",
            fontWeight: 700,
            letterSpacing: "0.01em",
            color: "#ffffff",
          }}
        >
          Cabraiz
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Ir para o topo"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: getDesktopLogoGap(compactDesktop),
        background: "transparent",
        border: "none",
        padding: 0,
        cursor: "pointer",
      }}
    >
      <Image
        src={logo}
        alt="Logo"
        style={{
          borderRadius: "18px",
          width: getDesktopLogoSize(compactDesktop),
          height: getDesktopLogoSize(compactDesktop),
          objectFit: "cover",
          flex: "0 0 auto",
        }}
      />
    </button>
  );
};

const DesktopNavItemButton: React.FC<DesktopNavItemButtonProps> = ({
  link,
  label,
  isActive,
  isCompactDesktop,
  onClick,
  navRef,
}) => {
  const handleMouseEnter = (event: React.MouseEvent<HTMLButtonElement>) => {
    applyDesktopNavStyle(event.currentTarget, isActive, true);
  };

  const handleMouseLeave = (event: React.MouseEvent<HTMLButtonElement>) => {
    applyDesktopNavStyle(event.currentTarget, isActive, false);
  };

  return (
    <button
      type="button"
      ref={navRef}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        all: "unset",
        ...navbarStyles.navLink,
        ...(isActive ? navbarStyles.navLinkActive : {}),
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        cursor: "pointer",
        whiteSpace: "nowrap",
        flex: "0 0 auto",
        minWidth: 0,
      }}
    >
      <span
        style={{
          position: "relative",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {link === "live" && (
          <span
            style={{
              position: "absolute",
              left: getLiveAnimationLeft(isCompactDesktop),
              top: "50%",
              transform: "translateY(calc(-50% - 15px)) scale(0.42)",
              pointerEvents: "none",
            }}
          >
            <LiveAnimation />
          </span>
        )}
        <span>{label}</span>
      </span>
    </button>
  );
};

const MobileNavItemButton: React.FC<MobileNavItemButtonProps> = ({
  label,
  isActive,
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        width: "100%",
        minHeight: "48px",
        padding: "0 14px",
        borderRadius: "14px",
        border: isActive
          ? "1px solid rgba(255,255,255,0.18)"
          : "1px solid transparent",
        background: isActive ? "rgba(255, 255, 255, 0.08)" : "transparent",
        color: "#ffffff",
        textDecoration: "none",
        fontSize: "1rem",
        fontWeight: 600,
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      {label}
    </button>
  );
};

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
  const [viewportWidth, setViewportWidth] = useState<number>(
    getInitialViewportWidth,
  );
  const [viewportHeight, setViewportHeight] = useState<number>(
    getInitialViewportHeight,
  );

  const lastScrollY = useRef(0);
  const navRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const navContainerRef = useRef<HTMLDivElement | null>(null);

  const [underlineStyle, setUnderlineStyle] = useState<CSSProperties>(
    getUnderlineHiddenStyle(),
  );

  const isCompactDesktop = getIsCompactDesktopViewport(
    isMobileView,
    viewportWidth,
    viewportHeight,
  );

  const navbarHeight = getNavbarHeight(isMobileView);

  const desktopGoogleButtonWidth = getDesktopGoogleButtonWidth(
    isCompactDesktop,
  );
  const desktopSideColumnWidth = getDesktopSideColumnWidth(isCompactDesktop);

  useEffect(() => {
    if (!("addEventListener" in globalThis)) {
      return;
    }

    const handleResize = () => {
      setViewportWidth(getInitialViewportWidth());
      setViewportHeight(getInitialViewportHeight());
    };

    handleResize();
    globalThis.addEventListener("resize", handleResize);

    return () => globalThis.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!ENABLE_NAVBAR_HIDE_ON_SCROLL) {
      setShowNavbar(true);
      lastScrollY.current = 0;
      return;
    }

    if (isMobileView) {
      setShowNavbar(true);
      return;
    }

    if (menuOpen) {
      setShowNavbar(true);
      return;
    }

    if (lenis) {
      const handleLenisScroll = (event: LenisScrollEvent) => {
        const currentScrollY = getScrollValue(event);
        const isScrollingDown = currentScrollY > lastScrollY.current;

        if (isScrollingDown && currentScrollY > 150) {
          setShowNavbar(false);
        } else {
          setShowNavbar(true);
        }

        lastScrollY.current = currentScrollY;
      };

      lenis.on("scroll", handleLenisScroll);

      return () => {
        lenis.off("scroll", handleLenisScroll);
      };
    }

    if (!("addEventListener" in globalThis)) {
      return;
    }

    const handleWindowScroll = () => {
      const currentScrollY = "scrollY" in globalThis ? globalThis.scrollY : 0;
      const isScrollingDown = currentScrollY > lastScrollY.current;

      if (isScrollingDown && currentScrollY > 150) {
        setShowNavbar(false);
      } else {
        setShowNavbar(true);
      }

      lastScrollY.current = currentScrollY;
    };

    globalThis.addEventListener("scroll", handleWindowScroll, {
      passive: true,
    });

    return () => {
      globalThis.removeEventListener("scroll", handleWindowScroll);
    };
  }, [isMobileView, lenis, menuOpen]);

  useEffect(() => {
    if (!("document" in globalThis)) {
      return;
    }

    const root = globalThis.document.documentElement;
    const body = globalThis.document.body;

    if (!isMobileView) {
      root.style.removeProperty("overflow");
      body.style.removeProperty("overflow");
      return;
    }

    if (menuOpen) {
      root.style.overflow = "hidden";
      body.style.overflow = "hidden";
    } else {
      root.style.removeProperty("overflow");
      body.style.removeProperty("overflow");
    }

    return () => {
      root.style.removeProperty("overflow");
      body.style.removeProperty("overflow");
    };
  }, [isMobileView, menuOpen]);

  useEffect(() => {
    if (isMobileView) {
      setUnderlineStyle(getUnderlineHiddenStyle());
      return;
    }

    const current = navRefs.current[selectedLink];
    const container = navContainerRef.current;

    if (!current || !container) {
      return;
    }

    setUnderlineStyle({
      width: current.offsetWidth,
      left: current.offsetLeft,
      opacity: 1,
    });
  }, [
    selectedLink,
    viewportWidth,
    viewportHeight,
    isMobileView,
    isCompactDesktop,
    links.length,
  ]);

  const handleScrollTo = (link: string) => {
    if (typeof document === "undefined") {
      return;
    }

    const exactSection = document.getElementById(link);
    const loweredSection = document.getElementById(link.toLowerCase());

    const section =
      exactSection instanceof HTMLElement
        ? exactSection
        : loweredSection instanceof HTMLElement
          ? loweredSection
          : null;

    if (section) {
      const offset = isMobileView
        ? -(MOBILE_NAV_HEIGHT + 16)
        : -(navbarHeight + 18);

      if (lenis) {
        lenis.scrollTo(section, {
          offset,
          duration: 1.05,
          easing: (value: number) => 1 - Math.pow(1 - value, 3),
        });
      } else {
        section.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }

    setSelectedLink(link);
    setMenuOpen(false);
  };

  const handleBrandClick = () => {
    if (lenis) {
      lenis.scrollTo(0, {
        duration: 1,
        easing: (value: number) => 1 - Math.pow(1 - value, 3),
      });
    } else if ("scrollTo" in globalThis) {
      globalThis.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }

    if (links.length > 0) {
      setSelectedLink(links[0]);
    }

    setMenuOpen(false);
  };

  const handleMobileMenuToggle = () => {
    setMenuOpen(!menuOpen);
  };

  const desktopNavigation = (
    <>
      <div
        style={{
          flex: "0 0 auto",
          width: desktopSideColumnWidth,
          minWidth: desktopSideColumnWidth,
          maxWidth: desktopSideColumnWidth,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          paddingLeft: navbarLayoutTokens.desktop.logoOffsetX,
        }}
      >
        <BrandButton
          onClick={handleBrandClick}
          compactDesktop={isCompactDesktop}
        />
      </div>

      <div
        style={{
          flex: "1 1 auto",
          minWidth: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "visible",
        }}
      >
        <div
          ref={navContainerRef}
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: getDesktopNavGap(isCompactDesktop),
            minWidth: 0,
            maxWidth: "100%",
            padding: `0 ${navbarLayoutTokens.desktop.navContainerPaddingX} ${navbarLayoutTokens.desktop.navContainerPaddingBottom}`,
            marginTop: navbarLayoutTokens.desktop.navOffsetY,
          }}
        >
          {links.map((link) => (
            <DesktopNavItemButton
              key={link}
              link={link}
              label={t(`nav.${link}`)}
              isActive={selectedLink === link}
              isCompactDesktop={isCompactDesktop}
              onClick={() => handleScrollTo(link)}
              navRef={(element) => {
                navRefs.current[link] = element;
              }}
            />
          ))}

          <div style={{ ...navbarStyles.underline, ...underlineStyle }} />
        </div>
      </div>

      <div
        style={{
          flex: "0 0 auto",
          width: desktopGoogleButtonWidth,
          minWidth: desktopGoogleButtonWidth,
          maxWidth: desktopGoogleButtonWidth,
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
        }}
      >
        <GoogleSignInButton compact={isCompactDesktop} fullWidth />
      </div>
    </>
  );

  const mobileNavigation = (
    <>
      <div
        style={{
          width: "44px",
          minWidth: "44px",
          display: "flex",
          justifyContent: "flex-start",
        }}
      >
        <MobileMenuToggleButton
          menuOpen={menuOpen}
          onToggle={handleMobileMenuToggle}
        />
      </div>

      <BrandButton onClick={handleBrandClick} mobile />

      <div style={{ width: "44px", minWidth: "44px" }} />
    </>
  );

  return (
    <>
      <Navbar
        style={{
          ...navbarStyles.container,
          ...navbarStyles.borderGradient,
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          height: `${navbarHeight}px`,
          padding: isMobileView
            ? `0 ${navbarLayoutTokens.container.mobilePaddingX}`
            : `0 ${navbarLayoutTokens.container.desktopPaddingX}`,
          transform: ENABLE_NAVBAR_HIDE_ON_SCROLL
            ? showNavbar
              ? "translateY(0)"
              : "translateY(-120%)"
            : "translateY(0)",
          opacity: ENABLE_NAVBAR_HIDE_ON_SCROLL ? (showNavbar ? 1 : 0) : 1,
          transition: ENABLE_NAVBAR_HIDE_ON_SCROLL
            ? "transform 0.35s ease, opacity 0.35s ease, height 0.25s ease"
            : "height 0.25s ease",
          backdropFilter: "blur(14px)",
        }}
      >
        <div
          style={{
            width: `min(${navbarLayoutTokens.container.maxWidth}, 100%)`,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: isMobileView
              ? navbarLayoutTokens.container.mobileGap
              : navbarLayoutTokens.container.desktopGap,
            minWidth: 0,
          }}
        >
          {isMobileView ? mobileNavigation : desktopNavigation}
        </div>
      </Navbar>

      {isMobileView && menuOpen && (
        <>
          <nav
            id="primary-navigation-mobile"
            aria-label="Navegação principal mobile"
            style={{
              position: "fixed",
              top: `${MOBILE_NAV_HEIGHT + navbarLayoutTokens.mobile.menuTopOffset}px`,
              left: "50%",
              transform: "translateX(-50%)",
              width: "min(560px, calc(100% - 16px))",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "22px",
              background:
                "linear-gradient(180deg, rgba(20, 20, 24, 0.98), rgba(13, 14, 17, 0.98))",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.42)",
              backdropFilter: "blur(14px)",
              zIndex: 9998,
            }}
          >
            {links.map((link) => (
              <MobileNavItemButton
                key={link}
                label={t(`nav.${link}`)}
                isActive={selectedLink === link}
                onClick={() => handleScrollTo(link)}
              />
            ))}

            <div style={{ paddingTop: "6px", width: "100%" }}>
              <GoogleSignInButton compact fullWidth />
            </div>
          </nav>

          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setMenuOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              top: `${MOBILE_NAV_HEIGHT}px`,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              backdropFilter: "blur(3px)",
              zIndex: 9997,
              border: "none",
              padding: 0,
              cursor: "pointer",
            }}
          />
        </>
      )}
    </>
  );
};

export default AppNavbar;
