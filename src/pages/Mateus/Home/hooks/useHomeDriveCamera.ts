import { useMemo } from "react";

import { getFortalezaRouteSegmentByMeter } from "../components/mobile/game/driving/domain/homeDrive.fortalezaRoute";
import {
  getEnvironmentShift,
  getLaneMarkerOffset,
  getLaneMarkerTranslateY,
  getSkylineBars,
  getVisibleLandmarks,
} from "../components/mobile/game/driving/domain/homeDrive.helpers";
import type {
  HomeDriveLandmark,
  HomeDriveRuntimeState,
  HomeDriveSkylineBar,
  HomeDriveVisibleLandmark,
} from "../components/mobile/game/driving/domain/homeDrive.types";

export type UseHomeDriveCameraParams = Readonly<{
  runtime: HomeDriveRuntimeState;
  landmarks: readonly HomeDriveLandmark[];
}>;

export type UseHomeDriveCameraResult = Readonly<{
  environmentShift: number;
  laneMarkerOffset: number;
  laneMarkerTranslateY: number;
  visibleLandmarks: readonly HomeDriveVisibleLandmark[];
  skylineBars: readonly HomeDriveSkylineBar[];
  routeSegment: ReturnType<typeof getFortalezaRouteSegmentByMeter>;
}>;

export default function useHomeDriveCamera({
  runtime,
  landmarks,
}: UseHomeDriveCameraParams): UseHomeDriveCameraResult {
  const environmentShift = useMemo(() => {
    return getEnvironmentShift(runtime.laneOffset, runtime.steering);
  }, [runtime.laneOffset, runtime.steering]);

  const laneMarkerOffset = useMemo(() => {
    return getLaneMarkerOffset(runtime.elapsedSeconds, runtime.speedKmh);
  }, [runtime.elapsedSeconds, runtime.speedKmh]);

  const laneMarkerTranslateY = useMemo(() => {
    return getLaneMarkerTranslateY(runtime.elapsedSeconds, runtime.speedKmh);
  }, [runtime.elapsedSeconds, runtime.speedKmh]);

  const visibleLandmarks = useMemo(() => {
    return getVisibleLandmarks(
      landmarks,
      runtime.traveledMeters,
      runtime.routeLengthMeters,
    );
  }, [landmarks, runtime.routeLengthMeters, runtime.traveledMeters]);

  const skylineBars = useMemo(() => {
    return getSkylineBars();
  }, []);

  const routeSegment = useMemo(() => {
    return getFortalezaRouteSegmentByMeter(runtime.traveledMeters);
  }, [runtime.traveledMeters]);

  return useMemo(
    () => ({
      environmentShift,
      laneMarkerOffset,
      laneMarkerTranslateY,
      visibleLandmarks,
      skylineBars,
      routeSegment,
    }),
    [
      environmentShift,
      laneMarkerOffset,
      laneMarkerTranslateY,
      visibleLandmarks,
      skylineBars,
      routeSegment,
    ],
  );
}
