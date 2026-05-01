// src/pages/Mateus/Home/components/mobile/game/driving/three/pedestrians/HomeDriveThreePedestrianInstancedRig.tsx

import { useFrame } from "@react-three/fiber";
import React, {
  memo,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import { Color, DynamicDrawUsage, InstancedMesh, Matrix4 } from "three";

import {
  HOME_DRIVE_THREE_PEDESTRIAN_INSTANCED_RIG_PARTS,
  createHomeDriveThreePedestrianInstancedRigGeometries,
  disposeHomeDriveThreePedestrianInstancedRigGeometries,
  type HomeDriveThreePedestrianInstancedRigGeometryMap,
  type HomeDriveThreePedestrianInstancedRigPartKey,
} from "./homeDriveThree.pedestrianInstancedRigGeometry";
import {
  createHomeDriveThreePedestrianInstancedRigMaterials,
  disposeHomeDriveThreePedestrianInstancedRigMaterials,
  getHomeDriveThreePedestrianInstancedRigPalette,
  writeHomeDriveThreePedestrianInstancedRigPartVisualColor,
  type HomeDriveThreePedestrianInstancedRigMaterialMap,
} from "./homeDriveThree.pedestrianInstancedRigMaterials";
import { writeHomeDriveThreePedestrianInstancedRigPartMatrix } from "./homeDriveThree.pedestrianInstancedRigTransforms";
import { normalizeHomeDriveThreePedestrianInstancedRigEntries } from "./homeDriveThree.pedestrianInstanceBatches";
import type {
  HomeDriveThreePedestrianInstanceSourceEntry,
  HomeDriveThreePedestrianInstancedRigEntry,
} from "./homeDriveThree.pedestrianInstanceBatches.types";
import {
  createHomeDriveThreePedestrianInstanceUpdateSchedulerState,
  getHomeDriveThreePedestrianInstanceUpdateWindow,
} from "./homeDriveThree.pedestrianInstanceUpdateScheduler";
import type { HomeDriveThreePedestrianInstanceUpdateSchedulerState } from "./homeDriveThree.pedestrianInstanceUpdateScheduler.types";
import { sampleHomeDriveThreePedestrianBakedPose } from "./homeDriveThree.pedestrianBakedPoseSampler";
import {
  createHomeDriveThreePedestrianRenderSeparationFrame,
  getHomeDriveThreePedestrianRenderSeparationOffset,
} from "./homeDriveThree.pedestrianRenderSeparation";
import type { HomeDriveThreePedestrianRenderSeparationFrame } from "./homeDriveThree.pedestrianRenderSeparation.types";
import {
  createHomeDriveThreePedestrianVisualPoolState,
  updateHomeDriveThreePedestrianVisualPool,
} from "./homeDriveThree.pedestrianVisualPool";
import type { HomeDriveThreePedestrianVisualPoolState } from "./homeDriveThree.pedestrianVisualPool.types";

export type HomeDriveThreePedestrianInstancedRigProps = Readonly<{
  entries: readonly HomeDriveThreePedestrianInstanceSourceEntry[];
  enabled?: boolean;
  renderOrder?: number;
  maxInstances?: number;
  elapsedSeconds?: number;
  updateHz?: number;
  updateStride?: number;
  maxUpdatesPerFrame?: number;

  /** Segura slots visuais por alguns segundos para o carro rápido não parecer carregar gente. */
  visualPoolRetainSeconds?: number;
  visualPoolNormalRetainSeconds?: number;
  visualPoolFastRetainSeconds?: number;

  /**
   * Dados do carro para prioridade frontal.
   * Quando o carro acelera, o pool rouba slots de trás/lateral e mostra gente
   * pronta imediatamente à frente.
   */
  activeCenter?: Readonly<{ x: number; z: number }> | null;
  activeHeadingRad?: number;
  activeSpeedMps?: number;
  frontEmergencyEnabled?: boolean;
  frontEmergencySpeedMps?: number;
  frontEmergencyStealDistanceMeters?: number;
  frontEmergencyReserveRatio?: number;
  maxEmergencyStealsPerFrame?: number;

  /** Bloqueia nascimento/roubo de slot dentro do cone frontal visível. */
  allowVisibleTeleport?: boolean;
  visibleTeleportBlockMeters?: number;
  visibleTeleportConeRadians?: number;

  /** Staging de slots fora da visão útil. */
  stagingSize?: number;
  stagingLeadSeconds?: number;
  maxStagingUpdatesPerFrame?: number;
  maxVisibleStealsPerFrame?: number;
  allowStagingReplacement?: boolean;
  stagingReplacementMinScoreDelta?: number;

  enableRenderSeparation?: boolean;
  renderSeparationCellSizeMeters?: number;
  renderSeparationMinMeters?: number;
  renderSeparationMaxOffsetMeters?: number;
  renderSeparationDistanceFadeStartMeters?: number;
  renderSeparationDistanceFadeEndMeters?: number;
}>;

type MeshRefMap = Partial<
  Record<HomeDriveThreePedestrianInstancedRigPartKey, InstancedMesh | null>
>;

type SchedulerMap = Record<
  HomeDriveThreePedestrianInstancedRigPartKey,
  HomeDriveThreePedestrianInstanceUpdateSchedulerState
>;

const DEFAULT_RENDER_ORDER = 25;
const DEFAULT_MAX_INSTANCES = 1400;
const DEFAULT_UPDATE_HZ = 18;
const DEFAULT_UPDATE_STRIDE = 3;
const DEFAULT_VISUAL_POOL_RETAIN_SECONDS = 0.85;
const DEFAULT_VISUAL_POOL_FAST_RETAIN_SECONDS = 0.18;
const DEFAULT_FRONT_EMERGENCY_SPEED_MPS = 9.5;
const DEFAULT_FRONT_EMERGENCY_STEAL_DISTANCE_METERS = 380;
const DEFAULT_FRONT_EMERGENCY_RESERVE_RATIO = 0.36;
const DEFAULT_MAX_EMERGENCY_STEALS_PER_FRAME = 72;
const DEFAULT_ALLOW_VISIBLE_TELEPORT = false;
const DEFAULT_VISIBLE_TELEPORT_BLOCK_METERS = 210;
const DEFAULT_VISIBLE_TELEPORT_CONE_RADIANS = 0.86;
const DEFAULT_STAGING_LEAD_SECONDS = 8.4;
const DEFAULT_MAX_STAGING_UPDATES_PER_FRAME = 36;
const DEFAULT_MAX_VISIBLE_STEALS_PER_FRAME = 0;
const DEFAULT_ALLOW_STAGING_REPLACEMENT = true;
const DEFAULT_STAGING_REPLACEMENT_MIN_SCORE_DELTA = 18;
const DEFAULT_ENABLE_RENDER_SEPARATION = true;
const DEFAULT_RENDER_SEPARATION_CELL_SIZE_METERS = 1.35;
const DEFAULT_RENDER_SEPARATION_MIN_METERS = 0.84;
const DEFAULT_RENDER_SEPARATION_MAX_OFFSET_METERS = 0.72;

const TEMP_MATRIX = new Matrix4();
const TEMP_COLOR = new Color();
const PARKED_MATRIX = new Matrix4().makeTranslation(0, -10000, 0);
const PARKED_COLOR = new Color("#777f86");

function createSchedulerMap(): SchedulerMap {
  return HOME_DRIVE_THREE_PEDESTRIAN_INSTANCED_RIG_PARTS.reduce(
    (schedulers, part) => {
      return {
        ...schedulers,
        [part]: createHomeDriveThreePedestrianInstanceUpdateSchedulerState(),
      };
    },
    {} as SchedulerMap,
  );
}

function getCurrentElapsedSeconds(
  providedElapsedSeconds: number | undefined,
  fallbackElapsedSeconds: number,
): number {
  return Math.max(0, providedElapsedSeconds ?? fallbackElapsedSeconds);
}

function updateMeshUsage(meshes: MeshRefMap): void {
  HOME_DRIVE_THREE_PEDESTRIAN_INSTANCED_RIG_PARTS.forEach((part) => {
    const mesh = meshes[part];

    if (!mesh) {
      return;
    }

    mesh.instanceMatrix.setUsage(DynamicDrawUsage);
    mesh.frustumCulled = false;
    mesh.count = 0;
    mesh.visible = false;
  });
}

function initializeVisualPoolMeshes(
  meshes: MeshRefMap,
  capacity: number,
): void {
  HOME_DRIVE_THREE_PEDESTRIAN_INSTANCED_RIG_PARTS.forEach((part) => {
    const mesh = meshes[part];

    if (!mesh) {
      return;
    }

    mesh.instanceMatrix.setUsage(DynamicDrawUsage);
    mesh.frustumCulled = false;

    for (let slotIndex = 0; slotIndex < capacity; slotIndex += 1) {
      mesh.setMatrixAt(slotIndex, PARKED_MATRIX);
      mesh.setColorAt(slotIndex, PARKED_COLOR);
    }

    mesh.count = capacity;
    mesh.visible = true;
    mesh.instanceMatrix.needsUpdate = true;

    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  });
}

function parkSlots(
  meshes: MeshRefMap,
  slotIndices: readonly number[],
): void {
  if (slotIndices.length <= 0) {
    return;
  }

  HOME_DRIVE_THREE_PEDESTRIAN_INSTANCED_RIG_PARTS.forEach((part) => {
    const mesh = meshes[part];

    if (!mesh) {
      return;
    }

    slotIndices.forEach((slotIndex) => {
      mesh.setMatrixAt(slotIndex, PARKED_MATRIX);
    });

    mesh.instanceMatrix.needsUpdate = true;
  });
}

function updateSlotColor(
  meshes: MeshRefMap,
  poolState: HomeDriveThreePedestrianVisualPoolState,
  slotIndex: number,
): void {
  const slot = poolState.slots[slotIndex];
  const entry = slot?.entry;

  if (!slot || !entry) {
    return;
  }

  const palette = getHomeDriveThreePedestrianInstancedRigPalette(entry.agent);

  HOME_DRIVE_THREE_PEDESTRIAN_INSTANCED_RIG_PARTS.forEach((part) => {
    const mesh = meshes[part];

    if (!mesh) {
      return;
    }

    writeHomeDriveThreePedestrianInstancedRigPartVisualColor(
      TEMP_COLOR,
      part,
      palette,
    );

    mesh.setColorAt(slot.slotIndex, TEMP_COLOR);

    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  });
}

function updateSlotMatrix(
  meshes: MeshRefMap,
  poolState: HomeDriveThreePedestrianVisualPoolState,
  slotIndex: number,
  elapsedSeconds: number,
  separationFrame: HomeDriveThreePedestrianRenderSeparationFrame | null,
): void {
  const slot = poolState.slots[slotIndex];
  const entry = slot?.entry;

  if (!slot || !entry) {
    return;
  }

  const sampledPose = sampleHomeDriveThreePedestrianBakedPose({
    agent: entry.agent,
    elapsedSeconds,
    distanceMeters: entry.distanceMeters,
  });
  const visualOffset = getHomeDriveThreePedestrianRenderSeparationOffset(
    separationFrame,
    entry.agent.id,
  );

  HOME_DRIVE_THREE_PEDESTRIAN_INSTANCED_RIG_PARTS.forEach((part) => {
    const mesh = meshes[part];

    if (!mesh) {
      return;
    }

    writeHomeDriveThreePedestrianInstancedRigPartMatrix({
      agent: entry.agent,
      pose: sampledPose.pose,
      part,
      visualOffset,
      out: TEMP_MATRIX,
    });

    mesh.setMatrixAt(slot.slotIndex, TEMP_MATRIX);
    mesh.instanceMatrix.needsUpdate = true;
  });
}

function updateSlotColors(
  meshes: MeshRefMap,
  poolState: HomeDriveThreePedestrianVisualPoolState,
  slotIndices: readonly number[],
): void {
  slotIndices.forEach((slotIndex) => {
    updateSlotColor(meshes, poolState, slotIndex);
  });
}

function updateSlotMatrices(
  meshes: MeshRefMap,
  poolState: HomeDriveThreePedestrianVisualPoolState,
  slotIndices: readonly number[],
  elapsedSeconds: number,
  separationFrame: HomeDriveThreePedestrianRenderSeparationFrame | null,
): void {
  slotIndices.forEach((slotIndex) => {
    updateSlotMatrix(meshes, poolState, slotIndex, elapsedSeconds, separationFrame);
  });
}

function getSlotWindow(
  activeSlotIndices: readonly number[],
  startIndex: number,
  endIndex: number,
): readonly number[] {
  return activeSlotIndices.slice(
    Math.max(0, startIndex),
    Math.max(0, Math.min(activeSlotIndices.length, endIndex)),
  );
}

function HomeDriveThreePedestrianInstancedRig({
  entries,
  enabled = true,
  renderOrder = DEFAULT_RENDER_ORDER,
  maxInstances = DEFAULT_MAX_INSTANCES,
  elapsedSeconds,
  updateHz = DEFAULT_UPDATE_HZ,
  updateStride = DEFAULT_UPDATE_STRIDE,
  maxUpdatesPerFrame,
  visualPoolRetainSeconds = DEFAULT_VISUAL_POOL_RETAIN_SECONDS,
  visualPoolNormalRetainSeconds,
  visualPoolFastRetainSeconds = DEFAULT_VISUAL_POOL_FAST_RETAIN_SECONDS,
  activeCenter = null,
  activeHeadingRad = 0,
  activeSpeedMps = 0,
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

  enableRenderSeparation = DEFAULT_ENABLE_RENDER_SEPARATION,
  renderSeparationCellSizeMeters = DEFAULT_RENDER_SEPARATION_CELL_SIZE_METERS,
  renderSeparationMinMeters = DEFAULT_RENDER_SEPARATION_MIN_METERS,
  renderSeparationMaxOffsetMeters = DEFAULT_RENDER_SEPARATION_MAX_OFFSET_METERS,
  renderSeparationDistanceFadeStartMeters,
  renderSeparationDistanceFadeEndMeters,
}: HomeDriveThreePedestrianInstancedRigProps) {
  const meshRefs = useRef<MeshRefMap>({});
  const schedulerRef = useRef(createSchedulerMap());
  const visualPoolRef = useRef<HomeDriveThreePedestrianVisualPoolState>(
    createHomeDriveThreePedestrianVisualPoolState(maxInstances),
  );
  const initializedCapacityRef = useRef(0);

  const geometries = useMemo<HomeDriveThreePedestrianInstancedRigGeometryMap>(() => {
    return createHomeDriveThreePedestrianInstancedRigGeometries();
  }, []);

  const materials = useMemo<HomeDriveThreePedestrianInstancedRigMaterialMap>(() => {
    return createHomeDriveThreePedestrianInstancedRigMaterials();
  }, []);

  const capacity = Math.max(1, Math.floor(maxInstances));

  const instancedEntries = useMemo(() => {
    if (!enabled || capacity <= 0) {
      return [];
    }

    return normalizeHomeDriveThreePedestrianInstancedRigEntries(entries, {
      maxInstances: capacity,
      preferNearest: true,
      preferStableAgentOrder: true,
    });
  }, [capacity, enabled, entries]);

  const separationFrame = useMemo(() => {
    return createHomeDriveThreePedestrianRenderSeparationFrame(
      instancedEntries,
      {
        enabled: enableRenderSeparation,
        cellSizeMeters: renderSeparationCellSizeMeters,
        minSeparationMeters: renderSeparationMinMeters,
        maxOffsetMeters: renderSeparationMaxOffsetMeters,
        distanceFadeStartMeters: renderSeparationDistanceFadeStartMeters,
        distanceFadeEndMeters: renderSeparationDistanceFadeEndMeters,
      },
    );
  }, [
    enableRenderSeparation,
    instancedEntries,
    renderSeparationCellSizeMeters,
    renderSeparationDistanceFadeEndMeters,
    renderSeparationDistanceFadeStartMeters,
    renderSeparationMaxOffsetMeters,
    renderSeparationMinMeters,
  ]);

  useEffect(() => {
    return () => {
      disposeHomeDriveThreePedestrianInstancedRigGeometries(geometries);
      disposeHomeDriveThreePedestrianInstancedRigMaterials(materials);
    };
  }, [geometries, materials]);

  useLayoutEffect(() => {
    updateMeshUsage(meshRefs.current);
  }, []);

  useLayoutEffect(() => {
    if (!enabled) {
      updateMeshUsage(meshRefs.current);
      initializedCapacityRef.current = 0;
      return;
    }

    if (initializedCapacityRef.current !== capacity) {
      initializeVisualPoolMeshes(meshRefs.current, capacity);
      initializedCapacityRef.current = capacity;
    }
  }, [capacity, enabled]);

  useFrame((state) => {
    if (!enabled) {
      updateMeshUsage(meshRefs.current);
      initializedCapacityRef.current = 0;
      return;
    }

    if (initializedCapacityRef.current !== capacity) {
      initializeVisualPoolMeshes(meshRefs.current, capacity);
      initializedCapacityRef.current = capacity;
    }

    const animationSeconds = getCurrentElapsedSeconds(
      elapsedSeconds,
      state.clock.elapsedTime,
    );
    const poolFrame = updateHomeDriveThreePedestrianVisualPool(
      visualPoolRef.current,
      {
        entries: instancedEntries,
        capacity,
        elapsedSeconds: animationSeconds,
        retainSeconds: visualPoolRetainSeconds,
        normalRetainSeconds: visualPoolNormalRetainSeconds,
        fastRetainSeconds: visualPoolFastRetainSeconds,
        activeCenter,
        activeHeadingRad,
        activeSpeedMps,
        frontEmergencyEnabled,
        frontEmergencySpeedMps,
        frontEmergencyStealDistanceMeters,
        frontEmergencyReserveRatio,
        maxEmergencyStealsPerFrame,
        allowVisibleTeleport,
        visibleTeleportBlockMeters,
        visibleTeleportConeRadians,
        stagingSize,
        stagingLeadSeconds,
        maxStagingUpdatesPerFrame,
        maxVisibleStealsPerFrame,
        allowStagingReplacement,
        stagingReplacementMinScoreDelta,
      },
    );

    parkSlots(meshRefs.current, poolFrame.releasedSlotIndices);
    updateSlotColors(
      meshRefs.current,
      visualPoolRef.current,
      poolFrame.dirtyColorSlotIndices,
    );
    updateSlotMatrices(
      meshRefs.current,
      visualPoolRef.current,
      poolFrame.dirtyMatrixSlotIndices,
      animationSeconds,
      separationFrame,
    );

    const scheduler = schedulerRef.current.torso;
    const updateWindow = getHomeDriveThreePedestrianInstanceUpdateWindow(
      scheduler,
      {
        instanceCount: poolFrame.activeSlotIndices.length,
        elapsedSeconds: animationSeconds,
        updateHz,
        stride: updateStride,
        maxUpdatesPerFrame:
          maxUpdatesPerFrame ??
          Math.max(
            24,
            Math.ceil(poolFrame.activeSlotIndices.length / Math.max(1, updateStride)),
          ),
      },
    );

    if (!updateWindow.shouldUpdate) {
      return;
    }

    updateSlotMatrices(
      meshRefs.current,
      visualPoolRef.current,
      getSlotWindow(
        poolFrame.activeSlotIndices,
        updateWindow.startIndex,
        updateWindow.endIndex,
      ),
      animationSeconds,
      separationFrame,
    );

    if (updateWindow.wraps && updateWindow.endIndex < poolFrame.activeSlotIndices.length) {
      updateSlotMatrices(
        meshRefs.current,
        visualPoolRef.current,
        getSlotWindow(
          poolFrame.activeSlotIndices,
          0,
          Math.min(updateWindow.startIndex, poolFrame.activeSlotIndices.length),
        ),
        animationSeconds,
        separationFrame,
      );
    }
  });

  if (!enabled) {
    return null;
  }

  return (
    <group name="home-drive-pedestrian-instanced-rig" renderOrder={renderOrder}>
      {HOME_DRIVE_THREE_PEDESTRIAN_INSTANCED_RIG_PARTS.map((part) => (
        <instancedMesh
          key={part}
          ref={(mesh) => {
            meshRefs.current[part] = mesh;

            if (mesh) {
              mesh.count = 0;
              mesh.visible = false;
              mesh.frustumCulled = false;
              mesh.instanceMatrix.setUsage(DynamicDrawUsage);
            }
          }}
          args={[geometries[part], materials[part], capacity]}
          frustumCulled={false}
          renderOrder={renderOrder}
        />
      ))}
    </group>
  );
}

export default memo(HomeDriveThreePedestrianInstancedRig);
