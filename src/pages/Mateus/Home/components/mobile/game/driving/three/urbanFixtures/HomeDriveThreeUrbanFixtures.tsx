// src/pages/Mateus/Home/components/mobile/game/driving/three/urbanFixtures/HomeDriveThreeUrbanFixtures.tsx

import { useFrame } from "@react-three/fiber";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import {
	BoxGeometry,
	CylinderGeometry,
	SphereGeometry,
	type BufferGeometry,
} from "three";

import type { HomeDriveCrosswalkRuntimeState } from "../../domain/crosswalks";
import type { HomeDriveRuntimeState } from "../../domain/homeDrive.types";
import {
	createHomeDriveUrbanStreetLights,
	createHomeDriveUrbanTrafficLights,
	type HomeDriveUrbanFixtureCollisionRuntimeState,
	type HomeDriveUrbanStreetLight,
} from "../../domain/urbanFixtures";
import {
	type HomeDriveMutableRef,
	type HomeDriveThreeUrbanFixtureGeometryKind,
	type HomeDriveThreeUrbanFixtureSnapshot,
	DEFAULT_VISIBLE_RADIUS_METERS,
	DEFAULT_MAX_VISIBLE_STREET_LIGHTS,
	DEFAULT_MAX_VISIBLE_TRAFFIC_LIGHTS,
	DEFAULT_SNAPSHOT_HZ,
} from "./HomeDriveThreeUrbanFixtures.parts";
import {
	createUrbanFixtureRenderParts,
	groupUrbanFixturePartsByBatch,
	createVisibleSnapshot,
	HomeDriveThreeUrbanFixtureBatchMesh,
	hasVisibleUrbanFixtureFallAnimation,
} from "./HomeDriveThreeUrbanFixtures.batches";

export type HomeDriveThreeUrbanFixturesProps = Readonly<{
  runtimeRef: HomeDriveMutableRef<HomeDriveRuntimeState>;
  crosswalksRef: HomeDriveMutableRef<HomeDriveCrosswalkRuntimeState>;
  urbanFixtureCollisionsRef?: HomeDriveMutableRef<HomeDriveUrbanFixtureCollisionRuntimeState>;
  streetLights?: readonly HomeDriveUrbanStreetLight[];
  visibleRadiusMeters?: number;
  maxVisibleStreetLights?: number;
  maxVisibleTrafficLights?: number;
  snapshotHz?: number;
}>;

function HomeDriveThreeUrbanFixtures({
  runtimeRef,
  crosswalksRef,
  urbanFixtureCollisionsRef,
  streetLights,
  visibleRadiusMeters = DEFAULT_VISIBLE_RADIUS_METERS,
  maxVisibleStreetLights = DEFAULT_MAX_VISIBLE_STREET_LIGHTS,
  maxVisibleTrafficLights = DEFAULT_MAX_VISIBLE_TRAFFIC_LIGHTS,
  snapshotHz = DEFAULT_SNAPSHOT_HZ,
}: HomeDriveThreeUrbanFixturesProps) {
  const generatedStreetLights = useMemo(() => {
    return createHomeDriveUrbanStreetLights({
      density: 1.18,
      maxLights: 1040,
      minRoadLengthMeters: 58,
      seed: 17191,
    });
  }, []);
  const allStreetLights = streetLights ?? generatedStreetLights;

  const [snapshot, setSnapshot] = useState<HomeDriveThreeUrbanFixtureSnapshot>(() => {
    const allTrafficLights = createHomeDriveUrbanTrafficLights(
      crosswalksRef.current.crosswalks,
      crosswalksRef.current.elapsedSeconds,
    );

    return createVisibleSnapshot(
      allStreetLights,
      allTrafficLights,
      runtimeRef.current.car.position,
      visibleRadiusMeters,
      maxVisibleStreetLights,
      maxVisibleTrafficLights,
    );
  });

  const accumulatorRef = useRef(0);
  const [collisionSerial, setCollisionSerial] = useState(() => {
    return urbanFixtureCollisionsRef?.current.serial ?? 0;
  });
  const collisionSerialRef = useRef(collisionSerial);
  const [animationTick, setAnimationTick] = useState(0);

  useFrame((_, deltaSeconds) => {
    accumulatorRef.current += deltaSeconds;

    const nextCollisionSerial = urbanFixtureCollisionsRef?.current.serial ?? 0;

    if (nextCollisionSerial !== collisionSerialRef.current) {
      collisionSerialRef.current = nextCollisionSerial;
      setCollisionSerial(nextCollisionSerial);
    }

    if (
      hasVisibleUrbanFixtureFallAnimation(
        urbanFixtureCollisionsRef?.current,
        snapshot.streetLights,
        snapshot.trafficLights,
        runtimeRef.current.elapsedSeconds,
      )
    ) {
      setAnimationTick((currentTick) => (currentTick + 1) % 100000);
    }

    const intervalSeconds = 1 / Math.max(1, Math.min(snapshotHz, 12));

    if (accumulatorRef.current < intervalSeconds) {
      return;
    }

    accumulatorRef.current = 0;

    const allTrafficLights = createHomeDriveUrbanTrafficLights(
      crosswalksRef.current.crosswalks,
      crosswalksRef.current.elapsedSeconds,
    );
    const nextSnapshot = createVisibleSnapshot(
      allStreetLights,
      allTrafficLights,
      runtimeRef.current.car.position,
      visibleRadiusMeters,
      maxVisibleStreetLights,
      maxVisibleTrafficLights,
    );

    setSnapshot((currentSnapshot) => {
      return currentSnapshot.key === nextSnapshot.key ? currentSnapshot : nextSnapshot;
    });
  });

  const parts = useMemo(() => {
    return createUrbanFixtureRenderParts(
      snapshot.streetLights,
      snapshot.trafficLights,
      urbanFixtureCollisionsRef?.current,
      runtimeRef.current.elapsedSeconds,
    );
  }, [
    animationTick,
    collisionSerial,
    snapshot.streetLights,
    snapshot.trafficLights,
    runtimeRef,
    urbanFixtureCollisionsRef,
  ]);

  const batches = useMemo(() => {
    return groupUrbanFixturePartsByBatch(parts);
  }, [parts]);

  const boxGeometry = useMemo(() => new BoxGeometry(1, 1, 1), []);
  const cylinderGeometry = useMemo(() => new CylinderGeometry(1, 1, 1, 12), []);
  const sphereGeometry = useMemo(() => new SphereGeometry(1, 12, 8), []);

  const geometries = useMemo<Readonly<Record<HomeDriveThreeUrbanFixtureGeometryKind, BufferGeometry>>>(
    () => ({
      box: boxGeometry,
      cylinder: cylinderGeometry,
      sphere: sphereGeometry,
    }),
    [boxGeometry, cylinderGeometry, sphereGeometry],
  );

  useEffect(() => {
    return () => {
      boxGeometry.dispose();
      cylinderGeometry.dispose();
      sphereGeometry.dispose();
    };
  }, [boxGeometry, cylinderGeometry, sphereGeometry]);

  if (batches.length <= 0) {
    return null;
  }

  return (
    <group>
      {batches.map((batch) => (
        <HomeDriveThreeUrbanFixtureBatchMesh
          key={batch.id}
          batch={batch}
          geometry={geometries[batch.geometryKind]}
        />
      ))}
    </group>
  );
}

export default memo(HomeDriveThreeUrbanFixtures);
