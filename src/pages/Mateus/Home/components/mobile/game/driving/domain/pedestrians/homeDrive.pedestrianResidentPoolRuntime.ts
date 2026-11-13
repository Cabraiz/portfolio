// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianResidentPoolRuntime.ts

import { createHomeDrivePedestrianResidentPoolAgents, isHomeDrivePedestrianResidentPoolAgent } from "./homeDrive.pedestrianResidentPool";

import { tickHomeDrivePedestrianResidentPoolViewportRuntime } from "./homeDrive.pedestrianResidentPoolViewportRuntime";

import { createHomeDrivePedestrianResidentPoolPlacement } from "./homeDrive.pedestrianResidentPoolPlacement";

import type {
  HomeDrivePedestrianResidentPoolUpdateOptions,
} from "./homeDrive.pedestrianResidentPool.types";

import type {
  HomeDrivePedestrianResidentPoolRuntimeResult,
} from "./homeDrive.pedestrianResidentPoolRuntime.types";

import type { HomeDrivePedestrianAgent } from "./homeDrive.pedestrians.types";
import {
  classifyAgentFrame,
  isAgentLockedForCollision,
  logResidentPool,
} from "./homeDrive.pedestrianResidentPoolRuntime.frame";
import {
  createEmptyRuntime,
  createDisabledResidentPoolResult,
  getReusableAgents,
  pickTargetSlots,
  updateAgentForSlot,
} from "./homeDrive.pedestrianResidentPoolRuntime.slots";

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
    return createDisabledResidentPoolResult(options, runtime, placement);
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

