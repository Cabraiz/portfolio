import React from "react";

import GoogleSignInButton from "../GoogleSignInButton";
import { navbarLayoutTokens } from "../NavbarStyles";
import type { LandingSectionId } from "../../../features/navigation/landingSections";
import MobileNavItemButton from "./MobileNavItemButton";

export type MobileMenuPanelProps = Readonly<{
  open: boolean;
  links: ReadonlyArray<LandingSectionId>;
  selectedLink: string;
  panelTop: number | string;
  overlayTop: number | string;
  getLabel: (link: LandingSectionId) => string;
  onNavigate: (link: LandingSectionId) => void;
  onClose: () => void;
  menuId?: string;
}>;

function resolveTopValue(value: number | string): string {
  return typeof value === "number" ? `${value}px` : value;
}

const MobileMenuPanel: React.FC<MobileMenuPanelProps> = ({
  open,
  links,
  selectedLink,
  panelTop,
  overlayTop,
  getLabel,
  onNavigate,
  onClose,
  menuId = "primary-navigation-mobile",
}) => {
  if (!open) {
    return null;
  }

  return (
    <>
      <nav
        id={menuId}
        aria-label="Navegação principal mobile"
        style={{
          position: "fixed",
          top: resolveTopValue(panelTop),
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
            label={getLabel(link)}
            isActive={selectedLink === link}
            onClick={() => onNavigate(link)}
          />
        ))}

        <div style={{ paddingTop: "6px", width: "100%" }}>
          <GoogleSignInButton compact fullWidth />
        </div>
      </nav>

      <button
        type="button"
        aria-label="Fechar menu"
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          top: resolveTopValue(overlayTop),
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(3px)",
          zIndex: 9997,
          border: "none",
          padding: 0,
          cursor: "pointer",
        }}
      />
    </>
  );
};

export default MobileMenuPanel;
