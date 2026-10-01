import { localizeLabel, useLabelLanguage } from '@/i18n/labels';
import React from "react";

export type MobileNavItemButtonProps = Readonly<{
  label: string;
  isActive: boolean;
  onClick: () => void;
}>;

const MobileNavItemButton: React.FC<MobileNavItemButtonProps> = ({
  label,
  isActive,
  onClick,
}) => {
  useLabelLanguage();
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        width: "100%",
        minHeight: "48px",
        padding: "0 14px",
        borderRadius: "14px",
        border: isActive
          ? "1px solid rgba(255, 255, 255, 0.18)"
          : "1px solid transparent",
        background: isActive ? "rgba(255, 255, 255, 0.08)" : "transparent",
        color: "#ffffff",
        textDecoration: "none",
        fontSize: "1rem",
        fontWeight: 600,
        cursor: "pointer",
        textAlign: "left",
        transition:
          "background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease",
      }}
    >
      {localizeLabel(label)}
    </button>
  );
};

export default MobileNavItemButton;
