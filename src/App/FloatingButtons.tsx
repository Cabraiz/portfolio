import React, { useMemo, type CSSProperties } from "react";

import {
  getLandingOrderedSectionIds,
  getLandingSectionsByIds,
  type LandingSectionId,
} from "../features/navigation/landingSections";

export type FloatingButtonsProps = Readonly<{
  activeSectionId: LandingSectionId | "";
  onNavigateToSection: (sectionId: LandingSectionId) => void;
  items?: ReadonlyArray<LandingSectionId>;
}>;

const railStyle: CSSProperties = {
  position: "fixed",
  right: "clamp(14px, 2vw, 28px)",
  top: "50%",
  transform: "translateY(-50%)",
  zIndex: 950,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "12px",
  padding: "12px 8px",
  borderRadius: "999px",
  background: "rgba(12, 12, 16, 0.36)",
  border: "1px solid rgba(255, 255, 255, 0.06)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  boxShadow: "0 12px 28px rgba(0, 0, 0, 0.24)",
};

function getButtonStyle(isActive: boolean): CSSProperties {
  return {
    width: isActive ? "22px" : "12px",
    height: isActive ? "22px" : "12px",
    padding: 0,
    border: isActive ? "2px solid #f4d35e" : "none",
    borderRadius: isActive ? "7px" : "2px",
    transform: isActive ? "none" : "rotate(45deg) scale(0.94)",
    transformOrigin: "center",
    background: isActive
      ? "radial-gradient(circle at 30% 30%, #101115, #1d2027)"
      : "linear-gradient(135deg, #f4d35e, #d4a017)",
    boxShadow: isActive
      ? "0 0 0 1px rgba(255, 211, 94, 0.15), 0 8px 18px rgba(0, 0, 0, 0.28)"
      : "0 6px 14px rgba(212, 160, 23, 0.24)",
    cursor: "pointer",
    transition:
      "width 180ms ease, height 180ms ease, transform 180ms ease, box-shadow 180ms ease, border-radius 180ms ease",
  };
}

const FloatingButtons: React.FC<FloatingButtonsProps> = ({
  activeSectionId,
  onNavigateToSection,
  items,
}) => {
  const resolvedItems = useMemo(() => {
    const ids = items?.length ? items : getLandingOrderedSectionIds();

    return getLandingSectionsByIds(ids);
  }, [items]);

  if (resolvedItems.length === 0) {
    return null;
  }

  return (
    <aside aria-label="Navegação lateral por seções" style={railStyle}>
      {resolvedItems.map((section) => {
        const isActive = activeSectionId === section.id;

        return (
          <button
            key={section.id}
            type="button"
            aria-label={section.label}
            aria-current={isActive ? "page" : undefined}
            title={section.label}
            onClick={() => onNavigateToSection(section.id)}
            style={getButtonStyle(isActive)}
          />
        );
      })}
    </aside>
  );
};

export default FloatingButtons;
