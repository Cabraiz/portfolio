import type { CSSProperties, RefObject } from "react";

import type { LandingSectionId } from "../../features/navigation/landingSections";

export type NavbarLinkId = LandingSectionId;

export type NavbarNavButtonRegistry = Record<string, HTMLButtonElement | null>;

export type NavbarNavRefs = RefObject<NavbarNavButtonRegistry>;
export type NavbarNavContainerRef = RefObject<HTMLDivElement | null>;
export type NavbarUnderlineStyle = CSSProperties;

export type NavbarSetNavRef = (
  link: NavbarLinkId,
  element: HTMLButtonElement | null,
) => void;

export type NavbarGetLabel = (link: NavbarLinkId) => string;
export type NavbarNavigateToLink = (link: NavbarLinkId) => void;
export type NavbarSetMenuOpen = (open: boolean) => void;

export type NavbarLenisScrollEvent = Readonly<{
  scroll?: number;
  animatedScroll?: number;
  actualScroll?: number;
}>;

export type NavbarLenisScrollToOptions = Readonly<{
  offset?: number;
  duration?: number;
  easing?: (value: number) => number;
}>;

export type NavbarLenisLike =
  | Readonly<{
      on?: (
        event: "scroll",
        callback: (event: NavbarLenisScrollEvent) => void,
      ) => void;
      off?: (
        event: "scroll",
        callback: (event: NavbarLenisScrollEvent) => void,
      ) => void;
      scrollTo: (
        target: number | HTMLElement,
        options?: NavbarLenisScrollToOptions,
      ) => void;
    }>
  | null
  | undefined;

export type NavbarViewportState = Readonly<{
  viewportWidth: number;
  viewportHeight: number;
  isCompactDesktop: boolean;
  navbarHeight: number;
  desktopGoogleButtonWidth: string;
  desktopSideColumnWidth: string;
}>;

export type NavbarScrollBehaviorState = Readonly<{
  showNavbar: boolean;
}>;

export type NavbarUnderlineState = Readonly<{
  navRefs: NavbarNavRefs;
  navContainerRef: NavbarNavContainerRef;
  underlineStyle: NavbarUnderlineStyle;
  setNavRef: NavbarSetNavRef;
  hideUnderline: () => void;
}>;

export type NavbarNavigationState = Readonly<{
  handleNavigateToSection: (link: NavbarLinkId) => void;
  handleBrandClick: () => void;
  scrollToSectionElement: (sectionId: NavbarLinkId) => void;
  scrollToTop: () => void;
}>;
