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

import logo1 from "../../../assets/Mateus/portfolio/logos/logo1.png";
import logo2 from "../../../assets/Mateus/portfolio/logos/logo2.png";
import logo3 from "../../../assets/Mateus/portfolio/logos/logo3.png";
import logo4 from "../../../assets/Mateus/portfolio/logos/logo4.png";
import logo5 from "../../../assets/Mateus/portfolio/logos/logo5.png";

gsap.registerPlugin(ScrollTrigger);

const portfolioData = [
  { name: "ERP VAREJO", image: imagem1, date: "2021", logo: logo1 },
  { name: "APP BANK", image: imagem2, date: "2022", logo: logo2 },
  { name: "APP BARBER", image: imagem3, date: "2023", logo: logo3 },
  { name: "SITE ADV", image: imagem4, date: "2020", logo: logo4 },
  { name: "SITE CABELEIREIRA", image: imagem5, date: "2021", logo: logo5 },
];

const Portfolio: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const lenis = useLenis();

  useLayoutEffect(() => {
    if (!containerRef.current || !lenis?.rootElement) return;

    const cards = Array.from(
      containerRef.current.querySelectorAll(".animatedCard")
    ) as HTMLElement[];

    const triggers: ScrollTrigger[] = [];

    cards.forEach((card) => {
      gsap.set(card, {
        height: "20vh",
        scale: 0.95,
        opacity: 0.8,
        boxShadow:
          "0 8px 24px rgba(0,0,0,0.2), inset 0 0 8px rgba(255,255,255,0.04)",
      });

      const trigger = ScrollTrigger.create({
        trigger: card.parentElement,
        scroller: lenis.rootElement,
        start: "center center",
        end: "+=80%",
        pin: true,
        anticipatePin: 1,
        scrub: true,
        onEnter: () => {
          gsap.to(card, {
            height: "60vh",
            width: "70%",
            scale: 1,
            opacity: 1,
            boxShadow:
              "0 24px 48px rgba(0,0,0,0.4), inset 0 0 16px rgba(255,255,255,0.15)",
            duration: 0.4,
            ease: "power3.out",
            overwrite: "auto",
          });
        },
        onEnterBack: () => {
          gsap.to(card, {
            height: "60vh",
            width: "70%",
            scale: 1,
            opacity: 1,
            boxShadow:
              "0 24px 48px rgba(0,0,0,0.4), inset 0 0 16px rgba(255,255,255,0.15)",
            duration: 0.4,
            ease: "power3.out",
            overwrite: "auto",
          });
        },
        onLeave: () => {
          gsap.to(card, {
            height: "20vh",
            width: "40%",
            scale: 0.95,
            opacity: 0.8,
            boxShadow:
              "0 8px 24px rgba(0,0,0,0.2), inset 0 0 8px rgba(255,255,255,0.04)",
            duration: 0.4,
            ease: "power3.inOut",
            overwrite: "auto",
          });
        },
        onLeaveBack: () => {
          gsap.to(card, {
            height: "20vh",
            width: "40%",
            scale: 0.95,
            opacity: 0.8,
            boxShadow:
              "0 8px 24px rgba(0,0,0,0.2), inset 0 0 8px rgba(255,255,255,0.04)",
            duration: 0.4,
            ease: "power3.inOut",
            overwrite: "auto",
          });
        },
      });

      triggers.push(trigger);
    });

    return () => {
      triggers.forEach((t) => t.kill());
    };
  }, [lenis]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        paddingBottom: "300vh",
      }}
    >
      <div className={styles.container} style={{ position: "relative" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "clamp(12rem, 25vh, 16rem)",
            alignItems: "center",
          }}
        >
          {portfolioData.map((item) => (
  <div
    key={item.name}
    style={{
      position: "relative",
      width: "100%",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "20vh",
    }}
  >
    {/* Data do projeto à esquerda */}
    <span
      style={{
        position: "absolute",
        left: "2rem",
        color: "#aaa",
        fontSize: "clamp(0.9rem, 1.5vw, 1.2rem)",
        fontWeight: "400",
      }}
    >
      {item.date}
    </span>

    {/* Card central */}
    <div
      className="animatedCard"
      data-name={item.name}
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "16px",
        padding: "0",
        height: "20vh",
        width: "40%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        overflow: "hidden",
        backdropFilter: "blur(16px)",
        boxShadow:
          "0 8px 24px rgba(0,0,0,0.2), inset 0 0 8px rgba(255,255,255,0.04)",
        transition: "transform 0.35s ease, box-shadow 0.35s ease",
        willChange: "transform, box-shadow",
        cursor: "pointer",
        position: "relative",
      }}
    >
      <img
        src={item.image}
        alt={item.name}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          borderRadius: "8px",
        }}
      />
      <span
        style={{
          position: "absolute",
          bottom: "0.5rem",
          left: "0.5rem",
          color: "#fff",
          fontSize: "clamp(1rem, 2vw, 1.5rem)",
          fontWeight: "500",
          background: "rgba(0,0,0,0.4)",
          padding: "0.2rem 0.6rem",
          borderRadius: "4px",
        }}
      >
        {item.name}
      </span>
    </div>

    {/* Logo da empresa à direita */}
    <img
      src={item.logo}
      alt={`Logo ${item.name}`}
      style={{
        position: "absolute",
        right: "2rem",
        height: "2rem",
        objectFit: "contain",
      }}
    />
  </div>
))}
        </div>
      </div>
    </div>
  );
};

export default Portfolio;
