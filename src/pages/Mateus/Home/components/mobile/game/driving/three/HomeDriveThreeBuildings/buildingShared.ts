// src/pages/Mateus/Home/components/mobile/game/driving/three/HomeDriveThreeBuildings/buildingShared.ts
// Limites, tipos e materiais dos prédios 3D.

import type { Material } from "three";
import type {
  HomeDriveBuilding,
  HomeDriveBuildingMaterialKey,
} from "../../domain/homeDrive.building.types";
import { HOME_DRIVE_THREE_MATERIALS } from "../homeDriveThree.materials";

export const MAX_BUILDINGS = 16384;
export const MAX_FACADE_DETAILS = 327680;
export const FACADE_SURFACE_OFFSET_METERS = 0.085;

export type BuildingBatch = Readonly<{
  materialKey: HomeDriveBuildingMaterialKey;
  buildings: readonly HomeDriveBuilding[];
}>;

export type BuildingInstance = Readonly<{
  id: string;
  position: readonly [number, number, number];
  rotationYRad: number;
  rotationZRad?: number;
  scale: readonly [number, number, number];
}>;

export type FacadeDetailKind =
  | "window"
  | "window-dark"
  | "window-glass"
  | "window-glass-bright"
  | "window-wood"
  | "window-open"
  | "window-frame"
  | "window-grille"
  | "door"
  | "door-wood"
  | "door-metal"
  | "door-glass"
  | "door-painted"
  | "door-dark"
  | "door-rolling-steel"
  | "door-broken"
  | "door-frame"
  | "door-handle"
  | "door-crack"
  | "door-board"
  | "door-divider"
  | "portaria-glass"
  | "portaria-pillar"
  | "intercom"
  | "canopy-slab"
  | "canopy-metal"
  | "canopy-glass"
  | "canopy-fabric"
  | "no-parking-sign"
  | "no-parking-bar"
  | "private-sign"
  | "service-sign"
  | "garage-marking"
  | "shop-glass"
  | "awning"
  | "awning-striped"
  | "awning-fabric"
  | "awning-metal"
  | "air-conditioner"
  | "air-conditioner-shadow"
  | "sign-board"
  | "metal-frame"
  | "trim"
  | "shadow-trim"
  | "roof";

export type FacadeDetailGeometryKind = "plane" | "box";

export type FacadeDetail = Readonly<{
  id: string;
  kind: FacadeDetailKind;
  geometryKind: FacadeDetailGeometryKind;
  position: readonly [number, number, number];
  rotationYRad: number;
  rotationZRad?: number;
  scale: readonly [number, number, number];
}>;

export type FacadeDetailBatch = Readonly<{
  id: string;
  kind: FacadeDetailKind;
  geometryKind: FacadeDetailGeometryKind;
  details: readonly FacadeDetail[];
  material: Material;
  renderOrder: number;
}>;

export type HomeDriveThreeBuildingsProps = Readonly<{
  /**
   * Deve vir de HomeDriveThreeScene quando colisão com prédio estiver ativa.
   *
   * Isso garante que:
   * - render dos prédios
   * - colisão
   * - marcas/deformações
   *
   * usem exatamente o mesmo array.
   */
  buildings?: readonly HomeDriveBuilding[];

  /**
   * IDs que deixam de ser renderizados no batch instanciado perfeito.
   *
   * Prédios danificados são desenhados por HomeDriveThreeDamagedBuildings,
   * com geometria quebrada própria. Sem isso, o bloco retangular original
   * continuaria aparecendo atrás do buraco.
   */
  hiddenBuildingIds?: readonly string[];

  /**
   * Usado apenas no fallback interno, quando buildings não é passado.
   */
  maxBuildings?: number;
}>;

export const BUILDING_BODY_MATERIALS: Readonly<Record<HomeDriveBuildingMaterialKey, Material>> =
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

