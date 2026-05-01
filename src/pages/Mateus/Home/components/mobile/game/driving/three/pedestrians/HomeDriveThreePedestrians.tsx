// src/pages/Mateus/Home/components/mobile/game/driving/three/pedestrians/HomeDriveThreePedestrians.tsx

import { useFrame } from "@react-three/fiber";
import React, { memo, useMemo, useRef, useState } from "react";

import type { HomeDriveRuntimeState } from "../../domain/homeDrive.types";
import { dedupeHomeDrivePedestrianAgentsById } from "../../domain/pedestrians";
import type { HomeDrivePedestrianRuntimeState } from "../../domain/pedestrians";
import HomeDriveThreePedestrianAgent from "./HomeDriveThreePedestrianAgent";
import HomeDriveThreePedestrianDebug from "./HomeDriveThreePedestrianDebug";
import HomeDriveThreePedestrianInstancedCrowd from "./HomeDriveThreePedestrianInstancedCrowd";
import { HomeDriveThreePedestrianHandLinks } from "./HomeDriveThreePedestrianProps";
import { getHomeDriveThreeVisiblePedestrianEntries } from "./homeDriveThree.pedestrianVisibility";
import { filterHomeDriveThreePedestrianInstancedEntries } from "./homeDriveThree.pedestrianInstancing";

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

const DEFAULT_VISIBLE_RADIUS_METERS = 620;
const DEFAULT_MAX_VISIBLE_PEDESTRIANS = 820;
const DEFAULT_FULL_DETAIL_RADIUS_METERS = 84;
const DEFAULT_MEDIUM_DETAIL_RADIUS_METERS = 240;
const DEFAULT_SNAPSHOT_HZ = 9;

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

    const safeSnapshotHz = Math.max(4, Math.min(snapshotHz, 16));
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

    return dedupeHomeDriveThreeVisibleEntriesByAgentId(
      getHomeDriveThreeVisiblePedestrianEntries({
        agents: uniqueAgents,
        runtime: runtimeRef?.current,
        visibleRadiusMeters: Math.max(24, visibleRadiusMeters),
        maxVisiblePedestrians: Math.max(0, maxVisiblePedestrians),
        fullDetailRadiusMeters: Math.max(12, fullDetailRadiusMeters),
        mediumDetailRadiusMeters: Math.max(
          fullDetailRadiusMeters,
          mediumDetailRadiusMeters,
        ),
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

  const fullDetailEntries = useMemo(() => {
    return visibleEntries.filter((entry) => entry.detailLevel === "full");
  }, [visibleEntries]);

  const instancedEntries = useMemo(() => {
    return filterHomeDriveThreePedestrianInstancedEntries(visibleEntries);
  }, [visibleEntries]);

  const handLinkAgents = useMemo(() => {
    return fullDetailEntries.map((entry) => entry.agent);
  }, [fullDetailEntries]);

  if (!enabled || visibleEntries.length <= 0) {
    return debug ? (
      <HomeDriveThreePedestrianDebug pedestrians={snapshot} enabled={debug} />
    ) : null;
  }

  return (
    <group name="home-drive-pedestrians" renderOrder={26}>
      <HomeDriveThreePedestrianDebug pedestrians={snapshot} enabled={debug} />

      <HomeDriveThreePedestrianInstancedCrowd
        entries={instancedEntries}
        enabled={instancedEntries.length > 0}
        elapsedSeconds={snapshot.elapsedSeconds}
        maxInstances={Math.max(0, maxVisiblePedestrians - fullDetailEntries.length)}
        renderOrder={25}
      />

      <HomeDriveThreePedestrianHandLinks agents={handLinkAgents} />

      {fullDetailEntries.map((entry) => (
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
