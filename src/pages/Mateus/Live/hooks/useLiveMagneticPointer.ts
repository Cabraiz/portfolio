// src/pages/Mateus/Live/hooks/useLiveMagneticPointer.ts

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";

import {
  addGsapTicker,
  removeGsapTicker,
} from "@/features/scroll/gsapRuntime";

import { useLiveReducedMotion } from "./useLiveReducedMotion";

type GsapTickerCallback = (time: number) => void;

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

function lerp(from: number, to: number, alpha: number): number {
  return from + (to - from) * alpha;
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

  const currentOffsetRef = useRef({ x: 0, y: 0, scale: 1 });
  const targetOffsetRef = useRef({ x: 0, y: 0, scale: 1 });

  const isActive = !disabled && !reducedMotion;

  const reset = useCallback(() => {
    setPointer(DEFAULT_POINTER);
    setIsPointerInside(false);
    targetOffsetRef.current = { x: 0, y: 0, scale: 1 };
  }, []);

  const updateTargetFromPointer = useCallback(
    (nextPointer: LiveMagneticPointerState) => {
      targetOffsetRef.current = {
        x: nextPointer.centeredX * maxOffsetX,
        y: nextPointer.centeredY * maxOffsetY,
        scale: 1 + Math.min(nextPointer.distance * scaleBoost, scaleBoost),
      };
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
      targetOffsetRef.current = { x: 0, y: 0, scale: 1 };
      currentOffsetRef.current = { x: 0, y: 0, scale: 1 };
      setOffsetX(0);
      setOffsetY(0);
      setScale(1);
      return undefined;
    }

    const onTick: GsapTickerCallback = () => {
      const alpha = clamp(smoothing, 0.01, 1);

      currentOffsetRef.current = {
        x: lerp(currentOffsetRef.current.x, targetOffsetRef.current.x, alpha),
        y: lerp(currentOffsetRef.current.y, targetOffsetRef.current.y, alpha),
        scale: lerp(
          currentOffsetRef.current.scale,
          targetOffsetRef.current.scale,
          alpha,
        ),
      };

      setOffsetX(currentOffsetRef.current.x);
      setOffsetY(currentOffsetRef.current.y);
      setScale(currentOffsetRef.current.scale);
    };

    addGsapTicker(onTick);

    return () => {
      removeGsapTicker(onTick);
    };
  }, [isActive, smoothing]);

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
    }) as CSSProperties,
    [offsetX, offsetY, scale, transform],
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
