// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.building.types.ts

import type { HomeDriveVector2 } from "./homeDrive.types";

export type HomeDriveBuildingKind =
  | "house"
  | "commerce"
  | "apartment"
  | "office"
  | "warehouse";

export type HomeDriveBuildingMaterialKey =
  | "house-warm"
  | "house-cool"
  | "commerce-warm"
  | "commerce-night"
  | "apartment-light"
  | "apartment-concrete"
  | "office-blue"
  | "warehouse-metal";

export type HomeDriveBuildingSide = -1 | 1;

export type HomeDriveBuildingFacadeStyle =
  | "simple-house"
  | "shopfront"
  | "apartment-grid"
  | "office-glass"
  | "warehouse-bay";

export type HomeDriveBuildingRoofStyle = "flat" | "slab" | "low-parapet";

export type HomeDriveBuildingFacadeProfile = Readonly<{
  style: HomeDriveBuildingFacadeStyle;
  roofStyle: HomeDriveBuildingRoofStyle;
  windowColumns: number;
  windowRows: number;
  hasDoor: boolean;
  hasShopfront: boolean;
  hasAwning: boolean;
}>;

export type HomeDriveBuilding = Readonly<{
  id: string;
  kind: HomeDriveBuildingKind;
  materialKey: HomeDriveBuildingMaterialKey;
  position: HomeDriveVector2;
  widthMeters: number;
  depthMeters: number;
  heightMeters: number;
  rotationYRad: number;
  floors: number;
  variant: number;
  side: HomeDriveBuildingSide;
  roadId: string;
  segmentId: string;
  districtId: string;

  /**
   * Opcional para não quebrar o gerador atual.
   * Se não vier preenchido, o render 3D deriva o perfil pelo kind/floors/variant.
   */
  facadeProfile?: HomeDriveBuildingFacadeProfile;
}>;

export type HomeDriveBuildingGenerationOptions = Readonly<{
  maxBuildings?: number;
  minSegmentLengthMeters?: number;
}>;

export type HomeDriveBuildingLotCandidate = Readonly<{
  roadId: string;
  segmentId: string;
  districtId: string;
  position: HomeDriveVector2;
  roadDirection: Readonly<{
    x: number;
    z: number;
  }>;
  side: HomeDriveBuildingSide;
  seed: number;
}>;
