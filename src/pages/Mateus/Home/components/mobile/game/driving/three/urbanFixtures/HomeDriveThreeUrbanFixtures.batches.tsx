// src/pages/Mateus/Home/components/mobile/game/driving/three/urbanFixtures/HomeDriveThreeUrbanFixtures.batches.tsx

import { useLayoutEffect, useMemo, useRef } from "react";
import { InstancedMesh, Object3D, type BufferGeometry } from "three";
import type { HomeDriveVector2 } from "../../domain/homeDrive.types";
import {
	selectHomeDriveUrbanFixturesNearPoint,
	type HomeDriveUrbanFixtureCollisionRuntimeState,
	type HomeDriveUrbanStreetLight,
	type HomeDriveUrbanTrafficLight,
} from "../../domain/urbanFixtures";
import {
	HOME_DRIVE_THREE_URBAN_FIXTURE_MATERIALS,
} from "./homeDriveThree.urbanFixtureMaterials";
import {
	type HomeDriveThreeUrbanFixturePart,
	type HomeDriveThreeUrbanFixtureBatch,
	type HomeDriveThreeUrbanFixtureSnapshot,
	isUrbanFixtureImpactStillAnimating,
	getUrbanFixtureImpact,
} from "./HomeDriveThreeUrbanFixtures.parts";
import {
	pushStreetLightParts,
} from "./HomeDriveThreeUrbanFixtures.streetLight";
import {
	pushTrafficLightParts,
} from "./HomeDriveThreeUrbanFixtures.trafficLight";

export function createUrbanFixtureRenderParts(
  streetLights: readonly HomeDriveUrbanStreetLight[],
  trafficLights: readonly HomeDriveUrbanTrafficLight[],
  urbanFixtureCollisions: HomeDriveUrbanFixtureCollisionRuntimeState | null | undefined,
  nowSeconds: number,
): readonly HomeDriveThreeUrbanFixturePart[] {
  const parts: HomeDriveThreeUrbanFixturePart[] = [];

  for (const light of streetLights) {
    pushStreetLightParts(
      parts,
      light,
      getUrbanFixtureImpact(urbanFixtureCollisions, light.id),
      nowSeconds,
    );
  }

  for (const trafficLight of trafficLights) {
    pushTrafficLightParts(
      parts,
      trafficLight,
      getUrbanFixtureImpact(urbanFixtureCollisions, trafficLight.id),
      nowSeconds,
    );
  }

  return parts;
}

export function groupUrbanFixturePartsByBatch(
  parts: readonly HomeDriveThreeUrbanFixturePart[],
): readonly HomeDriveThreeUrbanFixtureBatch[] {
  const map = new Map<string, HomeDriveThreeUrbanFixturePart[]>();

  for (const part of parts) {
    const key = `${part.renderOrder}:${part.geometryKind}:${part.materialKey}`;
    const current = map.get(key);

    if (current) {
      current.push(part);
      continue;
    }

    map.set(key, [part]);
  }

  return Array.from(map.entries())
    .map(([id, instances]) => {
      const first = instances[0];

      return {
        id,
        geometryKind: first.geometryKind,
        materialKey: first.materialKey,
        material: HOME_DRIVE_THREE_URBAN_FIXTURE_MATERIALS[first.materialKey],
        instances,
        renderOrder: first.renderOrder,
      };
    })
    .sort((first, second) => first.renderOrder - second.renderOrder);
}

function createFixtureKey(
  streetLights: readonly HomeDriveUrbanStreetLight[],
  trafficLights: readonly HomeDriveUrbanTrafficLight[],
): string {
  return [
    streetLights.map((light) => light.id).join("|"),
    trafficLights.map((light) => `${light.id}:${light.signalPhase}`).join("|"),
  ].join("::");
}

export function createVisibleSnapshot(
  allStreetLights: readonly HomeDriveUrbanStreetLight[],
  allTrafficLights: readonly HomeDriveUrbanTrafficLight[],
  center: HomeDriveVector2,
  visibleRadiusMeters: number,
  maxVisibleStreetLights: number,
  maxVisibleTrafficLights: number,
): HomeDriveThreeUrbanFixtureSnapshot {
  const streetLights = selectHomeDriveUrbanFixturesNearPoint(
    allStreetLights,
    center,
    visibleRadiusMeters,
    maxVisibleStreetLights,
  );
  const trafficLights = selectHomeDriveUrbanFixturesNearPoint(
    allTrafficLights,
    center,
    visibleRadiusMeters,
    maxVisibleTrafficLights,
  );

  return {
    streetLights,
    trafficLights,
    key: createFixtureKey(streetLights, trafficLights),
  };
}

export function HomeDriveThreeUrbanFixtureBatchMesh({
  batch,
  geometry,
}: Readonly<{
  batch: HomeDriveThreeUrbanFixtureBatch;
  geometry: BufferGeometry;
}>) {
  const meshRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);

  useLayoutEffect(() => {
    const mesh = meshRef.current;

    if (!mesh) {
      return;
    }

    batch.instances.forEach((instance, index) => {
      dummy.position.set(...instance.position);
      dummy.rotation.set(...instance.rotation);
      dummy.scale.set(...instance.scale);
      dummy.updateMatrix();

      mesh.setMatrixAt(index, dummy.matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [batch.instances, dummy]);

  if (batch.instances.length <= 0) {
    return null;
  }

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, batch.material, batch.instances.length]}
      frustumCulled
      renderOrder={batch.renderOrder}
    />
  );
}

export function hasVisibleUrbanFixtureFallAnimation(
  urbanFixtureCollisions: HomeDriveUrbanFixtureCollisionRuntimeState | null | undefined,
  visibleStreetLights: readonly HomeDriveUrbanStreetLight[],
  visibleTrafficLights: readonly HomeDriveUrbanTrafficLight[],
  nowSeconds: number,
): boolean {
  if (!urbanFixtureCollisions || urbanFixtureCollisions.impactedFixtureIds.length <= 0) {
    return false;
  }

  for (const light of visibleStreetLights) {
    const impact = getUrbanFixtureImpact(urbanFixtureCollisions, light.id);

    if (impact && isUrbanFixtureImpactStillAnimating(impact, nowSeconds)) {
      return true;
    }
  }

  for (const trafficLight of visibleTrafficLights) {
    const impact = getUrbanFixtureImpact(urbanFixtureCollisions, trafficLight.id);

    if (impact && isUrbanFixtureImpactStillAnimating(impact, nowSeconds)) {
      return true;
    }
  }

  return false;
}
