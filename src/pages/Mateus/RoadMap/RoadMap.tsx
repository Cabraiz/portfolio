import React, { useEffect, useRef, useState } from "react";

interface RoadMapProps {
  isActive: boolean;
}

const RoadMap: React.FC<RoadMapProps> = ({ isActive }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isActive) {
      setIsVisible(true);
    } else {
      const timeout = setTimeout(() => setIsVisible(false), 600);
      return () => clearTimeout(timeout);
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
        opacity: isActive ? 1 : 0,
        transform: isActive ? "translateY(0)" : "translateY(40px)",
        filter: isActive ? "blur(0px)" : "blur(4px)",
        transition: "opacity 0.8s ease-out, transform 0.8s ease-out, filter 0.8s ease-out",
        willChange: "transform, opacity, filter",
        visibility: isVisible ? "visible" : "hidden",
        pointerEvents: isActive ? "auto" : "none",
      }}
    >
      <h1 style={{ fontSize: "4vw" }}>RoadMap</h1>
      <p style={{ opacity: 0.6, fontSize: "1.2vw" }}>
        Aqui você pode descrever seu roadmap, marcos, etapas e planos futuros.
      </p>
    </div>
  );
};

export default RoadMap;
