// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianResidentPoolRuntime.frame.ts

import {
  isHomeDrivePedestrianAgentCollisionLocked,
} from "./homeDrive.pedestrianCollisionGuard";
import type { HomeDriveVector2 } from "../homeDrive.types";
import type {
  HomeDrivePedestrianResidentPoolAgentFrame,
  HomeDrivePedestrianResidentPoolUpdateOptions,
} from "./homeDrive.pedestrianResidentPool.types";
import type { HomeDrivePedestrianAgent } from "./homeDrive.pedestrians.types";

const RESIDENT_POOL_LOG_INTERVAL_SECONDS = 1;

const residentPoolLastLogAtByKey = new Map<string, number>();



export function logResidentPool(

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




export function isAgentLockedForCollision(

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


export function classifyAgentFrame(

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
