// src/pages/Mateus/Home/components/mobile/game/driving/boot/homeDriveBootAssets.ts

import { HOME_DRIVE_ENGINE_AUDIO_ASSETS } from "../audio/homeDrive.engineAudioAssets";
import {
  runHomeDriveEngineAudioPreflight,
} from "../audio/homeDrive.engineAudioPreflight";
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
import { getHomeDriveMissionDestinations } from "../domain/missions";
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
import { HOME_DRIVE_COCKPIT_ASSETS } from "../view/cockpit";
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
  HomeDriveBootAssetLoadResult,
  HomeDriveBootAssets,
  HomeDriveBootCreateOptions,
  HomeDriveBootPhase,
  HomeDriveBootProgressSnapshot,
} from "./homeDriveBootAssets.types";

/**
 * Preload não deve derrubar o Drive em rede fria/celular.
 * Antes o boot quebrava com 8,5–9s; isso era curto para imagens grandes,
 * áudio MP3 em cache frio e throttling do browser.
 *
 * Estes tempos são janelas de paciência do loading, não erro fatal.
 * Se passar disso, o asset fica marcado como `deferred-timeout` e o jogo
 * continua sem travar a pessoa na tela de erro.
 */
const IMAGE_PRELOAD_PATIENCE_MS = 60_000;
const AUDIO_PRELOAD_PATIENCE_MS = 90_000;
const AUDIO_HTTP_CACHE_PATIENCE_MS = 90_000;

function getNowMs(): number {
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return performance.now();
  }

  return Date.now();
}

function createViewportKey(isPortrait: boolean): string {
  return isPortrait ? "portrait" : "landscape";
}

function clampProgress(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Falha desconhecida no preload do Drive.";
}

function isAbortError(error: unknown): boolean {
  if (typeof DOMException !== "undefined" && error instanceof DOMException) {
    return error.name === "AbortError";
  }

  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name?: unknown }).name === "AbortError"
  );
}

function createProgressReporter(
  onProgress: HomeDriveBootCreateOptions["onProgress"],
): (
  phase: HomeDriveBootPhase,
  label: string,
  detail: string,
  progress: number,
  loaded: number,
  total: number,
  errorMessage?: string,
) => HomeDriveBootProgressSnapshot {
  const startedAtMs = getNowMs();

  return (phase, label, detail, progress, loaded, total, errorMessage) => {
    const updatedAtMs = getNowMs();
    const snapshot: HomeDriveBootProgressSnapshot = {
      phase,
      label,
      detail,
      progress: clampProgress(progress),
      loaded,
      total,
      startedAtMs,
      updatedAtMs,
      elapsedMs: Math.max(0, Math.round(updatedAtMs - startedAtMs)),
      errorMessage,
    };

    onProgress?.(snapshot);

    return snapshot;
  };
}

function waitForBrowserPaint(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    window.requestAnimationFrame(() => {
      window.setTimeout(resolve, 0);
    });
  });
}

function uniqueStrings(values: readonly string[]): readonly string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

function getDriveImageSources(): readonly string[] {
  const missionImages = getHomeDriveMissionDestinations()
    .map((destination) => destination.imageSrc)
    .filter((source): source is string => typeof source === "string");

  return uniqueStrings([
    HOME_DRIVE_COCKPIT_ASSETS.cockpitSrc,
    HOME_DRIVE_COCKPIT_ASSETS.steeringWheelSrc,
    ...missionImages,
  ]);
}

function getDriveAudioSources(): readonly string[] {
  return uniqueStrings(Object.values(HOME_DRIVE_ENGINE_AUDIO_ASSETS));
}

function createTimeout(timeoutMs: number, onTimeout: () => void): () => void {
  if (typeof window === "undefined") {
    const id = globalThis.setTimeout(onTimeout, timeoutMs);

    return () => {
      globalThis.clearTimeout(id);
    };
  }

  const id = window.setTimeout(onTimeout, timeoutMs);

  return () => {
    window.clearTimeout(id);
  };
}

