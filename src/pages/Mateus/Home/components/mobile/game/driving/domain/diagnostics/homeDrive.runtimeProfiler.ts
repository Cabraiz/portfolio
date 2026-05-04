// src/pages/Mateus/Home/components/mobile/game/driving/domain/diagnostics/homeDrive.runtimeProfiler.ts

import type {
  HomeDriveRuntimeProfilerSectionAccumulator,
  HomeDriveRuntimeProfilerSectionKey,
  HomeDriveRuntimeProfilerSectionSnapshot,
  HomeDriveRuntimeProfilerSnapshot,
  HomeDriveRuntimeProfilerState,
} from "./homeDrive.runtimeProfiler.types";

const SECTION_LABELS: Readonly<Record<HomeDriveRuntimeProfilerSectionKey, string>> =
  Object.freeze({
    physics: "Física/player",
    pedestrians: "Pedestres",
    traffic: "Carros andando",
    parkedVehicles: "Carros parados",
    urbanFixtures: "Postes/semaforos",
    buildings: "Prédios/dano",
  });

const SECTION_ORDER: readonly HomeDriveRuntimeProfilerSectionKey[] = Object.freeze([
  "physics",
  "traffic",
  "parkedVehicles",
  "pedestrians",
  "urbanFixtures",
  "buildings",
]);

function getNowMs(): number {
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return performance.now();
  }

  return Date.now();
}

function round(value: number, precision = 2): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const factor = 10 ** precision;

  return Math.round(value * factor) / factor;
}

function getSectionAccumulator(
  profiler: HomeDriveRuntimeProfilerState,
  key: HomeDriveRuntimeProfilerSectionKey,
): HomeDriveRuntimeProfilerSectionAccumulator {
  const current = profiler.sections[key];

  if (current) {
    return current;
  }

  const next: HomeDriveRuntimeProfilerSectionAccumulator = {
    key,
    label: SECTION_LABELS[key],
    sampleCount: 0,
    totalMs: 0,
    maxMs: 0,
  };

  profiler.sections[key] = next;

  return next;
}

export function createHomeDriveRuntimeProfilerState(): HomeDriveRuntimeProfilerState {
  return {
    windowStartedAtMs: getNowMs(),
    totalMeasuredMs: 0,
    sections: {},
  };
}

export function recordHomeDriveRuntimeProfilerSection(
  profiler: HomeDriveRuntimeProfilerState | undefined,
  key: HomeDriveRuntimeProfilerSectionKey,
  elapsedMs: number,
): void {
  if (!profiler || !Number.isFinite(elapsedMs) || elapsedMs <= 0) {
    return;
  }

  const section = getSectionAccumulator(profiler, key);

  section.sampleCount += 1;
  section.totalMs += elapsedMs;
  section.maxMs = Math.max(section.maxMs, elapsedMs);
  profiler.totalMeasuredMs += elapsedMs;
}

export function measureHomeDriveRuntimeProfilerSection<T>(
  profiler: HomeDriveRuntimeProfilerState | undefined,
  key: HomeDriveRuntimeProfilerSectionKey,
  callback: () => T,
): T {
  if (!profiler) {
    return callback();
  }

  const startedAtMs = getNowMs();

  try {
    return callback();
  } finally {
    recordHomeDriveRuntimeProfilerSection(
      profiler,
      key,
      Math.max(0, getNowMs() - startedAtMs),
    );
  }
}

function createSectionSnapshot(
  section: HomeDriveRuntimeProfilerSectionAccumulator,
  totalMeasuredMs: number,
): HomeDriveRuntimeProfilerSectionSnapshot {
  const sampleCount = Math.max(0, section.sampleCount);
  const totalMs = Math.max(0, section.totalMs);
  const sharePercent =
    totalMeasuredMs > 0 ? (totalMs / totalMeasuredMs) * 100 : 0;

  return {
    key: section.key,
    label: section.label,
    sampleCount,
    totalMs: round(totalMs, 2),
    avgMs: sampleCount > 0 ? round(totalMs / sampleCount, 3) : 0,
    maxMs: round(section.maxMs, 2),
    sharePercent: round(sharePercent, 1),
  };
}

export function flushHomeDriveRuntimeProfilerSnapshot(
  profiler: HomeDriveRuntimeProfilerState | undefined,
  sampledAtMs: number = getNowMs(),
): HomeDriveRuntimeProfilerSnapshot | null {
  if (!profiler) {
    return null;
  }

  const totalMeasuredMs = Math.max(0, profiler.totalMeasuredMs);
  const sections = SECTION_ORDER.map((key) => profiler.sections[key])
    .filter((section): section is HomeDriveRuntimeProfilerSectionAccumulator =>
      Boolean(section),
    )
    .map((section) => createSectionSnapshot(section, totalMeasuredMs));

  const snapshot: HomeDriveRuntimeProfilerSnapshot = {
    sampledAtMs,
    windowMs: round(Math.max(0, sampledAtMs - profiler.windowStartedAtMs), 1),
    totalMeasuredMs: round(totalMeasuredMs, 2),
    sections,
  };

  profiler.windowStartedAtMs = sampledAtMs;
  profiler.totalMeasuredMs = 0;
  profiler.sections = {};

  return snapshot;
}
