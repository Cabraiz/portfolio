import React, { useMemo, type CSSProperties } from "react";

export type HomeArcadePlatformVariant = "ground" | "floating" | "boost";

export type HomeArcadePlatformProps = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
  variant?: HomeArcadePlatformVariant;
  className?: string;
}>;

export default function HomeArcadePlatform({
  x,
  y,
  width,
  height,
  variant = "floating",
  className,
}: HomeArcadePlatformProps) {
  const rootStyle = useMemo<CSSProperties>(() => {
    return {
      position: "absolute",
      left: `${x}px`,
      top: `${y}px`,
      width: `${width}px`,
      height: `${height}px`,
      zIndex: variant === "ground" ? 1 : 2,
      pointerEvents: "none",
      filter:
        variant === "boost"
          ? "drop-shadow(0 0 18px rgba(255, 98, 203, 0.18)) drop-shadow(0 10px 18px rgba(0, 0, 0, 0.20))"
          : "drop-shadow(0 10px 18px rgba(0, 0, 0, 0.20))",
    };
  }, [height, variant, width, x, y]);

  const bodyStyle = useMemo<CSSProperties>(() => {
    const background =
      variant === "ground"
        ? "linear-gradient(180deg, rgba(66,54,88,0.98) 0%, rgba(25,21,33,1) 100%)"
        : variant === "boost"
          ? "linear-gradient(180deg, rgba(255, 102, 194, 0.34) 0%, rgba(87, 40, 126, 0.94) 100%)"
          : "linear-gradient(180deg, rgba(98, 121, 255, 0.28) 0%, rgba(36, 26, 72, 0.96) 100%)";

    const border =
      variant === "ground"
        ? "1px solid rgba(255, 214, 82, 0.34)"
        : variant === "boost"
          ? "1px solid rgba(255, 144, 215, 0.42)"
          : "1px solid rgba(162, 179, 255, 0.34)";

    return {
      position: "relative",
      width: "100%",
      height: "100%",
      borderRadius: variant === "ground" ? "14px 14px 0 0" : "16px",
      overflow: "hidden",
      background,
      border,
      boxShadow:
        "inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -8px 18px rgba(0,0,0,0.18)",
      boxSizing: "border-box",
    };
  }, [variant]);

  const topEdgeStyle = useMemo<CSSProperties>(() => {
    const color =
      variant === "ground"
        ? "rgba(255, 214, 82, 0.74)"
        : variant === "boost"
          ? "rgba(255, 166, 224, 0.86)"
          : "rgba(122, 224, 255, 0.82)";

    return {
      position: "absolute",
      inset: "0 0 auto 0",
      height: "3px",
      background: color,
      boxShadow: `0 0 12px ${color}`,
      opacity: 0.92,
    };
  }, [variant]);

  const gridStyle = useMemo<CSSProperties>(() => {
    return {
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
      background:
        "linear-gradient(90deg, rgba(255,255,255,0.00) 0 18px, rgba(255,255,255,0.06) 18px 19px, rgba(255,255,255,0.00) 19px 100%), linear-gradient(180deg, rgba(255,255,255,0.05) 0 1px, rgba(255,255,255,0.00) 1px 100%)",
      opacity: variant === "ground" ? 0.22 : 0.34,
    };
  }, [variant]);

  const undersideStyle = useMemo<CSSProperties>(() => {
    return {
      position: "absolute",
      left: "8%",
      right: "8%",
      bottom: "-22%",
      height: "34%",
      borderRadius: "999px",
      background:
        variant === "boost"
          ? "radial-gradient(circle, rgba(255, 102, 194, 0.28) 0%, rgba(255,255,255,0) 72%)"
          : "radial-gradient(circle, rgba(122, 224, 255, 0.18) 0%, rgba(255,255,255,0) 72%)",
      filter: "blur(8px)",
      opacity: 0.85,
      pointerEvents: "none",
    };
  }, [variant]);

  return (
    <div className={className} style={rootStyle} aria-hidden="true">
      <div style={bodyStyle}>
        <div style={topEdgeStyle} />
        <div style={gridStyle} />
      </div>
      <div style={undersideStyle} />
    </div>
  );
}
