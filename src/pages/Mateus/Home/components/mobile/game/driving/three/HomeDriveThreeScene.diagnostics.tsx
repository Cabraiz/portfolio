// src/pages/Mateus/Home/components/mobile/game/driving/three/HomeDriveThreeScene.diagnostics.tsx

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type {
	HomeDriveBuildingCollisionRuntimeState,
} from "../domain/buildingCollisions";
import {
	createHomeDriveRuntimeDiagnosticsSnapshot,
	flushHomeDriveRuntimeProfilerSnapshot,
	type HomeDriveRuntimeDiagnosticsSnapshot,
	type HomeDriveRuntimeProfilerState,
} from "../domain/diagnostics";
import type { HomeDriveBuilding } from "../domain/homeDrive.building.types";
import {
	HOME_DRIVE_RUNTIME_DIAGNOSTICS_SAMPLE_HZ,
} from "../domain/homeDrive.globalDebugFlags";
import type {
	HomeDriveTrafficRuntimeState,
} from "../domain/homeDrive.traffic.types";
import type { HomeDriveRuntimeState } from "../domain/homeDrive.types";
import type {
	HomeDriveParkedVehicleRuntimeState,
} from "../domain/parkedVehicles";
import type { HomeDrivePedestrianRuntimeState } from "../domain/pedestrians";
import type { HomeDriveMutableRef } from "./HomeDriveThreeScene.types";

type HomeDriveThreeDiagnosticsSamplerProps = Readonly<{
  runtimeRef: HomeDriveMutableRef<HomeDriveRuntimeState>;
  trafficRef: HomeDriveMutableRef<HomeDriveTrafficRuntimeState>;
  parkedVehiclesRef: HomeDriveMutableRef<HomeDriveParkedVehicleRuntimeState>;
  buildings: readonly HomeDriveBuilding[];
  buildingCollisionsRef: HomeDriveMutableRef<HomeDriveBuildingCollisionRuntimeState>;
  pedestriansRef: HomeDriveMutableRef<HomeDrivePedestrianRuntimeState>;
  runtimeProfilerRef: HomeDriveMutableRef<HomeDriveRuntimeProfilerState>;
  onDiagnosticsSnapshot: (snapshot: HomeDriveRuntimeDiagnosticsSnapshot) => void;
}>;

function getNowMs(): number {
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return performance.now();
  }

  return Date.now();
}

export function HomeDriveThreeBootReadinessProbe({
  minFrames,
  minElapsedMs,
  onReady,
}: Readonly<{
  minFrames: number;
  minElapsedMs: number;
  onReady?: () => void;
}>) {
  const startedAtMsRef = useRef(getNowMs());
  const frameCountRef = useRef(0);
  const didReportRef = useRef(false);

  useFrame(() => {
    if (!onReady || didReportRef.current) {
      return;
    }

    frameCountRef.current += 1;

    const elapsedMs = getNowMs() - startedAtMsRef.current;

    if (frameCountRef.current < minFrames || elapsedMs < minElapsedMs) {
      return;
    }

    didReportRef.current = true;
    onReady();
  });

  return null;
}

export function HomeDriveThreeDiagnosticsSampler({
  runtimeRef,
  trafficRef,
  parkedVehiclesRef,
  buildings,
  buildingCollisionsRef,
  pedestriansRef,
  runtimeProfilerRef,
  onDiagnosticsSnapshot,
}: HomeDriveThreeDiagnosticsSamplerProps) {
  const { gl } = useThree();
  const smoothedFpsRef = useRef(60);
  const lastPublishAtMsRef = useRef(0);
  const sampleIntervalMs =
    1000 / Math.max(1, HOME_DRIVE_RUNTIME_DIAGNOSTICS_SAMPLE_HZ);

  useFrame((_, deltaSeconds) => {
    const nowMs = getNowMs();
    const instantFps = deltaSeconds > 0 ? 1 / deltaSeconds : smoothedFpsRef.current;

    smoothedFpsRef.current =
      smoothedFpsRef.current * 0.84 + instantFps * 0.16;

    if (nowMs - lastPublishAtMsRef.current < sampleIntervalMs) {
      return;
    }

    lastPublishAtMsRef.current = nowMs;

    onDiagnosticsSnapshot(
      createHomeDriveRuntimeDiagnosticsSnapshot({
        sampledAtMs: nowMs,
        fps: smoothedFpsRef.current,
        frameTimeMs: deltaSeconds * 1000,
        runtime: runtimeRef.current,
        traffic: trafficRef.current,
        parkedVehicles: parkedVehiclesRef.current,
        pedestrians: pedestriansRef.current,
        buildings,
        buildingCollisions: buildingCollisionsRef.current,
        renderer: {
          memory: {
            geometries: gl.info.memory.geometries,
            textures: gl.info.memory.textures,
          },
          render: {
            calls: gl.info.render.calls,
            triangles: gl.info.render.triangles,
            points: gl.info.render.points,
            lines: gl.info.render.lines,
          },
        },
        profiler: flushHomeDriveRuntimeProfilerSnapshot(
          runtimeProfilerRef.current,
          nowMs,
        ),
      }),
    );
  });

  return null;
}
