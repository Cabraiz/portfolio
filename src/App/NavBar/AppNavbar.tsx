import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { Navbar } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import logo from "../../assets/icones/logo.svg";
import LiveAnimation from "../../pages/PrincipalPage/Animation/live_animation";
import type { LandingSectionId } from "../../features/navigation/landingSections";
import DesktopNavbar from "./components/DesktopNavbar";
import MobileNavbar from "./components/MobileNavbar";
import useNavbarBodyScrollLock from "./hooks/useNavbarBodyScrollLock";
import useNavbarUnderline from "./hooks/useNavbarUnderline";
import {
  NAVBAR_DEFAULT_HOME_SECTION,
  NAVBAR_DEFAULT_VIEWPORT_HEIGHT,
  NAVBAR_DEFAULT_VIEWPORT_WIDTH,
  NAVBAR_DESKTOP_COMPACT_BREAKPOINT,
  NAVBAR_HEIGHT_CSS_VAR,
  getNavbarGap,
  getNavbarHeight,
  getNavbarLiveAnimationLeft,
  getNavbarMaxWidth,
  getNavbarPadding,
} from "./navbar.constants";

export type AppNavbarProps = Readonly<{
  isMobileView: boolean;
  activeSectionId: LandingSectionId | "";
  onNavigateToSection: (sectionId: LandingSectionId) => void;
  items: ReadonlyArray<LandingSectionId>;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
}>;

type ViewportState = Readonly<{
  width: number;
  height: number;
}>;

const desktopNavbarRootStyle: CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  zIndex: 1000,
  borderBottom: "1px solid rgba(255, 255, 255, 0.10)",
  background:
    "linear-gradient(180deg, rgba(18, 18, 22, 0.86) 0%, rgba(12, 12, 16, 0.74) 100%)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  boxShadow: "0 12px 32px rgba(0, 0, 0, 0.18)",
};

const mobileNavbarRootStyle: CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  zIndex: 1000,
  borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
  background:
    "linear-gradient(180deg, rgba(10, 10, 14, 0.96) 0%, rgba(8, 8, 12, 0.92) 100%)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  boxShadow: "0 8px 22px rgba(0, 0, 0, 0.16)",
};

function getBrowserWindow(): Window | null {
  if (typeof globalThis.window === "undefined") {
    return null;
  }

  return globalThis.window;
}

function getViewportState(): ViewportState {
  const browserWindow = getBrowserWindow();

  if (!browserWindow) {
    return {
      width: NAVBAR_DEFAULT_VIEWPORT_WIDTH,
      height: NAVBAR_DEFAULT_VIEWPORT_HEIGHT,
    };
  }

  return {
    width: browserWindow.innerWidth,
    height: browserWindow.innerHeight,
  };
}

export default function AppNavbar({
  isMobileView,
  activeSectionId,
  onNavigateToSection,
  items,
  menuOpen,
  setMenuOpen,
}: AppNavbarProps) {
  const { t } = useTranslation();

  const [viewport, setViewport] = useState<ViewportState>(() =>
    getViewportState(),
  );

  const navbarHeight = getNavbarHeight(isMobileView);
  const isCompactDesktop =
    !isMobileView && viewport.width <= NAVBAR_DESKTOP_COMPACT_BREAKPOINT;

  useNavbarBodyScrollLock({
    isMobileView,
    menuOpen,
  });

  const { navContainerRef, underlineStyle, setNavRef } = useNavbarUnderline({
    selectedLink: activeSectionId,
    isMobileView,
    viewportWidth: viewport.width,
    viewportHeight: viewport.height,
    isCompactDesktop,
    linksCount: items.length,
  });

  useEffect(() => {
    const browserWindow = getBrowserWindow();

    if (!browserWindow) {
      return;
    }

    let frame = 0;

    const handleResize = () => {
      browserWindow.cancelAnimationFrame(frame);

      frame = browserWindow.requestAnimationFrame(() => {
        setViewport(getViewportState());
      });
    };

    handleResize();

    browserWindow.addEventListener("resize", handleResize, { passive: true });
    browserWindow.addEventListener("orientationchange", handleResize, {
      passive: true,
    });

    return () => {
      browserWindow.cancelAnimationFrame(frame);
      browserWindow.removeEventListener("resize", handleResize);
      browserWindow.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  useEffect(() => {
    const root = globalThis.document?.documentElement;

    if (!root) {
      return;
    }

    root.style.setProperty(NAVBAR_HEIGHT_CSS_VAR, `${navbarHeight}px`);

    return () => {
      root.style.removeProperty(NAVBAR_HEIGHT_CSS_VAR);
    };
  }, [navbarHeight]);

  const handleBrandClick = useCallback(() => {
    onNavigateToSection(NAVBAR_DEFAULT_HOME_SECTION);
    setMenuOpen(false);
  }, [onNavigateToSection, setMenuOpen]);

  const handleNavigate = useCallback(
    (sectionId: LandingSectionId) => {
      onNavigateToSection(sectionId);
      setMenuOpen(false);
    },
    [onNavigateToSection, setMenuOpen],
  );

  const handleMobileMenuToggle = useCallback(() => {
    setMenuOpen(!menuOpen);
  }, [menuOpen, setMenuOpen]);

  const containerStyle = useMemo<CSSProperties>(
    () => ({
      width: getNavbarMaxWidth(),
      margin: "0 auto",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: getNavbarGap(isMobileView),
      minWidth: 0,
      paddingInline: isMobileView ? "clamp(14px, 4vw, 18px)" : 0,
      boxSizing: "border-box",
    }),
    [isMobileView],
  );

  const resolvedNavbarRootStyle = useMemo<CSSProperties>(() => {
    return isMobileView ? mobileNavbarRootStyle : desktopNavbarRootStyle;
  }, [isMobileView]);

  const resolvedNavbarStyle = useMemo<CSSProperties>(
    () => ({
      ...resolvedNavbarRootStyle,
      height: `${navbarHeight}px`,
      padding: getNavbarPadding(isMobileView),
    }),
    [isMobileView, navbarHeight, resolvedNavbarRootStyle],
  );

  return (
    <Navbar style={resolvedNavbarStyle}>
      <div style={containerStyle}>
        {isMobileView ? (
          <MobileNavbar
            isOpen={menuOpen}
            onToggle={handleMobileMenuToggle}
            onNavigateToSection={handleNavigate}
            activeSectionId={activeSectionId}
          />
        ) : (
          <DesktopNavbar
            items={items}
            activeSectionId={activeSectionId}
            isCompactDesktop={isCompactDesktop}
            underlineStyle={underlineStyle}
            navContainerRef={navContainerRef}
            onBrandClick={handleBrandClick}
            onNavigateToSection={handleNavigate}
            setNavRef={setNavRef}
            getLabel={(sectionId) => t(`nav.${sectionId}`)}
            logoSrc={logo}
            renderLeadingVisual={(sectionId) => {
              if (sectionId !== "live") {
                return null;
              }

              return (
                <span
                  style={{
                    position: "absolute",
                    left: getNavbarLiveAnimationLeft(isCompactDesktop),
                    top: "50%",
                    transform: "translateY(calc(-50% - 13px)) scale(0.42)",
                    pointerEvents: "none",
                  }}
                >
                  <LiveAnimation />
                </span>
              );
            }}
          />
        )}
      </div>
    </Navbar>
  );
}
