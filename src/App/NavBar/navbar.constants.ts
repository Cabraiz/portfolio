import type { LandingSectionId } from "../../features/navigation/landingSections";

export const NAVBAR_DEFAULT_HOME_SECTION: LandingSectionId = "home";

export const NAVBAR_DEFAULT_BRAND_LABEL = "Cabraiz";
export const NAVBAR_DEFAULT_LOGO_ALT = "Logo";

export const NAVBAR_MOBILE_MENU_ID = "primary-navigation-mobile";

export const NAVBAR_HEIGHT_MOBILE = 72;
export const NAVBAR_HEIGHT_DESKTOP = 70;
export const NAVBAR_HEIGHT_CSS_VAR = "--app-navbar-height";

export const NAVBAR_DESKTOP_COMPACT_MIN_WIDTH = 961;
export const NAVBAR_DESKTOP_COMPACT_MAX_HEIGHT = 1080;
export const NAVBAR_DESKTOP_COMPACT_BREAKPOINT = 1360;

export const NAVBAR_HIDE_ON_SCROLL_ENABLED = false;
export const NAVBAR_HIDE_ON_SCROLL_THRESHOLD = 150;

export const NAVBAR_DEFAULT_MOBILE_SCROLL_OFFSET = 16;
export const NAVBAR_DEFAULT_DESKTOP_SCROLL_OFFSET = 18;

export const NAVBAR_DEFAULT_LOCK_OVERFLOW_VALUE = "hidden";

export const NAVBAR_MOBILE_MENU_PANEL_Z_INDEX = 9998;
export const NAVBAR_MOBILE_MENU_OVERLAY_Z_INDEX = 9997;

export const NAVBAR_DEFAULT_VIEWPORT_WIDTH = 1440;
export const NAVBAR_DEFAULT_VIEWPORT_HEIGHT = 900;

export const NAVBAR_UNDERLINE_HIDDEN_WIDTH = 0;
export const NAVBAR_UNDERLINE_HIDDEN_LEFT = 0;
export const NAVBAR_UNDERLINE_HIDDEN_OPACITY = 0;

export const NAVBAR_SCROLL_ANIMATION_DURATION = 1;
export const NAVBAR_SECTION_SCROLL_ANIMATION_DURATION = 1.05;

export const NAVBAR_DEFAULT_MOBILE_PADDING = "0 clamp(14px, 4vw, 18px)";
export const NAVBAR_DEFAULT_DESKTOP_PADDING = "0 clamp(20px, 3.2vw, 40px)";

export const NAVBAR_DEFAULT_MOBILE_GAP = "12px";
export const NAVBAR_DEFAULT_DESKTOP_GAP = "20px";

export const NAVBAR_DEFAULT_CONTAINER_MAX_WIDTH = "min(1480px, 100%)";

export const NAVBAR_LIVE_ANIMATION_LEFT_DEFAULT = "-30px";
export const NAVBAR_LIVE_ANIMATION_LEFT_COMPACT = "-26px";

export function getNavbarHeight(isMobileView: boolean): number {
  return isMobileView ? NAVBAR_HEIGHT_MOBILE : NAVBAR_HEIGHT_DESKTOP;
}

export function getNavbarPadding(isMobileView: boolean): string {
  return isMobileView
    ? NAVBAR_DEFAULT_MOBILE_PADDING
    : NAVBAR_DEFAULT_DESKTOP_PADDING;
}

export function getNavbarGap(isMobileView: boolean): string {
  return isMobileView ? NAVBAR_DEFAULT_MOBILE_GAP : NAVBAR_DEFAULT_DESKTOP_GAP;
}

export function getNavbarMaxWidth(): string {
  return NAVBAR_DEFAULT_CONTAINER_MAX_WIDTH;
}

export function getNavbarLiveAnimationLeft(
  isCompactDesktop: boolean,
): string {
  return isCompactDesktop
    ? NAVBAR_LIVE_ANIMATION_LEFT_COMPACT
    : NAVBAR_LIVE_ANIMATION_LEFT_DEFAULT;
}
