// src/pages/Mateus/Home/components/mobile/game/driving/three/pedestrians/homeDriveThree.pedestrianVisibility.ts

import type { HomeDriveRuntimeState } from "../../domain/homeDrive.types";
import { HOME_DRIVE_PEDESTRIAN_CROWD_TUNING } from "../../domain/pedestrians/homeDrive.pedestrianCrowdTuning";
import { classifyHomeDrivePedestrianCornerSlot } from "../../domain/pedestrians/homeDrive.pedestrianCornerControl";
import {
  createHomeDrivePedestrianAgentSpatialIndex,
  queryHomeDrivePedestrianSpatialIndex,
} from "../../domain/pedestrians/homeDrive.pedestrianSpatialIndex";
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

  /** Consulta extra só para instancing frontal em alta velocidade. */
  visualPrewarmRadiusMeters?: number;
  visualPrewarmConeRadians?: number;
  maxVisualPrewarmPedestrians?: number;
}>;

type CandidateEntry = HomeDriveThreeVisiblePedestrianEntry &
  Readonly<{
    distanceMeters: number;
    isCornerCandidate: boolean;
    isVisualPrewarmCandidate: boolean;
  }>;

type CarFrameCoordinates = Readonly<{
  forwardMeters: number;
  lateralMeters: number;
  absoluteLateralMeters: number;
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
  if (detailLevel === "proxy") {
    return 0;
  }

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
      return 0;
  }
}

