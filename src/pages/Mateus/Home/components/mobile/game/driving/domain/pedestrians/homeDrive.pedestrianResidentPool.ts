// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianResidentPool.ts

import { createHomeDrivePedestrianBehaviorAssignment, getHomeDrivePedestrianBaseSpeedMps } from "./homeDrive.pedestrianBehaviors";
import { createHomeDrivePedestrianAppearance, createHomeDrivePedestrianSeed, seededRange } from "./homeDrive.pedestrianRandom";
import type {
  HomeDrivePedestrianAgent,
  HomeDrivePedestrianRole,
} from "./homeDrive.pedestrians.types";
import type {
  HomeDrivePedestrianResidentPoolCreationOptions,
  HomeDrivePedestrianResidentPoolSlot,
} from "./homeDrive.pedestrianResidentPool.types";

const RESIDENT_ROLES: readonly HomeDrivePedestrianRole[] = [
  "adult",
  "shopper",
  "worker",
  "elder",
  "runner",
  "parent",
  "adult",
  "shopper",
];

function getResidentRole(index: number): HomeDrivePedestrianRole {
  return RESIDENT_ROLES[index % RESIDENT_ROLES.length];
}

function getSlotForIndex(
  slots: readonly HomeDrivePedestrianResidentPoolSlot[],
  index: number,
): HomeDrivePedestrianResidentPoolSlot | null {
  if (slots.length <= 0) {
    return null;
  }

  return slots[index % slots.length];
}

export function createHomeDrivePedestrianResidentPoolAgents(
  options: HomeDrivePedestrianResidentPoolCreationOptions,
): readonly HomeDrivePedestrianAgent[] {
  const agents: HomeDrivePedestrianAgent[] = [];

  for (let index = 0; index < options.poolSize; index += 1) {
    const slot = getSlotForIndex(options.slots, index);

    if (!slot) {
      break;
    }

    const role = getResidentRole(index);
    const seed = createHomeDrivePedestrianSeed(
      "resident-pool",
      options.seed,
      index,
      slot.seed,
    );
    const appearance = createHomeDrivePedestrianAppearance(role, seed);
    const baseSpeedMps = getHomeDrivePedestrianBaseSpeedMps(
      role,
      appearance.walkStyleKey,
      seed,
    );
    const behavior = createHomeDrivePedestrianBehaviorAssignment({
      role,
      zone: slot.zone,
      seed,
      baseSpeedMps,
      behaviorHint: "walk",
    });
    const id = `resident-pedestrian:${index}`;
    const groupId = `resident-pedestrian-group:${index}`;

    agents.push({
      id,
      groupId,
      groupKind: "solo",
      groupMemberIndex: 0,
      handHoldTargetId: null,
      role,
      behavior: behavior.behavior,
      animationKey: behavior.animationKey,
      props: behavior.props,
      appearance,
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
      behaviorElapsedSeconds: seededRange(seed, 101, 0, behavior.durationSeconds * 0.7),
      behaviorDurationSeconds: behavior.durationSeconds,
      animationPhase: seededRange(seed, 107, 0, Math.PI * 2),
      idleLookYawRad: seededRange(seed, 109, -0.22, 0.22),
      crosswalkId: null,
      crossingDirection: undefined,
      crossingProgress: undefined,
      crossingStartedAtSeconds: undefined,
      crossingDurationSeconds: undefined,
      crossingStart: undefined,
      crossingEnd: undefined,
      seed,
      residentPoolId: id,
      residentPoolIndex: index,
      residentPoolSlotId: slot.id,
      residentViewportBand: slot.band as HomeDrivePedestrianAgent["residentViewportBand"],
      residentViewportSlotId: slot.id,
      lastViewportTeleportAtSeconds: options.elapsedSeconds,
      viewportOccupancyGeneration: 1,
      residentPoolTeleportedAtSeconds: options.elapsedSeconds,
      residentPoolGeneration: 1,
      activationBand: slot.band === "front" ? "far" : "horizon",
      relocationSource: "resident-pool",
    });
  }

  return agents;
}

export function isHomeDrivePedestrianResidentPoolAgent(
  agent: HomeDrivePedestrianAgent,
): boolean {
  return typeof agent.residentPoolId === "string" || agent.id.startsWith("resident-pedestrian:");
}
