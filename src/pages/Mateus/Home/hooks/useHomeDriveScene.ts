import { useMemo } from "react";

import { getFortalezaRouteSegmentByMeter } from "../components/mobile/game/driving/domain/homeDrive.fortalezaRoute";
import { getVisibleLandmarks } from "../components/mobile/game/driving/domain/homeDrive.helpers";
import {
  getHomeDriveRoadCurveCssVars,
  getHomeDriveRoadCurveState,
} from "../components/mobile/game/driving/domain/homeDrive.roadCurves";
import { getHomeDriveRoadProfile } from "../components/mobile/game/driving/domain/homeDrive.roadProfile";
import { getHomeDriveRoadsideItems } from "../components/mobile/game/driving/domain/homeDrive.roadside";
import { getHomeDriveScenePreset } from "../components/mobile/game/driving/domain/homeDrive.scenePresets";
import type {
  HomeDriveLandmark,
  HomeDriveRuntimeState,
  HomeDriveSceneState,
} from "../components/mobile/game/driving/domain/homeDrive.types";
import useHomeDriveCamera from "./useHomeDriveCamera";

export type UseHomeDriveSceneParams = Readonly<{
  runtime: HomeDriveRuntimeState;
  landmarks: readonly HomeDriveLandmark[];
}>;

export type UseHomeDriveSceneResult = HomeDriveSceneState &
  Readonly<{
    roadsideItems: ReturnType<typeof getHomeDriveRoadsideItems>;
    roadCurveCssVars: ReturnType<typeof getHomeDriveRoadCurveCssVars> &
      Readonly<{
        "--home-drive-road-drift-x": string;
        "--home-drive-camera-roll": string;
        "--home-drive-horizon-shift-x": string;
        "--home-drive-parallax-x": string;
        "--home-drive-steering-intensity": number;
      }>;
  }>;

const WORLD_DISTRICT_ROUTE_METERS: Record<string, number> = {
  meireles: 350,
  "praia-de-iracema": 1220,
  iracema: 1220,
  centro: 2280,
  benfica: 3140,
  aldeota: 4180,
  papicu: 4380,
  coco: 4560,
  castelao: 5460,
  "arena-castelao": 5460,
};

const WORLD_ROAD_ROUTE_METERS: Record<string, number> = {
  "av-beira-mar": 350,
  "beira-mar": 350,
  "rua-dragao-mar": 1220,
  "av-iracema-interna": 1220,
  "av-monsenhor-tabosa-pseudo": 1460,
  "av-heraclito-graca-pseudo": 2280,
  "av-imperador-pseudo": 2440,
  "av-universidade-pseudo": 3140,
  "rua-benfica-grid-1": 3260,
  "rua-benfica-grid-2": 3360,
  "av-santos-dumont-pseudo": 4180,
  "av-dom-luis-pseudo": 4240,
  "av-abolição-pseudo": 3900,
  "av-desembargador-moreira-pseudo": 4320,
  "av-barão-studart-pseudo": 4260,
  "via-coco-papicu": 4560,
  "av-washington-soares-pseudo": 5120,
  "av-alberto-craveiro-pseudo": 5460,
  "anel-castelao": 5580,
  "rua-estadio-service-1": 5620,
  "rua-estadio-service-2": 5660,
};

function normalizeSceneKey(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }

  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/av\./g, "av")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getWorldSceneMeter(runtime: HomeDriveRuntimeState): number {
  const roadId = normalizeSceneKey(runtime.currentRoadId);
  const roadLabel = normalizeSceneKey(runtime.currentRoadLabel);
  const districtId = normalizeSceneKey(runtime.currentDistrictId);
  const districtLabel = normalizeSceneKey(runtime.currentDistrictLabel);
  const legacyDistrictLabel = normalizeSceneKey(runtime.districtLabel);

  const roadMeter =
    (roadId ? WORLD_ROAD_ROUTE_METERS[roadId] : undefined) ??
    (roadLabel ? WORLD_ROAD_ROUTE_METERS[roadLabel] : undefined);

  if (typeof roadMeter === "number") {
    return roadMeter;
  }

  const districtMeter =
    (districtId ? WORLD_DISTRICT_ROUTE_METERS[districtId] : undefined) ??
    (districtLabel ? WORLD_DISTRICT_ROUTE_METERS[districtLabel] : undefined) ??
    (legacyDistrictLabel
      ? WORLD_DISTRICT_ROUTE_METERS[legacyDistrictLabel]
      : undefined);

  if (typeof districtMeter === "number") {
    return districtMeter;
  }

  return runtime.traveledMeters;
}

