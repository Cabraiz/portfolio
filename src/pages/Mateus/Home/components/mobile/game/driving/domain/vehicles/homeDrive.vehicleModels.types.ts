// src/pages/Mateus/Home/components/mobile/game/driving/domain/vehicles/homeDrive.vehicleModels.types.ts

export type HomeDriveVehicleModelKey =
  | "compact-hatch"
  | "popular-hatch"
  | "small-sedan"
  | "mid-sedan"
  | "compact-suv"
  | "mid-suv"
  | "light-pickup"
  | "delivery-van"
  | "taxi-sedan"
  | "app-driver-sedan"
  | "mini-hatch"
  | "classic-beetle"
  | "retro-station-wagon"
  | "executive-sedan"
  | "sport-coupe"
  | "muscle-coupe"
  | "luxury-suv"
  | "offroad-suv"
  | "hilux-pickup"
  | "double-cab-pickup"
  | "flatbed-pickup"
  | "dump-truck"
  | "box-truck"
  | "semi-truck"
  | "city-bus"
  | "articulated-bus"
  | "school-bus"
  | "minibus"
  | "ambulance-van"
  | "police-suv"
  | "street-motorcycle"
  | "delivery-motorcycle"
  | "urban-bicycle";

export type HomeDriveVehiclePaintKey =
  | "white"
  | "silver"
  | "black"
  | "graphite"
  | "red"
  | "blue"
  | "beige"
  | "taxi-yellow"
  | "delivery-white"
  | "utility-gray"
  | "construction-orange"
  | "bus-yellow"
  | "police-blue"
  | "emergency-white"
  | "motorcycle-black"
  | "bicycle-teal";

export type HomeDriveVehicleModelCategory =
  | "hatch"
  | "sedan"
  | "wagon"
  | "coupe"
  | "sport"
  | "suv"
  | "pickup"
  | "van"
  | "taxi"
  | "app"
  | "truck"
  | "bus"
  | "microbus"
  | "emergency"
  | "police"
  | "motorcycle"
  | "bicycle";

export type HomeDriveVehicleRoadKindWeightMap = Readonly<{
  street?: number;
  avenue?: number;
  commercial?: number;
  coastal?: number;
  ring?: number;
  service?: number;
  default?: number;
}>;

export type HomeDriveVehicleDimensions = Readonly<{
  widthMeters: number;
  lengthMeters: number;
  heightMeters: number;
}>;

export type HomeDriveVehicleVisualProfile = Readonly<{
  hoodRatio: number;
  cabinRatio: number;
  trunkRatio: number;
  cabinForwardOffsetMeters: number;
  cabinHeightRatio: number;
  wheelRadiusMeters: number;
  wheelWidthMeters: number;
}>;

export type HomeDriveVehicleModelDescriptor = Readonly<{
  key: HomeDriveVehicleModelKey;
  label: string;
  category: HomeDriveVehicleModelCategory;
  dimensions: HomeDriveVehicleDimensions;
  visual: HomeDriveVehicleVisualProfile;
  trafficWeight: number;
  parkedWeight: number;
  roadKindWeights: HomeDriveVehicleRoadKindWeightMap;
}>;

export type HomeDriveVehiclePaintDescriptor = Readonly<{
  key: HomeDriveVehiclePaintKey;
  label: string;
  color: string;
  roughness: number;
  metalness: number;
  weight: number;
}>;

export type HomeDriveVehiclePickContext = Readonly<{
  roadKind?: string;
  parked?: boolean;
  commercialBias?: boolean;
  serviceBias?: boolean;
  seedSalt?: number;
}>;
