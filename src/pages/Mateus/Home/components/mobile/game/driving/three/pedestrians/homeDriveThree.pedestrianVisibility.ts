// src/pages/Mateus/Home/components/mobile/game/driving/three/pedestrians/homeDriveThree.pedestrianVisibility.ts

import { HOME_DRIVE_PEDESTRIAN_CROWD_TUNING } from "../../domain/pedestrians/homeDrive.pedestrianCrowdTuning";
import {
  classifyHomeDrivePedestrianCornerSlot,
} from "../../domain/pedestrians/homeDrive.pedestrianCornerControl";
import type { HomeDriveRuntimeState } from "../../domain/homeDrive.types";
import type { HomeDrivePedestrianAgent, HomeDrivePedestrianRuntimeState } from "../../domain/pedestrians";
import type { HomeDriveThreePedestrianDetailLevel } from "./HomeDriveThreePedestrianAgent";
import { getHomeDriveThreePedestrianLodForDistance } from "./homeDriveThree.pedestrianLod";
import {
  createHomeDrivePedestrianAgentSpatialIndex,
  queryHomeDrivePedestrianSpatialIndex,
} from "../../domain/pedestrians/homeDrive.pedestrianSpatialIndex";

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
}>;

type CandidateEntry = HomeDriveThreeVisiblePedestrianEntry & Readonly<{
  distanceMeters: number;
  isCornerCandidate: boolean;
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
  const sectorCount = Math.max(
    1,
    HOME_DRIVE_PEDESTRIAN_CROWD_TUNING.visibility.angularSectorCount,
  );
  const angle = Math.atan2(position.z - center.z, position.x - center.x);
  const normalized = (angle + Math.PI) / (Math.PI * 2);

  return String(Math.floor(normalized * sectorCount) % sectorCount);
}

function getCellLimitForDetailLevel(
  detailLevel: HomeDriveThreePedestrianDetailLevel,
  isCornerCandidate: boolean,
): number {
  if (isCornerCandidate) {
    return HOME_DRIVE_PEDESTRIAN_CROWD_TUNING.visibility.maxCornerEntriesPerCell;
  }

  switch (detailLevel) {
    case "full":
      return HOME_DRIVE_PEDESTRIAN_CROWD_TUNING.visibility.maxFullDetailPerCell;

    case "medium":
      return HOME_DRIVE_PEDESTRIAN_CROWD_TUNING.visibility.maxMediumDetailPerCell;

    case "proxy":
    default:
      return HOME_DRIVE_PEDESTRIAN_CROWD_TUNING.visibility.maxProxyDetailPerCell;
  }
}

function getVisibilityRank(
  agent: HomeDrivePedestrianAgent,
  distanceSquared: number,
  detailLevel: HomeDriveThreePedestrianDetailLevel,
  isCornerCandidate: boolean,
): number {
  const detailBonus =
    detailLevel === "full" ? -120000 : detailLevel === "medium" ? -36000 : 0;
  const crosswalkBonus = agent.crosswalkId ? -5000 : 0;
  const socialPenalty =
    agent.groupKind === "couple" ||
    agent.groupKind === "chat-pair" ||
    agent.groupKind === "adult-child"
      ? 2200
      : 0;
  const cornerPenalty = isCornerCandidate ? 14000 : 0;

  return distanceSquared + detailBonus + crosswalkBonus + socialPenalty + cornerPenalty;
}

function isAgentNearCorner(
  agent: HomeDrivePedestrianAgent,
  pedestrianState?: HomeDrivePedestrianRuntimeState,
): boolean {
  const zone = pedestrianState?.zones.find((item) => item.id === agent.zoneId);

  if (!zone || agent.crosswalkId) {
    return Boolean(agent.crosswalkId);
  }

  return (
    classifyHomeDrivePedestrianCornerSlot(zone, agent.progress, agent.position)
      .classification !== "middle"
  );
}

function buildCandidateEntries(
  options: HomeDriveThreePedestrianVisibilityOptions,
): readonly CandidateEntry[] {
  const safeCellSizeMeters = Math.max(
    1,
    options.cellSizeMeters ??
      HOME_DRIVE_PEDESTRIAN_CROWD_TUNING.visibility.cellSizeMeters,
  );
  const center = options.runtime?.car.position ?? { x: 0, z: 0 };

  if (!options.runtime) {
    return options.agents.map((agent, index) => {
      const isCornerCandidate = isAgentNearCorner(agent, options.pedestrianState);

      return {
        agent,
        distanceSquared: 0,
        distanceMeters: 0,
        detailLevel: "medium",
        visibilityCellKey: getVisibilityCellKey(agent.position, safeCellSizeMeters),
        angularSectorKey: getAngularSectorKey(agent.position, center),
        visibilityRank: index + (isCornerCandidate ? 4000 : 0),
        isCornerCandidate,
      };
    });
  }

  const candidates: CandidateEntry[] = [];
  const visibleAgentIndex = createHomeDrivePedestrianAgentSpatialIndex(
    options.agents,
    safeCellSizeMeters,
  );
  const spatialCandidates = queryHomeDrivePedestrianSpatialIndex(
    visibleAgentIndex,
    {
      center: options.runtime.car.position,
      radiusMeters: options.visibleRadiusMeters,
    },
  ).items;

  for (const agent of spatialCandidates) {
    const distanceSquared = getDistanceSquared(agent.position, options.runtime.car.position);

    const lod = getHomeDriveThreePedestrianLodForDistance(distanceSquared, {
      fullDetailRadiusMeters: options.fullDetailRadiusMeters,
      mediumDetailRadiusMeters: options.mediumDetailRadiusMeters,
    });
    const isCornerCandidate = isAgentNearCorner(agent, options.pedestrianState);
    const visibilityCellKey = getVisibilityCellKey(
      agent.position,
      safeCellSizeMeters,
    );

    candidates.push({
      agent,
      distanceSquared,
      distanceMeters: lod.distanceMeters,
      detailLevel: lod.detailLevel,
      visibilityCellKey,
      angularSectorKey: getAngularSectorKey(agent.position, options.runtime.car.position),
      visibilityRank: getVisibilityRank(
        agent,
        distanceSquared,
        lod.detailLevel,
        isCornerCandidate,
      ),
      isCornerCandidate,
    });
  }

  return candidates.sort((first, second) => {
    if (Math.abs(first.visibilityRank - second.visibilityRank) > 0.0001) {
      return first.visibilityRank - second.visibilityRank;
    }

    return first.agent.id.localeCompare(second.agent.id);
  });
}

