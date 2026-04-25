import React, { useCallback, useMemo, useRef, useState } from "react";

import type { HomeDriveRuntimeState } from "./domain/homeDrive.types";
import styles from "./HomeDriveControls.module.css";

export type HomeDriveControlsProps = Readonly<{
  runtime: HomeDriveRuntimeState;
  onStart: () => void;
  onPauseToggle?: () => void;
  onSteerChange: (value: number) => void;
  onThrottleChange: (active: boolean) => void;
  onBrakeChange: (active: boolean) => void;
  className?: string;
}>;

type GestureState = Readonly<{
  pointerId: number;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  startedAt: number;
}>;

type GestureMode = "idle" | "steer" | "boost" | "control";

const STEER_FULL_DISTANCE_PX = 118;
const BOOST_TRIGGER_DISTANCE_PX = -42;
const BRAKE_TRIGGER_DISTANCE_PX = 46;
const DEAD_ZONE_PX = 8;

function buildClassName(...classNames: Array<string | false | undefined>): string {
  return classNames.filter(Boolean).join(" ");
}

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

function getGestureMode(deltaX: number, deltaY: number): GestureMode {
  const absX = Math.abs(deltaX);
  const absY = Math.abs(deltaY);

  if (absX < DEAD_ZONE_PX && absY < DEAD_ZONE_PX) {
    return "idle";
  }

  if (deltaY <= BOOST_TRIGGER_DISTANCE_PX && absY > absX * 0.58) {
    return "boost";
  }

  if (deltaY >= BRAKE_TRIGGER_DISTANCE_PX && absY > absX * 0.48) {
    return "control";
  }

  return "steer";
}

function capturePointer(event: React.PointerEvent<HTMLElement>): void {
  try {
    event.currentTarget.setPointerCapture(event.pointerId);
  } catch {
    // Alguns browsers podem não permitir captura em certos eventos.
  }
}

function releasePointer(event: React.PointerEvent<HTMLElement>): void {
  try {
    event.currentTarget.releasePointerCapture(event.pointerId);
  } catch {
    // Evita erro se o pointer já foi liberado/cancelado.
  }
}

export default function HomeDriveControls({
  runtime,
  onStart,
  onPauseToggle: _onPauseToggle,
  onSteerChange,
  onThrottleChange,
  onBrakeChange,
  className,
}: HomeDriveControlsProps) {
  const gestureRef = useRef<GestureState | null>(null);
  const [gestureMode, setGestureMode] = useState<GestureMode>("idle");
  const [isGestureActive, setIsGestureActive] = useState(false);

  const canDrive = runtime.phase !== "paused";

  const rootClassName = useMemo(() => {
    return buildClassName(
      styles.root,
      isGestureActive && styles.rootActive,
      className,
    );
  }, [className, isGestureActive]);

  const gestureClassName = useMemo(() => {
    return buildClassName(
      styles.gestureSurface,
      isGestureActive && styles.gestureSurfaceActive,
      gestureMode === "boost" && styles.gestureSurfaceBoost,
      gestureMode === "control" && styles.gestureSurfaceControl,
      gestureMode === "steer" && styles.gestureSurfaceSteer,
    );
  }, [gestureMode, isGestureActive]);

  const syncAutomaticThrottle = useCallback(() => {
    if (runtime.phase === "ready") {
      onStart();
    }

    if (runtime.phase === "paused") {
      onThrottleChange(false);
      onBrakeChange(false);
      return;
    }

    /**
     * Conceito novo:
     * o carro mantém aceleração automática.
     *
     * O gesto para cima não precisa "segurar" o acelerador;
     * ele apenas reforça a intenção de boost enquanto a física ainda usa
     * o handler antigo booleano.
     */
    onThrottleChange(true);
  }, [onBrakeChange, onStart, onThrottleChange, runtime.phase]);

  const resetGesture = useCallback(
    (event?: React.PointerEvent<HTMLElement>) => {
      if (event) {
        releasePointer(event);
      }

      gestureRef.current = null;
      setIsGestureActive(false);
      setGestureMode("idle");

      onSteerChange(0);
      onBrakeChange(false);

      if (runtime.phase === "playing" || runtime.phase === "ready") {
        onThrottleChange(true);
      }
    },
    [onBrakeChange, onSteerChange, onThrottleChange, runtime.phase],
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();

      capturePointer(event);

      gestureRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        lastX: event.clientX,
        lastY: event.clientY,
        startedAt: performance.now(),
      };

      setIsGestureActive(true);
      setGestureMode("idle");

      syncAutomaticThrottle();
    },
    [syncAutomaticThrottle],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const gesture = gestureRef.current;

      if (!gesture || gesture.pointerId !== event.pointerId) {
        return;
      }

      event.preventDefault();

      if (!canDrive) {
        resetGesture(event);
        return;
      }

      const deltaX = event.clientX - gesture.startX;
      const deltaY = event.clientY - gesture.startY;

      gestureRef.current = {
        ...gesture,
        lastX: event.clientX,
        lastY: event.clientY,
      };

      const nextSteer = clampNumber(deltaX / STEER_FULL_DISTANCE_PX, -1, 1);
      const nextMode = getGestureMode(deltaX, deltaY);
      const wantsBrake = nextMode === "control";

      setGestureMode(nextMode);

      onSteerChange(nextSteer);

      /**
       * Arrastar para baixo vira controle/freio.
       * Não existe botão visual de brake.
       */
      onBrakeChange(wantsBrake);

      /**
       * O acelerador fica automático.
       * Se o jogador estiver freando, o throttle booleano antigo desliga
       * para a física atual entender a intenção de controle.
       */
      onThrottleChange(!wantsBrake);
    },
    [canDrive, onBrakeChange, onSteerChange, onThrottleChange, resetGesture],
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      resetGesture(event);
    },
    [resetGesture],
  );

  const handlePointerCancel = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      resetGesture(event);
    },
    [resetGesture],
  );

  return (
    <div
      className={rootClassName}
      data-home-drive-controls="gesture-auto-drive"
      data-home-drive-gesture-mode={gestureMode}
    >
      <div
        aria-label="Controle gestual de direção"
        className={gestureClassName}
        role="application"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        <div className={styles.gestureVisual} aria-hidden="true">
          <span className={styles.gestureRing} />
          <span className={styles.gestureDot} />
          <span className={styles.gestureVerticalLine} />
          <span className={styles.gestureHorizontalLine} />
        </div>
      </div>
    </div>
  );
}
