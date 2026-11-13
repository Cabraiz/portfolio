// src/pages/Mateus/Home/components/mobile/game/driving/three/HomeDriveThreeTraffic.tsx

import { useFrame } from "@react-three/fiber";
import React, { memo, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import {
  BoxGeometry,
  CylinderGeometry,
  DynamicDrawUsage,
  InstancedMesh,
  Object3D,
  SphereGeometry,
  type BufferGeometry,
  type Material,
} from "three";
import {
  getHomeDriveTrafficPerformanceProfile,
  getHomeDriveTrafficRenderTier,
  getHomeDriveTrafficSpatialRelation,
  type HomeDriveTrafficRenderTier,
} from "../domain/homeDrive.trafficPerformance";

import type {
  HomeDriveThreeTrafficProps,
  HomeDriveTrafficRef,
  HomeDriveTrafficRenderTiersRef,
  TrafficBatch,
  TrafficPart,
} from "./HomeDriveThreeTraffic/trafficTypes";
import {
  PAINTED_TRAFFIC_PARTS,
  createAllTrafficBatch,
  groupTrafficByColor,
} from "./HomeDriveThreeTraffic/trafficMaterials";
import {
  SHARED_PART_CONFIGS,
} from "./HomeDriveThreeTraffic/trafficSharedParts";
import {
  getTrafficPartUpdateStride,
  hideTrafficPartMatrix,
  shouldRenderTrafficPartForTier,
} from "./HomeDriveThreeTraffic/trafficPartVisibility";
import {
  setVehiclePartMatrix,
} from "./HomeDriveThreeTraffic/trafficPartTransform";

export type {
  HomeDriveThreeTrafficProps,
} from "./HomeDriveThreeTraffic/trafficTypes";

function HomeDriveTrafficInstancedPart({
  trafficRef,
  batch,
  geometry,
  part,
  material,
  renderOrder,
  renderTiersRef,
  packVisibleInstances,
}: Readonly<{
  trafficRef: HomeDriveTrafficRef;
  batch: TrafficBatch;
  geometry: BufferGeometry;
  part: TrafficPart;
  material: Material;
  renderOrder: number;
  renderTiersRef: HomeDriveTrafficRenderTiersRef;
  packVisibleInstances: boolean;
}>) {
  const meshRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const frameIndexRef = useRef(0);
  const updateStride = getTrafficPartUpdateStride(part);

  const syncInstances = () => {
    const mesh = meshRef.current;

    if (!mesh) {
      return;
    }

    const traffic = trafficRef.current;
    const vehicles = traffic.vehicles;
    const elapsedSeconds = traffic.elapsedSeconds;
    const renderTiers = renderTiersRef.current;
    let packedInstanceIndex = 0;

    batch.indexes.forEach((vehicleIndex, legacyInstanceIndex) => {
      const vehicle = vehicles[vehicleIndex];
      const tier = renderTiers[vehicleIndex] ?? "full";

      if (!vehicle || !shouldRenderTrafficPartForTier(part, tier)) {
        if (!packVisibleInstances) {
          hideTrafficPartMatrix(dummy);
          mesh.setMatrixAt(legacyInstanceIndex, dummy.matrix);
        }

        return;
      }

      setVehiclePartMatrix(dummy, vehicle, part, elapsedSeconds);
      mesh.setMatrixAt(
        packVisibleInstances ? packedInstanceIndex : legacyInstanceIndex,
        dummy.matrix,
      );
      packedInstanceIndex += 1;
    });

    mesh.count = packVisibleInstances ? packedInstanceIndex : batch.indexes.length;
    mesh.instanceMatrix.needsUpdate = true;
  };

  useLayoutEffect(() => {
    if (meshRef.current) {
      meshRef.current.instanceMatrix.setUsage(DynamicDrawUsage);
    }

    syncInstances();
  }, [batch.indexes, dummy, part]);

  useFrame(() => {
    frameIndexRef.current += 1;

    if (updateStride > 1 && frameIndexRef.current % updateStride !== 0) {
      return;
    }

    syncInstances();
  });

  if (batch.indexes.length <= 0) {
    return null;
  }

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, batch.indexes.length]}
      frustumCulled={false}
      renderOrder={renderOrder}
    />
  );
}

