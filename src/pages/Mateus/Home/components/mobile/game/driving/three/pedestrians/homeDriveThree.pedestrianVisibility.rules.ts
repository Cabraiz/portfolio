// src/pages/Mateus/Home/components/mobile/game/driving/three/pedestrians/homeDriveThree.pedestrianVisibility.rules.ts

import type { HomeDriveRuntimeState } from "../../domain/homeDrive.types";
import {
	isHomeDrivePedestrianAgentCollisionLocked,
	type HomeDrivePedestrianAgent,
} from "../../domain/pedestrians";
import type {
	HomeDriveThreePedestrianDetailLevel,
} from "./HomeDriveThreePedestrianAgent";

export function getDistanceSquared(

  first: Readonly<{ x: number; z: number }>,

  second: Readonly<{ x: number; z: number }>,

): number {

  const dx = first.x - second.x;

  const dz = first.z - second.z;



  return dx * dx + dz * dz;

}



export function getVisibilityCellKey(

  position: Readonly<{ x: number; z: number }>,

  cellSizeMeters: number,

): string {

  const safeCellSizeMeters = Math.max(1, cellSizeMeters);



  return `${Math.floor(position.x / safeCellSizeMeters)}:${Math.floor(

    position.z / safeCellSizeMeters,

  )}`;

}



export function getAngularSectorKey(

  position: Readonly<{ x: number; z: number }>,

  center: Readonly<{ x: number; z: number }>,

): string {

  const sectorCount = 32;

  const angle = Math.atan2(position.z - center.z, position.x - center.x);

  const normalized = (angle + Math.PI) / (Math.PI * 2);



  return String(Math.floor(normalized * sectorCount) % sectorCount);

}



function getFrame(

  position: Readonly<{ x: number; z: number }>,

  center: Readonly<{ x: number; z: number }>,

  headingRad: number,

): Readonly<{

  forwardMeters: number;

  lateralMeters: number;

}> {

  const forwardX = Math.sin(headingRad);

  const forwardZ = Math.cos(headingRad);

  const rightX = Math.cos(headingRad);

  const rightZ = -Math.sin(headingRad);

  const dx = position.x - center.x;

  const dz = position.z - center.z;



  return {

    forwardMeters: dx * forwardX + dz * forwardZ,

    lateralMeters: dx * rightX + dz * rightZ,

  };

}



export function isPedestrianImpactVisible(agent: HomeDrivePedestrianAgent): boolean {

  const impact = agent.pedestrianImpact;

  if (!impact) {

    return false;

  }

  return (

    Boolean(impact.active) ||

    (impact.yMeters ?? 0) > 0.01 ||

    typeof impact.landedAtSeconds === "number"

  );

}

function isPedestrianCollisionVisibleLocked(

  agent: HomeDrivePedestrianAgent,

  runtime: HomeDriveRuntimeState | undefined,

): boolean {

  if (!runtime) {

    return false;

  }



  return isHomeDrivePedestrianAgentCollisionLocked(agent, {

    carPosition: runtime.car.position,

    carHeadingRad: runtime.car.headingRad,

    carSpeedMps: runtime.car.speedMps,

    nowSeconds: runtime.elapsedSeconds,

    impactForwardMeters: 5.4,

    speedLookaheadSeconds: 0.36,

    maxImpactForwardMeters: 24,

    lateralPaddingMeters: 1.18,

    nearStabilityForwardMeters: 40,

    nearStabilityLateralMeters: 8.5,

  });

}


export function isRecentlyTeleportedInsideCoreCone(

  agent: HomeDrivePedestrianAgent,

  runtime: HomeDriveRuntimeState | undefined,

  blockMeters: number,

  coneRadians: number,

  fadeInSeconds: number,

): boolean {

  if (!runtime) {

    return false;

  }



  if (isPedestrianCollisionVisibleLocked(agent, runtime)) {

    return false;

  }



  const teleportedAt =

    agent.lastViewportTeleportAtSeconds ??

    agent.residentPoolTeleportedAtSeconds ??

    agent.lastRelocatedAtSeconds;



  if (typeof teleportedAt !== "number") {

    return false;

  }



  if (runtime.elapsedSeconds - teleportedAt > fadeInSeconds) {

    return false;

  }



  const frame = getFrame(

    agent.position,

    runtime.car.position,

    runtime.car.headingRad,

  );



  if (frame.forwardMeters <= 0 || frame.forwardMeters > blockMeters) {

    return false;

  }



  return (

    Math.abs(Math.atan2(frame.lateralMeters, Math.max(1, frame.forwardMeters))) <=

    coneRadians

  );

}



export function getVisibilityRank(

  agent: HomeDrivePedestrianAgent,

  distanceSquared: number,

  detailLevel: HomeDriveThreePedestrianDetailLevel,

  runtime: HomeDriveRuntimeState | undefined,

): number {

  const detailPenalty =

    detailLevel === "full" ? 0 : detailLevel === "medium" ? 1000 : 2000;

  const collisionPriority = isPedestrianImpactVisible(agent)

    ? -5200

    : isPedestrianCollisionVisibleLocked(agent, runtime)

      ? -1200

      : 0;

  const residentPriority =

    agent.residentViewportBand === "visible-near"

      ? -180

      : agent.residentViewportBand === "visible-mid"

        ? -90

        : agent.residentViewportBand === "visible-far"

          ? -40

          : 0;



  return detailPenalty + Math.sqrt(distanceSquared) + residentPriority + collisionPriority;

}
