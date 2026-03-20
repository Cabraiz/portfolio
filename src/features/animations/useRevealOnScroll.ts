import { useLayoutEffect } from "react";
import type { RefObject } from "react";

import {
  createScrollTrigger,
  gsap,
  refreshScrollRuntime,
} from "../scroll/gsapRuntime";

type RevealPreset = "fadeUp" | "blurIn" | "softReveal";

type RevealStartEnd = Readonly<{
  from: gsap.TweenVars;
  to: gsap.TweenVars;
}>;

type UseRevealOnScrollParams = Readonly<{
  targetRef: RefObject<HTMLElement | null>;
  triggerRef?: RefObject<HTMLElement | null>;
  preset?: RevealPreset;
  disabled?: boolean;
  once?: boolean;
  start?: string;
  end?: string;
  duration?: number;
  delay?: number;
  ease?: string;
  x?: number;
  y?: number;
  blur?: number;
  scale?: number;
  opacity?: number;
  refreshOnMount?: boolean;
  markers?: boolean;
  respectReducedMotion?: boolean;
  onReveal?: () => void;
  onLeaveBack?: () => void;
}>;

function isReducedMotionPreferred(): boolean {
  return (
    typeof globalThis.matchMedia === "function" &&
    globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function getPresetConfig(
  preset: RevealPreset,
  options: Readonly<{
    duration: number;
    delay: number;
    ease: string;
    x?: number;
    y?: number;
    blur?: number;
    scale?: number;
    opacity?: number;
  }>
): RevealStartEnd {
  const { duration, delay, ease, x, y, scale, opacity } = options;

  switch (preset) {
    case "blurIn":
      return {
        from: {
          autoAlpha: opacity ?? 0,
          x: x ?? 0,
          y: y ?? 18,
        },
        to: {
          autoAlpha: 1,
          x: 0,
          y: 0,
          duration,
          delay,
          ease,
          overwrite: "auto",
        },
      };

    case "softReveal":
      return {
        from: {
          autoAlpha: opacity ?? 0,
          x: x ?? 0,
          y: y ?? 20,
          scale: scale ?? 0.985,
        },
        to: {
          autoAlpha: 1,
          x: 0,
          y: 0,
          scale: 1,
          duration,
          delay,
          ease,
          overwrite: "auto",
        },
      };

    case "fadeUp":
    default:
      return {
        from: {
          autoAlpha: opacity ?? 0,
          x: x ?? 0,
          y: y ?? 28,
        },
        to: {
          autoAlpha: 1,
          x: 0,
          y: 0,
          duration,
          delay,
          ease,
          overwrite: "auto",
        },
      };
  }
}

export function useRevealOnScroll({
  targetRef,
  triggerRef,
  preset = "fadeUp",
  disabled = false,
  once = false,
  start = "top 80%",
  end = "bottom 30%",
  duration = 1,
  delay = 0,
  ease = "power3.out",
  x,
  y,
  blur,
  scale,
  opacity = 0,
  refreshOnMount = true,
  markers = false,
  respectReducedMotion = true,
  onReveal,
  onLeaveBack,
}: UseRevealOnScrollParams): void {
  useLayoutEffect(() => {
    const target = targetRef.current;
    const triggerElement = triggerRef?.current ?? target;

    if (!target || !triggerElement || disabled) {
      return;
    }

    const shouldReduceMotion =
      respectReducedMotion && isReducedMotionPreferred();

    const presetConfig = getPresetConfig(preset, {
      duration,
      delay,
      ease,
      x,
      y,
      blur,
      scale,
      opacity,
    });

    if (shouldReduceMotion) {
      gsap.set(target, {
        autoAlpha: 1,
        x: 0,
        y: 0,
        scale: 1,
        clearProps: "transform,opacity,willChange",
      });

      return;
    }

    gsap.set(target, {
      ...presetConfig.from,
      willChange: "transform, opacity",
      force3D: true,
    });

    const tween = gsap.to(target, {
      ...presetConfig.to,
      paused: true,
      onStart: () => {
        target.style.willChange = "transform, opacity";
      },
      onReverseStart: () => {
        target.style.willChange = "transform, opacity";
      },
      onComplete: () => {
        target.style.willChange = "auto";

        if (onReveal) {
          onReveal();
        }
      },
      onReverseComplete: () => {
        target.style.willChange = "auto";

        if (onLeaveBack) {
          onLeaveBack();
        }
      },
    });

    const trigger = createScrollTrigger({
      trigger: triggerElement,
      start,
      end,
      markers,
      once,
      animation: tween,
      toggleActions: once
        ? "play none none none"
        : "play none none reverse",
    });

    if (refreshOnMount) {
      refreshScrollRuntime();
    }

    return () => {
      trigger.kill();
      tween.kill();
      target.style.willChange = "auto";
    };
  }, [
    blur,
    delay,
    disabled,
    duration,
    ease,
    end,
    markers,
    onLeaveBack,
    onReveal,
    once,
    opacity,
    preset,
    refreshOnMount,
    respectReducedMotion,
    scale,
    start,
    targetRef,
    triggerRef,
    x,
    y,
  ]);
}

export default useRevealOnScroll;
