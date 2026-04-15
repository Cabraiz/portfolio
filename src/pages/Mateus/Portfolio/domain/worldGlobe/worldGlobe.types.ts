// src/pages/Mateus/Portfolio/domain/worldGlobe/worldGlobe.types.ts

export type GlobeGeoPoint = Readonly<{
  lat: number;
  lng: number;
}>;

export type GlobeRgbColor = readonly [number, number, number];
export type GlobeMutableRgbColor = [number, number, number];
export type GlobeMutableLatLngTuple = [number, number];

export type GlobeMarkerModel = Readonly<{
  location: GlobeMutableLatLngTuple;
  size: number;
  color: GlobeMutableRgbColor;
}>;

export type GlobeArcModel = Readonly<{
  from: GlobeMutableLatLngTuple;
  to: GlobeMutableLatLngTuple;
  color: GlobeMutableRgbColor;
}>;

export type GlobeFocus = Readonly<{
  phi: number;
  theta: number;
}>;

export type CanvasSize = Readonly<{
  width: number;
  height: number;
}>;

export type GlobeTransitionState = Readonly<{
  fromFocus: GlobeFocus;
  toFocus: GlobeFocus;
  fromLocation: GlobeGeoPoint;
  toLocation: GlobeGeoPoint;
  startedAt: number;
  durationMs: number;
}> | null;
