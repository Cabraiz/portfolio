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
import HomeDriveThreePedestrianInstancedRig from "./HomeDriveThreePedestrianInstancedRig";
import { HomeDriveThreePedestrianHandLinks } from "./HomeDriveThreePedestrianProps";
import { createHomeDriveThreePedestrianHighSpeedVisibilityPlan } from "./homeDriveThree.pedestrianHighSpeedVisibility";
import { getHomeDriveThreePedestrianRenderPlan } from "./homeDriveThree.pedestrianRenderPlan";
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

  enableInstancedRig?: boolean;
  enableBakedAnimation?: boolean;
  maxFullReactPedestrians?: number;
  maxMediumReactPedestrians?: number;
  maxInstancedPedestrians?: number;
  instancedAnimationHz?: number;
  instancedAnimationUpdateStride?: number;
  instancedMaxUpdatesPerFrame?: number;
  visualPoolRetainSeconds?: number;
  visualPoolNormalRetainSeconds?: number;
  visualPoolFastRetainSeconds?: number;
  visualPoolSize?: number;
  frontEmergencyEnabled?: boolean;
  frontEmergencySpeedMps?: number;
  frontEmergencyStealDistanceMeters?: number;
  frontEmergencyReserveRatio?: number;
  maxEmergencyStealsPerFrame?: number;

  allowVisibleTeleport?: boolean;
  visibleTeleportBlockMeters?: number;
  visibleTeleportConeRadians?: number;
  stagingSize?: number;
  stagingLeadSeconds?: number;
  maxStagingUpdatesPerFrame?: number;
  maxVisibleStealsPerFrame?: number;
  allowStagingReplacement?: boolean;
  stagingReplacementMinScoreDelta?: number;

  highSpeedVisualPrewarmEnabled?: boolean;
  highSpeedVisualLeadSeconds?: number;
  highSpeedVisualRadiusCapMeters?: number;
  highSpeedVisualConeRadians?: number;
  highSpeedExtraEntryRatio?: number;

  enableRenderSeparation?: boolean;
  renderSeparationCellSizeMeters?: number;
  renderSeparationMinMeters?: number;
  renderSeparationMaxOffsetMeters?: number;
}>;

const DEFAULT_VISIBLE_RADIUS_METERS = 260;
const DEFAULT_MAX_VISIBLE_PEDESTRIANS = 260;
const DEFAULT_FULL_DETAIL_RADIUS_METERS = 84;
const DEFAULT_MEDIUM_DETAIL_RADIUS_METERS = 190;
const DEFAULT_SNAPSHOT_HZ = 6;

const DEFAULT_ENABLE_INSTANCED_RIG = true;
const DEFAULT_ENABLE_BAKED_ANIMATION = true;
const DEFAULT_MAX_FULL_REACT_PEDESTRIANS = 48;
const DEFAULT_MAX_MEDIUM_REACT_PEDESTRIANS = 0;
const DEFAULT_MAX_INSTANCED_PEDESTRIANS = 260;
const DEFAULT_INSTANCED_ANIMATION_HZ = 18;
const DEFAULT_INSTANCED_UPDATE_STRIDE = 3;
const DEFAULT_VISUAL_POOL_RETAIN_SECONDS = 0.85;
const DEFAULT_VISUAL_POOL_FAST_RETAIN_SECONDS = 0.18;
const DEFAULT_FRONT_EMERGENCY_SPEED_MPS = 9.5;
const DEFAULT_FRONT_EMERGENCY_STEAL_DISTANCE_METERS = 380;
const DEFAULT_FRONT_EMERGENCY_RESERVE_RATIO = 0.36;
const DEFAULT_MAX_EMERGENCY_STEALS_PER_FRAME = 112;

