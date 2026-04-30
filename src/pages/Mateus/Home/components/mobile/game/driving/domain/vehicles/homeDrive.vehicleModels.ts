// src/pages/Mateus/Home/components/mobile/game/driving/domain/vehicles/homeDrive.vehicleModels.ts

import type {
  HomeDriveVehicleModelDescriptor,
  HomeDriveVehicleModelKey,
  HomeDriveVehiclePaintDescriptor,
  HomeDriveVehiclePaintKey,
  HomeDriveVehiclePickContext,
} from "./homeDrive.vehicleModels.types";

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
  "compact-hatch": Object.freeze({
    key: "compact-hatch",
    label: "Hatch compacto",
    category: "hatch",
    dimensions: {
      widthMeters: 1.72,
      lengthMeters: 3.72,
      heightMeters: 1.48,
    },
    visual: {
      hoodRatio: 0.22,
      cabinRatio: 0.54,
      trunkRatio: 0.12,
      cabinForwardOffsetMeters: -0.08,
      cabinHeightRatio: 0.54,
      wheelRadiusMeters: 0.31,
      wheelWidthMeters: 0.24,
    },
    trafficWeight: 1.18,
    parkedWeight: 1.28,
    roadKindWeights: {
      street: 1.22,
      avenue: 1.08,
      commercial: 1.12,
      coastal: 1.02,
      ring: 0.92,
      service: 0.86,
      default: 1,
    },
  }),

  "popular-hatch": Object.freeze({
    key: "popular-hatch",
    label: "Hatch popular",
    category: "hatch",
    dimensions: {
      widthMeters: 1.78,
      lengthMeters: 4.04,
      heightMeters: 1.52,
    },
    visual: {
      hoodRatio: 0.24,
      cabinRatio: 0.5,
      trunkRatio: 0.15,
      cabinForwardOffsetMeters: -0.04,
      cabinHeightRatio: 0.52,
      wheelRadiusMeters: 0.32,
      wheelWidthMeters: 0.25,
    },
    trafficWeight: 1.3,
    parkedWeight: 1.34,
    roadKindWeights: {
      street: 1.2,
      avenue: 1.12,
      commercial: 1.16,
      coastal: 1,
      ring: 0.96,
      service: 0.88,
      default: 1,
    },
  }),

  "small-sedan": Object.freeze({
    key: "small-sedan",
    label: "Sedan compacto",
    category: "sedan",
    dimensions: {
      widthMeters: 1.82,
      lengthMeters: 4.38,
      heightMeters: 1.5,
    },
    visual: {
      hoodRatio: 0.28,
      cabinRatio: 0.43,
      trunkRatio: 0.24,
      cabinForwardOffsetMeters: -0.02,
      cabinHeightRatio: 0.5,
      wheelRadiusMeters: 0.33,
      wheelWidthMeters: 0.25,
    },
    trafficWeight: 0.95,
    parkedWeight: 0.92,
    roadKindWeights: {
      street: 0.92,
      avenue: 1.08,
      commercial: 1.02,
      coastal: 0.96,
      ring: 1.06,
      service: 0.72,
      default: 1,
    },
  }),

  "mid-sedan": Object.freeze({
    key: "mid-sedan",
    label: "Sedan médio",
    category: "sedan",
    dimensions: {
      widthMeters: 1.88,
      lengthMeters: 4.72,
      heightMeters: 1.48,
    },
    visual: {
      hoodRatio: 0.3,
      cabinRatio: 0.4,
      trunkRatio: 0.26,
      cabinForwardOffsetMeters: 0.02,
      cabinHeightRatio: 0.48,
      wheelRadiusMeters: 0.34,
      wheelWidthMeters: 0.26,
    },
    trafficWeight: 0.58,
    parkedWeight: 0.52,
    roadKindWeights: {
      street: 0.72,
      avenue: 1.08,
      commercial: 0.94,
      coastal: 0.98,
      ring: 1.12,
      service: 0.46,
      default: 1,
    },
  }),

  "compact-suv": Object.freeze({
    key: "compact-suv",
    label: "SUV compacto",
    category: "suv",
    dimensions: {
      widthMeters: 1.92,
      lengthMeters: 4.42,
      heightMeters: 1.72,
    },
    visual: {
      hoodRatio: 0.28,
      cabinRatio: 0.48,
      trunkRatio: 0.18,
      cabinForwardOffsetMeters: -0.02,
      cabinHeightRatio: 0.54,
      wheelRadiusMeters: 0.37,
      wheelWidthMeters: 0.28,
    },
    trafficWeight: 0.78,
    parkedWeight: 0.74,
    roadKindWeights: {
      street: 0.88,
      avenue: 1.12,
      commercial: 0.96,
      coastal: 1.08,
      ring: 1.08,
      service: 0.58,
      default: 1,
    },
  }),

  "mid-suv": Object.freeze({
    key: "mid-suv",
    label: "SUV médio",
    category: "suv",
    dimensions: {
      widthMeters: 1.98,
      lengthMeters: 4.78,
      heightMeters: 1.78,
    },
    visual: {
      hoodRatio: 0.3,
      cabinRatio: 0.46,
      trunkRatio: 0.2,
      cabinForwardOffsetMeters: 0.02,
      cabinHeightRatio: 0.53,
      wheelRadiusMeters: 0.39,
      wheelWidthMeters: 0.3,
    },
    trafficWeight: 0.44,
    parkedWeight: 0.38,
    roadKindWeights: {
      street: 0.62,
      avenue: 1.06,
      commercial: 0.82,
      coastal: 1.02,
      ring: 1.18,
      service: 0.42,
      default: 1,
    },
  }),

  "light-pickup": Object.freeze({
    key: "light-pickup",
    label: "Picape leve",
    category: "pickup",
    dimensions: {
      widthMeters: 1.94,
      lengthMeters: 5.18,
      heightMeters: 1.82,
    },
    visual: {
      hoodRatio: 0.3,
      cabinRatio: 0.34,
      trunkRatio: 0.32,
      cabinForwardOffsetMeters: -0.36,
      cabinHeightRatio: 0.52,
      wheelRadiusMeters: 0.39,
      wheelWidthMeters: 0.3,
    },
    trafficWeight: 0.34,
    parkedWeight: 0.42,
    roadKindWeights: {
      street: 0.86,
      avenue: 0.84,
      commercial: 1.04,
      coastal: 0.7,
      ring: 1.08,
      service: 1.42,
      default: 1,
    },
  }),

  "delivery-van": Object.freeze({
    key: "delivery-van",
    label: "Van de entrega",
    category: "van",
    dimensions: {
      widthMeters: 2.08,
      lengthMeters: 5.46,
      heightMeters: 2.28,
    },
    visual: {
      hoodRatio: 0.2,
      cabinRatio: 0.5,
      trunkRatio: 0.24,
      cabinForwardOffsetMeters: -0.16,
      cabinHeightRatio: 0.62,
      wheelRadiusMeters: 0.4,
      wheelWidthMeters: 0.32,
    },
    trafficWeight: 0.18,
    parkedWeight: 0.24,
    roadKindWeights: {
      street: 0.58,
      avenue: 0.86,
      commercial: 1.5,
      coastal: 0.46,
      ring: 0.8,
      service: 1.68,
      default: 1,
    },
  }),

  "taxi-sedan": Object.freeze({
    key: "taxi-sedan",
    label: "Táxi sedan",
    category: "taxi",
    dimensions: {
      widthMeters: 1.84,
      lengthMeters: 4.55,
      heightMeters: 1.52,
    },
    visual: {
      hoodRatio: 0.28,
      cabinRatio: 0.42,
      trunkRatio: 0.24,
      cabinForwardOffsetMeters: -0.02,
      cabinHeightRatio: 0.5,
      wheelRadiusMeters: 0.33,
      wheelWidthMeters: 0.25,
    },
    trafficWeight: 0.16,
    parkedWeight: 0.12,
    roadKindWeights: {
      street: 0.62,
      avenue: 1.18,
      commercial: 1.52,
      coastal: 1.08,
      ring: 0.72,
      service: 0.4,
      default: 1,
    },
  }),

  "app-driver-sedan": Object.freeze({
    key: "app-driver-sedan",
    label: "Sedan aplicativo",
    category: "app",
    dimensions: {
      widthMeters: 1.82,
      lengthMeters: 4.44,
      heightMeters: 1.5,
    },
    visual: {
      hoodRatio: 0.28,
      cabinRatio: 0.43,
      trunkRatio: 0.23,
      cabinForwardOffsetMeters: -0.02,
      cabinHeightRatio: 0.5,
      wheelRadiusMeters: 0.33,
      wheelWidthMeters: 0.25,
    },
    trafficWeight: 0.42,
    parkedWeight: 0.32,
    roadKindWeights: {
      street: 0.94,
      avenue: 1.16,
      commercial: 1.24,
      coastal: 0.98,
      ring: 0.84,
      service: 0.54,
      default: 1,
    },
  }),
});

