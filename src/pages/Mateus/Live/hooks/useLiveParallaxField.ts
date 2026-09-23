// src/pages/Mateus/Live/hooks/useLiveParallaxField.ts

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";

import { gsap } from "@/features/scroll/gsapRuntime";

import { useLiveReducedMotion } from "./useLiveReducedMotion";

type LiveParallaxPointer = Readonly<{
  normalizedX: number;
  normalizedY: number;
  distanceFromCenter?: number;
}>;

type ParallaxLayer = Readonly<{
  element: HTMLElement;
  depth: number;
  rotate: number;
}>;

type UseLiveParallaxFieldParams = Readonly<{
  containerRef: RefObject<HTMLElement | null>;
  pointer?: LiveParallaxPointer;
  disabled?: boolean;
  selector?: string;
  maxTranslateX?: number;
  maxTranslateY?: number;
  maxRotateDeg?: number;
  smoothing?: number;
  respectReducedMotion?: boolean;
}>;

type UseLiveParallaxFieldResult = Readonly<{
  hasLayers: boolean;
  layerCount: number;
  refresh: () => void;
  reset: () => void;
}>;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function resolveLayers(
  container: HTMLElement,
  selector: string,
  maxRotateDeg: number,
): ParallaxLayer[] {
  return Array.from(container.querySelectorAll<HTMLElement>(selector)).map(
    (element) => {
      const rawDepth = Number(
        element.dataset.liveParallax ?? element.dataset.depth ?? "1",
      );
      const rawRotate = Number(
        element.dataset.liveRotate ?? element.dataset.rotate ?? maxRotateDeg,
      );

      return {
        element,
        depth: Number.isFinite(rawDepth) ? rawDepth : 1,
        rotate: Number.isFinite(rawRotate) ? rawRotate : maxRotateDeg,
      };
    },
  );
}

export function useLiveParallaxField({
  containerRef,
  pointer,
  disabled = false,
  selector = "[data-live-parallax]",
  maxTranslateX = 18,
  maxTranslateY = 12,
  maxRotateDeg = 3,
  smoothing = 0.16,
  respectReducedMotion = true,
}: UseLiveParallaxFieldParams): UseLiveParallaxFieldResult {
  const { reducedMotion } = useLiveReducedMotion({
    respectSystemPreference: respectReducedMotion,
  });

  const [layerCount, setLayerCount] = useState(0);

  const layersRef = useRef<ParallaxLayer[]>([]);
  const isActive = !disabled && !reducedMotion;

  const refresh = useCallback(() => {
    const container = containerRef.current;

    if (!container) {
      layersRef.current = [];
      setLayerCount(0);
      return;
    }

    layersRef.current = resolveLayers(container, selector, maxRotateDeg);
    setLayerCount(layersRef.current.length);
  }, [containerRef, maxRotateDeg, selector]);

  const reset = useCallback(() => {
    layersRef.current.forEach(({ element }) => {
      gsap.set(element, {
        x: 0,
        y: 0,
        rotateX: 0,
        rotateY: 0,
        clearProps: "willChange",
      });
    });
  }, []);

  useEffect(() => {
    refresh();

    return () => {
      reset();
    };
  }, [refresh, reset]);

  useEffect(() => {
    if (!isActive) {
      reset();
      return undefined;
    }

    const resolvedPointer = pointer ?? {
      normalizedX: 0.5,
      normalizedY: 0.5,
      distanceFromCenter: 0,
    };
    const centeredX = clamp(resolvedPointer.normalizedX * 2 - 1, -1, 1);
    const centeredY = clamp(resolvedPointer.normalizedY * 2 - 1, -1, 1);

    layersRef.current.forEach(({ element, depth, rotate }) => {
      const weight = Math.max(0.12, depth);

      gsap.to(element, {
        x: centeredX * maxTranslateX * weight,
        y: centeredY * maxTranslateY * weight,
        rotateX: centeredY * rotate * -1 * weight,
        rotateY: centeredX * rotate * weight,
        duration: clamp(smoothing * 1.8, 0.08, 0.45),
        ease: "power2.out",
        overwrite: "auto",
        force3D: true,
      });
    });

    return undefined;
  }, [
    isActive,
    layerCount,
    maxRotateDeg,
    maxTranslateX,
    maxTranslateY,
    pointer,
    reset,
    smoothing,
  ]);

  return {
    hasLayers: layerCount > 0,
    layerCount,
    refresh,
    reset,
  };
}

export default useLiveParallaxField;
