import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  HOME_DRIVE_DEFAULT_INPUT_STATE,
  HOME_DRIVE_DEFAULT_RUNTIME_STATE,
  HOME_DRIVE_LANDMARKS,
  HOME_DRIVE_PHASE_PAUSED,
  HOME_DRIVE_PHASE_PLAYING,
  HOME_DRIVE_PHASE_READY,
  HOME_DRIVE_ROUTE_LENGTH_METERS,
} from "../components/mobile/game/driving/domain/homeDrive.constants";
import {
  getHomeDriveAssistedSpeedKmh,
  getHomeDriveAssistState,
  type HomeDriveAssistState,
} from "../components/mobile/game/driving/domain/homeDrive.assist";
import { buildRuntimeState } from "../components/mobile/game/driving/domain/homeDrive.helpers";
import { getHomeDriveRoadCurveState } from "../components/mobile/game/driving/domain/homeDrive.roadCurves";
import type {
  HomeDriveInputState,
  HomeDriveLandmark,
  HomeDrivePhase,
  HomeDriveRuntimeState,
} from "../components/mobile/game/driving/domain/homeDrive.types";

export type MutableHomeDriveState = Readonly<{
  phase: HomeDrivePhase;
  speedKmh: number;
  steering: number;
  laneOffset: number;
  traveledMeters: number;
  elapsedSeconds: number;
  driveFlow: number;
  driveSyncPct: number;
  assistStatus: HomeDriveAssistState["status"];
  autoThrottle: number;
  autoBrake: number;
  stability: number;
  targetSpeedKmh: number;
  maxSafeSpeedKmh: number;
}>;

export type HomeDriveRuntimeAssistExtras = Readonly<{
  driveFlow: number;
  driveSyncPct: number;
  assistStatus: HomeDriveAssistState["status"];
  autoThrottle: number;
  autoBrake: number;
  stability: number;
  targetSpeedKmh: number;
  maxSafeSpeedKmh: number;
}>;

export type UseHomeDriveStateParams = Readonly<{
  landmarks?: readonly HomeDriveLandmark[];
  routeLengthMeters?: number;
  controlState?: HomeDriveInputState;
}>;

export type UseHomeDriveStateResult = Readonly<{
  runtime: HomeDriveRuntimeState & HomeDriveRuntimeAssistExtras;
  rawState: MutableHomeDriveState;
  stateRef: React.MutableRefObject<MutableHomeDriveState>;
  setPhase: (phase: HomeDrivePhase) => void;
  updateState: (
    updater: (current: MutableHomeDriveState) => MutableHomeDriveState,
  ) => void;
  startDrive: () => void;
  pauseDrive: () => void;
  resumeDrive: () => void;
  togglePause: () => void;
  resetDrive: () => void;
}>;

const INITIAL_DRIVE_FLOW = 0.46;
const INITIAL_DRIVE_SYNC_PCT = Math.round(INITIAL_DRIVE_FLOW * 100);

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

function createInitialRawState(): MutableHomeDriveState {
  return {
    phase: HOME_DRIVE_PHASE_READY,
    speedKmh: 0,
    steering: 0,
    laneOffset: 0,
    traveledMeters: 0,
    elapsedSeconds: 0,
    driveFlow: INITIAL_DRIVE_FLOW,
    driveSyncPct: INITIAL_DRIVE_SYNC_PCT,
    assistStatus: "paused",
    autoThrottle: 0,
    autoBrake: 0,
    stability: 1,
    targetSpeedKmh: 0,
    maxSafeSpeedKmh: 0,
  };
}

function getControlIntent(controlState: HomeDriveInputState): {
  throttleIntent: number;
  brakeIntent: number;
} {
  /**
   * Compatibilidade com o input antigo:
   * - throttle antigo vira apenas "carro pode andar";
   * - brake antigo vira intenção de controle/freio.
   *
   * O boost real por gesto vertical pode ser refinado depois
   * quando HomeDriveInputState aceitar throttleIntent contínuo.
   */
  return {
    throttleIntent: 0,
    brakeIntent: clampNumber(controlState.brake, 0, 1),
  };
}

function getElapsedDeltaMs(
  current: MutableHomeDriveState,
  next: MutableHomeDriveState,
): number {
  const deltaSeconds = next.elapsedSeconds - current.elapsedSeconds;

  if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) {
    return 16.6667;
  }

  return clampNumber(deltaSeconds * 1000, 0, 80);
}

function getResolvedAssistState(params: {
  state: MutableHomeDriveState;
  controlState: HomeDriveInputState;
  elapsedMs?: number;
  previousDriveFlow?: number;
}): HomeDriveAssistState {
  const roadCurveState = getHomeDriveRoadCurveState(
    params.state.traveledMeters,
    params.state.speedKmh,
  );

  const { throttleIntent, brakeIntent } = getControlIntent(params.controlState);

  return getHomeDriveAssistState({
    phase: params.state.phase,
    speedKmh: params.state.speedKmh,
    steering: params.state.steering,
    laneOffset: params.state.laneOffset,
    throttleIntent,
    brakeIntent,
    previousDriveFlow: params.previousDriveFlow ?? params.state.driveFlow,
    elapsedMs: params.elapsedMs,
    roadCurveState,
  });
}

