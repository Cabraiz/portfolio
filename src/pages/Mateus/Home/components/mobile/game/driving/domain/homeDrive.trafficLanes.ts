// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.trafficLanes.ts

import type {
  HomeDriveGeneratedRoadSegment,
  HomeDriveWorldPosition,
} from "./homeDrive.worldMap.types";

export type HomeDriveTrafficDirectionSign = 1 | -1;

export type HomeDriveTrafficLaneResolved = Readonly<{
  directionSign: HomeDriveTrafficDirectionSign;
  laneIndex: number;
  laneCountForDirection: number;
  laneWidthMeters: number;
  laneOffsetMeters: number;
}>;

export type HomeDriveTrafficLanePose = Readonly<{
  position: HomeDriveWorldPosition;
  headingRadians: number;
  direction: Readonly<{
    x: number;
    z: number;
  }>;
  lane: HomeDriveTrafficLaneResolved;
}>;

const MIN_ROAD_WIDTH_METERS = 3;
const MIN_LANE_WIDTH_METERS = 2.15;
const MAX_LANE_WIDTH_METERS = 5.8;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function normalizeVector(vector: Readonly<{ x: number; z: number }>): Readonly<{
  x: number;
  z: number;
}> {
  const length = Math.hypot(vector.x, vector.z);

  if (length <= 0.000001) {
    return {
      x: 0,
      z: 1,
    };
  }

  return {
    x: vector.x / length,
    z: vector.z / length,
  };
}

/*
  No seu render atual, road.normal é usado como normal lateral da rua.
  Pelo fallback usado nos arquivos three, esse normal equivale ao lado
  esquerdo do sentido geométrico from -> to:

    leftNormal = { x: -direction.z, z: direction.x }

  Portanto:
    directionSign +1: sentido from -> to, lado direito = -normal
    directionSign -1: sentido to -> from, lado direito = +normal
*/
export function getHomeDriveTrafficRoadLeftNormal(
  road: HomeDriveGeneratedRoadSegment,
): Readonly<{ x: number; z: number }> {
  const normal = normalizeVector(road.normal);

  if (Math.hypot(normal.x, normal.z) <= 0.000001) {
    const direction = normalizeVector(road.direction);

    return {
      x: -direction.z,
      z: direction.x,
    };
  }

  return normal;
}

export function getHomeDriveTrafficDirectionVector(
  road: HomeDriveGeneratedRoadSegment,
  directionSign: HomeDriveTrafficDirectionSign,
): Readonly<{ x: number; z: number }> {
  const direction = normalizeVector(road.direction);

  return {
    x: direction.x * directionSign,
    z: direction.z * directionSign,
  };
}

export function getHomeDriveTrafficRightNormalForDirection(
  road: HomeDriveGeneratedRoadSegment,
  directionSign: HomeDriveTrafficDirectionSign,
): Readonly<{ x: number; z: number }> {
  const leftNormal = getHomeDriveTrafficRoadLeftNormal(road);

  return {
    x: -leftNormal.x * directionSign,
    z: -leftNormal.z * directionSign,
  };
}

export function normalizeHomeDriveTrafficDirectionSign(
  directionSign: number | null | undefined,
): HomeDriveTrafficDirectionSign {
  return directionSign === -1 ? -1 : 1;
}

export function isHomeDriveTrafficRoadBidirectional(
  road: HomeDriveGeneratedRoadSegment,
): boolean {
  return road.bidirectional !== false;
}

export function getHomeDriveTrafficTotalLaneCount(
  road: HomeDriveGeneratedRoadSegment,
): number {
  return Math.max(1, Math.round(road.laneCount || 1));
}

export function getHomeDriveTrafficLaneWidthMeters(
  road: HomeDriveGeneratedRoadSegment,
): number {
  const roadWidth = Math.max(MIN_ROAD_WIDTH_METERS, road.width || MIN_ROAD_WIDTH_METERS);
  const laneCount = getHomeDriveTrafficTotalLaneCount(road);

  return clamp(
    roadWidth / laneCount,
    MIN_LANE_WIDTH_METERS,
    MAX_LANE_WIDTH_METERS,
  );
}

export function getHomeDriveTrafficLaneCountForDirection(
  road: HomeDriveGeneratedRoadSegment,
  _directionSign: HomeDriveTrafficDirectionSign,
): number {
  const laneCount = getHomeDriveTrafficTotalLaneCount(road);

  if (!isHomeDriveTrafficRoadBidirectional(road)) {
    return laneCount;
  }

  /*
    Em ruas bidirecionais com número ímpar de faixas, a faixa central
    fica neutra/ignorada para tráfego NPC. Isso evita carro renderizado
    no meio da via parecendo contramão.
  */
  return Math.max(1, Math.floor(laneCount / 2));
}

export function normalizeHomeDriveTrafficLaneIndex(
  road: HomeDriveGeneratedRoadSegment,
  directionSign: HomeDriveTrafficDirectionSign,
  laneIndex: number | null | undefined,
): number {
  const laneCountForDirection = getHomeDriveTrafficLaneCountForDirection(
    road,
    directionSign,
  );

  const safeIndex = Number.isFinite(laneIndex ?? NaN)
    ? Math.trunc(laneIndex as number)
    : 0;

  return clamp(safeIndex, 0, laneCountForDirection - 1);
}

