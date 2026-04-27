// src/pages/Mateus/Home/components/mobile/game/driving/three/HomeDriveThreeBuildings.tsx

import React, { memo, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import {
  BoxGeometry,
  BufferGeometry,
  InstancedMesh,
  Matrix4,
  Object3D,
  PlaneGeometry,
  type Material,
} from "three";

import { getHomeDriveBuildings } from "../domain/homeDrive.buildings";
import type {
  HomeDriveBuilding,
  HomeDriveBuildingFacadeProfile,
  HomeDriveBuildingFacadeStyle,
  HomeDriveBuildingMaterialKey,
  HomeDriveBuildingRoofStyle,
} from "../domain/homeDrive.building.types";
import { HOME_DRIVE_THREE_MATERIALS } from "./homeDriveThree.materials";

const MAX_BUILDINGS = 260;
const MAX_FACADE_DETAILS = 5200;
const FACADE_SURFACE_OFFSET_METERS = 0.085;

type BuildingBatch = Readonly<{
  materialKey: HomeDriveBuildingMaterialKey;
  buildings: readonly HomeDriveBuilding[];
}>;

type BuildingInstance = Readonly<{
  id: string;
  position: readonly [number, number, number];
  rotationYRad: number;
  scale: readonly [number, number, number];
}>;

type FacadeDetailKind =
  | "window"
  | "window-dark"
  | "door"
  | "shop-glass"
  | "awning"
  | "trim"
  | "shadow-trim"
  | "roof";

type FacadeDetailGeometryKind = "plane" | "box";

type FacadeDetail = Readonly<{
  id: string;
  kind: FacadeDetailKind;
  geometryKind: FacadeDetailGeometryKind;
  position: readonly [number, number, number];
  rotationYRad: number;
  scale: readonly [number, number, number];
}>;

type FacadeDetailBatch = Readonly<{
  id: string;
  kind: FacadeDetailKind;
  geometryKind: FacadeDetailGeometryKind;
  details: readonly FacadeDetail[];
  material: Material;
  renderOrder: number;
}>;

const BUILDING_BODY_MATERIALS: Readonly<Record<HomeDriveBuildingMaterialKey, Material>> =
  Object.freeze({
    "house-warm": HOME_DRIVE_THREE_MATERIALS.houseWarm,
    "house-cool": HOME_DRIVE_THREE_MATERIALS.houseCool,
    "commerce-warm": HOME_DRIVE_THREE_MATERIALS.commerceWarm,
    "commerce-night": HOME_DRIVE_THREE_MATERIALS.commerceNight,
    "apartment-light": HOME_DRIVE_THREE_MATERIALS.apartmentLight,
    "apartment-concrete": HOME_DRIVE_THREE_MATERIALS.apartmentConcrete,
    "office-blue": HOME_DRIVE_THREE_MATERIALS.officeBlue,
    "warehouse-metal": HOME_DRIVE_THREE_MATERIALS.warehouseMetal,
  });

const FACADE_DETAIL_MATERIALS: Readonly<Record<FacadeDetailKind, Material>> =
  Object.freeze({
    window: HOME_DRIVE_THREE_MATERIALS.buildingWindow,
    "window-dark": HOME_DRIVE_THREE_MATERIALS.buildingWindowDark,
    door: HOME_DRIVE_THREE_MATERIALS.buildingDoor,
    "shop-glass": HOME_DRIVE_THREE_MATERIALS.buildingShopGlass,
    awning: HOME_DRIVE_THREE_MATERIALS.buildingAwning,
    trim: HOME_DRIVE_THREE_MATERIALS.buildingTrim,
    "shadow-trim": HOME_DRIVE_THREE_MATERIALS.buildingShadowTrim,
    roof: HOME_DRIVE_THREE_MATERIALS.buildingRoof,
  });

function groupBuildingsByMaterial(
  buildings: readonly HomeDriveBuilding[],
): readonly BuildingBatch[] {
  const map = new Map<HomeDriveBuildingMaterialKey, HomeDriveBuilding[]>();

  buildings.forEach((building) => {
    const current = map.get(building.materialKey);

    if (current) {
      current.push(building);
      return;
    }

    map.set(building.materialKey, [building]);
  });

  return Array.from(map.entries()).map(([materialKey, batchBuildings]) => ({
    materialKey,
    buildings: batchBuildings,
  }));
}

function getBuildingFacadeStyle(
  building: HomeDriveBuilding,
): HomeDriveBuildingFacadeStyle {
  if (building.facadeProfile?.style) {
    return building.facadeProfile.style;
  }

  switch (building.kind) {
    case "house":
      return "simple-house";
    case "commerce":
      return "shopfront";
    case "office":
      return "office-glass";
    case "warehouse":
      return "warehouse-bay";
    case "apartment":
    default:
      return "apartment-grid";
  }
}

function getBuildingRoofStyle(
  building: HomeDriveBuilding,
): HomeDriveBuildingRoofStyle {
  if (building.facadeProfile?.roofStyle) {
    return building.facadeProfile.roofStyle;
  }

  if (building.kind === "house") {
    return "slab";
  }

  if (building.kind === "warehouse") {
    return "flat";
  }

  return "low-parapet";
}

function getDerivedFacadeProfile(
  building: HomeDriveBuilding,
): HomeDriveBuildingFacadeProfile {
  if (building.facadeProfile) {
    return building.facadeProfile;
  }

  const style = getBuildingFacadeStyle(building);
  const roofStyle = getBuildingRoofStyle(building);

  switch (style) {
    case "simple-house":
      return {
        style,
        roofStyle,
        windowColumns: building.variant % 2 === 0 ? 2 : 3,
        windowRows: Math.max(1, building.floors),
        hasDoor: true,
        hasShopfront: false,
        hasAwning: false,
      };

    case "shopfront":
      return {
        style,
        roofStyle,
        windowColumns: Math.max(2, Math.min(4, Math.floor(building.widthMeters / 5))),
        windowRows: Math.max(1, Math.min(3, building.floors - 1)),
        hasDoor: true,
        hasShopfront: true,
        hasAwning: true,
      };

    case "office-glass":
      return {
        style,
        roofStyle,
        windowColumns: Math.max(3, Math.min(7, Math.floor(building.widthMeters / 4.2))),
        windowRows: Math.max(3, Math.min(11, building.floors)),
        hasDoor: true,
        hasShopfront: false,
        hasAwning: false,
      };

    case "warehouse-bay":
      return {
        style,
        roofStyle,
        windowColumns: Math.max(2, Math.min(4, Math.floor(building.widthMeters / 9))),
        windowRows: 1,
        hasDoor: true,
        hasShopfront: false,
        hasAwning: false,
      };

    case "apartment-grid":
    default:
      return {
        style,
        roofStyle,
        windowColumns: Math.max(2, Math.min(5, Math.floor(building.widthMeters / 4.6))),
        windowRows: Math.max(2, Math.min(10, building.floors)),
        hasDoor: true,
        hasShopfront: false,
        hasAwning: false,
      };
  }
}

function localToWorld(
  building: HomeDriveBuilding,
  localX: number,
  localY: number,
  localZ: number,
): readonly [number, number, number] {
  const cos = Math.cos(building.rotationYRad);
  const sin = Math.sin(building.rotationYRad);

  return [
    building.position.x + localX * cos + localZ * sin,
    localY,
    building.position.z - localX * sin + localZ * cos,
  ];
}

function getFrontLocalZ(building: HomeDriveBuilding): number {
  return -building.side * (building.depthMeters / 2 + FACADE_SURFACE_OFFSET_METERS);
}

function getFacadeRotationY(building: HomeDriveBuilding): number {
  return building.rotationYRad + (building.side === 1 ? Math.PI : 0);
}

function createFacadeDetail(
  building: HomeDriveBuilding,
  id: string,
  kind: FacadeDetailKind,
  geometryKind: FacadeDetailGeometryKind,
  localX: number,
  localY: number,
  localZ: number,
  width: number,
  height: number,
  depth = 1,
): FacadeDetail {
  return {
    id,
    kind,
    geometryKind,
    position: localToWorld(building, localX, localY, localZ),
    rotationYRad: getFacadeRotationY(building),
    scale:
      geometryKind === "plane"
        ? [width, height, 1]
        : [width, height, depth],
  };
}

function pushRoofDetail(
  details: FacadeDetail[],
  building: HomeDriveBuilding,
  profile: HomeDriveBuildingFacadeProfile,
): void {
  const roofHeight =
    profile.roofStyle === "low-parapet"
      ? 0.55
      : profile.roofStyle === "slab"
        ? 0.36
        : 0.24;

  details.push({
    id: `${building.id}::roof`,
    kind: "roof",
    geometryKind: "box",
    position: [
      building.position.x,
      building.heightMeters + roofHeight / 2,
      building.position.z,
    ],
    rotationYRad: building.rotationYRad,
    scale: [
      building.widthMeters + 0.75,
      roofHeight,
      building.depthMeters + 0.75,
    ],
  });
}

function pushDoorDetail(
  details: FacadeDetail[],
  building: HomeDriveBuilding,
  localX: number,
  width: number,
  height: number,
): void {
  details.push(
    createFacadeDetail(
      building,
      `${building.id}::door`,
      "door",
      "plane",
      localX,
      height / 2,
      getFrontLocalZ(building),
      width,
      height,
    ),
  );
}

function pushFacadeTrim(
  details: FacadeDetail[],
  building: HomeDriveBuilding,
  profile: HomeDriveBuildingFacadeProfile,
): void {
  const rows = Math.max(1, profile.windowRows);
  const top = Math.max(3.2, building.heightMeters - 1.2);
  const bottom = profile.hasShopfront ? 4.25 : 2.6;
  const interval = (top - bottom) / Math.max(1, rows);

  for (let row = 0; row <= rows; row += 1) {
    const y = bottom + row * interval;

    if (y <= 1.8 || y >= building.heightMeters - 0.7) {
      continue;
    }

    details.push(
      createFacadeDetail(
        building,
        `${building.id}::trim-${row}`,
        row % 2 === 0 ? "trim" : "shadow-trim",
        "plane",
        0,
        y,
        getFrontLocalZ(building),
        building.widthMeters * 0.82,
        0.055,
      ),
    );
  }
}

function pushHouseFacade(
  details: FacadeDetail[],
  building: HomeDriveBuilding,
  profile: HomeDriveBuildingFacadeProfile,
): void {
  if (profile.hasDoor) {
    pushDoorDetail(details, building, -building.widthMeters * 0.24, 1.35, 2.35);
  }

  const windowY = building.floors > 1 ? 2.4 : 2.05;
  const columns = Math.max(2, profile.windowColumns);
  const usableWidth = building.widthMeters * 0.56;

  for (let column = 0; column < columns; column += 1) {
    const localX =
      -usableWidth / 2 + (column + 0.5) * (usableWidth / columns);

    if (Math.abs(localX + building.widthMeters * 0.24) < 1.2) {
      continue;
    }

    details.push(
      createFacadeDetail(
        building,
        `${building.id}::window-house-${column}`,
        column % 2 === 0 ? "window" : "window-dark",
        "plane",
        localX,
        windowY,
        getFrontLocalZ(building),
        1.15,
        0.95,
      ),
    );
  }

  if (building.floors > 1) {
    for (let column = 0; column < columns; column += 1) {
      const localX =
        -usableWidth / 2 + (column + 0.5) * (usableWidth / columns);

      details.push(
        createFacadeDetail(
          building,
          `${building.id}::window-house-upper-${column}`,
          "window",
          "plane",
          localX,
          4.9,
          getFrontLocalZ(building),
          1.05,
          0.9,
        ),
      );
    }
  }
}

function pushShopfrontFacade(
  details: FacadeDetail[],
  building: HomeDriveBuilding,
  profile: HomeDriveBuildingFacadeProfile,
): void {
  const frontZ = getFrontLocalZ(building);

  details.push(
    createFacadeDetail(
      building,
      `${building.id}::shop-glass-left`,
      "shop-glass",
      "plane",
      -building.widthMeters * 0.22,
      1.85,
      frontZ,
      building.widthMeters * 0.32,
      2.5,
    ),
  );

  details.push(
    createFacadeDetail(
      building,
      `${building.id}::shop-glass-right`,
      "shop-glass",
      "plane",
      building.widthMeters * 0.22,
      1.85,
      frontZ,
      building.widthMeters * 0.32,
      2.5,
    ),
  );

  if (profile.hasDoor) {
    pushDoorDetail(details, building, 0, 1.35, 2.45);
  }

  if (profile.hasAwning) {
    details.push(
      createFacadeDetail(
        building,
        `${building.id}::awning`,
        "awning",
        "plane",
        0,
        3.25,
        frontZ,
        building.widthMeters * 0.78,
        0.42,
      ),
    );
  }

  const rows = profile.windowRows;
  const columns = Math.max(2, profile.windowColumns);

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const usableWidth = building.widthMeters * 0.68;
      const localX =
        -usableWidth / 2 + (column + 0.5) * (usableWidth / columns);
      const localY = 4.45 + row * 2.25;

      if (localY >= building.heightMeters - 0.9) {
        continue;
      }

      details.push(
        createFacadeDetail(
          building,
          `${building.id}::shop-upper-${row}-${column}`,
          "window",
          "plane",
          localX,
          localY,
          frontZ,
          1.25,
          0.92,
        ),
      );
    }
  }
}

