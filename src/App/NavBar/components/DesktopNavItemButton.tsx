import React from "react";
import { navbarStyles } from "../NavbarStyles";

export type DesktopNavItemButtonProps = Readonly<{
  link: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
  navRef?: (element: HTMLButtonElement | null) => void;
  onHoverStart?: (element: HTMLButtonElement) => void;
  onHoverEnd?: (element: HTMLButtonElement) => void;
  leadingVisual?: React.ReactNode;
}>;

const DesktopNavItemButton: React.FC<DesktopNavItemButtonProps> = ({
  link,
  label,
  isActive,
  onClick,
  navRef,
  onHoverStart,
  onHoverEnd,
  leadingVisual,
}) => {
  const handleMouseEnter = (event: React.MouseEvent<HTMLButtonElement>) => {
    onHoverStart?.(event.currentTarget);
  };

  const handleMouseLeave = (event: React.MouseEvent<HTMLButtonElement>) => {
    onHoverEnd?.(event.currentTarget);
  };

  return (
    <button
      type="button"
      ref={navRef}
      data-nav-link={link}
      aria-current={isActive ? "page" : undefined}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        all: "unset",
        ...(navbarStyles.navLink as React.CSSProperties),
        ...(isActive ? (navbarStyles.navLinkActive as React.CSSProperties) : {}),
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        cursor: "pointer",
        whiteSpace: "nowrap",
        flex: "0 0 auto",
        minWidth: 0,
      }}
    >
      <span
        style={{
          position: "relative",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {leadingVisual}
        <span>{label}</span>
      </span>
    </button>
  );
};

export default DesktopNavItemButton;
