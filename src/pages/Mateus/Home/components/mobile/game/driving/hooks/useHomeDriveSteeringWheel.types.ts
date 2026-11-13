// src/pages/Mateus/Home/components/mobile/game/driving/hooks/useHomeDriveSteeringWheel.types.ts

import type { PointerEvent as ReactPointerEvent, RefObject } from "react";

export type ActivePointerState = Readonly<{
  pointerId: number;
  startAngleDeg: number;
  startRotationDeg: number;
}>;

export type SteeringWheelViewState = Readonly<{
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
