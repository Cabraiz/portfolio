// src/pages/Mateus/Home/components/mobile/game/driving/domain/vehicles/homeDrive.vehicleModels.ts
import type {
  HomeDriveVehicleModelDescriptor,
  HomeDriveVehicleModelKey,
  HomeDriveVehiclePaintDescriptor,
  HomeDriveVehiclePaintKey,
  HomeDriveVehiclePickContext,
} from "./homeDrive.vehicleModels.types";
import { HOME_DRIVE_EVERYDAY_VEHICLE_MODELS } from "./homeDrive.vehicleModels.catalog.everyday";
import { HOME_DRIVE_SPECIALTY_VEHICLE_MODELS } from "./homeDrive.vehicleModels.catalog.specialty";
import { HOME_DRIVE_HEAVY_VEHICLE_MODELS } from "./homeDrive.vehicleModels.catalog.heavy";
import { HOME_DRIVE_VEHICLE_PAINTS } from "./homeDrive.vehicleModels.paints";
export { HOME_DRIVE_VEHICLE_PAINTS } from "./homeDrive.vehicleModels.paints";
type WeightedVehicleModel = Readonly<{
  key: HomeDriveVehicleModelKey;
  weight: number;
}>;

type WeightedPaint = Readonly<{
  key: HomeDriveVehiclePaintKey;
  weight: number;
}>;
export const HOME_DRIVE_VEHICLE_MODELS: Readonly<
  Record<HomeDriveVehicleModelKey, HomeDriveVehicleModelDescriptor>
> = Object.freeze({
  ...HOME_DRIVE_EVERYDAY_VEHICLE_MODELS,
  ...HOME_DRIVE_SPECIALTY_VEHICLE_MODELS,
  ...HOME_DRIVE_HEAVY_VEHICLE_MODELS,
});
export const HOME_DRIVE_VEHICLE_MODEL_KEYS: readonly HomeDriveVehicleModelKey[] =
  Object.freeze([
    "compact-hatch",
    "popular-hatch",
    "small-sedan",
    "mid-sedan",
    "compact-suv",
    "mid-suv",
    "light-pickup",
    "delivery-van",
    "taxi-sedan",
    "app-driver-sedan",
    "mini-hatch",
    "classic-beetle",
    "retro-station-wagon",
    "executive-sedan",
    "sport-coupe",
    "muscle-coupe",
    "luxury-suv",
    "offroad-suv",
    "hilux-pickup",
    "double-cab-pickup",
    "flatbed-pickup",
    "dump-truck",
    "box-truck",
    "semi-truck",
    "city-bus",
    "articulated-bus",
    "school-bus",
    "minibus",
    "ambulance-van",
    "police-suv",
    "street-motorcycle",
    "delivery-motorcycle",
    "urban-bicycle",
  ]);

export const HOME_DRIVE_VEHICLE_PAINT_KEYS: readonly HomeDriveVehiclePaintKey[] =
  Object.freeze([
    "white",
    "silver",
    "black",
    "graphite",
    "red",
    "blue",
    "beige",
    "taxi-yellow",
    "delivery-white",
    "utility-gray",
    "construction-orange",
    "bus-yellow",
    "police-blue",
    "emergency-white",
    "motorcycle-black",
    "bicycle-teal",
  ]);

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function getRoadKindWeight(
  descriptor: HomeDriveVehicleModelDescriptor,
  roadKind?: string,
): number {
  if (!roadKind) {
    return descriptor.roadKindWeights.default ?? 1;
  }

  const directWeight =
    descriptor.roadKindWeights[
      roadKind as keyof typeof descriptor.roadKindWeights
    ];

  return directWeight ?? descriptor.roadKindWeights.default ?? 1;
}

function pickWeighted<T extends string>(
  items: readonly Readonly<{
    key: T;
    weight: number;
  }>[],
  seed: number,
  fallback: T,
): T {
  const totalWeight = items.reduce((sum, item) => {
    return sum + Math.max(0, item.weight);
  }, 0);

  if (totalWeight <= 0) {
    return fallback;
  }

  const target = clamp01(seed) * totalWeight;
  let cursor = 0;

  for (const item of items) {
    cursor += Math.max(0, item.weight);

    if (target <= cursor) {
      return item.key;
    }
  }

  return items[items.length - 1]?.key ?? fallback;
}

export function getHomeDriveVehicleModelDescriptor(
  key: HomeDriveVehicleModelKey,
): HomeDriveVehicleModelDescriptor {
  return HOME_DRIVE_VEHICLE_MODELS[key];
}

export function getHomeDriveVehiclePaintDescriptor(
  key: HomeDriveVehiclePaintKey,
): HomeDriveVehiclePaintDescriptor {
  return HOME_DRIVE_VEHICLE_PAINTS[key];
}

