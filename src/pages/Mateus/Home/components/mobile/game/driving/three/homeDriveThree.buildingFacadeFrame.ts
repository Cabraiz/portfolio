// src/pages/Mateus/Home/components/mobile/game/driving/three/homeDriveThree.buildingFacadeFrame.ts

import type {
  HomeDriveBuilding,
  HomeDriveBuildingSide,
} from "../domain/homeDrive.building.types";
import type { HomeDriveVector2 } from "../domain/homeDrive.types";

export type HomeDriveThreeBuildingFacadeGeometryKind = "plane" | "box";

export type HomeDriveThreeBuildingFacadeFrame = Readonly<{
  /**
   * Side do prédio que deve receber a fachada principal.
   *
   * IMPORTANTE:
   * Este valor já considera INVERT_BUILDING_STREET_FACADE_SIDE.
   */
  streetFacingSide: HomeDriveBuildingSide;

  /**
   * Eixo local X do prédio em mundo.
   * Equivale à direção longitudinal da rua.
   */
  localXAxisWorld: HomeDriveVector2;

  /**
   * Eixo local Z do prédio em mundo.
   * Equivale à normal da rua usada para afastar o prédio da via.
   */
  localZAxisWorld: HomeDriveVector2;

  /**
   * Normal da fachada apontando para fora do plano da fachada.
   */
  streetFacingNormalWorld: HomeDriveVector2;

  /**
   * Z local da fachada.
   * Use este valor para janelas, portas, toldos, placas, banners etc.
   */
  facadeLocalZ: number;

  /**
   * Rotação Y correta para planos/boxes de fachada.
   */
  facadeRotationYRad: number;
}>;

export type HomeDriveThreeBuildingFacadeTransformInput = Readonly<{
  localX: number;
  localY: number;

  /**
   * Se omitido, usa automaticamente o Z da fachada principal.
   */
  localZ?: number;

  width: number;
  height: number;
  depth?: number;
  geometryKind?: HomeDriveThreeBuildingFacadeGeometryKind;
  surfaceOffsetMeters?: number;
}>;

export type HomeDriveThreeBuildingFacadeTransform = Readonly<{
  position: readonly [number, number, number];
  rotationYRad: number;
  scale: readonly [number, number, number];
}>;

export type HomeDriveThreeBuildingFacadeAnchor = Readonly<{
  position: readonly [number, number, number];
  rotationYRad: number;
  normal: HomeDriveVector2;
}>;

const DEFAULT_FACADE_SURFACE_OFFSET_METERS = 0.085;

/**
 * Reversor global do lado da fachada.
 *
 * Deixe true porque, no seu mapa atual, os detalhes estavam sendo criados
 * no lado oposto do prédio em relação à visão da rua.
 *
 * Se futuramente inverter demais, troque para false.
 */
const INVERT_BUILDING_STREET_FACADE_SIDE = true;

type HomeDriveBuildingWithOptionalStreetFrame = HomeDriveBuilding &
  Partial<
    Readonly<{
      roadDirection: HomeDriveVector2;
      roadNormal: HomeDriveVector2;
      streetFacingSide: HomeDriveBuildingSide;
      facadeSeed: number;
    }>
  >;

function normalizeVector2(vector: HomeDriveVector2): HomeDriveVector2 {
  const length = Math.hypot(vector.x, vector.z);

  if (!Number.isFinite(length) || length <= 0.000001) {
    return {
      x: 1,
      z: 0,
    };
  }

  return {
    x: vector.x / length,
    z: vector.z / length,
  };
}

function invertHomeDriveBuildingSide(
  side: HomeDriveBuildingSide,
): HomeDriveBuildingSide {
  return side === 1 ? -1 : 1;
}

function getFallbackLocalXAxisWorld(
  building: HomeDriveBuilding,
): HomeDriveVector2 {
  return normalizeVector2({
    x: Math.cos(building.rotationYRad),
    z: -Math.sin(building.rotationYRad),
  });
}

function getFallbackLocalZAxisWorld(
  building: HomeDriveBuilding,
): HomeDriveVector2 {
  return normalizeVector2({
    x: Math.sin(building.rotationYRad),
    z: Math.cos(building.rotationYRad),
  });
}

export function getHomeDriveThreeBuildingRawStreetFacingSide(
  building: HomeDriveBuilding,
): HomeDriveBuildingSide {
  const buildingWithFrame = building as HomeDriveBuildingWithOptionalStreetFrame;

  return buildingWithFrame.streetFacingSide ?? building.side;
}

export function getHomeDriveThreeBuildingStreetFacingSide(
  building: HomeDriveBuilding,
): HomeDriveBuildingSide {
  const rawSide = getHomeDriveThreeBuildingRawStreetFacingSide(building);

  return INVERT_BUILDING_STREET_FACADE_SIDE
    ? invertHomeDriveBuildingSide(rawSide)
    : rawSide;
}

export function getHomeDriveThreeBuildingLocalXAxisWorld(
  building: HomeDriveBuilding,
): HomeDriveVector2 {
  const buildingWithFrame = building as HomeDriveBuildingWithOptionalStreetFrame;

  if (buildingWithFrame.roadDirection) {
    return normalizeVector2(buildingWithFrame.roadDirection);
  }

  return getFallbackLocalXAxisWorld(building);
}