const DEFAULT_ALLOW_VISIBLE_TELEPORT = false;
const DEFAULT_VISIBLE_TELEPORT_BLOCK_METERS = 230;
const DEFAULT_VISIBLE_TELEPORT_CONE_RADIANS = 0.92;
const DEFAULT_STAGING_LEAD_SECONDS = 8.4;
const DEFAULT_MAX_STAGING_UPDATES_PER_FRAME = 36;
const DEFAULT_MAX_VISIBLE_STEALS_PER_FRAME = 0;
const DEFAULT_ALLOW_STAGING_REPLACEMENT = true;
const DEFAULT_STAGING_REPLACEMENT_MIN_SCORE_DELTA = 18;

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

function getSafePositiveInteger(value: number | undefined, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(0, Math.floor(value));
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
  enableInstancedRig = DEFAULT_ENABLE_INSTANCED_RIG,
  enableBakedAnimation = DEFAULT_ENABLE_BAKED_ANIMATION,
  maxFullReactPedestrians = DEFAULT_MAX_FULL_REACT_PEDESTRIANS,
  maxMediumReactPedestrians = DEFAULT_MAX_MEDIUM_REACT_PEDESTRIANS,
  maxInstancedPedestrians = DEFAULT_MAX_INSTANCED_PEDESTRIANS,
  instancedAnimationHz = DEFAULT_INSTANCED_ANIMATION_HZ,
  instancedAnimationUpdateStride = DEFAULT_INSTANCED_UPDATE_STRIDE,
  instancedMaxUpdatesPerFrame,
  visualPoolRetainSeconds = DEFAULT_VISUAL_POOL_RETAIN_SECONDS,
  visualPoolNormalRetainSeconds,
  visualPoolFastRetainSeconds = DEFAULT_VISUAL_POOL_FAST_RETAIN_SECONDS,
  visualPoolSize,
  frontEmergencyEnabled = true,
  frontEmergencySpeedMps = DEFAULT_FRONT_EMERGENCY_SPEED_MPS,
  frontEmergencyStealDistanceMeters = DEFAULT_FRONT_EMERGENCY_STEAL_DISTANCE_METERS,
  frontEmergencyReserveRatio = DEFAULT_FRONT_EMERGENCY_RESERVE_RATIO,
  maxEmergencyStealsPerFrame = DEFAULT_MAX_EMERGENCY_STEALS_PER_FRAME,
  allowVisibleTeleport = DEFAULT_ALLOW_VISIBLE_TELEPORT,
  visibleTeleportBlockMeters = DEFAULT_VISIBLE_TELEPORT_BLOCK_METERS,
  visibleTeleportConeRadians = DEFAULT_VISIBLE_TELEPORT_CONE_RADIANS,
  stagingSize,
  stagingLeadSeconds = DEFAULT_STAGING_LEAD_SECONDS,
  maxStagingUpdatesPerFrame = DEFAULT_MAX_STAGING_UPDATES_PER_FRAME,
  maxVisibleStealsPerFrame = DEFAULT_MAX_VISIBLE_STEALS_PER_FRAME,
  allowStagingReplacement = DEFAULT_ALLOW_STAGING_REPLACEMENT,
  stagingReplacementMinScoreDelta = DEFAULT_STAGING_REPLACEMENT_MIN_SCORE_DELTA,
  highSpeedVisualPrewarmEnabled = true,
  highSpeedVisualLeadSeconds,
  highSpeedVisualRadiusCapMeters,
  highSpeedVisualConeRadians,
  highSpeedExtraEntryRatio,
  enableRenderSeparation,
  renderSeparationCellSizeMeters,
  renderSeparationMinMeters,
  renderSeparationMaxOffsetMeters,
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

  const activeRuntime = runtimeRef?.current;
  const activeCenter = activeRuntime?.car.position ?? null;
  const activeHeadingRad = activeRuntime?.car.headingRad ?? 0;
  const activeSpeedMps = Math.max(0, activeRuntime?.car.speedMps ?? 0);
  const safeFullDetailRadiusMeters = Math.max(12, fullDetailRadiusMeters);
  const safeMediumDetailRadiusMeters = Math.max(
    safeFullDetailRadiusMeters,
    mediumDetailRadiusMeters,
  );
  const highSpeedVisibilityPlan = useMemo(() => {
    return createHomeDriveThreePedestrianHighSpeedVisibilityPlan({
      enabled: highSpeedVisualPrewarmEnabled,
      activeSpeedMps,
      visibleRadiusMeters: Math.max(24, visibleRadiusMeters),
      mediumDetailRadiusMeters: safeMediumDetailRadiusMeters,
      maxVisiblePedestrians: Math.max(0, maxVisiblePedestrians),
      leadSeconds: highSpeedVisualLeadSeconds,
      radiusCapMeters: highSpeedVisualRadiusCapMeters,
      coneRadians: highSpeedVisualConeRadians,
      extraEntryRatio: highSpeedExtraEntryRatio,
      frontEmergencyStealDistanceMeters,
      stagingLeadSeconds,
    });
  }, [
    activeSpeedMps,
    frontEmergencyStealDistanceMeters,
    highSpeedExtraEntryRatio,
    highSpeedVisualConeRadians,
    highSpeedVisualLeadSeconds,
    highSpeedVisualPrewarmEnabled,
    highSpeedVisualRadiusCapMeters,
    maxVisiblePedestrians,
    safeMediumDetailRadiusMeters,
    stagingLeadSeconds,
    visibleRadiusMeters,
  ]);

  const visibleEntries = useMemo(() => {
    const uniqueAgents = dedupeHomeDrivePedestrianAgentsById(snapshot.agents);

    return dedupeHomeDriveThreeVisibleEntriesByAgentId(
      getHomeDriveThreeVisiblePedestrianEntries({
        agents: uniqueAgents,
        runtime: activeRuntime,
        pedestrianState: snapshot,
        visibleRadiusMeters: Math.max(24, visibleRadiusMeters),
        maxVisiblePedestrians: Math.max(0, maxVisiblePedestrians),
        fullDetailRadiusMeters: safeFullDetailRadiusMeters,
        mediumDetailRadiusMeters: safeMediumDetailRadiusMeters,
        visualPrewarmRadiusMeters: highSpeedVisibilityPlan.visualQueryRadiusMeters,
        visualPrewarmConeRadians: highSpeedVisibilityPlan.frontPrewarmConeRadians,
        maxVisualPrewarmPedestrians:
          highSpeedVisibilityPlan.maxVisualPrewarmPedestrians,
      }),
    );
  }, [
    activeRuntime,
    highSpeedVisibilityPlan,
    maxVisiblePedestrians,
    safeFullDetailRadiusMeters,
    safeMediumDetailRadiusMeters,
    snapshot,
    visibleRadiusMeters,
  ]);

  const shouldUseInstancedRig = enableInstancedRig && enableBakedAnimation;

  const renderPlan = useMemo(() => {
    return getHomeDriveThreePedestrianRenderPlan(visibleEntries, {
      maxFullReactPedestrians: getSafePositiveInteger(
        maxFullReactPedestrians,
        DEFAULT_MAX_FULL_REACT_PEDESTRIANS,
      ),
      maxMediumReactPedestrians: getSafePositiveInteger(
        maxMediumReactPedestrians,
        DEFAULT_MAX_MEDIUM_REACT_PEDESTRIANS,
      ),
      forceFullForHandLinks: true,
    });
  }, [maxFullReactPedestrians, maxMediumReactPedestrians, visibleEntries]);

  const legacyReactEntries = useMemo(() => {
    return shouldUseInstancedRig ? [] : visibleEntries;
  }, [shouldUseInstancedRig, visibleEntries]);

  const handLinkAgents = useMemo(() => {
    if (!shouldUseInstancedRig) {
      return visibleEntries
        .filter((entry) => entry.detailLevel === "full")
        .map((entry) => entry.agent);
    }

    return renderPlan.handLinkAgents;
  }, [renderPlan.handLinkAgents, shouldUseInstancedRig, visibleEntries]);

  const safeMaxInstancedPedestrians = getSafePositiveInteger(
    maxInstancedPedestrians,
    DEFAULT_MAX_INSTANCED_PEDESTRIANS,
  );
  const safeVisualPoolSize =
    typeof visualPoolSize === "number" && Number.isFinite(visualPoolSize)
      ? Math.max(safeMaxInstancedPedestrians, Math.floor(visualPoolSize))
      : safeMaxInstancedPedestrians;

  if (!enabled) {
    return debug ? (
      <HomeDriveThreePedestrianDebug pedestrians={snapshot} enabled={debug} />
    ) : null;
  }

  return (
    <group name="home-drive-pedestrians" renderOrder={26}>
      <HomeDriveThreePedestrianDebug pedestrians={snapshot} enabled={debug} />

      <HomeDriveThreePedestrianHandLinks agents={handLinkAgents} />

      {shouldUseInstancedRig ? (
        <>
          {renderPlan.fullEntries.map((entry) => (
            <HomeDriveThreePedestrianAgent
              key={entry.agent.id}
              agent={entry.agent}
              detailLevel="full"
            />
          ))}

          {renderPlan.mediumReactEntries.map((entry) => (
            <HomeDriveThreePedestrianAgent
              key={entry.agent.id}
              agent={entry.agent}
              detailLevel="medium"
            />
          ))}

          <HomeDriveThreePedestrianInstancedRig
            entries={renderPlan.instancedEntries}
            enabled={shouldUseInstancedRig}
            elapsedSeconds={snapshot.elapsedSeconds}
            maxInstances={safeVisualPoolSize}
            updateHz={Math.max(6, Math.min(instancedAnimationHz, 30))}
            updateStride={Math.max(
              1,
              Math.min(8, Math.floor(instancedAnimationUpdateStride)),
            )}
            maxUpdatesPerFrame={
              typeof instancedMaxUpdatesPerFrame === "number"
                ? Math.max(16, Math.floor(instancedMaxUpdatesPerFrame))
                : undefined
            }
            visualPoolRetainSeconds={Math.max(0.08, visualPoolRetainSeconds)}
            visualPoolNormalRetainSeconds={visualPoolNormalRetainSeconds}
            visualPoolFastRetainSeconds={visualPoolFastRetainSeconds}
            activeCenter={activeCenter}
            activeHeadingRad={activeHeadingRad}
            activeSpeedMps={activeSpeedMps}
            frontEmergencyEnabled={frontEmergencyEnabled}
            frontEmergencySpeedMps={frontEmergencySpeedMps}
            frontEmergencyStealDistanceMeters={frontEmergencyStealDistanceMeters}
            frontEmergencyReserveRatio={frontEmergencyReserveRatio}
            maxEmergencyStealsPerFrame={maxEmergencyStealsPerFrame}
            allowVisibleTeleport={allowVisibleTeleport}
            visibleTeleportBlockMeters={visibleTeleportBlockMeters}
            visibleTeleportConeRadians={visibleTeleportConeRadians}
            stagingSize={stagingSize}
            stagingLeadSeconds={Math.max(stagingLeadSeconds, highSpeedVisibilityPlan.stagingLeadSeconds)}
            maxStagingUpdatesPerFrame={maxStagingUpdatesPerFrame}
            maxVisibleStealsPerFrame={maxVisibleStealsPerFrame}
            allowStagingReplacement={allowStagingReplacement}
            stagingReplacementMinScoreDelta={stagingReplacementMinScoreDelta}
            enableRenderSeparation={enableRenderSeparation}
            renderSeparationCellSizeMeters={renderSeparationCellSizeMeters}
            renderSeparationMinMeters={renderSeparationMinMeters}
            renderSeparationMaxOffsetMeters={renderSeparationMaxOffsetMeters}
          />
        </>
      ) : (
        legacyReactEntries.map((entry) => (
          <HomeDriveThreePedestrianAgent
            key={entry.agent.id}
            agent={entry.agent}
            detailLevel={entry.detailLevel}
          />
        ))
      )}
    </group>
  );
}

export default memo(HomeDriveThreePedestrians);
