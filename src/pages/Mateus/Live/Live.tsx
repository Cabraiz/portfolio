import React, { type CSSProperties, useRef } from "react";

import useRevealOnScroll from "../../../features/animations/useRevealOnScroll";

const containerStyle: CSSProperties = {
  minHeight: "100vh",
  backgroundColor: "#111",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexDirection: "column",
  textAlign: "center",
};

const titleStyle: CSSProperties = {
  fontSize: "4vw",
  margin: 0,
};

const descriptionStyle: CSSProperties = {
  opacity: 0.6,
  fontSize: "1.2vw",
  marginTop: "12px",
};

const Live: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useRevealOnScroll({
    targetRef: containerRef,
    triggerRef: containerRef,
    preset: "blurIn",
    start: "top 80%",
    end: "bottom 30%",
    duration: 1,
    ease: "power3.out",
    once: false,
    refreshOnMount: false,
  });

  return (
    <div ref={containerRef} style={containerStyle}>
      <h1 style={titleStyle}>Live</h1>
      <p style={descriptionStyle}>
        Aqui pode entrar uma transmissão ao vivo, demonstrações ou showcases.
      </p>
    </div>
  );
};

export default Live;
