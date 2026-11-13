// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianResidentPoolViewportRuntime.slots.ts
// Atualização do agente no slot do viewport.

import {
  createHomeDrivePedestrianBehaviorAssignment,
  getHomeDrivePedestrianBaseSpeedMps,
} from "./homeDrive.pedestrianBehaviors";
import type { HomeDrivePedestrianResidentPoolSlot } from "./homeDrive.pedestrianResidentPool.types";
import type { HomeDrivePedestrianAgent } from "./homeDrive.pedestrians.types";

export function getAgentViewportBandKey(agent: HomeDrivePedestrianAgent): string {

  return agent.residentViewportBand ?? "unassigned";

}



export function updateAgentForViewportSlot(params: Readonly<{

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

  const viewportBand = slot.band as HomeDrivePedestrianAgent["residentViewportBand"];



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

    animationPhase: (agent.animationPhase + 0.31) % (Math.PI * 2),

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

    residentViewportBand: viewportBand,

    residentViewportSlotId: slot.id,

    lastViewportTeleportAtSeconds: elapsedSeconds,

    viewportOccupancyGeneration: generation,

    activationBand:

      viewportBand === "visible-near" || viewportBand === "visible-mid"

        ? "near"

        : viewportBand === "visible-far"

          ? "mid"

          : "far",

    relocationSource: "resident-viewport",

    lastRelocatedAtSeconds: elapsedSeconds,

    relocationGeneration: generation,

    relocationSlotId: slot.id,

    relocationForwardMeters: slot.forwardMeters,

  };

}
