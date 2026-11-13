// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianResidentPoolRuntime.slots.ts

import {
  isHomeDrivePedestrianResidentPoolAgent,
} from "./homeDrive.pedestrianResidentPool";
import {
  createHomeDrivePedestrianResidentPoolPlacement,
} from "./homeDrive.pedestrianResidentPoolPlacement";
import {
  createHomeDrivePedestrianBehaviorAssignment,
  getHomeDrivePedestrianBaseSpeedMps,
} from "./homeDrive.pedestrianBehaviors";
import type {
  HomeDrivePedestrianResidentPoolAgentFrame,
  HomeDrivePedestrianResidentPoolSlot,
  HomeDrivePedestrianResidentPoolUpdateOptions,
} from "./homeDrive.pedestrianResidentPool.types";
import type {
  HomeDrivePedestrianResidentPoolRuntime,
  HomeDrivePedestrianResidentPoolRuntimeResult,
} from "./homeDrive.pedestrianResidentPoolRuntime.types";
import type { HomeDrivePedestrianAgent } from "./homeDrive.pedestrians.types";

export function updateAgentForSlot(params: Readonly<{

  agent: HomeDrivePedestrianAgent;

  slot: HomeDrivePedestrianResidentPoolSlot;

  elapsedSeconds: number;

  generation: number;

}>): HomeDrivePedestrianAgent {

  const { agent, slot, elapsedSeconds, generation } = params;

  const baseSpeedMps = getHomeDrivePedestrianBaseSpeedMps(

    agent.role,

    agent.appearance.walkStyleKey,

    agent.seed,

  );

  const behavior = createHomeDrivePedestrianBehaviorAssignment({

    role: agent.role,

    zone: slot.zone,

    seed: agent.seed,

    baseSpeedMps,

    existingProps: agent.props,

    behaviorHint: "walk",

  });



  return {

    ...agent,

    groupKind: "solo",

    handHoldTargetId: null,

    behavior: behavior.behavior,

    animationKey: behavior.animationKey,

    props: behavior.props,

    zoneId: slot.zoneId,

    segmentId: slot.segmentId,

    sidewalkSide: slot.side,

    progress: slot.progress,

    directionSign: slot.directionSign,

    position: slot.position,

    headingRad: slot.headingRad,

    speedMps: behavior.targetSpeedMps,

    baseSpeedMps,

    targetSpeedMps: behavior.targetSpeedMps,

    lateralOffsetMeters: slot.lateralOffsetMeters,

    forwardOffsetMeters: 0,

    behaviorElapsedSeconds: 0,

    behaviorDurationSeconds: behavior.durationSeconds,

    animationPhase: (agent.animationPhase + 0.37) % (Math.PI * 2),

    crosswalkId: null,

    crossingDirection: undefined,

    crossingProgress: undefined,

    crossingStartedAtSeconds: undefined,

    crossingDurationSeconds: undefined,

    crossingStart: undefined,

    crossingEnd: undefined,

    residentPoolId: agent.residentPoolId ?? agent.id,

    residentPoolSlotId: slot.id,

    residentPoolTeleportedAtSeconds: elapsedSeconds,

    residentPoolGeneration: generation,

    activationBand: slot.band === "front" ? "far" : "horizon",

    relocationSource: "resident-pool",

    lastRelocatedAtSeconds: elapsedSeconds,

    relocationGeneration: generation,

    relocationSlotId: slot.id,

    relocationForwardMeters: slot.forwardMeters,

  };

}



export function getReusableAgents(

  poolAgents: readonly HomeDrivePedestrianAgent[],

  framesById: ReadonlyMap<string, HomeDrivePedestrianResidentPoolAgentFrame>,

): readonly HomeDrivePedestrianAgent[] {

  return [...poolAgents]

    .filter((agent) => {

      const frame = framesById.get(agent.id);

      return frame && !frame.protected && (frame.status === "behind" || frame.status === "side" || frame.status === "far");

    })

    .sort((first, second) => {

      const firstFrame = framesById.get(first.id);

      const secondFrame = framesById.get(second.id);

      const firstScore =

        (firstFrame?.status === "behind" ? 10000 : 0) +

        (firstFrame?.absoluteLateralMeters ?? 0) * 8 +

        Math.abs(firstFrame?.forwardMeters ?? 0);

      const secondScore =

        (secondFrame?.status === "behind" ? 10000 : 0) +

        (secondFrame?.absoluteLateralMeters ?? 0) * 8 +

        Math.abs(secondFrame?.forwardMeters ?? 0);



      if (Math.abs(firstScore - secondScore) > 0.0001) {

        return secondScore - firstScore;

      }



      return first.id.localeCompare(second.id);

    });

}



