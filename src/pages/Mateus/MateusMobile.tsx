import React from "react";
import { Container, Image } from "react-bootstrap";
import { FaLinkedin, FaInstagram } from "react-icons/fa";
import perfil from "../../assets/Mateus/perfil.webp";
import FloatingChat from "./FloatingChat";

const MateusMobile: React.FC = () => {
  return (
    <>
      <Container
  fluid
  style={{
    minHeight: "100vh",
    background: "linear-gradient(to bottom, #0f0f0f, #1a1a1a)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    padding: "4vh 2vw",
    userSelect: "none",
    WebkitUserSelect: "none",
    msUserSelect: "none",
  }}
>

        {/* Header */}
        <div
          style={{
            backgroundColor: "#1e1e1e",
            padding: "1vh",
            borderRadius: "50%",
            boxShadow: "0 4px 20px rgba(0,0,0,0.7)",
            marginTop: "3vh",
          }}
        >
          <Image
            src={perfil}
            roundedCircle
            style={{
              width: "34vw",
              height: "34vw",
              objectFit: "cover",
              border: "2px solid white",
            }}
          />
        </div>

        <h1
          style={{
            color: "#fff",
            marginTop: "2vh",
            fontSize: "1.8rem",
            letterSpacing: "1px",
            fontWeight: 700,
            textShadow: "0 1px 3px rgba(0,0,0,0.6)",
          }}
        >
          Mateus Cabraiz
        </h1>

        {/* Serviços */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1.2rem",
            marginTop: "5vh",
            width: "100%",
            alignItems: "center",
          }}
        >
          {["Site Profissional", "Landing Page", "Portfólio Pessoal", "Sistemas Sob Medida"].map(
            (item) => (
              <div
                key={item}
                style={{
                  backgroundColor: "#ffffff0a",
                  border: "1px solid #555",
                  borderRadius: "14px",
                  padding: "1rem 1.5rem",
                  width: "85%",
                  textAlign: "center",
                  color: "#fff",
                  backdropFilter: "blur(10px)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                  fontWeight: 500,
                  letterSpacing: "0.5px",
                }}
              >
                {item}
              </div>
            )
          )}
        </div>
      </Container>

      <FloatingChat />
    </>
  );
};

export default MateusMobile;