function applyAssistToState(params: {
  current: MutableHomeDriveState;
  next: MutableHomeDriveState;
  controlState: HomeDriveInputState;
}): MutableHomeDriveState {
  const elapsedMs = getElapsedDeltaMs(params.current, params.next);

  const assistBeforeSpeed = getResolvedAssistState({
    state: params.next,
    controlState: params.controlState,
    elapsedMs,
    previousDriveFlow: params.current.driveFlow,
  });

  const nextSpeedKmh =
    params.next.phase === HOME_DRIVE_PHASE_PLAYING
      ? getHomeDriveAssistedSpeedKmh({
          currentSpeedKmh: params.next.speedKmh,
          assist: assistBeforeSpeed,
          elapsedMs,
        })
      : 0;

  const assistedState: MutableHomeDriveState = {
    ...params.next,
    speedKmh: nextSpeedKmh,
  };

  const assist = getResolvedAssistState({
    state: assistedState,
    controlState: params.controlState,
    elapsedMs,
    previousDriveFlow: assistBeforeSpeed.driveFlow,
  });

  return {
    ...assistedState,
    driveFlow: assist.driveFlow,
    driveSyncPct: assist.driveSyncPct,
    assistStatus: assist.status,
    autoThrottle: assist.autoThrottle,
    autoBrake: assist.autoBrake,
    stability: assist.stability,
    targetSpeedKmh: assist.targetSpeedKmh,
    maxSafeSpeedKmh: assist.maxSafeSpeedKmh,
  };
}

function createRuntimeWithAssist(params: {
  rawState: MutableHomeDriveState;
  landmarks: readonly HomeDriveLandmark[];
  routeLengthMeters: number;
  controlState: HomeDriveInputState;
}): HomeDriveRuntimeState & HomeDriveRuntimeAssistExtras {
  const assist = getResolvedAssistState({
    state: params.rawState,
    controlState: params.controlState,
    previousDriveFlow: params.rawState.driveFlow,
  });

  const runtime = buildRuntimeState({
    phase: params.rawState.phase,
    speedKmh: params.rawState.speedKmh,
    steering: params.rawState.steering,
    laneOffset: params.rawState.laneOffset,
    traveledMeters: params.rawState.traveledMeters,
    elapsedSeconds: params.rawState.elapsedSeconds,
    landmarks: params.landmarks,
    routeLengthMeters: params.routeLengthMeters,
    throttleActive:
      params.rawState.phase === HOME_DRIVE_PHASE_PLAYING && assist.throttle > 0.04,
  });

  return {
    ...(runtime ?? HOME_DRIVE_DEFAULT_RUNTIME_STATE),
    driveFlow: assist.driveFlow,
    driveSyncPct: assist.driveSyncPct,
    assistStatus: assist.status,
    autoThrottle: assist.autoThrottle,
    autoBrake: assist.autoBrake,
    stability: assist.stability,
    targetSpeedKmh: assist.targetSpeedKmh,
    maxSafeSpeedKmh: assist.maxSafeSpeedKmh,
  };
}

export default function useHomeDriveState({
  landmarks = HOME_DRIVE_LANDMARKS,
  routeLengthMeters = HOME_DRIVE_ROUTE_LENGTH_METERS,
  controlState = HOME_DRIVE_DEFAULT_INPUT_STATE,
}: UseHomeDriveStateParams = {}): UseHomeDriveStateResult {
  const [rawState, setRawState] = useState<MutableHomeDriveState>(
    createInitialRawState,
  );

  const stateRef = useRef<MutableHomeDriveState>(rawState);

  useEffect(() => {
    stateRef.current = rawState;
  }, [rawState]);

  const updateState = useCallback(
    (updater: (current: MutableHomeDriveState) => MutableHomeDriveState) => {
      setRawState((current) => {
        const updaterResult = updater(current);
        const next = applyAssistToState({
          current,
          next: updaterResult,
          controlState,
        });

        stateRef.current = next;
        return next;
      });
    },
    [controlState],
  );

  const setPhase = useCallback(
    (phase: HomeDrivePhase) => {
      updateState((current) => ({
        ...current,
        phase,
      }));
    },
    [updateState],
  );

  const startDrive = useCallback(() => {
    updateState((current) => ({
      ...current,
      phase: HOME_DRIVE_PHASE_PLAYING,
    }));
  }, [updateState]);

  const pauseDrive = useCallback(() => {
    updateState((current) => ({
      ...current,
      phase: HOME_DRIVE_PHASE_PAUSED,
      speedKmh: 0,
    }));
  }, [updateState]);

  const resumeDrive = useCallback(() => {
    updateState((current) => ({
      ...current,
      phase: HOME_DRIVE_PHASE_PLAYING,
    }));
  }, [updateState]);

  const togglePause = useCallback(() => {
    updateState((current) => {
      if (current.phase === HOME_DRIVE_PHASE_PLAYING) {
        return {
          ...current,
          phase: HOME_DRIVE_PHASE_PAUSED,
          speedKmh: 0,
        };
      }

      if (current.phase === HOME_DRIVE_PHASE_PAUSED) {
        return {
          ...current,
          phase: HOME_DRIVE_PHASE_PLAYING,
        };
      }

      return {
        ...current,
        phase: HOME_DRIVE_PHASE_PLAYING,
      };
    });
  }, [updateState]);

  const resetDrive = useCallback(() => {
    const next = createInitialRawState();
    stateRef.current = next;
    setRawState(next);
  }, []);

  const runtime = useMemo(() => {
    return createRuntimeWithAssist({
      rawState,
      landmarks,
      routeLengthMeters,
      controlState,
    });
  }, [controlState, landmarks, rawState, routeLengthMeters]);

  return useMemo(
    () => ({
      runtime,
      rawState,
      stateRef,
      setPhase,
      updateState,
      startDrive,
      pauseDrive,
      resumeDrive,
      togglePause,
      resetDrive,
    }),
    [
      pauseDrive,
      rawState,
      resetDrive,
      resumeDrive,
      runtime,
      setPhase,
      startDrive,
      togglePause,
      updateState,
    ],
  );
}
