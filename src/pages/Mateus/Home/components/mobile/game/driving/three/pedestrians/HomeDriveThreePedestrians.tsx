// src/pages/Mateus/Home/components/mobile/game/driving/three/pedestrians/HomeDriveThreePedestrians.tsx

import { useFrame } from "@react-three/fiber";
import React, { memo, useMemo, useRef, useState } from "react";

import type { HomeDriveRuntimeState } from "../../domain/homeDrive.types";
import {
  dedupeHomeDrivePedestrianAgentsById,
  type HomeDrivePedestrianRuntimeState,
} from "../../domain/pedestrians";
import HomeDriveThreePedestrianAgent from "./HomeDriveThreePedestrianAgent";
import HomeDriveThreePedestrianDebug from "./HomeDriveThreePedestrianDebug";
import { HomeDriveThreePedestrianHandLinks } from "./HomeDriveThreePedestrianProps";
import { getHomeDriveThreeVisiblePedestrianEntries } from "./homeDriveThree.pedestrianVisibility";

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

const DEFAULT_VISIBLE_RADIUS_METERS = 260;
const DEFAULT_MAX_VISIBLE_PEDESTRIANS = 260;
const DEFAULT_FULL_DETAIL_RADIUS_METERS = 84;
const DEFAULT_MEDIUM_DETAIL_RADIUS_METERS = 190;
const DEFAULT_SNAPSHOT_HZ = 6;

type HomeDriveThreeVisiblePedestrianEntry = ReturnType<
  typeof getHomeDriveThreeVisiblePedestrianEntries
>[number];

function dedupeHomeDriveThreeVisibleEntriesByAgentId(
  entries: readonly HomeDriveThreeVisiblePedestrianEntry[],
): readonly HomeDriveThreeVisiblePedestrianEntry[] {
  const seen = new Set<string>();
  const uniqueEntries: HomeDriveThreeVisiblePedestrianEntry[] = [];

  entries.forEach((entry) => {
    if (seen.has(entry.agent.id)) {
      return;
    }

    if (entry.detailLevel === "proxy") {
      return;
    }

    seen.add(entry.agent.id);
    uniqueEntries.push(entry);
  });

  return uniqueEntries;
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

    const safeSnapshotHz = Math.max(3, Math.min(snapshotHz, 12));
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
    const uniqueAgents = dedupeHomeDrivePedestrianAgentsById(snapshot.agents);
    const safeFullDetailRadiusMeters = Math.max(12, fullDetailRadiusMeters);
    const safeMediumDetailRadiusMeters = Math.max(
      safeFullDetailRadiusMeters,
      mediumDetailRadiusMeters,
    );

    return dedupeHomeDriveThreeVisibleEntriesByAgentId(
      getHomeDriveThreeVisiblePedestrianEntries({
        agents: uniqueAgents,
        runtime: runtimeRef?.current,
        pedestrianState: snapshot,
        visibleRadiusMeters: Math.max(24, visibleRadiusMeters),
        maxVisiblePedestrians: Math.max(0, maxVisiblePedestrians),
        fullDetailRadiusMeters: safeFullDetailRadiusMeters,
        mediumDetailRadiusMeters: safeMediumDetailRadiusMeters,
      }),
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
