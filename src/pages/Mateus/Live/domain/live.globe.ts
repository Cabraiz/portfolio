// src/pages/Mateus/Live/domain/live.globe.ts

import type { LiveProjectStatus } from "./live.types";
import type { LiveWorldGlobePoint } from "../ui/chrome/LiveWorldGlobe";

export const LIVE_GLOBE_ORIGIN = {
  id: "fortaleza-br",
  label: "Fortaleza",
  country: "Brasil",
  region: "Ceará · base operacional",
  lat: -3.7319,
  lng: -38.5267,
  size: 0.058,
  color: [0.243, 0.929, 0.925],
} as const satisfies LiveWorldGlobePoint;

export const LIVE_GLOBE_TARGETS = {
  active: {
    id: "brazil",
    label: "Brasil",
    country: "Brasil",
    region: "América do Sul",
    lat: -14.235,
    lng: -51.9253,
    size: 0.09,
    color: [0.557, 0.906, 0.992],
  },
  monitoring: {
    id: "united-states",
    label: "Estados Unidos",
    country: "Estados Unidos",
    region: "América do Norte",
    lat: 37.0902,
    lng: -95.7129,
    size: 0.062,
    color: [0.349, 0.592, 0.992],
  },
  delivered: {
    id: "portugal",
    label: "Portugal",
    country: "Portugal",
    region: "Europa",
    lat: 39.3999,
    lng: -8.2245,
    size: 0.056,
    color: [0.753, 0.639, 0.992],
  },
  incubating: {
    id: "japan",
    label: "Japão",
    country: "Japão",
    region: "Ásia",
    lat: 36.2048,
    lng: 138.2529,
    size: 0.058,
    color: [0.992, 0.58, 0.8],
  },
} as const satisfies Record<LiveProjectStatus, LiveWorldGlobePoint>;

export const LIVE_GLOBE_MARKERS = [
  LIVE_GLOBE_ORIGIN,
  LIVE_GLOBE_TARGETS.active,
  LIVE_GLOBE_TARGETS.monitoring,
  LIVE_GLOBE_TARGETS.delivered,
  LIVE_GLOBE_TARGETS.incubating,
] as const satisfies readonly LiveWorldGlobePoint[];
