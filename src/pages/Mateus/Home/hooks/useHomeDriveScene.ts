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
    roadCurveCssVars: ReturnType<typeof getHomeDriveRoadCurveCssVars>;
  }>;

export default function useHomeDriveScene({
  runtime,
  landmarks,
}: UseHomeDriveSceneParams): UseHomeDriveSceneResult {
  const camera = useHomeDriveCamera({
    runtime,
    landmarks,
  });

  const routeSegment = useMemo(() => {
    return getFortalezaRouteSegmentByMeter(runtime.traveledMeters);
  }, [runtime.traveledMeters]);

  const roadProfile = useMemo(() => {
    return getHomeDriveRoadProfile(routeSegment);
  }, [routeSegment]);

  const scenePreset = useMemo(() => {
    return getHomeDriveScenePreset(routeSegment);
  }, [routeSegment]);

  const roadCurveState = useMemo(() => {
    return getHomeDriveRoadCurveState(
      runtime.traveledMeters,
      runtime.speedKmh,
    );
  }, [runtime.speedKmh, runtime.traveledMeters]);

  const roadCurveCssVars = useMemo(() => {
    return getHomeDriveRoadCurveCssVars(roadCurveState);
  }, [roadCurveState]);

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
      environmentShift: camera.environmentShift,
      laneMarkerOffset: camera.laneMarkerOffset,
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
      scenePreset,
      visibleLandmarks,
    ],
  );
}
