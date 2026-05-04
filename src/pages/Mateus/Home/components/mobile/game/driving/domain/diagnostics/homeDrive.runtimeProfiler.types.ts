// src/pages/Mateus/Home/components/mobile/game/driving/domain/diagnostics/homeDrive.runtimeProfiler.types.ts

export type HomeDriveRuntimeProfilerSectionKey =
  | "physics"
  | "pedestrians"
  | "traffic"
  | "parkedVehicles"
  | "urbanFixtures"
  | "buildings";

export type HomeDriveRuntimeProfilerSectionAccumulator = {
  key: HomeDriveRuntimeProfilerSectionKey;
  label: string;
  sampleCount: number;
  totalMs: number;
  maxMs: number;
};

export type HomeDriveRuntimeProfilerState = {
  windowStartedAtMs: number;
  totalMeasuredMs: number;
  sections: Partial<
    Record<
      HomeDriveRuntimeProfilerSectionKey,
      HomeDriveRuntimeProfilerSectionAccumulator
    >
  >;
};

export type HomeDriveRuntimeProfilerSectionSnapshot = Readonly<{
  key: HomeDriveRuntimeProfilerSectionKey;
  label: string;
  sampleCount: number;
  totalMs: number;
  avgMs: number;
  maxMs: number;
  sharePercent: number;
}>;

export type HomeDriveRuntimeProfilerSnapshot = Readonly<{
  sampledAtMs: number;
  windowMs: number;
  totalMeasuredMs: number;
  sections: readonly HomeDriveRuntimeProfilerSectionSnapshot[];
}>;
