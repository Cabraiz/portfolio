import React, { useEffect, useRef } from "react";
import gsap from "gsap";

import styles from "./Portfolio.module.css";

import imagem1 from "../../../assets/Mateus/portfolio/imagem1.png";
import imagem2 from "../../../assets/Mateus/portfolio/imagem2.png";
import imagem3 from "../../../assets/Mateus/portfolio/imagem3.png";
import imagem4 from "../../../assets/Mateus/portfolio/imagem4.png";
import imagem5 from "../../../assets/Mateus/portfolio/imagem5.png";

const portfolioData = {
  S: [
    { name: "Projeto Ultra Luxo 1", image: imagem1 },
    { name: "Projeto Ultra Luxo 2", image: imagem2 },
  ],
  A: [
    { name: "Projeto Premium 1", image: imagem3 },
    { name: "Projeto Premium 2", image: imagem4 },
  ],
  B: [{ name: "Projeto Básico 1", image: imagem5 }],
};

const Portfolio: React.FC<{ isActive: boolean }> = ({ isActive }) => {
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
      className={styles.container}
      ref={containerRef}
      style={{ opacity: 0, filter: "blur(4px)", transform: "translateY(40px)" }}
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
  );
};

export default Portfolio;