export function getHomeDriveTrafficLaneOffsetMeters(
  road: HomeDriveGeneratedRoadSegment,
  directionSign: HomeDriveTrafficDirectionSign,
  laneIndex = 0,
): number {
  const normalizedDirectionSign =
    normalizeHomeDriveTrafficDirectionSign(directionSign);
  const normalizedLaneIndex = normalizeHomeDriveTrafficLaneIndex(
    road,
    normalizedDirectionSign,
    laneIndex,
  );

  const roadHalfWidth = Math.max(MIN_ROAD_WIDTH_METERS, road.width) / 2;
  const laneWidth = getHomeDriveTrafficLaneWidthMeters(road);

  if (!isHomeDriveTrafficRoadBidirectional(road)) {
    const laneCount = getHomeDriveTrafficTotalLaneCount(road);
    const firstLaneCenter = -roadHalfWidth + laneWidth / 2;

    return firstLaneCenter + laneWidth * normalizedLaneIndex;
  }

  /*
    Offset é escalar no eixo road.normal.
    directionSign +1: lado direito da via = offset negativo.
    directionSign -1: lado direito da via = offset positivo.

    Caso crítico: ruas bidirecionais estreitas com laneCount=1.
    Antes os dois sentidos caíam no centro exato da via, então carros de
    sentidos opostos podiam nascer/rotear um dentro do outro. Para tráfego NPC,
    tratamos essa rua como duas trilhas virtuais laterais, ainda dentro da
    largura visual da pista.
  */
  const rightSideSignOnRoadNormal = -normalizedDirectionSign;
  const totalLaneCount = getHomeDriveTrafficTotalLaneCount(road);

  if (totalLaneCount <= 1) {
    const virtualHalfLaneOffset = clamp(
      roadHalfWidth * 0.46,
      Math.min(0.72, roadHalfWidth * 0.38),
      Math.max(0.86, roadHalfWidth - 0.58),
    );

    return rightSideSignOnRoadNormal * virtualHalfLaneOffset;
  }

  const distanceFromCenter =
    roadHalfWidth - laneWidth * (normalizedLaneIndex + 0.5);

  return rightSideSignOnRoadNormal * Math.max(0, distanceFromCenter);
}

export function resolveHomeDriveTrafficLane(
  road: HomeDriveGeneratedRoadSegment,
  directionSign: HomeDriveTrafficDirectionSign,
  laneIndex = 0,
): HomeDriveTrafficLaneResolved {
  const normalizedDirectionSign =
    normalizeHomeDriveTrafficDirectionSign(directionSign);
  const normalizedLaneIndex = normalizeHomeDriveTrafficLaneIndex(
    road,
    normalizedDirectionSign,
    laneIndex,
  );

  return {
    directionSign: normalizedDirectionSign,
    laneIndex: normalizedLaneIndex,
    laneCountForDirection: getHomeDriveTrafficLaneCountForDirection(
      road,
      normalizedDirectionSign,
    ),
    laneWidthMeters: getHomeDriveTrafficLaneWidthMeters(road),
    laneOffsetMeters: getHomeDriveTrafficLaneOffsetMeters(
      road,
      normalizedDirectionSign,
      normalizedLaneIndex,
    ),
  };
}

export function getHomeDriveTrafficLanePositionAtProgress(
  road: HomeDriveGeneratedRoadSegment,
  progress: number,
  laneOffsetMeters: number,
): HomeDriveWorldPosition {
  const clampedProgress = clamp(progress, 0, 1);
  const leftNormal = getHomeDriveTrafficRoadLeftNormal(road);

  const centerX = road.from.x + (road.to.x - road.from.x) * clampedProgress;
  const centerZ = road.from.z + (road.to.z - road.from.z) * clampedProgress;

  return {
    x: centerX + leftNormal.x * laneOffsetMeters,
    z: centerZ + leftNormal.z * laneOffsetMeters,
  };
}

export function getHomeDriveTrafficHeadingRadians(
  road: HomeDriveGeneratedRoadSegment,
  directionSign: HomeDriveTrafficDirectionSign,
): number {
  const direction = getHomeDriveTrafficDirectionVector(road, directionSign);

  /*
    Convenção compatível com Three.js quando o modelo aponta para +Z:
    yaw = atan2(x, z)
  */
  return Math.atan2(direction.x, direction.z);
}

export function getHomeDriveTrafficLanePoseAtProgress(
  road: HomeDriveGeneratedRoadSegment,
  progress: number,
  directionSign: HomeDriveTrafficDirectionSign,
  laneIndex = 0,
): HomeDriveTrafficLanePose {
  const lane = resolveHomeDriveTrafficLane(road, directionSign, laneIndex);
  const direction = getHomeDriveTrafficDirectionVector(road, lane.directionSign);

  return {
    position: getHomeDriveTrafficLanePositionAtProgress(
      road,
      progress,
      lane.laneOffsetMeters,
    ),
    headingRadians: getHomeDriveTrafficHeadingRadians(road, lane.directionSign),
    direction,
    lane,
  };
}

export function getHomeDriveTrafficSeededLaneIndex(
  road: HomeDriveGeneratedRoadSegment,
  directionSign: HomeDriveTrafficDirectionSign,
  seed: number,
): number {
  const laneCountForDirection = getHomeDriveTrafficLaneCountForDirection(
    road,
    directionSign,
  );

  if (laneCountForDirection <= 1) {
    return 0;
  }

  const normalizedSeed = Math.abs(Math.sin(seed * 999.137));

  return Math.floor(normalizedSeed * laneCountForDirection) % laneCountForDirection;
}

export function getHomeDriveTrafficSeededDirectionSign(
  road: HomeDriveGeneratedRoadSegment,
  seed: number,
): HomeDriveTrafficDirectionSign {
  if (!isHomeDriveTrafficRoadBidirectional(road)) {
    return 1;
  }

  return Math.sin(seed * 37.713) >= 0 ? 1 : -1;
}
