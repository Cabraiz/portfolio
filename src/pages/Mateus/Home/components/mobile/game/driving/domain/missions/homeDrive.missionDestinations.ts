// src/pages/Mateus/Home/components/mobile/game/driving/domain/missions/homeDrive.missionDestinations.ts

import rawDestinations from "./homeDrive.missionDestinations.json";
import type {
  HomeDriveMissionDestination,
  HomeDriveMissionDestinationId,
  HomeDriveMissionDestinationSource,
} from "./homeDrive.mission.types";

function assertFiniteNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalizeImageSrc(imageSrc: string): string {
  if (!imageSrc) {
    return "";
  }

  if (imageSrc.startsWith("/")) {
    return imageSrc;
  }

  return `/${imageSrc.replace(/^public[\\/]/, "").replaceAll("\\", "/")}`;
}

function normalizeHomeDriveMissionDestination(
  source: HomeDriveMissionDestinationSource,
): HomeDriveMissionDestination {
  const x = assertFiniteNumber(source.position?.x, 0);
  const y = assertFiniteNumber(source.position?.y, 0);

  return {
    id: source.id,
    label: source.label,
    districtId: source.districtId,
    roadId: source.roadId,
    kind: source.kind,
    position: {
      x,
      z: y,
    },
    sourcePosition: {
      x,
      y,
    },
    radiusMeters: Math.max(8, assertFiniteNumber(source.radiusMeters, 70)),
    imageSrc: normalizeImageSrc(source.imageSrc),
    description: source.description,
  };
}

function sortDestinationsByStableLabel(
  destinations: readonly HomeDriveMissionDestination[],
): readonly HomeDriveMissionDestination[] {
  return [...destinations].sort((first, second) => {
    return first.label.localeCompare(second.label, "pt-BR");
  });
}

export const HOME_DRIVE_MISSION_DESTINATIONS: readonly HomeDriveMissionDestination[] =
  Object.freeze(
    (rawDestinations as readonly HomeDriveMissionDestinationSource[]).map(
      normalizeHomeDriveMissionDestination,
    ),
  );

export const HOME_DRIVE_MISSION_DESTINATIONS_BY_ID: ReadonlyMap<
  HomeDriveMissionDestinationId,
  HomeDriveMissionDestination
> = new Map(
  HOME_DRIVE_MISSION_DESTINATIONS.map((destination) => [
    destination.id,
    destination,
  ]),
);

export function getHomeDriveMissionDestinations(): readonly HomeDriveMissionDestination[] {
  return HOME_DRIVE_MISSION_DESTINATIONS;
}

export function getHomeDriveMissionDestinationsSortedByLabel(): readonly HomeDriveMissionDestination[] {
  return sortDestinationsByStableLabel(HOME_DRIVE_MISSION_DESTINATIONS);
}

export function getHomeDriveMissionDestinationById(
  id: HomeDriveMissionDestinationId,
  destinations: readonly HomeDriveMissionDestination[] = HOME_DRIVE_MISSION_DESTINATIONS,
): HomeDriveMissionDestination | null {
  return destinations.find((destination) => destination.id === id) ?? null;
}

export function getHomeDriveMissionDestinationIds(
  destinations: readonly HomeDriveMissionDestination[] = HOME_DRIVE_MISSION_DESTINATIONS,
): readonly HomeDriveMissionDestinationId[] {
  return destinations.map((destination) => destination.id);
}
