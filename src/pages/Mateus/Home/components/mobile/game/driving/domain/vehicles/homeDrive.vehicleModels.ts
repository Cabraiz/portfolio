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
  "mini-hatch": Object.freeze({
    key: "mini-hatch",
    label: "Mini hatch urbano",
    category: "hatch",
    dimensions: {
      widthMeters: 1.66,
      lengthMeters: 3.48,
      heightMeters: 1.46,
    },
    visual: {
      hoodRatio: 0.2,
      cabinRatio: 0.55,
      trunkRatio: 0.1,
      cabinForwardOffsetMeters: -0.1,
      cabinHeightRatio: 0.55,
      wheelRadiusMeters: 0.3,
      wheelWidthMeters: 0.22,
    },
    trafficWeight: 0.72,
    parkedWeight: 0.64,
    roadKindWeights: {
      street: 1.34,
      avenue: 0.82,
      commercial: 1.12,
      coastal: 0.96,
      ring: 0.58,
      service: 1,
      default: 1,
    },
  }),
  "classic-beetle": Object.freeze({
    key: "classic-beetle",
    label: "Fusca clássico",
    category: "hatch",
    dimensions: {
      widthMeters: 1.72,
      lengthMeters: 4.08,
      heightMeters: 1.54,
    },
    visual: {
      hoodRatio: 0.24,
      cabinRatio: 0.48,
      trunkRatio: 0.18,
      cabinForwardOffsetMeters: -0.05,
      cabinHeightRatio: 0.56,
      wheelRadiusMeters: 0.32,
      wheelWidthMeters: 0.23,
    },
    trafficWeight: 0.22,
    parkedWeight: 0.3,
    roadKindWeights: {
      street: 0.92,
      avenue: 0.72,
      commercial: 0.78,
      coastal: 1.12,
      ring: 0.4,
      service: 0.82,
      default: 1,
    },
  }),
  "retro-station-wagon": Object.freeze({
    key: "retro-station-wagon",
    label: "Perua retrô",
    category: "wagon",
    dimensions: {
      widthMeters: 1.84,
      lengthMeters: 4.84,
      heightMeters: 1.58,
    },
    visual: {
      hoodRatio: 0.28,
      cabinRatio: 0.52,
      trunkRatio: 0.24,
      cabinForwardOffsetMeters: -0.08,
      cabinHeightRatio: 0.48,
      wheelRadiusMeters: 0.34,
      wheelWidthMeters: 0.26,
    },
    trafficWeight: 0.18,
    parkedWeight: 0.2,
    roadKindWeights: {
      street: 0.62,
      avenue: 0.92,
      commercial: 0.66,
      coastal: 1.18,
      ring: 0.62,
      service: 0.54,
      default: 1,
    },
  }),
  "executive-sedan": Object.freeze({
    key: "executive-sedan",
    label: "Sedan executivo",
    category: "sedan",
    dimensions: {
      widthMeters: 1.94,
      lengthMeters: 4.96,
      heightMeters: 1.5,
    },
    visual: {
      hoodRatio: 0.32,
      cabinRatio: 0.38,
      trunkRatio: 0.28,
      cabinForwardOffsetMeters: 0.04,
      cabinHeightRatio: 0.46,
      wheelRadiusMeters: 0.35,
      wheelWidthMeters: 0.27,
    },
    trafficWeight: 0.32,
    parkedWeight: 0.26,
    roadKindWeights: {
      street: 0.5,
      avenue: 1.16,
      commercial: 1.08,
      coastal: 0.86,
      ring: 1.18,
      service: 0.28,
      default: 1,
    },
  }),
  "sport-coupe": Object.freeze({
    key: "sport-coupe",
    label: "Cupê esportivo",
    category: "sport",
    dimensions: {
      widthMeters: 1.92,
      lengthMeters: 4.54,
      heightMeters: 1.28,
    },
    visual: {
      hoodRatio: 0.36,
      cabinRatio: 0.34,
      trunkRatio: 0.22,
      cabinForwardOffsetMeters: 0.03,
      cabinHeightRatio: 0.36,
      wheelRadiusMeters: 0.36,
      wheelWidthMeters: 0.29,
    },
    trafficWeight: 0.16,
    parkedWeight: 0.1,
    roadKindWeights: {
      street: 0.44,
      avenue: 0.76,
      commercial: 0.52,
      coastal: 1.18,
      ring: 1.34,
      service: 0.12,
      default: 1,
    },
  }),
  "muscle-coupe": Object.freeze({
    key: "muscle-coupe",
    label: "Cupê muscle",
    category: "sport",
    dimensions: {
      widthMeters: 1.98,
      lengthMeters: 4.82,
      heightMeters: 1.36,
    },
    visual: {
      hoodRatio: 0.38,
      cabinRatio: 0.34,
      trunkRatio: 0.24,
      cabinForwardOffsetMeters: 0.02,
      cabinHeightRatio: 0.38,
      wheelRadiusMeters: 0.38,
      wheelWidthMeters: 0.31,
    },
    trafficWeight: 0.12,
    parkedWeight: 0.08,
    roadKindWeights: {
      street: 0.36,
      avenue: 0.64,
      commercial: 0.38,
      coastal: 1.08,
      ring: 1.42,
      service: 0.1,
      default: 1,
    },
  }),
  "luxury-suv": Object.freeze({
    key: "luxury-suv",
    label: "SUV grande premium",
    category: "suv",
    dimensions: {
      widthMeters: 2.08,
      lengthMeters: 5.18,
      heightMeters: 1.92,
    },
    visual: {
      hoodRatio: 0.31,
      cabinRatio: 0.46,
      trunkRatio: 0.21,
      cabinForwardOffsetMeters: 0.02,
      cabinHeightRatio: 0.54,
      wheelRadiusMeters: 0.42,
      wheelWidthMeters: 0.32,
    },
    trafficWeight: 0.22,
    parkedWeight: 0.18,
    roadKindWeights: {
      street: 0.42,
      avenue: 1.04,
      commercial: 0.72,
      coastal: 1.02,
      ring: 1.22,
      service: 0.26,
      default: 1,
    },
  }),
  "offroad-suv": Object.freeze({
    key: "offroad-suv",
    label: "SUV off-road",
    category: "suv",
    dimensions: {
      widthMeters: 2.02,
      lengthMeters: 4.72,
      heightMeters: 1.96,
    },
    visual: {
      hoodRatio: 0.32,
      cabinRatio: 0.42,
      trunkRatio: 0.22,
      cabinForwardOffsetMeters: -0.02,
      cabinHeightRatio: 0.56,
      wheelRadiusMeters: 0.44,
      wheelWidthMeters: 0.34,
    },
    trafficWeight: 0.18,
    parkedWeight: 0.2,
    roadKindWeights: {
      street: 0.46,
      avenue: 0.58,
      commercial: 0.52,
      coastal: 1.2,
      ring: 1.08,
      service: 1.42,
      default: 1,
    },
  }),
  "hilux-pickup": Object.freeze({
    key: "hilux-pickup",
    label: "Hilux cabine dupla",
    category: "pickup",
    dimensions: {
      widthMeters: 2.02,
      lengthMeters: 5.34,
      heightMeters: 1.9,
    },
    visual: {
      hoodRatio: 0.32,
      cabinRatio: 0.36,
      trunkRatio: 0.34,
      cabinForwardOffsetMeters: -0.28,
      cabinHeightRatio: 0.53,
      wheelRadiusMeters: 0.42,
      wheelWidthMeters: 0.32,
    },
    trafficWeight: 0.3,
    parkedWeight: 0.34,
    roadKindWeights: {
      street: 0.68,
      avenue: 0.88,
      commercial: 0.92,
      coastal: 0.86,
      ring: 1.1,
      service: 1.64,
      default: 1,
    },
  }),
  "double-cab-pickup": Object.freeze({
    key: "double-cab-pickup",
    label: "Picape cabine dupla",
    category: "pickup",
    dimensions: {
      widthMeters: 2.04,
      lengthMeters: 5.52,
      heightMeters: 1.88,
    },
    visual: {
      hoodRatio: 0.32,
      cabinRatio: 0.38,
      trunkRatio: 0.33,
      cabinForwardOffsetMeters: -0.22,
      cabinHeightRatio: 0.52,
      wheelRadiusMeters: 0.42,
      wheelWidthMeters: 0.32,
    },
    trafficWeight: 0.22,
    parkedWeight: 0.3,
    roadKindWeights: {
      street: 0.56,
      avenue: 0.78,
      commercial: 0.88,
      coastal: 0.7,
      ring: 1.08,
      service: 1.7,
      default: 1,
    },
  }),
  "flatbed-pickup": Object.freeze({
    key: "flatbed-pickup",
    label: "Picape carroceria aberta",
    category: "pickup",
    dimensions: {
      widthMeters: 2.06,
      lengthMeters: 5.72,
      heightMeters: 1.86,
    },
    visual: {
      hoodRatio: 0.3,
      cabinRatio: 0.32,
      trunkRatio: 0.44,
      cabinForwardOffsetMeters: -0.42,
      cabinHeightRatio: 0.5,
      wheelRadiusMeters: 0.41,
      wheelWidthMeters: 0.33,
    },
    trafficWeight: 0.14,
    parkedWeight: 0.2,
    roadKindWeights: {
      street: 0.36,
      avenue: 0.58,
      commercial: 0.98,
      coastal: 0.32,
      ring: 0.92,
      service: 2,
      default: 1,
    },
  }),
  "dump-truck": Object.freeze({
    key: "dump-truck",
    label: "Caminhão caçamba",
    category: "truck",
    dimensions: {
      widthMeters: 2.56,
      lengthMeters: 7.55,
      heightMeters: 3.08,
    },
    visual: {
      hoodRatio: 0.2,
      cabinRatio: 0.28,
      trunkRatio: 0.58,
      cabinForwardOffsetMeters: -0.72,
      cabinHeightRatio: 0.48,
      wheelRadiusMeters: 0.54,
      wheelWidthMeters: 0.42,
    },
    trafficWeight: 0.08,
    parkedWeight: 0.02,
    roadKindWeights: {
      street: 0.1,
      avenue: 0.62,
      commercial: 0.76,
      coastal: 0.08,
      ring: 1.22,
      service: 2.35,
      default: 1,
    },
  }),
  "box-truck": Object.freeze({
    key: "box-truck",
    label: "Caminhão baú",
    category: "truck",
    dimensions: {
      widthMeters: 2.48,
      lengthMeters: 7.18,
      heightMeters: 3.24,
    },
    visual: {
      hoodRatio: 0.18,
      cabinRatio: 0.28,
      trunkRatio: 0.6,
      cabinForwardOffsetMeters: -0.64,
      cabinHeightRatio: 0.52,
      wheelRadiusMeters: 0.52,
      wheelWidthMeters: 0.4,
    },
    trafficWeight: 0.1,
    parkedWeight: 0.05,
    roadKindWeights: {
      street: 0.14,
      avenue: 0.78,
      commercial: 1.28,
      coastal: 0.1,
      ring: 1.06,
      service: 2.04,
      default: 1,
    },
  }),
  "semi-truck": Object.freeze({
    key: "semi-truck",
    label: "Cavalo mecânico",
    category: "truck",
    dimensions: {
      widthMeters: 2.58,
      lengthMeters: 8.8,
      heightMeters: 3.42,
    },
    visual: {
      hoodRatio: 0.26,
      cabinRatio: 0.24,
      trunkRatio: 0.62,
      cabinForwardOffsetMeters: -0.8,
      cabinHeightRatio: 0.52,
      wheelRadiusMeters: 0.56,
      wheelWidthMeters: 0.44,
    },
    trafficWeight: 0.045,
    parkedWeight: 0,
    roadKindWeights: {
      street: 0.03,
      avenue: 0.38,
      commercial: 0.5,
      coastal: 0.03,
      ring: 1.52,
      service: 1.76,
      default: 1,
    },
  }),
  "city-bus": Object.freeze({
    key: "city-bus",
    label: "Ônibus urbano",
    category: "bus",
    dimensions: {
      widthMeters: 2.58,
      lengthMeters: 10.5,
      heightMeters: 3.28,
    },
    visual: {
      hoodRatio: 0.08,
      cabinRatio: 0.78,
      trunkRatio: 0.08,
      cabinForwardOffsetMeters: 0,
      cabinHeightRatio: 0.5,
      wheelRadiusMeters: 0.5,
      wheelWidthMeters: 0.38,
    },
    trafficWeight: 0.08,
    parkedWeight: 0,
    roadKindWeights: {
      street: 0.12,
      avenue: 1.12,
      commercial: 1.34,
      coastal: 0.32,
      ring: 0.8,
      service: 0.1,
      default: 1,
    },
  }),
  "articulated-bus": Object.freeze({
    key: "articulated-bus",
    label: "Ônibus articulado",
    category: "bus",
    dimensions: {
      widthMeters: 2.6,
      lengthMeters: 13.8,
      heightMeters: 3.34,
    },
    visual: {
      hoodRatio: 0.06,
      cabinRatio: 0.84,
      trunkRatio: 0.06,
      cabinForwardOffsetMeters: 0,
      cabinHeightRatio: 0.5,
      wheelRadiusMeters: 0.5,
      wheelWidthMeters: 0.4,
    },
    trafficWeight: 0.035,
    parkedWeight: 0,
    roadKindWeights: {
      street: 0.02,
      avenue: 0.72,
      commercial: 0.92,
      coastal: 0.1,
      ring: 0.78,
      service: 0.02,
      default: 1,
    },
  }),
  "school-bus": Object.freeze({
    key: "school-bus",
    label: "Ônibus escolar",
    category: "bus",
    dimensions: {
      widthMeters: 2.52,
      lengthMeters: 9.7,
      heightMeters: 3.22,
    },
    visual: {
      hoodRatio: 0.08,
      cabinRatio: 0.76,
      trunkRatio: 0.08,
      cabinForwardOffsetMeters: 0,
      cabinHeightRatio: 0.5,
      wheelRadiusMeters: 0.5,
      wheelWidthMeters: 0.38,
    },
    trafficWeight: 0.04,
    parkedWeight: 0,
    roadKindWeights: {
      street: 0.08,
      avenue: 0.36,
      commercial: 0.42,
      coastal: 0.16,
      ring: 0.24,
      service: 0.22,
      default: 1,
    },
  }),
  "minibus": Object.freeze({
    key: "minibus",
    label: "Micro-ônibus",
    category: "microbus",
    dimensions: {
      widthMeters: 2.34,
      lengthMeters: 6.92,
      heightMeters: 2.86,
    },
    visual: {
      hoodRatio: 0.12,
      cabinRatio: 0.66,
      trunkRatio: 0.12,
      cabinForwardOffsetMeters: -0.04,
      cabinHeightRatio: 0.52,
      wheelRadiusMeters: 0.46,
      wheelWidthMeters: 0.36,
    },
    trafficWeight: 0.08,
    parkedWeight: 0.03,
    roadKindWeights: {
      street: 0.18,
      avenue: 0.82,
      commercial: 1.08,
      coastal: 0.24,
      ring: 0.56,
      service: 0.52,
      default: 1,
    },
  }),
  "ambulance-van": Object.freeze({
    key: "ambulance-van",
    label: "Ambulância",
    category: "emergency",
    dimensions: {
      widthMeters: 2.2,
      lengthMeters: 5.92,
      heightMeters: 2.62,
    },
    visual: {
      hoodRatio: 0.18,
      cabinRatio: 0.55,
      trunkRatio: 0.24,
      cabinForwardOffsetMeters: -0.08,
      cabinHeightRatio: 0.58,
      wheelRadiusMeters: 0.42,
      wheelWidthMeters: 0.34,
    },
    trafficWeight: 0.045,
    parkedWeight: 0.02,
    roadKindWeights: {
      street: 0.1,
      avenue: 0.54,
      commercial: 0.5,
      coastal: 0.1,
      ring: 0.8,
      service: 0.28,
      default: 1,
    },
  }),
  "police-suv": Object.freeze({
    key: "police-suv",
    label: "SUV polícia",
    category: "police",
    dimensions: {
      widthMeters: 2.02,
      lengthMeters: 4.96,
      heightMeters: 1.86,
    },
    visual: {
      hoodRatio: 0.3,
      cabinRatio: 0.46,
      trunkRatio: 0.22,
      cabinForwardOffsetMeters: 0,
      cabinHeightRatio: 0.54,
      wheelRadiusMeters: 0.41,
      wheelWidthMeters: 0.31,
    },
    trafficWeight: 0.05,
    parkedWeight: 0.03,
    roadKindWeights: {
      street: 0.12,
      avenue: 0.48,
      commercial: 0.42,
      coastal: 0.22,
      ring: 0.64,
      service: 0.2,
      default: 1,
    },
  }),
  "street-motorcycle": Object.freeze({
    key: "street-motorcycle",
    label: "Moto urbana",
    category: "motorcycle",
    dimensions: {
      widthMeters: 0.82,
      lengthMeters: 2.24,
      heightMeters: 1.32,
    },
    visual: {
      hoodRatio: 0.16,
      cabinRatio: 0.22,
      trunkRatio: 0.12,
      cabinForwardOffsetMeters: 0.02,
      cabinHeightRatio: 0.36,
      wheelRadiusMeters: 0.34,
      wheelWidthMeters: 0.12,
    },
    trafficWeight: 0.5,
    parkedWeight: 0,
    roadKindWeights: {
      street: 1.3,
      avenue: 0.92,
      commercial: 1.32,
      coastal: 1.08,
      ring: 0.42,
      service: 1.2,
      default: 1,
    },
  }),
  "delivery-motorcycle": Object.freeze({
    key: "delivery-motorcycle",
    label: "Moto de entrega",
    category: "motorcycle",
    dimensions: {
      widthMeters: 0.88,
      lengthMeters: 2.34,
      heightMeters: 1.42,
    },
    visual: {
      hoodRatio: 0.16,
      cabinRatio: 0.22,
      trunkRatio: 0.18,
      cabinForwardOffsetMeters: -0.02,
      cabinHeightRatio: 0.38,
      wheelRadiusMeters: 0.34,
      wheelWidthMeters: 0.13,
    },
    trafficWeight: 0.42,
    parkedWeight: 0,
    roadKindWeights: {
      street: 1.2,
      avenue: 0.86,
      commercial: 1.7,
      coastal: 0.78,
      ring: 0.36,
      service: 1.58,
      default: 1,
    },
  }),
  "urban-bicycle": Object.freeze({
    key: "urban-bicycle",
    label: "Bicicleta urbana",
    category: "bicycle",
    dimensions: {
      widthMeters: 0.64,
      lengthMeters: 1.92,
      heightMeters: 1.46,
    },
    visual: {
      hoodRatio: 0.1,
      cabinRatio: 0.18,
      trunkRatio: 0.1,
      cabinForwardOffsetMeters: 0,
      cabinHeightRatio: 0.32,
      wheelRadiusMeters: 0.31,
      wheelWidthMeters: 0.055,
    },
    trafficWeight: 0.22,
    parkedWeight: 0,
    roadKindWeights: {
      street: 1.05,
      avenue: 0.24,
      commercial: 1.1,
      coastal: 1.35,
      ring: 0.02,
      service: 1.24,
      default: 1,
    },
  }),
});
export const HOME_DRIVE_VEHICLE_PAINTS: Readonly<
  Record<HomeDriveVehiclePaintKey, HomeDriveVehiclePaintDescriptor>
