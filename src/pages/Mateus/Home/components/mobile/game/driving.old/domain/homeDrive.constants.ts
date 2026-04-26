import type {
  HomeDriveInputState,
  HomeDriveLandmark,
  HomeDriveRuntimeState,
  HomeDriveSkylineBar,
} from "./homeDrive.types";

export const HOME_DRIVE_ROUTE_LENGTH_METERS = 6_400;
export const HOME_DRIVE_MAX_SPEED_KMH = 96;
export const HOME_DRIVE_MIN_SPEED_KMH = 0;
export const HOME_DRIVE_MAX_STEER = 1;
export const HOME_DRIVE_LANE_OFFSET_LIMIT = 1;

export const HOME_DRIVE_ACCELERATION = 38;
export const HOME_DRIVE_BRAKE_FORCE = 62;
export const HOME_DRIVE_DRAG = 11;

export const HOME_DRIVE_STEER_EASING_LOW_SPEED = 0.18;
export const HOME_DRIVE_STEER_EASING_HIGH_SPEED = 0.14;
export const HOME_DRIVE_HIGH_SPEED_THRESHOLD_KMH = 56;

export const HOME_DRIVE_LANDMARK_WRAP_THRESHOLD_METERS = 300;
export const HOME_DRIVE_LANDMARK_VISIBLE_BEHIND_METERS = -180;
export const HOME_DRIVE_LANDMARK_VISIBLE_AHEAD_METERS = 1_200;
export const HOME_DRIVE_MAX_VISIBLE_LANDMARKS = 4;

export const HOME_DRIVE_ROAD_BOTTOM_PERCENT = 22;
export const HOME_DRIVE_ROAD_HEIGHT_PERCENT = 42;
export const HOME_DRIVE_STEERING_WHEEL_BOTTOM_PERCENT = 12.8;
export const HOME_DRIVE_STEERING_WHEEL_WIDTH_PERCENT = 46;
export const HOME_DRIVE_STEERING_WHEEL_MAX_WIDTH = 220;

export const HOME_DRIVE_CENTER_MARKER_SEGMENT_PX = 34;
export const HOME_DRIVE_CENTER_MARKER_CYCLE_PX = 68;

export const HOME_DRIVE_PHASE_READY = "ready" as const;
export const HOME_DRIVE_PHASE_PLAYING = "playing" as const;
export const HOME_DRIVE_PHASE_PAUSED = "paused" as const;

export const HOME_DRIVE_DEFAULT_DISTRICT_LABEL = "Orla de Fortaleza";
export const HOME_DRIVE_DEFAULT_CURRENT_LANDMARK_LABEL = "Saída da orla";
export const HOME_DRIVE_DEFAULT_NEXT_LANDMARK_LABEL = "Trecho livre";
export const HOME_DRIVE_COMPLETE_ROUTE_LABEL = "Circuito completo";

export const HOME_DRIVE_DEFAULT_INPUT_STATE: HomeDriveInputState = {
  steer: 0,
  throttle: 0,
  brake: 0,
};

export const HOME_DRIVE_LANDMARKS: readonly HomeDriveLandmark[] = [
  {
    id: "beira-mar",
    label: "Beira Mar",
    district: "Meireles",
    atMeter: 350,
    color: "#d3a85f",
  },
  {
    id: "iracema",
    label: "Praia de Iracema",
    district: "Iracema",
    atMeter: 1220,
    color: "#7db2d6",
  },
  {
    id: "centro",
    label: "Centro",
    district: "Centro",
    atMeter: 2280,
    color: "#d18e73",
  },
  {
    id: "benfica",
    label: "Benfica",
    district: "Benfica",
    atMeter: 3140,
    color: "#c2a66d",
  },
  {
    id: "aldeota",
    label: "Aldeota",
    district: "Aldeota",
    atMeter: 4180,
    color: "#b7c37d",
  },
  {
    id: "castelao",
    label: "Arena Castelão",
    district: "Castelão",
    atMeter: 5460,
    color: "#b88cff",
  },
] as const;

export const HOME_DRIVE_SKYLINE_BARS: readonly HomeDriveSkylineBar[] = [
  { id: "bar-0", height: 18, width: 5 },
  { id: "bar-1", height: 37, width: 6 },
  { id: "bar-2", height: 56, width: 7 },
  { id: "bar-3", height: 33, width: 8 },
  { id: "bar-4", height: 52, width: 9 },
  { id: "bar-5", height: 29, width: 10 },
  { id: "bar-6", height: 48, width: 5 },
  { id: "bar-7", height: 25, width: 6 },
  { id: "bar-8", height: 44, width: 7 },
  { id: "bar-9", height: 21, width: 8 },
  { id: "bar-10", height: 40, width: 9 },
  { id: "bar-11", height: 59, width: 10 },
] as const;

export const HOME_DRIVE_DEFAULT_RUNTIME_STATE: HomeDriveRuntimeState = {
  phase: HOME_DRIVE_PHASE_READY,
  speedKmh: 0,
  rpm: 900,
  gearLabel: "N",
  routeProgress: 0,
  traveledMeters: 0,
  routeLengthMeters: HOME_DRIVE_ROUTE_LENGTH_METERS,
  steering: 0,
  laneOffset: 0,
  cameraYaw: 0,
  cameraPitch: 1.5,
  elapsedSeconds: 0,
  districtLabel: HOME_DRIVE_DEFAULT_DISTRICT_LABEL,
  currentLandmark: undefined,
  nextLandmark: HOME_DRIVE_LANDMARKS[0],
};
