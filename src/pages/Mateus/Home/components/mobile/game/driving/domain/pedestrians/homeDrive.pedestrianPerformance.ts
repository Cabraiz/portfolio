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
   * Observação:
   * a visibilidade usa hard-culling acima de `mediumDetailRadiusMeters`.
   * O `visibleRadiusMeters` fica como margem de consulta/compatibilidade,
   * mas o corte visual real acontece no raio médio.
   */
  visibleRadiusMeters: number;
  maxVisiblePedestrians: number;

  /**
   * Render avançado.
   *
   * Mantém população visual alta, mas limita quantos pedestres viram árvore
   * React completa. O restante é desenhado por rig instanciado com pose
   * bakeada e variação individual.
   */
  enableInstancedRig: boolean;
  enableBakedAnimation: boolean;
  maxFullReactPedestrians: number;
  maxMediumReactPedestrians: number;
  maxInstancedPedestrians: number;
  bakedAnimationSamples: number;
  instancedAnimationHzNear: number;
  instancedAnimationHzFar: number;
  instancedMatrixUpdateStride: number;
  instancedMaxUpdatesPerFrame: number;

  /** Pool visual residente: slots prontos são reciclados/teleportados em vez de recriados. */
  pedestrianVisualPoolSize: number;
  pedestrianVisualPoolRetainSeconds: number;
  pedestrianVisualPoolNormalRetainSeconds: number;
  pedestrianVisualPoolFastRetainSeconds: number;
  pedestrianVisualPoolRecycleBehindMeters: number;
  pedestrianVisualPoolFrontEmergencySpeedMps: number;
  pedestrianVisualPoolFrontEmergencyStealDistanceMeters: number;
  pedestrianVisualPoolFrontEmergencyReserveRatio: number;
  pedestrianVisualPoolMaxEmergencyStealsPerFrame: number;
  pedestrianVisualPoolStagingSize: number;
  pedestrianVisualPoolVisibleTeleportBlockMeters: number;
  pedestrianVisualPoolVisibleTeleportConeRadians: number;
  pedestrianVisualPoolStagingLeadSeconds: number;
  pedestrianVisualPoolMaxStagingUpdatesPerFrame: number;
  pedestrianVisualPoolMaxVisibleStealsPerFrame: number;
  pedestrianVisualPoolAllowVisibleTeleport: boolean;
  pedestrianVisualPoolAllowStagingReplacement: boolean;
  pedestrianVisualPoolStagingReplacementMinScoreDelta: number;
  pedestrianRenderEnterRadiusMeters: number;
  pedestrianRenderExitRadiusMeters: number;

  /** Visual prewarm frontal em alta velocidade: só aumenta instancing/staging, não React full. */
  pedestrianHighSpeedVisualPrewarmEnabled: boolean;
  pedestrianHighSpeedVisualLeadSeconds: number;
  pedestrianHighSpeedVisualRadiusCapMeters: number;
  pedestrianHighSpeedVisualConeRadians: number;
  pedestrianHighSpeedExtraEntryRatio: number;

  /** Prewarm: prepara pessoas antes de o carro chegar em alta velocidade. */
  pedestrianPrewarmEnabled: boolean;
  pedestrianPrewarmFrames: number;
  pedestrianPrewarmLeadSeconds: number;
  pedestrianPrewarmFrontMeters: number;
  pedestrianPrewarmMinReadyPedestrians: number;
  pedestrianPrewarmSpawnBudgetMultiplier: number;

  /**
   * Separação visual de render.
   *
   * Reduz sobreposição entre pedestres próximos sem alterar a posição lógica
   * do agente no domínio.
   */
  enablePedestrianRenderSeparation: boolean;
  pedestrianRenderSeparationCellSizeMeters: number;
  pedestrianRenderSeparationMinMeters: number;
  pedestrianRenderSeparationMaxOffsetMeters: number;

  /**
   * LOD visual.
   *
   * 0..fullDetailRadiusMeters:
   * pedestre completo.
   *
   * fullDetailRadiusMeters..mediumDetailRadiusMeters:
   * pedestre instanciado.
   *
   * acima de mediumDetailRadiusMeters:
   * não renderiza nada.
   *
   * Importante:
   * não existe mais loading visual de pedestre. Nada de pending preto,
   * silhouette preta, corpo meio hidratado, shadow de commit ou staging.
   * O pedestre distante deve simplesmente não existir visualmente até entrar
   * pronto no raio de render.
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

  /** Warm ring preditivo: prepara ruas antes de elas entrarem na câmera. */
  enablePedestrianWarmRing: boolean;
  pedestrianWarmRingBaseRadiusMeters: number;
  pedestrianWarmRingFrontBiasMeters: number;
  pedestrianWarmRingSpeedRadiusMultiplier: number;
  pedestrianWarmRingSideRadiusMeters: number;
  pedestrianWarmRingRearRadiusMeters: number;
  pedestrianWarmRingMaxZoneCount: number;
}>;

