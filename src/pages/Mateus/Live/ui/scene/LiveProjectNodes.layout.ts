// Posição e cor dos nós de projeto na cena

import {
  LIVE_PROJECT_STATUS_ORDER,
  LIVE_SCENE_DENSITY_WEIGHTS,
} from "../../domain/live.constants";
import { getLiveProjectHealthTone } from "../../domain/live.helpers";
import type {
  LiveProjectRecord,
  LiveSceneDensity,
} from "../../domain/live.types";

type PositionedProjectNode = Readonly<{
  project: LiveProjectRecord;
  angleDeg: number;
  radiusPercent: number;
  sizePx: number;
  xPercent: number;
  yPercent: number;
  zIndex: number;
}>;

function joinClassNames(
  ...classNames: Array<string | false | null | undefined>
): string {
  return classNames.filter(Boolean).join(" ");
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function resolveToneColor(project: LiveProjectRecord): string {
  switch (getLiveProjectHealthTone(project.healthScore)) {
    case "success":
      return "rgba(52, 211, 153, 0.92)";
    case "warning":
      return "rgba(251, 191, 36, 0.94)";
    case "info":
      return "rgba(96, 165, 250, 0.92)";
    case "neutral":
    default:
      return "rgba(167, 139, 250, 0.9)";
  }
}

function buildNodeLayout(
  projects: readonly LiveProjectRecord[],
  density: LiveSceneDensity,
): readonly PositionedProjectNode[] {
  const densityWeight = LIVE_SCENE_DENSITY_WEIGHTS[density];
  const safeTotal = Math.max(projects.length, 1);

  return projects.map((project, index) => {
    const angleDeg = -90 + (360 / safeTotal) * index;
    const angleRad = (angleDeg * Math.PI) / 180;
    const tier = index % 2 === 0 ? 0 : 1;

    const radiusPercent =
      density === "dense"
        ? 33 + tier * 10
        : density === "calm"
          ? 28 + tier * 8
          : 31 + tier * 9;

    const isFeatured = Boolean(project.featured);
    const sizePx = Math.round((isFeatured ? 142 : 124) * densityWeight);

    const xPercent = 50 + Math.cos(angleRad) * radiusPercent;
    const yPercent = 50 + Math.sin(angleRad) * (radiusPercent * 0.72);

    return {
      project,
      angleDeg,
      radiusPercent,
      sizePx,
      xPercent,
      yPercent,
      zIndex:
        10_000 -
        LIVE_PROJECT_STATUS_ORDER[project.status] * 100 -
        index * 10 +
        Math.round(project.healthScore),
    };
  });
}

export { buildNodeLayout, clamp, joinClassNames, resolveToneColor };