function preloadImageSource(source: string): Promise<HomeDriveBootAssetLoadResult> {
  const startedAtMs = getNowMs();

  if (typeof Image === "undefined") {
    return Promise.resolve({
      source,
      ok: true,
      kind: "image",
      elapsedMs: 0,
      status: "skipped-server-runtime",
    });
  }

  return new Promise((resolve) => {
    const image = new Image();
    let settled = false;

    const cleanupTimeout = createTimeout(IMAGE_PRELOAD_PATIENCE_MS, () => {
      finish(
        true,
        "deferred-timeout",
        "Imagem demorou além da janela de boot e continuará como carregamento sob demanda.",
      );
    });

    const cleanup = () => {
      cleanupTimeout();
      image.onload = null;
      image.onerror = null;
    };

    const finish = async (ok: boolean, status: string, errorMessage?: string) => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();

      if (ok && status !== "deferred-timeout" && typeof image.decode === "function") {
        try {
          await image.decode();
        } catch {
          /*
            decode() pode falhar mesmo após load em alguns browsers.
            Se o arquivo já carregou, mantemos o preload como OK.
          */
        }
      }

      resolve({
        source,
        ok,
        kind: "image",
        elapsedMs: Math.round(getNowMs() - startedAtMs),
        status,
        errorMessage,
      });
    };

    image.decoding = "async";
    image.loading = "eager";
    image.onload = () => {
      void finish(true, "loaded");
    };
    image.onerror = () => {
      void finish(false, "error", `Não foi possível carregar imagem: ${source}`);
    };
    image.src = source;

    if (image.complete && image.naturalWidth > 0) {
      void finish(true, "cached");
    }
  });
}

function createAbortableTimeout(timeoutMs: number): {
  signal?: AbortSignal;
  cleanup: () => void;
} {
  if (typeof AbortController === "undefined" || timeoutMs <= 0) {
    return {
      signal: undefined,
      cleanup: () => undefined,
    };
  }

  const controller = new AbortController();
  const timeoutId = typeof window === "undefined"
    ? globalThis.setTimeout(() => controller.abort(), timeoutMs)
    : window.setTimeout(() => controller.abort(), timeoutMs);

  return {
    signal: controller.signal,
    cleanup: () => {
      if (typeof window === "undefined") {
        globalThis.clearTimeout(timeoutId);
      } else {
        window.clearTimeout(timeoutId);
      }
    },
  };
}

function createDeferredTimeoutResult(params: {
  source: string;
  kind: "image" | "audio";
  startedAtMs: number;
  status: string;
  errorMessage: string;
}): HomeDriveBootAssetLoadResult {
  return {
    source: params.source,
    ok: true,
    kind: params.kind,
    elapsedMs: Math.round(getNowMs() - params.startedAtMs),
    status: params.status,
    errorMessage: params.errorMessage,
  };
}

async function fetchAudioIntoHttpCache(
  source: string,
): Promise<HomeDriveBootAssetLoadResult> {
  const startedAtMs = getNowMs();

  if (typeof fetch !== "function") {
    return {
      source,
      ok: false,
      kind: "audio",
      elapsedMs: 0,
      status: "fetch-unavailable",
      errorMessage: "Fetch API indisponível para preload de áudio.",
    };
  }

  const timeout = createAbortableTimeout(AUDIO_HTTP_CACHE_PATIENCE_MS);

  try {
    const response = await fetch(source, {
      cache: "force-cache",
      credentials: "same-origin",
      signal: timeout.signal,
    });

    if (!response.ok) {
      return {
        source,
        ok: false,
        kind: "audio",
        elapsedMs: Math.round(getNowMs() - startedAtMs),
        status: `http-${response.status}`,
        errorMessage: `Áudio indisponível (${response.status}): ${source}`,
      };
    }

    const buffer = await response.arrayBuffer();

    return {
      source,
      ok: true,
      kind: "audio",
      elapsedMs: Math.round(getNowMs() - startedAtMs),
      status: "cached",
      bytes: buffer.byteLength,
    };
  } catch (error) {
    if (isAbortError(error)) {
      return createDeferredTimeoutResult({
        source,
        kind: "audio",
        startedAtMs,
        status: "deferred-timeout",
        errorMessage:
          "Áudio demorou além da janela de boot e continuará como carregamento sob demanda.",
      });
    }

    throw error;
  } finally {
    timeout.cleanup();
  }
}

