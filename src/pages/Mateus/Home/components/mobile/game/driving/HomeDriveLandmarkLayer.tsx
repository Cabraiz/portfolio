import React, { useMemo, type CSSProperties } from "react";

import type { HomeDriveRouteSegment } from "./domain/homeDrive.fortalezaRoute";
import { getLandmarkScreenPlacement } from "./domain/homeDrive.helpers";
import { projectHomeDriveLandmark } from "./domain/homeDriveLandmarkProjection";
import type {
  HomeDriveRuntimeState,
  HomeDriveVisibleLandmark,
} from "./domain/homeDrive.types";
import HomeDriveMapPin, { type HomeDriveMapPinTone } from "./HomeDriveMapPin";

export type HomeDriveLandmarkLayerProps = Readonly<{
  runtime: HomeDriveRuntimeState;
  visibleLandmarks: readonly HomeDriveVisibleLandmark[];
  routeSegment: HomeDriveRouteSegment;
  className?: string;
}>;

const LANDMARK_PROJECTION_MAX_DISTANCE_METERS = 420;

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

function getPinTone(progress: number): HomeDriveMapPinTone {
  if (progress >= 0.78) {
    return "near";
  }

  if (progress >= 0.48) {
    return "active";
  }

  return "default";
}

function getProjectedPinScale(
  basePlacementScale: number,
  projectionScale: number,
): number {
  return clampNumber(basePlacementScale * projectionScale, 0.28, 1.22);
}

function getLandmarkRootShift(runtime: HomeDriveRuntimeState): number {
  return (
    runtime.laneOffset * -5 +
    runtime.parallaxPx * 0.22 +
    runtime.roadDriftPx * 0.08
  );
}

function getLandmarkHorizontal(
  runtime: HomeDriveRuntimeState,
  placement: ReturnType<typeof getLandmarkScreenPlacement>,
): number {
  const sideBias = placement.side === "left" ? 4 : -4;
  const steeringDrift = runtime.steering * -7;
  const laneDrift = runtime.laneOffset * -4.5;
  const parallaxDrift = runtime.parallaxPx * 0.035;

  const rawHorizontal =
    placement.horizontal + sideBias + steeringDrift + laneDrift + parallaxDrift;

  return clampNumber(rawHorizontal, 8, 92);
}

export default function HomeDriveLandmarkLayer({
  runtime,
  visibleLandmarks,
  routeSegment,
  className,
}: HomeDriveLandmarkLayerProps) {
  const rootStyle = useMemo<CSSProperties>(() => {
    return {
      position: "absolute",
      inset: 0,
      zIndex: 3,
      pointerEvents: "none",
      transform: `translateX(${getLandmarkRootShift(runtime)}px)`,
      transition: "transform 120ms linear",
    };
  }, [runtime]);

  return (
    <div
      className={className}
      data-home-drive-landmark-layer="true"
      data-home-drive-landmark-ambience={routeSegment.ambience}
      data-home-drive-landmark-steering={runtime.steering.toFixed(3)}
      data-home-drive-landmark-lane-offset={runtime.laneOffset.toFixed(3)}
      style={rootStyle}
    >
      {visibleLandmarks.slice(0, 2).map((item, index) => {
        const placement = getLandmarkScreenPlacement(
          item.relativeMeters,
          runtime.laneOffset,
          index,
        );

        const projection = projectHomeDriveLandmark({
          distanceMeters: Math.max(0, item.relativeMeters),
          maxDistanceMeters: LANDMARK_PROJECTION_MAX_DISTANCE_METERS,
        });

        const horizontal = getLandmarkHorizontal(runtime, placement);

        const bottom = clampNumber(
          placement.bottom - 2 + runtime.steeringIntensity * 1.4,
          28,
          76,
        );

        const scale = getProjectedPinScale(
          Math.min(0.92, placement.scale),
          projection.scale,
        );

        const opacity = clampNumber(
          Math.min(0.96, placement.opacity * projection.opacity),
          0,
          1,
        );

        const tone = getPinTone(projection.progress);

        return (
          <div
            key={item.id}
            data-home-drive-landmark={item.id}
            data-home-drive-landmark-progress={projection.progress.toFixed(3)}
            style={{
              position: "absolute",
              left: `${horizontal}%`,
              bottom: `${bottom}%`,
              transform: "translateX(-50%)",
              transformOrigin: "center bottom",
              pointerEvents: "none",
              zIndex: projection.zIndex,
            }}
          >
            <HomeDriveMapPin
              title={item.label}
              subtitle={item.district}
              scale={scale}
              opacity={opacity}
              translateY={projection.translateY}
              blur={projection.blur}
              zIndex={projection.zIndex}
              tone={tone}
            />
          </div>
        );
      })}
    </div>
  );
}
