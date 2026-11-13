// Tipos, pontos padrão e contas do globo

type GlobeRgbColor = readonly [number, number, number];
type GlobeMutableRgbColor = [number, number, number];
type GlobeMutableLatLngTuple = [number, number];

type LiveWorldGlobeMarkerModel = {
  location: GlobeMutableLatLngTuple;
  size: number;
  color: GlobeMutableRgbColor;
};

type LiveWorldGlobeArcModel = {
  from: GlobeMutableLatLngTuple;
  to: GlobeMutableLatLngTuple;
  color: GlobeMutableRgbColor;
};

type CanvasSize = Readonly<{
  width: number;
  height: number;
}>;

export type LiveWorldGlobePoint = Readonly<{
  id?: string;
  label: string;
  country?: string;
  region?: string;
  lat: number;
  lng: number;
  size?: number;
  color?: GlobeRgbColor;
}>;

const DEFAULT_BASE_COLOR: GlobeRgbColor = [0.094, 0.133, 0.212];
const DEFAULT_GLOW_COLOR: GlobeRgbColor = [0.165, 0.847, 0.945];
const DEFAULT_MARKER_COLOR: GlobeRgbColor = [0.243, 0.929, 0.925];
const DEFAULT_TARGET_COLOR: GlobeRgbColor = [0.557, 0.906, 0.992];
const DEFAULT_ARC_COLOR: GlobeRgbColor = [0.302, 0.984, 0.878];

const DEFAULT_TARGET: LiveWorldGlobePoint = {
  id: "brazil",
  label: "Brasil",
  country: "Brasil",
  region: "América do Sul",
  lat: -14.235,
  lng: -51.9253,
  size: 0.09,
  color: DEFAULT_TARGET_COLOR,
};

const DEFAULT_MARKERS: readonly LiveWorldGlobePoint[] = [
  DEFAULT_TARGET,
  {
    id: "usa",
    label: "Estados Unidos",
    country: "Estados Unidos",
    region: "América do Norte",
    lat: 37.0902,
    lng: -95.7129,
    size: 0.048,
    color: [0.349, 0.592, 0.992],
  },
  {
    id: "portugal",
    label: "Portugal",
    country: "Portugal",
    region: "Europa",
    lat: 39.3999,
    lng: -8.2245,
    size: 0.042,
    color: [0.753, 0.639, 0.992],
  },
  {
    id: "japan",
    label: "Japão",
    country: "Japão",
    region: "Ásia",
    lat: 36.2048,
    lng: 138.2529,
    size: 0.044,
    color: [0.992, 0.58, 0.8],
  },
];

const INITIAL_SIZE: CanvasSize = {
  width: 0,
  height: 0,
};

function joinClassNames(
  ...classNames: Array<string | false | null | undefined>
): string {
  return classNames.filter(Boolean).join(" ");
}

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
}

function degToRad(value: number): number {
  return (value * Math.PI) / 180;
}

function normalizeAngle(angle: number): number {
  const fullTurn = Math.PI * 2;
  let normalized = angle % fullTurn;

  if (normalized < 0) {
    normalized += fullTurn;
  }

  return normalized;
}

function lerp(start: number, end: number, amount: number): number {
  return start + (end - start) * amount;
}

function lerpAngle(current: number, target: number, amount: number): number {
  let delta = target - current;

  while (delta > Math.PI) {
    delta -= Math.PI * 2;
  }

  while (delta < -Math.PI) {
    delta += Math.PI * 2;
  }

  return current + delta * amount;
}

function resolvePointColor(
  color: GlobeRgbColor | undefined,
  fallback: GlobeRgbColor
): GlobeMutableRgbColor {
  const [r, g, b] = color ?? fallback;
  return [r, g, b];
}

function toLocationTuple(
  point: Pick<LiveWorldGlobePoint, "lat" | "lng">
): GlobeMutableLatLngTuple {
  return [point.lat, point.lng];
}

function pointKey(point: LiveWorldGlobePoint): string {
  return point.id ?? `${point.label}-${point.lat}-${point.lng}`;
}

function formatCoordinate(
  value: number,
  positive: string,
  negative: string
): string {
  const suffix = value >= 0 ? positive : negative;
  return `${Math.abs(value).toFixed(1)}° ${suffix}`;
}

function resolveGlobeFocus(
  point: LiveWorldGlobePoint | null | undefined
): Readonly<{
  phi: number;
  theta: number;
}> {
  if (!point) {
    return {
      phi: 0.72,
      theta: 0.24,
    };
  }

  const phi = normalizeAngle(degToRad(-point.lng) + Math.PI / 2);
  const theta = clamp(degToRad(-point.lat) * 0.72, -0.75, 0.75);

  return {
    phi,
    theta,
  };
}

export {
  DEFAULT_ARC_COLOR,
  DEFAULT_BASE_COLOR,
  DEFAULT_GLOW_COLOR,
  DEFAULT_MARKER_COLOR,
  DEFAULT_MARKERS,
  DEFAULT_TARGET,
  DEFAULT_TARGET_COLOR,
  INITIAL_SIZE,
  formatCoordinate,
  joinClassNames,
  lerp,
  lerpAngle,
  normalizeAngle,
  pointKey,
  resolveGlobeFocus,
  resolvePointColor,
  toLocationTuple,
};
export type {
  CanvasSize,
  LiveWorldGlobeArcModel,
  LiveWorldGlobeMarkerModel,
};