/**
 * Cidade cheia no domínio, mas com render visual controlado.
 *
 * A população lógica continua alta para evitar calçadas vazias e manter
 * streaming/crosswalk demand. O custo visual cai porque a maior parte dos
 * pedestres renderizados usa instanced rig.
 *
 * Importante:
 * o conceito de loading visual foi removido. Não existe corpo preto,
 * silhouette, shadow de carregamento, pending visível, staging visual ou pessoa
 * meio hidratada. O slot instanciado deve aparecer apenas quando já estiver
 * pronto com cor, matriz e pose final.
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

    visibleRadiusMeters: 380,
    maxVisiblePedestrians: 460,

    enableInstancedRig: true,
    enableBakedAnimation: true,
    maxFullReactPedestrians: 48,
    maxMediumReactPedestrians: 0,
    maxInstancedPedestrians: 460,
    bakedAnimationSamples: 32,
    instancedAnimationHzNear: 18,
    instancedAnimationHzFar: 10,
    instancedMatrixUpdateStride: 3,
    instancedMaxUpdatesPerFrame: 160,

    pedestrianVisualPoolSize: 660,
    pedestrianVisualPoolRetainSeconds: 0.72,
    pedestrianVisualPoolNormalRetainSeconds: 0.72,
    pedestrianVisualPoolFastRetainSeconds: 0.075,
    pedestrianVisualPoolRecycleBehindMeters: 130,
    pedestrianVisualPoolFrontEmergencySpeedMps: 9.5,
    pedestrianVisualPoolFrontEmergencyStealDistanceMeters: 760,
    pedestrianVisualPoolFrontEmergencyReserveRatio: 0.42,
    pedestrianVisualPoolMaxEmergencyStealsPerFrame: 88,
    pedestrianVisualPoolStagingSize: 260,
    pedestrianVisualPoolVisibleTeleportBlockMeters: 250,
    pedestrianVisualPoolVisibleTeleportConeRadians: 0.96,
    pedestrianVisualPoolStagingLeadSeconds: 8.8,
    pedestrianVisualPoolMaxStagingUpdatesPerFrame: 42,
    pedestrianVisualPoolMaxVisibleStealsPerFrame: 0,
    pedestrianVisualPoolAllowVisibleTeleport: false,
    pedestrianRenderEnterRadiusMeters: 300,
    pedestrianRenderExitRadiusMeters: 760,
    pedestrianVisualPoolAllowStagingReplacement: true,
    pedestrianVisualPoolStagingReplacementMinScoreDelta: 18,

    pedestrianHighSpeedVisualPrewarmEnabled: true,
    pedestrianHighSpeedVisualLeadSeconds: 10.5,
    pedestrianHighSpeedVisualRadiusCapMeters: 820,
    pedestrianHighSpeedVisualConeRadians: 0.98,
    pedestrianHighSpeedExtraEntryRatio: 0.38,

    pedestrianPrewarmEnabled: true,
    pedestrianPrewarmFrames: 12,
    pedestrianPrewarmLeadSeconds: 10.5,
    pedestrianPrewarmFrontMeters: 2200,
    pedestrianPrewarmMinReadyPedestrians: 620,
    pedestrianPrewarmSpawnBudgetMultiplier: 3.25,

    enablePedestrianRenderSeparation: true,
    pedestrianRenderSeparationCellSizeMeters: 1.35,
    pedestrianRenderSeparationMinMeters: 0.84,
    pedestrianRenderSeparationMaxOffsetMeters: 0.72,

    fullDetailRadiusMeters: 84,
    mediumDetailRadiusMeters: 300,

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
    repopulateDistanceMeters: 16,
    repopulateCooldownSeconds: 0.095,
    minPedestriansNearPlayer: 260,
    maxActivePedestrians: 1960,
    maxSpawnPerRefresh: 280,

    frontLookaheadMeters: 980,
    frontLookaheadSpeedMultiplier: 36,
    frontFarRadiusMeters: 920,
    sideRadiusMeters: 420,
    rearRadiusMeters: 180,
    minFrontPedestrians: 182,
    minFarFrontPedestrians: 146,
    minSideSectorPedestrians: 54,
    minRearBufferPedestrians: 18,
    minCrosswalkPedestrians: 42,
    crosswalkSearchRadiusMeters: 520,
    maxSpawnPerSectorRefresh: 112,
    maxCrosswalkSpawnPerRefresh: 58,

    enablePedestrianWarmRing: true,
    pedestrianWarmRingBaseRadiusMeters: 760,
    pedestrianWarmRingFrontBiasMeters: 900,
    pedestrianWarmRingSpeedRadiusMultiplier: 50,
    pedestrianWarmRingSideRadiusMeters: 520,
    pedestrianWarmRingRearRadiusMeters: 180,
    pedestrianWarmRingMaxZoneCount: 168,
  }),

  landscape: Object.freeze({
    maxPedestrians: 3200,
    density: 7.05,
    maxRoads: 420,
    minRoadLengthMeters: 16,

    visibleRadiusMeters: 520,
    maxVisiblePedestrians: 700,

    enableInstancedRig: true,
    enableBakedAnimation: true,
    maxFullReactPedestrians: 68,
    maxMediumReactPedestrians: 0,
    maxInstancedPedestrians: 700,
    bakedAnimationSamples: 32,
    instancedAnimationHzNear: 20,
    instancedAnimationHzFar: 10,
    instancedMatrixUpdateStride: 3,
    instancedMaxUpdatesPerFrame: 232,

    pedestrianVisualPoolSize: 980,
    pedestrianVisualPoolRetainSeconds: 0.68,
    pedestrianVisualPoolNormalRetainSeconds: 0.68,
    pedestrianVisualPoolFastRetainSeconds: 0.065,
    pedestrianVisualPoolRecycleBehindMeters: 165,
    pedestrianVisualPoolFrontEmergencySpeedMps: 9.5,
    pedestrianVisualPoolFrontEmergencyStealDistanceMeters: 980,
    pedestrianVisualPoolFrontEmergencyReserveRatio: 0.44,
    pedestrianVisualPoolMaxEmergencyStealsPerFrame: 124,
    pedestrianVisualPoolStagingSize: 360,
    pedestrianVisualPoolVisibleTeleportBlockMeters: 320,
    pedestrianVisualPoolVisibleTeleportConeRadians: 1.06,
    pedestrianVisualPoolStagingLeadSeconds: 9.4,
    pedestrianVisualPoolMaxStagingUpdatesPerFrame: 52,
    pedestrianVisualPoolMaxVisibleStealsPerFrame: 0,
    pedestrianVisualPoolAllowVisibleTeleport: false,
    pedestrianRenderEnterRadiusMeters: 420,
    pedestrianRenderExitRadiusMeters: 980,
    pedestrianVisualPoolAllowStagingReplacement: true,
    pedestrianVisualPoolStagingReplacementMinScoreDelta: 16,

    pedestrianHighSpeedVisualPrewarmEnabled: true,
    pedestrianHighSpeedVisualLeadSeconds: 11.5,
    pedestrianHighSpeedVisualRadiusCapMeters: 1080,
    pedestrianHighSpeedVisualConeRadians: 1.08,
    pedestrianHighSpeedExtraEntryRatio: 0.42,

    pedestrianPrewarmEnabled: true,
    pedestrianPrewarmFrames: 13,
    pedestrianPrewarmLeadSeconds: 11.5,
    pedestrianPrewarmFrontMeters: 2800,
    pedestrianPrewarmMinReadyPedestrians: 860,
    pedestrianPrewarmSpawnBudgetMultiplier: 3.35,

    enablePedestrianRenderSeparation: true,
    pedestrianRenderSeparationCellSizeMeters: 1.4,
    pedestrianRenderSeparationMinMeters: 0.86,
    pedestrianRenderSeparationMaxOffsetMeters: 0.76,

    fullDetailRadiusMeters: 112,
    mediumDetailRadiusMeters: 420,

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
    repopulateDistanceMeters: 18,
    repopulateCooldownSeconds: 0.08,
    minPedestriansNearPlayer: 410,
    maxActivePedestrians: 3150,
    maxSpawnPerRefresh: 410,

    frontLookaheadMeters: 1320,
    frontLookaheadSpeedMultiplier: 44,
    frontFarRadiusMeters: 1160,
    sideRadiusMeters: 580,
    rearRadiusMeters: 230,
    minFrontPedestrians: 278,
    minFarFrontPedestrians: 208,
    minSideSectorPedestrians: 84,
    minRearBufferPedestrians: 26,
    minCrosswalkPedestrians: 68,
    crosswalkSearchRadiusMeters: 720,
    maxSpawnPerSectorRefresh: 156,
    maxCrosswalkSpawnPerRefresh: 82,

    enablePedestrianWarmRing: true,
    pedestrianWarmRingBaseRadiusMeters: 1040,
    pedestrianWarmRingFrontBiasMeters: 1120,
    pedestrianWarmRingSpeedRadiusMultiplier: 58,
    pedestrianWarmRingSideRadiusMeters: 760,
    pedestrianWarmRingRearRadiusMeters: 240,
    pedestrianWarmRingMaxZoneCount: 236,
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
