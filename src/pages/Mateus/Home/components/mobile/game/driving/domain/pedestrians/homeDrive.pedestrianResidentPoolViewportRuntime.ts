// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianResidentPoolViewportRuntime.ts



import { createHomeDrivePedestrianBehaviorAssignment, getHomeDrivePedestrianBaseSpeedMps } from "./homeDrive.pedestrianBehaviors";

import {

  createHomeDrivePedestrianResidentPoolAgents,

  isHomeDrivePedestrianResidentPoolAgent,

} from "./homeDrive.pedestrianResidentPool";

import { createHomeDrivePedestrianViewportOccupancyPlan } from "./homeDrive.pedestrianViewportOccupancy";

import { createHomeDrivePedestrianViewportOccupancySlots } from "./homeDrive.pedestrianViewportOccupancySlots";

import {

  createHomeDrivePedestrianViewportEntryGateConfig,

  getHomeDrivePedestrianViewportEntryGateResult,

} from "./homeDrive.pedestrianViewportEntryGates";
import { isHomeDrivePedestrianAgentCollisionLocked } from "./homeDrive.pedestrianCollisionGuard";

import type { HomeDriveVector2 } from "../homeDrive.types";

import type { HomeDrivePedestrianResidentPoolDiagnostics } from "./homeDrive.pedestrianResidentPoolDiagnostics.types";

import type { HomeDrivePedestrianResidentPoolRuntime } from "./homeDrive.pedestrianResidentPoolRuntime.types";

import type { HomeDrivePedestrianResidentPoolSlot } from "./homeDrive.pedestrianResidentPool.types";

import type {

  HomeDrivePedestrianResidentPoolViewportRuntimeOptions,

  HomeDrivePedestrianResidentPoolViewportRuntimeResult,

} from "./homeDrive.pedestrianResidentPoolViewportRuntime.types";

import type { HomeDrivePedestrianAgent } from "./homeDrive.pedestrians.types";



const RESIDENT_VIEWPORT_LOG_INTERVAL_SECONDS = 1;

const residentViewportLastLogAtByKey = new Map<string, number>();



function logResidentViewport(

  key: string,

  elapsedSeconds: number,

  enabled: boolean,

  payload: Readonly<Record<string, unknown>>,

): void {

  if (!enabled || typeof console === "undefined") {

    return;

  }



  const lastLogAt = residentViewportLastLogAtByKey.get(key) ?? Number.NEGATIVE_INFINITY;



  if (elapsedSeconds - lastLogAt < RESIDENT_VIEWPORT_LOG_INTERVAL_SECONDS) {

    return;

  }



  residentViewportLastLogAtByKey.set(key, elapsedSeconds);

  console.info(`[Pedestrians:ResidentViewport:${key}]`, payload);

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



function getFrame(point: HomeDriveVector2, center: HomeDriveVector2, headingRad: number) {

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




function isAgentLockedForCollision(

  agent: HomeDrivePedestrianAgent,

  options: HomeDrivePedestrianResidentPoolViewportRuntimeOptions,

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

    nearStabilityForwardMeters: Math.max(

      42,

      (options.config.viewportVisibleNearMinMeters ?? 42) + 8,

    ),

    nearStabilityLateralMeters: 7.2,

  });

}


