// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianGroups.ts

import type {
  HomeDrivePedestrianBehavior,
  HomeDrivePedestrianGroupDraft,
  HomeDrivePedestrianGroupKind,
  HomeDrivePedestrianGroupMemberDraft,
  HomeDrivePedestrianProp,
  HomeDrivePedestrianRole,
  HomeDrivePedestrianSidewalkZone,
} from "./homeDrive.pedestrians.types";
import {
  clamp01,
  createHomeDrivePedestrianSeed,
  pickFromWeightedOptions,
  seededRange,
  seededSign,
} from "./homeDrive.pedestrianRandom";

function getGroupKind(
  zone: HomeDrivePedestrianSidewalkZone,
  seed: number,
): HomeDrivePedestrianGroupKind {
  const commercialBias = zone.roadKind === "commercial" ? 0.18 : 0;
  const coastalBias = zone.roadKind === "coastal" ? 0.08 : 0;
  const servicePenalty = zone.roadKind === "service" ? -0.08 : 0;

  return pickFromWeightedOptions<HomeDrivePedestrianGroupKind>(
    [
      { value: "solo", weight: 0.48 + servicePenalty },
      { value: "shopper", weight: 0.12 + commercialBias },
      { value: "smoker", weight: 0.08 + commercialBias * 0.25 },
      { value: "couple", weight: 0.1 + coastalBias },
      { value: "adult-child", weight: 0.09 },
      { value: "chat-pair", weight: 0.08 + commercialBias * 0.4 },
      { value: "worker", weight: 0.05 },
    ],
    seed,
    601,
    "solo",
  );
}

function member(
  role: HomeDrivePedestrianRole,
  behaviorHint: HomeDrivePedestrianBehavior,
  props: readonly HomeDrivePedestrianProp[],
  groupForwardOffsetMeters: number,
  groupSideOffsetMeters: number,
  handHoldPeerIndex: number | null = null,
): HomeDrivePedestrianGroupMemberDraft {
  return {
    role,
    behaviorHint,
    props,
    groupForwardOffsetMeters,
    groupSideOffsetMeters,
    handHoldPeerIndex,
  };
}

function getMembersForGroup(
  kind: HomeDrivePedestrianGroupKind,
  seed: number,
): readonly HomeDrivePedestrianGroupMemberDraft[] {
  const side = seededSign(seed, 607);

  switch (kind) {
    case "shopper":
      return [
        member(
          "shopper",
          "shop-walk",
          ["shopping-bag-left", "shopping-bag-right"],
          0,
          0,
        ),
      ];

    case "smoker":
      return [member("smoker", "smoke", ["cigarette"], 0, 0)];

    case "couple":
      return [
        member("adult", "walk", [], -0.28, side * 0.38),
        member("adult", "walk", [], 0.24, -side * 0.38),
      ];

    case "adult-child":
      return [
        member("parent", "hold-child-hand", ["child-hand-link"], 0, side * 0.28, 1),
        member("child", "hold-child-hand", ["child-hand-link"], 0.16, -side * 0.34, 0),
      ];

    case "chat-pair":
      return [
        member("adult", "talk", [], -0.2, side * 0.48),
        member("adult", "talk", [], 0.2, -side * 0.48),
      ];

    case "worker":
      return [member("worker", "walk", ["backpack"], 0, 0)];

    case "solo":
    default:
      return [member("adult", "walk", [], 0, 0)];
  }
}

function getGroupBaseSpeedMps(kind: HomeDrivePedestrianGroupKind, seed: number): number {
  switch (kind) {
    case "smoker":
      return seededRange(seed, 613, 0.0, 0.18);
    case "shopper":
      return seededRange(seed, 617, 0.48, 0.86);
    case "adult-child":
      return seededRange(seed, 619, 0.42, 0.76);
    case "chat-pair":
      return seededRange(seed, 631, 0.0, 0.12);
    case "couple":
      return seededRange(seed, 641, 0.62, 1.0);
    case "worker":
      return seededRange(seed, 643, 0.92, 1.34);
    case "solo":
    default:
      return seededRange(seed, 647, 0.68, 1.22);
  }
}

export function createHomeDrivePedestrianGroupDraft(
  input: Readonly<{
    zone: HomeDrivePedestrianSidewalkZone;
    slotIndex: number;
    slotCount: number;
    seed: number;
  }>,
): HomeDrivePedestrianGroupDraft {
  const slotCount = Math.max(1, input.slotCount);
  const groupSeed = createHomeDrivePedestrianSeed(
    input.zone.id,
    input.seed,
    input.slotIndex,
    slotCount,
  );
  const kind = getGroupKind(input.zone, groupSeed);
  const progressJitter = seededRange(groupSeed, 653, -0.28, 0.28);
  const progress = clamp01((input.slotIndex + 0.5 + progressJitter) / slotCount);
  const directionSign = seededSign(groupSeed, 659);

  return {
    id: `ped-group-${input.zone.id}-${input.slotIndex}-${kind}`,
    kind,
    zoneId: input.zone.id,
    segmentId: input.zone.segmentId,
    side: input.zone.side,
    progress: Math.max(0.025, Math.min(0.975, progress)),
    directionSign,
    baseSpeedMps: getGroupBaseSpeedMps(kind, groupSeed),
    seed: groupSeed,
    members: getMembersForGroup(kind, groupSeed),
  };
}

export function getHomeDrivePedestrianGroupMaxMemberCount(
  kind: HomeDrivePedestrianGroupKind,
): number {
  switch (kind) {
    case "couple":
    case "adult-child":
    case "chat-pair":
      return 2;
    case "solo":
    case "shopper":
    case "smoker":
    case "worker":
    default:
      return 1;
  }
}
