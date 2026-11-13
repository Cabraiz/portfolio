// src/pages/Mateus/Home/components/mobile/game/driving/three/HomeDriveThreeSimulation.tsx


import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { HomeDriveRuntimeState } from "../domain/homeDrive.types";
import { getHomeDrivePedestrianSimulationStepSeconds } from "../domain/pedestrians/homeDrive.pedestrianPerformance";
import { measureHomeDriveRuntimeProfilerSection } from "../domain/diagnostics";

import {
  DEFAULT_SNAPSHOT_HZ,
  FIXED_STEP_SECONDS,
  MAX_ACCUMULATED_SECONDS,
  MAX_STEPS_PER_FRAME,
  sanitizeDeltaSeconds,
} from "./HomeDriveThreeSimulation/simulationShared";
import type {
  HomeDriveThreeSimulationProps,
} from "./HomeDriveThreeSimulation/simulationShared";
import {
  tickPedestrianImpactVisualFrame,
  tickPedestriansStep,
} from "./HomeDriveThreeSimulation/simulationPedestrians";
import { tickSimulationStep } from "./HomeDriveThreeSimulation/simulationStep";

export type {
  HomeDriveThreeSimulationProps,
} from "./HomeDriveThreeSimulation/simulationShared";

function getImpactSerial(runtime: HomeDriveRuntimeState): number | null {

  const serial = runtime.impact?.serial;


  return typeof serial === "number" && Number.isFinite(serial) ? serial : null;

}


export default function HomeDriveThreeSimulation({

  runtimeRef,

  inputRef,

  trafficRef,

  parkedVehiclesRef,

  urbanFixtureCollisionsRef,

  urbanStreetLights,

  buildingCollisionsRef,

  buildings,

  pedestriansRef,

  crosswalksRef,

  pedestrianPerformance,

  isPortrait = true,

  enabled = true,

  publishRuntimeSnapshot,

  snapshotHz = DEFAULT_SNAPSHOT_HZ,

  runtimeProfilerRef,

}: HomeDriveThreeSimulationProps) {

  const accumulatorRef = useRef(0);

  const snapshotAccumulatorRef = useRef(0);

  const pedestrianAccumulatorRef = useRef(0);

  const pedestrianTickIndexRef = useRef(0);

  const lastPublishedImpactSerialRef = useRef<number | null>(null);


  useFrame((_, rawDeltaSeconds) => {

    if (!enabled) {

      accumulatorRef.current = 0;

      snapshotAccumulatorRef.current = 0;

      pedestrianAccumulatorRef.current = 0;

      return;

    }


    const deltaSeconds = sanitizeDeltaSeconds(rawDeltaSeconds);


    if (deltaSeconds <= 0) {

      return;

    }


    accumulatorRef.current = Math.min(

      accumulatorRef.current + deltaSeconds,

      MAX_ACCUMULATED_SECONDS,

    );


    let steps = 0;

    let hadCollisionThisFrame = false;


    while (

      accumulatorRef.current >= FIXED_STEP_SECONDS &&

      steps < MAX_STEPS_PER_FRAME

    ) {

      const stepResult = tickSimulationStep(

        runtimeRef.current,

        inputRef.current,

        trafficRef,

        parkedVehiclesRef,

        pedestriansRef,

        urbanFixtureCollisionsRef,

        urbanStreetLights,

        buildingCollisionsRef,

        buildings,

        crosswalksRef,

        runtimeProfilerRef,

        isPortrait,

      );


      runtimeRef.current = stepResult.runtime;

      hadCollisionThisFrame = hadCollisionThisFrame || stepResult.hadCollision;


      const pedestrianStepSeconds = pedestrianPerformance

        ? getHomeDrivePedestrianSimulationStepSeconds(pedestrianPerformance)

        : FIXED_STEP_SECONDS;


      pedestrianAccumulatorRef.current += FIXED_STEP_SECONDS;


      while (pedestrianAccumulatorRef.current >= pedestrianStepSeconds) {

        pedestrianTickIndexRef.current += 1;


        measureHomeDriveRuntimeProfilerSection(

          runtimeProfilerRef?.current,

          "pedestrians",

          () => {

            tickPedestriansStep(

              pedestriansRef,

              crosswalksRef,

              runtimeRef.current,

              pedestrianStepSeconds,

              pedestrianTickIndexRef.current,

              pedestrianPerformance,

            );

          },

        );


        pedestrianAccumulatorRef.current -= pedestrianStepSeconds;

      }


      accumulatorRef.current -= FIXED_STEP_SECONDS;

      steps += 1;

    }


    if (steps >= MAX_STEPS_PER_FRAME) {

      accumulatorRef.current = 0;

      pedestrianAccumulatorRef.current = 0;

    }


    measureHomeDriveRuntimeProfilerSection(

      runtimeProfilerRef?.current,

      "pedestrians",

      () => {

        tickPedestrianImpactVisualFrame(

          pedestriansRef,

          runtimeRef.current,

          accumulatorRef.current,

        );

      },

    );


    if (!publishRuntimeSnapshot) {

      return;

    }


    const currentImpactSerial = getImpactSerial(runtimeRef.current);

    const hasNewImpactSerial =

      currentImpactSerial !== null &&

      currentImpactSerial !== lastPublishedImpactSerialRef.current;


    if (hadCollisionThisFrame || hasNewImpactSerial) {

      lastPublishedImpactSerialRef.current = currentImpactSerial;

      snapshotAccumulatorRef.current = 0;

      publishRuntimeSnapshot();

      return;

    }


    const safeSnapshotHz = Math.max(1, Math.min(snapshotHz, 8));

    const snapshotIntervalSeconds = 1 / safeSnapshotHz;


    snapshotAccumulatorRef.current += deltaSeconds;


    if (snapshotAccumulatorRef.current < snapshotIntervalSeconds) {

      return;

    }


    snapshotAccumulatorRef.current = 0;

    lastPublishedImpactSerialRef.current = currentImpactSerial;

    publishRuntimeSnapshot();

  });


  return null;

}
