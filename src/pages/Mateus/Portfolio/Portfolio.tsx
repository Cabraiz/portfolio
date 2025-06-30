import React, { useLayoutEffect, useRef } from "react";
import styles from "./Portfolio.module.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLenis } from "lenis/react";

import imagem1 from "../../../assets/Mateus/portfolio/imagem1.png";
import imagem2 from "../../../assets/Mateus/portfolio/imagem2.png";
import imagem3 from "../../../assets/Mateus/portfolio/imagem3.png";
import imagem4 from "../../../assets/Mateus/portfolio/imagem4.png";
import imagem5 from "../../../assets/Mateus/portfolio/imagem5.png";

gsap.registerPlugin(ScrollTrigger);

const portfolioData = {
  S: [
    { name: "ERP VAREJO", image: imagem1, aspectRatio: "16 / 9" },
    { name: "APP BANK", image: imagem2, aspectRatio: "16 / 9" },
  ],
  A: [
    { name: "APP BARBER", image: imagem3, aspectRatio: "16 / 9" },
    { name: "SITE ADV", image: imagem4, aspectRatio: "16 / 9" },
  ],
  B: [{ name: "SITE CABELEIREIRA", image: imagem5, aspectRatio: "16 / 9" }],
};

const Portfolio: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const lenis = useLenis();

  useLayoutEffect(() => {
    if (!containerRef.current || !lenis?.rootElement) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        containerRef.current,
        {
          opacity: 0,
          y: 30,
          filter: "blur(4px)",
        },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: containerRef.current,
            scroller: lenis.rootElement,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      );
    });

    return () => ctx.revert();
  }, [lenis]);

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <div className={styles.container}>
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

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "clamp(1rem, 3vw, 2rem)",
                alignItems: "center",
              }}
            >
              {items.map((item) => (
                <div
                  key={item.name}
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "16px",
                    padding: "0",
                    height: "20vh",
                    aspectRatio: item.aspectRatio,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    textAlign: "center",
                    overflow: "hidden",
                    backdropFilter: "blur(16px)",
                    boxShadow:
                      "0 8px 24px rgba(0,0,0,0.2), inset 0 0 8px rgba(255,255,255,0.04)",
                    transition: "transform 0.35s ease, box-shadow 0.35s ease",
                    willChange: "transform, box-shadow",
                    cursor: "pointer",
                    position: "relative",
                    width: "min(90%, 800px)", // opcional: limitar largura máxima
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget;
                    el.style.transform = "translateY(-8px) scale(1.02)";
                    el.style.boxShadow =
                      "0 12px 28px rgba(255,255,255,0.15), inset 0 0 16px rgba(255,255,255,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget;
                    el.style.transform = "none";
                    el.style.boxShadow =
                      "0 8px 24px rgba(0,0,0,0.2), inset 0 0 8px rgba(255,255,255,0.04)";
                  }}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      bottom: "0",
                      width: "100%",
                      background: "rgba(0,0,0,0.5)",
                      padding: "0.5rem",
                      color: "#eee",
                      fontWeight: 600,
                      fontSize: "1rem",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Portfolio;
