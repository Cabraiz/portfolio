// src/pages/Mateus/Home/components/mobile/game/driving/three/crosswalks/HomeDriveThreeCrosswalks.tsx

import React, { memo, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import {
  CylinderGeometry,
  InstancedMesh,
  Object3D,
  PlaneGeometry,
  SphereGeometry,
  type Material,
} from "three";

import type {
  HomeDriveCrosswalk,
  HomeDriveCrosswalkRuntimeState,
  HomeDriveCrosswalkSignalPhase,
} from "../../domain/crosswalks";
import type { HomeDriveRuntimeState } from "../../domain/homeDrive.types";
import { HOME_DRIVE_THREE_CROSSWALK_MATERIALS } from "./homeDriveThree.crosswalkMaterials";

type HomeDriveMutableRef<T> = {
  current: T;
};

export type HomeDriveThreeCrosswalksProps = Readonly<{
  crosswalksRef: HomeDriveMutableRef<HomeDriveCrosswalkRuntimeState>;
  runtimeRef?: HomeDriveMutableRef<HomeDriveRuntimeState>;
  visibleRadiusMeters?: number;
  maxVisibleCrosswalks?: number;
  showSignals?: boolean;
}>;

type CrosswalkStripeInstance = Readonly<{
  id: string;
  materialKey: CrosswalkStripeMaterialKey;
  position: readonly [number, number, number];
  rotationYRad: number;
  scale: readonly [number, number, number];
}>;

type CrosswalkSignalInstance = Readonly<{
  id: string;
  phase: HomeDriveCrosswalkSignalPhase;
  position: readonly [number, number, number];
  scale: readonly [number, number, number];
}>;

type CrosswalkPoleInstance = Readonly<{
  id: string;
  position: readonly [number, number, number];
  scale: readonly [number, number, number];
}>;

type CrosswalkStripeMaterialKey =
  | "stripe"
  | "stripeWorn"
  | "stripeOld"
  | "schoolYellow"
  | "shadow";

const DEFAULT_VISIBLE_RADIUS_METERS = 780;
const DEFAULT_MAX_VISIBLE_CROSSWALKS = 96;
const CROSSWALK_SURFACE_Y = 0.035;

const STRIPE_MATERIALS: Readonly<Record<CrosswalkStripeMaterialKey, Material>> =
  Object.freeze({
    stripe: HOME_DRIVE_THREE_CROSSWALK_MATERIALS.stripe,
    stripeWorn: HOME_DRIVE_THREE_CROSSWALK_MATERIALS.stripeWorn,
    stripeOld: HOME_DRIVE_THREE_CROSSWALK_MATERIALS.stripeOld,
    schoolYellow: HOME_DRIVE_THREE_CROSSWALK_MATERIALS.schoolYellow,
    shadow: HOME_DRIVE_THREE_CROSSWALK_MATERIALS.shadow,
  });

function getCrosswalkRoadRotationYRad(crosswalk: HomeDriveCrosswalk): number {
  return Math.atan2(-crosswalk.roadDirection.z, crosswalk.roadDirection.x);
}

function getDistanceSquaredToRuntime(
  crosswalk: HomeDriveCrosswalk,
  runtimeRef?: HomeDriveMutableRef<HomeDriveRuntimeState>,
): number {
  if (!runtimeRef) {
    return 0;
  }

  const car = runtimeRef.current.car;
  const dx = crosswalk.position.x - car.position.x;
  const dz = crosswalk.position.z - car.position.z;

  return dx * dx + dz * dz;
}

function selectVisibleCrosswalks(
  crosswalks: readonly HomeDriveCrosswalk[],
  runtimeRef: HomeDriveMutableRef<HomeDriveRuntimeState> | undefined,
  visibleRadiusMeters: number,
  maxVisibleCrosswalks: number,
): readonly HomeDriveCrosswalk[] {
  const radiusSq = visibleRadiusMeters * visibleRadiusMeters;

  return crosswalks
    .filter((crosswalk) => {
      if (!runtimeRef) {
        return true;
      }

      return getDistanceSquaredToRuntime(crosswalk, runtimeRef) <= radiusSq;
    })
    .sort((first, second) => {
      const firstDistance = getDistanceSquaredToRuntime(first, runtimeRef);
      const secondDistance = getDistanceSquaredToRuntime(second, runtimeRef);

      if (firstDistance !== secondDistance) {
        return firstDistance - secondDistance;
      }

      return first.id.localeCompare(second.id);
    })
    .slice(0, maxVisibleCrosswalks);
}

function getStripeMaterialKey(
  crosswalk: HomeDriveCrosswalk,
  stripeIndex: number,
): CrosswalkStripeMaterialKey {
  if (crosswalk.kind === "school" && stripeIndex % 3 === 0) {
    return "schoolYellow";
  }

  const seed = (crosswalk.seed * 997 + stripeIndex * 0.137) % 1;

  if (seed > 0.78) {
    return "stripeOld";
  }

  if (seed > 0.48) {
    return "stripeWorn";
  }

  return "stripe";
}

function createCrosswalkStripeInstances(
  crosswalks: readonly HomeDriveCrosswalk[],
): readonly CrosswalkStripeInstance[] {
  const stripes: CrosswalkStripeInstance[] = [];

  for (const crosswalk of crosswalks) {
    const rotationYRad = getCrosswalkRoadRotationYRad(crosswalk);

    const safeStripeCount = Math.max(1, crosswalk.stripeCount);
    const startOffset = -crosswalk.widthMeters / 2;
    const step = crosswalk.widthMeters / safeStripeCount;

    const stripeLengthMeters = Math.max(
      crosswalk.lengthMeters * 0.78,
      crosswalk.stripeLengthMeters,
    );

    const stripeWidthMeters = Math.min(
      step * 0.62,
      Math.max(0.48, crosswalk.stripeWidthMeters),
    );

    stripes.push({
      id: `${crosswalk.id}::shadow`,
      materialKey: "shadow",
      position: [
        crosswalk.position.x,
        CROSSWALK_SURFACE_Y - 0.003,
        crosswalk.position.z,
      ],
      rotationYRad,
      scale: [crosswalk.lengthMeters + 1.4, crosswalk.widthMeters + 1.1, 1],
    });

    for (let stripeIndex = 0; stripeIndex < safeStripeCount; stripeIndex += 1) {
      const lateralOffset = startOffset + (stripeIndex + 0.5) * step;

      stripes.push({
        id: `${crosswalk.id}::stripe-${stripeIndex}`,
        materialKey: getStripeMaterialKey(crosswalk, stripeIndex),
        position: [
          crosswalk.position.x + crosswalk.roadNormal.x * lateralOffset,
          CROSSWALK_SURFACE_Y + stripeIndex * 0.00008,
          crosswalk.position.z + crosswalk.roadNormal.z * lateralOffset,
        ],
        rotationYRad,
        scale: [stripeLengthMeters, stripeWidthMeters, 1],
      });
    }

    if (
      crosswalk.kind === "double-zebra" ||
      crosswalk.kind === "avenue-zebra"
    ) {
      const edgeOffset = crosswalk.lengthMeters * 0.5;

      for (const sign of [-1, 1] as const) {
        stripes.push({
          id: `${crosswalk.id}::edge-${sign}`,
          materialKey: "stripeWorn",
          position: [
            crosswalk.position.x +
              crosswalk.roadDirection.x * edgeOffset * sign,
            CROSSWALK_SURFACE_Y + 0.002,
            crosswalk.position.z +
              crosswalk.roadDirection.z * edgeOffset * sign,
          ],
          rotationYRad,
          scale: [0.22, crosswalk.widthMeters, 1],
        });
      }
    }
  }

  return stripes;
}

function createSignalPoleInstances(
  crosswalks: readonly HomeDriveCrosswalk[],
): readonly CrosswalkPoleInstance[] {
  const poles: CrosswalkPoleInstance[] = [];

  for (const crosswalk of crosswalks) {
    if (!crosswalk.hasYieldControl || crosswalk.signalPhase === "off") {
      continue;
    }

    const sideOffset = crosswalk.widthMeters * 0.52;
    const forwardOffset = crosswalk.lengthMeters * 0.58;

    for (const side of [-1, 1] as const) {
      poles.push({
        id: `${crosswalk.id}::pole-${side}`,
        position: [
          crosswalk.position.x +
            crosswalk.roadNormal.x * sideOffset * side +
            crosswalk.roadDirection.x * forwardOffset,
          1.25,
          crosswalk.position.z +
            crosswalk.roadNormal.z * sideOffset * side +
            crosswalk.roadDirection.z * forwardOffset,
        ],
        scale: [0.09, 2.5, 0.09],
      });
    }
  }

  return poles;
}

function createSignalLightInstances(
  crosswalks: readonly HomeDriveCrosswalk[],
): readonly CrosswalkSignalInstance[] {
  const lights: CrosswalkSignalInstance[] = [];

  for (const crosswalk of crosswalks) {
    if (!crosswalk.hasYieldControl || crosswalk.signalPhase === "off") {
      continue;
    }

    const sideOffset = crosswalk.widthMeters * 0.52;
    const forwardOffset = crosswalk.lengthMeters * 0.58;

    for (const side of [-1, 1] as const) {
      lights.push({
        id: `${crosswalk.id}::signal-${side}`,
        phase: crosswalk.signalPhase,
        position: [
          crosswalk.position.x +
            crosswalk.roadNormal.x * sideOffset * side +
            crosswalk.roadDirection.x * forwardOffset,
          2.65,
          crosswalk.position.z +
            crosswalk.roadNormal.z * sideOffset * side +
            crosswalk.roadDirection.z * forwardOffset,
        ],
        scale: [0.34, 0.34, 0.34],
      });
    }
  }

  return lights;
}

function groupStripeInstancesByMaterial(
  stripes: readonly CrosswalkStripeInstance[],
): ReadonlyMap<CrosswalkStripeMaterialKey, readonly CrosswalkStripeInstance[]> {
  const map = new Map<CrosswalkStripeMaterialKey, CrosswalkStripeInstance[]>();

  for (const stripe of stripes) {
    const current = map.get(stripe.materialKey);

    if (current) {
      current.push(stripe);
      continue;
    }

    map.set(stripe.materialKey, [stripe]);
  }

  return map;
}

function HomeDriveThreeCrosswalkStripeBatch({
  instances,
  geometry,
  material,
}: Readonly<{
  instances: readonly CrosswalkStripeInstance[];
  geometry: PlaneGeometry;
  material: Material;
}>) {
  const meshRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);

  useLayoutEffect(() => {
    const mesh = meshRef.current;

    if (!mesh) {
      return;
    }

    instances.forEach((instance, index) => {
      dummy.position.set(...instance.position);
      dummy.rotation.set(-Math.PI / 2, 0, instance.rotationYRad);
      dummy.scale.set(...instance.scale);
      dummy.updateMatrix();

      mesh.setMatrixAt(index, dummy.matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [dummy, instances]);

  if (instances.length <= 0) {
    return null;
  }

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, instances.length]}
      frustumCulled
      renderOrder={16}
    />
  );
}

function HomeDriveThreeCrosswalkPoleBatch({
  instances,
  geometry,
}: Readonly<{
  instances: readonly CrosswalkPoleInstance[];
  geometry: CylinderGeometry;
}>) {
  const meshRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);

  useLayoutEffect(() => {
    const mesh = meshRef.current;

    if (!mesh) {
      return;
    }

    instances.forEach((instance, index) => {
      dummy.position.set(...instance.position);
      dummy.scale.set(...instance.scale);
      dummy.updateMatrix();

      mesh.setMatrixAt(index, dummy.matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [dummy, instances]);

  if (instances.length <= 0) {
    return null;
  }

  return (
    <instancedMesh
      ref={meshRef}
      args={[
        geometry,
        HOME_DRIVE_THREE_CROSSWALK_MATERIALS.signalPole,
        instances.length,
      ]}
      frustumCulled
      renderOrder={24}
    />
  );
}

function getSignalMaterial(phase: HomeDriveCrosswalkSignalPhase): Material {
  switch (phase) {
    case "walk":
      return HOME_DRIVE_THREE_CROSSWALK_MATERIALS.signalWalk;

    case "danger":
      return HOME_DRIVE_THREE_CROSSWALK_MATERIALS.signalDanger;

    case "wait":
    case "off":
    default:
      return HOME_DRIVE_THREE_CROSSWALK_MATERIALS.signalWait;
  }
}

function HomeDriveThreeCrosswalkSignals({
  instances,
  geometry,
}: Readonly<{
  instances: readonly CrosswalkSignalInstance[];
  geometry: SphereGeometry;
}>) {
  if (instances.length <= 0) {
    return null;
  }

  return (
    <group>
      {instances.map((instance) => (
        <mesh
          key={instance.id}
          geometry={geometry}
          material={getSignalMaterial(instance.phase)}
          position={instance.position}
          scale={instance.scale}
          renderOrder={25}
          frustumCulled
        />
      ))}
    </group>
  );
}

function HomeDriveThreeCrosswalks({
  crosswalksRef,
  runtimeRef,
  visibleRadiusMeters = DEFAULT_VISIBLE_RADIUS_METERS,
  maxVisibleCrosswalks = DEFAULT_MAX_VISIBLE_CROSSWALKS,
  showSignals = true,
}: HomeDriveThreeCrosswalksProps) {
  const visibleCrosswalks = useMemo(() => {
    return selectVisibleCrosswalks(
      crosswalksRef.current.crosswalks,
      runtimeRef,
      visibleRadiusMeters,
      maxVisibleCrosswalks,
    );
  }, [crosswalksRef, maxVisibleCrosswalks, runtimeRef, visibleRadiusMeters]);

  const stripeInstances = useMemo(() => {
    return createCrosswalkStripeInstances(visibleCrosswalks);
  }, [visibleCrosswalks]);

  const stripeBatches = useMemo(() => {
    return groupStripeInstancesByMaterial(stripeInstances);
  }, [stripeInstances]);

  const poleInstances = useMemo(() => {
    return showSignals ? createSignalPoleInstances(visibleCrosswalks) : [];
  }, [showSignals, visibleCrosswalks]);

  const signalInstances = useMemo(() => {
    return showSignals ? createSignalLightInstances(visibleCrosswalks) : [];
  }, [showSignals, visibleCrosswalks]);

  const planeGeometry = useMemo(() => new PlaneGeometry(1, 1), []);
  const poleGeometry = useMemo(() => new CylinderGeometry(1, 1, 1, 8), []);
  const signalGeometry = useMemo(() => new SphereGeometry(1, 12, 8), []);

  useEffect(() => {
    return () => {
      planeGeometry.dispose();
      poleGeometry.dispose();
      signalGeometry.dispose();
    };
  }, [planeGeometry, poleGeometry, signalGeometry]);

  return (
    <group>
      {Array.from(stripeBatches.entries()).map(([materialKey, instances]) => (
        <HomeDriveThreeCrosswalkStripeBatch
          key={materialKey}
          instances={instances}
          geometry={planeGeometry}
          material={STRIPE_MATERIALS[materialKey]}
        />
      ))}

      {showSignals ? (
        <>
          <HomeDriveThreeCrosswalkPoleBatch
            instances={poleInstances}
            geometry={poleGeometry}
          />
          <HomeDriveThreeCrosswalkSignals
            instances={signalInstances}
            geometry={signalGeometry}
          />
        </>
      ) : null}
    </group>
  );
}

export default memo(HomeDriveThreeCrosswalks);
