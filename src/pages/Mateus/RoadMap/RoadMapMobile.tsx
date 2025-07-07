import React from "react";
import styled, { keyframes } from "styled-components";
import zeroDois from "../../../assets/Mateus/home/01.png";
import zeroUm from "../../../assets/Mateus/home/02.png";

// 🔹 Fade-in com deslocamento
const fadeSlide = keyframes`
  0% {
    opacity: 0;
    transform: translateY(40px) scale(1.05);
    filter: blur(4px);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0);
  }
`;

// 🔹 Pulsar discreto no texto
const pulsar = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
`;

// 🔹 Brilho correndo no texto principal
const shine = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`;

const Container = styled.div`
  min-height: 100vh;
  width: 100%;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  animation: ${fadeSlide} 1s ease-out;
`;

const BackgroundRed = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at 40% 40%, rgba(172, 17, 66, 1) 30%, rgba(0, 0, 0, 0.7) 100%);
  clip-path: polygon(0 0, 100% 0, 100% 40%, 0 55%);
  z-index: 1;
`;

const BackgroundBlue = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at 55% 55%, rgba(57, 170, 255, 1) 30%, rgba(0, 0, 0, 0.7) 100%);
  clip-path: polygon(0 55%, 100% 40%, 100% 100%, 0 100%);
  z-index: 1;
`;

const NeonLine = styled.div`
  position: absolute;
  width: 10px;
  height: 180%;
  background: rgba(255, 40, 80, 1);
  border-radius: 10px;
  transform: rotate(74deg);
  left: 50%;
  top: -42.5%;
  filter: drop-shadow(0 0 10px rgba(255,40,80,0.9)) drop-shadow(0 0 20px rgba(255,40,80,0.7));
  z-index: 5;
`;

const DecorImage = styled.img<{ floatDirection?: "up" | "down" }>`
  position: absolute;
  width: 60vw;
  opacity: 0;
  animation: 
    ${fadeSlide} 1s forwards,
    ${(props) =>
      props.floatDirection === "up"
        ? "floatUp 6s ease-in-out infinite alternate"
        : "floatDown 6s ease-in-out infinite alternate"};

  @keyframes floatUp {
    to { transform: translateY(-15px); }
  }
  @keyframes floatDown {
    to { transform: translateY(15px); }
  }
`;

const TextOutline = styled.div`
  position: absolute;
  transform: scale(1.2);
  font-size: clamp(3rem, 8vw, 8rem);
  font-weight: 900;
  letter-spacing: 2px;
  color: transparent;
  -webkit-text-stroke: 2px rgba(255,255,255,0.4);
  pointer-events: none;
  animation: ${pulsar} 3s infinite;
`;

const TextMain = styled.div`
  position: absolute;
  font-size: clamp(3rem, 8vw, 8rem);
  font-weight: 900;
  letter-spacing: 2px;
  cursor: pointer;
  background: linear-gradient(
    to right,
    rgba(255,255,255,0.2),
    rgba(255,255,255,1),
    rgba(255,255,255,0.2)
  );
  background-size: 400%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
  animation: ${shine} 4s linear infinite;
`;

const BottomBanner = styled.div`
  position: absolute;
  left: 50%;
  bottom: 10%;
  transform: translateX(-50%);
  background: linear-gradient(
    to right,
    rgba(0,0,0,0) 0%,
    rgba(0,0,0,0.9) 15%,
    rgba(0,0,0,0.9) 85%,
    rgba(0,0,0,0) 100%
  );
  padding: 0.5vw 14vw;
  border-radius: 8px;
  color: #b3174e;
  font-size: 4vw;
  font-weight: 600;
  letter-spacing: 1.5px;
  white-space: nowrap;
  font-style: italic;
  z-index: 10;
`;

const RoadMapMobile: React.FC = () => (
  <Container>
    <BackgroundRed />
    <NeonLine />
    <BackgroundBlue />

    <DecorImage 
      src={zeroUm} 
      alt="Decorativo Esquerda" 
      style={{ top: "15%", left: "2%" }} 
      floatDirection="up"
    />
    <DecorImage 
      src={zeroDois} 
      alt="Decorativo Direita" 
      style={{ bottom: "18%", right: "-8%" }} 
      floatDirection="down"
    />

    <TextOutline style={{ left: "75%", top: "20%" }}>APP</TextOutline>
    <TextMain style={{ left: "75%", top: "20%" }}>APP</TextMain>

    <TextOutline style={{ right: "70%", top: "60%" }}>SITE</TextOutline>
    <TextMain style={{ right: "70%", top: "60%" }}>SITE</TextMain>

    <BottomBanner>ESCOLHA SEU LADO</BottomBanner>
  </Container>
);

export default RoadMapMobile;
