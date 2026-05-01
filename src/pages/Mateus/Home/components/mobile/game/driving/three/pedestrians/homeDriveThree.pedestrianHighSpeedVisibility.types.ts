// src/pages/Mateus/Home/components/mobile/game/driving/three/pedestrians/homeDriveThree.pedestrianHighSpeedVisibility.types.ts

export type HomeDriveThreePedestrianHighSpeedVisibilityConfig = Readonly<{
  enabled?: boolean;
  activeSpeedMps?: number;

  visibleRadiusMeters: number;
  mediumDetailRadiusMeters: number;
  maxVisiblePedestrians: number;

  leadSeconds?: number;
  radiusCapMeters?: number;
  coneRadians?: number;
  extraEntryRatio?: number;
  frontEmergencyStealDistanceMeters?: number;
  stagingLeadSeconds?: number;
}>;

export type HomeDriveThreePedestrianHighSpeedVisibilityPlan = Readonly<{
  enabled: boolean;
  isHighSpeed: boolean;
  speedMps: number;
  speedKmh: number;
  intensity: number;

  /** Raio total de consulta visual usado pelo culling. */
  visualQueryRadiusMeters: number;

  /** Raio extra só para o cone frontal de prewarm visual instanciado. */
  frontPrewarmRadiusMeters: number;

  /** Abertura total do cone frontal em radianos. */
  frontPrewarmConeRadians: number;

  /** Limite final de entries visíveis, já com reserva extra de alta velocidade. */
  maxVisualPrewarmPedestrians: number;

  /** Staging recomendado para o pool visual. */
  stagingLeadSeconds: number;
}>;
