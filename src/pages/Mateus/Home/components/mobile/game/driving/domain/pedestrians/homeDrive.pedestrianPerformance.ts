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
}>;

export const HOME_DRIVE_PEDESTRIAN_PERFORMANCE: Readonly<
  Record<
    HomeDrivePedestrianPerformanceProfileKey,
    HomeDrivePedestrianPerformanceProfile
  >
> = Object.freeze({
  portrait: Object.freeze({
    maxPedestrians: 150,
    density: 0.9,
    maxRoads: 80,
    minRoadLengthMeters: 42,

    visibleRadiusMeters: 300,
    maxVisiblePedestrians: 86,

    fullDetailRadiusMeters: 82,
    mediumDetailRadiusMeters: 170,

    snapshotHz: 8,
    simulationHz: 6,

    activeSimulationRadiusMeters: 130,
    warmSimulationRadiusMeters: 260,
    warmTickModulo: 3,
    coldTickModulo: 10,
  }),

  landscape: Object.freeze({
    maxPedestrians: 220,
    density: 1.08,
    maxRoads: 118,
    minRoadLengthMeters: 38,

    visibleRadiusMeters: 390,
    maxVisiblePedestrians: 126,

    fullDetailRadiusMeters: 110,
    mediumDetailRadiusMeters: 230,

    snapshotHz: 9,
    simulationHz: 8,

    activeSimulationRadiusMeters: 175,
    warmSimulationRadiusMeters: 340,
    warmTickModulo: 3,
    coldTickModulo: 9,
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
