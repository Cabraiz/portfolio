// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianPerformance.ts

export type HomeDrivePedestrianPerformanceProfileKey =
  | "portrait"
  | "landscape";

export type HomeDrivePedestrianPerformanceProfile = Readonly<{
  maxPedestrians: number;
  density: number;
  maxRoads: number;
  minRoadLengthMeters: number;

  visibleRadiusMeters: number;
  maxVisiblePedestrians: number;

  fullDetailRadiusMeters: number;
  mediumDetailRadiusMeters: number;

  snapshotHz: number;
  simulationHz: number;

  activeSimulationRadiusMeters: number;
  warmSimulationRadiusMeters: number;
  warmTickModulo: number;
  coldTickModulo: number;

  /** Garante calçadas vivas logo ao iniciar o jogo perto do carro/spawn. */
  initialFocusRadiusMeters: number;
  initialFocusPedestrianRatio: number;
  maxInitialFocusPedestrians: number;

  /** Controle de aglomeração em esquinas e células de distribuição. */
  cornerExclusionMeters: number;
  maxCornerPedestrianRatio: number;
  minGroupDistanceMeters: number;
  maxAgentsPerDistributionCell: number;

  /** Streaming local: mantém civis nas próximas ruas enquanto o carro anda. */
  populateRadiusMeters: number;
  localZoneSearchRadiusMeters: number;
  keepAliveRadiusMeters: number;
  repopulateDistanceMeters: number;
  repopulateCooldownSeconds: number;
  minPedestriansNearPlayer: number;
  maxActivePedestrians: number;
  maxSpawnPerRefresh: number;

  /** Lookahead direcional para evitar calçadas vazias quando o player acelera. */
  frontLookaheadMeters: number;
  frontLookaheadSpeedMultiplier: number;
  frontFarRadiusMeters: number;
  sideRadiusMeters: number;
  rearRadiusMeters: number;
  minFrontPedestrians: number;
  minFarFrontPedestrians: number;
  minSideSectorPedestrians: number;
  minRearBufferPedestrians: number;
  minCrosswalkPedestrians: number;
  crosswalkSearchRadiusMeters: number;
  maxSpawnPerSectorRefresh: number;
  maxCrosswalkSpawnPerRefresh: number;
}>;

/**
 * Cidade cheia com controle espacial + streaming local.
 *
 * O início usa initialFocus*. Depois, a simulação usa populate* +
 * lookahead direcional para garantir civis à frente, nas laterais e próximos
 * das faixas de pedestre enquanto o carro avança rápido.
 */
export const HOME_DRIVE_PEDESTRIAN_PERFORMANCE: Readonly<
  Record<
    HomeDrivePedestrianPerformanceProfileKey,
    HomeDrivePedestrianPerformanceProfile
  >
> = Object.freeze({
  portrait: Object.freeze({
    maxPedestrians: 2100,
    density: 6.35,
    maxRoads: 280,
    minRoadLengthMeters: 18,

    visibleRadiusMeters: 620,
    maxVisiblePedestrians: 820,

    fullDetailRadiusMeters: 84,
    mediumDetailRadiusMeters: 240,

    snapshotHz: 8,
    simulationHz: 6,

    activeSimulationRadiusMeters: 178,
    warmSimulationRadiusMeters: 420,
    warmTickModulo: 4,
    coldTickModulo: 13,

    initialFocusRadiusMeters: 250,
    initialFocusPedestrianRatio: 0.48,
    maxInitialFocusPedestrians: 660,

    cornerExclusionMeters: 18,
    maxCornerPedestrianRatio: 0.12,
    minGroupDistanceMeters: 5.15,
    maxAgentsPerDistributionCell: 8,

    populateRadiusMeters: 430,
    localZoneSearchRadiusMeters: 620,
    keepAliveRadiusMeters: 1080,
    repopulateDistanceMeters: 42,
    repopulateCooldownSeconds: 0.55,
    minPedestriansNearPlayer: 145,
    maxActivePedestrians: 1780,
    maxSpawnPerRefresh: 165,

    frontLookaheadMeters: 560,
    frontLookaheadSpeedMultiplier: 13,
    frontFarRadiusMeters: 360,
    sideRadiusMeters: 340,
    rearRadiusMeters: 190,
    minFrontPedestrians: 96,
    minFarFrontPedestrians: 54,
    minSideSectorPedestrians: 46,
    minRearBufferPedestrians: 20,
    minCrosswalkPedestrians: 34,
    crosswalkSearchRadiusMeters: 430,
    maxSpawnPerSectorRefresh: 54,
    maxCrosswalkSpawnPerRefresh: 44,
  }),

  landscape: Object.freeze({
    maxPedestrians: 3200,
    density: 7.05,
    maxRoads: 420,
    minRoadLengthMeters: 16,

    visibleRadiusMeters: 820,
    maxVisiblePedestrians: 1280,

    fullDetailRadiusMeters: 118,
    mediumDetailRadiusMeters: 330,

    snapshotHz: 9,
    simulationHz: 6,

    activeSimulationRadiusMeters: 260,
    warmSimulationRadiusMeters: 620,
    warmTickModulo: 4,
    coldTickModulo: 12,

    initialFocusRadiusMeters: 330,
    initialFocusPedestrianRatio: 0.44,
    maxInitialFocusPedestrians: 1060,

    cornerExclusionMeters: 18,
    maxCornerPedestrianRatio: 0.12,
    minGroupDistanceMeters: 4.95,
    maxAgentsPerDistributionCell: 9,

    populateRadiusMeters: 620,
    localZoneSearchRadiusMeters: 860,
    keepAliveRadiusMeters: 1520,
    repopulateDistanceMeters: 52,
    repopulateCooldownSeconds: 0.48,
    minPedestriansNearPlayer: 230,
    maxActivePedestrians: 2850,
    maxSpawnPerRefresh: 245,

    frontLookaheadMeters: 760,
    frontLookaheadSpeedMultiplier: 15,
    frontFarRadiusMeters: 500,
    sideRadiusMeters: 460,
    rearRadiusMeters: 250,
    minFrontPedestrians: 152,
    minFarFrontPedestrians: 86,
    minSideSectorPedestrians: 72,
    minRearBufferPedestrians: 30,
    minCrosswalkPedestrians: 52,
    crosswalkSearchRadiusMeters: 590,
    maxSpawnPerSectorRefresh: 76,
    maxCrosswalkSpawnPerRefresh: 66,
  }),
});

export function getHomeDrivePedestrianPerformanceProfile(
  isPortrait: boolean,
): HomeDrivePedestrianPerformanceProfile {
  return isPortrait
    ? HOME_DRIVE_PEDESTRIAN_PERFORMANCE.portrait
    : HOME_DRIVE_PEDESTRIAN_PERFORMANCE.landscape;
}

export function getHomeDrivePedestrianSimulationStepSeconds(
  profile: HomeDrivePedestrianPerformanceProfile,
): number {
  return 1 / Math.max(1, profile.simulationHz);
}