function pushGridFacade(
  details: FacadeDetail[],
  building: HomeDriveBuilding,
  profile: HomeDriveBuildingFacadeProfile,
): void {
  const frontZ = getFrontLocalZ(building);
  const rows = Math.max(2, profile.windowRows);
  const columns = Math.max(2, profile.windowColumns);
  const usableWidth = building.widthMeters * 0.72;
  const bottom = profile.style === "office-glass" ? 2.8 : 3.0;
  const top = building.heightMeters - 1.45;
  const usableHeight = Math.max(1, top - bottom);

  if (profile.hasDoor) {
    pushDoorDetail(details, building, 0, 1.55, 2.55);
  }

  for (let row = 0; row < rows; row += 1) {
    const localY = bottom + (row + 0.5) * (usableHeight / rows);

    for (let column = 0; column < columns; column += 1) {
      const localX =
        -usableWidth / 2 + (column + 0.5) * (usableWidth / columns);

      const isDarkVariant =
        (row + column + building.variant) % (profile.style === "office-glass" ? 3 : 4) ===
        0;

      details.push(
        createFacadeDetail(
          building,
          `${building.id}::grid-window-${row}-${column}`,
          isDarkVariant ? "window-dark" : "window",
          "plane",
          localX,
          localY,
          frontZ,
          profile.style === "office-glass" ? 1.45 : 1.15,
          profile.style === "office-glass" ? 1.25 : 0.92,
        ),
      );
    }
  }

  pushFacadeTrim(details, building, profile);
}

