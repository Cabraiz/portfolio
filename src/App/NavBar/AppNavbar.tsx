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
import {
  DEFAULT_LANDING_SECTION_ID,
  type LandingSectionId,
} from "../../features/navigation/landingSections";
import DesktopNavbar from "./components/DesktopNavbar";
import MobileNavbar from "./components/MobileNavbar";
import useNavbarBodyScrollLock from "./hooks/useNavbarBodyScrollLock";
import useNavbarUnderline from "./hooks/useNavbarUnderline";

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

const NAVBAR_HEIGHT_MOBILE = 72;
const NAVBAR_HEIGHT_DESKTOP = 82;
const DESKTOP_COMPACT_BREAKPOINT = 1360;

const navbarRootStyle: CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  zIndex: 1000,
  borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
  background:
    "linear-gradient(180deg, rgba(10, 10, 12, 0.95) 0%, rgba(12, 12, 16, 0.88) 100%)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  boxShadow: "0 12px 32px rgba(0, 0, 0, 0.28)",
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
      width: 1440,
      height: 900,
    };
  }

  return {
    width: browserWindow.innerWidth,
    height: browserWindow.innerHeight,
  };
}

function getNavbarHeight(isMobileView: boolean): number {
  return isMobileView ? NAVBAR_HEIGHT_MOBILE : NAVBAR_HEIGHT_DESKTOP;
}

function getNavbarPadding(isMobileView: boolean): string {
  return isMobileView
    ? "0 clamp(14px, 4vw, 18px)"
    : "0 clamp(20px, 3.2vw, 40px)";
}

function getNavbarGap(isMobileView: boolean): string {
  return isMobileView ? "12px" : "20px";
}

function getNavbarMaxWidth(): string {
  return "min(1480px, 100%)";
}

function getLiveAnimationLeft(isCompactDesktop: boolean): string {
  return isCompactDesktop ? "-26px" : "-30px";
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
    !isMobileView && viewport.width <= DESKTOP_COMPACT_BREAKPOINT;

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

  const handleBrandClick = useCallback(() => {
    onNavigateToSection(DEFAULT_LANDING_SECTION_ID);
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
    }),
    [isMobileView],
  );

  return (
    <Navbar
      style={{
        ...navbarRootStyle,
        height: `${navbarHeight}px`,
        padding: getNavbarPadding(isMobileView),
      }}
    >
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
                    left: getLiveAnimationLeft(isCompactDesktop),
                    top: "50%",
                    transform: "translateY(calc(-50% - 16px)) scale(0.42)",
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
