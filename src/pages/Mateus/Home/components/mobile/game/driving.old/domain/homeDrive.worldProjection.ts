import {
  clampHomeDriveWorldNumber,
  getHomeDrivePointDistance,
  getHomeDrivePointLocalToHeading,
  getHomeDriveTurnSideFromAngle,
  getShortestHomeDriveAngleDeg,
  lerpHomeDriveWorldNumber,
  smoothstepHomeDriveWorld,
} from "./homeDrive.worldGeometry";
import {
  findNearestHomeDriveWorldRoad,
  getHomeDriveIntersectionsAhead,
  getHomeDriveWorldDistrictById,
} from "./homeDrive.worldNavigation";
import type {
  HomeDriveProjectedWorldRoad,
  HomeDriveProjectedWorldRoadSide,
  HomeDriveWorldCarState,
  HomeDriveWorldMap,
  HomeDriveWorldPoint,
  HomeDriveWorldProjectionConfig,
  HomeDriveWorldProjectionResult,
  HomeDriveWorldRoad,
} from "./homeDrive.worldTypes";

export const HOME_DRIVE_WORLD_PROJECTION_CONFIG: HomeDriveWorldProjectionConfig =
  {
    visibleDistanceMeters: 520,
    sideVisibilityMeters: 260,
    behindVisibilityMeters: 38,

    /*
      CSS bottom é distância a partir da base da tela.
      Portanto:
      - distante = bottom maior, perto do horizonte;
      - próximo = bottom menor, perto do cockpit/chão.
    */
    minBottomPercent: 20,
    maxBottomPercent: 58,

    minWidthPercent: 6,
    maxWidthPercent: 54,
    maxRoads: 18,
  };

export type ProjectHomeDriveWorldParams = Readonly<{
  map: HomeDriveWorldMap;
  car: HomeDriveWorldCarState;
  config?: Partial<HomeDriveWorldProjectionConfig>;
}>;

function resolveProjectionConfig(
  map: HomeDriveWorldMap,
  config?: Partial<HomeDriveWorldProjectionConfig>,
): HomeDriveWorldProjectionConfig {
  return {
    ...HOME_DRIVE_WORLD_PROJECTION_CONFIG,
    visibleDistanceMeters:
      config?.visibleDistanceMeters ??
      map.gameplay.camera.visibleDistanceMeters ??
      HOME_DRIVE_WORLD_PROJECTION_CONFIG.visibleDistanceMeters,
    sideVisibilityMeters:
      config?.sideVisibilityMeters ??
      map.gameplay.camera.sideVisibilityMeters ??
      HOME_DRIVE_WORLD_PROJECTION_CONFIG.sideVisibilityMeters,
    behindVisibilityMeters:
      config?.behindVisibilityMeters ??
      HOME_DRIVE_WORLD_PROJECTION_CONFIG.behindVisibilityMeters,
    minBottomPercent:
      config?.minBottomPercent ??
      HOME_DRIVE_WORLD_PROJECTION_CONFIG.minBottomPercent,
    maxBottomPercent:
      config?.maxBottomPercent ??
      HOME_DRIVE_WORLD_PROJECTION_CONFIG.maxBottomPercent,
    minWidthPercent:
      config?.minWidthPercent ??
      HOME_DRIVE_WORLD_PROJECTION_CONFIG.minWidthPercent,
    maxWidthPercent:
      config?.maxWidthPercent ??
      HOME_DRIVE_WORLD_PROJECTION_CONFIG.maxWidthPercent,
    maxRoads:
      config?.maxRoads ??
      HOME_DRIVE_WORLD_PROJECTION_CONFIG.maxRoads,
  };
}

function getSegmentMidpoint(
  start: HomeDriveWorldPoint,
  end: HomeDriveWorldPoint,
): HomeDriveWorldPoint {
  return {
    x: (start.x + end.x) * 0.5,
    y: (start.y + end.y) * 0.5,
  };
}