export function getHomeDriveThreeBuildingLocalZAxisWorld(
  building: HomeDriveBuilding,
): HomeDriveVector2 {
  const buildingWithFrame = building as HomeDriveBuildingWithOptionalStreetFrame;

  if (buildingWithFrame.roadNormal) {
    return normalizeVector2(buildingWithFrame.roadNormal);
  }

  return getFallbackLocalZAxisWorld(building);
}

export function getHomeDriveThreeBuildingStreetFacingNormalWorld(
  building: HomeDriveBuilding,
): HomeDriveVector2 {
  const streetFacingSide =
    getHomeDriveThreeBuildingStreetFacingSide(building);
  const localZAxisWorld = getHomeDriveThreeBuildingLocalZAxisWorld(building);

  return normalizeVector2({
    x: -localZAxisWorld.x * streetFacingSide,
    z: -localZAxisWorld.z * streetFacingSide,
  });
}

export function getHomeDriveThreeBuildingStreetFacadeLocalZ(
  building: HomeDriveBuilding,
  surfaceOffsetMeters = DEFAULT_FACADE_SURFACE_OFFSET_METERS,
): number {
  const streetFacingSide =
    getHomeDriveThreeBuildingStreetFacingSide(building);

  return -streetFacingSide * (building.depthMeters / 2 + surfaceOffsetMeters);
}

export function getHomeDriveThreeBuildingStreetFacadeRotationYRad(
  building: HomeDriveBuilding,
): number {
  const streetFacingSide =
    getHomeDriveThreeBuildingStreetFacingSide(building);

  /*
    PlaneGeometry olha para +Z local.

    Se a fachada selecionada está no -Z local, precisa de PI.
    Se a fachada selecionada está no +Z local, usa a rotação base.

    Como getHomeDriveThreeBuildingStreetFacingSide() já aplica o inversor global,
    a rotação também acompanha automaticamente.
  */
  return building.rotationYRad + (streetFacingSide === 1 ? Math.PI : 0);
}

export function getHomeDriveThreeBuildingStreetFacadeFrame(
  building: HomeDriveBuilding,
  surfaceOffsetMeters = DEFAULT_FACADE_SURFACE_OFFSET_METERS,
): HomeDriveThreeBuildingFacadeFrame {
  const streetFacingSide =
    getHomeDriveThreeBuildingStreetFacingSide(building);
  const localXAxisWorld = getHomeDriveThreeBuildingLocalXAxisWorld(building);
  const localZAxisWorld = getHomeDriveThreeBuildingLocalZAxisWorld(building);
  const streetFacingNormalWorld =
    getHomeDriveThreeBuildingStreetFacingNormalWorld(building);

  return {
    streetFacingSide,
    localXAxisWorld,
    localZAxisWorld,
    streetFacingNormalWorld,
    facadeLocalZ: getHomeDriveThreeBuildingStreetFacadeLocalZ(
      building,
      surfaceOffsetMeters,
    ),
    facadeRotationYRad:
      getHomeDriveThreeBuildingStreetFacadeRotationYRad(building),
  };
}

export function homeDriveThreeBuildingLocalToWorld(
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

export function createHomeDriveThreeBuildingFacadeTransform(
  building: HomeDriveBuilding,
  input: HomeDriveThreeBuildingFacadeTransformInput,
): HomeDriveThreeBuildingFacadeTransform {
  const geometryKind = input.geometryKind ?? "plane";
  const depth = input.depth ?? 1;
  const frame = getHomeDriveThreeBuildingStreetFacadeFrame(
    building,
    input.surfaceOffsetMeters,
  );

  const localZ = input.localZ ?? frame.facadeLocalZ;

  return {
    position: homeDriveThreeBuildingLocalToWorld(
      building,
      input.localX,
      input.localY,
      localZ,
    ),
    rotationYRad: frame.facadeRotationYRad,
    scale:
      geometryKind === "plane"
        ? [input.width, input.height, 1]
        : [input.width, input.height, depth],
  };
}

export function createHomeDriveThreeBuildingFacadeAnchor(
  building: HomeDriveBuilding,
  localX: number,
  localY: number,
  surfaceOffsetMeters = DEFAULT_FACADE_SURFACE_OFFSET_METERS,
): HomeDriveThreeBuildingFacadeAnchor {
  const frame = getHomeDriveThreeBuildingStreetFacadeFrame(
    building,
    surfaceOffsetMeters,
  );

  return {
    position: homeDriveThreeBuildingLocalToWorld(
      building,
      localX,
      localY,
      frame.facadeLocalZ,
    ),
    rotationYRad: frame.facadeRotationYRad,
    normal: frame.streetFacingNormalWorld,
  };
}

export function offsetHomeDriveThreeBuildingFacadePosition(
  position: readonly [number, number, number],
  building: HomeDriveBuilding,
  offsetMeters: number,
): readonly [number, number, number] {
  const normal = getHomeDriveThreeBuildingStreetFacingNormalWorld(building);

  return [
    position[0] + normal.x * offsetMeters,
    position[1],
    position[2] + normal.z * offsetMeters,
  ];
}

export function getHomeDriveThreeBuildingFacadeSeed(
  building: HomeDriveBuilding,
  fallbackSalt = 0,
): number {
  const buildingWithFrame = building as HomeDriveBuildingWithOptionalStreetFrame;

  if (Number.isFinite(buildingWithFrame.facadeSeed)) {
    return buildingWithFrame.facadeSeed ?? 0;
  }

  let hash = 2166136261 ^ fallbackSalt;

  for (let index = 0; index < building.id.length; index += 1) {
    hash ^= building.id.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0) / 4294967295;
}
