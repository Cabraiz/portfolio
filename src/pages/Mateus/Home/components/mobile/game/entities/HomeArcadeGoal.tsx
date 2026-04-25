import React, { useMemo, type CSSProperties } from "react";

export type HomeArcadeGoalProps = Readonly<{
  x: number;
  y: number;
  width?: number;
  height?: number;
  active?: boolean;
  className?: string;
}>;

export default function HomeArcadeGoal({
  x,
  y,
  width = 76,
  height = 120,
  active = false,
  className,
}: HomeArcadeGoalProps) {
  const rootStyle = useMemo<CSSProperties>(() => {
    return {
      position: "absolute",
      left: `${x}px`,
      top: `${y}px`,
      width: `${width}px`,
      height: `${height}px`,
      zIndex: 3,
      pointerEvents: "none",
      filter:
        "drop-shadow(0 14px 24px rgba(0, 0, 0, 0.24)) drop-shadow(0 0 24px rgba(90, 238, 255, 0.18))",
    };
  }, [height, width, x, y]);

  const poleStyle = useMemo<CSSProperties>(() => {
    return {
      position: "absolute",
      left: "12%",
      top: "8%",
      bottom: "4%",
      width: "10px",
      borderRadius: "999px",
      background:
        "linear-gradient(180deg, rgba(230,240,255,0.96) 0%, rgba(118,138,180,0.92) 100%)",
      boxShadow:
        "0 0 0 1px rgba(255,255,255,0.06) inset, 0 0 18px rgba(124, 220, 255, 0.14)",
    };
  }, []);

  const ringStyle = useMemo<CSSProperties>(() => {
    return {
      position: "absolute",
      right: "6%",
      top: "14%",
      width: "52%",
      aspectRatio: "1",
      borderRadius: "999px",
      border: active
        ? "2px solid rgba(255, 221, 106, 0.92)"
        : "2px solid rgba(122, 224, 255, 0.86)",
      background: active
        ? "radial-gradient(circle, rgba(255, 219, 92, 0.22) 0%, rgba(255,255,255,0) 68%)"
        : "radial-gradient(circle, rgba(122, 224, 255, 0.18) 0%, rgba(255,255,255,0) 68%)",
      boxShadow: active
        ? "0 0 22px rgba(255, 213, 84, 0.28), inset 0 0 18px rgba(255, 226, 136, 0.12)"
        : "0 0 22px rgba(122, 224, 255, 0.22), inset 0 0 18px rgba(122, 224, 255, 0.10)",
    };
  }, [active]);

  const coreStyle = useMemo<CSSProperties>(() => {
    return {
      position: "absolute",
      inset: "22%",
      borderRadius: "999px",
      background: active
        ? "radial-gradient(circle, rgba(255,250,214,1) 0%, rgba(255,219,92,0.96) 42%, rgba(255,255,255,0) 100%)"
        : "radial-gradient(circle, rgba(245,252,255,1) 0%, rgba(122,224,255,0.96) 42%, rgba(255,255,255,0) 100%)",
      filter: "blur(1px)",
    };
  }, [active]);

  const flagStyle = useMemo<CSSProperties>(() => {
    return {
      position: "absolute",
      left: "22%",
      top: "14%",
      width: "34%",
      height: "24%",
      clipPath: "polygon(0 0, 100% 18%, 64% 54%, 100% 100%, 0 86%)",
      background: active
        ? "linear-gradient(180deg, rgba(255, 223, 108, 0.96) 0%, rgba(255, 154, 66, 0.94) 100%)"
        : "linear-gradient(180deg, rgba(122, 224, 255, 0.96) 0%, rgba(118, 114, 255, 0.92) 100%)",
      boxShadow:
        "0 0 16px rgba(255,255,255,0.10), inset 0 1px 0 rgba(255,255,255,0.18)",
      transform: active ? "translateX(2px)" : "translateX(0)",
      transition: "transform 180ms ease, box-shadow 180ms ease",
    };
  }, [active]);

  const baseGlowStyle = useMemo<CSSProperties>(() => {
    return {
      position: "absolute",
      left: "2%",
      right: "2%",
      bottom: "-6%",
      height: "22%",
      borderRadius: "999px",
      background: active
        ? "radial-gradient(circle, rgba(255, 215, 92, 0.26) 0%, rgba(255,255,255,0) 74%)"
        : "radial-gradient(circle, rgba(122, 224, 255, 0.20) 0%, rgba(255,255,255,0) 74%)",
      filter: "blur(10px)",
      opacity: 0.9,
    };
  }, [active]);

  return (
    <div className={className} style={rootStyle} aria-hidden="true">
      <div style={poleStyle} />
      <div style={flagStyle} />
      <div style={ringStyle}>
        <div style={coreStyle} />
      </div>
      <div style={baseGlowStyle} />
    </div>
  );
}
