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