function createRuntime(previous?: HomeDrivePedestrianResidentPoolRuntime): HomeDrivePedestrianResidentPoolRuntime {

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



function isAgentInsideViewportOccupancy(

  agent: HomeDrivePedestrianAgent,

  options: HomeDrivePedestrianResidentPoolViewportRuntimeOptions,

): boolean {

  const frame = getFrame(agent.position, options.activeCenter, options.activeHeadingRad);

  const maxForward = Math.max(

    options.config.viewportVisibleFarMaxMeters ?? options.config.teleportMinForwardMeters,

    options.config.viewportSideMaxForwardMeters ?? options.config.teleportMinForwardMeters,

  );

  const maxSide = Math.max(

    options.config.viewportSideLateralMaxMeters ?? options.config.recycleSideMeters,

    80,

  );



  if (isAgentLockedForCollision(agent, options)) {

    return true;

  }

  const nearBackPaddingMeters = Math.max(

    12,

    Math.min(42, Math.abs(options.activeSpeedMps) * 0.55),

  );

  return (

    frame.forwardMeters >= -nearBackPaddingMeters &&

    frame.forwardMeters <= maxForward + 20 &&

    frame.absoluteLateralMeters <= maxSide + 36

  );

}



function isAgentInsideSafeEntryGate(

  agent: HomeDrivePedestrianAgent,

  options: HomeDrivePedestrianResidentPoolViewportRuntimeOptions,

): boolean {

  const frame = getFrame(agent.position, options.activeCenter, options.activeHeadingRad);

  const maxForward = Math.max(

    options.config.viewportVisibleFarMaxMeters ?? options.config.teleportMinForwardMeters,

    options.config.viewportSideMaxForwardMeters ?? options.config.teleportMinForwardMeters,

  );

  const maxSide = Math.max(

    options.config.viewportSideLateralMaxMeters ?? options.config.recycleSideMeters,

    120,

  );



  return getHomeDrivePedestrianViewportEntryGateResult(

    {

      position: agent.position,

      forwardMeters: frame.forwardMeters,

      lateralMeters: frame.lateralMeters,

      distanceMeters: frame.distanceMeters,

      viewportBand: agent.residentViewportBand,

    },

    createHomeDrivePedestrianViewportEntryGateConfig({

      minForwardMeters: Math.max(58, (options.config.viewportVisibleNearMinMeters ?? 55) * 0.72),

      maxForwardMeters: maxForward + 96,

      centerBlockForwardMeters: Math.max(150, options.config.viewportVisibleMidMinMeters ?? 160),

      centerBlockAbsLateralMeters: Math.max(42, (options.config.viewportSideLateralMinMeters ?? 70) * 0.56),

      sideMinAbsLateralMeters: Math.max(42, (options.config.viewportSideLateralMinMeters ?? 70) * 0.58),

      sideMaxAbsLateralMeters: maxSide + 96,

      farEdgeMinForwardMeters: Math.max(170, (options.config.viewportVisibleFarMinMeters ?? 260) * 0.62),

      allowRelaxedFallback: true,

    }),

  ).allowed;

}



function getAgentViewportBandKey(agent: HomeDrivePedestrianAgent): string {

  return agent.residentViewportBand ?? "unassigned";

}



function updateAgentForViewportSlot(params: Readonly<{

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



export function tickHomeDrivePedestrianResidentPoolViewportRuntime(

  options: HomeDrivePedestrianResidentPoolViewportRuntimeOptions,

): HomeDrivePedestrianResidentPoolViewportRuntimeResult {

  const runtime = createRuntime(options.runtime);

  const plan = createHomeDrivePedestrianViewportOccupancyPlan({

    enabled: options.config.viewportOccupancyEnabled ?? true,

    forceAllAgentsIntoViewport: options.config.viewportForceAllAgentsIntoViewport ?? false,

    maxTeleportsPerTick: Math.max(

      1,

      options.config.viewportMaxTeleportsPerTick ?? options.config.maxTeleportsPerTick,

    ),

    nearMinMeters: options.config.viewportVisibleNearMinMeters ?? 80,

    nearMaxMeters: options.config.viewportVisibleNearMaxMeters ?? 170,

    nearCount: options.config.viewportVisibleNearCount ?? Math.ceil(options.config.size * 0.22),

    midMinMeters: options.config.viewportVisibleMidMinMeters ?? 170,

    midMaxMeters: options.config.viewportVisibleMidMaxMeters ?? 340,

    midCount: options.config.viewportVisibleMidCount ?? Math.ceil(options.config.size * 0.28),

    farMinMeters: options.config.viewportVisibleFarMinMeters ?? 340,

    farMaxMeters: options.config.viewportVisibleFarMaxMeters ?? 520,

    farCount: options.config.viewportVisibleFarCount ?? Math.ceil(options.config.size * 0.28),

    sideMinForwardMeters: options.config.viewportSideMinForwardMeters ?? 110,

    sideMaxForwardMeters: options.config.viewportSideMaxForwardMeters ?? 520,

    sideLateralMinMeters: options.config.viewportSideLateralMinMeters ?? 52,

    sideLateralMaxMeters: options.config.viewportSideLateralMaxMeters ?? 260,

    sideCount: options.config.viewportSideCount ?? Math.max(0, options.config.size - Math.ceil(options.config.size * 0.78)),

    minSpacingMeters: options.config.viewportMinSpacingMeters ?? 5.5,

    debug: options.config.debug,

  });

  const slotResult = createHomeDrivePedestrianViewportOccupancySlots({

    zones: options.zones,

    activeCenter: options.activeCenter,

    activeHeadingRad: options.activeHeadingRad,

    activeSpeedMps: options.activeSpeedMps,

    elapsedSeconds: options.elapsedSeconds,

    seed: options.seed + runtime.generation * 13,

    plan,

  });

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

        slots: slotResult.slots.slice(existingPoolAgents.length),

      })

    : [];

  const poolAgents = [...existingPoolAgents, ...createdAgents].slice(0, options.config.size);

  const nextGeneration = runtime.generation + 1;

  const createdAgentIds = new Set(createdAgents.map((agent) => agent.id));

  const isInitialFill = existingPoolAgents.length <= 0 || createdAgents.length > 0;

  const maxTeleports = isInitialFill

    ? poolAgents.length

    : Math.max(

        1,

        Math.min(

          poolAgents.length,

          options.config.viewportMaxTeleportsPerTick ?? options.config.maxTeleportsPerTick,

        ),

      );

  const lastTeleportAtSecondsByAgentId: Record<string, number> = {

    ...runtime.lastTeleportAtSecondsByAgentId,

  };

  const lastSlotIdByAgentId: Record<string, string> = {

    ...runtime.lastSlotIdByAgentId,

  };

  const updatedAgents: HomeDrivePedestrianAgent[] = [];

  let teleportedCount = 0;

  let collisionGuardBlockedTeleportCount = 0;



  for (let index = 0; index < poolAgents.length; index += 1) {

    const agent = poolAgents[index];

    const slot = slotResult.slots[index % Math.max(1, slotResult.slots.length)];



    if (!slot) {

      updatedAgents.push(agent);

      continue;

    }



    const isInside = isAgentInsideViewportOccupancy(agent, options);

    const lastSlotId = runtime.lastSlotIdByAgentId[agent.id] ?? agent.residentViewportSlotId ?? agent.residentPoolSlotId;

    const lastTeleportAtSeconds = runtime.lastTeleportAtSecondsByAgentId[agent.id] ?? Number.NEGATIVE_INFINITY;

    const secondsSinceTeleport = options.elapsedSeconds - lastTeleportAtSeconds;

    const isCreated = createdAgentIds.has(agent.id);

    const hasNoStableSlot = typeof lastSlotId !== "string";

    const bandKey = getAgentViewportBandKey(agent);

    const isUnassignedBand = bandKey === "unassigned";

    const teleportCooldownSeconds = isInitialFill || isCreated || hasNoStableSlot ? 0 : 0.72;

    const isCollisionLocked = isAgentLockedForCollision(agent, options);

    /*

     * Safe-entry gates are for selecting target slots, not for constantly

     * evicting visible pedestrians. Once a resident is already inside the

     * occupancy envelope, keep it stable; otherwise the whole pool flickers or

     * churns itself into zero visible entries under strict gates.

     */

    const shouldTeleport =

      !isCollisionLocked &&

      (isCreated ||

        hasNoStableSlot ||

        isUnassignedBand ||

        (!isInside && secondsSinceTeleport >= teleportCooldownSeconds));



    if (isCollisionLocked && !isInside) {

      collisionGuardBlockedTeleportCount += 1;

    }



    if (shouldTeleport && teleportedCount < maxTeleports) {

      const nextAgent = updateAgentForViewportSlot({

        agent,

        slot,

        elapsedSeconds: options.elapsedSeconds,

        generation: nextGeneration,

      });



      updatedAgents.push(nextAgent);

      lastTeleportAtSecondsByAgentId[agent.id] = options.elapsedSeconds;

      lastSlotIdByAgentId[agent.id] = slot.id;

      teleportedCount += 1;

    } else {

      updatedAgents.push(agent);

    }

  }



  const countsByBand = updatedAgents.reduce(

    (counts, agent) => {

      const band = agent.residentViewportBand ?? "visible-mid";

      return {

        ...counts,

        [band]: (counts[band] ?? 0) + 1,

      };

    },

    {} as Record<string, number>,

  );

  const offViewportCount = updatedAgents.filter((agent) => {

    return !isAgentInsideViewportOccupancy(agent, options);

  }).length;

  const diagnostics: HomeDrivePedestrianResidentPoolDiagnostics = {

    id: [

      "resident-viewport",

      Math.round(options.elapsedSeconds * 10),

      Math.round(options.activeSpeedMps * 10),

      updatedAgents.length,

      teleportedCount,

    ].join(":"),

    enabled: true,

    elapsedSeconds: options.elapsedSeconds,

    activeSpeedMps: options.activeSpeedMps,

    requestedPoolSize: options.config.size,

    finalAgentCount: updatedAgents.length,

    createdAgentCount: createdAgents.length,

    reusedAgentCount: existingPoolAgents.length,

    teleportedAgentCount: teleportedCount,

    protectedAgentCount: updatedAgents.filter((agent) => isAgentInsideSafeEntryGate(agent, options)).length,

    frontAgentCount:

      (countsByBand["visible-near"] ?? 0) + (countsByBand["visible-mid"] ?? 0),

    farAgentCount: (countsByBand["visible-far"] ?? 0),

    behindAgentCount: 0,

    sideAgentCount:

      (countsByBand["side-left"] ?? 0) + (countsByBand["side-right"] ?? 0),

    recyclableAgentCount: offViewportCount,

    slotCount: slotResult.slotCount,

    frontSlotCount:

      slotResult.slotCountByBand["visible-near"] +

      slotResult.slotCountByBand["visible-mid"],

    farSlotCount: slotResult.slotCountByBand["visible-far"],

    horizonSlotCount:

      slotResult.slotCountByBand["side-left"] +

      slotResult.slotCountByBand["side-right"],

    visibleNearCount: countsByBand["visible-near"] ?? 0,

    visibleMidCount: countsByBand["visible-mid"] ?? 0,

    visibleFarCount: countsByBand["visible-far"] ?? 0,

    sideLeftCount: countsByBand["side-left"] ?? 0,

    sideRightCount: countsByBand["side-right"] ?? 0,

    offViewportCount,

    teleportedToViewportCount: teleportedCount,

    missingSlotCount: Math.max(0, updatedAgents.length - slotResult.slotCount),
    bootLocked: isBootLocked,
    lockedPoolSize: runtime.lockedPoolSize,
    runtimeSpawnViolationCount,
    runtimeSpawnBlockedCount,

    collisionLockedCount: updatedAgents.filter((agent) =>

      isAgentLockedForCollision(agent, options),

    ).length,

    collisionGuardBlockedTeleportCount,

    reason: slotResult.slotCount <= 0 ? "no-viewport-slots" : teleportedCount > 0 ? "safe-entry-teleport" : "stable-safe-entry",

  };



  logResidentViewport("summary", options.elapsedSeconds, options.config.debug, diagnostics);



  return {

    agents: updatedAgents,

    runtime: {

      generation: nextGeneration,

      poolAgentIds: updatedAgents.map((agent) => agent.id),

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

    teleportedAgentCount: teleportedCount,

  };

}



