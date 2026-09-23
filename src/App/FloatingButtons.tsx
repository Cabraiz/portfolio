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

const mirroredGoldGradient =
  "linear-gradient(135deg, #694100 0%, #bd8610 18%, #fff0a3 38%, #a46703 55%, #f2cf62 75%, #714500 100%)";

const activeGoldFrame =
  `linear-gradient(135deg, #101115, #1d2027) padding-box, ${mirroredGoldGradient} border-box`;

function getButtonStyle(isActive: boolean, lightTheme: boolean): CSSProperties {
  if (lightTheme) {
    return {
      width: isActive ? "22px" : "10px",
      height: isActive ? "22px" : "10px",
      padding: 0,
      border: isActive ? "2px solid #0b665f" : "none",
      borderRadius: isActive ? "50%" : "2px",
      transform: isActive ? "none" : "rotate(45deg)",
      background: isActive ? "rgba(239, 248, 245, 0.95)" : "#0b665f",
      boxShadow: isActive
        ? "0 0 0 4px rgba(11, 102, 95, 0.1)"
        : "0 4px 10px rgba(11, 102, 95, 0.22)",
      cursor: "pointer",
      transition:
        "width 180ms ease, height 180ms ease, transform 180ms ease, box-shadow 180ms ease, border-radius 180ms ease",
    };
  }

  return {
    width: isActive ? "22px" : "12px",
    height: isActive ? "22px" : "12px",
    padding: 0,
    border: isActive ? "2px solid transparent" : "none",
    borderRadius: isActive ? "7px" : "2px",
    transform: isActive ? "none" : "rotate(45deg) scale(0.94)",
    transformOrigin: "center",
    background: isActive ? activeGoldFrame : mirroredGoldGradient,
    boxShadow: isActive
      ? "0 0 0 1px rgba(242, 207, 98, 0.18), 0 8px 18px rgba(0, 0, 0, 0.3)"
      : "0 6px 14px rgba(189, 134, 16, 0.3), inset 0 1px 1px rgba(255, 245, 181, 0.42)",
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
    <aside
      aria-label="Navegação lateral por seções"
      style={
        activeSectionId === "portfolio"
          ? {
              ...railStyle,
              background: "rgba(239, 248, 245, 0.78)",
              border: "1px solid rgba(11, 102, 95, 0.14)",
              boxShadow: "0 12px 28px rgba(18, 70, 65, 0.1)",
            }
          : railStyle
      }
    >
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
            style={getButtonStyle(isActive, activeSectionId === "portfolio")}
          />
        );
      })}
    </aside>
  );
};

export default FloatingButtons;
