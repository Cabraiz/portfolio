// src/pages/Mateus/Live/hooks/useLiveGsapScene.ts

import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";

import {
  createScrollTrigger,
  gsap,
  refreshScrollRuntime,
} from "@/features/scroll/gsapRuntime";

import { useLiveReducedMotion } from "./useLiveReducedMotion";

type ScrollTriggerInstance = ReturnType<typeof createScrollTrigger>;

type UseLiveGsapSceneParams = Readonly<{
  rootRef: RefObject<HTMLElement | null>;
  disabled?: boolean;
  start?: string;
  end?: string;
  scrub?: boolean | number;
  refreshOnMount?: boolean;
  respectReducedMotion?: boolean;
  boardSelector?: string;
  metricSelector?: string;
  nodeSelector?: string;
  pulseSelector?: string;
  hintSelector?: string;
}>;

type UseLiveGsapSceneResult = Readonly<{
  isReady: boolean;
  refresh: () => void;
  playIntro: () => void;
  resetScene: () => void;
  replay: () => void;
}>;

export function useLiveGsapScene({
  rootRef,
  disabled = false,
  start = "top 78%",
  end = "bottom 20%",
  scrub = false,
  refreshOnMount = true,
  respectReducedMotion = true,
  boardSelector = "[data-live-board]",
  metricSelector = "[data-live-metric]",
  nodeSelector = "[data-live-node]",
  pulseSelector = "[data-live-pulse]",
  hintSelector = "[data-live-hint]",
}: UseLiveGsapSceneParams): UseLiveGsapSceneResult {
  const { reducedMotion } = useLiveReducedMotion({
    respectSystemPreference: respectReducedMotion,
  });

  const [isReady, setIsReady] = useState(false);

  const introTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const floatTweensRef = useRef<gsap.core.Tween[]>([]);
  const scrollTriggerRef = useRef<ScrollTriggerInstance | null>(null);

  const isActive = useMemo(() => {
    return !disabled && !reducedMotion;
  }, [disabled, reducedMotion]);

  const resetScene = useCallback(() => {
    const root = rootRef.current;

    if (!root) {
      return;
    }

    const board = root.querySelector<HTMLElement>(boardSelector);
    const metrics = Array.from(
      root.querySelectorAll<HTMLElement>(metricSelector),
    );
    const nodes = Array.from(root.querySelectorAll<HTMLElement>(nodeSelector));
    const pulses = Array.from(root.querySelectorAll<HTMLElement>(pulseSelector));
    const hint = root.querySelector<HTMLElement>(hintSelector);

    gsap.set([board, ...metrics, ...nodes, ...pulses, hint].filter(Boolean), {
      clearProps: "all",
    });
  }, [
    boardSelector,
    hintSelector,
    metricSelector,
    nodeSelector,
    pulseSelector,
    rootRef,
  ]);

  const refresh = useCallback(() => {
    refreshScrollRuntime();
  }, []);

  const playIntro = useCallback(() => {
    introTimelineRef.current?.play(0);
  }, []);

  const replay = useCallback(() => {
    introTimelineRef.current?.restart(true, false);
  }, []);

  useLayoutEffect(() => {
    const root = rootRef.current;

    if (!root) {
      return undefined;
    }

    if (!isActive) {
      setIsReady(true);
      resetScene();
      return undefined;
    }

    const board = root.querySelector<HTMLElement>(boardSelector);
    const metrics = Array.from(
      root.querySelectorAll<HTMLElement>(metricSelector),
    );
    const nodes = Array.from(root.querySelectorAll<HTMLElement>(nodeSelector));
    const pulses = Array.from(root.querySelectorAll<HTMLElement>(pulseSelector));
    const hint = root.querySelector<HTMLElement>(hintSelector);

    const ctx = gsap.context(() => {
      if (board) {
        gsap.set(board, {
          autoAlpha: 0,
          y: 28,
          filter: "blur(10px)",
          transformPerspective: 800,
        });
      }

      if (metrics.length > 0) {
        gsap.set(metrics, {
          autoAlpha: 0,
          y: 20,
          scale: 0.985,
          filter: "blur(8px)",
        });
      }

      if (nodes.length > 0) {
        gsap.set(nodes, {
          autoAlpha: 0,
          y: 18,
          scale: 0.92,
          transformOrigin: "50% 50%",
        });
      }

      if (pulses.length > 0) {
        gsap.set(pulses, {
          autoAlpha: 0,
          scale: 0.86,
          transformOrigin: "50% 50%",
        });
      }

      if (hint) {
        gsap.set(hint, {
          autoAlpha: 0,
          y: 12,
        });
      }

      const timeline = gsap.timeline({
        paused: true,
        defaults: {
          ease: "power2.out",
        },
        onStart: () => {
          setIsReady(true);
        },
      });

      if (board) {
        timeline.to(board, {
          autoAlpha: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.75,
        });
      }

      if (metrics.length > 0) {
        timeline.to(
          metrics,
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            filter: "blur(0px)",
            duration: 0.62,
            stagger: 0.06,
          },
          board ? "-=0.42" : 0,
        );
      }

      if (nodes.length > 0) {
        timeline.to(
          nodes,
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: 0.7,
            stagger: 0.05,
          },
          "-=0.4",
        );
      }

      if (pulses.length > 0) {
        timeline.to(
          pulses,
          {
            autoAlpha: 0.92,
            scale: 1,
            duration: 0.5,
            stagger: 0.08,
          },
          "-=0.36",
        );
      }

      if (hint) {
        timeline.to(
          hint,
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.45,
          },
          "-=0.18",
        );
      }

      introTimelineRef.current = timeline;

      floatTweensRef.current = [
        ...nodes.map((node, index) =>
          gsap.to(node, {
            yPercent: index % 2 === 0 ? -2.5 : 2.5,
            xPercent: index % 2 === 0 ? 1.25 : -1.25,
            duration: 2.6 + index * 0.18,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            paused: true,
          }),
        ),
        ...pulses.map((pulse, index) =>
          gsap.to(pulse, {
            scale: 1.08 + index * 0.02,
            autoAlpha: 0.45,
            duration: 1.8 + index * 0.12,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            paused: true,
          }),
        ),
      ];

      const startAmbientTweens = () => {
        floatTweensRef.current.forEach((tween) => tween.play());
      };

      const stopAmbientTweens = () => {
        floatTweensRef.current.forEach((tween) => tween.pause(0));
      };

      if (scrub) {
        scrollTriggerRef.current = createScrollTrigger({
          id: "live-scene-scrub",
          trigger: root,
          start,
          end,
          scrub,
          onUpdate: (self: { progress: number }) => {
            timeline.progress(self.progress);
          },
          onEnter: () => {
            setIsReady(true);
            startAmbientTweens();
          },
          onEnterBack: () => {
            setIsReady(true);
            startAmbientTweens();
          },
          onLeave: () => {
            startAmbientTweens();
          },
          onLeaveBack: () => {
            stopAmbientTweens();
            timeline.progress(0);
          },
        });
      } else {
        scrollTriggerRef.current = createScrollTrigger({
          id: "live-scene-enter",
          trigger: root,
          start,
          end,
          onEnter: () => {
            timeline.play();
            startAmbientTweens();
          },
          onEnterBack: () => {
            timeline.play();
            startAmbientTweens();
          },
          onLeaveBack: () => {
            timeline.pause(0);
            stopAmbientTweens();
          },
        });
      }
    }, root);

    if (refreshOnMount) {
      refreshScrollRuntime();
    }

    return () => {
      scrollTriggerRef.current?.kill();
      scrollTriggerRef.current = null;

      floatTweensRef.current.forEach((tween) => tween.kill());
      floatTweensRef.current = [];

      introTimelineRef.current?.kill();
      introTimelineRef.current = null;

      ctx.revert();
    };
  }, [
    boardSelector,
    hintSelector,
    isActive,
    metricSelector,
    nodeSelector,
    pulseSelector,
    refreshOnMount,
    resetScene,
    rootRef,
    scrub,
    start,
    end,
  ]);

  return {
    isReady,
    refresh,
    playIntro,
    resetScene,
    replay,
  };
}

export default useLiveGsapScene;