function pushWarehouseFacade(
  details: FacadeDetail[],
  building: HomeDriveBuilding,
  profile: HomeDriveBuildingFacadeProfile,
): void {
  const frontZ = getFrontLocalZ(building);

  if (profile.hasDoor) {
    details.push(
      createFacadeDetail(
        building,
        `${building.id}::warehouse-door`,
        "door",
        "plane",
        -building.widthMeters * 0.18,
        2.2,
        frontZ,
        Math.min(5.4, building.widthMeters * 0.24),
        4.2,
      ),
    );
  }

  const columns = Math.max(2, profile.windowColumns);
  const usableWidth = building.widthMeters * 0.62;

  for (let column = 0; column < columns; column += 1) {
    const localX =
      -usableWidth / 2 + (column + 0.5) * (usableWidth / columns);

    details.push(
      createFacadeDetail(
        building,
        `${building.id}::warehouse-window-${column}`,
        "window-dark",
        "plane",
        localX,
        building.heightMeters * 0.68,
        frontZ,
        1.6,
        0.72,
      ),
    );
  }

  details.push(
    createFacadeDetail(
      building,
      `${building.id}::warehouse-trim`,
      "shadow-trim",
      "plane",
      0,
      building.heightMeters * 0.42,
      frontZ,
      building.widthMeters * 0.76,
      0.08,
    ),
  );
}

