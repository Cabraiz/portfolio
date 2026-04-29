// src/pages/Mateus/Home/components/mobile/game/driving/domain/pedestrians/homeDrive.pedestrianBehaviors.ts

import type {
  HomeDrivePedestrianAnimationKey,
  HomeDrivePedestrianBehavior,
  HomeDrivePedestrianBehaviorAssignment,
  HomeDrivePedestrianProp,
  HomeDrivePedestrianRole,
  HomeDrivePedestrianSidewalkZone,
  HomeDrivePedestrianWalkStyleKey,
} from "./homeDrive.pedestrians.types";
import {
  clamp,
  pickFromWeightedOptions,
  seededRange,
} from "./homeDrive.pedestrianRandom";

function getRoleSpeedMultiplier(role: HomeDrivePedestrianRole): number {
  switch (role) {
    case "child":
      return 0.74;
    case "elder":
      return 0.58;
    case "shopper":
      return 0.7;
    case "smoker":
      return 0.62;
    case "worker":
      return 0.92;
    case "runner":
      return 1.65;
    case "parent":
      return 0.72;
    case "adult":
    default:
      return 1;
  }
}

function getWalkStyleSpeedMultiplier(style: HomeDrivePedestrianWalkStyleKey): number {
  switch (style) {
    case "relaxed":
      return 0.82;
    case "hurried":
      return 1.24;
    case "heavy":
      return 0.68;
    case "childlike":
      return 0.78;
    case "neutral":
    default:
      return 1;
  }
}

export function getHomeDrivePedestrianBaseSpeedMps(
  role: HomeDrivePedestrianRole,
  walkStyle: HomeDrivePedestrianWalkStyleKey,
  seed: number,
): number {
  const baseSpeed = seededRange(seed, 300, 0.82, 1.48);
  const speed = baseSpeed * getRoleSpeedMultiplier(role) * getWalkStyleSpeedMultiplier(walkStyle);

  return clamp(speed, 0.28, role === "runner" ? 2.45 : 1.68);
}

function getBehaviorAnimationKey(
  role: HomeDrivePedestrianRole,
  behavior: HomeDrivePedestrianBehavior,
): HomeDrivePedestrianAnimationKey {
  switch (behavior) {
    case "smoke":
      return "smoke";
    case "phone":
      return "phone";
    case "talk":
      return "talk";
    case "shop-walk":
      return "carry-bags";
    case "hold-child-hand":
      return role === "child" ? "child-walk" : "slow-walk";
    case "wait-crossing":
    case "idle":
      return "idle";
    case "walk":
    default:
      if (role === "child") {
        return "child-walk";
      }

      if (role === "runner") {
        return "fast-walk";
      }

      if (role === "elder" || role === "shopper" || role === "parent") {
        return "slow-walk";
      }

      return "walk";
  }
}

function getBehaviorSpeedMultiplier(behavior: HomeDrivePedestrianBehavior): number {
  switch (behavior) {
    case "idle":
    case "smoke":
    case "phone":
    case "talk":
    case "wait-crossing":
      return 0;
    case "shop-walk":
      return 0.72;
    case "hold-child-hand":
      return 0.62;
    case "walk":
    default:
      return 1;
  }
}

function getBehaviorDurationSeconds(
  behavior: HomeDrivePedestrianBehavior,
  seed: number,
): number {
  switch (behavior) {
    case "smoke":
      return seededRange(seed, 311, 5.5, 13.5);
    case "phone":
      return seededRange(seed, 313, 3.6, 10.8);
    case "talk":
      return seededRange(seed, 317, 4.8, 12.5);
    case "wait-crossing":
      return seededRange(seed, 331, 2.6, 7.5);
    case "idle":
      return seededRange(seed, 337, 1.8, 6.2);
    case "shop-walk":
    case "hold-child-hand":
    case "walk":
    default:
      return seededRange(seed, 347, 4.5, 16.5);
  }
}

