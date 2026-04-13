import { RefObject, useLayoutEffect } from "react";

import {
  ensureGsapRuntime,
  refreshScrollRuntime,
} from "../../../../features/scroll/gsapRuntime";
import { shouldDisableScrollFades } from "../../../../features/scroll/scrollMotionFlags";

type UseTechnologiesDesktopMotionParams = Readonly<{
  rootRef: RefObject<HTMLElement | null>;
  clustersStackRef: RefObject<HTMLElement | null>;
  activeClusterId: string | null;
  enabled?: boolean;
}>;

type RevealTargets = Readonly<{
  root: HTMLElement;
  header: HTMLElement | null;
  legend: HTMLElement | null;
  cards: HTMLElement[];
  badges: HTMLElement[];
}>;

function prefersReducedMotion(): boolean {
  return (
    "matchMedia" in globalThis &&
    globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function isDesktopViewport(): boolean {
  return "innerWidth" in globalThis && globalThis.innerWidth >= 1024;
}

function getClusterElements(
  container: HTMLElement,
): ReadonlyArray<HTMLElement> {
  return Array.from(
    container.querySelectorAll<HTMLElement>("[data-technology-cluster]"),
  );
}

function getRevealTargets(cluster: HTMLElement): RevealTargets {
  return {
    root: cluster,
    header: cluster.querySelector<HTMLElement>(
      "[data-technology-cluster-header]",
    ),
    legend: cluster.querySelector<HTMLElement>(
      "[data-technology-cluster-legend]",
    ),
    cards: Array.from(
      cluster.querySelectorAll<HTMLElement>("[data-technology-cluster-card]"),
    ),
    badges: Array.from(
      cluster.querySelectorAll<HTMLElement>("[data-technology-cluster-badge]"),
    ),
  };
}

function getIntroTargets(targets: RevealTargets): HTMLElement[] {
  return [
    targets.header,
    targets.legend,
    ...targets.badges,
    ...targets.cards,
  ].filter(Boolean) as HTMLElement[];
}

function clearWillChange(elements: ReadonlyArray<HTMLElement>): void {
  elements.forEach((element) => {
    element.style.willChange = "auto";
  });
}

function markClusterActive(cluster: HTMLElement, isActive: boolean): void {
  if (isActive) {
    cluster.dataset.clusterActive = "true";
    return;
  }

  delete cluster.dataset.clusterActive;
}

function clearClusterInlineStyles(
  gsap: typeof import("gsap").default,
  clusters: ReadonlyArray<HTMLElement>,
): void {
  clusters.forEach((cluster) => {
    const targets = getRevealTargets(cluster);

    gsap.killTweensOf([
      targets.root,
      targets.header,
      targets.legend,
      ...targets.cards,
      ...targets.badges,
    ]);

    gsap.set(
      [
        targets.root,
        targets.header,
        targets.legend,
        ...targets.cards,
        ...targets.badges,
      ].filter(Boolean),
      {
        clearProps:
          "opacity,transform,filter,willChange,scale,rotateX,rotateY,x,y,z",
      },
    );

    delete cluster.dataset.clusterActive;
  });
}

function setInitialRevealState(
  gsap: typeof import("gsap").default,
  targets: RevealTargets,
): void {
  gsap.set(targets.root, {
    autoAlpha: 1,
  });

  if (targets.header) {
    gsap.set(targets.header, {
      autoAlpha: 0,
      y: 18,
      willChange: "transform, opacity",
      force3D: true,
    });
  }

  if (targets.legend) {
    gsap.set(targets.legend, {
      autoAlpha: 0,
      y: 12,
      willChange: "transform, opacity",
      force3D: true,
    });
  }

  if (targets.badges.length > 0) {
    gsap.set(targets.badges, {
      autoAlpha: 0,
      y: 10,
      scale: 0.985,
      willChange: "transform, opacity",
      force3D: true,
    });
  }

  if (targets.cards.length > 0) {
    gsap.set(targets.cards, {
      autoAlpha: 0,
      y: 20,
      scale: 0.985,
      willChange: "transform, opacity",
      force3D: true,
    });
  }
}

function createIntroTimeline(
  gsap: typeof import("gsap").default,
  targets: RevealTargets,
): void {
  const introTargets = getIntroTargets(targets);

  const introTimeline = gsap.timeline({
    defaults: {
      duration: 0.58,
      ease: "power2.out",
      overwrite: "auto",
    },
    scrollTrigger: {
      trigger: targets.root,
      start: "top 86%",
      end: "bottom 20%",
      toggleActions: "play none none reverse",
      fastScrollEnd: true,
      invalidateOnRefresh: true,
    },
  });

  if (targets.header) {
    introTimeline.to(
      targets.header,
      {
        autoAlpha: 1,
        y: 0,
      },
      0,
    );
  }

  if (targets.legend) {
    introTimeline.to(
      targets.legend,
      {
        autoAlpha: 1,
        y: 0,
      },
      0.04,
    );
  }

  if (targets.badges.length > 0) {
    introTimeline.to(
      targets.badges,
      {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        stagger: 0.025,
      },
      0.08,
    );
  }

  if (targets.cards.length > 0) {
    introTimeline.to(
      targets.cards,
      {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        stagger: 0.045,
        duration: 0.62,
      },
      0.12,
    );
  }

  introTimeline.add(() => {
    clearWillChange(introTargets);
  });
}

function setupClusterMotion(
  gsap: typeof import("gsap").default,
  cluster: HTMLElement,
): void {
  const targets = getRevealTargets(cluster);

  setInitialRevealState(gsap, targets);
  createIntroTimeline(gsap, targets);
}

function syncClusterActiveState(
  gsap: typeof import("gsap").default,
  cluster: HTMLElement,
  activeClusterId: string | null,
  motionDisabled: boolean,
): void {
  const clusterId = cluster.getAttribute("data-cluster-id");
  const isActive = Boolean(activeClusterId && clusterId === activeClusterId);

  markClusterActive(cluster, isActive);

  if (motionDisabled) {
    gsap.killTweensOf(cluster);
    gsap.set(cluster, {
      clearProps: "opacity,transform,filter,willChange",
    });

    const cards = cluster.querySelectorAll<HTMLElement>(
      "[data-technology-cluster-card]",
    );

    if (cards.length > 0) {
      gsap.killTweensOf(cards);
      gsap.set(cards, {
        clearProps: "opacity,transform,filter,willChange",
      });
    }

    return;
  }

  gsap.killTweensOf(cluster);

  gsap.to(cluster, {
    duration: 0.32,
    ease: "power2.out",
    scale: isActive ? 1 : 0.992,
    autoAlpha: isActive ? 1 : 0.9,
    overwrite: "auto",
  });

  const cards = cluster.querySelectorAll<HTMLElement>(
    "[data-technology-cluster-card]",
  );

  if (cards.length === 0) {
    return;
  }

  gsap.killTweensOf(cards);

  gsap.to(cards, {
    duration: 0.32,
    ease: "power2.out",
    y: isActive ? -3 : 0,
    scale: isActive ? 1.008 : 1,
    stagger: 0.015,
    overwrite: "auto",
  });
}

export function useTechnologiesDesktopMotion({
  rootRef,
  clustersStackRef,
  activeClusterId,
  enabled = true,
}: UseTechnologiesDesktopMotionParams): void {
  useLayoutEffect(() => {
    const root = rootRef.current;
    const clustersStack = clustersStackRef.current;

    if (!root || !clustersStack || !enabled) {
      return;
    }

    const { gsap, ScrollTrigger } = ensureGsapRuntime();
    const clusters = getClusterElements(clustersStack);

    if (clusters.length === 0) {
      return;
    }

    const motionDisabled =
      prefersReducedMotion() ||
      shouldDisableScrollFades() ||
      !isDesktopViewport();

    if (motionDisabled) {
      clearClusterInlineStyles(gsap, clusters);
      return;
    }

    const ctx = gsap.context(() => {
      clusters.forEach((cluster) => {
        setupClusterMotion(gsap, cluster);
      });

      ScrollTrigger.sort();
      refreshScrollRuntime();
    }, root);

    const handleResize = () => {
      refreshScrollRuntime();
    };

    if ("addEventListener" in globalThis) {
      globalThis.addEventListener("resize", handleResize, { passive: true });
    }

    return () => {
      if ("removeEventListener" in globalThis) {
        globalThis.removeEventListener("resize", handleResize);
      }

      ctx.revert();
      clearClusterInlineStyles(gsap, clusters);
    };
  }, [rootRef, clustersStackRef, enabled]);

  useLayoutEffect(() => {
    const clustersStack = clustersStackRef.current;

    if (!clustersStack) {
      return;
    }

    const { gsap } = ensureGsapRuntime();
    const clusters = getClusterElements(clustersStack);

    if (clusters.length === 0) {
      return;
    }

    const motionDisabled =
      prefersReducedMotion() ||
      shouldDisableScrollFades() ||
      !isDesktopViewport();

    clusters.forEach((cluster) => {
      syncClusterActiveState(gsap, cluster, activeClusterId, motionDisabled);
    });
  }, [activeClusterId, clustersStackRef]);
}

export default useTechnologiesDesktopMotion;
