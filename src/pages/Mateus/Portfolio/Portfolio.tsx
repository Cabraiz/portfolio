import React, { useEffect, useRef, useState } from "react";
import styles from "./Portfolio.module.css";

import imagem1 from "../../../assets/Mateus/portfolio/imagem1.png";
import imagem2 from "../../../assets/Mateus/portfolio/imagem2.png";
import imagem3 from "../../../assets/Mateus/portfolio/imagem3.png";
import imagem4 from "../../../assets/Mateus/portfolio/imagem4.png";
import imagem5 from "../../../assets/Mateus/portfolio/imagem5.png";

interface PortfolioProps {
  isActive: boolean;
}

const portfolioData = {
  S: [
    { name: ".", image: imagem1 },
    { name: ".", image: imagem2 },
  ],
  A: [
    { name: ".", image: imagem3 },
    { name: ".", image: imagem4 },
  ],
  B: [{ name: ".", image: imagem5 }],
};

const Portfolio: React.FC<PortfolioProps> = ({ isActive }) => {
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
      style={{ position: "relative" }}
    >
      <div
        className={styles.container}
        style={{
          opacity: isActive ? 1 : 0.01, // nunca zera 100%
          transform: isActive ? "translateY(0)" : "translateY(30px)",
          filter: isActive ? "blur(0px)" : "blur(4px)",
          transition: "opacity 0.6s ease-out, transform 0.6s ease-out, filter 0.6s ease-out",
          willChange: "transform, opacity, filter",
          pointerEvents: isActive ? "auto" : "none",
          userSelect: isActive ? "auto" : "none",
        }}
      >
        {Object.entries(portfolioData).map(([tier, items]) => (
          <div key={tier} className={styles.tier}>
            <h2
              className={`${styles.tierTitle} ${
                tier === "S"
                  ? styles.tierS
                  : tier === "A"
                  ? styles.tierA
                  : styles.tierB
              }`}
            >
              {tier} Tier
            </h2>

            <div className={styles.cards}>
              {items.map((item) => (
                <div key={item.name} className={styles.card}>
                  <img
                    src={item.image}
                    alt={item.name}
                    className={styles.cardImage}
                  />
                  <span className={styles.cardName}>{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 🔒 Camada de bloqueio invisível */}
      {!isActive && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "transparent",
            zIndex: 999,
            pointerEvents: "auto",
          }}
        />
      )}
    </div>
  );
};

export default Portfolio;
