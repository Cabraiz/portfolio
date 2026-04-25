import type { HomeDriveRouteSegment } from "./homeDrive.fortalezaRoute";
import type {
  HomeDriveRoadCurveState,
  HomeDriveRoadCurveSegment,
} from "./homeDrive.roadCurves";
import type { HomeDriveRoadProfile } from "./homeDrive.roadProfile";
import type { HomeDriveScenePreset } from "./homeDrive.scenePresets";

export type HomeDrivePhase = "ready" | "playing" | "paused";

export type HomeDriveSkyMood = "afternoon" | "sunset" | "night";

export type HomeDriveLandmark = Readonly<{
  id: string;
  label: string;
  district: string;
  atMeter: number;
  color: string;
}>;

export type HomeDriveVisibleLandmark = HomeDriveLandmark &
  Readonly<{
    relativeMeters: number;
  }>;

export type HomeDriveSkylineBar = Readonly<{
  id: string;
  height: number;
  width: number;
}>;

export type HomeDriveInputState = Readonly<{
  steer: number;
  throttle: number;
  brake: number;
}>;

export type HomeDriveRuntimeState = Readonly<{
  phase: HomeDrivePhase;
  speedKmh: number;
  rpm: number;
  gearLabel: string;
  routeProgress: number;
  traveledMeters: number;
  routeLengthMeters: number;
  steering: number;
  laneOffset: number;
  cameraYaw: number;
  cameraPitch: number;
  elapsedSeconds: number;
  districtLabel: string;
  currentLandmark?: HomeDriveLandmark;
  nextLandmark?: HomeDriveLandmark;
}>;

export type HomeDriveTelemetry = Readonly<{
  speedKmh: number;
  rpm: number;
  gearLabel: string;
  steering: number;
  laneOffset: number;
  routeProgress: number;
  traveledMeters: number;
}>;

export type HomeDriveSceneState = Readonly<{
  laneMarkerOffset: number;
  laneMarkerTranslateY: number;
  environmentShift: number;

  visibleLandmarks: readonly HomeDriveVisibleLandmark[];
  skylineBars: readonly HomeDriveSkylineBar[];

  routeSegment: HomeDriveRouteSegment;
  scenePreset: HomeDriveScenePreset;
  roadProfile: HomeDriveRoadProfile;

  roadCurveState: HomeDriveRoadCurveState;
  roadCurveSegment: HomeDriveRoadCurveSegment;
  skyMood: HomeDriveSkyMood;
}>;

export type HomeDriveActionHandlers = Readonly<{
  onStart: () => void;
  onPauseToggle: () => void;
  onReset: () => void;
  onClose?: () => void;
  onSteerChange: (value: number) => void;
  onThrottleChange: (active: boolean) => void;
  onBrakeChange: (active: boolean) => void;
}>;

export type HomeDriveViewportModel = Readonly<{
  runtime: HomeDriveRuntimeState;
  landmarks: readonly HomeDriveLandmark[];
}> &
  HomeDriveActionHandlers;
