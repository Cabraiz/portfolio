// src/pages/Mateus/Home/components/mobile/game/driving/boot/homeDriveBootAssets.ts

import {
  createInitialHomeDriveBuildingCollisionState,
} from "../domain/buildingCollisions";
import {
  createInitialHomeDriveCrosswalkState,
} from "../domain/crosswalks";
import { getHomeDriveBuildings } from "../domain/homeDrive.buildings";
import {
  HOME_DRIVE_WORLD_BUILDINGS_ON,
  HOME_DRIVE_WORLD_CARS_ON,
  HOME_DRIVE_WORLD_PEDESTRIANS_ON,
} from "../domain/homeDrive.globalDebugFlags";
import { createInitialHomeDriveTrafficState } from "../domain/homeDrive.traffic";
import {
  createHomeDriveRuntimeProfilerState,
} from "../domain/diagnostics";
import {
  createInitialHomeDriveParkedVehicleState,
} from "../domain/parkedVehicles";
import {
  createInitialHomeDrivePedestrianState,
  preloadHomeDrivePedestrianBootRuntime,
} from "../domain/pedestrians";
import {
  getHomeDrivePedestrianPerformanceProfile,
} from "../domain/pedestrians/homeDrive.pedestrianPerformance";
import {
  createHomeDriveUrbanStreetLights,
  createInitialHomeDriveUrbanFixtureCollisionState,
} from "../domain/urbanFixtures";
import { prewarmHomeDriveThreePedestrianAnimationBakeCache } from "../three/pedestrians";
import {
  CROSSWALK_DENSITY_LANDSCAPE,
  CROSSWALK_DENSITY_PORTRAIT,
  CROSSWALK_GENERATION_SEED,
  CROSSWALK_MAX_CROSSWALKS_LANDSCAPE,
  CROSSWALK_MAX_CROSSWALKS_PORTRAIT,
  CROSSWALK_MIN_ROAD_LENGTH_METERS,
  HOME_DRIVE_THREE_PEDESTRIAN_SCENE_DEBUG,
  PARKED_DENSITY_LANDSCAPE,
  PARKED_DENSITY_PORTRAIT,
  PARKED_GENERATION_SEED,
  PARKED_MAX_ROADS_LANDSCAPE,
  PARKED_MAX_ROADS_PORTRAIT,
  PARKED_MAX_VEHICLES_LANDSCAPE,
  PARKED_MAX_VEHICLES_PORTRAIT,
  PARKED_MIN_ROAD_LENGTH_METERS,
  PEDESTRIAN_GENERATION_SEED,
  TRAFFIC_DENSITY_LANDSCAPE,
  TRAFFIC_DENSITY_PORTRAIT,
  TRAFFIC_MAX_VEHICLES_LANDSCAPE,
  TRAFFIC_MAX_VEHICLES_PORTRAIT,
  TRAFFIC_MIN_ROAD_LENGTH_METERS,
  URBAN_FIXTURES_MAX_STREET_LIGHTS_TOTAL,
  URBAN_FIXTURES_MIN_ROAD_LENGTH_METERS,
  URBAN_FIXTURES_STREET_LIGHT_DENSITY,
  URBAN_FIXTURES_STREET_LIGHT_SEED,
} from "./homeDriveBootConfig";
import type {
	HomeDriveBootAssets,
	HomeDriveBootCreateOptions,
} from "./homeDriveBootAssets.types";
import {
	createViewportKey,
	createProgressReporter,
	waitForBrowserPaint,
	getDriveImageSources,
	getDriveAudioSources,
} from "./homeDriveBootAssets.utils";
import {
	preloadSources,
	getAssetPreloadSummary,
} from "./homeDriveBootAssets.preload";

