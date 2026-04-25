import React, { useMemo, type CSSProperties } from "react";

import { getHomeArcadeSprite } from "../homeArcade.sprites";
import type { HomeArcadeHazardState } from "../domain/homeArcade.types";

export type HomeArcadeEnemyProps = Readonly<{
  hazard: Pick<HomeArcadeHazardState, "x" | "y" | "width" | "height" | "hue">;
  className?: string;
}>;

export default function HomeArcadeEnemy({
  hazard,
  className,
}: HomeArcadeEnemyProps) {
  const isTall = hazard.height > hazard.width;
  const spriteSrc = isTall
    ? getHomeArcadeSprite("crystalTall")
    : getHomeArcadeSprite("spikeWide");

  const rootStyle = useMemo<CSSProperties>(() => {
    return {
      position: "absolute",
      left: `${hazard.x}px`,
      top: `${hazard.y}px`,
      width: `${hazard.width}px`,
      height: `${hazard.height}px`,
      zIndex: 3,
      pointerEvents: "none",
      filter: `drop-shadow(0 10px 18px rgba(0, 0, 0, 0.26)) drop-shadow(0 0 18px hsla(${hazard.hue}, 92%, 62%, 0.22))`,
      transform: isTall ? "translateY(-1px)" : "none",
    };
  }, [hazard.height, hazard.hue, hazard.width, hazard.x, hazard.y, isTall]);

  const spriteStyle = useMemo<CSSProperties>(() => {
    return {
      position: "relative",
      zIndex: 1,
      width: "100%",
      height: "100%",
      display: "block",
      objectFit: "fill",
      userSelect: "none",
      WebkitUserDrag: "none",
    };
  }, []);

  const glowStyle = useMemo<CSSProperties>(() => {
    return {
      position: "absolute",
      inset: isTall ? "-12% -18%" : "-16% -10%",
      zIndex: 0,
      pointerEvents: "none",
      borderRadius: isTall ? "18px" : "14px",
      background: isTall
        ? `radial-gradient(circle at 50% 40%, hsla(${hazard.hue}, 100%, 68%, 0.34) 0%, hsla(${hazard.hue}, 96%, 58%, 0.14) 38%, rgba(255,255,255,0) 76%)`
        : `radial-gradient(circle at 50% 50%, hsla(${hazard.hue}, 100%, 66%, 0.30) 0%, hsla(${hazard.hue}, 96%, 56%, 0.12) 42%, rgba(255,255,255,0) 74%)`,
      filter: "blur(10px)",
      opacity: 0.92,
    };
  }, [hazard.hue, isTall]);

  const shineStyle = useMemo<CSSProperties>(() => {
    return {
      position: "absolute",
      inset: 0,
      zIndex: 2,
      pointerEvents: "none",
      background: isTall
        ? "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.00) 24%, rgba(255,255,255,0.00) 64%, rgba(0,0,0,0.16) 100%)"
        : "linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.00) 36%, rgba(0,0,0,0.10) 100%)",
      mixBlendMode: "screen",
      opacity: 0.78,
    };
  }, [isTall]);

  return (
    <div className={className} style={rootStyle} aria-hidden="true">
      <div style={glowStyle} />
      <img src={spriteSrc} alt="" style={spriteStyle} draggable={false} />
      <div style={shineStyle} />
    </div>
  );
}
