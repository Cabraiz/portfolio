// src/pages/Mateus/Home/components/mobile/game/driving/domain/missions/homeDrive.missionRoute.ts

import {
  getHomeDriveMissionDestinationIds,
  getHomeDriveMissionDestinations,
} from "./homeDrive.missionDestinations";
import type {
  HomeDriveMissionDestination,
  HomeDriveMissionDestinationId,
  HomeDriveMissionRoute,
} from "./homeDrive.mission.types";

export type CreateHomeDriveMissionRouteOptions = Readonly<{
  seed?: number;
  destinations?: readonly HomeDriveMissionDestination[];
  startDestinationId?: HomeDriveMissionDestinationId | null;
}>;

function normalizeSeed(seed: number | undefined): number {
  if (typeof seed === "number" && Number.isFinite(seed)) {
    return Math.abs(Math.floor(seed)) || 1;
  }

  return Date.now() % 1_000_000_007;
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state += 0x6d2b79f5;

    let value = state;

    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);

    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleStable<T>(
  items: readonly T[],
  seed: number,
): readonly T[] {
  const random = mulberry32(seed);
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const temp = copy[index];

    copy[index] = copy[swapIndex];
    copy[swapIndex] = temp;
  }

  return copy;
}

function moveDestinationToStart(
  ids: readonly HomeDriveMissionDestinationId[],
  startDestinationId: HomeDriveMissionDestinationId | null | undefined,
): readonly HomeDriveMissionDestinationId[] {
  if (!startDestinationId) {
    return ids;
  }

  const startIndex = ids.indexOf(startDestinationId);

  if (startIndex < 0) {
    return ids;
  }

  return [
    ids[startIndex],
    ...ids.slice(0, startIndex),
    ...ids.slice(startIndex + 1),
  ];
}

export function createHomeDriveMissionRoute({
  seed,
  destinations = getHomeDriveMissionDestinations(),
  startDestinationId = null,
}: CreateHomeDriveMissionRouteOptions = {}): HomeDriveMissionRoute {
  const resolvedSeed = normalizeSeed(seed);
  const destinationIds = getHomeDriveMissionDestinationIds(destinations);
  const shuffledIds = shuffleStable(destinationIds, resolvedSeed);
  const routeDestinationIds = moveDestinationToStart(
    shuffledIds,
    startDestinationId,
  );

  return {
    seed: resolvedSeed,
    destinationIds: routeDestinationIds,
  };
}
