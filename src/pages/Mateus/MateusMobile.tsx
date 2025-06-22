import React from "react";
import { Image } from "react-bootstrap";
import perfil from "../../assets/Mateus/perfil.webp";
import FloatingChat from "./FloatingChat";

const MateusMobile: React.FC = () => {
  return (
    <>
      <div
        style={{
          minHeight: "100vh",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center", // 🔥 Centraliza tudo verticalmente
          padding: "4vh 4vw",        // 🔥 Apenas espaçamento lateral
          userSelect: "none",
        }}
      >
        {/* 🔥 Foto de Perfil */}
        <div
          style={{
            backgroundColor: "#1e1e1e",
            padding: "1vh",
            borderRadius: "50%",
            boxShadow: "0 4px 8px rgba(0,0,0,0.5)",
          }}
        >
          <Image
            src={perfil}
            roundedCircle
            loading="lazy"
            style={{
              width: "32vw",
              height: "32vw",
              objectFit: "cover",
              border: "2px solid white",
            }}
          />
        </div>

        {/* 🔥 Nome */}
        <h1
          style={{
            color: "#fff",
            marginTop: "2vh",
            fontSize: "1.8rem",
            letterSpacing: "0.5px",
            fontWeight: 600,
            textShadow: "0 1px 2px rgba(0,0,0,0.4)",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          Mateus Cabraiz
        </h1>

        {/* 🔥 Serviços */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            marginTop: "5vh",
            width: "100%",
            alignItems: "center",
          }}
        >
          {[
            "Site Profissional",
            "Landing Page",
            "Portfólio Pessoal",
            "Sistemas Sob Medida",
          ].map((item) => (
            <div
              key={item}
              style={{
                backgroundColor: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "14px",
                padding: "1rem 1.5rem",
                width: "85%",
                textAlign: "center",
                color: "#fff",
                boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                fontWeight: 500,
                letterSpacing: "0.5px",
                fontFamily: "system-ui, sans-serif",
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default MateusMobile;
