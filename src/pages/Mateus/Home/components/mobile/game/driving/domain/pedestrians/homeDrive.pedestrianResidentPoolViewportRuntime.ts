// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianResidentPoolViewportRuntime.ts



import {
  createHomeDrivePedestrianResidentPoolAgents,
  isHomeDrivePedestrianResidentPoolAgent,
} from "./homeDrive.pedestrianResidentPool";
import { createResidentViewportOccupancyPlan } from "./homeDrive.pedestrianResidentPoolViewportRuntime.plan";
import { createResidentViewportDiagnostics } from "./homeDrive.pedestrianResidentPoolViewportRuntime.diagnostics";
import {
  createHomeDrivePedestrianViewportOccupancySlots,
} from "./homeDrive.pedestrianViewportOccupancySlots";
import type {
  HomeDrivePedestrianResidentPoolViewportRuntimeOptions,
  HomeDrivePedestrianResidentPoolViewportRuntimeResult,
} from "./homeDrive.pedestrianResidentPoolViewportRuntime.types";
import type { HomeDrivePedestrianAgent } from "./homeDrive.pedestrians.types";
import {
  logResidentViewport,
  isAgentLockedForCollision,
  createRuntime,
  isAgentInsideViewportOccupancy,
} from "./homeDrive.pedestrianResidentPoolViewportRuntime.frame";
import {
  getAgentViewportBandKey,
  updateAgentForViewportSlot,
} from "./homeDrive.pedestrianResidentPoolViewportRuntime.slots";

export function tickHomeDrivePedestrianResidentPoolViewportRuntime(

  options: HomeDrivePedestrianResidentPoolViewportRuntimeOptions,

): HomeDrivePedestrianResidentPoolViewportRuntimeResult {

  const runtime = createRuntime(options.runtime);

  const plan = createResidentViewportOccupancyPlan(options);

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



  const diagnostics = createResidentViewportDiagnostics({
    options,
    runtime,
    slotResult,
    updatedAgents,
    createdAgents,
    existingPoolAgents,
    teleportedCount,
    isBootLocked,
    runtimeSpawnViolationCount,
    runtimeSpawnBlockedCount,
    collisionGuardBlockedTeleportCount,
  });



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