export async function createHomeDriveBootAssets({
  viewport,
  runtime,
  onProgress,
}: HomeDriveBootCreateOptions): Promise<HomeDriveBootAssets> {
  const report = createProgressReporter(onProgress);
  const isPortrait = viewport.isPortrait;
  const viewportKey = createViewportKey(isPortrait);

  report("images", "Carregando imagens", "Cockpit, volante e imagens de missão.", 2, 0, 0);
  await waitForBrowserPaint();

  const imageSources = getDriveImageSources();
  let loadedImages = 0;
  const imageResults = await preloadSources(imageSources, "image", (_source) => {
    loadedImages += 1;
    const progress = 2 + (loadedImages / Math.max(1, imageSources.length)) * 16;

    report(
      "images",
      "Carregando imagens",
      "Imagens preparadas.",
      progress,
      loadedImages,
      imageSources.length,
    );
  });

  report(
    "images",
    "Imagens preparadas",
    getAssetPreloadSummary(imageResults),
    18,
    loadedImages,
    imageSources.length,
  );

  report("audio", "Carregando sons", "Motor e camadas de aceleração.", 20, 0, 0);
  await waitForBrowserPaint();

  const audioSources = getDriveAudioSources();
  let loadedAudios = 0;
  const audioResults = await preloadSources(audioSources, "audio", (_source) => {
    loadedAudios += 1;
    const progress = 20 + (loadedAudios / Math.max(1, audioSources.length)) * 12;

    report(
      "audio",
      "Carregando sons",
      "Sons preparados.",
      progress,
      loadedAudios,
      audioSources.length,
    );
  });

  report(
    "audio",
    "Sons preparados",
    getAssetPreloadSummary(audioResults),
    32,
    loadedAudios,
    audioSources.length,
  );

  report("buildings", "Montando prédios", "Gerando a cidade antes do primeiro frame.", 34, 0, 1);
  await waitForBrowserPaint();

  const buildings = HOME_DRIVE_WORLD_BUILDINGS_ON ? getHomeDriveBuildings() : [];

  report(
    "buildings",
    "Montando prédios",
    "Cidade montada.",
    48,
    buildings.length,
    buildings.length,
  );
  await waitForBrowserPaint();

  report("cars", "Preparando carros", "Tráfego dinâmico e carros estacionados.", 52, 0, 2);
  await waitForBrowserPaint();

  const trafficState = HOME_DRIVE_WORLD_CARS_ON
    ? createInitialHomeDriveTrafficState({
        maxVehicles: isPortrait
          ? TRAFFIC_MAX_VEHICLES_PORTRAIT
          : TRAFFIC_MAX_VEHICLES_LANDSCAPE,
        density: isPortrait ? TRAFFIC_DENSITY_PORTRAIT : TRAFFIC_DENSITY_LANDSCAPE,
        minRoadLengthMeters: TRAFFIC_MIN_ROAD_LENGTH_METERS,
      })
    : {
        vehicles: [],
        elapsedSeconds: 0,
        lastCollisionAt: -999,
      };

  const parkedVehicleState = HOME_DRIVE_WORLD_CARS_ON
    ? createInitialHomeDriveParkedVehicleState({
        maxVehicles: isPortrait
          ? PARKED_MAX_VEHICLES_PORTRAIT
          : PARKED_MAX_VEHICLES_LANDSCAPE,
        density: isPortrait ? PARKED_DENSITY_PORTRAIT : PARKED_DENSITY_LANDSCAPE,
        maxRoads: isPortrait ? PARKED_MAX_ROADS_PORTRAIT : PARKED_MAX_ROADS_LANDSCAPE,
        minRoadLengthMeters: PARKED_MIN_ROAD_LENGTH_METERS,
        seed: PARKED_GENERATION_SEED,
      })
    : {
        vehicles: [],
        seed: PARKED_GENERATION_SEED,
      };

  report(
    "cars",
    "Preparando carros",
    "Trânsito pronto.",
    66,
    trafficState.vehicles.length + parkedVehicleState.vehicles.length,
    trafficState.vehicles.length + parkedVehicleState.vehicles.length,
  );
  await waitForBrowserPaint();

  report("city-fixtures", "Preparando cidade", "Faixas, semáforos, postes e colisões.", 68, 0, 3);
  await waitForBrowserPaint();

  const buildingCollisionState = createInitialHomeDriveBuildingCollisionState();
  const urbanFixtureCollisionState = createInitialHomeDriveUrbanFixtureCollisionState();
  const crosswalkState = createInitialHomeDriveCrosswalkState({
    maxCrosswalks: isPortrait
      ? CROSSWALK_MAX_CROSSWALKS_PORTRAIT
      : CROSSWALK_MAX_CROSSWALKS_LANDSCAPE,
    density: isPortrait ? CROSSWALK_DENSITY_PORTRAIT : CROSSWALK_DENSITY_LANDSCAPE,
    minRoadLengthMeters: CROSSWALK_MIN_ROAD_LENGTH_METERS,
    seed: CROSSWALK_GENERATION_SEED,
  });
  const urbanStreetLights = createHomeDriveUrbanStreetLights({
    density: URBAN_FIXTURES_STREET_LIGHT_DENSITY,
    maxLights: URBAN_FIXTURES_MAX_STREET_LIGHTS_TOTAL,
    minRoadLengthMeters: URBAN_FIXTURES_MIN_ROAD_LENGTH_METERS,
    seed: URBAN_FIXTURES_STREET_LIGHT_SEED,
  });

  report(
    "city-fixtures",
    "Preparando cidade",
    "Ruas prontas.",
    76,
    crosswalkState.crosswalks.length + urbanStreetLights.length,
    crosswalkState.crosswalks.length + urbanStreetLights.length,
  );
  await waitForBrowserPaint();

  report("pedestrians", "Preparando pessoas", "Animações, população e resident pool.", 78, 0, 1);
  await waitForBrowserPaint();

  const pedestrianPerformance = getHomeDrivePedestrianPerformanceProfile(isPortrait);
  const animationBakePrewarm = prewarmHomeDriveThreePedestrianAnimationBakeCache();

  const basePedestrians = HOME_DRIVE_WORLD_PEDESTRIANS_ON
    ? createInitialHomeDrivePedestrianState({
        density: pedestrianPerformance.density,
        maxRoads: pedestrianPerformance.maxRoads,
        minRoadLengthMeters: pedestrianPerformance.minRoadLengthMeters,
        seed: PEDESTRIAN_GENERATION_SEED,
        initialFocusCenter: runtime.car.position,
      })
    : createInitialHomeDrivePedestrianState({
        density: 0,
        maxRoads: 0,
        minRoadLengthMeters: Number.POSITIVE_INFINITY,
        seed: PEDESTRIAN_GENERATION_SEED,
        initialFocusCenter: runtime.car.position,
      });

  const pedestriansState = HOME_DRIVE_WORLD_PEDESTRIANS_ON
    ? preloadHomeDrivePedestrianBootRuntime(basePedestrians, {
        enabled: pedestrianPerformance.pedestrianBootPreloadEnabled,
        activeCenter: runtime.car.position,
        activeHeadingRad: runtime.car.headingRad,
        activeSpeedMps: runtime.car.speedMps,
        seed: PEDESTRIAN_GENERATION_SEED,
        profile: pedestrianPerformance,
        steps: pedestrianPerformance.pedestrianBootPreloadSteps,
        stepSeconds: pedestrianPerformance.pedestrianBootPreloadStepSeconds,
        bakeLibraryClipCount: animationBakePrewarm.clipCount,
        bakeLibrarySampleCount: animationBakePrewarm.sampleCount,
        debug: HOME_DRIVE_THREE_PEDESTRIAN_SCENE_DEBUG,
      }).pedestrians
    : basePedestrians;

  report(
    "pedestrians",
    "Preparando pessoas",
    "Pessoas prontas.",
    94,
    pedestriansState.agents.length,
    pedestriansState.agents.length,
  );
  await waitForBrowserPaint();

  const runtimeProfilerState = createHomeDriveRuntimeProfilerState();

  report("finalizing", "Finalizando dados", "Cidade, carros e pessoas prontos para instanciar.", 96, 1, 1);
  await waitForBrowserPaint();

  const assets: HomeDriveBootAssets = {
    viewportKey,
    buildings,
    trafficState,
    parkedVehicleState,
    buildingCollisionState,
    urbanFixtureCollisionState,
    crosswalkState,
    urbanStreetLights,
    pedestriansState,
    pedestrianPerformance,
    runtimeProfilerState,
    diagnostics: {
      imageResults,
      audioResults,
      buildingCount: buildings.length,
      movingVehicleCount: trafficState.vehicles.length,
      parkedVehicleCount: parkedVehicleState.vehicles.length,
      pedestrianAgentCount: pedestriansState.agents.length,
      pedestrianZoneCount: pedestriansState.zones.length,
      crosswalkCount: crosswalkState.crosswalks.length,
      streetLightCount: urbanStreetLights.length,
      bakeClipCount: animationBakePrewarm.clipCount,
      bakeSampleCount: animationBakePrewarm.sampleCount,
    },
  };

  report("ready", "Dados prontos", "Instanciando primeiro frame do mundo.", 98, 1, 1);

  return assets;
}

export type {
  HomeDriveBootAssetLoadResult,
  HomeDriveBootAssets,
  HomeDriveBootCreateOptions,
  HomeDriveBootPhase,
  HomeDriveBootProgressSnapshot,
} from "./homeDriveBootAssets.types";


