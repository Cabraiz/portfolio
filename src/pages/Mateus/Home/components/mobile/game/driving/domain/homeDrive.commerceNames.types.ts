// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.commerceNames.types.ts

import type {
  HomeDriveBuildingKind,
  HomeDriveBuildingMaterialKey,
} from "./homeDrive.building.types";

export type HomeDriveCommerceCategory =
  | "bakery"
  | "market"
  | "pharmacy"
  | "cafe"
  | "bar"
  | "restaurant"
  | "auto-parts"
  | "hardware"
  | "salon"
  | "tech"
  | "clothing"
  | "gym"
  | "clinic"
  | "petshop"
  | "bank"
  | "office"
  | "warehouse"
  | "generic";

export type HomeDriveCommerceSignStyle =
  | "painted"
  | "neon"
  | "panel"
  | "classic"
  | "market"
  | "pharmacy"
  | "vertical"
  | "industrial"
  | "glass";

export type HomeDriveCommerceAwningStyle =
  | "none"
  | "flat"
  | "striped"
  | "metal"
  | "fabric";

export type HomeDriveCommerceDescriptor = Readonly<{
  category: HomeDriveCommerceCategory;
  name: string;
  signStyle: HomeDriveCommerceSignStyle;
  awningStyle: HomeDriveCommerceAwningStyle;
  seed: number;
}>;

export type HomeDriveCommerceNameInput = Readonly<{
  id: string;
  kind: HomeDriveBuildingKind;
  materialKey?: HomeDriveBuildingMaterialKey;
  variant: number;
  roadId: string;
  segmentId: string;
  districtId?: string;
}>;
