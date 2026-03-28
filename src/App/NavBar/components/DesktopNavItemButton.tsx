import React, { type CSSProperties } from "react";

import type { LandingSectionId } from "../../../features/navigation/landingSections";

export type DesktopNavItemButtonProps = Readonly<{
  link: LandingSectionId;
  label: string;
  isActive: boolean;
  onClick: () => void;
  navRef?: (element: HTMLButtonElement | null) => void;
  leadingVisual?: React.ReactNode;
}>;

const baseButtonStyle: CSSProperties = {
  all: "unset",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  position: "relative",
  cursor: "pointer",
  whiteSpace: "nowrap",
  flex: "0 0 auto",
  minWidth: 0,
  padding: "6px 0 10px",
  color: "rgba(255, 255, 255, 0.74)",
  fontSize: "clamp(1.02rem, 0.68rem + 0.72vw, 1.18rem)",
  fontWeight: 600,
  lineHeight: 1,
  letterSpacing: "-0.01em",
  transition:
    "color 180ms ease, transform 180ms ease, opacity 180ms ease",
};

const activeButtonStyle: CSSProperties = {
  color: "#ffffff",
};

const DesktopNavItemButton: React.FC<DesktopNavItemButtonProps> = ({
  link,
  label,
  isActive,
  onClick,
  navRef,
  leadingVisual,
}) => {
  return (
    <button
      type="button"
      ref={navRef}
      data-nav-link={link}
      aria-current={isActive ? "page" : undefined}
      onClick={onClick}
      style={{
        ...baseButtonStyle,
        ...(isActive ? activeButtonStyle : null),
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
