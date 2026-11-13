// src/pages/Mateus/Home/components/mobile/game/driving/three/HomeDriveThreeTraffic/trafficMaterials.ts
// Materiais das peças e agrupamento por cor.

import { MeshStandardMaterial } from "three";
import type {
  HomeDriveTrafficVehicle,
  HomeDriveTrafficVehicleColorKey,
} from "../../domain/homeDrive.traffic.types";

import type { TrafficBatch, TrafficPart } from "./trafficTypes";

export const PAINTED_TRAFFIC_PARTS: readonly TrafficPart[] = [
  "body",
  "hood",
  "trunk",
  "cabinFrame",
];

const TRAFFIC_MATERIALS: Readonly<
  Record<HomeDriveTrafficVehicleColorKey, MeshStandardMaterial>
> = Object.freeze({
  white: new MeshStandardMaterial({
    color: "#e1dfd0",
    roughness: 0.58,
    metalness: 0.16,
  }),
  silver: new MeshStandardMaterial({
    color: "#b6bbb7",
    roughness: 0.46,
    metalness: 0.32,
  }),
  red: new MeshStandardMaterial({
    color: "#a83b2f",
    roughness: 0.5,
    metalness: 0.18,
  }),
  blue: new MeshStandardMaterial({
    color: "#365f82",
    roughness: 0.48,
    metalness: 0.22,
  }),
  yellow: new MeshStandardMaterial({
    color: "#caa247",
    roughness: 0.54,
    metalness: 0.14,
  }),
  black: new MeshStandardMaterial({
    color: "#191d20",
    roughness: 0.38,
    metalness: 0.28,
  }),
  green: new MeshStandardMaterial({
    color: "#456a4d",
    roughness: 0.56,
    metalness: 0.14,
  }),
  orange: new MeshStandardMaterial({
    color: "#c46a2d",
    roughness: 0.48,
    metalness: 0.18,
  }),
  purple: new MeshStandardMaterial({
    color: "#604574",
    roughness: 0.48,
    metalness: 0.22,
  }),
  brown: new MeshStandardMaterial({
    color: "#6a4b35",
    roughness: 0.58,
    metalness: 0.12,
  }),
  beige: new MeshStandardMaterial({
    color: "#b7a47a",
    roughness: 0.58,
    metalness: 0.12,
  }),
  cyan: new MeshStandardMaterial({
    color: "#3c8791",
    roughness: 0.5,
    metalness: 0.2,
  }),
  darkRed: new MeshStandardMaterial({
    color: "#702922",
    roughness: 0.46,
    metalness: 0.22,
  }),
  darkBlue: new MeshStandardMaterial({
    color: "#243f6a",
    roughness: 0.46,
    metalness: 0.24,
  }),
  lime: new MeshStandardMaterial({
    color: "#7d9941",
    roughness: 0.54,
    metalness: 0.14,
  }),
  cream: new MeshStandardMaterial({
    color: "#d8ceb0",
    roughness: 0.56,
    metalness: 0.12,
  }),
  charcoal: new MeshStandardMaterial({
    color: "#272b2d",
    roughness: 0.42,
    metalness: 0.3,
  }),
  policeBlue: new MeshStandardMaterial({
    color: "#1f3f67",
    roughness: 0.44,
    metalness: 0.24,
  }),
  constructionOrange: new MeshStandardMaterial({
    color: "#c96b2c",
    roughness: 0.58,
    metalness: 0.12,
  }),
  emergencyWhite: new MeshStandardMaterial({
    color: "#f4f1e8",
    roughness: 0.42,
    metalness: 0.14,
  }),
  motorcycleBlack: new MeshStandardMaterial({
    color: "#111315",
    roughness: 0.36,
    metalness: 0.28,
  }),
  bicycleTeal: new MeshStandardMaterial({
    color: "#2b7f79",
    roughness: 0.5,
    metalness: 0.14,
  }),
});

export const TRAFFIC_GLASS_MATERIAL = new MeshStandardMaterial({
  color: "#16242d",
  roughness: 0.24,
  metalness: 0.34,
  transparent: true,
  opacity: 0.82,
});

export const TRAFFIC_DARK_TRIM_MATERIAL = new MeshStandardMaterial({
  color: "#171a1d",
  roughness: 0.7,
  metalness: 0.18,
});

export const TRAFFIC_FRONT_GRILLE_MATERIAL = new MeshStandardMaterial({
  color: "#0f1214",
  roughness: 0.78,
  metalness: 0.16,
});

export const TRAFFIC_FRONT_SPLITTER_MATERIAL = new MeshStandardMaterial({
  color: "#101214",
  roughness: 0.5,
  metalness: 0.34,
});

export const TRAFFIC_CHROME_TRIM_MATERIAL = new MeshStandardMaterial({
  color: "#b7c0bd",
  roughness: 0.3,
  metalness: 0.62,
});

export const TRAFFIC_TIRE_MATERIAL = new MeshStandardMaterial({
  color: "#101112",
  roughness: 0.86,
  metalness: 0.04,
});

