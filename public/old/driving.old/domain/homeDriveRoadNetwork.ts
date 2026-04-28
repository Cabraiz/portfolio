import {
  projectHomeDriveRoadDepth,
  projectHomeDriveRoadSkewDeg,
  projectHomeDriveSideRoadHorizontalPct,
  type HomeDriveRoadProjection,
} from "./homeDriveRoadProjection";

export type HomeDriveParallelRoadSide = "left" | "right";

export type HomeDriveParallelRoadKind =
  | "service"
  | "avenue"
  | "access"
  | "coastal";

export type HomeDriveRoadAmbience =
  | "coast"
  | "nightlife"
  | "stadium"
  | "urban"
  | "default"
  | string;

export type HomeDriveParallelRoadSpec = Readonly<{
  id: string;
  side: HomeDriveParallelRoadSide;
  kind: HomeDriveParallelRoadKind;
  startMeters: number;
  endMeters: number;
  laneCount: 1 | 2;
  widthWeight: number;
  opacityWeight: number;
  dashed: boolean;
}>;

export type HomeDriveProjectedParallelRoad = Readonly<{
  road: HomeDriveParallelRoadSpec;
  relativeStartMeters: number;
  relativeEndMeters: number;
  centerDistanceMeters: number;
  projection: HomeDriveRoadProjection;
  horizontalPct: number;
  skewDeg: number;
  visible: boolean;
}>;

const BASE_PARALLEL_ROADS: readonly HomeDriveParallelRoadSpec[] = [
  {
    id: "parallel-left-service-01",
    side: "left",
    kind: "service",
    startMeters: 40,
    endMeters: 240,
    laneCount: 1,
    widthWeight: 0.64,
    opacityWeight: 0.48,
    dashed: true,
  },
  {
    id: "parallel-right-access-01",
    side: "right",
    kind: "access",
    startMeters: 96,
    endMeters: 310,
    laneCount: 1,
    widthWeight: 0.56,
    opacityWeight: 0.44,
    dashed: false,
  },
  {
    id: "parallel-left-avenue-02",
    side: "left",
    kind: "avenue",
    startMeters: 260,
    endMeters: 560,
    laneCount: 2,
    widthWeight: 0.76,
    opacityWeight: 0.52,
    dashed: true,
  },
  {
    id: "parallel-right-service-02",
    side: "right",
    kind: "service",
    startMeters: 390,
    endMeters: 680,
    laneCount: 1,
    widthWeight: 0.62,
    opacityWeight: 0.46,
    dashed: true,
  },
];

const COAST_PARALLEL_ROADS: readonly HomeDriveParallelRoadSpec[] = [
  {
    id: "coast-left-boardwalk-road",
    side: "left",
    kind: "coastal",
    startMeters: 30,
    endMeters: 330,
    laneCount: 1,
    widthWeight: 0.58,
    opacityWeight: 0.4,
    dashed: false,
  },
  {
    id: "coast-right-service-road",
    side: "right",
    kind: "service",
    startMeters: 150,
    endMeters: 480,
    laneCount: 1,
    widthWeight: 0.62,
    opacityWeight: 0.46,
    dashed: true,
  },
];

const NIGHTLIFE_PARALLEL_ROADS: readonly HomeDriveParallelRoadSpec[] = [
  {
    id: "nightlife-right-access-lit",
    side: "right",
    kind: "access",
    startMeters: 70,
    endMeters: 330,
    laneCount: 1,
    widthWeight: 0.62,
    opacityWeight: 0.5,
    dashed: true,
  },
  {
    id: "nightlife-left-service-lit",
    side: "left",
    kind: "service",
    startMeters: 230,
    endMeters: 560,
    laneCount: 1,
    widthWeight: 0.64,
    opacityWeight: 0.48,
    dashed: true,
  },
];

const STADIUM_PARALLEL_ROADS: readonly HomeDriveParallelRoadSpec[] = [
  {
    id: "stadium-left-access-wide",
    side: "left",
    kind: "avenue",
    startMeters: 90,
    endMeters: 420,
    laneCount: 2,
    widthWeight: 0.8,
    opacityWeight: 0.54,
    dashed: true,
  },
  {
    id: "stadium-right-service-wide",
    side: "right",
    kind: "service",
    startMeters: 270,
    endMeters: 620,
    laneCount: 2,
    widthWeight: 0.76,
    opacityWeight: 0.5,
    dashed: true,
  },
];

function normalizeAmbience(ambience: HomeDriveRoadAmbience): string {
  return String(ambience || "default").toLowerCase();
}

export function getHomeDriveParallelRoadsForAmbience(
  ambience: HomeDriveRoadAmbience,
): readonly HomeDriveParallelRoadSpec[] {
  switch (normalizeAmbience(ambience)) {
    case "coast":
      return [...COAST_PARALLEL_ROADS, ...BASE_PARALLEL_ROADS];

    case "nightlife":
      return [...NIGHTLIFE_PARALLEL_ROADS, ...BASE_PARALLEL_ROADS];

    case "stadium":
      return [...STADIUM_PARALLEL_ROADS, ...BASE_PARALLEL_ROADS];

    default:
      return BASE_PARALLEL_ROADS;
  }
}

export function projectHomeDriveParallelRoad(
  road: HomeDriveParallelRoadSpec,
  routeMeters: number,
  steering: number,
  laneOffset: number,
  maxVisibleMeters = 520,
): HomeDriveProjectedParallelRoad {
  const relativeStartMeters = road.startMeters - routeMeters;
  const relativeEndMeters = road.endMeters - routeMeters;
  const centerDistanceMeters = Math.max(
    0,
    (relativeStartMeters + relativeEndMeters) / 2,
  );

  const projection = projectHomeDriveRoadDepth({
    distanceMeters: centerDistanceMeters,
    maxDistanceMeters: maxVisibleMeters,

    /*
      Antes estava 32 -> 76, por isso a rua subia para o céu.
      Agora fica na faixa de solo/horizonte da pista.
    */
    minBottomPct: 20,
    maxBottomPct: 42,

    /*
      Rua paralela é detalhe de chão, não objeto principal.
      Escala mais baixa evita o efeito de placa flutuando.
    */
    minScale: 0.18,
    maxScale: 0.64,
  });

  const visible =
    relativeEndMeters >= -40 && relativeStartMeters <= maxVisibleMeters;

  const horizontalPct = projectHomeDriveSideRoadHorizontalPct(
    road.side,
    projection.progress,
    steering,
    laneOffset,
  );

  const skewDeg = projectHomeDriveRoadSkewDeg(
    road.side,
    projection.progress,
    steering,
  );

  return {
    road,
    relativeStartMeters,
    relativeEndMeters,
    centerDistanceMeters,
    projection,
    horizontalPct,
    skewDeg,
    visible,
  };
}
