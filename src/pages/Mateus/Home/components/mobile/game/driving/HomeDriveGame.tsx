import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import homeDriveWorldMapJson from "./domain/homeDrive.worldMap.json";
import {
  createInitialHomeDriveVehicleDynamics,
  resolveHomeDriveVehicleDynamics,
  type HomeDriveVehicleDynamicsState,
} from "./domain/homeDriveVehicleDynamics";
import {
  createInitialHomeDriveWorldCarState,
} from "./domain/homeDrive.worldNavigation";
import {
  resetHomeDriveWorldCarToSpawn,
  resolveHomeDriveWorldPhysics,
} from "./domain/homeDrive.worldPhysics";
import {
  createInitialHomeDriveWorldCameraState,
  resolveHomeDriveWorldCamera,
} from "./domain/homeDrive.worldCamera";
import { projectHomeDriveWorldRoads } from "./domain/homeDrive.worldProjection";
import type {
  HomeDriveLandmark,
  HomeDrivePhase,
  HomeDriveRuntimeState,
} from "./domain/homeDrive.types";
import type {
  HomeDriveWorldCameraState,
  HomeDriveWorldCarState,
  HomeDriveWorldMap,
  HomeDriveWorldProjectionResult,
} from "./domain/homeDrive.worldTypes";
import HomeDriveViewport from "./HomeDriveViewport";

export type HomeDriveGameProps = Readonly<{
  onClose?: () => void;
  className?: string;
}>;

type InputState = {
  steer: number;
  throttle: number;
  brake: number;
};

const HOME_DRIVE_WORLD_MAP = homeDriveWorldMapJson as HomeDriveWorldMap;

const ROUTE_LENGTH_METERS = 6_400;

/*
  Mantido por compatibilidade com RPM, HUD e camadas visuais antigas.
  A velocidade real agora vem de resolveHomeDriveWorldPhysics().
*/
const MAX_SPEED_KMH = 66;
const MAX_STEER = 1;

const LANDMARKS: readonly HomeDriveLandmark[] = [
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

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(max, Math.max(min, value));
}

function getGearLabel(speedKmh: number): string {
  /*
    Fusca clássico: 4 marchas.
  */
  if (speedKmh < 3) return "N";
  if (speedKmh < 16) return "1";
  if (speedKmh < 31) return "2";
  if (speedKmh < 49) return "3";
  return "4";
}

function getDistrictLabel(progressMeters: number): string {
  const reversed = [...LANDMARKS].reverse();
  const landmark = reversed.find((item) => progressMeters >= item.atMeter);

  return landmark?.district ?? "Orla de Fortaleza";
}

function getCurrentLandmark(
  progressMeters: number,
): HomeDriveLandmark | undefined {
  return [...LANDMARKS]
    .reverse()
    .find((item) => progressMeters >= item.atMeter);
}

function getNextLandmark(progressMeters: number): HomeDriveLandmark | undefined {
  return LANDMARKS.find((item) => item.atMeter > progressMeters);
}

function getRealisticRpm(
  speedKmh: number,
  steering: number,
  input: InputState,
): number {
  const gearLabel = getGearLabel(speedKmh);
  const throttleLoad = input.throttle > 0 ? 220 : 0;
  const brakeLoad = input.brake > 0 ? -120 : 0;
  const steeringLoad = Math.abs(steering) * 120;

  let baseRpm: number;

  switch (gearLabel) {
    case "1":
      baseRpm = 1050 + speedKmh * 92;
      break;

    case "2":
      baseRpm = 1150 + speedKmh * 62;
      break;

    case "3":
      baseRpm = 1250 + speedKmh * 42;
      break;

    case "4":
      baseRpm = 1450 + speedKmh * 27;
      break;

    default:
      baseRpm = 860 + throttleLoad;
      break;
  }

  return Math.round(
    clamp(
      baseRpm + throttleLoad + brakeLoad + steeringLoad,
      780,
      Math.max(4200, MAX_SPEED_KMH * 70),
    ),
  );
}

function createInitialWorldProjection(
  car: HomeDriveWorldCarState,
): HomeDriveWorldProjectionResult {
  return projectHomeDriveWorldRoads({
    map: HOME_DRIVE_WORLD_MAP,
    car,
  });
}