export function isHomeDriveVehicleTwoWheeler(
  key: HomeDriveVehicleModelKey,
): boolean {
  const category = HOME_DRIVE_VEHICLE_MODELS[key].category;

  return category === "motorcycle" || category === "bicycle";
}

export function pickHomeDriveVehicleModelKey(
  seed: number,
  context: HomeDriveVehiclePickContext = {},
): HomeDriveVehicleModelKey {
  const weightedModels: WeightedVehicleModel[] = HOME_DRIVE_VEHICLE_MODEL_KEYS.map(
    (key) => {
      const descriptor = HOME_DRIVE_VEHICLE_MODELS[key];
      const baseWeight = context.parked
        ? descriptor.parkedWeight
        : descriptor.trafficWeight;
      const roadWeight = getRoadKindWeight(descriptor, context.roadKind);
      const commercialWeight =
        context.commercialBias &&
        (descriptor.category === "taxi" ||
          descriptor.category === "app" ||
          descriptor.category === "van" ||
          descriptor.category === "microbus" ||
          descriptor.category === "bus" ||
          descriptor.category === "motorcycle" ||
          descriptor.category === "bicycle")
          ? 1.2
          : 1;
      const serviceWeight =
        context.serviceBias &&
        (descriptor.category === "pickup" ||
          descriptor.category === "van" ||
          descriptor.category === "truck" ||
          descriptor.category === "motorcycle" ||
          descriptor.category === "bicycle")
          ? 1.42
          : 1;

      return {
        key,
        weight: baseWeight * roadWeight * commercialWeight * serviceWeight,
      };
    },
  );

  return pickWeighted(weightedModels, seed, "popular-hatch");
}

function pickPaintFromList(
  seed: number,
  keys: readonly HomeDriveVehiclePaintKey[],
  fallback: HomeDriveVehiclePaintKey,
): HomeDriveVehiclePaintKey {
  const weightedPaints: WeightedPaint[] = keys.map((key) => {
    const descriptor = HOME_DRIVE_VEHICLE_PAINTS[key];

    return {
      key,
      weight: descriptor.weight,
    };
  });

  return pickWeighted(weightedPaints, seed, fallback);
}

export function pickHomeDriveVehiclePaintKey(
  seed: number,
  modelKey: HomeDriveVehicleModelKey,
): HomeDriveVehiclePaintKey {
  if (modelKey === "taxi-sedan") {
    return "taxi-yellow";
  }

  if (modelKey === "delivery-van") {
    return seed > 0.24 ? "delivery-white" : "utility-gray";
  }

  if (modelKey === "ambulance-van") {
    return "emergency-white";
  }

  if (modelKey === "police-suv") {
    return "police-blue";
  }

  if (modelKey === "school-bus") {
    return "bus-yellow";
  }

  if (
    modelKey === "city-bus" ||
    modelKey === "articulated-bus" ||
    modelKey === "minibus"
  ) {
    return pickPaintFromList(seed, ["delivery-white", "silver", "blue", "beige"], "delivery-white");
  }

  if (
    modelKey === "dump-truck" ||
    modelKey === "flatbed-pickup" ||
    modelKey === "box-truck" ||
    modelKey === "semi-truck"
  ) {
    return pickPaintFromList(seed, ["construction-orange", "utility-gray", "delivery-white", "red"], "construction-orange");
  }

  if (modelKey === "street-motorcycle") {
    return pickPaintFromList(seed, ["motorcycle-black", "red", "blue", "silver"], "motorcycle-black");
  }

  if (modelKey === "delivery-motorcycle") {
    return pickPaintFromList(seed, ["red", "delivery-white", "motorcycle-black"], "red");
  }

  if (modelKey === "urban-bicycle") {
    return pickPaintFromList(seed, ["bicycle-teal", "black", "silver", "red"], "bicycle-teal");
  }

  if (
    modelKey === "light-pickup" ||
    modelKey === "hilux-pickup" ||
    modelKey === "double-cab-pickup" ||
    modelKey === "offroad-suv"
  ) {
    if (seed > 0.78) {
      return "utility-gray";
    }
  }

  const weightedPaints: WeightedPaint[] = HOME_DRIVE_VEHICLE_PAINT_KEYS
    .filter((key) => {
      return (
        key !== "taxi-yellow" &&
        key !== "delivery-white" &&
        key !== "bus-yellow" &&
        key !== "police-blue" &&
        key !== "emergency-white" &&
        key !== "construction-orange" &&
        key !== "motorcycle-black" &&
        key !== "bicycle-teal"
      );
    })
    .map((key) => {
      const descriptor = HOME_DRIVE_VEHICLE_PAINTS[key];

      return {
        key,
        weight: descriptor.weight,
      };
    });

  return pickWeighted(weightedPaints, seed, "white");
}
