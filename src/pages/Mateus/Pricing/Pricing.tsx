import React, { useEffect, useRef, useState } from "react";

interface PricingProps {
  isActive: boolean;
}

const Pricing: React.FC<PricingProps> = ({ isActive }) => {
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
      <h1 style={{ fontSize: "4vw" }}>Pricing</h1>
      <p style={{ opacity: 0.6, fontSize: "1.2vw" }}>
        Detalhes dos planos, preços e o que cada pacote oferece.
      </p>
    </div>
  );
};

export default Pricing;
