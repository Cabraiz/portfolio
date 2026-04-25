import React, { useMemo, type CSSProperties } from "react";

import type { HomeDriveRouteSegment } from "./domain/homeDrive.fortalezaRoute";
import { getLandmarkScreenPlacement } from "./domain/homeDrive.helpers";
import type {
  HomeDriveRuntimeState,
  HomeDriveVisibleLandmark,
} from "./domain/homeDrive.types";

export type HomeDriveLandmarkLayerProps = Readonly<{
  runtime: HomeDriveRuntimeState;
  visibleLandmarks: readonly HomeDriveVisibleLandmark[];
  routeSegment: HomeDriveRouteSegment;
  className?: string;
}>;

function getLandmarkPalette(
  routeSegment: HomeDriveRouteSegment,
): Readonly<{
  cardBorder: string;
  labelBackground: string;
  labelText: string;
  glow: string;
}> {
  switch (routeSegment.ambience) {
    case "coast":
      return {
        cardBorder: "rgba(255, 220, 168, 0.12)",
        labelBackground: "rgba(6, 10, 14, 0.56)",
        labelText: "#f5ead6",
        glow: "rgba(255, 196, 126, 0.12)",
      };
    case "nightlife":
      return {
        cardBorder: "rgba(255, 168, 118, 0.12)",
        labelBackground: "rgba(14, 8, 12, 0.56)",
        labelText: "#f7e4da",
        glow: "rgba(255, 146, 102, 0.12)",
      };
    case "stadium":
      return {
        cardBorder: "rgba(204, 180, 255, 0.12)",
        labelBackground: "rgba(12, 10, 18, 0.58)",
        labelText: "#efe7ff",
        glow: "rgba(180, 146, 255, 0.12)",
      };
    default:
      return {
        cardBorder: "rgba(255, 255, 255, 0.1)",
        labelBackground: "rgba(8, 8, 10, 0.58)",
        labelText: "#f7f2e8",
        glow: "rgba(255, 190, 102, 0.1)",
      };
  }
}

function getLandmarkShapeStyle(color: string): CSSProperties {
  return {
    borderRadius: "10px 10px 8px 8px",
    background: `linear-gradient(180deg, ${color}, rgba(18,18,22,0.94))`,
  };
}

export default function HomeDriveLandmarkLayer({
  runtime,
  visibleLandmarks,
  routeSegment,
  className,
}: HomeDriveLandmarkLayerProps) {
  const palette = useMemo(() => getLandmarkPalette(routeSegment), [routeSegment]);

  const rootStyle = useMemo<CSSProperties>(() => {
    return {
      position: "absolute",
      inset: 0,
      zIndex: 3,
      pointerEvents: "none",
      transform: `translateX(${runtime.laneOffset * -3}px)`,
      transition: "transform 160ms linear",
    };
  }, [runtime.laneOffset]);

  return (
    <div className={className} style={rootStyle}>
      {visibleLandmarks.slice(0, 2).map((item, index) => {
        const placement = getLandmarkScreenPlacement(
          item.relativeMeters,
          runtime.laneOffset,
          index,
        );

        const markerWidth = 30 + placement.scale * 4;
        const markerHeight = 44 + placement.scale * 8;
        const opacity = Math.min(0.72, placement.opacity * 0.78);
        const horizontal =
          placement.side === "left"
            ? Math.max(12, placement.horizontal + 4)
            : Math.min(88, placement.horizontal - 4);
        const bottom = Math.max(34, placement.bottom - 2);

        return (
          <div
            key={item.id}
            style={{
              position: "absolute",
              left: `${horizontal}%`,
              bottom: `${bottom}%`,
              transform: `translateX(-50%) scale(${Math.min(0.92, placement.scale)})`,
              transformOrigin: "center bottom",
              opacity,
            }}
          >
            <div
              style={{
                position: "relative",
                width: markerWidth,
                display: "grid",
                justifyItems: "center",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  bottom: 6,
                  width: markerWidth * 1.35,
                  height: 14,
                  borderRadius: 999,
                  background: palette.glow,
                  filter: "blur(10px)",
                }}
              />

              <div
                style={{
                  position: "relative",
                  width: markerWidth,
                  height: markerHeight,
                  boxShadow:
                    "0 12px 22px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.05)",
                  border: `1px solid ${palette.cardBorder}`,
                  ...getLandmarkShapeStyle(item.color),
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.1), transparent 32%, rgba(0,0,0,0.2) 100%)",
                    pointerEvents: "none",
                  }}
                />
              </div>

              <div
                style={{
                  marginTop: 6,
                  padding: "5px 7px",
                  borderRadius: 10,
                  border: `1px solid ${palette.cardBorder}`,
                  background: palette.labelBackground,
                  backdropFilter: "blur(8px)",
                  boxShadow: "0 8px 14px rgba(0,0,0,0.16)",
                  whiteSpace: "nowrap",
                  display: "grid",
                  gap: 1,
                  justifyItems: "start",
                }}
              >
                <strong
                  style={{
                    fontSize: 9,
                    lineHeight: 1.1,
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: palette.labelText,
                  }}
                >
                  {item.label}
                </strong>

                <span
                  style={{
                    fontSize: 8,
                    lineHeight: 1.2,
                    color: "rgba(247,242,232,0.62)",
                  }}
                >
                  {item.district}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
