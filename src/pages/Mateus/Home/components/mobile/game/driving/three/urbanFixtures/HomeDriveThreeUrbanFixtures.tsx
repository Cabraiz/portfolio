// src/pages/Mateus/Home/components/mobile/game/driving/three/urbanFixtures/HomeDriveThreeUrbanFixtures.tsx

import { useFrame } from "@react-three/fiber";
import React, { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  BoxGeometry,
  CylinderGeometry,
  InstancedMesh,
  Object3D,
  SphereGeometry,
  type BufferGeometry,
  type Material,
} from "three";

import type { HomeDriveCrosswalkRuntimeState } from "../../domain/crosswalks";
import type { HomeDriveRuntimeState, HomeDriveVector2 } from "../../domain/homeDrive.types";
import {
  createHomeDriveUrbanStreetLights,
  createHomeDriveUrbanTrafficLights,
  selectHomeDriveUrbanFixturesNearPoint,
  type HomeDriveUrbanStreetLight,
  type HomeDriveUrbanTrafficLight,
} from "../../domain/urbanFixtures";
import {
  HOME_DRIVE_THREE_URBAN_FIXTURE_MATERIALS,
  type HomeDriveThreeUrbanFixtureMaterialKey,
} from "./homeDriveThree.urbanFixtureMaterials";

export type HomeDriveThreeUrbanFixturesProps = Readonly<{
  runtimeRef: HomeDriveMutableRef<HomeDriveRuntimeState>;
  crosswalksRef: HomeDriveMutableRef<HomeDriveCrosswalkRuntimeState>;
  visibleRadiusMeters?: number;
  maxVisibleStreetLights?: number;
  maxVisibleTrafficLights?: number;
  snapshotHz?: number;
}>;

type HomeDriveMutableRef<T> = {
  current: T;
};

type HomeDriveThreeUrbanFixtureGeometryKind = "box" | "cylinder" | "sphere";

type HomeDriveThreeUrbanFixturePart = Readonly<{
  id: string;
  geometryKind: HomeDriveThreeUrbanFixtureGeometryKind;
  materialKey: HomeDriveThreeUrbanFixtureMaterialKey;
  position: readonly [number, number, number];
  rotation: readonly [number, number, number];
  scale: readonly [number, number, number];
  renderOrder: number;
}>;

type HomeDriveThreeUrbanFixtureBatch = Readonly<{
  id: string;
  geometryKind: HomeDriveThreeUrbanFixtureGeometryKind;
  materialKey: HomeDriveThreeUrbanFixtureMaterialKey;
  material: Material;
  instances: readonly HomeDriveThreeUrbanFixturePart[];
  renderOrder: number;
}>;

type HomeDriveThreeUrbanFixtureSnapshot = Readonly<{
  streetLights: readonly HomeDriveUrbanStreetLight[];
  trafficLights: readonly HomeDriveUrbanTrafficLight[];
  key: string;
}>;

const DEFAULT_VISIBLE_RADIUS_METERS = 780;
const DEFAULT_MAX_VISIBLE_STREET_LIGHTS = 220;
const DEFAULT_MAX_VISIBLE_TRAFFIC_LIGHTS = 96;
const DEFAULT_SNAPSHOT_HZ = 6;

const BASE_Y = 0.08;
const DETAIL_EPSILON_Y = 0.004;

function getVectorYawRad(vector: HomeDriveVector2): number {
  return Math.atan2(-vector.z, vector.x);
}

function multiplyVector2(vector: HomeDriveVector2, scalar: number): HomeDriveVector2 {
  return {
    x: vector.x * scalar,
    z: vector.z * scalar,
  };
}

function addVector2(first: HomeDriveVector2, second: HomeDriveVector2): HomeDriveVector2 {
  return {
    x: first.x + second.x,
    z: first.z + second.z,
  };
}

function getArmDirection(fixture: Readonly<{
  roadNormal: HomeDriveVector2;
  side: -1 | 1;
}>): HomeDriveVector2 {
  return multiplyVector2(fixture.roadNormal, -fixture.side);
}

function createPart(
  part: HomeDriveThreeUrbanFixturePart,
): HomeDriveThreeUrbanFixturePart {
  return part;
}

