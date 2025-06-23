import React, { useEffect, useRef } from "react";
import gsap from "gsap";

interface LiveProps {
  isActive: boolean;
}

const Live: React.FC<LiveProps> = ({ isActive }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    if (isActive) {
      gsap.to(container, {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 0.8,
        ease: "power3.out",
      });
    } else {
      gsap.to(container, {
        opacity: 0,
        y: 40,
        filter: "blur(4px)",
        duration: 0.6,
        ease: "power3.inOut",
      });
    }
  }, [isActive]);

  return (
    <div
      ref={containerRef}
      style={{
        minHeight: "100vh",
        backgroundColor: "#111",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        opacity: 0,
        filter: "blur(4px)",
        transform: "translateY(40px)",
      }}
    >
      <h1 style={{ fontSize: "4vw" }}>Live</h1>
      <p style={{ opacity: 0.6, fontSize: "1.2vw" }}>
        Aqui pode entrar uma transmissão ao vivo, demonstrações ou showcases.
      </p>
    </div>
  );
};

export default Live;
