import type { HomeDriveRouteSegment } from "./homeDrive.fortalezaRoute";
import type {
  HomeDriveRoadCurveState,
  HomeDriveRoadCurveSegment,
} from "./homeDrive.roadCurves";
import type { HomeDriveRoadProfile } from "./homeDrive.roadProfile";
import type { HomeDriveScenePreset } from "./homeDrive.scenePresets";
import type { HomeDriveVehicleDynamicsState } from "./homeDriveVehicleDynamics";
import type {
  HomeDriveProjectedWorldRoad,
  HomeDriveWorldIntersection,
} from "./homeDrive.worldTypes";

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

  /*
    Compatibilidade com a rota antiga.
    Ainda alimenta camadas existentes que dependem de progresso linear.
  */
  routeProgress: number;
  traveledMeters: number;
  routeLengthMeters: number;

  /*
    Mundo aberto / cidade virtual.
    0deg = olhando para +Y.
    90deg = olhando para +X.
  */
  worldX: number;
  worldY: number;
  headingDeg: number;
  currentRoadId?: string;
  currentRoadLabel?: string;
  currentDistrictId?: string;
  currentDistrictLabel?: string;
  nearestRoadDistanceMeters?: number;
  visibleWorldRoads: readonly HomeDriveProjectedWorldRoad[];
  intersectionsAhead: readonly HomeDriveWorldIntersection[];
  intersectionAhead?: HomeDriveWorldIntersection;

  /*
    Input visual/suavizado do volante.
  */
  steering: number;

  /*
    Estado físico lateral do carro.
    Mantido para compatibilidade com pista, roadside, cockpit e paralaxe.
  */
  laneOffset: number;
  lateralVelocity: number;

  /*
    Dinâmica visual derivada da direção.
    Esses campos devem alimentar estrada, skyline, landmarks e parallax.
  */
  roadDriftPx: number;
  cameraRollDeg: number;
  horizonShiftPx: number;
  parallaxPx: number;
  steeringIntensity: number;

  cameraYaw: number;
  cameraPitch: number;
  elapsedSeconds: number;

  /*
    Label legado usado por HUD/camadas antigas.
    Agora deve preferir o distrito do mundo aberto.
  */
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
  lateralVelocity: number;
  steeringIntensity: number;

  routeProgress: number;
  traveledMeters: number;

  worldX: number;
  worldY: number;
  headingDeg: number;
  currentRoadId?: string;
  currentRoadLabel?: string;
  currentDistrictId?: string;
  currentDistrictLabel?: string;
  nearestRoadDistanceMeters?: number;
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

  /*
    Estado físico usado por camadas visuais:
    - ruas paralelas;
    - roadside;
    - landmarks;
    - pista principal.
  */
  vehicleDynamics: HomeDriveVehicleDynamicsState;

  /*
    Mundo aberto projetado para as novas camadas visuais.
    Continua opcional no SceneState para não quebrar hooks antigos.
  */
  visibleWorldRoads?: readonly HomeDriveProjectedWorldRoad[];
  intersectionsAhead?: readonly HomeDriveWorldIntersection[];

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
