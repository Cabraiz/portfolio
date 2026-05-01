// src/pages/Mateus/Home/components/mobile/game/driving/hooks/useHomeDriveSteeringWheel.ts

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";

import {
  FREE_DRIVE_WHEEL_VISUAL_MAX_ROTATION_DEG as HOME_DRIVE_WHEEL_VISUAL_MAX_ROTATION_DEG,
} from "../domain/homeDrive.constants";
import { clamp, normalizeDeltaDeg } from "../domain/homeDrive.math";

type ActivePointerState = Readonly<{
  pointerId: number;
  startAngleDeg: number;
  startRotationDeg: number;
}>;

type SteeringWheelViewState = Readonly<{
  isDragging: boolean;
}>;

export type UseHomeDriveSteeringWheelOptions = Readonly<{
  /**
   * Callback imperativo para atualizar inputRef sem forçar render React
   * a cada frame de arraste do volante.
   */
  onSteeringChange?: (steering: number) => void;
}>;

export type HomeDriveSteeringWheelController = Readonly<{
  wheelRef: RefObject<HTMLDivElement | null>;
  steering: number;
  wheelRotationDeg: number;
  isDragging: boolean;
  handlers: Readonly<{
    onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
    onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
    onPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void;
    onPointerCancel: (event: ReactPointerEvent<HTMLDivElement>) => void;
    onLostPointerCapture: (event: ReactPointerEvent<HTMLDivElement>) => void;
  }>;
}>;

const ROTATION_EPSILON_DEG = 0.08;
const STEERING_EPSILON = 0.001;
const STEERING_CALLBACK_EPSILON = 0.0005;

function isFiniteNumber(value: number): boolean {
  return Number.isFinite(value);
}

function getPointerAngleDeg(
  element: HTMLElement,
  clientX: number,
  clientY: number,
): number | null {
  const rect = element.getBoundingClientRect();

  if (
    rect.width <= 0 ||
    rect.height <= 0 ||
    !isFiniteNumber(rect.left) ||
    !isFiniteNumber(rect.top) ||
    !isFiniteNumber(clientX) ||
    !isFiniteNumber(clientY)
  ) {
    return null;
  }

  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const angleDeg =
    (Math.atan2(clientY - centerY, clientX - centerX) * 180) / Math.PI;

  return isFiniteNumber(angleDeg) ? angleDeg : null;
}

function setPointerCaptureSafely(
  element: HTMLElement | null,
  pointerId: number,
): void {
  if (!element) {
    return;
  }

  try {
    if (!element.hasPointerCapture(pointerId)) {
      element.setPointerCapture(pointerId);
    }
  } catch {
    /*
      Alguns browsers mobile podem falhar se o pointer já foi finalizado
      ou se o elemento perdeu o ciclo de interação. Nesse caso ignoramos.
    */
  }
}

function releasePointerCaptureSafely(
  element: HTMLElement | null,
  pointerId: number,
): void {
  if (!element) {
    return;
  }

  try {
    if (element.hasPointerCapture(pointerId)) {
      element.releasePointerCapture(pointerId);
    }
  } catch {
    /*
      Evita crash quando o browser já liberou a captura automaticamente.
    */
  }
}

function clampWheelRotationDeg(rotationDeg: number): number {
  if (!isFiniteNumber(rotationDeg)) {
    return 0;
  }

  return clamp(
    rotationDeg,
    -HOME_DRIVE_WHEEL_VISUAL_MAX_ROTATION_DEG,
    HOME_DRIVE_WHEEL_VISUAL_MAX_ROTATION_DEG,
  );
}

function areRotationsEquivalent(first: number, second: number): boolean {
  if (!isFiniteNumber(first) || !isFiniteNumber(second)) {
    return false;
  }

  return Math.abs(first - second) <= ROTATION_EPSILON_DEG;
}

function areSteeringValuesEquivalent(first: number, second: number): boolean {
  if (!isFiniteNumber(first) || !isFiniteNumber(second)) {
    return false;
  }

  return Math.abs(first - second) <= STEERING_CALLBACK_EPSILON;
}

function getSteeringFromRotationDeg(rotationDeg: number): number {
  if (
    HOME_DRIVE_WHEEL_VISUAL_MAX_ROTATION_DEG <= 0 ||
    !isFiniteNumber(rotationDeg)
  ) {
    return 0;
  }

  /*
    Correção do volante invertido:
    - wheelRotationDeg fica visualmente natural.
    - steering é invertido para casar com a física/câmera do mundo 3D.
  */
  const steering = -clamp(
    rotationDeg / HOME_DRIVE_WHEEL_VISUAL_MAX_ROTATION_DEG,
    -1,
    1,
  );

  return Math.abs(steering) <= STEERING_EPSILON ? 0 : steering;
}

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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
        return;
      }

      event.preventDefault();

      commitRotation(
        event.key === "ArrowLeft"
          ? -HOME_DRIVE_WHEEL_VISUAL_MAX_ROTATION_DEG * 0.72
          : HOME_DRIVE_WHEEL_VISUAL_MAX_ROTATION_DEG * 0.72,
      );
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
        return;
      }

      event.preventDefault();
      resetRotation();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [commitRotation, resetRotation]);

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
