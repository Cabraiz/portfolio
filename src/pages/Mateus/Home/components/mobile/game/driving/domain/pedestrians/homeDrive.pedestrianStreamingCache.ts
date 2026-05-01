// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianStreamingCache.ts

import type {
  HomeDrivePedestrianStreamingCache,
  HomeDrivePedestrianStreamingCacheEntry,
  HomeDrivePedestrianStreamingCacheLookupInput,
  HomeDrivePedestrianStreamingCacheLookupResult,
  HomeDrivePedestrianStreamingCacheOptions,
  HomeDrivePedestrianStreamingCacheReason,
  HomeDrivePedestrianStreamingCacheStoreInput,
} from "./homeDrive.pedestrianStreamingCache.types";

const DEFAULT_MAX_ENTRIES = 3;
const DEFAULT_MAX_AGE_SECONDS = 1.8;
const DEFAULT_MAX_REUSE_DISTANCE_METERS = 42;
const DEFAULT_MAX_HEADING_DELTA_RADIANS = 0.28;
const DEFAULT_MAX_SPEED_DELTA_MPS = 4.5;

function getDistanceMeters(
  first: Readonly<{ x: number; z: number }>,
  second: Readonly<{ x: number; z: number }>,
): number {
  const dx = first.x - second.x;
  const dz = first.z - second.z;

  return Math.sqrt(dx * dx + dz * dz);
}

function getAngleDeltaRadians(first: number, second: number): number {
  return Math.abs(Math.atan2(Math.sin(first - second), Math.cos(first - second)));
}

function resolveOptions(
  options: HomeDrivePedestrianStreamingCacheOptions = {},
): Required<HomeDrivePedestrianStreamingCacheOptions> {
  return {
    maxEntries: Math.max(1, Math.floor(options.maxEntries ?? DEFAULT_MAX_ENTRIES)),
    maxAgeSeconds: Math.max(0.05, options.maxAgeSeconds ?? DEFAULT_MAX_AGE_SECONDS),
    maxReuseDistanceMeters: Math.max(
      1,
      options.maxReuseDistanceMeters ?? DEFAULT_MAX_REUSE_DISTANCE_METERS,
    ),
    maxHeadingDeltaRadians: Math.max(
      0,
      options.maxHeadingDeltaRadians ?? DEFAULT_MAX_HEADING_DELTA_RADIANS,
    ),
    maxSpeedDeltaMps: Math.max(
      0,
      options.maxSpeedDeltaMps ?? DEFAULT_MAX_SPEED_DELTA_MPS,
    ),
  };
}

export function createHomeDrivePedestrianStreamingCache<TPlan>(
  options: HomeDrivePedestrianStreamingCacheOptions = {},
): HomeDrivePedestrianStreamingCache<TPlan> {
  const resolved = resolveOptions(options);

  return {
    entries: [],
    maxEntries: resolved.maxEntries,
  };
}

function getEntryReuseFailureReason<TPlan>(
  entry: HomeDrivePedestrianStreamingCacheEntry<TPlan>,
  input: HomeDrivePedestrianStreamingCacheLookupInput<TPlan>,
  options: Required<HomeDrivePedestrianStreamingCacheOptions>,
): HomeDrivePedestrianStreamingCacheReason | null {
  if (input.elapsedSeconds - entry.createdAtSeconds > options.maxAgeSeconds) {
    return "expired";
  }

  if (getDistanceMeters(input.center, entry.center) > options.maxReuseDistanceMeters) {
    return "moved";
  }

  if (getAngleDeltaRadians(input.headingRad, entry.headingRad) > options.maxHeadingDeltaRadians) {
    return "turned";
  }

  if (Math.abs(input.speedMps - entry.speedMps) > options.maxSpeedDeltaMps) {
    return "speed-changed";
  }

  return null;
}

export function lookupHomeDrivePedestrianStreamingCache<TPlan>(
  input: HomeDrivePedestrianStreamingCacheLookupInput<TPlan>,
): HomeDrivePedestrianStreamingCacheLookupResult<TPlan> {
  const options = resolveOptions(input.options);
  const cache =
    input.cache ??
    createHomeDrivePedestrianStreamingCache<TPlan>({
      maxEntries: options.maxEntries,
    });

  if (cache.entries.length <= 0) {
    return {
      entry: null,
      cache,
      reason: "empty",
    };
  }

  let nearestReusable: HomeDrivePedestrianStreamingCacheEntry<TPlan> | null = null;
  let nearestDistance = Number.POSITIVE_INFINITY;
  let failureReason: HomeDrivePedestrianStreamingCacheReason = "miss";

  cache.entries.forEach((entry) => {
    const reason = getEntryReuseFailureReason(entry, input, options);

    if (reason) {
      failureReason = reason;
      return;
    }

    const distance = getDistanceMeters(input.center, entry.center);

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestReusable = entry;
    }
  });

  if (!nearestReusable) {
    return {
      entry: null,
      cache,
      reason: failureReason,
    };
  }

  const updatedEntry: HomeDrivePedestrianStreamingCacheEntry<TPlan> = {
    ...nearestReusable,
    lastUsedAtSeconds: input.elapsedSeconds,
    useCount: nearestReusable.useCount + 1,
  };
  const updatedCache: HomeDrivePedestrianStreamingCache<TPlan> = {
    ...cache,
    entries: cache.entries.map((entry) => {
      return entry.id === updatedEntry.id ? updatedEntry : entry;
    }),
  };

  return {
    entry: updatedEntry,
    cache: updatedCache,
    reason: "hit",
  };
}

export function storeHomeDrivePedestrianStreamingCacheEntry<TPlan>(
  input: HomeDrivePedestrianStreamingCacheStoreInput<TPlan>,
): HomeDrivePedestrianStreamingCache<TPlan> {
  const options = resolveOptions(input.options);
  const cache =
    input.cache ??
    createHomeDrivePedestrianStreamingCache<TPlan>({
      maxEntries: options.maxEntries,
    });
  const nextEntry: HomeDrivePedestrianStreamingCacheEntry<TPlan> = {
    id: input.id,
    plan: input.plan,
    center: input.center,
    headingRad: input.headingRad,
    speedMps: input.speedMps,
    createdAtSeconds: input.elapsedSeconds,
    lastUsedAtSeconds: input.elapsedSeconds,
    useCount: 0,
  };
  const withoutSameId = cache.entries.filter((entry) => entry.id !== input.id);
  const nextEntries = [nextEntry, ...withoutSameId]
    .sort((first, second) => second.lastUsedAtSeconds - first.lastUsedAtSeconds)
    .slice(0, options.maxEntries);

  return {
    entries: nextEntries,
    maxEntries: options.maxEntries,
  };
}

export function pruneHomeDrivePedestrianStreamingCache<TPlan>(
  cache: HomeDrivePedestrianStreamingCache<TPlan> | null | undefined,
  elapsedSeconds: number,
  options: HomeDrivePedestrianStreamingCacheOptions = {},
): HomeDrivePedestrianStreamingCache<TPlan> {
  const resolved = resolveOptions(options);
  const current =
    cache ??
    createHomeDrivePedestrianStreamingCache<TPlan>({
      maxEntries: resolved.maxEntries,
    });

  return {
    entries: current.entries
      .filter((entry) => elapsedSeconds - entry.createdAtSeconds <= resolved.maxAgeSeconds)
      .sort((first, second) => second.lastUsedAtSeconds - first.lastUsedAtSeconds)
      .slice(0, resolved.maxEntries),
    maxEntries: resolved.maxEntries,
  };
}