function HomeDriveThreeTraffic({
  trafficRef,
  runtimeRef,
  isPortrait,
}: HomeDriveThreeTrafficProps) {
  const vehicles = trafficRef.current.vehicles;
  const trafficPerformance = useMemo(
    () => getHomeDriveTrafficPerformanceProfile(isPortrait),
    [isPortrait],
  );
  const renderTiersRef = useRef<readonly HomeDriveTrafficRenderTier[]>([]);
  const visibilityAccumulatorRef = useRef(0);

  const syncVisibilityMask = () => {
    const runtime = runtimeRef.current;
    const traffic = trafficRef.current;
    const tiers: HomeDriveTrafficRenderTier[] = traffic.vehicles.map(() => "hidden");
    const candidates = traffic.vehicles
      .map((vehicle, index) => {
        const tier = getHomeDriveTrafficRenderTier(
          vehicle,
          runtime.car.position,
          runtime.car.headingRad,
          runtime.car.speedMps,
          trafficPerformance,
        );

        if (tier === "hidden") {
          return null;
        }

        const relation = getHomeDriveTrafficSpatialRelation(
          vehicle.position,
          runtime.car.position,
          runtime.car.headingRad,
        );
        const tierWeight =
          tier === "full" ? -900 : tier === "core" ? -420 : -120;
        const forwardPenalty = relation.forwardMeters < 0
          ? Math.abs(relation.forwardMeters) * 2.2
          : relation.forwardMeters * 0.16;

        return {
          index,
          tier,
          score: tierWeight + relation.distanceMeters + relation.lateralAbsMeters * 0.65 + forwardPenalty,
        };
      })
      .filter((candidate): candidate is NonNullable<typeof candidate> => Boolean(candidate))
      .sort((first, second) => first.score - second.score)
      .slice(0, trafficPerformance.renderMaxVisibleVehicles);

    candidates.forEach((candidate) => {
      tiers[candidate.index] = candidate.tier;
    });

    renderTiersRef.current = tiers;
  };

  useLayoutEffect(() => {
    syncVisibilityMask();
  }, [trafficPerformance]);

  useFrame((_, deltaSeconds) => {
    visibilityAccumulatorRef.current += deltaSeconds;

    if (visibilityAccumulatorRef.current < 1 / trafficPerformance.renderMaskHz) {
      return;
    }

    visibilityAccumulatorRef.current = 0;
    syncVisibilityMask();
  });

  const colorBatches = useMemo(() => {
    return groupTrafficByColor(vehicles);
  }, [vehicles]);

  const allTrafficBatch = useMemo(() => {
    return createAllTrafficBatch(vehicles);
  }, [vehicles]);

  const boxGeometry = useMemo(() => new BoxGeometry(1, 1, 1), []);
  const wheelGeometry = useMemo(
    () => new CylinderGeometry(1, 1, 1, 18, 1),
    [],
  );
  const sphereGeometry = useMemo(() => new SphereGeometry(1, 14, 10), []);

  useEffect(() => {
    return () => {
      boxGeometry.dispose();
      wheelGeometry.dispose();
      sphereGeometry.dispose();
    };
  }, [boxGeometry, sphereGeometry, wheelGeometry]);

  return (
    <group>
      {colorBatches.map((batch) => (
        <React.Fragment key={batch.id}>
          {PAINTED_TRAFFIC_PARTS.map((part) => (
            <HomeDriveTrafficInstancedPart
              key={`${batch.id}-${part}`}
              trafficRef={trafficRef}
              batch={batch}
              geometry={boxGeometry}
              part={part}
              material={batch.material}
              renderOrder={16}
              renderTiersRef={renderTiersRef}
              packVisibleInstances={trafficPerformance.packVisibleInstancesEnabled}
            />
          ))}
        </React.Fragment>
      ))}

      {SHARED_PART_CONFIGS.map((config) => (
        <HomeDriveTrafficInstancedPart
          key={`traffic-shared-${config.part}`}
          trafficRef={trafficRef}
          batch={allTrafficBatch}
          geometry={
            config.geometryKind === "wheel"
              ? wheelGeometry
              : config.geometryKind === "sphere"
                ? sphereGeometry
                : boxGeometry
          }
          part={config.part}
          material={config.material}
          renderOrder={config.renderOrder}
          renderTiersRef={renderTiersRef}
          packVisibleInstances={trafficPerformance.packVisibleInstancesEnabled}
        />
      ))}
    </group>
  );
}

export default memo(HomeDriveThreeTraffic);