function selectSectorSeedEntries(
  candidates: readonly CandidateEntry[],
  maxVisiblePedestrians: number,
): readonly CandidateEntry[] {
  const targetSectorFill = Math.floor(
    maxVisiblePedestrians *
      HOME_DRIVE_PEDESTRIAN_CROWD_TUNING.visibility.minSectorFillRatio,
  );

  if (targetSectorFill <= 0) {
    return [];
  }

  const selected: CandidateEntry[] = [];
  const seenSectors = new Set<string>();

  for (const candidate of candidates) {
    if (selected.length >= targetSectorFill) {
      break;
    }

    if (seenSectors.has(candidate.angularSectorKey)) {
      continue;
    }

    seenSectors.add(candidate.angularSectorKey);
    selected.push(candidate);
  }

  return selected;
}

function dedupeCandidateEntriesByAgentId(
  entries: readonly CandidateEntry[],
): readonly CandidateEntry[] {
  const seen = new Set<string>();
  const uniqueEntries: CandidateEntry[] = [];

  entries.forEach((entry) => {
    if (seen.has(entry.agent.id)) {
      return;
    }

    seen.add(entry.agent.id);
    uniqueEntries.push(entry);
  });

  return uniqueEntries;
}

export function getHomeDriveThreeVisiblePedestrianEntries(
  options: HomeDriveThreePedestrianVisibilityOptions,
): readonly HomeDriveThreeVisiblePedestrianEntry[] {
  const safeMaxVisiblePedestrians = Math.max(
    0,
    Math.floor(options.maxVisiblePedestrians),
  );

  if (safeMaxVisiblePedestrians <= 0) {
    return [];
  }

  const candidates = dedupeCandidateEntriesByAgentId(
    buildCandidateEntries(options),
  );

  if (candidates.length <= safeMaxVisiblePedestrians) {
    return candidates;
  }

  const selected: CandidateEntry[] = [];
  const rejected: CandidateEntry[] = [];
  const selectedKeys = new Set<string>();
  const selectedCountByCell = new Map<string, number>();
  const sectorSeeds = selectSectorSeedEntries(candidates, safeMaxVisiblePedestrians);

  for (const candidate of sectorSeeds) {
    selected.push(candidate);
    selectedKeys.add(candidate.agent.id);
    selectedCountByCell.set(
      candidate.visibilityCellKey,
      (selectedCountByCell.get(candidate.visibilityCellKey) ?? 0) + 1,
    );
  }

  for (const candidate of candidates) {
    if (selected.length >= safeMaxVisiblePedestrians) {
      rejected.push(candidate);
      continue;
    }

    if (selectedKeys.has(candidate.agent.id)) {
      continue;
    }

    const currentCellCount = selectedCountByCell.get(candidate.visibilityCellKey) ?? 0;
    const cellLimit = getCellLimitForDetailLevel(
      candidate.detailLevel,
      candidate.isCornerCandidate,
    );

    if (currentCellCount >= cellLimit) {
      rejected.push(candidate);
      continue;
    }

    selectedCountByCell.set(candidate.visibilityCellKey, currentCellCount + 1);
    selectedKeys.add(candidate.agent.id);
    selected.push(candidate);
  }

  const fallbackLimit = Math.floor(
    safeMaxVisiblePedestrians *
      HOME_DRIVE_PEDESTRIAN_CROWD_TUNING.visibility.maxFallbackFillRatio,
  );
  const fallbackSlots = Math.max(
    0,
    Math.min(fallbackLimit, safeMaxVisiblePedestrians - selected.length),
  );

  if (fallbackSlots > 0) {
    selected.push(
      ...rejected
        .filter((candidate) => !selectedKeys.has(candidate.agent.id))
        .slice(0, fallbackSlots),
    );
  }

  return selected
    .sort((first, second) => first.distanceSquared - second.distanceSquared)
    .slice(0, safeMaxVisiblePedestrians)
    .map((entry) => ({
      agent: entry.agent,
      distanceSquared: entry.distanceSquared,
      detailLevel: entry.detailLevel,
      visibilityCellKey: entry.visibilityCellKey,
      angularSectorKey: entry.angularSectorKey,
      visibilityRank: entry.visibilityRank,
    }));
}
