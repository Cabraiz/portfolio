import zeroDois from "../../assets/Mateus/home/01.png";
import zeroUm from "../../assets/Mateus/home/02.png";

import React from "react";

const MateusMobile: React.FC = () => {
  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        backgroundColor: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* 🔴 Fundo Vermelho */}
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          background: `
            radial-gradient(
              circle at 40% 40%,
              rgba(172,17,66) 30%,
              rgba(0,0,0,0.7) 100%
            )
          `,
          backgroundColor: "#ac1142",
          clipPath: "polygon(0 0, 100% 0, 100% 40%, 0 55%)",
          zIndex: 1,
        }}
      />

      {/* 🚨 Linha de Luz Neon Vermelha */}
<div
  style={{
    position: "absolute",
    width: "10px",
    height: "180%",
    background: "rgba(255, 40, 80, 1)",
    borderRadius: "10px",
    transform: "rotate(74deg)",
    left: "50%",
    top: "-42.5%",
    filter: "drop-shadow(0 0 10px rgba(255,40,80,0.9)) drop-shadow(0 0 20px rgba(255,40,80,0.7))",
    zIndex: 5,
  }}
/>


      {/* 🔵 Fundo Azul */}
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          background: `
            radial-gradient(
              circle at 55% 55%,
              rgba(57,170,255) 30%,
              rgba(0,0,0,0.7) 100%
            )
          `,
          backgroundColor: "#39aaff",
          clipPath: "polygon(0 55%, 100% 40%, 100% 100%, 0 100%)",
          zIndex: 1,
        }}
      />

      {/* 🎨 Imagem canto superior esquerdo */}
      <img
        src={zeroUm}
        alt="Decorativo Esquerda"
        style={{
          position: "absolute",
          top: "2%",
          left: "2%",
          width: "25vw",
          maxWidth: "150px",
          zIndex: 8,
          opacity: 0.8,
        }}
      />

      {/* 🎨 Imagem canto inferior direito */}
      <img
        src={zeroDois}
        alt="Decorativo Direita"
        style={{
          position: "absolute",
          bottom: "2%",
          right: "2%",
          width: "25vw",
          maxWidth: "150px",
          zIndex: 8,
          opacity: 0.8,
        }}
      />

      {/* 🅰️ Texto App */}
      <div
        style={{
          position: "absolute",
          left: "25%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          color: "white",
          fontSize: "clamp(3rem, 8vw, 8rem)",
          fontWeight: "900",
          letterSpacing: "2px",
          zIndex: 10,
          cursor: "pointer",
        }}
      >
        APP
      </div>

      {/* 🖥️ Texto Site */}
      <div
        style={{
          position: "absolute",
          right: "25%",
          top: "50%",
          transform: "translate(50%, -50%)",
          color: "white",
          fontSize: "clamp(3rem, 8vw, 8rem)",
          fontWeight: "900",
          letterSpacing: "2px",
          zIndex: 10,
          cursor: "pointer",
        }}
      >
        SITE
      </div>

      {/* 🕹️ Texto Escolha seu lado */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: "20%",
          transform: "translateX(-50%) skewX(-5deg)",
          background: `
            linear-gradient(
              to right,
              rgba(0,0,0,0) 0%,
              rgba(0,0,0,0.9) 15%,
              rgba(0,0,0,0.9) 85%,
              rgba(0,0,0,0) 100%
            )
          `,
          padding: "0.5vw 7vw",
          borderRadius: "8px",
          color: "#b3174e",
          fontSize: "5vw",
          fontWeight: "600",
          letterSpacing: "1.5px",
          whiteSpace: "nowrap",
          fontStyle: "italic",
          zIndex: 10,
        }}
      >
        ESCOLHA SEU LADO
      </div>
    </div>
  );
};

export default MateusMobile;
