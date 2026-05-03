// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianResidentPoolRuntime.ts



import { createHomeDrivePedestrianResidentPoolAgents, isHomeDrivePedestrianResidentPoolAgent } from "./homeDrive.pedestrianResidentPool";

import { tickHomeDrivePedestrianResidentPoolViewportRuntime } from "./homeDrive.pedestrianResidentPoolViewportRuntime";

import { createHomeDrivePedestrianResidentPoolPlacement } from "./homeDrive.pedestrianResidentPoolPlacement";

import { createHomeDrivePedestrianBehaviorAssignment, getHomeDrivePedestrianBaseSpeedMps } from "./homeDrive.pedestrianBehaviors";
import { isHomeDrivePedestrianAgentCollisionLocked } from "./homeDrive.pedestrianCollisionGuard";

import type { HomeDriveVector2 } from "../homeDrive.types";

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



const RESIDENT_POOL_LOG_INTERVAL_SECONDS = 1;

const residentPoolLastLogAtByKey = new Map<string, number>();



function logResidentPool(

  key: string,

  elapsedSeconds: number,

  enabled: boolean,

  payload: Readonly<Record<string, unknown>>,

): void {

  if (!enabled || typeof console === "undefined") {

    return;

  }



  const lastLogAt = residentPoolLastLogAtByKey.get(key) ?? Number.NEGATIVE_INFINITY;



  if (elapsedSeconds - lastLogAt < RESIDENT_POOL_LOG_INTERVAL_SECONDS) {

    return;

  }



  residentPoolLastLogAtByKey.set(key, elapsedSeconds);

  console.info(`[Pedestrians:ResidentPool:${key}]`, payload);

}



function getForwardVector(headingRad: number): HomeDriveVector2 {

  return {

    x: Math.sin(headingRad),

    z: Math.cos(headingRad),

  };

}



function getRightVector(headingRad: number): HomeDriveVector2 {

  return {

    x: Math.cos(headingRad),

    z: -Math.sin(headingRad),

  };

}



function getFrame(

  point: HomeDriveVector2,

  center: HomeDriveVector2,

  headingRad: number,

): Omit<HomeDrivePedestrianResidentPoolAgentFrame, "agentId" | "status" | "protected"> {

  const forward = getForwardVector(headingRad);

  const right = getRightVector(headingRad);

  const dx = point.x - center.x;

  const dz = point.z - center.z;

  const forwardMeters = dx * forward.x + dz * forward.z;

  const lateralMeters = dx * right.x + dz * right.z;



  return {

    forwardMeters,

    lateralMeters,

    absoluteLateralMeters: Math.abs(lateralMeters),

    distanceMeters: Math.hypot(dx, dz),

  };

}



function isInsideProtectedCone(

  frame: Omit<HomeDrivePedestrianResidentPoolAgentFrame, "agentId" | "status" | "protected">,

  protectMeters: number,

  coneRadians: number,

): boolean {

  if (frame.forwardMeters < 0 || frame.forwardMeters > protectMeters) {

    return false;

  }



  return Math.abs(Math.atan2(frame.lateralMeters, Math.max(1, frame.forwardMeters))) <= coneRadians;

}




function isAgentLockedForCollision(

  agent: HomeDrivePedestrianAgent,

  options: HomeDrivePedestrianResidentPoolUpdateOptions,

): boolean {

  return isHomeDrivePedestrianAgentCollisionLocked(agent, {

    carPosition: options.activeCenter,

    carHeadingRad: options.activeHeadingRad,

    carSpeedMps: options.activeSpeedMps,

    nowSeconds: options.elapsedSeconds,

    impactForwardMeters: 5.2,

    speedLookaheadSeconds: 0.34,

    maxImpactForwardMeters: 22,

    lateralPaddingMeters: 1.05,

    nearStabilityForwardMeters: Math.max(42, options.config.teleportMinForwardMeters * 0.18),

    nearStabilityLateralMeters: 7.2,

  });

}


