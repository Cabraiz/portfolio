import { useCallback, useEffect, useRef, type RefObject } from "react";

import {
  HOME_DRIVE_ACCELERATION,
  HOME_DRIVE_BRAKE_FORCE,
  HOME_DRIVE_DRAG,
  HOME_DRIVE_PHASE_PLAYING,
  HOME_DRIVE_ROUTE_LENGTH_METERS,
} from "../components/mobile/game/driving/domain/homeDrive.constants";
import {
  getSteerEasing,
  lerp,
  normalizeLaneOffset,
  normalizeSpeedKmh,
  normalizeSteer,
  toMetersPerSecond,
} from "../components/mobile/game/driving/domain/homeDrive.helpers";
import type { HomeDriveInputState } from "../components/mobile/game/driving/domain/homeDrive.types";
import type { MutableHomeDriveState } from "./useHomeDriveState";

export type UseHomeDriveLoopParams = Readonly<{
  enabled?: boolean;
  controlsRef: RefObject<HomeDriveInputState>;
  stateRef: RefObject<MutableHomeDriveState>;
  updateState: (
    updater: (current: MutableHomeDriveState) => MutableHomeDriveState,
  ) => void;
  routeLengthMeters?: number;
}>;

export type UseHomeDriveLoopResult = Readonly<{
  isRunning: boolean;
  stopLoop: () => void;
}>;

export default function useHomeDriveLoop({
  enabled = true,
  controlsRef,
  stateRef,
  updateState,
  routeLengthMeters = HOME_DRIVE_ROUTE_LENGTH_METERS,
}: UseHomeDriveLoopParams): UseHomeDriveLoopResult {
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);
  const isRunningRef = useRef(false);

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) {
      globalThis.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    lastFrameRef.current = null;
    isRunningRef.current = false;
  }, []);

  useEffect(() => {
    const currentState = stateRef.current;

    if (!enabled || !currentState || currentState.phase !== HOME_DRIVE_PHASE_PLAYING) {
      stopLoop();
      return;
    }

    const tick = (timestamp: number) => {
      if (lastFrameRef.current === null) {
        lastFrameRef.current = timestamp;
        isRunningRef.current = true;
        rafRef.current = globalThis.requestAnimationFrame(tick);
        return;
      }

      const deltaSeconds = Math.min(
        0.04,
        Math.max(0.001, (timestamp - lastFrameRef.current) / 1000),
      );

      lastFrameRef.current = timestamp;

      updateState((current) => {
        const controls = controlsRef.current;

        if (!controls || current.phase !== HOME_DRIVE_PHASE_PLAYING) {
          return current;
        }

        const acceleration =
          controls.throttle > 0 ? HOME_DRIVE_ACCELERATION : 0;
        const braking = controls.brake > 0 ? HOME_DRIVE_BRAKE_FORCE : 0;
        const drag = current.speedKmh > 0 ? HOME_DRIVE_DRAG : 0;

        const nextSpeedKmh = normalizeSpeedKmh(
          current.speedKmh +
            acceleration * deltaSeconds -
            braking * deltaSeconds -
            drag * deltaSeconds,
        );

        const nextSteering = normalizeSteer(
          lerp(current.steering, controls.steer, getSteerEasing(nextSpeedKmh)),
        );

        const lateralVelocity =
          controls.steer * (0.9 + nextSpeedKmh / 140) * deltaSeconds;

        const recenter =
          controls.steer === 0 ? current.laneOffset * 1.6 * deltaSeconds : 0;

        const nextLaneOffset = normalizeLaneOffset(
          current.laneOffset + lateralVelocity - recenter,
        );

        const traveledMeters =
          current.traveledMeters +
          toMetersPerSecond(nextSpeedKmh) * deltaSeconds;

        const nextTraveledMeters =
          traveledMeters >= routeLengthMeters
            ? traveledMeters - routeLengthMeters
            : traveledMeters;

        return {
          ...current,
          speedKmh: nextSpeedKmh,
          steering: nextSteering,
          laneOffset: nextLaneOffset,
          traveledMeters: nextTraveledMeters,
          elapsedSeconds: current.elapsedSeconds + deltaSeconds,
        };
      });

      if (stateRef.current?.phase === HOME_DRIVE_PHASE_PLAYING) {
        rafRef.current = globalThis.requestAnimationFrame(tick);
        isRunningRef.current = true;
        return;
      }

      stopLoop();
    };

    rafRef.current = globalThis.requestAnimationFrame(tick);
    isRunningRef.current = true;

    return () => {
      stopLoop();
    };
  }, [controlsRef, enabled, routeLengthMeters, stateRef, stopLoop, updateState]);

  return {
    isRunning: isRunningRef.current,
    stopLoop,
  };
}
