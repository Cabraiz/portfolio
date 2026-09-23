// src/pages/Mateus/Live/hooks/useLiveMagneticPointer.ts

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";

import { useLiveReducedMotion } from "./useLiveReducedMotion";

type LiveMagneticPointerState = Readonly<{
  clientX: number;
  clientY: number;
  normalizedX: number;
  normalizedY: number;
  centeredX: number;
  centeredY: number;
  distance: number;
}>;

type UseLiveMagneticPointerParams = Readonly<{
  containerRef?: RefObject<HTMLElement | null>;
  disabled?: boolean;
  maxOffsetX?: number;
  maxOffsetY?: number;
  smoothing?: number;
  scaleBoost?: number;
  respectReducedMotion?: boolean;
}>;

type UseLiveMagneticPointerResult = Readonly<{
  isActive: boolean;
  isPointerInside: boolean;
  pointer: LiveMagneticPointerState;
  offsetX: number;
  offsetY: number;
  scale: number;
  transform: string;
  style: CSSProperties;
  reset: () => void;
  handlePointerEnter: (event: ReactPointerEvent<HTMLElement>) => void;
  handlePointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
  handlePointerLeave: () => void;
  bind: Readonly<{
    onPointerEnter: (event: ReactPointerEvent<HTMLElement>) => void;
    onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
    onPointerLeave: () => void;
  }>;
}>;

const DEFAULT_POINTER: LiveMagneticPointerState = {
  clientX: 0,
  clientY: 0,
  normalizedX: 0.5,
  normalizedY: 0.5,
  centeredX: 0,
  centeredY: 0,
  distance: 0,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function resolvePointerState(
  event: ReactPointerEvent<HTMLElement>,
): LiveMagneticPointerState {
  const bounds = event.currentTarget.getBoundingClientRect();
  const localX = event.clientX - bounds.left;
  const localY = event.clientY - bounds.top;
  const normalizedX = bounds.width > 0 ? localX / bounds.width : 0.5;
  const normalizedY = bounds.height > 0 ? localY / bounds.height : 0.5;
  const centeredX = clamp(normalizedX * 2 - 1, -1, 1);
  const centeredY = clamp(normalizedY * 2 - 1, -1, 1);
  const distance = clamp(
    Math.sqrt(centeredX * centeredX + centeredY * centeredY),
    0,
    1.5,
  );

  return {
    clientX: event.clientX,
    clientY: event.clientY,
    normalizedX: clamp(normalizedX, 0, 1),
    normalizedY: clamp(normalizedY, 0, 1),
    centeredX,
    centeredY,
    distance,
  };
}

export function useLiveMagneticPointer({
  containerRef,
  disabled = false,
  maxOffsetX = 16,
  maxOffsetY = 12,
  smoothing = 0.16,
  scaleBoost = 0.025,
  respectReducedMotion = true,
}: UseLiveMagneticPointerParams = {}): UseLiveMagneticPointerResult {
  const { reducedMotion } = useLiveReducedMotion({
    respectSystemPreference: respectReducedMotion,
  });

  const [pointer, setPointer] = useState<LiveMagneticPointerState>(DEFAULT_POINTER);
  const [isPointerInside, setIsPointerInside] = useState(false);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [scale, setScale] = useState(1);

  const isActive = !disabled && !reducedMotion;

  const reset = useCallback(() => {
    setPointer(DEFAULT_POINTER);
    setIsPointerInside(false);
    setOffsetX(0);
    setOffsetY(0);
    setScale(1);
  }, []);

  const updateTargetFromPointer = useCallback(
    (nextPointer: LiveMagneticPointerState) => {
      setOffsetX(nextPointer.centeredX * maxOffsetX);
      setOffsetY(nextPointer.centeredY * maxOffsetY);
      setScale(1 + Math.min(nextPointer.distance * scaleBoost, scaleBoost));
    },
    [maxOffsetX, maxOffsetY, scaleBoost],
  );

  const handlePointerEnter = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!isActive) {
        return;
      }

      const nextPointer = resolvePointerState(event);

      setIsPointerInside(true);
      setPointer(nextPointer);
      updateTargetFromPointer(nextPointer);
    },
    [isActive, updateTargetFromPointer],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!isActive) {
        return;
      }

      const nextPointer = resolvePointerState(event);

      setPointer(nextPointer);
      updateTargetFromPointer(nextPointer);
    },
    [isActive, updateTargetFromPointer],
  );

  const handlePointerLeave = useCallback(() => {
    reset();
  }, [reset]);

  useEffect(() => {
    if (!isActive) {
      setOffsetX(0);
      setOffsetY(0);
      setScale(1);
    }
  }, [isActive]);

  useEffect(() => {
    if (!containerRef?.current || !isActive) {
      return;
    }

    containerRef.current.style.setProperty("--live-magnetic-x", `${offsetX}px`);
    containerRef.current.style.setProperty("--live-magnetic-y", `${offsetY}px`);
    containerRef.current.style.setProperty("--live-magnetic-scale", `${scale}`);
  }, [containerRef, isActive, offsetX, offsetY, scale]);

  const transform = useMemo(() => {
    return `translate3d(${offsetX.toFixed(2)}px, ${offsetY.toFixed(
      2,
    )}px, 0) scale(${scale.toFixed(4)})`;
  }, [offsetX, offsetY, scale]);

  const style = useMemo<CSSProperties>(
    () => ({
      "--live-magnetic-x": `${offsetX.toFixed(2)}px`,
      "--live-magnetic-y": `${offsetY.toFixed(2)}px`,
      "--live-magnetic-scale": scale.toFixed(4),
      transform,
      willChange: "transform",
      transition: `transform ${Math.round(clamp(smoothing, 0.08, 0.45) * 900)}ms ease-out`,
    }) as CSSProperties,
    [offsetX, offsetY, scale, smoothing, transform],
  );

  const bind = useMemo(
    () => ({
      onPointerEnter: handlePointerEnter,
      onPointerMove: handlePointerMove,
      onPointerLeave: handlePointerLeave,
    }),
    [handlePointerEnter, handlePointerLeave, handlePointerMove],
  );

  return {
    isActive,
    isPointerInside,
    pointer,
    offsetX,
    offsetY,
    scale,
    transform,
    style,
    reset,
    handlePointerEnter,
    handlePointerMove,
    handlePointerLeave,
    bind,
  };
}

export default useLiveMagneticPointer;
