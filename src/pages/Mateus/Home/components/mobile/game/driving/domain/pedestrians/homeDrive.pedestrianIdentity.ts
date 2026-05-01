// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianIdentity.ts

import type { HomeDrivePedestrianAgent } from "./homeDrive.pedestrians.types";

const HOME_DRIVE_PEDESTRIAN_IDENTITY_EMPTY_PART = "x";
const HOME_DRIVE_PEDESTRIAN_IDENTITY_MAX_PART_LENGTH = 84;
const HOME_DRIVE_PEDESTRIAN_IDENTITY_MAX_PREFIX_LENGTH = 220;

export type HomeDrivePedestrianIdentityNamespace =
  | "initial"
  | "local"
  | "stream"
  | "crosswalk"
  | "runtime"
  | "render";

export type HomeDrivePedestrianDuplicateAgentId = Readonly<{
  id: string;
  count: number;
}>;

export type HomeDrivePedestrianSpawnInstanceIdInput = Readonly<{
  namespace?: HomeDrivePedestrianIdentityNamespace;

  generationSerial?: number;
  agentSerial?: number;
  slotIndex?: number;
  memberIndex?: number;

  slotId?: string;
  zoneId?: string;
  segmentId?: string;
  sidewalkSide?: string;
  groupKind?: string;

  slotSeed?: number;
  seed?: number;
  progress?: number;
  elapsedSeconds?: number;

  /**
   * Use para diferenciar chamadas geradas no mesmo frame/generation.
   * Ex.: loopIndex, reservoir index, crosswalk id, streaming sector key.
   */
  salt?: string | number | null;
}>;

export type HomeDrivePedestrianGroupInstanceIdInput =
  HomeDrivePedestrianSpawnInstanceIdInput &
    Readonly<{
      groupId?: string;
    }>;

export type HomeDrivePedestrianAgentIdInput =
  HomeDrivePedestrianGroupInstanceIdInput &
    Readonly<{
      memberIndex: number;
    }>;

export type HomeDrivePedestrianDedupePolicy =
  | "keep-first"
  | "keep-last"
  | "prefer-crosswalk";

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function normalizeNumberIdentityPart(value: number): string {
  if (!Number.isFinite(value)) {
    return HOME_DRIVE_PEDESTRIAN_IDENTITY_EMPTY_PART;
  }

  if (Math.abs(value) < 1) {
    return String(Math.round(value * 10_000));
  }

  if (Math.abs(value) < 10_000) {
    return String(Math.round(value * 1_000));
  }

  return String(Math.round(value));
}