function createBuildingFacadeDetails(
  building: HomeDriveBuilding,
): readonly FacadeDetail[] {
  const profile = getDerivedFacadeProfile(building);
  const details: FacadeDetail[] = [];

  pushRoofDetail(details, building, profile);

  switch (profile.style) {
    case "simple-house":
      pushHouseFacade(details, building, profile);
      break;
    case "shopfront":
      pushShopfrontFacade(details, building, profile);
      break;
    case "office-glass":
      pushGridFacade(details, building, profile);
      break;
    case "warehouse-bay":
      pushWarehouseFacade(details, building, profile);
      break;
    case "apartment-grid":
    default:
      pushGridFacade(details, building, profile);
      break;
  }

  return details;
}

function createBodyInstances(
  buildings: readonly HomeDriveBuilding[],
): readonly BuildingInstance[] {
  return buildings.map((building) => ({
    id: `${building.id}::body`,
    position: [
      building.position.x,
      building.heightMeters / 2,
      building.position.z,
    ],
    rotationYRad: building.rotationYRad,
    scale: [
      building.widthMeters,
      building.heightMeters,
      building.depthMeters,
    ],
  }));
}

function createFacadeDetailBatches(
  buildings: readonly HomeDriveBuilding[],
): readonly FacadeDetailBatch[] {
  const details: FacadeDetail[] = [];

  for (const building of buildings) {
    if (details.length >= MAX_FACADE_DETAILS) {
      break;
    }

    for (const detail of createBuildingFacadeDetails(building)) {
      if (details.length >= MAX_FACADE_DETAILS) {
        break;
      }

      details.push(detail);
    }
  }

  const map = new Map<string, FacadeDetail[]>();

  details.forEach((detail) => {
    const key = `${detail.kind}::${detail.geometryKind}`;
    const current = map.get(key);

    if (current) {
      current.push(detail);
      return;
    }

    map.set(key, [detail]);
  });

  return Array.from(map.entries()).map(([id, batchDetails]) => {
    const [kind, geometryKind] = id.split("::") as [
      FacadeDetailKind,
      FacadeDetailGeometryKind,
    ];

    return {
      id,
      kind,
      geometryKind,
      details: batchDetails,
      material: FACADE_DETAIL_MATERIALS[kind],
      renderOrder: kind === "roof" ? 13 : 18,
    };
  });
}