function pushStreetLightParts(
  parts: HomeDriveThreeUrbanFixturePart[],
  light: HomeDriveUrbanStreetLight,
): void {
  const armDirection = getArmDirection(light);
  const armYawRad = getVectorYawRad(armDirection);
  const roadYawRad = getVectorYawRad(light.roadDirection);
  const poleHeight = light.heightMeters;
  const poleRadius = light.poleRadiusMeters;
  const basePosition = light.position;
  const poleTopY = BASE_Y + poleHeight;
  const armLength = light.armLengthMeters;
  const armCenter = addVector2(basePosition, multiplyVector2(armDirection, armLength * 0.5));
  const lampCenter = addVector2(basePosition, multiplyVector2(armDirection, armLength + 0.34));
  const hasBanner = light.style === "banner" || (light.style === "coastal" && light.seed > 0.58);

  parts.push(
    createPart({
      id: `${light.id}:base-slab`,
      geometryKind: "cylinder",
      materialKey: "concreteBase",
      position: [basePosition.x, BASE_Y + 0.1, basePosition.z],
      rotation: [0, 0, 0],
      scale: [0.42, 0.2, 0.42],
      renderOrder: 20,
    }),
    createPart({
      id: `${light.id}:base-collar`,
      geometryKind: "cylinder",
      materialKey: "darkMetal",
      position: [basePosition.x, BASE_Y + 0.28, basePosition.z],
      rotation: [0, 0, 0],
      scale: [0.24, 0.14, 0.24],
      renderOrder: 21,
    }),
    createPart({
      id: `${light.id}:pole`,
      geometryKind: "cylinder",
      materialKey: "brushedPole",
      position: [basePosition.x, BASE_Y + poleHeight * 0.5, basePosition.z],
      rotation: [0, 0, 0],
      scale: [poleRadius, poleHeight, poleRadius],
      renderOrder: 22,
    }),
    createPart({
      id: `${light.id}:maintenance-hatch`,
      geometryKind: "box",
      materialKey: "maintenancePlate",
      position: [
        basePosition.x + light.roadDirection.x * (poleRadius + 0.012),
        BASE_Y + 1.22,
        basePosition.z + light.roadDirection.z * (poleRadius + 0.012),
      ],
      rotation: [0, roadYawRad, 0],
      scale: [0.055, 0.46, 0.018],
      renderOrder: 25,
    }),
    createPart({
      id: `${light.id}:arm`,
      geometryKind: "box",
      materialKey: "brushedPole",
      position: [armCenter.x, poleTopY + 0.12, armCenter.z],
      rotation: [0, armYawRad, 0],
      scale: [armLength, 0.09, 0.09],
      renderOrder: 23,
    }),
    createPart({
      id: `${light.id}:arm-cable`,
      geometryKind: "box",
      materialKey: "cable",
      position: [armCenter.x, poleTopY + 0.23, armCenter.z],
      rotation: [0, armYawRad, 0],
      scale: [armLength * 0.92, 0.025, 0.025],
      renderOrder: 24,
    }),
    createPart({
      id: `${light.id}:support-strut`,
      geometryKind: "box",
      materialKey: "darkMetal",
      position: [
        basePosition.x + armDirection.x * 0.58,
        poleTopY - 0.22,
        basePosition.z + armDirection.z * 0.58,
      ],
      rotation: [0, armYawRad, -0.48],
      scale: [1.28, 0.055, 0.055],
      renderOrder: 24,
    }),
    createPart({
      id: `${light.id}:lamp-housing`,
      geometryKind: "box",
      materialKey: "lampHousing",
      position: [lampCenter.x, poleTopY + 0.03, lampCenter.z],
      rotation: [0, armYawRad, 0],
      scale: [light.lampWidthMeters, 0.22, 0.38],
      renderOrder: 26,
    }),
    createPart({
      id: `${light.id}:lamp-glass`,
      geometryKind: "sphere",
      materialKey: "lampGlass",
      position: [lampCenter.x, poleTopY - 0.12, lampCenter.z],
      rotation: [0, armYawRad, 0],
      scale: [0.22, 0.065, 0.18],
      renderOrder: 27,
    }),
    createPart({
      id: `${light.id}:lamp-glow`,
      geometryKind: "sphere",
      materialKey: "lampGlow",
      position: [lampCenter.x, poleTopY - 0.18, lampCenter.z],
      rotation: [0, armYawRad, 0],
      scale: [0.58, 0.08, 0.44],
      renderOrder: 28,
    }),
  );

  for (const boltIndex of [0, 1, 2, 3] as const) {
    const angleRad = boltIndex * (Math.PI / 2) + light.seed * Math.PI;

    parts.push(
      createPart({
        id: `${light.id}:bolt-${boltIndex}`,
        geometryKind: "sphere",
        materialKey: "darkMetal",
        position: [
          basePosition.x + Math.cos(angleRad) * 0.28,
          BASE_Y + 0.225,
          basePosition.z + Math.sin(angleRad) * 0.28,
        ],
        rotation: [0, 0, 0],
        scale: [0.045, 0.025, 0.045],
        renderOrder: 26,
      }),
    );
  }

  if (hasBanner) {
    parts.push(
      createPart({
        id: `${light.id}:banner`,
        geometryKind: "box",
        materialKey: light.style === "coastal" ? "streetNamePlate" : "bannerBlue",
        position: [
          basePosition.x + armDirection.x * 1.05,
          poleTopY - 0.82,
          basePosition.z + armDirection.z * 1.05,
        ],
        rotation: [0, armYawRad, 0],
        scale: [0.95, 0.42, 0.035],
        renderOrder: 29,
      }),
    );
  }
}

