// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianPerformance.ts

export type HomeDrivePedestrianPerformanceProfileKey =
  | "portrait"
  | "landscape";

export type HomeDrivePedestrianPerformanceProfile = Readonly<{
  maxPedestrians: number;
  density: number;
  maxRoads: number;
  minRoadLengthMeters: number;

  /**
   * Raio lógico máximo pedido pela cena.
   *
   * Observação: a visibilidade agora usa hard-culling acima de
   * `mediumDetailRadiusMeters`, então `visibleRadiusMeters` fica como
   * margem de consulta/compatibilidade, mas o corte visual real acontece
   * em `mediumDetailRadiusMeters`.
   */
  visibleRadiusMeters: number;
  maxVisiblePedestrians: number;

  /**
   * 0..fullDetailRadiusMeters: pedestre completo.
   * fullDetailRadiusMeters..mediumDetailRadiusMeters: pedestre médio.
   * acima de mediumDetailRadiusMeters: não renderiza nada.
   */
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
 * Cidade cheia no domínio, mas com render visual agressivamente cortado.
 *
 * A população lógica continua alta para evitar calçadas vazias e manter
 * streaming/crosswalk demand. O custo visual cai porque pedestres acima de
 * `mediumDetailRadiusMeters` deixam de existir no render, em vez de virarem
 * proxy preto/instância distante.
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

    visibleRadiusMeters: 260,
    maxVisiblePedestrians: 260,

    fullDetailRadiusMeters: 84,
    mediumDetailRadiusMeters: 190,

    snapshotHz: 6,
    simulationHz: 5,

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
    maxSpawnPerRefresh: 125,

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

    visibleRadiusMeters: 340,
    maxVisiblePedestrians: 360,

    fullDetailRadiusMeters: 112,
    mediumDetailRadiusMeters: 250,

    snapshotHz: 7,
    simulationHz: 5,

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
    maxSpawnPerRefresh: 180,

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