function classifyAgentFrame(

  agent: HomeDrivePedestrianAgent,

  options: HomeDrivePedestrianResidentPoolUpdateOptions,

): HomeDrivePedestrianResidentPoolAgentFrame {

  const frame = getFrame(agent.position, options.activeCenter, options.activeHeadingRad);

  const protectedByCone = isInsideProtectedCone(

    frame,

    options.config.protectVisibleConeMeters,

    options.config.protectVisibleConeRadians,

  );

  const status =

    frame.forwardMeters < -options.config.recycleBehindMeters

      ? "behind"

      : frame.absoluteLateralMeters > options.config.recycleSideMeters

        ? "side"

        : frame.forwardMeters <= options.config.teleportMinForwardMeters

          ? "visible"

          : frame.forwardMeters <= options.config.teleportMaxForwardMeters

            ? "front"

            : "far";



  return {

    agentId: agent.id,

    ...frame,

    status,

    protected:

      protectedByCone ||

      Boolean(agent.crosswalkId) ||

      isAgentLockedForCollision(agent, options),

  };

}



function updateAgentForSlot(params: Readonly<{

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



function getReusableAgents(

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



function pickTargetSlots(

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



function createEmptyRuntime(previous?: HomeDrivePedestrianResidentPoolRuntime): HomeDrivePedestrianResidentPoolRuntime {

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



export function tickHomeDrivePedestrianResidentPoolRuntime(

  options: HomeDrivePedestrianResidentPoolUpdateOptions,

): HomeDrivePedestrianResidentPoolRuntimeResult {

  if (options.config.viewportOccupancyEnabled) {

    return tickHomeDrivePedestrianResidentPoolViewportRuntime(options);

  }



  const runtime = createEmptyRuntime(options.runtime);

  const placement = createHomeDrivePedestrianResidentPoolPlacement({

    zones: options.zones,

    activeCenter: options.activeCenter,

    activeHeadingRad: options.activeHeadingRad,

    activeSpeedMps: options.activeSpeedMps,

    elapsedSeconds: options.elapsedSeconds,

    seed: options.seed,

    config: options.config,

  });



  if (!options.config.enabled || placement.slots.length <= 0) {

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



  const existingPoolAgents = options.agents

    .filter(isHomeDrivePedestrianResidentPoolAgent)

    .slice(0, options.config.size);

  const missingCount = Math.max(0, options.config.size - existingPoolAgents.length);
  const isBootLocked =
    Boolean(runtime.bootLocked) && (options.config.lockAfterBoot ?? true);
  const canCreateMissingAgents =
    missingCount > 0 &&
    (!isBootLocked || options.config.allowRuntimeExpansion === true);
  const runtimeSpawnBlockedCount = canCreateMissingAgents ? 0 : missingCount;
  const runtimeSpawnViolationCount =
    (runtime.runtimeSpawnViolationCount ?? 0) + runtimeSpawnBlockedCount;
  const lastRuntimeSpawnViolationMessage = runtimeSpawnBlockedCount > 0
    ? `Blocked ${runtimeSpawnBlockedCount} late pedestrian creation(s); resident pool is boot-locked.`
    : runtime.lastRuntimeSpawnViolationMessage;

  const createdAgents = canCreateMissingAgents

    ? createHomeDrivePedestrianResidentPoolAgents({

        zones: options.zones,

        activeCenter: options.activeCenter,

        activeHeadingRad: options.activeHeadingRad,

        elapsedSeconds: options.elapsedSeconds,

        seed: options.seed + existingPoolAgents.length,

        poolSize: missingCount,

        slots: placement.slots.slice(existingPoolAgents.length),

      })

    : [];

  const poolAgents = [...existingPoolAgents, ...createdAgents].slice(0, options.config.size);

  const nextGeneration = runtime.generation + 1;

  const frames = poolAgents.map((agent) => classifyAgentFrame(agent, options));

  const framesById = new Map(frames.map((frame) => [frame.agentId, frame]));

  const frontAgentCount = frames.filter((frame) => frame.forwardMeters >= 0 && frame.forwardMeters < options.config.teleportMinForwardMeters).length;

  const farAgentCount = frames.filter((frame) => frame.forwardMeters >= options.config.teleportMinForwardMeters && frame.forwardMeters <= options.config.teleportMaxForwardMeters).length;

  const behindAgentCount = frames.filter((frame) => frame.status === "behind").length;

  const sideAgentCount = frames.filter((frame) => frame.status === "side").length;

  const protectedAgentCount = frames.filter((frame) => frame.protected).length;

  const reusableAgents = getReusableAgents(poolAgents, framesById);

  const usedSlotIds = new Set(poolAgents.map((agent) => agent.residentPoolSlotId).filter(Boolean) as string[]);

  const targetSlots = pickTargetSlots(placement.slots, usedSlotIds);

  const deficit = Math.max(

    0,

    options.config.minFrontAgents - frontAgentCount,

    options.config.minFarAgents - farAgentCount,

  );

  const initialFillBudget = existingPoolAgents.length < options.config.size

    ? options.config.maxInitialTeleports

    : 0;

  const teleportBudget = Math.min(

    Math.max(0, options.config.maxTeleportsPerTick + initialFillBudget),

    Math.max(reusableAgents.length, deficit),

    targetSlots.length,

  );

  const teleportedById = new Map<string, HomeDrivePedestrianAgent>();

  const lastTeleportAtSecondsByAgentId: Record<string, number> = {

    ...runtime.lastTeleportAtSecondsByAgentId,

  };

  const lastSlotIdByAgentId: Record<string, string> = {

    ...runtime.lastSlotIdByAgentId,

  };



  for (let index = 0; index < teleportBudget; index += 1) {

    const agent = reusableAgents[index % Math.max(1, reusableAgents.length)] ?? poolAgents[index % poolAgents.length];

    const slot = targetSlots[index % targetSlots.length];



    if (!agent || !slot || teleportedById.has(agent.id)) {

      continue;

    }



    const nextAgent = updateAgentForSlot({

      agent,

      slot,

      elapsedSeconds: options.elapsedSeconds,

      generation: nextGeneration,

    });



    teleportedById.set(agent.id, nextAgent);

    lastTeleportAtSecondsByAgentId[agent.id] = options.elapsedSeconds;

    lastSlotIdByAgentId[agent.id] = slot.id;

  }



  const finalAgents = poolAgents.map((agent) => teleportedById.get(agent.id) ?? agent);

  const diagnostics = {

    id: [

      "resident-pool",

      Math.round(options.elapsedSeconds * 10),

      Math.round(options.activeSpeedMps * 10),

      finalAgents.length,

      teleportedById.size,

    ].join(":"),

    enabled: true,

    elapsedSeconds: options.elapsedSeconds,

    activeSpeedMps: options.activeSpeedMps,

    requestedPoolSize: options.config.size,

    finalAgentCount: finalAgents.length,

    createdAgentCount: createdAgents.length,

    reusedAgentCount: existingPoolAgents.length,

    teleportedAgentCount: teleportedById.size,

    protectedAgentCount,

    frontAgentCount,

    farAgentCount,

    behindAgentCount,

    sideAgentCount,

    recyclableAgentCount: reusableAgents.length,

    slotCount: placement.slots.length,

    frontSlotCount: placement.frontSlotCount,

    farSlotCount: placement.farSlotCount,

    horizonSlotCount: placement.horizonSlotCount,
    bootLocked: isBootLocked,
    lockedPoolSize: runtime.lockedPoolSize,
    runtimeSpawnViolationCount,
    runtimeSpawnBlockedCount,

    collisionLockedCount: finalAgents.filter((agent) =>

      isAgentLockedForCollision(agent, options),

    ).length,

    collisionGuardBlockedTeleportCount: 0,

    reason: teleportedById.size > 0 ? "teleported" : "stable",

  };



  logResidentPool("summary", options.elapsedSeconds, options.config.debug, diagnostics);



  return {

    agents: finalAgents,

    runtime: {

      generation: nextGeneration,

      poolAgentIds: finalAgents.map((agent) => agent.id),

      lastTeleportAtSecondsByAgentId,

      lastSlotIdByAgentId,

      lastDiagnostics: diagnostics,
      bootLocked: isBootLocked,
      lockedPoolSize: runtime.lockedPoolSize,
      lockedPoolAgentIds: runtime.lockedPoolAgentIds ?? [],
      createdAtBootCount: runtime.createdAtBootCount ?? 0,
      runtimeSpawnViolationCount,
      lastRuntimeSpawnViolationAtSeconds: runtimeSpawnBlockedCount > 0
        ? options.elapsedSeconds
        : runtime.lastRuntimeSpawnViolationAtSeconds,
      lastRuntimeSpawnViolationMessage,

    },

    diagnostics,

    createdAgentCount: createdAgents.length,

    reusedAgentCount: existingPoolAgents.length,

    teleportedAgentCount: teleportedById.size,

  };

}