export default function HomeDriveGame({
  onClose,
  className,
}: HomeDriveGameProps) {
  const initialWorldCar = useMemo<HomeDriveWorldCarState>(() => {
    return createInitialHomeDriveWorldCarState(HOME_DRIVE_WORLD_MAP);
  }, []);

  const initialWorldProjection = useMemo<HomeDriveWorldProjectionResult>(() => {
    return createInitialWorldProjection(initialWorldCar);
  }, [initialWorldCar]);

  const [phase, setPhase] = useState<HomeDrivePhase>("ready");
  const [speedKmh, setSpeedKmh] = useState(initialWorldCar.speedKmh);
  const [steering, setSteering] = useState(initialWorldCar.steering);
  const [worldCar, setWorldCar] =
    useState<HomeDriveWorldCarState>(initialWorldCar);
  const [worldProjection, setWorldProjection] =
    useState<HomeDriveWorldProjectionResult>(initialWorldProjection);
  const [worldCamera, setWorldCamera] = useState<HomeDriveWorldCameraState>(() => {
    return createInitialHomeDriveWorldCameraState();
  });

  const [vehicleDynamics, setVehicleDynamics] =
    useState<HomeDriveVehicleDynamicsState>(() => {
      return createInitialHomeDriveVehicleDynamics();
    });

  /*
    traveledMeters continua existindo como camada de compatibilidade.
    Agora ele deriva do odômetro do mundo aberto.
  */
  const [traveledMeters, setTraveledMeters] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const inputRef = useRef<InputState>({
    steer: 0,
    throttle: 0,
    brake: 0,
  });

  const speedRef = useRef(initialWorldCar.speedKmh);
  const steeringRef = useRef(initialWorldCar.steering);
  const worldCarRef = useRef<HomeDriveWorldCarState>(initialWorldCar);
  const worldCameraRef = useRef<HomeDriveWorldCameraState>(
    createInitialHomeDriveWorldCameraState(),
  );
  const vehicleDynamicsRef = useRef<HomeDriveVehicleDynamicsState>(
    createInitialHomeDriveVehicleDynamics(),
  );

  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);

  const resetDrive = useCallback(() => {
    const initialDynamics = createInitialHomeDriveVehicleDynamics();
    const nextWorldCar = resetHomeDriveWorldCarToSpawn(HOME_DRIVE_WORLD_MAP);
    const nextProjection = projectHomeDriveWorldRoads({
      map: HOME_DRIVE_WORLD_MAP,
      car: nextWorldCar,
    });
    const nextCamera = createInitialHomeDriveWorldCameraState();

    setPhase("ready");
    setSpeedKmh(nextWorldCar.speedKmh);
    setSteering(nextWorldCar.steering);
    setWorldCar(nextWorldCar);
    setWorldProjection(nextProjection);
    setWorldCamera(nextCamera);
    setVehicleDynamics(initialDynamics);
    setTraveledMeters(0);
    setElapsedSeconds(0);

    speedRef.current = nextWorldCar.speedKmh;
    steeringRef.current = nextWorldCar.steering;
    worldCarRef.current = nextWorldCar;
    worldCameraRef.current = nextCamera;
    vehicleDynamicsRef.current = initialDynamics;

    inputRef.current.steer = 0;
    inputRef.current.throttle = 0;
    inputRef.current.brake = 0;

    lastFrameRef.current = null;
  }, []);

  const startDrive = useCallback(() => {
    inputRef.current.throttle = 1;
    setPhase("playing");
  }, []);

  const togglePause = useCallback(() => {
    setPhase((current) => {
      if (current === "playing") return "paused";
      if (current === "paused") return "playing";
      return "playing";
    });
  }, []);

  const setSteer = useCallback((value: number) => {
    inputRef.current.steer = clamp(value, -MAX_STEER, MAX_STEER);
  }, []);

  const setThrottle = useCallback((active: boolean) => {
    inputRef.current.throttle = active ? 1 : 0;
  }, []);

  const setBrake = useCallback((active: boolean) => {
    inputRef.current.brake = active ? 1 : 0;
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) {
        return;
      }

      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
        setSteer(-1);
      }

      if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
        setSteer(1);
      }

      if (event.key === "ArrowUp" || event.key.toLowerCase() === "w") {
        setThrottle(true);

        if (phase === "ready") {
          setPhase("playing");
        }
      }

      if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") {
        setBrake(true);
      }

      if (event.key === " ") {
        event.preventDefault();
        togglePause();
      }

      if (event.key === "Escape") {
        onClose?.();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (
        event.key === "ArrowLeft" ||
        event.key === "ArrowRight" ||
        event.key.toLowerCase() === "a" ||
        event.key.toLowerCase() === "d"
      ) {
        setSteer(0);
      }

      if (event.key === "ArrowUp" || event.key.toLowerCase() === "w") {
        setThrottle(false);
      }

      if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") {
        setBrake(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [onClose, phase, setBrake, setSteer, setThrottle, togglePause]);

  useEffect(() => {
    const tick = (timestamp: number) => {
      if (lastFrameRef.current === null) {
        lastFrameRef.current = timestamp;
        rafRef.current = window.requestAnimationFrame(tick);
        return;
      }

      const deltaSeconds = clamp(
        (timestamp - lastFrameRef.current) / 1000,
        0.001,
        0.04,
      );
      lastFrameRef.current = timestamp;

      if (phase === "playing") {
        const input = inputRef.current;

        const nextWorldCar = resolveHomeDriveWorldPhysics({
          previous: worldCarRef.current,
          input: {
            steer: input.steer,
            throttle: input.throttle,
            brake: input.brake,
          },
          deltaSeconds,
          map: HOME_DRIVE_WORLD_MAP,
        });

        worldCarRef.current = nextWorldCar;
        setWorldCar(nextWorldCar);

        speedRef.current = nextWorldCar.speedKmh;
        setSpeedKmh(nextWorldCar.speedKmh);

        steeringRef.current = nextWorldCar.steering;
        setSteering(nextWorldCar.steering);

        const nextProjection = projectHomeDriveWorldRoads({
          map: HOME_DRIVE_WORLD_MAP,
          car: nextWorldCar,
        });

        setWorldProjection(nextProjection);

        const nextWorldCamera = resolveHomeDriveWorldCamera(
          {
            car: nextWorldCar,
            nearestRoad: nextProjection.nearestRoad,
            deltaSeconds,
          },
          worldCameraRef.current,
        );

        worldCameraRef.current = nextWorldCamera;
        setWorldCamera(nextWorldCamera);

        const nextVehicleDynamics = resolveHomeDriveVehicleDynamics(
          vehicleDynamicsRef.current,
          {
            steering: nextWorldCar.steering,
            throttle: input.throttle > 0,
            brake: input.brake > 0,
            laneOffset: vehicleDynamicsRef.current.laneOffset,
            deltaMs: deltaSeconds * 1000,
          },
        );

        vehicleDynamicsRef.current = nextVehicleDynamics;
        setVehicleDynamics(nextVehicleDynamics);

        setTraveledMeters(
          nextWorldCar.odometerMeters % ROUTE_LENGTH_METERS,
        );

        setElapsedSeconds((current) => current + deltaSeconds);
      }

      rafRef.current = window.requestAnimationFrame(tick);
    };

    rafRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = null;
      lastFrameRef.current = null;
    };
  }, [phase]);

  const runtime = useMemo<HomeDriveRuntimeState>(() => {
    const progress = traveledMeters / ROUTE_LENGTH_METERS;
    const currentLandmark = getCurrentLandmark(traveledMeters);
    const nextLandmark = getNextLandmark(traveledMeters);
    const gearLabel = getGearLabel(speedKmh);
    const rpm = getRealisticRpm(speedKmh, steering, inputRef.current);

    const currentRoad = worldProjection.currentRoad;
    const currentDistrict = worldProjection.currentDistrict;
    const nearestRoadDistanceMeters =
      worldProjection.nearestRoad?.distanceMeters;
    const intersectionAhead = worldProjection.intersectionsAhead[0];

    const districtLabel =
      currentDistrict?.label ??
      currentRoad?.districtId ??
      getDistrictLabel(traveledMeters);

    /*
      Mantém a dinâmica antiga como base para as camadas existentes,
      mas soma a câmera nova do mundo aberto para dar sensação real de curva.
    */
    const roadDriftPx =
      vehicleDynamics.roadDriftPx + worldCamera.roadDriftPx;
    const cameraRollDeg =
      vehicleDynamics.cameraRollDeg + worldCamera.cameraRollDeg;
    const horizonShiftPx =
      vehicleDynamics.horizonShiftPx + worldCamera.horizonShiftPx;
    const parallaxPx =
      vehicleDynamics.parallaxPx + worldCamera.parallaxPx;
    const steeringIntensity = Math.max(
      vehicleDynamics.steeringIntensity,
      worldCamera.steeringIntensity,
    );

    return {
      phase,
      speedKmh,
      rpm,
      gearLabel,
      routeProgress: progress,
      traveledMeters,
      routeLengthMeters: ROUTE_LENGTH_METERS,

      worldX: worldCar.x,
      worldY: worldCar.y,
      headingDeg: worldCar.headingDeg,
      currentRoadId: currentRoad?.id ?? worldCar.currentRoadId,
      currentRoadLabel: currentRoad?.label,
      currentDistrictId: currentDistrict?.id ?? worldCar.currentDistrictId,
      currentDistrictLabel: currentDistrict?.label,
      nearestRoadDistanceMeters,
      visibleWorldRoads: worldProjection.projectedRoads,
      intersectionsAhead: worldProjection.intersectionsAhead,
      intersectionAhead,

      steering,
      laneOffset: vehicleDynamics.laneOffset,
      lateralVelocity: vehicleDynamics.lateralVelocity,

      roadDriftPx,
      cameraRollDeg,
      horizonShiftPx,
      parallaxPx,
      steeringIntensity,

      cameraYaw:
        worldCamera.cameraYaw +
        vehicleDynamics.laneOffset * 4.8 +
        steering * 1.6 +
        roadDriftPx * 0.025,
      cameraPitch: worldCamera.cameraPitch + speedKmh * 0.008,
      elapsedSeconds,
      districtLabel,
      currentLandmark,
      nextLandmark,
    };
  }, [
    elapsedSeconds,
    phase,
    speedKmh,
    steering,
    traveledMeters,
    vehicleDynamics,
    worldCamera,
    worldCar,
    worldProjection,
  ]);

  return (
    <HomeDriveViewport
      className={className}
      runtime={runtime}
      landmarks={LANDMARKS}
      onStart={startDrive}
      onPauseToggle={togglePause}
      onReset={resetDrive}
      onClose={onClose}
      onSteerChange={setSteer}
      onThrottleChange={setThrottle}
      onBrakeChange={setBrake}
    />
  );
}
