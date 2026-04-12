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
  ornaments: HTMLElement[];
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
    ornaments: Array.from(
      cluster.querySelectorAll<HTMLElement>("[data-technology-cluster-ornament]"),
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

    gsap.set(
      [
        targets.root,
        targets.header,
        targets.legend,
        ...targets.cards,
        ...targets.badges,
        ...targets.ornaments,
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
    transformPerspective: 1200,
    transformStyle: "preserve-3d",
  });

  if (targets.header) {
    gsap.set(targets.header, {
      autoAlpha: 0,
      y: 28,
      willChange: "transform, opacity",
      force3D: true,
    });
  }

  if (targets.legend) {
    gsap.set(targets.legend, {
      autoAlpha: 0,
      y: 18,
      willChange: "transform, opacity",
      force3D: true,
    });
  }

  if (targets.badges.length > 0) {
    gsap.set(targets.badges, {
      autoAlpha: 0,
      y: 14,
      scale: 0.96,
      willChange: "transform, opacity",
      force3D: true,
    });
  }

  if (targets.cards.length > 0) {
    gsap.set(targets.cards, {
      autoAlpha: 0,
      y: 34,
      scale: 0.94,
      rotateX: 5,
      transformOrigin: "50% 70%",
      willChange: "transform, opacity",
      force3D: true,
    });
  }

  if (targets.ornaments.length > 0) {
    gsap.set(targets.ornaments, {
      y: 0,
      autoAlpha: 0.55,
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
      duration: 0.78,
      ease: "power3.out",
      overwrite: "auto",
    },
    scrollTrigger: {
      trigger: targets.root,
      start: "top 82%",
      end: "bottom 26%",
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
      0.06,
    );
  }

  if (targets.badges.length > 0) {
    introTimeline.to(
      targets.badges,
      {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        stagger: 0.035,
      },
      0.1,
    );
  }

  if (targets.cards.length > 0) {
    introTimeline.to(
      targets.cards,
      {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        rotateX: 0,
        stagger: 0.065,
        duration: 0.84,
      },
      0.14,
    );
  }

  introTimeline.add(() => {
    clearWillChange(introTargets);
  });
}

function createParallaxTimeline(
  gsap: typeof import("gsap").default,
  targets: RevealTargets,
  clusterIndex: number,
): void {
  if (targets.ornaments.length === 0 && targets.cards.length === 0) {
    return;
  }

  const parallaxTimeline = gsap.timeline({
    defaults: {
      ease: "none",
      overwrite: "auto",
    },
    scrollTrigger: {
      trigger: targets.root,
      start: "top bottom",
      end: "bottom top",
      scrub: 0.8,
      invalidateOnRefresh: true,
    },
  });

  if (targets.ornaments.length > 0) {
    parallaxTimeline.to(
      targets.ornaments,
      {
        y: () => gsap.utils.random(-18, 18),
        autoAlpha: 0.8,
        stagger: 0.04,
      },
      0,
    );
  }

  if (targets.cards.length > 0) {
    parallaxTimeline.to(
      targets.cards,
      {
        y: () => -10 - clusterIndex * 1.5,
        stagger: 0.035,
      },
      0,
    );
  }
}

function setupClusterMotion(
  gsap: typeof import("gsap").default,
  cluster: HTMLElement,
  clusterIndex: number,
): void {
  const targets = getRevealTargets(cluster);

  setInitialRevealState(gsap, targets);
  createIntroTimeline(gsap, targets);
  createParallaxTimeline(gsap, targets, clusterIndex);
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
    gsap.set(cluster, {
      clearProps: "opacity,transform,filter,willChange",
    });

    return;
  }

  gsap.to(cluster, {
    duration: 0.42,
    ease: "power2.out",
    scale: isActive ? 1 : 0.985,
    autoAlpha: isActive ? 1 : 0.82,
    filter: isActive ? "saturate(1)" : "saturate(0.82)",
    overwrite: "auto",
  });

  const cards = cluster.querySelectorAll<HTMLElement>(
    "[data-technology-cluster-card]",
  );

  if (cards.length === 0) {
    return;
  }

  gsap.to(cards, {
    duration: 0.42,
    ease: "power2.out",
    y: isActive ? -4 : 0,
    scale: isActive ? 1.012 : 1,
    stagger: 0.018,
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
      clusters.forEach((cluster, index) => {
        setupClusterMotion(gsap, cluster, index);
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
