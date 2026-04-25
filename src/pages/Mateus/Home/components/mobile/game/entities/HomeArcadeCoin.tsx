import React, { useMemo, type CSSProperties } from "react";

import { getHomeArcadeSprite } from "../homeArcade.sprites";
import type { HomeArcadeCoinState } from "../domain/homeArcade.types";

export type HomeArcadeCoinProps = Readonly<{
  coin: Pick<HomeArcadeCoinState, "x" | "y" | "size">;
  className?: string;
}>;

export default function HomeArcadeCoin({
  coin,
  className,
}: HomeArcadeCoinProps) {
  const rootStyle = useMemo<CSSProperties>(() => {
    return {
      position: "absolute",
      left: `${coin.x}px`,
      top: `${coin.y}px`,
      width: `${coin.size}px`,
      height: `${coin.size}px`,
      zIndex: 3,
      pointerEvents: "none",
      filter:
        "drop-shadow(0 0 16px rgba(255, 193, 32, 0.30)) drop-shadow(0 6px 12px rgba(0, 0, 0, 0.18))",
    };
  }, [coin.size, coin.x, coin.y]);

  const auraStyle = useMemo<CSSProperties>(() => {
    return {
      position: "absolute",
      inset: "-30%",
      zIndex: 0,
      borderRadius: "999px",
      pointerEvents: "none",
      background:
        "radial-gradient(circle, rgba(255, 225, 92, 0.34) 0%, rgba(255, 179, 30, 0.12) 42%, rgba(255,255,255,0) 74%)",
      filter: "blur(6px)",
      opacity: 0.94,
    };
  }, []);

  const spriteStyle = useMemo<CSSProperties>(() => {
    return {
      position: "relative",
      zIndex: 1,
      width: "100%",
      height: "100%",
      display: "block",
      objectFit: "contain",
      userSelect: "none",
      WebkitUserDrag: "none",
    };
  }, []);

  const sparkleStyle = useMemo<CSSProperties>(() => {
    return {
      position: "absolute",
      top: "6%",
      left: "16%",
      zIndex: 2,
      width: "28%",
      height: "28%",
      borderRadius: "999px",
      pointerEvents: "none",
      background:
        "radial-gradient(circle, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.22) 48%, rgba(255,255,255,0) 100%)",
      filter: "blur(1px)",
      opacity: 0.9,
    };
  }, []);

  return (
    <div className={className} style={rootStyle} aria-hidden="true">
      <div style={auraStyle} />
      <img
        src={getHomeArcadeSprite("coinGlyph")}
        alt=""
        style={spriteStyle}
        draggable={false}
      />
      <div style={sparkleStyle} />
    </div>
  );
}
