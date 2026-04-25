import React, { useMemo, type CSSProperties } from "react";

import type { HomeDriveRouteSegment } from "./domain/homeDrive.fortalezaRoute";
import type { HomeDriveRuntimeState } from "./domain/homeDrive.types";

export type HomeDriveRoadsideProps = Readonly<{
  runtime: HomeDriveRuntimeState;
  routeSegment: HomeDriveRouteSegment;
  className?: string;
}>;

type RoadsideLight = Readonly<{
  id: string;
  side: "left" | "right";
  depth: number;
  offset: number;
}>;

function getRoadsideLights(routeSegment: HomeDriveRouteSegment): readonly RoadsideLight[] {
  const density =
    routeSegment.ambience === "downtown"
      ? 7
      : routeSegment.ambience === "nightlife"
        ? 6
        : 5;

  return Array.from({ length: density }).flatMap((_, index) => {
    const depth = 0.14 + index * 0.13;

    return [
      {
        id: `left-light-${index}`,
        side: "left" as const,
        depth,
        offset: index % 2 === 0 ? -1.4 : 0.4,
      },
      {
        id: `right-light-${index}`,
        side: "right" as const,
        depth: Math.min(0.92, depth + 0.055),
        offset: index % 2 === 0 ? 1.2 : -0.2,
      },
    ];
  });
}

function getLightColor(routeSegment: HomeDriveRouteSegment): string {
  if (routeSegment.ambience === "stadium") {
    return "rgba(198, 164, 255, 0.72)";
  }

  if (routeSegment.ambience === "nightlife") {
    return "rgba(255, 174, 124, 0.72)";
  }

  if (routeSegment.ambience === "coast") {
    return "rgba(255, 216, 150, 0.68)";
  }

  return "rgba(228, 202, 148, 0.58)";
}

export default function HomeDriveRoadside({
  runtime,
  routeSegment,
  className,
}: HomeDriveRoadsideProps) {
  const lights = useMemo(() => getRoadsideLights(routeSegment), [routeSegment]);
  const lightColor = useMemo(() => getLightColor(routeSegment), [routeSegment]);

  const rootStyle = useMemo<CSSProperties>(() => {
    return {
      position: "absolute",
      inset: 0,
      transform: `translateX(${runtime.laneOffset * -5}px)`,
      transition: "transform 120ms linear",
      pointerEvents: "none",
      zIndex: 2,
    };
  }, [runtime.laneOffset]);

  return (
    <div className={className} style={rootStyle}>
      {lights.map((item) => {
        const scale = 0.22 + item.depth * 0.86;
        const opacity = 0.08 + item.depth * 0.42;
        const bottom = 30 + item.depth * 34;
        const horizontalBase = item.side === "left" ? 18 : 82;
        const horizontal =
          horizontalBase + item.offset + runtime.laneOffset * (item.side === "left" ? -2 : -2);

        return (
          <div
            key={item.id}
            style={{
              position: "absolute",
              left: `${horizontal}%`,
              bottom: `${bottom}%`,
              transform: `translateX(-50%) scale(${scale})`,
              transformOrigin: "center bottom",
              opacity,
            }}
          >
            <div
              style={{
                position: "relative",
                width: 14,
                height: 44,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  bottom: 0,
                  width: 2,
                  height: "100%",
                  transform: "translateX(-50%)",
                  borderRadius: 999,
                  background:
                    "linear-gradient(180deg, rgba(160,160,150,0.36), rgba(28,28,28,0.08))",
                }}
              />

              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: 3,
                  width: 7,
                  height: 7,
                  transform: "translateX(-50%)",
                  borderRadius: 999,
                  background: lightColor,
                  boxShadow: `0 0 16px ${lightColor}`,
                }}
              />

              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: 0,
                  width: 42,
                  height: 42,
                  transform: "translateX(-50%)",
                  borderRadius: 999,
                  background: lightColor,
                  filter: "blur(18px)",
                  opacity: 0.18,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
