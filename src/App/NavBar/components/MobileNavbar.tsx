import React, { type CSSProperties, useCallback } from "react";

import logo from "../../../assets/icones/logo.svg";
import {
  DEFAULT_LANDING_SECTION_ID,
  LANDING_SECTIONS,
  type LandingSectionId,
} from "../../../features/navigation/landingSections";
import BrandButton from "./BrandButton";
import MobileMenuToggleButton from "./MobileMenuToggleButton";
import MobileNavItemButton from "./MobileNavItemButton";

export type MobileNavbarProps = Readonly<{
  isOpen: boolean;
  onToggle: () => void;
  onNavigateToSection: (sectionId: LandingSectionId) => void;
  activeSectionId: LandingSectionId | "";
}>;

const MOBILE_PANEL_TOP = "82px";
const MOBILE_OVERLAY_TOP = "72px";
const MOBILE_MENU_ID = "primary-navigation-mobile";

const sideSlotStyle: CSSProperties = {
  width: "44px",
  minWidth: "44px",
  display: "flex",
  justifyContent: "flex-start",
  alignItems: "center",
  flex: "0 0 auto",
};

const trailingSpacerStyle: CSSProperties = {
  width: "44px",
  minWidth: "44px",
  flex: "0 0 auto",
};

function getPanelStyle(): CSSProperties {
  return {
    position: "fixed",
    top: MOBILE_PANEL_TOP,
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
    WebkitBackdropFilter: "blur(14px)",
    zIndex: 1002,
  };
}

function getOverlayStyle(): CSSProperties {
  return {
    position: "fixed",
    inset: 0,
    top: MOBILE_OVERLAY_TOP,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    backdropFilter: "blur(3px)",
    WebkitBackdropFilter: "blur(3px)",
    zIndex: 1001,
    border: "none",
    padding: 0,
    cursor: "pointer",
  };
}

const MobileNavbar: React.FC<MobileNavbarProps> = ({
  isOpen,
  onToggle,
  onNavigateToSection,
  activeSectionId,
}) => {
  const handleBrandClick = useCallback(() => {
    onNavigateToSection(DEFAULT_LANDING_SECTION_ID);

    if (isOpen) {
      onToggle();
    }
  }, [isOpen, onNavigateToSection, onToggle]);

  const handleNavigate = useCallback(
    (sectionId: LandingSectionId) => {
      onNavigateToSection(sectionId);

      if (isOpen) {
        onToggle();
      }
    },
    [isOpen, onNavigateToSection, onToggle],
  );

  return (
    <>
      <div style={sideSlotStyle}>
        <MobileMenuToggleButton menuOpen={isOpen} onToggle={onToggle} />
      </div>

      <BrandButton
        onClick={handleBrandClick}
        mobile
        logoSrc={logo}
        logoAlt="Cabraiz"
      />

      <div aria-hidden="true" style={trailingSpacerStyle} />

      {isOpen ? (
        <>
          <nav
            id={MOBILE_MENU_ID}
            aria-label="Navegação principal mobile"
            style={getPanelStyle()}
          >
            {LANDING_SECTIONS.map((section) => (
              <MobileNavItemButton
                key={section.id}
                label={section.label}
                isActive={activeSectionId === section.id}
                onClick={() => handleNavigate(section.id)}
              />
            ))}
          </nav>

          <button
            type="button"
            aria-label="Fechar menu"
            onClick={onToggle}
            style={getOverlayStyle()}
          />
        </>
      ) : null}
    </>
  );
};

export default MobileNavbar;
