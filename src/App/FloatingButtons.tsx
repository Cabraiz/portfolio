import React from "react";
import { Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import {
  getPathBySectionId,
  normalizeLandingSectionId,
  type LandingSectionId,
} from "../features/navigation/landingSections";

interface FloatingButtonsProps {
  links: ReadonlyArray<LandingSectionId>;
  selectedLink: string;
  setSelectedLink: (link: string) => void;
}

const FloatingButtons: React.FC<FloatingButtonsProps> = ({
  links,
  selectedLink,
  setSelectedLink,
}) => {
  const navigate = useNavigate();

  /**
   * Mantido só por compatibilidade com os pais atuais.
   * A navegação real agora é feita aqui via react-router.
   */
  void setSelectedLink;

  const handleNavigate = (link: LandingSectionId) => {
    const normalizedSectionId = normalizeLandingSectionId(link);

    if (!normalizedSectionId) {
      return;
    }

    navigate(getPathBySectionId(normalizedSectionId));
  };

  const createButton = (link: LandingSectionId) => {
    const isSelected = selectedLink === link;

    return (
      <Button
        key={link}
        variant="primary"
        size="sm"
        style={{
          width: isSelected ? "24px" : "12px",
          height: isSelected ? "24px" : "12px",
          marginBottom: "2vh",
          transform: isSelected ? "none" : "rotate(45deg) scaleX(0.8)",
          transformOrigin: "center",
          background: isSelected
            ? "radial-gradient(circle at 30% 30%, #0b0b0b, #1a1a1a)"
            : "linear-gradient(135deg, #fcd535, #ffb347)",
          border: isSelected ? "3px solid #fcd535" : "none",
          borderRadius: isSelected ? "8px" : "2px",
          boxShadow: isSelected
            ? "0 0 12px #fcd535, inset 0 0 8px #fcd53588"
            : "0 0 8px rgba(252, 213, 53, 0.6)",
          transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          cursor: "pointer",
        }}
        onMouseEnter={(event) => {
          event.currentTarget.style.transform = isSelected
            ? "scale(1.15)"
            : "rotate(45deg) scale(1.15)";
          event.currentTarget.style.boxShadow = isSelected
            ? "0 0 20px #fcd535, inset 0 0 12px #fcd53588"
            : "0 0 14px rgba(252, 213, 53, 0.8)";
        }}
        onMouseLeave={(event) => {
          event.currentTarget.style.transform = isSelected
            ? "none"
            : "rotate(45deg) scaleX(0.8)";
          event.currentTarget.style.boxShadow = isSelected
            ? "0 0 12px #fcd535, inset 0 0 8px #fcd53588"
            : "0 0 8px rgba(252, 213, 53, 0.6)";
        }}
        onClick={() => handleNavigate(link)}
      />
    );
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "10px",
        right: "10px",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        marginBottom: "8vh",
        marginRight: "3vw",
        zIndex: 9999,
      }}
    >
      {links.map((link) => createButton(link))}
    </div>
  );
};

export default FloatingButtons;
