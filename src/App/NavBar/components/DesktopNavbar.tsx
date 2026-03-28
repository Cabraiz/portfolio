import React, {
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";

import type { LandingSectionId } from "../../../features/navigation/landingSections";
import BrandButton from "./BrandButton";
import DesktopNavItemButton from "./DesktopNavItemButton";

export type DesktopNavbarProps = Readonly<{
  items: ReadonlyArray<LandingSectionId>;
  activeSectionId: LandingSectionId | "";
  isCompactDesktop: boolean;
  underlineStyle: CSSProperties;
  navContainerRef: RefObject<HTMLDivElement | null>;
  onBrandClick: () => void;
  onNavigateToSection: (sectionId: LandingSectionId) => void;
  setNavRef: (
    sectionId: LandingSectionId,
    element: HTMLButtonElement | null,
  ) => void;
  getLabel: (sectionId: LandingSectionId) => string;
  logoSrc: string;
  renderLeadingVisual?: (sectionId: LandingSectionId) => ReactNode;
}>;

function getBrandSlotWidth(isCompactDesktop: boolean): string {
  return isCompactDesktop
    ? "clamp(124px, 11vw, 164px)"
    : "clamp(136px, 12vw, 184px)";
}

function getNavGap(isCompactDesktop: boolean): string {
  return isCompactDesktop
    ? "clamp(14px, 1.3vw, 22px)"
    : "clamp(18px, 1.7vw, 30px)";
}

const baseUnderlineStyle: CSSProperties = {
  position: "absolute",
  left: 0,
  bottom: 0,
  height: "2px",
  borderRadius: "999px",
  background:
    "linear-gradient(90deg, rgba(255, 215, 0, 0.92) 0%, rgba(255, 235, 153, 0.98) 100%)",
  boxShadow:
    "0 0 14px rgba(255, 215, 0, 0.22), 0 0 6px rgba(255, 235, 153, 0.16)",
  pointerEvents: "none",
  transition:
    "transform 220ms ease, width 220ms ease, opacity 160ms ease, left 220ms ease",
  opacity: 1,
};

const DesktopNavbar: React.FC<DesktopNavbarProps> = ({
  items,
  activeSectionId,
  isCompactDesktop,
  underlineStyle,
  navContainerRef,
  onBrandClick,
  onNavigateToSection,
  setNavRef,
  getLabel,
  logoSrc,
  renderLeadingVisual,
}) => {
  const brandSlotWidth = getBrandSlotWidth(isCompactDesktop);

  const brandSlotStyle: CSSProperties = {
    flex: "0 0 auto",
    width: brandSlotWidth,
    minWidth: brandSlotWidth,
    maxWidth: brandSlotWidth,
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingLeft: "clamp(2px, 0.5vw, 8px)",
  };

  const centerSlotStyle: CSSProperties = {
    flex: "1 1 auto",
    minWidth: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  };

  const trailingSpacerStyle: CSSProperties = {
    flex: "0 0 auto",
    width: brandSlotWidth,
    minWidth: brandSlotWidth,
    maxWidth: brandSlotWidth,
  };

  const navContainerStyle: CSSProperties = {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: getNavGap(isCompactDesktop),
    minWidth: 0,
    maxWidth: "100%",
    padding: "0 clamp(6px, 1vw, 12px) 8px",
    marginTop: "2px",
  };

  return (
    <>
      <div style={brandSlotStyle}>
        <BrandButton
          onClick={onBrandClick}
          compactDesktop={isCompactDesktop}
          logoSrc={logoSrc}
        />
      </div>

      <div style={centerSlotStyle}>
        <div ref={navContainerRef} style={navContainerStyle}>
          {items.map((sectionId) => (
            <DesktopNavItemButton
              key={sectionId}
              link={sectionId}
              label={getLabel(sectionId)}
              isActive={activeSectionId === sectionId}
              onClick={() => onNavigateToSection(sectionId)}
              navRef={(element) => {
                setNavRef(sectionId, element);
              }}
              leadingVisual={renderLeadingVisual?.(sectionId)}
            />
          ))}

          <div
            style={{
              ...baseUnderlineStyle,
              ...underlineStyle,
            }}
          />
        </div>
      </div>

      <div aria-hidden="true" style={trailingSpacerStyle} />
    </>
  );
};

export default DesktopNavbar;