function HomeDriveThreeBodyBatch({
  batch,
  geometry,
}: Readonly<{
  batch: BuildingBatch;
  geometry: BoxGeometry;
}>) {
  const meshRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);

  const instances = useMemo(() => {
    return createBodyInstances(batch.buildings);
  }, [batch.buildings]);

  useLayoutEffect(() => {
    const mesh = meshRef.current;

    if (!mesh) {
      return;
    }

    instances.forEach((instance, index) => {
      dummy.position.set(...instance.position);
      dummy.rotation.set(0, instance.rotationYRad, 0);
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
        BUILDING_BODY_MATERIALS[batch.materialKey],
        instances.length,
      ]}
      frustumCulled
      renderOrder={12}
    />
  );
}

function HomeDriveThreeFacadeDetailBatch({
  batch,
  geometry,
}: Readonly<{
  batch: FacadeDetailBatch;
  geometry: BufferGeometry;
}>) {
  const meshRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);

  useLayoutEffect(() => {
    const mesh = meshRef.current;

    if (!mesh) {
      return;
    }

    batch.details.forEach((detail, index) => {
      dummy.position.set(...detail.position);
      dummy.rotation.set(0, detail.rotationYRad, 0);
      dummy.scale.set(...detail.scale);
      dummy.updateMatrix();

      mesh.setMatrixAt(index, dummy.matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [batch.details, dummy]);

  if (batch.details.length <= 0) {
    return null;
  }

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, batch.material, batch.details.length]}
      frustumCulled
      renderOrder={batch.renderOrder}
    />
  );
}

function HomeDriveThreeBuildings() {
  const buildings = useMemo(() => {
    return getHomeDriveBuildings({
      maxBuildings: MAX_BUILDINGS,
    });
  }, []);

  const bodyBatches = useMemo(() => {
    return groupBuildingsByMaterial(buildings);
  }, [buildings]);

  const facadeBatches = useMemo(() => {
    return createFacadeDetailBatches(buildings);
  }, [buildings]);

  const boxGeometry = useMemo(() => new BoxGeometry(1, 1, 1), []);
  const planeGeometry = useMemo(() => new PlaneGeometry(1, 1), []);

  useEffect(() => {
    return () => {
      boxGeometry.dispose();
      planeGeometry.dispose();
    };
  }, [boxGeometry, planeGeometry]);

  return (
    <group>
      {bodyBatches.map((batch) => (
        <HomeDriveThreeBodyBatch
          key={batch.materialKey}
          batch={batch}
          geometry={boxGeometry}
        />
      ))}

      {facadeBatches.map((batch) => (
        <HomeDriveThreeFacadeDetailBatch
          key={batch.id}
          batch={batch}
          geometry={batch.geometryKind === "box" ? boxGeometry : planeGeometry}
        />
      ))}
    </group>
  );
}

export default memo(HomeDriveThreeBuildings);
