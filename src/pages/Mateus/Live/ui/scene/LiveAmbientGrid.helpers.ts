// Helpers puros da grade de fundo do Live

import type { LiveSceneDensity } from "../../domain/live.types";

function joinClassNames(
  ...classNames: Array<string | false | null | undefined>
): string {
  return classNames.filter(Boolean).join(" ");
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function buildSequence(length: number): number[] {
  return Array.from({ length }, (_, index) => index);
}

function resolveColumns(density: LiveSceneDensity, explicit?: number): number {
  if (typeof explicit === "number" && explicit > 0) {
    return explicit;
  }

  switch (density) {
    case "calm":
      return 10;
    case "dense":
      return 16;
    case "balanced":
    default:
      return 13;
  }
}

function resolveRows(density: LiveSceneDensity, explicit?: number): number {
  if (typeof explicit === "number" && explicit > 0) {
    return explicit;
  }

  switch (density) {
    case "calm":
      return 6;
    case "dense":
      return 10;
    case "balanced":
    default:
      return 8;
  }
}

function resolvePulseCount(density: LiveSceneDensity, explicit?: number): number {
  if (typeof explicit === "number" && explicit >= 0) {
    return explicit;
  }

  switch (density) {
    case "calm":
      return 2;
    case "dense":
      return 5;
    case "balanced":
    default:
      return 3;
  }
}

export {
  buildSequence,
  clamp,
  joinClassNames,
  resolveColumns,
  resolvePulseCount,
  resolveRows,
};
