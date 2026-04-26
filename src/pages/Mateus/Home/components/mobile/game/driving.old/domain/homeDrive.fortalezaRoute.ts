import { HOME_DRIVE_ROUTE_LENGTH_METERS } from "./homeDrive.constants";

export type HomeDriveAmbience =
  | "coast"
  | "nightlife"
  | "downtown"
  | "academic"
  | "residential"
  | "stadium";

export type HomeDriveRoadTone =
  | "avenue"
  | "boulevard"
  | "urban-core"
  | "corridor";

export type HomeDriveRouteSegment = Readonly<{
  id: string;
  label: string;
  district: string;
  startMeter: number;
  endMeter: number;
  ambience: HomeDriveAmbience;
  roadTone: HomeDriveRoadTone;
  horizonGlow: number;
  trafficDensity: number;
}>;

export type HomeDriveRouteDefinition = Readonly<{
  id: "fortaleza-night-drive";
  label: string;
  totalLengthMeters: number;
  startDistrict: string;
  looped: boolean;
  segments: readonly HomeDriveRouteSegment[];
}>;

export const HOME_DRIVE_FORTALEZA_ROUTE_SEGMENTS: readonly HomeDriveRouteSegment[] = [
  {
    id: "orla-beira-mar",
    label: "Orla / Beira Mar",
    district: "Meireles",
    startMeter: 0,
    endMeter: 760,
    ambience: "coast",
    roadTone: "boulevard",
    horizonGlow: 0.9,
    trafficDensity: 0.2,
  },
  {
    id: "praia-de-iracema",
    label: "Praia de Iracema",
    district: "Iracema",
    startMeter: 760,
    endMeter: 1650,
    ambience: "nightlife",
    roadTone: "avenue",
    horizonGlow: 0.82,
    trafficDensity: 0.34,
  },
  {
    id: "centro",
    label: "Centro",
    district: "Centro",
    startMeter: 1650,
    endMeter: 2820,
    ambience: "downtown",
    roadTone: "urban-core",
    horizonGlow: 0.55,
    trafficDensity: 0.52,
  },
  {
    id: "benfica",
    label: "Benfica",
    district: "Benfica",
    startMeter: 2820,
    endMeter: 3720,
    ambience: "academic",
    roadTone: "corridor",
    horizonGlow: 0.46,
    trafficDensity: 0.28,
  },
  {
    id: "aldeota",
    label: "Aldeota",
    district: "Aldeota",
    startMeter: 3720,
    endMeter: 5000,
    ambience: "residential",
    roadTone: "avenue",
    horizonGlow: 0.66,
    trafficDensity: 0.4,
  },
  {
    id: "castelao",
    label: "Castelão",
    district: "Castelão",
    startMeter: 5000,
    endMeter: HOME_DRIVE_ROUTE_LENGTH_METERS,
    ambience: "stadium",
    roadTone: "corridor",
    horizonGlow: 0.5,
    trafficDensity: 0.18,
  },
] as const;

export const HOME_DRIVE_FORTALEZA_ROUTE: HomeDriveRouteDefinition = {
  id: "fortaleza-night-drive",
  label: "Fortaleza Night Drive",
  totalLengthMeters: HOME_DRIVE_ROUTE_LENGTH_METERS,
  startDistrict: "Meireles",
  looped: true,
  segments: HOME_DRIVE_FORTALEZA_ROUTE_SEGMENTS,
};

export function normalizeFortalezaRouteMeter(meter: number): number {
  if (meter < 0) {
    return (
      ((meter % HOME_DRIVE_ROUTE_LENGTH_METERS) + HOME_DRIVE_ROUTE_LENGTH_METERS) %
      HOME_DRIVE_ROUTE_LENGTH_METERS
    );
  }

  return meter % HOME_DRIVE_ROUTE_LENGTH_METERS;
}

export function getFortalezaRouteSegmentByMeter(
  meter: number,
): HomeDriveRouteSegment {
  const wrappedMeter = normalizeFortalezaRouteMeter(meter);

  return (
    HOME_DRIVE_FORTALEZA_ROUTE_SEGMENTS.find(
      (segment) =>
        wrappedMeter >= segment.startMeter && wrappedMeter < segment.endMeter,
    ) ?? HOME_DRIVE_FORTALEZA_ROUTE_SEGMENTS[0]
  );
}

export function getFortalezaRouteDistrictByMeter(meter: number): string {
  return getFortalezaRouteSegmentByMeter(meter).district;
}

export function getFortalezaRouteSegmentProgress(
  meter: number,
): Readonly<{
  segment: HomeDriveRouteSegment;
  localMeter: number;
  localProgress: number;
}> {
  const segment = getFortalezaRouteSegmentByMeter(meter);
  const wrappedMeter = normalizeFortalezaRouteMeter(meter);
  const segmentLength = Math.max(1, segment.endMeter - segment.startMeter);
  const localMeter = Math.max(0, wrappedMeter - segment.startMeter);
  const localProgress = Math.min(1, Math.max(0, localMeter / segmentLength));

  return {
    segment,
    localMeter,
    localProgress,
  };
}