export const TRAFFIC_RIM_MATERIAL = new MeshStandardMaterial({
  color: "#8e9698",
  roughness: 0.36,
  metalness: 0.48,
});

export const TRAFFIC_HEADLIGHT_MATERIAL = new MeshStandardMaterial({
  color: "#f5e9c8",
  emissive: "#d5b96f",
  emissiveIntensity: 0.32,
  roughness: 0.22,
  metalness: 0.08,
});

export const TRAFFIC_TAIL_LIGHT_MATERIAL = new MeshStandardMaterial({
  color: "#b72d24",
  emissive: "#8b1d18",
  emissiveIntensity: 0.28,
  roughness: 0.34,
  metalness: 0.08,
});

export const TRAFFIC_INDICATOR_MATERIAL = new MeshStandardMaterial({
  color: "#e0a442",
  emissive: "#bd711b",
  emissiveIntensity: 0.68,
  roughness: 0.24,
  metalness: 0.08,
});

export const TRAFFIC_BRAKE_LIGHT_MATERIAL = new MeshStandardMaterial({
  color: "#e5352d",
  emissive: "#b40e0a",
  emissiveIntensity: 0.72,
  roughness: 0.24,
  metalness: 0.08,
});

export const TRAFFIC_TAXI_SIGN_MATERIAL = new MeshStandardMaterial({
  color: "#f6d04d",
  emissive: "#c28a18",
  emissiveIntensity: 0.22,
  roughness: 0.42,
  metalness: 0.1,
});

export const TRAFFIC_POLICE_LIGHT_BLUE_MATERIAL = new MeshStandardMaterial({
  color: "#2a74ff",
  emissive: "#174ac4",
  emissiveIntensity: 0.48,
  roughness: 0.22,
  metalness: 0.18,
});

export const TRAFFIC_POLICE_LIGHT_RED_MATERIAL = new MeshStandardMaterial({
  color: "#d63229",
  emissive: "#9f1511",
  emissiveIntensity: 0.42,
  roughness: 0.24,
  metalness: 0.16,
});

export const TRAFFIC_DELIVERY_BOX_MATERIAL = new MeshStandardMaterial({
  color: "#e3e0d0",
  roughness: 0.62,
  metalness: 0.12,
});

export const TRAFFIC_TRUCK_CARGO_MATERIAL = new MeshStandardMaterial({
  color: "#9fa5a2",
  roughness: 0.7,
  metalness: 0.18,
});

export const TRAFFIC_MICROBUS_BAND_MATERIAL = new MeshStandardMaterial({
  color: "#d7d1b5",
  roughness: 0.48,
  metalness: 0.12,
});

export const TRAFFIC_TWO_WHEEL_FRAME_MATERIAL = new MeshStandardMaterial({
  color: "#1b1e20",
  roughness: 0.48,
  metalness: 0.36,
});

export const TRAFFIC_TWO_WHEEL_SEAT_MATERIAL = new MeshStandardMaterial({
  color: "#111111",
  roughness: 0.72,
  metalness: 0.08,
});

export const TRAFFIC_MOTORCYCLE_TANK_MATERIAL = new MeshStandardMaterial({
  color: "#24282c",
  roughness: 0.34,
  metalness: 0.38,
});

export const TRAFFIC_MOTORCYCLE_EXHAUST_MATERIAL = new MeshStandardMaterial({
  color: "#b4bab8",
  roughness: 0.28,
  metalness: 0.72,
});

export const TRAFFIC_RIDER_TORSO_MATERIAL = new MeshStandardMaterial({
  color: "#2c445e",
  roughness: 0.64,
  metalness: 0.04,
});

export const TRAFFIC_RIDER_PANTS_MATERIAL = new MeshStandardMaterial({
  color: "#1e252b",
  roughness: 0.7,
  metalness: 0.04,
});

export const TRAFFIC_RIDER_SKIN_MATERIAL = new MeshStandardMaterial({
  color: "#9f7659",
  roughness: 0.72,
  metalness: 0.02,
});

export const TRAFFIC_RIDER_HELMET_MATERIAL = new MeshStandardMaterial({
  color: "#202326",
  roughness: 0.38,
  metalness: 0.28,
});

export function groupTrafficByColor(
  vehicles: readonly HomeDriveTrafficVehicle[],
): readonly TrafficBatch[] {
  const map = new Map<HomeDriveTrafficVehicleColorKey, number[]>();

  vehicles.forEach((vehicle, index) => {
    const current = map.get(vehicle.colorKey);

    if (current) {
      current.push(index);
      return;
    }

    map.set(vehicle.colorKey, [index]);
  });

  return Array.from(map.entries()).map(([colorKey, indexes]) => ({
    id: `traffic-${colorKey}`,
    indexes,
    material: TRAFFIC_MATERIALS[colorKey],
  }));
}

export function createAllTrafficBatch(
  vehicles: readonly HomeDriveTrafficVehicle[],
): TrafficBatch {
  return {
    id: "traffic-all",
    indexes: vehicles.map((_, index) => index),
    material: TRAFFIC_DARK_TRIM_MATERIAL,
  };
}