export default function useHomeDriveScene({
  runtime,
  landmarks,
}: UseHomeDriveSceneParams): UseHomeDriveSceneResult {
  const camera = useHomeDriveCamera({
    runtime,
    landmarks,
  });

  /*
    O cenário antigo era puramente linear por traveledMeters.
    Agora usamos uma metragem virtual derivada do mundo aberto para reaproveitar
    presets, roadside, curvas e perfis sem quebrar as camadas existentes.
  */
  const sceneMeter = useMemo(() => {
    return getWorldSceneMeter(runtime);
  }, [
    runtime.currentDistrictId,
    runtime.currentDistrictLabel,
    runtime.currentRoadId,
    runtime.currentRoadLabel,
    runtime.districtLabel,
    runtime.traveledMeters,
  ]);

  const routeSegment = useMemo(() => {
    return getFortalezaRouteSegmentByMeter(sceneMeter);
  }, [sceneMeter]);

  const roadProfile = useMemo(() => {
    return getHomeDriveRoadProfile(routeSegment);
  }, [routeSegment]);

  const scenePreset = useMemo(() => {
    return getHomeDriveScenePreset(routeSegment);
  }, [routeSegment]);

  const roadCurveState = useMemo(() => {
    /*
      A curva visual passa a seguir a região/rua atual do mundo aberto.
      O traveledMeters continua existindo só como compatibilidade de HUD/landmarks.
    */
    return getHomeDriveRoadCurveState(sceneMeter, runtime.speedKmh);
  }, [runtime.speedKmh, sceneMeter]);

  const roadCurveCssVars = useMemo(() => {
    return {
      ...getHomeDriveRoadCurveCssVars(roadCurveState),
      "--home-drive-road-drift-x": `${runtime.roadDriftPx}px`,
      "--home-drive-camera-roll": `${runtime.cameraRollDeg}deg`,
      "--home-drive-horizon-shift-x": `${runtime.horizonShiftPx}px`,
      "--home-drive-parallax-x": `${runtime.parallaxPx}px`,
      "--home-drive-steering-intensity": runtime.steeringIntensity,
    };
  }, [
    roadCurveState,
    runtime.cameraRollDeg,
    runtime.horizonShiftPx,
    runtime.parallaxPx,
    runtime.roadDriftPx,
    runtime.steeringIntensity,
  ]);

  const roadsideItems = useMemo(() => {
    return getHomeDriveRoadsideItems(routeSegment);
  }, [routeSegment]);

  const visibleLandmarks = useMemo(() => {
    return getVisibleLandmarks(
      landmarks,
      runtime.traveledMeters,
      runtime.routeLengthMeters,
    );
  }, [landmarks, runtime.routeLengthMeters, runtime.traveledMeters]);

  return useMemo(
    () => ({
      environmentShift: camera.environmentShift + runtime.parallaxPx * 0.22,
      laneMarkerOffset: camera.laneMarkerOffset + runtime.roadDriftPx * 0.18,
      laneMarkerTranslateY: camera.laneMarkerTranslateY,

      visibleLandmarks,
      skylineBars: camera.skylineBars,

      routeSegment,
      scenePreset,
      roadProfile,

      roadCurveState,
      roadCurveSegment: roadCurveState.segment,
      roadCurveCssVars,

      roadsideItems,

      vehicleDynamics: {
        laneOffset: runtime.laneOffset,
        lateralVelocity: runtime.lateralVelocity,
        roadDriftPx: runtime.roadDriftPx,
        cameraRollDeg: runtime.cameraRollDeg,
        horizonShiftPx: runtime.horizonShiftPx,
        parallaxPx: runtime.parallaxPx,
        steeringIntensity: runtime.steeringIntensity,
      },

      visibleWorldRoads: runtime.visibleWorldRoads,
      intersectionsAhead: runtime.intersectionsAhead,

      skyMood: scenePreset.skyMood,
    }),
    [
      camera.environmentShift,
      camera.laneMarkerOffset,
      camera.laneMarkerTranslateY,
      camera.skylineBars,
      roadCurveCssVars,
      roadCurveState,
      roadProfile,
      roadsideItems,
      routeSegment,
      runtime.cameraRollDeg,
      runtime.horizonShiftPx,
      runtime.intersectionsAhead,
      runtime.laneOffset,
      runtime.lateralVelocity,
      runtime.parallaxPx,
      runtime.roadDriftPx,
      runtime.steeringIntensity,
      runtime.visibleWorldRoads,
      scenePreset,
      visibleLandmarks,
    ],
  );
}