function resolveProjectedSide(
  angleDeg: number,
  forwardMeters: number,
): HomeDriveProjectedWorldRoadSide {
  if (forwardMeters < -6) {
    return "behind";
  }

  const turnSide = getHomeDriveTurnSideFromAngle(angleDeg);

  if (turnSide === "left") {
    return "left";
  }

  if (turnSide === "right") {
    return "right";
  }

  if (turnSide === "behind") {
    return "behind";
  }

  return "front";
}

function canProjectSegment(
  localMidpoint: Readonly<{ rightMeters: number; forwardMeters: number }>,
  config: HomeDriveWorldProjectionConfig,
): boolean {
  const forward = localMidpoint.forwardMeters;
  const right = Math.abs(localMidpoint.rightMeters);

  if (forward < -config.behindVisibilityMeters) {
    return false;
  }

  if (forward > config.visibleDistanceMeters) {
    return false;
  }

  /*
    Quanto mais distante, menos lateral aparece.
    Isso evita faixas atravessando o céu inteiro.
  */
  const forwardRatio = clampHomeDriveWorldNumber(
    Math.max(0, forward) / config.visibleDistanceMeters,
    0,
    1,
  );
  const sideLimit =
    config.sideVisibilityMeters * lerpHomeDriveWorldNumber(1.1, 0.56, forwardRatio);

  return right <= sideLimit;
}

function getKindWidthBoost(road: HomeDriveWorldRoad): number {
  if (road.kind === "avenue" || road.kind === "coastal") {
    return 1.16;
  }

  if (road.kind === "ring") {
    return 1.08;
  }

  if (road.kind === "service" || road.kind === "alley") {
    return 0.7;
  }

  return 0.92;
}

function getKindHeightBoost(road: HomeDriveWorldRoad): number {
  if (road.kind === "avenue" || road.kind === "coastal") {
    return 1.04;
  }

  if (road.kind === "ring") {
    return 0.82;
  }

  if (road.kind === "service" || road.kind === "alley") {
    return 0.62;
  }

  return 0.86;
}

