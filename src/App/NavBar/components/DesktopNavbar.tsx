import React, {
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";

import GoogleSignInButton from "../GoogleSignInButton";
import { navbarLayoutTokens, navbarStyles } from "../NavbarStyles";
import type { LandingSectionId } from "../../../features/navigation/landingSections";
import BrandButton from "./BrandButton";
import DesktopNavItemButton from "./DesktopNavItemButton";

export type DesktopNavbarProps = Readonly<{
  links: ReadonlyArray<LandingSectionId>;
  selectedLink: string;
  isCompactDesktop: boolean;
  desktopSideColumnWidth: string;
  desktopGoogleButtonWidth: string;
  underlineStyle: CSSProperties;
  navContainerRef: RefObject<HTMLDivElement | null>;
  onBrandClick: () => void;
  onNavigate: (link: LandingSectionId) => void;
  setNavRef: (
    link: LandingSectionId,
    element: HTMLButtonElement | null,
  ) => void;
  getLabel: (link: LandingSectionId) => string;
  logoSrc: string;
  renderLeadingVisual?: (
    link: LandingSectionId,
    isCompactDesktop: boolean,
  ) => ReactNode;
  onItemHoverStart?: (
    link: LandingSectionId,
    element: HTMLButtonElement,
  ) => void;
  onItemHoverEnd?: (
    link: LandingSectionId,
    element: HTMLButtonElement,
  ) => void;
}>;

function getDesktopNavGap(isCompactDesktop: boolean): string {
  return isCompactDesktop
    ? navbarLayoutTokens.desktop.navGap.compact
    : navbarLayoutTokens.desktop.navGap.default;
}

const DesktopNavbar: React.FC<DesktopNavbarProps> = ({
  links,
  selectedLink,
  isCompactDesktop,
  desktopSideColumnWidth,
  desktopGoogleButtonWidth,
  underlineStyle,
  navContainerRef,
  onBrandClick,
  onNavigate,
  setNavRef,
  getLabel,
  logoSrc,
  renderLeadingVisual,
  onItemHoverStart,
  onItemHoverEnd,
}) => {
  return (
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
          onClick={onBrandClick}
          compactDesktop={isCompactDesktop}
          logoSrc={logoSrc}
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
              label={getLabel(link)}
              isActive={selectedLink === link}
              onClick={() => onNavigate(link)}
              navRef={(element) => {
                setNavRef(link, element);
              }}
              onHoverStart={(element) => {
                onItemHoverStart?.(link, element);
              }}
              onHoverEnd={(element) => {
                onItemHoverEnd?.(link, element);
              }}
              leadingVisual={renderLeadingVisual?.(link, isCompactDesktop)}
            />
          ))}

          <div
            style={{
              ...navbarStyles.underline,
              ...underlineStyle,
            }}
          />
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
};

export default DesktopNavbar;
