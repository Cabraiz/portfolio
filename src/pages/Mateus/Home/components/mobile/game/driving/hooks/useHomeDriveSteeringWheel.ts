// src/pages/Mateus/Home/components/mobile/game/driving/hooks/useHomeDriveSteeringWheel.ts

import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	type PointerEvent as ReactPointerEvent,
} from "react";

import { normalizeDeltaDeg } from "../domain/homeDrive.math";
import type {
	ActivePointerState,
	SteeringWheelViewState,
	UseHomeDriveSteeringWheelOptions,
	HomeDriveSteeringWheelController,
} from "./useHomeDriveSteeringWheel.types";
import {
	isFiniteNumber,
	getPointerAngleDeg,
	setPointerCaptureSafely,
	releasePointerCaptureSafely,
	clampWheelRotationDeg,
	areRotationsEquivalent,
	areSteeringValuesEquivalent,
	getSteeringFromRotationDeg,
} from "./useHomeDriveSteeringWheel.helpers";
import { useHomeDriveSteeringWheelKeyboard } from "./useHomeDriveSteeringWheel.keyboard";
export type {
	UseHomeDriveSteeringWheelOptions,
	HomeDriveSteeringWheelController,
} from "./useHomeDriveSteeringWheel.types";

export function useHomeDriveSteeringWheel(
  options: UseHomeDriveSteeringWheelOptions = {},
): HomeDriveSteeringWheelController {
  const wheelRef = useRef<HTMLDivElement | null>(null);
  const activePointerRef = useRef<ActivePointerState | null>(null);
  const rotationRef = useRef(0);
  const steeringRef = useRef(0);
  const lastPublishedSteeringRef = useRef(0);
  const pendingRotationRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  const onSteeringChangeRef = useRef<
    UseHomeDriveSteeringWheelOptions["onSteeringChange"]
  >(options.onSteeringChange);

  const [viewState, setViewState] = useState<SteeringWheelViewState>({
    isDragging: false,
  });

  useEffect(() => {
    onSteeringChangeRef.current = options.onSteeringChange;
  }, [options.onSteeringChange]);

  const applyWheelDomState = useCallback(
    (nextRotationDeg: number, nextSteering: number) => {
      const element = wheelRef.current;

      if (!element) {
        return;
      }

      element.style.setProperty(
        "--free-drive-wheel-rotation",
        `${nextRotationDeg.toFixed(3)}deg`,
      );

      element.setAttribute("aria-valuenow", nextSteering.toFixed(2));
    },
    [],
  );

  const publishSteeringChange = useCallback((nextSteering: number) => {
    if (!isFiniteNumber(nextSteering)) {
      return;
    }

    if (
      areSteeringValuesEquivalent(
        lastPublishedSteeringRef.current,
        nextSteering,
      )
    ) {
      return;
    }

    lastPublishedSteeringRef.current = nextSteering;
    onSteeringChangeRef.current?.(nextSteering);
  }, []);

  const commitRotation = useCallback(
    (nextRotationDeg: number, options?: Readonly<{ force?: boolean }>) => {
      if (!mountedRef.current || !isFiniteNumber(nextRotationDeg)) {
        return;
      }

      const clampedRotation = clampWheelRotationDeg(nextRotationDeg);
      const nextSteering = getSteeringFromRotationDeg(clampedRotation);
      const force = options?.force === true;

      if (
        !force &&
        areRotationsEquivalent(rotationRef.current, clampedRotation)
      ) {
        applyWheelDomState(rotationRef.current, steeringRef.current);
        return;
      }

      rotationRef.current = clampedRotation;
      steeringRef.current = nextSteering;

      /*
        Não usa setState para rotação.
        Isso elimina o ciclo:
        pointer/RAF -> setState -> render -> effect -> novo update.
      */
      applyWheelDomState(clampedRotation, nextSteering);
      publishSteeringChange(nextSteering);
    },
    [applyWheelDomState, publishSteeringChange],
  );

  const cancelPendingFrame = useCallback(() => {
    if (rafRef.current === null) {
      return;
    }

    window.cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }, []);

  const flushPendingRotation = useCallback(() => {
    rafRef.current = null;

    const nextRotationDeg = pendingRotationRef.current;

    if (nextRotationDeg === null) {
      return;
    }

    pendingRotationRef.current = null;
    commitRotation(nextRotationDeg);
  }, [commitRotation]);

  const scheduleRotation = useCallback(
    (nextRotationDeg: number) => {
      if (!isFiniteNumber(nextRotationDeg)) {
        return;
      }

      pendingRotationRef.current = nextRotationDeg;

      if (rafRef.current !== null) {
        return;
      }

      rafRef.current = window.requestAnimationFrame(flushPendingRotation);
    },
    [flushPendingRotation],
  );

  const setDraggingSafely = useCallback((isDragging: boolean) => {
    setViewState((current) => {
      if (current.isDragging === isDragging) {
        return current;
      }

      return {
        isDragging,
      };
    });
  }, []);

  const resetRotation = useCallback(() => {
    activePointerRef.current = null;
    pendingRotationRef.current = null;
    cancelPendingFrame();

    commitRotation(0, {
      force: true,
    });

    setDraggingSafely(false);
  }, [cancelPendingFrame, commitRotation, setDraggingSafely]);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const element = wheelRef.current;

      if (!element) {
        return;
      }

      const startAngleDeg = getPointerAngleDeg(
        element,
        event.clientX,
        event.clientY,
      );

      if (startAngleDeg === null) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      setPointerCaptureSafely(element, event.pointerId);

      activePointerRef.current = {
        pointerId: event.pointerId,
        startAngleDeg,
        startRotationDeg: rotationRef.current,
      };

      /*
        Reaplica o CSS variable caso o React tenha re-renderizado o componente
        por causa de snapshot de colisão/runtime.
      */
      commitRotation(rotationRef.current, {
        force: true,
      });

      setDraggingSafely(true);
    },
    [commitRotation, setDraggingSafely],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const element = wheelRef.current;
      const activePointer = activePointerRef.current;

      if (
        !element ||
        !activePointer ||
        activePointer.pointerId !== event.pointerId
      ) {
        return;
      }

      const angleDeg = getPointerAngleDeg(
        element,
        event.clientX,
        event.clientY,
      );

      if (angleDeg === null) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const deltaDeg = normalizeDeltaDeg(
        angleDeg - activePointer.startAngleDeg,
      );

      if (!isFiniteNumber(deltaDeg)) {
        return;
      }

      /*
        Mantém o visual natural:
        dedo gira horário -> volante gira horário.
        A inversão fica somente no steering enviado para a física.
      */
      scheduleRotation(activePointer.startRotationDeg + deltaDeg);
    },
    [scheduleRotation],
  );

  const handlePointerUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const activePointer = activePointerRef.current;

      if (!activePointer || activePointer.pointerId !== event.pointerId) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      releasePointerCaptureSafely(wheelRef.current, event.pointerId);
      resetRotation();
    },
    [resetRotation],
  );

  const handlePointerCancel = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const activePointer = activePointerRef.current;

      if (!activePointer || activePointer.pointerId !== event.pointerId) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      releasePointerCaptureSafely(wheelRef.current, event.pointerId);
      resetRotation();
    },
    [resetRotation],
  );

  const handleLostPointerCapture = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const activePointer = activePointerRef.current;

      if (!activePointer || activePointer.pointerId !== event.pointerId) {
        return;
      }

      resetRotation();
    },
    [resetRotation],
  );

  useHomeDriveSteeringWheelKeyboard(commitRotation, resetRotation);

  useEffect(() => {
    mountedRef.current = true;

    commitRotation(rotationRef.current, {
      force: true,
    });

    return () => {
      mountedRef.current = false;
      activePointerRef.current = null;
      pendingRotationRef.current = null;
      cancelPendingFrame();
    };
  }, [cancelPendingFrame, commitRotation]);

  const handlers = useMemo(
    () => ({
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerCancel,
      onLostPointerCapture: handleLostPointerCapture,
    }),
    [
      handleLostPointerCapture,
      handlePointerCancel,
      handlePointerDown,
      handlePointerMove,
      handlePointerUp,
    ],
  );

  const exposedSteering = steeringRef.current;
  const exposedWheelRotationDeg = rotationRef.current;

  return useMemo(
    () => ({
      wheelRef,
      steering: exposedSteering,
      wheelRotationDeg: exposedWheelRotationDeg,
      isDragging: viewState.isDragging,
      handlers,
    }),
    [
      exposedSteering,
      exposedWheelRotationDeg,
      handlers,
      viewState.isDragging,
    ],
  );
}
