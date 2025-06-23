import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import styles from "./Portfolio.module.css";

import imagem1 from "../../../assets/Mateus/portfolio/imagem1.png";
import imagem2 from "../../../assets/Mateus/portfolio/imagem2.png";
import imagem3 from "../../../assets/Mateus/portfolio/imagem3.png";
import imagem4 from "../../../assets/Mateus/portfolio/imagem4.png";
import imagem5 from "../../../assets/Mateus/portfolio/imagem5.png";

gsap.registerPlugin(ScrollTrigger);

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

const Portfolio: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tiers = gsap.utils.toArray(`.${styles.tier}`);
      const cards = gsap.utils.toArray(`.${styles.card}`);

      gsap.from(tiers, {
        opacity: 0,
        y: 80,
        duration: 1,
        stagger: 0.3,
        scrollTrigger: {
          trigger: `.${styles.tier}`,
          start: "top 80%",
          toggleActions: "play none none reverse",
        },
      });

      gsap.from(cards, {
        opacity: 0,
        y: 50,
        duration: 0.8,
        stagger: 0.2,
        scrollTrigger: {
          trigger: `.${styles.cards}`,
          start: "top 85%",
          toggleActions: "play none none reverse",
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className={styles.container} ref={containerRef}>
      <h1 className={styles.title}>Portfolio</h1>

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
