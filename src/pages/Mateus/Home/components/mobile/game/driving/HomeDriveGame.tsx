import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import HomeDriveViewport from "./HomeDriveViewport";

export type HomeDriveLandmark = Readonly<{
  id: string;
  label: string;
  district: string;
  atMeter: number;
  color: string;
}>;

export type HomeDriveRuntimeState = Readonly<{
  phase: "ready" | "playing" | "paused";
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

export type HomeDriveGameProps = Readonly<{
  onClose?: () => void;
  className?: string;
}>;

type InputState = {
  steer: number;
  throttle: number;
  brake: number;
};

const ROUTE_LENGTH_METERS = 6_400;
const MAX_SPEED_KMH = 96;
const MIN_SPEED_KMH = 0;
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
  return Math.min(max, Math.max(min, value));
}

function lerp(current: number, target: number, amount: number): number {
  return current + (target - current) * amount;
}

function toMetersPerSecond(speedKmh: number): number {
  return speedKmh / 3.6;
}

function getGearLabel(speedKmh: number): string {
  if (speedKmh < 4) return "N";
  if (speedKmh < 18) return "1";
  if (speedKmh < 34) return "2";
  if (speedKmh < 50) return "3";
  if (speedKmh < 68) return "4";
  return "5";
}

function getDistrictLabel(progressMeters: number): string {
  const reversed = [...LANDMARKS].reverse();
  const landmark = reversed.find((item) => progressMeters >= item.atMeter);

  return landmark?.district ?? "Orla de Fortaleza";
}

function getCurrentLandmark(progressMeters: number): HomeDriveLandmark | undefined {
  return [...LANDMARKS]
    .reverse()
    .find((item) => progressMeters >= item.atMeter);
}

function getNextLandmark(progressMeters: number): HomeDriveLandmark | undefined {
  return LANDMARKS.find((item) => item.atMeter > progressMeters);
}

export default function HomeDriveGame({
  onClose,
  className,
}: HomeDriveGameProps) {
  const [phase, setPhase] = useState<"ready" | "playing" | "paused">("ready");
  const [speedKmh, setSpeedKmh] = useState(0);
  const [steering, setSteering] = useState(0);
  const [laneOffset, setLaneOffset] = useState(0);
  const [traveledMeters, setTraveledMeters] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const inputRef = useRef<InputState>({
    steer: 0,
    throttle: 0,
    brake: 0,
  });

  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);

  const resetDrive = useCallback(() => {
    setPhase("ready");
    setSpeedKmh(0);
    setSteering(0);
    setLaneOffset(0);
    setTraveledMeters(0);
    setElapsedSeconds(0);

    inputRef.current.steer = 0;
    inputRef.current.throttle = 0;
    inputRef.current.brake = 0;
  }, []);

  const startDrive = useCallback(() => {
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
        const { steer, throttle, brake } = inputRef.current;

        setSpeedKmh((current) => {
          const acceleration = throttle > 0 ? 38 : 0;
          const braking = brake > 0 ? 62 : 0;
          const drag = current > 0 ? 11 : 0;
          const next =
            current + acceleration * deltaSeconds - braking * deltaSeconds - drag * deltaSeconds;

          return clamp(next, MIN_SPEED_KMH, MAX_SPEED_KMH);
        });

        setSteering((current) => {
          const easing = speedKmh > 56 ? 0.14 : 0.18;
          return clamp(lerp(current, steer, easing), -1, 1);
        });

        setLaneOffset((current) => {
          const lateralVelocity = steer * (0.9 + speedKmh / 140) * deltaSeconds;
          const recenter = steer === 0 ? current * 1.6 * deltaSeconds : 0;
          const next = current + lateralVelocity - recenter;
          return clamp(next, -1, 1);
        });

        setTraveledMeters((current) => {
          const next = current + toMetersPerSecond(speedKmh) * deltaSeconds;
          return next >= ROUTE_LENGTH_METERS ? next - ROUTE_LENGTH_METERS : next;
        });

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
  }, [phase, speedKmh]);

  const runtime = useMemo<HomeDriveRuntimeState>(() => {
    const progress = traveledMeters / ROUTE_LENGTH_METERS;
    const currentLandmark = getCurrentLandmark(traveledMeters);
    const nextLandmark = getNextLandmark(traveledMeters);
    const gearLabel = getGearLabel(speedKmh);
    const rpm =
      900 +
      speedKmh * 42 +
      Math.abs(steering) * 420 +
      (inputRef.current.throttle > 0 ? 550 : 0);

    return {
      phase,
      speedKmh,
      rpm,
      gearLabel,
      routeProgress: progress,
      traveledMeters,
      routeLengthMeters: ROUTE_LENGTH_METERS,
      steering,
      laneOffset,
      cameraYaw: laneOffset * 9 + steering * 4,
      cameraPitch: 1.5 + speedKmh * 0.025,
      elapsedSeconds,
      districtLabel: getDistrictLabel(traveledMeters),
      currentLandmark,
      nextLandmark,
    };
  }, [elapsedSeconds, laneOffset, phase, speedKmh, steering, traveledMeters]);

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
