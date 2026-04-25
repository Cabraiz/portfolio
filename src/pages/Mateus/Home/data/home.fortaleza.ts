import { HOME_DRIVE_ROUTE_LENGTH_METERS } from "../components/mobile/game/driving/domain/homeDrive.constants";
import {
  getFortalezaRouteSegmentByMeter,
  type HomeDriveAmbience,
  type HomeDriveRoadTone,
} from "../components/mobile/game/driving/domain/homeDrive.fortalezaRoute";
import type { HomeDriveLandmark } from "../components/mobile/game/driving/domain/homeDrive.types";

export type HomeFortalezaDistrictId =
  | "meireles"
  | "iracema"
  | "centro"
  | "benfica"
  | "aldeota"
  | "castelao";

export type HomeFortalezaDistrict = Readonly<{
  id: HomeFortalezaDistrictId;
  label: string;
  shortLabel: string;
  atmosphere: HomeDriveAmbience;
  horizonGlow: number;
  trafficDensity: number;
  roadTone: HomeDriveRoadTone;
  skylineSeed: number;
  dominantColor: string;
}>;

export type HomeFortalezaRouteSegment = Readonly<{
  id: string;
  districtId: HomeFortalezaDistrictId;
  label: string;
  startMeter: number;
  endMeter: number;
  atmosphere: HomeDriveAmbience;
  roadTone: HomeDriveRoadTone;
  horizonGlow: number;
  trafficDensity: number;
}>;

export type HomeFortalezaRoute = Readonly<{
  id: "fortaleza-night-drive";
  label: string;
  totalLengthMeters: number;
  looped: boolean;
  startDistrictId: HomeFortalezaDistrictId;
  segments: readonly HomeFortalezaRouteSegment[];
}>;

export type HomeFortalezaLandmark = HomeDriveLandmark &
  Readonly<{
    districtId: HomeFortalezaDistrictId;
    icon:
      | "waterfront"
      | "culture"
      | "downtown"
      | "campus"
      | "urban"
      | "stadium";
    glow: number;
    subtitle: string;
  }>;

export const HOME_FORTALEZA_ROUTE_LENGTH = HOME_DRIVE_ROUTE_LENGTH_METERS;

export const HOME_FORTALEZA_DISTRICTS: readonly HomeFortalezaDistrict[] = [
  {
    id: "meireles",
    label: "Meireles",
    shortLabel: "Orla",
    atmosphere: "coast",
    horizonGlow: 0.9,
    trafficDensity: 0.2,
    roadTone: "boulevard",
    skylineSeed: 18,
    dominantColor: "#d3a85f",
  },
  {
    id: "iracema",
    label: "Praia de Iracema",
    shortLabel: "Iracema",
    atmosphere: "nightlife",
    horizonGlow: 0.82,
    trafficDensity: 0.34,
    roadTone: "avenue",
    skylineSeed: 27,
    dominantColor: "#7db2d6",
  },
  {
    id: "centro",
    label: "Centro",
    shortLabel: "Centro",
    atmosphere: "downtown",
    horizonGlow: 0.55,
    trafficDensity: 0.52,
    roadTone: "urban-core",
    skylineSeed: 36,
    dominantColor: "#d18e73",
  },
  {
    id: "benfica",
    label: "Benfica",
    shortLabel: "Benfica",
    atmosphere: "academic",
    horizonGlow: 0.46,
    trafficDensity: 0.28,
    roadTone: "corridor",
    skylineSeed: 43,
    dominantColor: "#c2a66d",
  },
  {
    id: "aldeota",
    label: "Aldeota",
    shortLabel: "Aldeota",
    atmosphere: "residential",
    horizonGlow: 0.66,
    trafficDensity: 0.4,
    roadTone: "avenue",
    skylineSeed: 51,
    dominantColor: "#b7c37d",
  },
  {
    id: "castelao",
    label: "Castelão",
    shortLabel: "Castelão",
    atmosphere: "stadium",
    horizonGlow: 0.5,
    trafficDensity: 0.18,
    roadTone: "corridor",
    skylineSeed: 64,
    dominantColor: "#b88cff",
  },
] as const;

