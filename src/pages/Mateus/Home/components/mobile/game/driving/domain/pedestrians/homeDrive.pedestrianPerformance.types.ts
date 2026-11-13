// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianPerformance.types.ts

export type HomeDrivePedestrianPerformanceProfileKey =

  | "portrait"

  | "landscape";



export type HomeDrivePedestrianPerformanceProfile = Readonly<{

  pedestrianDebugLogPopulationPipeline: boolean;

  pedestrianBootPreloadEnabled: boolean;
  pedestrianBootPreloadSteps: number;
  pedestrianBootPreloadStepSeconds: number;



  pedestrianResidentPoolEnabled: boolean;

  pedestrianResidentPoolSize: number;

  pedestrianResidentPoolMinFrontAgents: number;

  pedestrianResidentPoolMinFarAgents: number;

  pedestrianResidentPoolTeleportMinForwardMeters: number;

  pedestrianResidentPoolTeleportMaxForwardMeters: number;

  pedestrianResidentPoolTeleportHorizonMaxForwardMeters: number;

  pedestrianResidentPoolRecycleBehindMeters: number;

  pedestrianResidentPoolRecycleSideMeters: number;

  pedestrianResidentPoolMaxTeleportsPerTick: number;

  pedestrianResidentPoolMaxInitialTeleports: number;

  pedestrianResidentPoolProtectVisibleConeMeters: number;

  pedestrianResidentPoolProtectVisibleConeRadians: number;

  pedestrianResidentPoolDebug: boolean;
  pedestrianResidentPoolLockAfterBoot: boolean;
  pedestrianResidentPoolAllowRuntimeExpansion: boolean;



  pedestrianResidentPoolViewportOccupancyEnabled: boolean;

  pedestrianResidentPoolForceAllAgentsIntoViewport: boolean;

  pedestrianResidentPoolVisibleNearMinMeters: number;

  pedestrianResidentPoolVisibleNearMaxMeters: number;

  pedestrianResidentPoolVisibleNearCount: number;

  pedestrianResidentPoolVisibleMidMinMeters: number;

  pedestrianResidentPoolVisibleMidMaxMeters: number;

  pedestrianResidentPoolVisibleMidCount: number;

  pedestrianResidentPoolVisibleFarMinMeters: number;

  pedestrianResidentPoolVisibleFarMaxMeters: number;

  pedestrianResidentPoolVisibleFarCount: number;

  pedestrianResidentPoolSideMinForwardMeters: number;

  pedestrianResidentPoolSideMaxForwardMeters: number;

  pedestrianResidentPoolSideLateralMinMeters: number;

  pedestrianResidentPoolSideLateralMaxMeters: number;

  pedestrianResidentPoolSideCount: number;

  pedestrianResidentPoolMaxViewportTeleportsPerTick: number;

  pedestrianResidentPoolViewportMinSpacingMeters: number;



  density: number;

  maxRoads: number;

  minRoadLengthMeters: number;



  visibleRadiusMeters: number;

  maxVisiblePedestrians: number;

  fullDetailRadiusMeters: number;



  /**

   * Mantido por compatibilidade com o caller antigo.

   *

   * Não existe mais faixa visual medium/instanced. O valor fica igual ao raio

   * full/visible para não reintroduzir pedestre simplificado de longe.

   */

  mediumDetailRadiusMeters: number;



  snapshotHz: number;



  /**

   * Campos legados mantidos para compatibilidade com HomeDriveThreeScene.

   *

   * Todos ficam desativados. A aplicação não usa mais rig instanciado,

   * silhouette, placeholder escuro, pessoa cinza/preta ou LOD visual distante.

   */

  enableInstancedRig: boolean;

  enableBakedAnimation: boolean;

  maxFullReactPedestrians: number;

  maxMediumReactPedestrians: number;

  maxInstancedPedestrians: number;

  instancedAnimationHzNear: number;

  instancedAnimationHzFar: number;

  instancedMatrixUpdateStride: number;

  instancedMaxUpdatesPerFrame: number;



  enablePedestrianRenderSeparation: boolean;

  pedestrianRenderSeparationCellSizeMeters: number;

  pedestrianRenderSeparationMinMeters: number;

  pedestrianRenderSeparationMaxOffsetMeters: number;



  simulationHz: number;

  activeSimulationRadiusMeters: number;

  warmSimulationRadiusMeters: number;

  warmTickModulo: number;

  coldTickModulo: number;



  populateRadiusMeters: number;

}>;
