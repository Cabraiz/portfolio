// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.traffic.vehicleProfile.ts

import type { HomeDriveGeneratedRoadSegment } from "./homeDrive.worldMap.types";
import { getHomeDriveVehicleModelDescriptor } from "./vehicles";
import type {
  HomeDriveVehicleModelKey,
  HomeDriveVehiclePaintKey,
} from "./vehicles";
import type {
  HomeDriveTrafficVehicleColorKey,
  HomeDriveTrafficVehicleKind,
} from "./homeDrive.traffic.types";
import {
  TRAFFIC_VEHICLE_SPACING_MULTIPLIER,
} from "./homeDrive.traffic.constants";
import type {
  TrafficSpeedProfile,
  TrafficVehicleDimensions,
} from "./homeDrive.traffic.constants";
import {
  getRoadTags,
  scaleTrafficVehicleDimensions,
} from "./homeDrive.traffic.roads";

export function getTrafficRoadChance(road: HomeDriveGeneratedRoadSegment): number {
  const tags = getRoadTags(road);

  if (road.kind === "coastal") {
    return 0.76;
  }

  if (road.kind === "avenue") {
    return 0.72;
  }

  if (road.kind === "commercial") {
    return 0.66;
  }

  if (road.kind === "ring") {
    return 0.52;
  }

  if (tags.includes("main") || tags.includes("fast")) {
    return 0.72;
  }

  if (road.kind === "service") {
    return 0.16;
  }

  return 0.48;
}

export function getTrafficSlotSpacingMeters(
  road: HomeDriveGeneratedRoadSegment,
): number {
  const baseSpacing = (() => {
    switch (road.kind) {
      case "coastal":
        return 150;

      case "avenue":
        return 138;

      case "commercial":
        return 128;

      case "ring":
        return 142;

      case "street":
        return 122;

      case "service":
        return 165;

      default:
        return 142;
    }
  })();

  return baseSpacing * TRAFFIC_VEHICLE_SPACING_MULTIPLIER;
}

export function getTrafficSpeedProfile(
  road: HomeDriveGeneratedRoadSegment,
): TrafficSpeedProfile {
  switch (road.kind) {
    case "coastal":
      return {
        minFactor: 0.78,
        maxFactor: 1.1,
        minMps: 7.0,
        maxMps: 18.8,
        accelerationMinMps2: 5.2,
        accelerationMaxMps2: 7.8,
        jitterMps: 0.9,
      };

    case "avenue":
      return {
        minFactor: 0.82,
        maxFactor: 1.2,
        minMps: 8.0,
        maxMps: 21.2,
        accelerationMinMps2: 5.8,
        accelerationMaxMps2: 9.2,
        jitterMps: 1.15,
      };

    case "commercial":
      return {
        minFactor: 0.68,
        maxFactor: 1.0,
        minMps: 6.4,
        maxMps: 15.8,
        accelerationMinMps2: 4.4,
        accelerationMaxMps2: 6.8,
        jitterMps: 0.8,
      };

    case "ring":
      return {
        minFactor: 0.9,
        maxFactor: 1.24,
        minMps: 9.2,
        maxMps: 23.5,
        accelerationMinMps2: 6.2,
        accelerationMaxMps2: 9.6,
        jitterMps: 1.25,
      };

    case "street":
      return {
        minFactor: 0.68,
        maxFactor: 1.02,
        minMps: 6.2,
        maxMps: 16.6,
        accelerationMinMps2: 4.8,
        accelerationMaxMps2: 7.4,
        jitterMps: 0.95,
      };

    case "service":
      return {
        minFactor: 0.5,
        maxFactor: 0.74,
        minMps: 5.4,
        maxMps: 11.4,
        accelerationMinMps2: 3.2,
        accelerationMaxMps2: 5.2,
        jitterMps: 0.5,
      };

    default:
      return {
        minFactor: 0.72,
        maxFactor: 1.04,
        minMps: 6.4,
        maxMps: 17.2,
        accelerationMinMps2: 5.0,
        accelerationMaxMps2: 7.8,
        jitterMps: 0.9,
      };
  }
}

export function getTrafficVehicleModelKind(
  modelKey: HomeDriveVehicleModelKey,
): HomeDriveTrafficVehicleKind {
  switch (modelKey) {
    case "compact-hatch":
    case "mini-hatch":
      return "compact";

    case "popular-hatch":
    case "classic-beetle":
      return "hatch";

    case "small-sedan":
    case "mid-sedan":
    case "executive-sedan":
    case "app-driver-sedan":
      return "sedan";

    case "retro-station-wagon":
      return "wagon";

    case "sport-coupe":
    case "muscle-coupe":
      return "sport";

    case "compact-suv":
    case "mid-suv":
    case "luxury-suv":
    case "offroad-suv":
      return "suv";

    case "light-pickup":
    case "hilux-pickup":
    case "double-cab-pickup":
    case "flatbed-pickup":
      return "pickup";

    case "delivery-van":
    case "ambulance-van":
      return "delivery";

    case "dump-truck":
    case "box-truck":
    case "semi-truck":
      return "truck";

    case "city-bus":
    case "articulated-bus":
    case "school-bus":
      return "bus";

    case "minibus":
      return "microbus";

    case "taxi-sedan":
      return "taxi";

    case "police-suv":
      return "police";

    case "street-motorcycle":
    case "delivery-motorcycle":
      return "motorcycle";

    case "urban-bicycle":
      return "bicycle";

    default:
      return "compact";
  }
}

export function getTrafficVehicleModelDimensions(
  modelKey: HomeDriveVehicleModelKey,
): TrafficVehicleDimensions {
  const model = getHomeDriveVehicleModelDescriptor(modelKey);

  return scaleTrafficVehicleDimensions({
    widthMeters: model.dimensions.widthMeters,
    lengthMeters: model.dimensions.lengthMeters,
    heightMeters: model.dimensions.heightMeters,
  });
}

export function getTrafficVehicleColorFromPaint(
  paintKey: HomeDriveVehiclePaintKey,
): HomeDriveTrafficVehicleColorKey {
  switch (paintKey) {
    case "white":
    case "delivery-white":
      return "white";

    case "silver":
      return "silver";

    case "black":
      return "black";

    case "graphite":
    case "utility-gray":
      return "charcoal";

    case "red":
      return "red";

    case "blue":
      return "blue";

    case "beige":
      return "beige";

    case "taxi-yellow":
    case "bus-yellow":
      return "yellow";

    case "construction-orange":
      return "constructionOrange";

    case "police-blue":
      return "policeBlue";

    case "emergency-white":
      return "emergencyWhite";

    case "motorcycle-black":
      return "motorcycleBlack";

    case "bicycle-teal":
      return "bicycleTeal";

    default:
      return "white";
  }
}