export const HOME_FORTALEZA_ROUTE_SEGMENTS: readonly HomeFortalezaRouteSegment[] = [
  {
    id: "orla-beira-mar",
    districtId: "meireles",
    label: "Orla / Beira Mar",
    startMeter: 0,
    endMeter: 760,
    atmosphere: "coast",
    roadTone: "boulevard",
    horizonGlow: 0.9,
    trafficDensity: 0.2,
  },
  {
    id: "praia-de-iracema",
    districtId: "iracema",
    label: "Praia de Iracema",
    startMeter: 760,
    endMeter: 1650,
    atmosphere: "nightlife",
    roadTone: "avenue",
    horizonGlow: 0.82,
    trafficDensity: 0.34,
  },
  {
    id: "centro",
    districtId: "centro",
    label: "Centro",
    startMeter: 1650,
    endMeter: 2820,
    atmosphere: "downtown",
    roadTone: "urban-core",
    horizonGlow: 0.55,
    trafficDensity: 0.52,
  },
  {
    id: "benfica",
    districtId: "benfica",
    label: "Benfica",
    startMeter: 2820,
    endMeter: 3720,
    atmosphere: "academic",
    roadTone: "corridor",
    horizonGlow: 0.46,
    trafficDensity: 0.28,
  },
  {
    id: "aldeota",
    districtId: "aldeota",
    label: "Aldeota",
    startMeter: 3720,
    endMeter: 5000,
    atmosphere: "residential",
    roadTone: "avenue",
    horizonGlow: 0.66,
    trafficDensity: 0.4,
  },
  {
    id: "castelao",
    districtId: "castelao",
    label: "Castelão",
    startMeter: 5000,
    endMeter: HOME_FORTALEZA_ROUTE_LENGTH,
    atmosphere: "stadium",
    roadTone: "corridor",
    horizonGlow: 0.5,
    trafficDensity: 0.18,
  },
] as const;

export const HOME_FORTALEZA_ROUTE: HomeFortalezaRoute = {
  id: "fortaleza-night-drive",
  label: "Fortaleza Night Drive",
  totalLengthMeters: HOME_FORTALEZA_ROUTE_LENGTH,
  looped: true,
  startDistrictId: "meireles",
  segments: HOME_FORTALEZA_ROUTE_SEGMENTS,
};

export const HOME_FORTALEZA_LANDMARKS: readonly HomeFortalezaLandmark[] = [
  {
    id: "beira-mar",
    label: "Beira Mar",
    subtitle: "Orla principal",
    district: "Meireles",
    districtId: "meireles",
    atMeter: 350,
    color: "#d3a85f",
    icon: "waterfront",
    glow: 0.92,
  },
  {
    id: "iracema",
    label: "Praia de Iracema",
    subtitle: "Faixa cultural noturna",
    district: "Praia de Iracema",
    districtId: "iracema",
    atMeter: 1220,
    color: "#7db2d6",
    icon: "culture",
    glow: 0.84,
  },
  {
    id: "centro",
    label: "Centro",
    subtitle: "Miolo urbano",
    district: "Centro",
    districtId: "centro",
    atMeter: 2280,
    color: "#d18e73",
    icon: "downtown",
    glow: 0.58,
  },
  {
    id: "benfica",
    label: "Benfica",
    subtitle: "Corredor acadêmico",
    district: "Benfica",
    districtId: "benfica",
    atMeter: 3140,
    color: "#c2a66d",
    icon: "campus",
    glow: 0.48,
  },
  {
    id: "aldeota",
    label: "Aldeota",
    subtitle: "Eixo residencial e comercial",
    district: "Aldeota",
    districtId: "aldeota",
    atMeter: 4180,
    color: "#b7c37d",
    icon: "urban",
    glow: 0.68,
  },
  {
    id: "castelao",
    label: "Arena Castelão",
    subtitle: "Polo de chegada",
    district: "Castelão",
    districtId: "castelao",
    atMeter: 5460,
    color: "#b88cff",
    icon: "stadium",
    glow: 0.56,
  },
] as const;

