import React, { type CSSProperties } from "react";

export type MobileMenuToggleButtonProps = Readonly<{
  menuOpen: boolean;
  onToggle: () => void;
}>;

function getBurgerLineStyle(
  index: number,
  menuOpen: boolean,
): CSSProperties {
  let top = "21px";
  let transform = "none";
  let opacity = 1;

  if (index === 0) {
    top = menuOpen ? "21px" : "14px";

    if (menuOpen) {
      transform = "rotate(45deg)";
    }
  }

  if (index === 1) {
    top = "21px";

    if (menuOpen) {
      transform = "scaleX(0)";
      opacity = 0;
    }
  }

  if (index === 2) {
    top = menuOpen ? "21px" : "28px";

    if (menuOpen) {
      transform = "rotate(-45deg)";
    }
  }

  return {
    position: "absolute",
    width: "22px",
    height: "2px",
    borderRadius: "999px",
    backgroundColor: "#ffffff",
    transition: "transform 0.3s ease, opacity 0.25s ease, top 0.3s ease",
    top,
    transform,
    opacity,
  };
}

const MobileMenuToggleButton: React.FC<MobileMenuToggleButtonProps> = ({
  menuOpen,
  onToggle,
}) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
      aria-expanded={menuOpen}
      aria-controls="primary-navigation-mobile"
      style={{
        width: "44px",
        height: "44px",
        padding: 0,
        border: "none",
        background: "transparent",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        cursor: "pointer",
        borderRadius: "12px",
        flex: "0 0 auto",
      }}
    >
      {[0, 1, 2].map((index) => (
        <span key={index} style={getBurgerLineStyle(index, menuOpen)} />
      ))}
    </button>
  );
};

export default MobileMenuToggleButton;
