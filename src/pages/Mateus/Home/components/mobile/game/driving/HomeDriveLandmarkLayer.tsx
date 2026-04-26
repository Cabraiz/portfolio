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
  /*
    Combina:
    - escala de profundidade da estrada;
    - escala de aproximação do landmark.

    Mantém limite para não virar um elemento gigante no para-brisa.
  */
  return clampNumber(basePlacementScale * projectionScale, 0.28, 1.22);
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
      transform: `translateX(${runtime.laneOffset * -3}px)`,
      transition: "transform 160ms linear",
    };
  }, [runtime.laneOffset]);

  return (
    <div
      className={className}
      data-home-drive-landmark-layer="true"
      data-home-drive-landmark-ambience={routeSegment.ambience}
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

        const horizontal =
          placement.side === "left"
            ? Math.max(10, placement.horizontal + 4)
            : Math.min(90, placement.horizontal - 4);

        /*
          Mantém o landmark dentro da região do horizonte/rua.
          O movimento fino de aproximação fica no próprio pin via translateY.
        */
        const bottom = clampNumber(placement.bottom - 2, 28, 74);

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
