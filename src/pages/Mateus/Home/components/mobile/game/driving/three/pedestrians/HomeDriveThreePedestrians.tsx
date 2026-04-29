// src/pages/Mateus/Home/components/mobile/game/driving/three/pedestrians/HomeDriveThreePedestrians.tsx

import { useFrame } from "@react-three/fiber";
import React, { memo, useMemo, useRef, useState } from "react";

import type { HomeDriveRuntimeState } from "../../domain/homeDrive.types";
import type {
  HomeDrivePedestrianAgent,
  HomeDrivePedestrianRuntimeState,
} from "../../domain/pedestrians";
import HomeDriveThreePedestrianAgent from "./HomeDriveThreePedestrianAgent";
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
  snapshotHz?: number;
}>;

const DEFAULT_VISIBLE_RADIUS_METERS = 280;
const DEFAULT_MAX_VISIBLE_PEDESTRIANS = 96;
const DEFAULT_SNAPSHOT_HZ = 24;

function getDistanceSquared(
  first: Readonly<{ x: number; z: number }>,
  second: Readonly<{ x: number; z: number }>,
): number {
  const dx = first.x - second.x;
  const dz = first.z - second.z;

  return dx * dx + dz * dz;
}

function getVisibleAgents(
  agents: readonly HomeDrivePedestrianAgent[],
  runtime: HomeDriveRuntimeState | undefined,
  visibleRadiusMeters: number,
  maxVisiblePedestrians: number,
): readonly HomeDrivePedestrianAgent[] {
  if (!runtime) {
    return agents.slice(0, maxVisiblePedestrians);
  }

  const radiusSquared = visibleRadiusMeters * visibleRadiusMeters;

  return agents
    .filter((agent) => {
      return getDistanceSquared(agent.position, runtime.car.position) <= radiusSquared;
    })
    .sort((first, second) => {
      return (
        getDistanceSquared(first.position, runtime.car.position) -
        getDistanceSquared(second.position, runtime.car.position)
      );
    })
    .slice(0, maxVisiblePedestrians);
}

function HomeDriveThreePedestrians({
  pedestriansRef,
  runtimeRef,
  enabled = true,
  debug = false,
  visibleRadiusMeters = DEFAULT_VISIBLE_RADIUS_METERS,
  maxVisiblePedestrians = DEFAULT_MAX_VISIBLE_PEDESTRIANS,
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

    const safeSnapshotHz = Math.max(4, Math.min(snapshotHz, 45));
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

  const visibleAgents = useMemo(() => {
    return getVisibleAgents(
      snapshot.agents,
      runtimeRef?.current,
      Math.max(24, visibleRadiusMeters),
      Math.max(0, maxVisiblePedestrians),
    );
  }, [
    maxVisiblePedestrians,
    runtimeRef,
    snapshot,
    visibleRadiusMeters,
  ]);

  if (!enabled || visibleAgents.length <= 0) {
    return debug ? (
      <HomeDriveThreePedestrianDebug pedestrians={snapshot} enabled={debug} />
    ) : null;
  }

  return (
    <group name="home-drive-pedestrians" renderOrder={26}>
      <HomeDriveThreePedestrianDebug pedestrians={snapshot} enabled={debug} />

      <HomeDriveThreePedestrianHandLinks agents={visibleAgents} />

      {visibleAgents.map((agent) => (
        <HomeDriveThreePedestrianAgent key={agent.id} agent={agent} />
      ))}
    </group>
  );
}

export default memo(HomeDriveThreePedestrians);
