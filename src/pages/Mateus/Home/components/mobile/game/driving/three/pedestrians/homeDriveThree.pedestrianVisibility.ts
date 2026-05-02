// src/pages/Mateus/Home/components/mobile/game/driving/three/pedestrians/homeDriveThree.pedestrianVisibility.ts

import type { HomeDriveRuntimeState } from "../../domain/homeDrive.types";
import type {
  HomeDrivePedestrianAgent,
  HomeDrivePedestrianRuntimeState,
} from "../../domain/pedestrians";
import type { HomeDriveThreePedestrianDetailLevel } from "./HomeDriveThreePedestrianAgent";
import { getHomeDriveThreePedestrianLodForDistance } from "./homeDriveThree.pedestrianLod";

export type HomeDriveThreeVisiblePedestrianEntry = Readonly<{
  agent: HomeDrivePedestrianAgent;
  distanceSquared: number;
  detailLevel: HomeDriveThreePedestrianDetailLevel;
  visibilityCellKey: string;
  angularSectorKey: string;
  visibilityRank: number;
}>;

export type HomeDriveThreePedestrianVisibilityOptions = Readonly<{
  agents: readonly HomeDrivePedestrianAgent[];
  runtime?: HomeDriveRuntimeState;
  pedestrianState?: HomeDrivePedestrianRuntimeState;
  visibleRadiusMeters: number;
  maxVisiblePedestrians: number;
  fullDetailRadiusMeters: number;
  mediumDetailRadiusMeters: number;
  cellSizeMeters?: number;
  relocatedFadeInSeconds?: number;
  relocatedVisibleBlockMeters?: number;
  relocatedVisibleConeRadians?: number;
}>;

function getDistanceSquared(
  first: Readonly<{ x: number; z: number }>,
  second: Readonly<{ x: number; z: number }>,
): number {
  const dx = first.x - second.x;
  const dz = first.z - second.z;

  return dx * dx + dz * dz;
}

function getVisibilityCellKey(
  position: Readonly<{ x: number; z: number }>,
  cellSizeMeters: number,
): string {
  const safeCellSizeMeters = Math.max(1, cellSizeMeters);

  return `${Math.floor(position.x / safeCellSizeMeters)}:${Math.floor(
    position.z / safeCellSizeMeters,
  )}`;
}

function getAngularSectorKey(
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

function isRecentlyTeleportedInsideCoreCone(
  agent: HomeDrivePedestrianAgent,
  runtime: HomeDriveRuntimeState | undefined,
  blockMeters: number,
  coneRadians: number,
  fadeInSeconds: number,
): boolean {
  if (!runtime) {
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

function getVisibilityRank(
  agent: HomeDrivePedestrianAgent,
  distanceSquared: number,
  detailLevel: HomeDriveThreePedestrianDetailLevel,
): number {
  const detailPenalty =
    detailLevel === "full" ? 0 : detailLevel === "medium" ? 1000 : 2000;
  const residentPriority =
    agent.residentViewportBand === "visible-near"
      ? -180
      : agent.residentViewportBand === "visible-mid"
        ? -90
        : agent.residentViewportBand === "visible-far"
          ? -40
          : 0;

  return detailPenalty + Math.sqrt(distanceSquared) + residentPriority;
}

export function getHomeDriveThreeVisiblePedestrianEntries(
  options: HomeDriveThreePedestrianVisibilityOptions,
): readonly HomeDriveThreeVisiblePedestrianEntry[] {
  const center = options.runtime?.car.position ?? { x: 0, z: 0 };
  const visibleRadiusMeters = Math.max(1, options.visibleRadiusMeters);
  const visibleRadiusSquared = visibleRadiusMeters * visibleRadiusMeters;
  const maxVisiblePedestrians = Math.max(
    0,
    Math.floor(options.maxVisiblePedestrians),
  );
  const cellSizeMeters = Math.max(1, options.cellSizeMeters ?? 8);
  const fadeInSeconds = Math.max(0, options.relocatedFadeInSeconds ?? 0.16);
  const blockMeters = Math.max(0, options.relocatedVisibleBlockMeters ?? 80);
  const coneRadians = Math.max(
    0.05,
    Math.min(Math.PI, options.relocatedVisibleConeRadians ?? 0.72),
  );

  if (maxVisiblePedestrians <= 0) {
    return [];
  }

  return options.agents
    .map((agent): HomeDriveThreeVisiblePedestrianEntry | null => {
      const distanceSquared = getDistanceSquared(agent.position, center);

      if (distanceSquared > visibleRadiusSquared) {
        return null;
      }

      if (
        isRecentlyTeleportedInsideCoreCone(
          agent,
          options.runtime,
          blockMeters,
          coneRadians,
          fadeInSeconds,
        )
      ) {
        return null;
      }

      const distanceMeters = Math.sqrt(distanceSquared);
      const detailLevel = getHomeDriveThreePedestrianLodForDistance(distanceMeters, {
        fullDetailRadiusMeters: options.fullDetailRadiusMeters,
        mediumDetailRadiusMeters: options.mediumDetailRadiusMeters,
      });

      if (detailLevel === null) {
        return null;
      }

      return {
        agent,
        distanceSquared,
        detailLevel,
        visibilityCellKey: getVisibilityCellKey(agent.position, cellSizeMeters),
        angularSectorKey: getAngularSectorKey(agent.position, center),
        visibilityRank: getVisibilityRank(agent, distanceSquared, detailLevel),
      };
    })
    .filter((entry): entry is HomeDriveThreeVisiblePedestrianEntry => Boolean(entry))
    .sort((first, second) => {
      if (Math.abs(first.visibilityRank - second.visibilityRank) > 0.0001) {
        return first.visibilityRank - second.visibilityRank;
      }

      if (Math.abs(first.distanceSquared - second.distanceSquared) > 0.0001) {
        return first.distanceSquared - second.distanceSquared;
      }

      return first.agent.id.localeCompare(second.agent.id);
    })
    .slice(0, maxVisiblePedestrians);
}
