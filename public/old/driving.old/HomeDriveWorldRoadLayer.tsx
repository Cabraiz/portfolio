import React, { useMemo, type CSSProperties } from "react";

import type { HomeDriveRuntimeState } from "./domain/homeDrive.types";
import type { HomeDriveProjectedWorldRoad } from "./domain/homeDrive.worldTypes";
import styles from "./HomeDriveWorldRoadLayer.module.css";

export type HomeDriveWorldRoadLayerProps = Readonly<{
  runtime: HomeDriveRuntimeState;
  projectedRoads: readonly HomeDriveProjectedWorldRoad[];
  className?: string;
}>;

type RoadCssVars = CSSProperties &
  Readonly<{
    "--world-road-x": string;
    "--world-road-bottom": string;
    "--world-road-width": string;
    "--world-road-height": string;
    "--world-road-opacity": number;
    "--world-road-scale": number;
    "--world-road-blur": string;
    "--world-road-skew": string;
    "--world-road-rotate": string;
    "--world-road-z": number;
    "--world-road-steering": number;
  }>;

function buildClassName(...classNames: Array<string | false | undefined>): string {
  return classNames.filter(Boolean).join(" ");
}

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

function getRoadClassName(road: HomeDriveProjectedWorldRoad): string {
  return buildClassName(
    styles.road,
    road.side === "front" && styles.roadFront,
    road.side === "left" && styles.roadLeft,
    road.side === "right" && styles.roadRight,
    road.side === "behind" && styles.roadBehind,
    road.kind === "avenue" && styles.roadAvenue,
    road.kind === "coastal" && styles.roadCoastal,
    road.kind === "street" && styles.roadStreet,
    road.kind === "service" && styles.roadService,
    road.kind === "commercial" && styles.roadCommercial,
    road.kind === "ring" && styles.roadRing,
    road.isIntersectionCandidate && styles.roadIntersection,
  );
}

function getRoadStyle(
  road: HomeDriveProjectedWorldRoad,
  runtime: HomeDriveRuntimeState,
): RoadCssVars {
  return {
    "--world-road-x": `${clampNumber(road.screenXPercent, -20, 120)}%`,
    "--world-road-bottom": `${clampNumber(road.bottomPercent, 0, 100)}%`,
    "--world-road-width": `${clampNumber(road.widthPercent, 2, 80)}%`,
    "--world-road-height": `${clampNumber(road.heightPercent, 2, 28)}%`,
    "--world-road-opacity": clampNumber(road.opacity, 0, 1),
    "--world-road-scale": clampNumber(road.scale, 0.1, 2),
    "--world-road-blur": `${clampNumber(road.blurPx, 0, 8)}px`,
    "--world-road-skew": `${clampNumber(road.skewDeg, -42, 42)}deg`,
    "--world-road-rotate": `${clampNumber(road.rotateDeg, -42, 42)}deg`,
    "--world-road-z": Math.round(clampNumber(road.zIndex, 0, 80)),
    "--world-road-steering": clampNumber(runtime.steering, -1, 1),
  };
}

function getTurnGlyph(side: HomeDriveProjectedWorldRoad["side"]): string {
  if (side === "left") {
    return "↰";
  }

  if (side === "right") {
    return "↱";
  }

  if (side === "behind") {
    return "↶";
  }

  return "↑";
}

function shouldShowRoadLabel(road: HomeDriveProjectedWorldRoad): boolean {
  if (road.distanceMeters > 230) {
    return false;
  }

  return road.isIntersectionCandidate || road.side === "front";
}

export default function HomeDriveWorldRoadLayer({
  runtime,
  projectedRoads,
  className,
}: HomeDriveWorldRoadLayerProps) {
  const visibleRoads = useMemo(() => {
    return [...projectedRoads]
      .filter((road) => road.opacity > 0.04)
      .sort((a, b) => a.zIndex - b.zIndex)
      .slice(0, 22);
  }, [projectedRoads]);

  if (visibleRoads.length === 0) {
    return null;
  }

  return (
    <div
      className={buildClassName(styles.root, className)}
      data-home-drive-world-road-layer="true"
      data-home-drive-world-road-count={visibleRoads.length}
      data-home-drive-current-road={runtime.currentRoadId ?? "none"}
      data-home-drive-current-district={runtime.currentDistrictId ?? "none"}
      aria-hidden="true"
    >
      <div className={styles.horizonGrid} />

      {visibleRoads.map((road) => {
        const showLabel = shouldShowRoadLabel(road);

        return (
          <div
            key={road.id}
            className={getRoadClassName(road)}
            style={getRoadStyle(road, runtime)}
            data-road-id={road.roadId}
            data-road-side={road.side}
            data-road-kind={road.kind}
          >
            <div className={styles.roadShadow} />
            <div className={styles.roadBody}>
              <div className={styles.roadEdgeLeft} />
              <div className={styles.roadEdgeRight} />
              <div className={styles.roadCenterLine} />
              <div className={styles.roadSheen} />
            </div>

            {showLabel ? (
              <div className={styles.roadLabel}>
                <span className={styles.roadGlyph}>{getTurnGlyph(road.side)}</span>
                <span className={styles.roadName}>{road.roadLabel}</span>
              </div>
            ) : null}
          </div>
        );
      })}

      {runtime.intersectionAhead ? (
        <div
          className={styles.intersectionBeacon}
          data-turn-side={runtime.intersectionAhead.turnSide}
        >
          <span className={styles.intersectionGlyph}>
            {runtime.intersectionAhead.turnSide === "left"
              ? "↰"
              : runtime.intersectionAhead.turnSide === "right"
                ? "↱"
                : runtime.intersectionAhead.turnSide === "behind"
                  ? "↶"
                  : "↑"}
          </span>
          <span className={styles.intersectionName}>
            {runtime.intersectionAhead.targetRoadLabel}
          </span>
        </div>
      ) : null}
    </div>
  );
}
