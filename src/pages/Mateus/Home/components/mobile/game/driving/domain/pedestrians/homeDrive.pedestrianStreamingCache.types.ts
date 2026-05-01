// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianStreamingCache.types.ts

import type { HomeDriveVector2 } from "../homeDrive.types";

export type HomeDrivePedestrianStreamingCacheReason =
  | "miss"
  | "hit"
  | "expired"
  | "moved"
  | "turned"
  | "speed-changed"
  | "empty";

export type HomeDrivePedestrianStreamingCacheEntry<TPlan> = Readonly<{
  id: string;
  plan: TPlan;
  center: HomeDriveVector2;
  headingRad: number;
  speedMps: number;
  createdAtSeconds: number;
  lastUsedAtSeconds: number;
  useCount: number;
}>;

export type HomeDrivePedestrianStreamingCache<TPlan> = Readonly<{
  entries: readonly HomeDrivePedestrianStreamingCacheEntry<TPlan>[];
  maxEntries: number;
}>;

export type HomeDrivePedestrianStreamingCacheOptions = Readonly<{
  maxEntries?: number;
  maxAgeSeconds?: number;
  maxReuseDistanceMeters?: number;
  maxHeadingDeltaRadians?: number;
  maxSpeedDeltaMps?: number;
}>;

export type HomeDrivePedestrianStreamingCacheLookupInput<TPlan> = Readonly<{
  cache: HomeDrivePedestrianStreamingCache<TPlan> | null | undefined;
  center: HomeDriveVector2;
  headingRad: number;
  speedMps: number;
  elapsedSeconds: number;
  options?: HomeDrivePedestrianStreamingCacheOptions;
}>;

export type HomeDrivePedestrianStreamingCacheLookupResult<TPlan> = Readonly<{
  entry: HomeDrivePedestrianStreamingCacheEntry<TPlan> | null;
  cache: HomeDrivePedestrianStreamingCache<TPlan>;
  reason: HomeDrivePedestrianStreamingCacheReason;
}>;

export type HomeDrivePedestrianStreamingCacheStoreInput<TPlan> = Readonly<{
  cache: HomeDrivePedestrianStreamingCache<TPlan> | null | undefined;
  plan: TPlan;
  id: string;
  center: HomeDriveVector2;
  headingRad: number;
  speedMps: number;
  elapsedSeconds: number;
  options?: HomeDrivePedestrianStreamingCacheOptions;
}>;
