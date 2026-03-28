import React, { useState, type CSSProperties } from "react";

import type { LandingSectionId } from "../../../features/navigation/landingSections";

export type DesktopNavItemButtonProps = Readonly<{
  link: LandingSectionId;
  label: string;
  isActive: boolean;
  onClick: () => void;
  navRef?: (element: HTMLButtonElement | null) => void;
  onHoverStart?: (element: HTMLButtonElement) => void;
  onHoverEnd?: (element: HTMLButtonElement) => void;
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
  padding: "8px clamp(2px, 0.35vw, 6px) 12px",
  borderRadius: "999px",
  color: "rgba(255, 255, 255, 0.74)",
  fontFamily: '"BlommingElegant", sans-serif',
  fontSize: "clamp(1.02rem, 0.68rem + 0.72vw, 1.18rem)",
  fontWeight: 300,
  lineHeight: 1,
  letterSpacing: "0.02em",
  transition:
    "color 220ms ease, opacity 220ms ease, filter 220ms ease, text-shadow 220ms ease",
};

const emphasizedButtonStyle: CSSProperties = {
  color: "#ffffff",
  filter: "brightness(1.03)",
};

const contentStyle: CSSProperties = {
  position: "relative",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "clamp(6px, 0.45vw, 10px)",
};

function getLabelStyle(isRaised: boolean): CSSProperties {
  return {
    display: "inline-block",
    fontFamily: '"BlommingElegant", sans-serif',
    fontWeight: 300,
    lineHeight: 1,
    letterSpacing: "0.02em",
    transform: isRaised
      ? "translateY(calc(14% - 3px))"
      : "translateY(calc(14% + 1px))",
    transition:
      "transform 220ms cubic-bezier(0.22, 1, 0.36, 1), text-shadow 220ms ease, opacity 220ms ease, color 220ms ease",
    textShadow: isRaised
      ? "0 0 18px rgba(255, 226, 148, 0.12)"
      : "0 0 0 rgba(255, 226, 148, 0)",
    opacity: isRaised ? 1 : 0.98,
  };
}

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
  const [isHovered, setIsHovered] = useState(false);

  const isRaised = isActive || isHovered;

  const handleMouseEnter = (event: React.MouseEvent<HTMLButtonElement>) => {
    setIsHovered(true);
    onHoverStart?.(event.currentTarget);
  };

  const handleMouseLeave = (event: React.MouseEvent<HTMLButtonElement>) => {
    setIsHovered(false);
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
        ...baseButtonStyle,
        ...(isRaised ? emphasizedButtonStyle : null),
      }}
    >
      <span style={contentStyle}>
        {leadingVisual}
        <span style={getLabelStyle(isRaised)}>{label}</span>
      </span>
    </button>
  );
};

export default DesktopNavItemButton;
