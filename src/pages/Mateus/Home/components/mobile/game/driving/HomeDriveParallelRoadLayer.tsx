import React, { useMemo, type CSSProperties } from "react";

import type { HomeDriveRouteSegment } from "./domain/homeDrive.fortalezaRoute";
import {
  getHomeDriveParallelRoadsForAmbience,
  projectHomeDriveParallelRoad,
  type HomeDriveProjectedParallelRoad,
} from "./domain/homeDriveRoadNetwork";
import type { HomeDriveRuntimeState } from "./domain/homeDrive.types";
import styles from "./HomeDriveParallelRoadLayer.module.css";

export type HomeDriveParallelRoadLayerProps = Readonly<{
  runtime: HomeDriveRuntimeState;
  routeSegment: HomeDriveRouteSegment;
  className?: string;
}>;

type ParallelRoadCssVars = CSSProperties &
  Readonly<{
    "--home-drive-parallel-road-x": string;
    "--home-drive-parallel-road-bottom": string;
    "--home-drive-parallel-road-scale": number;
    "--home-drive-parallel-road-opacity": number;
    "--home-drive-parallel-road-width": string;
    "--home-drive-parallel-road-length": string;
    "--home-drive-parallel-road-skew": string;
    "--home-drive-parallel-road-drift": string;
    "--home-drive-parallel-road-blur": string;
    "--home-drive-parallel-road-z": number;
  }>;

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

function getRuntimeDistanceMeters(runtime: HomeDriveRuntimeState): number {
  const runtimeRecord = runtime as unknown as Record<string, unknown>;

  const candidates = [
    runtimeRecord.distanceMeters,
    runtimeRecord.routeMeters,
    runtimeRecord.progressMeters,
    runtimeRecord.traveledMeters,
    runtimeRecord.totalMeters,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return Math.max(0, candidate);
    }
  }

  return 0;
}

function buildRootClassName(className?: string): string {
  return [styles.root, className].filter(Boolean).join(" ");
}

function buildRoadClassName(projectedRoad: HomeDriveProjectedParallelRoad): string {
  return [
    styles.roadSlot,
    projectedRoad.road.side === "left" ? styles.sideLeft : styles.sideRight,
    projectedRoad.road.laneCount === 2 ? styles.twoLane : styles.oneLane,
    projectedRoad.road.dashed ? styles.dashed : styles.solid,
    styles[`kind_${projectedRoad.road.kind}` as keyof typeof styles] ?? "",
  ]
    .filter(Boolean)
    .join(" ");
}

function getRoadWidthPct(projectedRoad: HomeDriveProjectedParallelRoad): number {
  const { road, projection } = projectedRoad;
  const baseWidth = projection.widthPct * road.widthWeight;
  const laneBonus = road.laneCount === 2 ? 1.22 : 1;

  /*
    Mantém a rua lateral estreita para parecer decalque no chão.
  */
  return clampNumber(baseWidth * laneBonus, 4, 28);
}

function getRoadLengthPx(projectedRoad: HomeDriveProjectedParallelRoad): number {
  const { road, projection } = projectedRoad;

  /*
    Antes era 148/126 e parecia um retângulo vertical.
    Agora é achatado e curto para ler como rua no chão.
  */
  const baseLength = road.laneCount === 2 ? 96 : 78;

  return clampNumber(baseLength * projection.scale, 28, 96);
}

function buildRoadStyle(
  projectedRoad: HomeDriveProjectedParallelRoad,
  runtime: HomeDriveRuntimeState,
): ParallelRoadCssVars {
  const steering = clampNumber(runtime.steering, -1, 1);
  const laneOffset = clampNumber(runtime.laneOffset, -1, 1);
  const sideDirection = projectedRoad.road.side === "left" ? -1 : 1;

  const projection = projectedRoad.projection;
  const steeringDriftPx = steering * -10;
  const laneDriftPx = laneOffset * -8 * sideDirection;

  return {
    "--home-drive-parallel-road-x": `${projectedRoad.horizontalPct}%`,
    "--home-drive-parallel-road-bottom": `${projection.bottomPct}%`,
    "--home-drive-parallel-road-scale": projection.scale,
    "--home-drive-parallel-road-opacity": clampNumber(
      projection.opacity * projectedRoad.road.opacityWeight,
      0,
      0.48,
    ),
    "--home-drive-parallel-road-width": `${getRoadWidthPct(projectedRoad)}vw`,
    "--home-drive-parallel-road-length": `${getRoadLengthPx(projectedRoad)}px`,
    "--home-drive-parallel-road-skew": `${projectedRoad.skewDeg}deg`,
    "--home-drive-parallel-road-drift": `${steeringDriftPx + laneDriftPx}px`,
    "--home-drive-parallel-road-blur": `${projection.blurPx}px`,
    "--home-drive-parallel-road-z": projection.zIndex,
  };
}

export default function HomeDriveParallelRoadLayer({
  runtime,
  routeSegment,
  className,
}: HomeDriveParallelRoadLayerProps) {
  const routeMeters = getRuntimeDistanceMeters(runtime);

  const projectedRoads = useMemo(() => {
    const roads = getHomeDriveParallelRoadsForAmbience(routeSegment.ambience);

    return roads
      .map((road) => {
        return projectHomeDriveParallelRoad(
          road,
          routeMeters,
          runtime.steering,
          runtime.laneOffset,
        );
      })
      .filter((road) => road.visible)
      .slice(0, 5);
  }, [routeMeters, routeSegment.ambience, runtime.steering, runtime.laneOffset]);

  const rootStyle = useMemo<CSSProperties>(() => {
    return {
      transform: `translateX(${runtime.laneOffset * -5}px)`,
    };
  }, [runtime.laneOffset]);

  return (
    <div
      aria-hidden="true"
      className={buildRootClassName(className)}
      data-home-drive-parallel-road-layer="true"
      data-home-drive-parallel-road-ambience={routeSegment.ambience}
      style={rootStyle}
    >
      {projectedRoads.map((projectedRoad) => {
        return (
          <div
            key={projectedRoad.road.id}
            className={buildRoadClassName(projectedRoad)}
            data-home-drive-parallel-road={projectedRoad.road.id}
            data-home-drive-parallel-road-side={projectedRoad.road.side}
            data-home-drive-parallel-road-kind={projectedRoad.road.kind}
            style={buildRoadStyle(projectedRoad, runtime)}
          >
            <div className={styles.road}>
              <div className={styles.roadInner} />
              <div className={styles.roadEdgeNear} />
              <div className={styles.roadEdgeFar} />
              {projectedRoad.road.dashed ? (
                <div className={styles.laneDashes} />
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