function getActiveTrafficLampMaterial(
  trafficLight: HomeDriveUrbanTrafficLight,
  lamp: "red" | "amber" | "green",
): HomeDriveThreeUrbanFixtureMaterialKey {
  const phase = trafficLight.signalPhase;

  if (phase === "walk" && lamp === "red") {
    return "signalRedActive";
  }

  if (phase === "danger" && lamp === "amber") {
    return "signalAmberActive";
  }

  if (phase === "wait" && lamp === "green") {
    return "signalGreenActive";
  }

  if (lamp === "red") {
    return "signalRedDim";
  }

  if (lamp === "amber") {
    return "signalAmberDim";
  }

  return "signalGreenDim";
}

function pushTrafficLightParts(
  parts: HomeDriveThreeUrbanFixturePart[],
  trafficLight: HomeDriveUrbanTrafficLight,
): void {
  const armDirection = getArmDirection(trafficLight);
  const armYawRad = getVectorYawRad(armDirection);
  const roadYawRad = getVectorYawRad(trafficLight.roadDirection);
  const basePosition = trafficLight.position;
  const poleHeight = trafficLight.heightMeters;
  const poleRadius = trafficLight.poleRadiusMeters;
  const poleTopY = BASE_Y + poleHeight;
  const armLength = trafficLight.armLengthMeters;
  const armCenter = addVector2(basePosition, multiplyVector2(armDirection, armLength * 0.5));
  const housingCenter = addVector2(basePosition, multiplyVector2(armDirection, armLength + 0.24));
  const panelFrontOffset = multiplyVector2(trafficLight.roadDirection, trafficLight.side > 0 ? -0.17 : 0.17);
  const pedestrianIsWalk = trafficLight.signalPhase === "walk";

  parts.push(
    createPart({
      id: `${trafficLight.id}:base-slab`,
      geometryKind: "cylinder",
      materialKey: "concreteBase",
      position: [basePosition.x, BASE_Y + 0.12, basePosition.z],
      rotation: [0, 0, 0],
      scale: [0.48, 0.24, 0.48],
      renderOrder: 20,
    }),
    createPart({
      id: `${trafficLight.id}:pole`,
      geometryKind: "cylinder",
      materialKey: "brushedPole",
      position: [basePosition.x, BASE_Y + poleHeight * 0.5, basePosition.z],
      rotation: [0, 0, 0],
      scale: [poleRadius, poleHeight, poleRadius],
      renderOrder: 22,
    }),
    createPart({
      id: `${trafficLight.id}:arm`,
      geometryKind: "box",
      materialKey: "brushedPole",
      position: [armCenter.x, poleTopY, armCenter.z],
      rotation: [0, armYawRad, 0],
      scale: [armLength, 0.12, 0.12],
      renderOrder: 23,
    }),
    createPart({
      id: `${trafficLight.id}:arm-cable`,
      geometryKind: "box",
      materialKey: "cable",
      position: [armCenter.x, poleTopY + 0.18, armCenter.z],
      rotation: [0, armYawRad, 0],
      scale: [armLength * 0.96, 0.035, 0.035],
      renderOrder: 24,
    }),
    createPart({
      id: `${trafficLight.id}:street-name-plate`,
      geometryKind: "box",
      materialKey: "streetNamePlate",
      position: [
        basePosition.x + armDirection.x * 1.42,
        poleTopY - 0.34,
        basePosition.z + armDirection.z * 1.42,
      ],
      rotation: [0, armYawRad, 0],
      scale: [1.08, 0.28, 0.035],
      renderOrder: 28,
    }),
    createPart({
      id: `${trafficLight.id}:housing-backplate`,
      geometryKind: "box",
      materialKey: "signalBackPlate",
      position: [housingCenter.x, poleTopY - 0.16, housingCenter.z],
      rotation: [0, roadYawRad, 0],
      scale: [0.72, trafficLight.housingHeightMeters + 0.18, 0.12],
      renderOrder: 29,
    }),
    createPart({
      id: `${trafficLight.id}:housing`,
      geometryKind: "box",
      materialKey: "signalHousing",
      position: [housingCenter.x, poleTopY - 0.16, housingCenter.z],
      rotation: [0, roadYawRad, 0],
      scale: [0.54, trafficLight.housingHeightMeters, 0.28],
      renderOrder: 30,
    }),
    createPart({
      id: `${trafficLight.id}:pedestrian-panel`,
      geometryKind: "box",
      materialKey: "pedestrianPanel",
      position: [
        basePosition.x + panelFrontOffset.x,
        BASE_Y + 2.78,
        basePosition.z + panelFrontOffset.z,
      ],
      rotation: [0, roadYawRad, 0],
      scale: [0.48, 0.64, 0.12],
      renderOrder: 30,
    }),
    createPart({
      id: `${trafficLight.id}:pedestrian-lamp`,
      geometryKind: "sphere",
      materialKey: pedestrianIsWalk ? "pedestrianWalk" : "pedestrianWait",
      position: [
        basePosition.x + panelFrontOffset.x * 1.55,
        BASE_Y + 2.78,
        basePosition.z + panelFrontOffset.z * 1.55,
      ],
      rotation: [0, roadYawRad, 0],
      scale: [0.16, 0.16, 0.05],
      renderOrder: 31,
    }),
  );

  const lampConfigs = [
    { key: "red", yOffset: 0.26 },
    { key: "amber", yOffset: -0.08 },
    { key: "green", yOffset: -0.42 },
  ] as const;

  for (const lamp of lampConfigs) {
    parts.push(
      createPart({
        id: `${trafficLight.id}:lamp-${lamp.key}`,
        geometryKind: "sphere",
        materialKey: getActiveTrafficLampMaterial(trafficLight, lamp.key),
        position: [
          housingCenter.x + panelFrontOffset.x * 0.6,
          poleTopY + lamp.yOffset,
          housingCenter.z + panelFrontOffset.z * 0.6,
        ],
        rotation: [0, roadYawRad, 0],
        scale: [0.155, 0.155, 0.07],
        renderOrder: 32,
      }),
      createPart({
        id: `${trafficLight.id}:visor-${lamp.key}`,
        geometryKind: "box",
        materialKey: "darkMetal",
        position: [
          housingCenter.x + panelFrontOffset.x * 0.9,
          poleTopY + lamp.yOffset + 0.095,
          housingCenter.z + panelFrontOffset.z * 0.9,
        ],
        rotation: [0, roadYawRad, 0],
        scale: [0.42, 0.055, 0.24],
        renderOrder: 33,
      }),
    );
  }

  for (const boltIndex of [0, 1, 2, 3] as const) {
    const angleRad = boltIndex * (Math.PI / 2) + trafficLight.seed * Math.PI;

    parts.push(
      createPart({
        id: `${trafficLight.id}:bolt-${boltIndex}`,
        geometryKind: "sphere",
        materialKey: "darkMetal",
        position: [
          basePosition.x + Math.cos(angleRad) * 0.32,
          BASE_Y + 0.255 + DETAIL_EPSILON_Y,
          basePosition.z + Math.sin(angleRad) * 0.32,
        ],
        rotation: [0, 0, 0],
        scale: [0.052, 0.028, 0.052],
        renderOrder: 34,
      }),
    );
  }
}