function preloadAudioWithElement(
  source: string,
): Promise<HomeDriveBootAssetLoadResult> {
  const startedAtMs = getNowMs();

  if (typeof Audio === "undefined") {
    return Promise.resolve({
      source,
      ok: false,
      kind: "audio",
      elapsedMs: 0,
      status: "audio-element-unavailable",
      errorMessage: "HTMLAudioElement indisponível para preload de áudio.",
    });
  }

  return new Promise((resolve) => {
    const audio = new Audio();
    let settled = false;

    const cleanupTimeout = createTimeout(AUDIO_PRELOAD_PATIENCE_MS, () => {
      finish(
        true,
        "deferred-timeout",
        "Áudio demorou além da janela de boot e continuará como carregamento sob demanda.",
      );
    });

    const cleanup = () => {
      cleanupTimeout();
      audio.oncanplaythrough = null;
      audio.onerror = null;
      audio.onloadeddata = null;
    };

    const finish = (ok: boolean, status: string, errorMessage?: string) => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();

      resolve({
        source,
        ok,
        kind: "audio",
        elapsedMs: Math.round(getNowMs() - startedAtMs),
        status,
        errorMessage,
      });
    };

    audio.preload = "auto";
    audio.muted = true;
    audio.oncanplaythrough = () => finish(true, "canplaythrough");
    audio.onloadeddata = () => finish(true, "loadeddata");
    audio.onerror = () => {
      finish(false, "error", `Não foi possível carregar áudio: ${source}`);
    };
    audio.src = source;
    audio.load();
  });
}

async function preloadAudioSource(
  source: string,
): Promise<HomeDriveBootAssetLoadResult> {
  const preflight = await runHomeDriveEngineAudioPreflight(source, {
    timeoutMs: AUDIO_PRELOAD_PATIENCE_MS,
    requireAudioContentType: false,
    logResult: false,
  });

  if (!preflight.ok) {
    return {
      source,
      ok: false,
      kind: "audio",
      elapsedMs: preflight.elapsedMs,
      status: preflight.status,
      errorMessage: preflight.errorMessage ?? `Falha no preflight de áudio: ${source}`,
    };
  }

  try {
    return await fetchAudioIntoHttpCache(preflight.resolvedUrl);
  } catch {
    return preloadAudioWithElement(source);
  }
}

async function preloadSources(
  sources: readonly string[],
  kind: "image" | "audio",
  reportItem: (source: string, result: HomeDriveBootAssetLoadResult) => void,
): Promise<readonly HomeDriveBootAssetLoadResult[]> {
  const loader = kind === "image" ? preloadImageSource : preloadAudioSource;

  return Promise.all(
    sources.map(async (source) => {
      try {
        const result = await loader(source);
        reportItem(source, result);

        return result;
      } catch (error) {
        const result: HomeDriveBootAssetLoadResult = {
          source,
          ok: false,
          kind,
          elapsedMs: 0,
          status: "loader-exception",
          errorMessage: getErrorMessage(error),
        };

        reportItem(source, result);

        return result;
      }
    }),
  );
}

function getAssetPreloadSummary(
  results: readonly HomeDriveBootAssetLoadResult[],
): string {
  const failed = results.filter((result) => !result.ok).length;
  const deferred = results.filter((result) => result.status === "deferred-timeout").length;

  if (failed <= 0 && deferred <= 0) {
    return "Assets preparados.";
  }

  const fragments: string[] = [];

  if (deferred > 0) {
    fragments.push(`${deferred} asset(s) lento(s) mantido(s) como sob demanda`);
  }

  if (failed > 0) {
    fragments.push(`${failed} asset(s) indisponível(is) ignorado(s) sem quebrar o boot`);
  }

  return fragments.join("; ") + ".";
}

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