export function getHomeFortalezaDistricts(): readonly HomeFortalezaDistrict[] {
  return HOME_FORTALEZA_DISTRICTS;
}

export function getHomeFortalezaDistrictById(
  districtId: HomeFortalezaDistrictId,
): HomeFortalezaDistrict | undefined {
  return HOME_FORTALEZA_DISTRICTS.find((item) => item.id === districtId);
}

export function getHomeFortalezaRoute(): HomeFortalezaRoute {
  return HOME_FORTALEZA_ROUTE;
}

export function getHomeFortalezaRouteSegments(): readonly HomeFortalezaRouteSegment[] {
  return HOME_FORTALEZA_ROUTE_SEGMENTS;
}

export function getHomeFortalezaLandmarks(): readonly HomeFortalezaLandmark[] {
  return HOME_FORTALEZA_LANDMARKS;
}

export function getHomeFortalezaLandmarkById(
  landmarkId: string,
): HomeFortalezaLandmark | undefined {
  return HOME_FORTALEZA_LANDMARKS.find((item) => item.id === landmarkId);
}

export function getHomeFortalezaLandmarksByDistrict(
  districtId: HomeFortalezaDistrictId,
): readonly HomeFortalezaLandmark[] {
  return HOME_FORTALEZA_LANDMARKS.filter(
    (item) => item.districtId === districtId,
  );
}

export function getHomeFortalezaRouteSegmentByMeter(
  meter: number,
): HomeFortalezaRouteSegment {
  const routeSegment = getFortalezaRouteSegmentByMeter(meter);

  return (
    HOME_FORTALEZA_ROUTE_SEGMENTS.find(
      (segment) => segment.id === routeSegment.id,
    ) ?? HOME_FORTALEZA_ROUTE_SEGMENTS[0]
  );
}

export function getHomeFortalezaDistrictByMeter(
  meter: number,
): HomeFortalezaDistrict {
  const segment = getHomeFortalezaRouteSegmentByMeter(meter);

  return (
    getHomeFortalezaDistrictById(segment.districtId) ??
    HOME_FORTALEZA_DISTRICTS[0]
  );
}

export function getHomeFortalezaNextLandmark(
  traveledMeters: number,
): HomeFortalezaLandmark | undefined {
  return HOME_FORTALEZA_LANDMARKS.find((item) => item.atMeter > traveledMeters);
}

export function getHomeFortalezaCurrentLandmark(
  traveledMeters: number,
): HomeFortalezaLandmark | undefined {
  return [...HOME_FORTALEZA_LANDMARKS]
    .reverse()
    .find((item) => item.atMeter <= traveledMeters);
}

export function getHomeFortalezaVisibleLandmarks(
  traveledMeters: number,
  options?: Readonly<{
    behindMeters?: number;
    aheadMeters?: number;
    limit?: number;
  }>,
): readonly (HomeFortalezaLandmark & { readonly relativeMeters: number })[] {
  const behindMeters = options?.behindMeters ?? -180;
  const aheadMeters = options?.aheadMeters ?? 1200;
  const limit = options?.limit ?? 4;

  return HOME_FORTALEZA_LANDMARKS.map((item) => {
    const relative = item.atMeter - traveledMeters;
    const wrappedRelative =
      relative < -300 ? relative + HOME_FORTALEZA_ROUTE_LENGTH : relative;

    return {
      ...item,
      relativeMeters: wrappedRelative,
    };
  })
    .filter(
      (item) =>
        item.relativeMeters > behindMeters &&
        item.relativeMeters < aheadMeters,
    )
    .slice(0, limit);
}