function createUrbanFixtureRenderParts(
  streetLights: readonly HomeDriveUrbanStreetLight[],
  trafficLights: readonly HomeDriveUrbanTrafficLight[],
): readonly HomeDriveThreeUrbanFixturePart[] {
  const parts: HomeDriveThreeUrbanFixturePart[] = [];

  for (const light of streetLights) {
    pushStreetLightParts(parts, light);
  }

  for (const trafficLight of trafficLights) {
    pushTrafficLightParts(parts, trafficLight);
  }

  return parts;
}

function groupUrbanFixturePartsByBatch(
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

function createVisibleSnapshot(
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

function HomeDriveThreeUrbanFixtureBatchMesh({
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

function HomeDriveThreeUrbanFixtures({
  runtimeRef,
  crosswalksRef,
  visibleRadiusMeters = DEFAULT_VISIBLE_RADIUS_METERS,
  maxVisibleStreetLights = DEFAULT_MAX_VISIBLE_STREET_LIGHTS,
  maxVisibleTrafficLights = DEFAULT_MAX_VISIBLE_TRAFFIC_LIGHTS,
  snapshotHz = DEFAULT_SNAPSHOT_HZ,
}: HomeDriveThreeUrbanFixturesProps) {
  const allStreetLights = useMemo(() => {
    return createHomeDriveUrbanStreetLights({
      density: 1.18,
      maxLights: 1040,
      minRoadLengthMeters: 58,
      seed: 17191,
    });
  }, []);

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

  useFrame((_, deltaSeconds) => {
    accumulatorRef.current += deltaSeconds;

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
    return createUrbanFixtureRenderParts(snapshot.streetLights, snapshot.trafficLights);
  }, [snapshot.streetLights, snapshot.trafficLights]);

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
