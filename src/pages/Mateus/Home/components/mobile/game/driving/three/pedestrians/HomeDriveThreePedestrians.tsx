// src/pages/Mateus/Home/components/mobile/game/driving/three/pedestrians/HomeDriveThreePedestrians.tsx

import { useFrame } from "@react-three/fiber";
import React, { memo, useMemo, useRef, useState } from "react";

import type { HomeDriveRuntimeState } from "../../domain/homeDrive.types";
import type {
  HomeDrivePedestrianAgent,
  HomeDrivePedestrianRuntimeState,
} from "../../domain/pedestrians";
import HomeDriveThreePedestrianAgent, {
  type HomeDriveThreePedestrianDetailLevel,
} from "./HomeDriveThreePedestrianAgent";
import HomeDriveThreePedestrianDebug from "./HomeDriveThreePedestrianDebug";
import { HomeDriveThreePedestrianHandLinks } from "./HomeDriveThreePedestrianProps";

export type HomeDriveMutableRef<T> = {
  current: T;
};

export type HomeDriveThreePedestriansProps = Readonly<{
  pedestriansRef: HomeDriveMutableRef<HomeDrivePedestrianRuntimeState>;
  runtimeRef?: HomeDriveMutableRef<HomeDriveRuntimeState>;
  enabled?: boolean;
  debug?: boolean;
  visibleRadiusMeters?: number;
  maxVisiblePedestrians?: number;
  fullDetailRadiusMeters?: number;
  mediumDetailRadiusMeters?: number;
  snapshotHz?: number;
}>;

type VisiblePedestrianEntry = Readonly<{
  agent: HomeDrivePedestrianAgent;
  distanceSquared: number;
  detailLevel: HomeDriveThreePedestrianDetailLevel;
}>;

const DEFAULT_VISIBLE_RADIUS_METERS = 280;
const DEFAULT_MAX_VISIBLE_PEDESTRIANS = 96;
const DEFAULT_FULL_DETAIL_RADIUS_METERS = 80;
const DEFAULT_MEDIUM_DETAIL_RADIUS_METERS = 170;
const DEFAULT_SNAPSHOT_HZ = 10;

function getDistanceSquared(
  first: Readonly<{ x: number; z: number }>,
  second: Readonly<{ x: number; z: number }>,
): number {
  const dx = first.x - second.x;
  const dz = first.z - second.z;

  return dx * dx + dz * dz;
}

function getDetailLevelForDistance(
  distanceSquared: number,
  fullDetailRadiusMeters: number,
  mediumDetailRadiusMeters: number,
): HomeDriveThreePedestrianDetailLevel {
  if (distanceSquared <= fullDetailRadiusMeters * fullDetailRadiusMeters) {
    return "full";
  }

  if (distanceSquared <= mediumDetailRadiusMeters * mediumDetailRadiusMeters) {
    return "medium";
  }

  return "proxy";
}

function getVisibleAgentEntries(
  agents: readonly HomeDrivePedestrianAgent[],
  runtime: HomeDriveRuntimeState | undefined,
  visibleRadiusMeters: number,
  maxVisiblePedestrians: number,
  fullDetailRadiusMeters: number,
  mediumDetailRadiusMeters: number,
): readonly VisiblePedestrianEntry[] {
  const safeMaxVisiblePedestrians = Math.max(0, maxVisiblePedestrians);

  if (safeMaxVisiblePedestrians <= 0) {
    return [];
  }

  if (!runtime) {
    return agents.slice(0, safeMaxVisiblePedestrians).map((agent) => ({
      agent,
      distanceSquared: 0,
      detailLevel: "medium",
    }));
  }

  const radiusSquared = visibleRadiusMeters * visibleRadiusMeters;
  const entries: VisiblePedestrianEntry[] = [];

  for (const agent of agents) {
    const distanceSquared = getDistanceSquared(agent.position, runtime.car.position);

    if (distanceSquared > radiusSquared) {
      continue;
    }

    entries.push({
      agent,
      distanceSquared,
      detailLevel: getDetailLevelForDistance(
        distanceSquared,
        fullDetailRadiusMeters,
        mediumDetailRadiusMeters,
      ),
    });
  }

  entries.sort((first, second) => {
    return first.distanceSquared - second.distanceSquared;
  });

  return entries.slice(0, safeMaxVisiblePedestrians);
}

function HomeDriveThreePedestrians({
  pedestriansRef,
  runtimeRef,
  enabled = true,
  debug = false,
  visibleRadiusMeters = DEFAULT_VISIBLE_RADIUS_METERS,
  maxVisiblePedestrians = DEFAULT_MAX_VISIBLE_PEDESTRIANS,
  fullDetailRadiusMeters = DEFAULT_FULL_DETAIL_RADIUS_METERS,
  mediumDetailRadiusMeters = DEFAULT_MEDIUM_DETAIL_RADIUS_METERS,
  snapshotHz = DEFAULT_SNAPSHOT_HZ,
}: HomeDriveThreePedestriansProps) {
  const [snapshot, setSnapshot] = useState<HomeDrivePedestrianRuntimeState>(
    pedestriansRef.current,
  );
  const snapshotAccumulatorRef = useRef(0);
  const lastElapsedRef = useRef(pedestriansRef.current.elapsedSeconds);

  useFrame((_, deltaSeconds) => {
    if (!enabled) {
      return;
    }

    const safeSnapshotHz = Math.max(4, Math.min(snapshotHz, 18));
    const snapshotIntervalSeconds = 1 / safeSnapshotHz;

    snapshotAccumulatorRef.current += Math.min(Math.max(deltaSeconds, 0), 0.12);

    if (
      snapshotAccumulatorRef.current < snapshotIntervalSeconds &&
      pedestriansRef.current.elapsedSeconds === lastElapsedRef.current
    ) {
      return;
    }

    snapshotAccumulatorRef.current = 0;
    lastElapsedRef.current = pedestriansRef.current.elapsedSeconds;
    setSnapshot(pedestriansRef.current);
  });

  const visibleEntries = useMemo(() => {
    return getVisibleAgentEntries(
      snapshot.agents,
      runtimeRef?.current,
      Math.max(24, visibleRadiusMeters),
      Math.max(0, maxVisiblePedestrians),
      Math.max(12, fullDetailRadiusMeters),
      Math.max(fullDetailRadiusMeters, mediumDetailRadiusMeters),
    );
  }, [
    fullDetailRadiusMeters,
    maxVisiblePedestrians,
    mediumDetailRadiusMeters,
    runtimeRef,
    snapshot,
    visibleRadiusMeters,
  ]);

  const handLinkAgents = useMemo(() => {
    return visibleEntries
      .filter((entry) => entry.detailLevel === "full")
      .map((entry) => entry.agent);
  }, [visibleEntries]);

  if (!enabled || visibleEntries.length <= 0) {
    return debug ? (
      <HomeDriveThreePedestrianDebug pedestrians={snapshot} enabled={debug} />
    ) : null;
  }

  return (
    <group name="home-drive-pedestrians" renderOrder={26}>
      <HomeDriveThreePedestrianDebug pedestrians={snapshot} enabled={debug} />

      <HomeDriveThreePedestrianHandLinks agents={handLinkAgents} />

      {visibleEntries.map((entry) => (
        <HomeDriveThreePedestrianAgent
          key={entry.agent.id}
          agent={entry.agent}
          detailLevel={entry.detailLevel}
        />
      ))}
    </group>
  );
}

export default memo(HomeDriveThreePedestrians);