export const FACADE_DETAIL_MATERIALS: Readonly<Record<FacadeDetailKind, Material>> =
  Object.freeze({
    window: HOME_DRIVE_THREE_MATERIALS.buildingWindow,
    "window-dark": HOME_DRIVE_THREE_MATERIALS.buildingWindowDark,
    "window-glass": HOME_DRIVE_THREE_MATERIALS.buildingWindowGlass,
    "window-glass-bright": HOME_DRIVE_THREE_MATERIALS.buildingWindowGlassBright,
    "window-wood": HOME_DRIVE_THREE_MATERIALS.buildingWindowWood,
    "window-open": HOME_DRIVE_THREE_MATERIALS.buildingWindowOpen,
    "window-frame": HOME_DRIVE_THREE_MATERIALS.buildingWindowFrame,
    "window-grille": HOME_DRIVE_THREE_MATERIALS.buildingWindowGrille,
    door: HOME_DRIVE_THREE_MATERIALS.buildingDoor,
    "door-wood": HOME_DRIVE_THREE_MATERIALS.buildingDoorWood,
    "door-metal": HOME_DRIVE_THREE_MATERIALS.buildingDoorMetal,
    "door-glass": HOME_DRIVE_THREE_MATERIALS.buildingDoorGlass,
    "door-painted": HOME_DRIVE_THREE_MATERIALS.buildingDoorPainted,
    "door-dark": HOME_DRIVE_THREE_MATERIALS.buildingDoorDark,
    "door-rolling-steel": HOME_DRIVE_THREE_MATERIALS.buildingDoorRollingSteel,
    "door-broken": HOME_DRIVE_THREE_MATERIALS.buildingDoorBroken,
    "door-frame": HOME_DRIVE_THREE_MATERIALS.buildingDoorFrame,
    "door-handle": HOME_DRIVE_THREE_MATERIALS.buildingDoorHandle,
    "door-crack": HOME_DRIVE_THREE_MATERIALS.buildingDoorCrack,
    "door-board": HOME_DRIVE_THREE_MATERIALS.buildingDoorBoard,
    "door-divider": HOME_DRIVE_THREE_MATERIALS.buildingMetalFrame,
    "portaria-glass": HOME_DRIVE_THREE_MATERIALS.buildingPortariaGlass,
    "portaria-pillar": HOME_DRIVE_THREE_MATERIALS.buildingEntrancePillar,
    intercom: HOME_DRIVE_THREE_MATERIALS.buildingIntercom,
    "canopy-slab": HOME_DRIVE_THREE_MATERIALS.buildingCanopySlab,
    "canopy-metal": HOME_DRIVE_THREE_MATERIALS.buildingCanopyMetal,
    "canopy-glass": HOME_DRIVE_THREE_MATERIALS.buildingCanopyGlass,
    "canopy-fabric": HOME_DRIVE_THREE_MATERIALS.buildingCanopyFabric,
    "no-parking-sign": HOME_DRIVE_THREE_MATERIALS.buildingNoParkingSign,
    "no-parking-bar": HOME_DRIVE_THREE_MATERIALS.buildingNoParkingBar,
    "private-sign": HOME_DRIVE_THREE_MATERIALS.buildingPrivateSign,
    "service-sign": HOME_DRIVE_THREE_MATERIALS.buildingServiceSign,
    "garage-marking": HOME_DRIVE_THREE_MATERIALS.buildingGarageMarking,
    "shop-glass": HOME_DRIVE_THREE_MATERIALS.buildingShopGlass,
    awning: HOME_DRIVE_THREE_MATERIALS.buildingAwning,
    "awning-striped": HOME_DRIVE_THREE_MATERIALS.buildingAwningStriped,
    "awning-fabric": HOME_DRIVE_THREE_MATERIALS.buildingAwningFabric,
    "awning-metal": HOME_DRIVE_THREE_MATERIALS.buildingAwningMetal,
    "air-conditioner": HOME_DRIVE_THREE_MATERIALS.buildingAirConditioner,
    "air-conditioner-shadow": HOME_DRIVE_THREE_MATERIALS.buildingAirConditionerShadow,
    "sign-board": HOME_DRIVE_THREE_MATERIALS.buildingSignBoard,
    "metal-frame": HOME_DRIVE_THREE_MATERIALS.buildingMetalFrame,
    trim: HOME_DRIVE_THREE_MATERIALS.buildingTrim,
    "shadow-trim": HOME_DRIVE_THREE_MATERIALS.buildingShadowTrim,
    roof: HOME_DRIVE_THREE_MATERIALS.buildingRoof,
  });

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
