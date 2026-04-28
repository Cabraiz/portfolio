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

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

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

function getRootShift(runtime: HomeDriveRuntimeState): number {
  return (
    runtime.laneOffset * -7 +
    runtime.parallaxPx * 0.42 +
    runtime.horizonShiftPx * 0.18
  );
}

function getLightHorizontal(
  item: RoadsideLight,
  runtime: HomeDriveRuntimeState,
): number {
  const horizontalBase = item.side === "left" ? 18 : 82;
  const sideDirection = item.side === "left" ? -1 : 1;

  const laneParallax = runtime.laneOffset * -5.4;
  const steeringParallax = runtime.steering * -4.2 * item.depth;
  const roadDrift = runtime.roadDriftPx * 0.035 * sideDirection;

  return clampNumber(
    horizontalBase + item.offset + laneParallax + steeringParallax + roadDrift,
    4,
    96,
  );
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
      transform: `translateX(${getRootShift(runtime)}px)`,
      transition: "transform 120ms linear",
      pointerEvents: "none",
      zIndex: 2,
    };
  }, [runtime]);

  return (
    <div
      className={className}
      data-home-drive-roadside="true"
      data-home-drive-roadside-steering={runtime.steering.toFixed(3)}
      data-home-drive-roadside-lane-offset={runtime.laneOffset.toFixed(3)}
      style={rootStyle}
    >
      {lights.map((item) => {
        const scale = 0.22 + item.depth * 0.86;
        const opacity =
          0.08 +
          item.depth * 0.42 +
          runtime.steeringIntensity * item.depth * 0.08;
        const bottom = 30 + item.depth * 34;
        const horizontal = getLightHorizontal(item, runtime);

        return (
          <div
            key={item.id}
            style={{
              position: "absolute",
              left: `${horizontal}%`,
              bottom: `${bottom}%`,
              transform: `translateX(-50%) scale(${scale})`,
              transformOrigin: "center bottom",
              opacity: clampNumber(opacity, 0.08, 0.62),
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
                  opacity: 0.18 + runtime.steeringIntensity * 0.04,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
