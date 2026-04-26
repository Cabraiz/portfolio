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

function getPointerAngleDeg(
  element: HTMLElement,
  clientX: number,
  clientY: number,
): number {
  const rect = element.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  return (Math.atan2(clientY - centerY, clientX - centerX) * 180) / Math.PI;
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

export function useHomeDriveSteeringWheel(): HomeDriveSteeringWheelController {
  const wheelRef = useRef<HTMLDivElement | null>(null);
  const activePointerRef = useRef<ActivePointerState | null>(null);
  const rotationRef = useRef(0);

  const [wheelRotationDeg, setWheelRotationDeg] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const syncRotation = useCallback((nextRotationDeg: number) => {
    const clampedRotation = clamp(
      nextRotationDeg,
      -HOME_DRIVE_WHEEL_VISUAL_MAX_ROTATION_DEG,
      HOME_DRIVE_WHEEL_VISUAL_MAX_ROTATION_DEG,
    );

    rotationRef.current = clampedRotation;
    setWheelRotationDeg(clampedRotation);
  }, []);

  const resetRotation = useCallback(() => {
    activePointerRef.current = null;
    setIsDragging(false);
    syncRotation(0);
  }, [syncRotation]);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const element = wheelRef.current;

      if (!element) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      setPointerCaptureSafely(element, event.pointerId);

      activePointerRef.current = {
        pointerId: event.pointerId,
        startAngleDeg: getPointerAngleDeg(
          element,
          event.clientX,
          event.clientY,
        ),
        startRotationDeg: rotationRef.current,
      };

      setIsDragging(true);
    },
    [],
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

      event.preventDefault();
      event.stopPropagation();

      const angleDeg = getPointerAngleDeg(
        element,
        event.clientX,
        event.clientY,
      );

      const deltaDeg = normalizeDeltaDeg(
        angleDeg - activePointer.startAngleDeg,
      );

      /*
        Mantém o visual natural:
        dedo gira horário -> volante gira horário.
        A inversão fica somente no steering enviado para a física.
      */
      syncRotation(activePointer.startRotationDeg + deltaDeg);
    },
    [syncRotation],
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

      syncRotation(
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
  }, [resetRotation, syncRotation]);

  const steering = useMemo(() => {
    if (HOME_DRIVE_WHEEL_VISUAL_MAX_ROTATION_DEG <= 0) {
      return 0;
    }

    /*
      Correção do volante invertido:
      - wheelRotationDeg fica visualmente natural.
      - steering é invertido para casar com a física/câmera do mundo 3D.
    */
    return -clamp(
      wheelRotationDeg / HOME_DRIVE_WHEEL_VISUAL_MAX_ROTATION_DEG,
      -1,
      1,
    );
  }, [wheelRotationDeg]);

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

  return {
    wheelRef,
    steering,
    wheelRotationDeg,
    isDragging,
    handlers,
  };
}