function projectSegmentToScreen({
  road,
  segmentIndex,
  segmentStart,
  segmentEnd,
  car,
  config,
}: Readonly<{
  road: HomeDriveWorldRoad;
  segmentIndex: number;
  segmentStart: HomeDriveWorldPoint;
  segmentEnd: HomeDriveWorldPoint;
  car: HomeDriveWorldCarState;
  config: HomeDriveWorldProjectionConfig;
}>): HomeDriveProjectedWorldRoad | undefined {
  const midpoint = getSegmentMidpoint(segmentStart, segmentEnd);
  const localMidpoint = getHomeDrivePointLocalToHeading(
    midpoint,
    car,
    car.headingDeg,
  );

  if (!canProjectSegment(localMidpoint, config)) {
    return undefined;
  }

  const localStart = getHomeDrivePointLocalToHeading(
    segmentStart,
    car,
    car.headingDeg,
  );
  const localEnd = getHomeDrivePointLocalToHeading(
    segmentEnd,
    car,
    car.headingDeg,
  );

  /*
    Ângulo do segmento no espaço da câmera.
    0 = mesma direção do carro.
    positivo = tende para direita.
    negativo = tende para esquerda.
  */
  const localSegmentAngleDeg =
    (Math.atan2(
      localEnd.rightMeters - localStart.rightMeters,
      localEnd.forwardMeters - localStart.forwardMeters,
    ) *
      180) /
    Math.PI;

  const angleDeg = getShortestHomeDriveAngleDeg(0, localSegmentAngleDeg);
  const forwardMeters = Math.max(0, localMidpoint.forwardMeters);
  const distanceMeters = getHomeDrivePointDistance(car, midpoint);

  /*
    closeness:
    0 = longe/horizonte.
    1 = perto/cockpit.
  */
  const forwardRatio = clampHomeDriveWorldNumber(
    forwardMeters / config.visibleDistanceMeters,
    0,
    1,
  );
  const closeness = smoothstepHomeDriveWorld(1 - forwardRatio);

  const side = resolveProjectedSide(angleDeg, localMidpoint.forwardMeters);

  const lateralCapacity =
    config.sideVisibilityMeters * lerpHomeDriveWorldNumber(0.72, 1.38, closeness);
  const sideRatio = clampHomeDriveWorldNumber(
    localMidpoint.rightMeters / Math.max(1, lateralCapacity),
    -1,
    1,
  );

  const screenXPercent = clampHomeDriveWorldNumber(
    50 + sideRatio * lerpHomeDriveWorldNumber(28, 46, closeness) - car.steering * 3,
    -8,
    108,
  );

  /*
    Correção principal:
    - longe: bottom alto, perto do horizonte;
    - perto: bottom baixo, grudado no chão.
  */
  const bottomPercent = lerpHomeDriveWorldNumber(
    config.maxBottomPercent,
    config.minBottomPercent,
    closeness,
  );

  const widthPercent =
    lerpHomeDriveWorldNumber(
      config.minWidthPercent,
      config.maxWidthPercent,
      closeness,
    ) * getKindWidthBoost(road);

  const heightPercent =
    lerpHomeDriveWorldNumber(1.2, 10.5, closeness) * getKindHeightBoost(road);

  const opacity = lerpHomeDriveWorldNumber(0.08, 0.78, closeness);

  return {
    id: `${road.id}:${segmentIndex}`,
    roadId: road.id,
    roadLabel: road.label,
    kind: road.kind,
    roadTone: road.roadTone,
    side,
    distanceMeters,
    angleDeg,
    screenXPercent,
    bottomPercent,
    widthPercent: clampHomeDriveWorldNumber(widthPercent, 4, 72),
    heightPercent: clampHomeDriveWorldNumber(heightPercent, 1, 14),
    opacity: side === "behind" ? opacity * 0.28 : opacity,
    scale: lerpHomeDriveWorldNumber(0.55, 1.08, closeness),
    blurPx: lerpHomeDriveWorldNumber(1.6, 0, closeness),
    skewDeg:
      side === "left"
        ? lerpHomeDriveWorldNumber(-18, -7, closeness)
        : side === "right"
          ? lerpHomeDriveWorldNumber(18, 7, closeness)
          : clampHomeDriveWorldNumber(angleDeg * 0.08, -10, 10),
    rotateDeg: clampHomeDriveWorldNumber(angleDeg * 0.16, -20, 20),
    zIndex: Math.round(2 + closeness * 18),
    isIntersectionCandidate:
      side === "left" ||
      side === "right" ||
      Math.abs(angleDeg) > 24,
  };
}

export function projectHomeDriveWorldRoads({
  map,
  car,
  config,
}: ProjectHomeDriveWorldParams): HomeDriveWorldProjectionResult {
  const resolvedConfig = resolveProjectionConfig(map, config);
  const projectedRoads: HomeDriveProjectedWorldRoad[] = [];

  for (const road of map.roads) {
    if (road.points.length < 2) {
      continue;
    }

    for (let index = 1; index < road.points.length; index += 1) {
      const projected = projectSegmentToScreen({
        road,
        segmentIndex: index - 1,
        segmentStart: road.points[index - 1],
        segmentEnd: road.points[index],
        car,
        config: resolvedConfig,
      });

      if (projected) {
        projectedRoads.push(projected);
      }
    }
  }

  const sortedProjectedRoads = projectedRoads
    .sort((a, b) => {
      if (a.zIndex !== b.zIndex) {
        return a.zIndex - b.zIndex;
      }

      return b.distanceMeters - a.distanceMeters;
    })
    .slice(0, resolvedConfig.maxRoads);

  const nearestRoad = findNearestHomeDriveWorldRoad(map, car, car.headingDeg);
  const currentRoad = nearestRoad?.road;
  const currentDistrict = getHomeDriveWorldDistrictById(
    map,
    currentRoad?.districtId ?? car.currentDistrictId,
  );
  const intersectionsAhead = getHomeDriveIntersectionsAhead(map, car, {
    radiusMeters: map.gameplay.intersectionRadiusMeters,
    currentRoadId: currentRoad?.id ?? car.currentRoadId,
  });

  return {
    projectedRoads: sortedProjectedRoads,
    nearestRoad,
    currentRoad,
    currentDistrict,
    intersectionsAhead,
  };
}