> = Object.freeze({
  "white": Object.freeze({
    key: "white",
    label: "Branco",
    color: "#e8e5db",
    roughness: 0.48,
    metalness: 0.12,
    weight: 1.42,
  }),
  "silver": Object.freeze({
    key: "silver",
    label: "Prata",
    color: "#aeb1ad",
    roughness: 0.38,
    metalness: 0.22,
    weight: 1.12,
  }),
  "black": Object.freeze({
    key: "black",
    label: "Preto",
    color: "#17191b",
    roughness: 0.42,
    metalness: 0.16,
    weight: 0.82,
  }),
  "graphite": Object.freeze({
    key: "graphite",
    label: "Grafite",
    color: "#44484b",
    roughness: 0.4,
    metalness: 0.18,
    weight: 0.94,
  }),
  "red": Object.freeze({
    key: "red",
    label: "Vermelho",
    color: "#9f2725",
    roughness: 0.48,
    metalness: 0.1,
    weight: 0.34,
  }),
  "blue": Object.freeze({
    key: "blue",
    label: "Azul",
    color: "#234f7b",
    roughness: 0.46,
    metalness: 0.12,
    weight: 0.3,
  }),
  "beige": Object.freeze({
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
  "construction-orange": Object.freeze({
    key: "construction-orange",
    label: "Laranja obra",
    color: "#c96b2c",
    roughness: 0.58,
    metalness: 0.08,
    weight: 0.1,
  }),
  "bus-yellow": Object.freeze({
    key: "bus-yellow",
    label: "Amarelo ônibus",
    color: "#d8a11e",
    roughness: 0.54,
    metalness: 0.08,
    weight: 0.08,
  }),
  "police-blue": Object.freeze({
    key: "police-blue",
    label: "Azul polícia",
    color: "#1f3f67",
    roughness: 0.46,
    metalness: 0.18,
    weight: 0.045,
  }),
  "emergency-white": Object.freeze({
    key: "emergency-white",
    label: "Branco emergência",
    color: "#f4f1e8",
    roughness: 0.42,
    metalness: 0.12,
    weight: 0.045,
  }),
  "motorcycle-black": Object.freeze({
    key: "motorcycle-black",
    label: "Preto moto",
    color: "#111315",
    roughness: 0.36,
    metalness: 0.26,
    weight: 0.12,
  }),
  "bicycle-teal": Object.freeze({
    key: "bicycle-teal",
    label: "Verde bicicleta",
    color: "#2b7f79",
    roughness: 0.5,
    metalness: 0.14,
    weight: 0.08,
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
