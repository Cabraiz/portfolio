import { useCallback } from "react";
import { Navbar } from "react-bootstrap";
import { useLenis } from "lenis/react";
import { useTranslation } from "react-i18next";

import logo from "../../assets/icones/logo.svg";
import LiveAnimation from "../../pages/PrincipalPage/Animation/live_animation";
import type { LandingSectionId } from "../../features/navigation/landingSections";
import {
  NAVBAR_DEFAULT_BRAND_LABEL,
  NAVBAR_DESKTOP_COMPACT_MAX_HEIGHT,
  NAVBAR_DESKTOP_COMPACT_MIN_WIDTH,
  NAVBAR_HIDE_ON_SCROLL_ENABLED,
  NAVBAR_HIDE_ON_SCROLL_THRESHOLD,
  NAVBAR_MOBILE_MENU_ID,
} from "./navbar.constants";
import { navbarLayoutTokens, navbarStyles } from "./NavbarStyles";
import DesktopNavbar from "./components/DesktopNavbar";
import MobileMenuPanel from "./components/MobileMenuPanel";
import MobileNavbar from "./components/MobileNavbar";
import useNavbarBodyScrollLock from "./hooks/useNavbarBodyScrollLock";
import useNavbarNavigation from "./hooks/useNavbarNavigation";
import useNavbarScrollBehavior from "./hooks/useNavbarScrollBehavior";
import useNavbarUnderline from "./hooks/useNavbarUnderline";
import useNavbarViewport from "./hooks/useNavbarViewport";

export type AppNavbarProps = Readonly<{
  isMobileView: boolean;
  selectedLink: string;
  setSelectedLink: (link: string) => void;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  links: ReadonlyArray<LandingSectionId>;
}>;

function getNavbarTransform(enabled: boolean, showNavbar: boolean): string {
  if (!enabled) {
    return "translateY(0)";
  }

  return showNavbar ? "translateY(0)" : "translateY(-120%)";
}

function getNavbarOpacity(enabled: boolean, showNavbar: boolean): number {
  if (!enabled) {
    return 1;
  }

  return showNavbar ? 1 : 0;
}

function getNavbarTransition(enabled: boolean): string {
  if (!enabled) {
    return "height 0.25s ease";
  }

  return "transform 0.35s ease, opacity 0.35s ease, height 0.25s ease";
}

function getNavbarPadding(isMobileView: boolean): string {
  if (isMobileView) {
    return `0 ${navbarLayoutTokens.container.mobilePaddingX}`;
  }

  return `0 ${navbarLayoutTokens.container.desktopPaddingX}`;
}

function getNavbarGap(isMobileView: boolean): string {
  if (isMobileView) {
    return navbarLayoutTokens.container.mobileGap;
  }

  return navbarLayoutTokens.container.desktopGap;
}

function getLiveAnimationLeft(isCompactDesktop: boolean): string {
  return isCompactDesktop
    ? navbarLayoutTokens.desktop.liveAnimationLeft.compact
    : navbarLayoutTokens.desktop.liveAnimationLeft.default;
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
  }
}

export default function AppNavbar(props: AppNavbarProps) {
  const { isMobileView, selectedLink, menuOpen, setMenuOpen, links } = props;

  const { t } = useTranslation();
  const lenis = useLenis();

  const {
    viewportWidth,
    viewportHeight,
    isCompactDesktop,
    navbarHeight,
    desktopGoogleButtonWidth,
    desktopSideColumnWidth,
  } = useNavbarViewport({
    isMobileView,
    desktopCompactMinWidth: NAVBAR_DESKTOP_COMPACT_MIN_WIDTH,
    desktopCompactMaxHeight: NAVBAR_DESKTOP_COMPACT_MAX_HEIGHT,
  });

  const { showNavbar } = useNavbarScrollBehavior({
    isMobileView,
    menuOpen,
    lenis,
    enabled: NAVBAR_HIDE_ON_SCROLL_ENABLED,
    hideThreshold: NAVBAR_HIDE_ON_SCROLL_THRESHOLD,
  });

  useNavbarBodyScrollLock({
    isMobileView,
    menuOpen,
  });

  const { navContainerRef, underlineStyle, setNavRef } = useNavbarUnderline({
    selectedLink,
    isMobileView,
    viewportWidth,
    viewportHeight,
    isCompactDesktop,
    linksCount: links.length,
  });

  const { handleNavigateToSection, handleBrandClick } = useNavbarNavigation({
    isMobileView,
    navbarHeight,
    lenis,
    setMenuOpen,
  });

  const handleMobileMenuToggle = useCallback(() => {
    setMenuOpen(!menuOpen);
  }, [menuOpen, setMenuOpen]);

  return (
    <>
      <Navbar
        style={{
          ...navbarStyles.container,
          ...navbarStyles.borderGradient,
          height: `${navbarHeight}px`,
          padding: getNavbarPadding(isMobileView),
          transform: getNavbarTransform(
            NAVBAR_HIDE_ON_SCROLL_ENABLED,
            showNavbar,
          ),
          opacity: getNavbarOpacity(
            NAVBAR_HIDE_ON_SCROLL_ENABLED,
            showNavbar,
          ),
          transition: getNavbarTransition(NAVBAR_HIDE_ON_SCROLL_ENABLED),
        }}
      >
        <div
          style={{
            width: `min(${navbarLayoutTokens.container.maxWidth}, 100%)`,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: getNavbarGap(isMobileView),
            minWidth: 0,
          }}
        >
          {isMobileView ? (
            <MobileNavbar
              menuOpen={menuOpen}
              onToggleMenu={handleMobileMenuToggle}
              onBrandClick={handleBrandClick}
              logoSrc={logo}
              brandLabel={NAVBAR_DEFAULT_BRAND_LABEL}
            />
          ) : (
            <DesktopNavbar
              links={links}
              selectedLink={selectedLink}
              isCompactDesktop={isCompactDesktop}
              desktopSideColumnWidth={desktopSideColumnWidth}
              desktopGoogleButtonWidth={desktopGoogleButtonWidth}
              underlineStyle={underlineStyle}
              navContainerRef={navContainerRef}
              onBrandClick={handleBrandClick}
              onNavigate={handleNavigateToSection}
              setNavRef={setNavRef}
              getLabel={(link) => t(`nav.${link}`)}
              logoSrc={logo}
              renderLeadingVisual={(link, compactDesktop) => {
                if (link !== "live") {
                  return null;
                }

                return (
                  <span
                    style={{
                      position: "absolute",
                      left: getLiveAnimationLeft(compactDesktop),
                      top: "50%",
                      transform: "translateY(calc(-50% - 16px)) scale(0.42)",
                      pointerEvents: "none",
                    }}
                  >
                    <LiveAnimation />
                  </span>
                );
              }}
              onItemHoverStart={(link, element) => {
                applyDesktopNavStyle(element, selectedLink === link, true);
              }}
              onItemHoverEnd={(link, element) => {
                applyDesktopNavStyle(element, selectedLink === link, false);
              }}
            />
          )}
        </div>
      </Navbar>

      <MobileMenuPanel
        open={isMobileView && menuOpen}
        links={links}
        selectedLink={selectedLink}
        panelTop={navbarHeight + navbarLayoutTokens.mobile.menuTopOffset}
        overlayTop={navbarHeight}
        getLabel={(link) => t(`nav.${link}`)}
        onNavigate={handleNavigateToSection}
        onClose={() => setMenuOpen(false)}
        menuId={NAVBAR_MOBILE_MENU_ID}
      />
    </>
  );
}