function getDefaultPropsForBehavior(
  role: HomeDrivePedestrianRole,
  behavior: HomeDrivePedestrianBehavior,
  existingProps: readonly HomeDrivePedestrianProp[],
): readonly HomeDrivePedestrianProp[] {
  const props = new Set<HomeDrivePedestrianProp>(existingProps);

  if (role === "smoker" || behavior === "smoke") {
    props.add("cigarette");
  }

  if (role === "shopper" || behavior === "shop-walk") {
    props.add("shopping-bag-left");

    if (role === "shopper") {
      props.add("shopping-bag-right");
    }
  }

  if (behavior === "phone") {
    props.add("phone");
  }

  if (behavior === "hold-child-hand") {
    props.add("child-hand-link");
  }

  if (role === "worker") {
    props.add("backpack");
  }

  return Array.from(props);
}

export function pickHomeDrivePedestrianRole(
  zone: HomeDrivePedestrianSidewalkZone,
  seed: number,
): HomeDrivePedestrianRole {
  const commercialBias = zone.roadKind === "commercial" ? 0.16 : 0;
  const coastalBias = zone.roadKind === "coastal" ? 0.08 : 0;
  const avenueBias = zone.roadKind === "avenue" ? 0.08 : 0;

  return pickFromWeightedOptions<HomeDrivePedestrianRole>(
    [
      { value: "adult", weight: 0.46 },
      { value: "shopper", weight: 0.12 + commercialBias },
      { value: "smoker", weight: 0.06 + commercialBias * 0.4 },
      { value: "worker", weight: 0.09 + avenueBias },
      { value: "elder", weight: 0.07 },
      { value: "runner", weight: 0.03 + coastalBias },
      { value: "parent", weight: 0.09 },
      { value: "child", weight: 0.08 },
    ],
    seed,
    353,
    "adult",
  );
}

export function pickHomeDrivePedestrianBehavior(
  role: HomeDrivePedestrianRole,
  zone: HomeDrivePedestrianSidewalkZone,
  seed: number,
  behaviorHint?: HomeDrivePedestrianBehavior,
): HomeDrivePedestrianBehavior {
  if (behaviorHint) {
    return behaviorHint;
  }

  if (role === "runner") {
    return "walk";
  }

  if (role === "smoker") {
    return pickFromWeightedOptions<HomeDrivePedestrianBehavior>(
      [
        { value: "smoke", weight: 0.72 },
        { value: "walk", weight: 0.18 },
        { value: "phone", weight: 0.1 },
      ],
      seed,
      359,
      "smoke",
    );
  }

  if (role === "shopper") {
    return pickFromWeightedOptions<HomeDrivePedestrianBehavior>(
      [
        { value: "shop-walk", weight: 0.76 },
        { value: "idle", weight: 0.12 },
        { value: "phone", weight: 0.12 },
      ],
      seed,
      367,
      "shop-walk",
    );
  }

  const isBusyRoad = zone.roadKind === "commercial" || zone.roadKind === "avenue";

  return pickFromWeightedOptions<HomeDrivePedestrianBehavior>(
    [
      { value: "walk", weight: isBusyRoad ? 0.58 : 0.48 },
      { value: "idle", weight: 0.14 },
      { value: "phone", weight: 0.12 },
      { value: "talk", weight: 0.08 },
      { value: "wait-crossing", weight: isBusyRoad ? 0.08 : 0.03 },
    ],
    seed,
    373,
    "walk",
  );
}

export function createHomeDrivePedestrianBehaviorAssignment(
  input: Readonly<{
    role: HomeDrivePedestrianRole;
    zone: HomeDrivePedestrianSidewalkZone;
    seed: number;
    baseSpeedMps: number;
    existingProps?: readonly HomeDrivePedestrianProp[];
    behaviorHint?: HomeDrivePedestrianBehavior;
  }>,
): HomeDrivePedestrianBehaviorAssignment {
  const behavior = pickHomeDrivePedestrianBehavior(
    input.role,
    input.zone,
    input.seed,
    input.behaviorHint,
  );
  const animationKey = getBehaviorAnimationKey(input.role, behavior);
  const props = getDefaultPropsForBehavior(
    input.role,
    behavior,
    input.existingProps ?? [],
  );

  return {
    behavior,
    animationKey,
    props,
    targetSpeedMps: input.baseSpeedMps * getBehaviorSpeedMultiplier(behavior),
    durationSeconds: getBehaviorDurationSeconds(behavior, input.seed),
  };
}

export function shouldHomeDrivePedestrianMove(
  behavior: HomeDrivePedestrianBehavior,
): boolean {
  return (
    behavior === "walk" ||
    behavior === "shop-walk" ||
    behavior === "hold-child-hand"
  );
}
