import React, { useEffect, useMemo, useState } from "react";
import i18n from "@/i18n/i18n";

import { homeHeroTokens } from "../../layout/homeHero.tokens";

export type HeroMarqueeMobileProps = Readonly<{
  className?: string;
  isGameOpen?: boolean;
}>;

function prefersReducedMotion(): boolean {
  return (
    typeof globalThis.matchMedia === "function" &&
    globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export default function HeroMarqueeMobile({
  className,
  isGameOpen = false,
}: HeroMarqueeMobileProps) {
  const currentLanguage = i18n.resolvedLanguage ?? i18n.language ?? "pt";

  const isPT = useMemo(() => {
    return currentLanguage === "pt" || currentLanguage.startsWith("pt");
  }, [currentLanguage]);

  const titles = useMemo(() => {
    if (isPT) {
      return [
        "Engenheiro de Software",
        "Dev Full Stack",
        "Back-End e APIs",
        "Cloud e DevOps",
        "Dev Mobile",
      ];
    }

    return [
      "Software Engineer",
      "Full Stack Dev",
      "Back-End and APIs",
      "Cloud and DevOps",
      "Mobile Dev",
    ];
  }, [isPT]);

  const [index, setIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (prefersReducedMotion() || isGameOpen) {
      return;
    }

    let timeoutId = 0;

    const intervalId = window.setInterval(() => {
      setIsVisible(false);

      timeoutId = window.setTimeout(() => {
        setIndex((prev) => (prev + 1) % titles.length);
        setIsVisible(true);
      }, 140);
    }, 3200);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, [isGameOpen, titles]);

  const containerStyle = useMemo<React.CSSProperties>(() => {
    return {
      width: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "stretch",
      justifyContent: "center",
      gap: "8px",
      boxSizing: "border-box",
      opacity: isGameOpen
        ? homeHeroTokens.mobileGame.marqueeOpacityWhenOpen
        : 1,
      transform: isGameOpen ? "translateY(-1px)" : "translateY(0)",
      transition: "opacity 220ms ease, transform 220ms ease",
    };
  }, [isGameOpen]);

  const seniorStyle = useMemo<React.CSSProperties>(() => {
    return {
      width: "100%",
      margin: 0,
      padding: 0,
      color: "#f1c40f",
      fontSize: "clamp(2rem, 8vw, 2.7rem)",
      fontWeight: 700,
      lineHeight: 0.96,
      letterSpacing: "-0.04em",
      textAlign: "left",
      maxWidth: "100%",
      wordBreak: "break-word",
      boxSizing: "border-box",
      textShadow: "0 2px 10px rgba(0, 0, 0, 0.22)",
    };
  }, []);

  const marqueeShellStyle = useMemo<React.CSSProperties>(() => {
    return {
      width: "100%",
      minWidth: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxSizing: "border-box",
    };
  }, []);

  const marqueeStyle = useMemo<React.CSSProperties>(() => {
    return {
      position: "relative",
      width: "100%",
      minWidth: 0,
      height: "clamp(3rem, 8vw, 3.35rem)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      boxSizing: "border-box",
      paddingInline: "clamp(0.8rem, 3.5vw, 1rem)",
      borderRadius: "10px",
      background:
        "linear-gradient(180deg, rgba(18,18,22,0.96) 0%, rgba(10,10,14,0.985) 100%)",
      borderTop: "1px solid rgba(241, 196, 15, 0.95)",
      borderBottom: "1px solid rgba(241, 196, 15, 0.95)",
      borderLeft: "1px solid rgba(241, 196, 15, 0.16)",
      borderRight: "1px solid rgba(241, 196, 15, 0.16)",
      boxShadow:
        "0 10px 24px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.03)",
      transform: isGameOpen ? "scale(0.994)" : "scale(1)",
      transition:
        "transform 220ms ease, opacity 220ms ease, border-color 220ms ease",
    };
  }, [isGameOpen]);

  const accentGlowStyle = useMemo<React.CSSProperties>(() => {
    return {
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
      background:
        "linear-gradient(90deg, rgba(241,196,15,0.00) 0%, rgba(241,196,15,0.08) 18%, rgba(241,196,15,0.12) 50%, rgba(241,196,15,0.08) 82%, rgba(241,196,15,0.00) 100%)",
      opacity: isGameOpen ? 0.48 : 0.9,
      transition: "opacity 220ms ease",
    };
  }, [isGameOpen]);

  const scanStyle = useMemo<React.CSSProperties>(() => {
    return {
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
      background:
        "linear-gradient(180deg, rgba(255,255,255,0.00) 0%, rgba(255,217,130,0.10) 50%, rgba(255,255,255,0.00) 100%)",
      opacity: isGameOpen ? 0.32 : 0.55,
      transition: "opacity 220ms ease",
    };
  }, [isGameOpen]);

  const titleStyle = useMemo<React.CSSProperties>(() => {
    return {
      position: "relative",
      zIndex: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      height: "100%",
      margin: 0,
      fontSize: "clamp(1rem, 4.5vw, 1.22rem)",
      fontWeight: 700,
      fontFamily: '"Brutal", sans-serif',
      color: "rgba(250, 250, 252, 0.96)",
      textAlign: "center",
      lineHeight: 1,
      letterSpacing: "-0.02em",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      boxSizing: "border-box",
      opacity: isGameOpen ? 0.88 : isVisible ? 1 : 0,
      transform: isGameOpen
        ? "translateY(0)"
        : isVisible
          ? "translateY(0)"
          : "translateY(1px)",
      transition: "opacity 140ms ease, transform 140ms ease",
      textShadow: "0 1px 8px rgba(0, 0, 0, 0.28)",
    };
  }, [isGameOpen, isVisible]);

  return (
    <div className={className} style={containerStyle}>
      <div style={seniorStyle}>Senior</div>

      <div style={marqueeShellStyle}>
        <div style={marqueeStyle}>
          <div style={accentGlowStyle} />
          <div style={scanStyle} />
          <div style={titleStyle}>{titles[index]}</div>
        </div>
      </div>
    </div>
  );
}