export function pickTargetSlots(

  slots: readonly HomeDrivePedestrianResidentPoolSlot[],

  usedSlotIds: ReadonlySet<string>,

): readonly HomeDrivePedestrianResidentPoolSlot[] {

  const unused = slots.filter((slot) => !usedSlotIds.has(slot.id));



  return [...(unused.length > 0 ? unused : slots)].sort((first, second) => {

    if (first.band !== second.band) {

      const rank = { front: 0, far: 1, horizon: 2 } as const;

      return rank[first.band] - rank[second.band];

    }



    if (Math.abs(first.priority - second.priority) > 0.0001) {

      return second.priority - first.priority;

    }



    return first.id.localeCompare(second.id);

  });

}



export function createEmptyRuntime(previous?: HomeDrivePedestrianResidentPoolRuntime): HomeDrivePedestrianResidentPoolRuntime {

  return {

    generation: previous?.generation ?? 0,

    poolAgentIds: previous?.poolAgentIds ?? [],

    lastTeleportAtSecondsByAgentId: previous?.lastTeleportAtSecondsByAgentId ?? {},

    lastSlotIdByAgentId: previous?.lastSlotIdByAgentId ?? {},

    lastDiagnostics: previous?.lastDiagnostics,
    bootLocked: previous?.bootLocked ?? false,
    lockedPoolSize: previous?.lockedPoolSize,
    lockedPoolAgentIds: previous?.lockedPoolAgentIds ?? [],
    createdAtBootCount: previous?.createdAtBootCount ?? 0,
    runtimeSpawnViolationCount: previous?.runtimeSpawnViolationCount ?? 0,
    lastRuntimeSpawnViolationAtSeconds:
      previous?.lastRuntimeSpawnViolationAtSeconds,
    lastRuntimeSpawnViolationMessage:
      previous?.lastRuntimeSpawnViolationMessage,

  };

}



// ramo do pool desligado ou sem slots: devolve os residentes como estão
export function createDisabledResidentPoolResult(
  options: HomeDrivePedestrianResidentPoolUpdateOptions,
  runtime: HomeDrivePedestrianResidentPoolRuntime,
  placement: ReturnType<typeof createHomeDrivePedestrianResidentPoolPlacement>,
): HomeDrivePedestrianResidentPoolRuntimeResult {

  const fallbackAgents = options.agents.filter(isHomeDrivePedestrianResidentPoolAgent);

  const diagnostics = {

    id: `resident-pool:disabled:${Math.round(options.elapsedSeconds * 10)}`,

    enabled: options.config.enabled,

    elapsedSeconds: options.elapsedSeconds,

    activeSpeedMps: options.activeSpeedMps,

    requestedPoolSize: options.config.size,

    finalAgentCount: fallbackAgents.length,

    createdAgentCount: 0,

    reusedAgentCount: fallbackAgents.length,

    teleportedAgentCount: 0,

    protectedAgentCount: 0,

    frontAgentCount: 0,

    farAgentCount: 0,

    behindAgentCount: 0,

    sideAgentCount: 0,

    recyclableAgentCount: 0,

    slotCount: placement.slots.length,

    frontSlotCount: placement.frontSlotCount,

    farSlotCount: placement.farSlotCount,

    horizonSlotCount: placement.horizonSlotCount,

    reason: placement.slots.length <= 0 ? "no-slots" : "disabled",

  };



  return {

    agents: fallbackAgents,

    runtime: {

      ...runtime,

      lastDiagnostics: diagnostics,

    },

    diagnostics,

    createdAgentCount: 0,

    reusedAgentCount: fallbackAgents.length,

    teleportedAgentCount: 0,

  };

}
