import React from "react";

import BrandButton from "./BrandButton";
import MobileMenuToggleButton from "./MobileMenuToggleButton";

export type MobileNavbarProps = Readonly<{
  menuOpen: boolean;
  onToggleMenu: () => void;
  onBrandClick: () => void;
  logoSrc: string;
  brandLabel?: string;
}>;

const MobileNavbar: React.FC<MobileNavbarProps> = ({
  menuOpen,
  onToggleMenu,
  onBrandClick,
  logoSrc,
  brandLabel = "Cabraiz",
}) => {
  return (
    <>
      <div
        style={{
          width: "44px",
          minWidth: "44px",
          display: "flex",
          justifyContent: "flex-start",
        }}
      >
        <MobileMenuToggleButton
          menuOpen={menuOpen}
          onToggle={onToggleMenu}
        />
      </div>

      <BrandButton
        onClick={onBrandClick}
        mobile
        logoSrc={logoSrc}
        logoAlt={brandLabel}
      />

      <div style={{ width: "44px", minWidth: "44px" }} />
    </>
  );
};

export default MobileNavbar;