export const HOME_DRIVE_VEHICLE_PAINTS: Readonly<
  Record<HomeDriveVehiclePaintKey, HomeDriveVehiclePaintDescriptor>
> = Object.freeze({
  white: Object.freeze({
    key: "white",
    label: "Branco",
    color: "#e8e5db",
    roughness: 0.48,
    metalness: 0.12,
    weight: 1.42,
  }),

  silver: Object.freeze({
    key: "silver",
    label: "Prata",
    color: "#aeb1ad",
    roughness: 0.38,
    metalness: 0.22,
    weight: 1.12,
  }),

  black: Object.freeze({
    key: "black",
    label: "Preto",
    color: "#17191b",
    roughness: 0.42,
    metalness: 0.16,
    weight: 0.82,
  }),

  graphite: Object.freeze({
    key: "graphite",
    label: "Grafite",
    color: "#44484b",
    roughness: 0.4,
    metalness: 0.18,
    weight: 0.94,
  }),

  red: Object.freeze({
    key: "red",
    label: "Vermelho",
    color: "#9f2725",
    roughness: 0.48,
    metalness: 0.1,
    weight: 0.34,
  }),

  blue: Object.freeze({
    key: "blue",
    label: "Azul",
    color: "#234f7b",
    roughness: 0.46,
    metalness: 0.12,
    weight: 0.3,
  }),

  beige: Object.freeze({
    key: "beige",
    label: "Bege",
    color: "#b9a989",
    roughness: 0.54,
    metalness: 0.08,
    weight: 0.18,
  }),

  "taxi-yellow": Object.freeze({
    key: "taxi-yellow",
    label: "Amarelo táxi",
    color: "#e2b12f",
    roughness: 0.42,
    metalness: 0.08,
    weight: 0.04,
  }),

  "delivery-white": Object.freeze({
    key: "delivery-white",
    label: "Branco entrega",
    color: "#f0eee5",
    roughness: 0.58,
    metalness: 0.08,
    weight: 0.12,
  }),

  "utility-gray": Object.freeze({
    key: "utility-gray",
    label: "Cinza utilitário",
    color: "#73756f",
    roughness: 0.56,
    metalness: 0.1,
    weight: 0.18,
  }),
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
          descriptor.category === "van")
          ? 1.22
          : 1;
      const serviceWeight =
        context.serviceBias &&
        (descriptor.category === "pickup" || descriptor.category === "van")
          ? 1.34
          : 1;

      return {
        key,
        weight: baseWeight * roadWeight * commercialWeight * serviceWeight,
      };
    },
  );

  return pickWeighted(weightedModels, seed, "popular-hatch");
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

  if (modelKey === "light-pickup" && seed > 0.72) {
    return "utility-gray";
  }

  const weightedPaints: WeightedPaint[] = HOME_DRIVE_VEHICLE_PAINT_KEYS
    .filter((key) => {
      return key !== "taxi-yellow" && key !== "delivery-white";
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