function getVisibilityRank(
  agent: HomeDrivePedestrianAgent,
  distanceSquared: number,
  detailLevel: HomeDriveThreePedestrianDetailLevel,
  isCornerCandidate: boolean,
  isVisualPrewarmCandidate: boolean,
  frameCoordinates?: CarFrameCoordinates,
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
  const visualPrewarmPenalty = isVisualPrewarmCandidate
    ? 9000 +
      Math.max(0, frameCoordinates?.forwardMeters ?? 0) * 2.2 +
      (frameCoordinates?.absoluteLateralMeters ?? 0) * 18
    : 0;

  return (
    distanceSquared +
    detailBonus +
    crosswalkBonus +
    socialPenalty +
    cornerPenalty +
    visualPrewarmPenalty
  );
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

function getBaseRenderRadiusMeters(
  options: HomeDriveThreePedestrianVisibilityOptions,
): number {
  const visibleRadiusMeters = Math.max(0, options.visibleRadiusMeters);
  const mediumDetailRadiusMeters = Math.max(
    options.fullDetailRadiusMeters,
    options.mediumDetailRadiusMeters,
  );

  if (visibleRadiusMeters <= 0) {
    return 0;
  }

  return Math.min(visibleRadiusMeters, mediumDetailRadiusMeters);
}

function getQueryRadiusMeters(
  options: HomeDriveThreePedestrianVisibilityOptions,
): number {
  const baseRenderRadiusMeters = getBaseRenderRadiusMeters(options);
  const visualPrewarmRadiusMeters = Math.max(
    0,
    options.visualPrewarmRadiusMeters ?? 0,
  );

  return Math.max(baseRenderRadiusMeters, visualPrewarmRadiusMeters);
}

function shouldRenderDetailLevel(
  detailLevel: HomeDriveThreePedestrianDetailLevel,
): detailLevel is Exclude<HomeDriveThreePedestrianDetailLevel, "proxy"> {
  return detailLevel === "full" || detailLevel === "medium";
}

function getCarFrameCoordinates(
  agent: HomeDrivePedestrianAgent,
  runtime: HomeDriveRuntimeState,
): CarFrameCoordinates {
  const dx = agent.position.x - runtime.car.position.x;
  const dz = agent.position.z - runtime.car.position.z;
  const forwardX = Math.sin(runtime.car.headingRad);
  const forwardZ = Math.cos(runtime.car.headingRad);
  const rightX = Math.cos(runtime.car.headingRad);
  const rightZ = -Math.sin(runtime.car.headingRad);
  const forwardMeters = dx * forwardX + dz * forwardZ;
  const lateralMeters = dx * rightX + dz * rightZ;

  return {
    forwardMeters,
    lateralMeters,
    absoluteLateralMeters: Math.abs(lateralMeters),
  };
}

function isVisualPrewarmCandidate(params: Readonly<{
  frame: CarFrameCoordinates;
  distanceSquared: number;
  baseRenderRadiusMeters: number;
  visualPrewarmRadiusMeters: number;
  visualPrewarmConeRadians: number;
}>): boolean {
  if (params.visualPrewarmRadiusMeters <= params.baseRenderRadiusMeters) {
    return false;
  }

  if (
    params.distanceSquared <=
    params.baseRenderRadiusMeters * params.baseRenderRadiusMeters
  ) {
    return false;
  }

  if (
    params.distanceSquared >
    params.visualPrewarmRadiusMeters * params.visualPrewarmRadiusMeters
  ) {
    return false;
  }

  if (params.frame.forwardMeters <= params.baseRenderRadiusMeters * 0.42) {
    return false;
  }

  if (params.frame.forwardMeters > params.visualPrewarmRadiusMeters) {
    return false;
  }

  const coneHalfRadians = Math.max(
    0.16,
    Math.min(Math.PI * 0.48, params.visualPrewarmConeRadians * 0.5),
  );
  const coneHalfWidthMeters = Math.max(
    30,
    Math.tan(coneHalfRadians) * Math.max(18, params.frame.forwardMeters),
  );

  return params.frame.absoluteLateralMeters <= coneHalfWidthMeters;
}

function createCandidateEntry(params: Readonly<{
  agent: HomeDrivePedestrianAgent;
  center: Readonly<{ x: number; z: number }>;
  distanceSquared: number;
  distanceMeters: number;
  detailLevel: HomeDriveThreePedestrianDetailLevel;
  isCornerCandidate: boolean;
  isVisualPrewarmCandidate: boolean;
  frameCoordinates?: CarFrameCoordinates;
  safeCellSizeMeters: number;
}>): CandidateEntry {
  return {
    agent: params.agent,
    distanceSquared: params.distanceSquared,
    distanceMeters: params.distanceMeters,
    detailLevel: params.detailLevel,
    visibilityCellKey: getVisibilityCellKey(
      params.agent.position,
      params.safeCellSizeMeters,
    ),
    angularSectorKey: getAngularSectorKey(params.agent.position, params.center),
    visibilityRank: getVisibilityRank(
      params.agent,
      params.distanceSquared,
      params.detailLevel,
      params.isCornerCandidate,
      params.isVisualPrewarmCandidate,
      params.frameCoordinates,
    ),
    isCornerCandidate: params.isCornerCandidate,
    isVisualPrewarmCandidate: params.isVisualPrewarmCandidate,
  };
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
  const baseRenderRadiusMeters = getBaseRenderRadiusMeters(options);
  const queryRadiusMeters = getQueryRadiusMeters(options);
  const queryRadiusSquared = queryRadiusMeters * queryRadiusMeters;

  if (queryRadiusMeters <= 0) {
    return [];
  }

  if (!options.runtime) {
    return options.agents
      .filter((agent) => {
        return getDistanceSquared(agent.position, center) <= queryRadiusSquared;
      })
      .map((agent, index) => {
        const distanceSquared = getDistanceSquared(agent.position, center);
        const isCornerCandidate = isAgentNearCorner(agent, options.pedestrianState);

        return {
          agent,
          distanceSquared,
          distanceMeters: Math.sqrt(Math.max(0, distanceSquared)),
          detailLevel: "medium",
          visibilityCellKey: getVisibilityCellKey(
            agent.position,
            safeCellSizeMeters,
          ),
          angularSectorKey: getAngularSectorKey(agent.position, center),
          visibilityRank: index + (isCornerCandidate ? 4000 : 0),
          isCornerCandidate,
          isVisualPrewarmCandidate: false,
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
      radiusMeters: queryRadiusMeters,
    },
  ).items;
  const visualPrewarmRadiusMeters = Math.max(
    baseRenderRadiusMeters,
    options.visualPrewarmRadiusMeters ?? 0,
  );
  const visualPrewarmConeRadians = Math.max(
    0.28,
    options.visualPrewarmConeRadians ?? 0.96,
  );

  for (const agent of spatialCandidates) {
    const distanceSquared = getDistanceSquared(
      agent.position,
      options.runtime.car.position,
    );

    if (distanceSquared > queryRadiusSquared) {
      continue;
    }

    const frameCoordinates = getCarFrameCoordinates(agent, options.runtime);
    const lod = getHomeDriveThreePedestrianLodForDistance(distanceSquared, {
      fullDetailRadiusMeters: options.fullDetailRadiusMeters,
      mediumDetailRadiusMeters: options.mediumDetailRadiusMeters,
    });
    const visualPrewarmCandidate =
      lod.detailLevel === "proxy" &&
      isVisualPrewarmCandidate({
        frame: frameCoordinates,
        distanceSquared,
        baseRenderRadiusMeters,
        visualPrewarmRadiusMeters,
        visualPrewarmConeRadians,
      });
    const detailLevel: HomeDriveThreePedestrianDetailLevel =
      visualPrewarmCandidate ? "medium" : lod.detailLevel;

    if (!shouldRenderDetailLevel(detailLevel)) {
      continue;
    }

    const isCornerCandidate = isAgentNearCorner(agent, options.pedestrianState);

    candidates.push(
      createCandidateEntry({
        agent,
        center: options.runtime.car.position,
        distanceSquared,
        distanceMeters: lod.distanceMeters,
        detailLevel,
        isCornerCandidate,
        isVisualPrewarmCandidate: visualPrewarmCandidate,
        frameCoordinates,
        safeCellSizeMeters,
      }),
    );
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

    if (candidate.detailLevel === "proxy") {
      continue;
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

    if (entry.detailLevel === "proxy") {
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
    Math.floor(
      Math.max(
        options.maxVisiblePedestrians,
        options.maxVisualPrewarmPedestrians ?? 0,
      ),
    ),
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
  const sectorSeeds = selectSectorSeedEntries(
    candidates,
    safeMaxVisiblePedestrians,
  );

  for (const candidate of sectorSeeds) {
    if (candidate.detailLevel === "proxy") {
      continue;
    }

    selected.push(candidate);
    selectedKeys.add(candidate.agent.id);
    selectedCountByCell.set(
      candidate.visibilityCellKey,
      (selectedCountByCell.get(candidate.visibilityCellKey) ?? 0) + 1,
    );
  }

  for (const candidate of candidates) {
    if (candidate.detailLevel === "proxy") {
      continue;
    }

    if (selected.length >= safeMaxVisiblePedestrians) {
      rejected.push(candidate);
      continue;
    }

    if (selectedKeys.has(candidate.agent.id)) {
      continue;
    }

    const currentCellCount =
      selectedCountByCell.get(candidate.visibilityCellKey) ?? 0;
    const cellLimit = getCellLimitForDetailLevel(
      candidate.detailLevel,
      candidate.isCornerCandidate,
    );
    const relaxedPrewarmLimit = candidate.isVisualPrewarmCandidate
      ? Math.max(1, cellLimit)
      : cellLimit;

    if (relaxedPrewarmLimit <= 0 || currentCellCount >= relaxedPrewarmLimit) {
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
        .filter((candidate) => {
          return (
            candidate.detailLevel !== "proxy" &&
            !selectedKeys.has(candidate.agent.id)
          );
        })
        .slice(0, fallbackSlots),
    );
  }

  return selected
    .filter((entry) => entry.detailLevel !== "proxy")
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