export function normalizeHomeDrivePedestrianIdentityPart(
  value: string | number | boolean | null | undefined,
): string {
  if (value === null || typeof value === "undefined") {
    return HOME_DRIVE_PEDESTRIAN_IDENTITY_EMPTY_PART;
  }

  const rawValue =
    typeof value === "number" ? normalizeNumberIdentityPart(value) : String(value);

  const normalized = rawValue
    .trim()
    .toLowerCase()
    .replace(/::/g, "-")
    .replace(/[^a-z0-9._:-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^[-_.:]+|[-_.:]+$/g, "")
    .slice(0, HOME_DRIVE_PEDESTRIAN_IDENTITY_MAX_PART_LENGTH);

  return normalized.length > 0
    ? normalized
    : HOME_DRIVE_PEDESTRIAN_IDENTITY_EMPTY_PART;
}

function hashHomeDrivePedestrianIdentityParts(
  parts: readonly (string | number | boolean | null | undefined)[],
): string {
  let hash = 2166136261;

  for (const part of parts) {
    const normalized = normalizeHomeDrivePedestrianIdentityPart(part);

    for (let index = 0; index < normalized.length; index += 1) {
      hash ^= normalized.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }

    hash ^= 124;
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36).padStart(7, "0");
}

export function createHomeDrivePedestrianIdentityToken(
  parts: readonly (string | number | boolean | null | undefined)[],
): string {
  const normalizedParts = parts
    .map(normalizeHomeDrivePedestrianIdentityPart)
    .filter((part) => part !== HOME_DRIVE_PEDESTRIAN_IDENTITY_EMPTY_PART);

  const prefix = normalizedParts
    .join("-")
    .slice(0, HOME_DRIVE_PEDESTRIAN_IDENTITY_MAX_PREFIX_LENGTH);
  const hash = hashHomeDrivePedestrianIdentityParts(parts);

  return `${prefix || HOME_DRIVE_PEDESTRIAN_IDENTITY_EMPTY_PART}-${hash}`;
}

export function createHomeDrivePedestrianSpawnInstanceId(
  input: HomeDrivePedestrianSpawnInstanceIdInput,
): string {
  const namespace = input.namespace ?? "local";

  return createHomeDrivePedestrianIdentityToken([
    namespace,
    isFiniteNumber(input.generationSerial) ? `g${input.generationSerial}` : null,
    isFiniteNumber(input.agentSerial) ? `a${input.agentSerial}` : null,
    input.zoneId,
    input.segmentId,
    input.sidewalkSide,
    isFiniteNumber(input.slotIndex) ? `slot${input.slotIndex}` : null,
    isFiniteNumber(input.slotSeed) ? `ss${input.slotSeed}` : null,
    isFiniteNumber(input.seed) ? `seed${input.seed}` : null,
    isFiniteNumber(input.progress) ? `p${input.progress}` : null,
    isFiniteNumber(input.elapsedSeconds)
      ? `t${Math.floor(input.elapsedSeconds * 10)}`
      : null,
    input.groupKind,
    input.slotId,
    input.salt,
  ]);
}

export function createHomeDrivePedestrianGroupInstanceId(
  input: HomeDrivePedestrianGroupInstanceIdInput,
): string {
  const spawnInstanceId = createHomeDrivePedestrianSpawnInstanceId(input);

  return createHomeDrivePedestrianIdentityToken([
    "group",
    input.namespace ?? "local",
    input.groupId,
    spawnInstanceId,
  ]);
}

export function createHomeDrivePedestrianAgentId(
  input: HomeDrivePedestrianAgentIdInput,
): string {
  const groupInstanceId = createHomeDrivePedestrianGroupInstanceId(input);

  return createHomeDrivePedestrianIdentityToken([
    "ped",
    input.namespace ?? "local",
    groupInstanceId,
    `m${input.memberIndex}`,
  ]);
}

export function createHomeDriveInitialPedestrianGroupId(
  input: HomeDrivePedestrianGroupInstanceIdInput,
): string {
  return createHomeDrivePedestrianGroupInstanceId({
    ...input,
    namespace: "initial",
  });
}

export function createHomeDriveInitialPedestrianAgentId(
  input: HomeDrivePedestrianAgentIdInput,
): string {
  return createHomeDrivePedestrianAgentId({
    ...input,
    namespace: "initial",
  });
}

export function createHomeDriveLocalPedestrianGroupId(
  input: HomeDrivePedestrianGroupInstanceIdInput,
): string {
  return createHomeDrivePedestrianGroupInstanceId({
    ...input,
    namespace: "local",
  });
}

export function createHomeDriveLocalPedestrianAgentId(
  input: HomeDrivePedestrianAgentIdInput,
): string {
  return createHomeDrivePedestrianAgentId({
    ...input,
    namespace: "local",
  });
}

export function getHomeDrivePedestrianDuplicateAgentIds(
  agents: readonly HomeDrivePedestrianAgent[],
): readonly HomeDrivePedestrianDuplicateAgentId[] {
  const counts = new Map<string, number>();

  agents.forEach((agent) => {
    counts.set(agent.id, (counts.get(agent.id) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .map(([id, count]) => ({
      id,
      count,
    }))
    .sort((first, second) => {
      if (second.count !== first.count) {
        return second.count - first.count;
      }

      return first.id.localeCompare(second.id);
    });
}

function shouldReplacePedestrianAgent(
  current: HomeDrivePedestrianAgent,
  next: HomeDrivePedestrianAgent,
  policy: HomeDrivePedestrianDedupePolicy,
): boolean {
  switch (policy) {
    case "keep-last":
      return true;

    case "prefer-crosswalk":
      if (current.crosswalkId && !next.crosswalkId) {
        return false;
      }

      if (!current.crosswalkId && next.crosswalkId) {
        return true;
      }

      return false;

    case "keep-first":
    default:
      return false;
  }
}

export function dedupeHomeDrivePedestrianAgentsById(
  agents: readonly HomeDrivePedestrianAgent[],
  policy: HomeDrivePedestrianDedupePolicy = "prefer-crosswalk",
): readonly HomeDrivePedestrianAgent[] {
  if (agents.length <= 1) {
    return agents;
  }

  const acceptedById = new Map<string, HomeDrivePedestrianAgent>();
  const acceptedOrder: string[] = [];

  agents.forEach((agent) => {
    const current = acceptedById.get(agent.id);

    if (!current) {
      acceptedById.set(agent.id, agent);
      acceptedOrder.push(agent.id);
      return;
    }

    if (shouldReplacePedestrianAgent(current, agent, policy)) {
      acceptedById.set(agent.id, agent);
    }
  });

  return acceptedOrder
    .map((id) => acceptedById.get(id))
    .filter((agent): agent is HomeDrivePedestrianAgent => Boolean(agent));
}

export function hasHomeDrivePedestrianDuplicateAgentIds(
  agents: readonly HomeDrivePedestrianAgent[],
): boolean {
  const seen = new Set<string>();

  for (const agent of agents) {
    if (seen.has(agent.id)) {
      return true;
    }

    seen.add(agent.id);
  }

  return false;
}

export function createHomeDrivePedestrianReservedIdSet(
  agents: readonly HomeDrivePedestrianAgent[],
): Set<string> {
  return new Set(agents.map((agent) => agent.id));
}

export function reserveHomeDrivePedestrianAgentId(
  reservedIds: Set<string>,
  agentId: string,
): boolean {
  if (reservedIds.has(agentId)) {
    return false;
  }

  reservedIds.add(agentId);
  return true;
}
