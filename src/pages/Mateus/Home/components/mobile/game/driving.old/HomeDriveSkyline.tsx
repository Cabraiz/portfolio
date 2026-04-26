import React, { useMemo, type CSSProperties } from "react";

import type { HomeDriveRouteSegment } from "./domain/homeDrive.fortalezaRoute";
import type { HomeDriveSkylineBar } from "./domain/homeDrive.types";

export type HomeDriveSkylineProps = Readonly<{
  routeSegment: HomeDriveRouteSegment;
  skylineBars?: readonly HomeDriveSkylineBar[];
  environmentShift?: number;
  className?: string;
}>;

const FALLBACK_SKYLINE_BARS: readonly HomeDriveSkylineBar[] = [
  { id: "bar-0", height: 18, width: 5 },
  { id: "bar-1", height: 37, width: 6 },
  { id: "bar-2", height: 56, width: 7 },
  { id: "bar-3", height: 33, width: 8 },
  { id: "bar-4", height: 52, width: 9 },
  { id: "bar-5", height: 29, width: 10 },
  { id: "bar-6", height: 48, width: 5 },
  { id: "bar-7", height: 25, width: 6 },
  { id: "bar-8", height: 44, width: 7 },
  { id: "bar-9", height: 21, width: 8 },
  { id: "bar-10", height: 40, width: 9 },
  { id: "bar-11", height: 59, width: 10 },
] as const;

function getSkylinePalette(routeSegment: HomeDriveRouteSegment): Readonly<{
  glow: string;
  haze: string;
  building: string;
  window: string;
}> {
  switch (routeSegment.ambience) {
    case "coast":
      return {
        glow: "rgba(255, 194, 122, 0.16)",
        haze: "rgba(91, 136, 188, 0.08)",
        building:
          "linear-gradient(180deg, rgba(35,42,54,0.62), rgba(8,10,14,0.92))",
        window: "rgba(255, 220, 168, 0.07)",
      };
    case "nightlife":
      return {
        glow: "rgba(255, 164, 96, 0.16)",
        haze: "rgba(116, 136, 188, 0.08)",
        building:
          "linear-gradient(180deg, rgba(44,31,45,0.62), rgba(10,8,14,0.92))",
        window: "rgba(255, 165, 115, 0.08)",
      };
    case "downtown":
      return {
        glow: "rgba(218, 171, 109, 0.11)",
        haze: "rgba(119, 128, 150, 0.06)",
        building:
          "linear-gradient(180deg, rgba(38,38,42,0.66), rgba(8,8,10,0.94))",
        window: "rgba(255, 240, 184, 0.055)",
      };
    case "academic":
      return {
        glow: "rgba(209, 171, 108, 0.1)",
        haze: "rgba(102, 120, 92, 0.055)",
        building:
          "linear-gradient(180deg, rgba(40,36,32,0.6), rgba(9,8,8,0.93))",
        window: "rgba(255, 229, 174, 0.055)",
      };
    case "residential":
      return {
        glow: "rgba(196, 176, 124, 0.11)",
        haze: "rgba(114, 137, 113, 0.055)",
        building:
          "linear-gradient(180deg, rgba(34,38,37,0.6), rgba(8,10,10,0.93))",
        window: "rgba(255, 230, 175, 0.055)",
      };
    case "stadium":
      return {
        glow: "rgba(175, 126, 255, 0.13)",
        haze: "rgba(122, 118, 182, 0.07)",
        building:
          "linear-gradient(180deg, rgba(33,33,47,0.62), rgba(8,8,12,0.93))",
        window: "rgba(214, 196, 255, 0.06)",
      };
    default:
      return {
        glow: "rgba(255, 190, 102, 0.12)",
        haze: "rgba(100, 120, 144, 0.06)",
        building:
          "linear-gradient(180deg, rgba(31,36,45,0.58), rgba(8,8,10,0.92))",
        window: "rgba(255,255,255,0.045)",
      };
  }
}

function getBuildingHeightMultiplier(
  routeSegment: HomeDriveRouteSegment,
  index: number,
): number {
  const base =
    routeSegment.ambience === "downtown"
      ? 1.08
      : routeSegment.ambience === "coast"
        ? 1
        : routeSegment.ambience === "stadium"
          ? 0.82
          : 0.94;

  const densityBoost = 0.82 + routeSegment.trafficDensity * 0.26;
  const variation = 0.88 + ((index * 17) % 7) * 0.028;

  return base * densityBoost * variation;
}

export default function HomeDriveSkyline({
  routeSegment,
  skylineBars = FALLBACK_SKYLINE_BARS,
  environmentShift = 0,
  className,
}: HomeDriveSkylineProps) {
  const palette = useMemo(() => getSkylinePalette(routeSegment), [routeSegment]);

  const rootStyle = useMemo<CSSProperties>(() => {
    return {
      position: "absolute",
      inset: 0,
      transform: `translateX(${environmentShift * 0.08}px)`,
      transition: "transform 160ms linear",
      pointerEvents: "none",
      zIndex: 1,
    };
  }, [environmentShift]);

  return (
    <div className={className} style={rootStyle}>
      <div
        style={{
          position: "absolute",
          left: "-14%",
          right: "-14%",
          top: "12%",
          height: "26%",
          opacity: 0.42,
          background: `radial-gradient(circle at 50% 44%, ${palette.haze}, transparent 70%)`,
          filter: "blur(26px)",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: "-12%",
          right: "-12%",
          top: "20%",
          height: "12%",
          opacity: 0.32 + routeSegment.horizonGlow * 0.08,
          background: `linear-gradient(180deg, ${palette.glow}, rgba(255,190,102,0))`,
          filter: "blur(22px)",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: "-10%",
          right: "-10%",
          top: "13%",
          height: "17%",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 10,
          opacity: 0.44,
        }}
      >
        {skylineBars.map((bar, index) => {
          const heightMultiplier = getBuildingHeightMultiplier(routeSegment, index);
          const barHeight = `${bar.height * heightMultiplier}%`;
          const barWidth = `${bar.width}%`;

          return (
            <div
              key={bar.id}
              style={{
                position: "relative",
                width: barWidth,
                height: barHeight,
                borderRadius: "10px 10px 0 0",
                background: palette.building,
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.025), 0 8px 18px rgba(0,0,0,0.12)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: `repeating-linear-gradient(
                    90deg,
                    transparent 0 7px,
                    ${palette.window} 7px 8px,
                    transparent 8px 16px
                  )`,
                  opacity: 0.34,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: "30%",
                  background:
                    "linear-gradient(180deg, rgba(0,0,0,0), rgba(0,0,0,0.34) 100%)",
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
