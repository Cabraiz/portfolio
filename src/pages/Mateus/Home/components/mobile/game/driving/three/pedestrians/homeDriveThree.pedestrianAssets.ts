// src/pages/Mateus/Home/components/mobile/game/driving/three/pedestrians/homeDriveThree.pedestrianAssets.ts

import type {
  HomeDrivePedestrianAgent,
  HomeDrivePedestrianAnimationKey,
  HomeDrivePedestrianRole,
} from "../../domain/pedestrians";

export type HomeDriveThreePedestrianProceduralProfile = Readonly<{
  heightMeters: number;
  headRadiusMeters: number;
  neckHeightMeters: number;
  torsoHeightMeters: number;
  torsoWidthMeters: number;
  torsoDepthMeters: number;
  hipWidthMeters: number;
  armLengthMeters: number;
  armRadiusMeters: number;
  legLengthMeters: number;
  legRadiusMeters: number;
  footLengthMeters: number;
  footWidthMeters: number;
  shoulderY: number;
  hipY: number;
  headY: number;
}>;

export type HomeDriveThreePedestrianAnimationRuntime = Readonly<{
  stepAmplitude: number;
  armSwingAmplitude: number;
  bobAmplitude: number;
  baseSpeedMultiplier: number;
}>;

export type HomeDriveThreePedestrianAssetDescriptor = Readonly<{
  key: string;
  label: string;
  role: HomeDrivePedestrianRole;
  proceduralOnly: boolean;
  supportedAnimations: readonly HomeDrivePedestrianAnimationKey[];
}>;

export const HOME_DRIVE_THREE_PEDESTRIAN_ASSETS: readonly HomeDriveThreePedestrianAssetDescriptor[] =
  Object.freeze([
    {
      key: "adult-procedural",
      label: "Adult procedural placeholder",
      role: "adult",
      proceduralOnly: true,
      supportedAnimations: [
        "idle",
        "walk",
        "slow-walk",
        "fast-walk",
        "phone",
        "talk",
      ],
    },
    {
      key: "shopper-procedural",
      label: "Shopper procedural placeholder",
      role: "shopper",
      proceduralOnly: true,
      supportedAnimations: ["idle", "slow-walk", "carry-bags", "phone"],
    },
    {
      key: "smoker-procedural",
      label: "Smoker procedural placeholder",
      role: "smoker",
      proceduralOnly: true,
      supportedAnimations: ["idle", "smoke", "slow-walk", "phone"],
    },
    {
      key: "child-procedural",
      label: "Child procedural placeholder",
      role: "child",
      proceduralOnly: true,
      supportedAnimations: ["idle", "child-walk", "slow-walk"],
    },
    {
      key: "elder-procedural",
      label: "Elder procedural placeholder",
      role: "elder",
      proceduralOnly: true,
      supportedAnimations: ["idle", "slow-walk", "talk"],
    },
    {
      key: "runner-procedural",
      label: "Runner procedural placeholder",
      role: "runner",
      proceduralOnly: true,
      supportedAnimations: ["fast-walk", "walk", "idle"],
    },
  ]);

/**
 * Multiplicador global visual.
 *
 * Deixe em 1 porque o tamanho principal agora vem de
 * agent.appearance.bodyScale.
 *
 * Se quiser aumentar tudo ainda mais sem mexer no domínio, suba para 1.5, 2, 3...
 */
const PEDESTRIAN_GLOBAL_VISUAL_SCALE = 1;

/**
 * Proteção para não explodir a cena caso algum bodyScale venha inválido.
 * Com bodyScale 6x no domínio, os pedestres ficam realmente grandes.
 */
const MIN_RENDER_BODY_SCALE = 0.25;
const MAX_RENDER_BODY_SCALE = 9.5;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getFiniteOrFallback(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function getRoleWidthMultiplier(role: HomeDrivePedestrianRole): number {
  switch (role) {
    case "child":
      return 0.78;

    case "elder":
      return 0.94;

    case "runner":
      return 0.9;

    case "worker":
      return 1.02;

    case "shopper":
      return 1.04;

    case "parent":
      return 1.02;

    case "smoker":
    case "adult":
    default:
      return 1;
  }
}

function getRoleHeightClamp(
  role: HomeDrivePedestrianRole,
): Readonly<{
  min: number;
  max: number;
}> {
  switch (role) {
    case "child":
      return {
        min: 0.78,
        max: 1.48,
      };

    case "elder":
      return {
        min: 1.28,
        max: 1.82,
      };

    case "runner":
      return {
        min: 1.38,
        max: 1.92,
      };

    case "worker":
    case "shopper":
    case "parent":
    case "smoker":
    case "adult":
    default:
      return {
        min: 1.32,
        max: 1.98,
      };
  }
}

function getRenderBodyScale(agent: HomeDrivePedestrianAgent): number {
  const bodyScale = getFiniteOrFallback(agent.appearance.bodyScale, 1);

  return clamp(
    bodyScale * PEDESTRIAN_GLOBAL_VISUAL_SCALE,
    MIN_RENDER_BODY_SCALE,
    MAX_RENDER_BODY_SCALE,
  );
}

export function getHomeDriveThreePedestrianAssetKey(
  role: HomeDrivePedestrianRole,
): string {
  switch (role) {
    case "child":
      return "child-procedural";

    case "elder":
      return "elder-procedural";

    case "runner":
      return "runner-procedural";

    case "shopper":
      return "shopper-procedural";

    case "smoker":
      return "smoker-procedural";

    case "worker":
    case "parent":
    case "adult":
    default:
      return "adult-procedural";
  }
}

export function getHomeDriveThreePedestrianProceduralProfile(
  agent: HomeDrivePedestrianAgent,
): HomeDriveThreePedestrianProceduralProfile {
  const roleHeightClamp = getRoleHeightClamp(agent.role);
  const renderBodyScale = getRenderBodyScale(agent);

  /*
    Antes o render usava só heightMeters clampado em ~1.95m.
    Isso anulava qualquer bodyScale alto gerado no domínio.

    Agora:
    - primeiro calcula o corpo base em escala humana;
    - depois multiplica todas as medidas pelo bodyScale renderizado.
  */
  const baseHeightMeters = clamp(
    getFiniteOrFallback(agent.appearance.heightMeters, 1.72),
    roleHeightClamp.min,
    roleHeightClamp.max,
  );

  const roleWidth = getRoleWidthMultiplier(agent.role);

  const baseShoulderWidthMeters = clamp(
    getFiniteOrFallback(agent.appearance.shoulderWidthMeters, 0.42) * roleWidth,
    0.22,
    0.68,
  );

  const heightMeters = baseHeightMeters * renderBodyScale;
  const shoulderWidth = baseShoulderWidthMeters * renderBodyScale;

  const headScale = clamp(
    getFiniteOrFallback(agent.appearance.headScale, 1),
    0.76,
    1.32,
  );

  const headRadiusMeters = clamp(
    baseHeightMeters * 0.082 * headScale * renderBodyScale,
    0.085 * renderBodyScale,
    0.18 * renderBodyScale,
  );

  const legLengthMeters =
    heightMeters * (agent.role === "child" ? 0.42 : 0.46);

  const torsoHeightMeters =
    heightMeters * (agent.role === "child" ? 0.31 : 0.34);

  const neckHeightMeters = heightMeters * 0.028;

  const hipY = legLengthMeters + torsoHeightMeters * 0.12;
  const shoulderY = legLengthMeters + torsoHeightMeters * 0.82;

  const headY =
    legLengthMeters +
    torsoHeightMeters +
    neckHeightMeters +
    headRadiusMeters;

  return {
    heightMeters,
    headRadiusMeters,
    neckHeightMeters,
    torsoHeightMeters,
    torsoWidthMeters: shoulderWidth,
    torsoDepthMeters: shoulderWidth * 0.56,
    hipWidthMeters: shoulderWidth * 0.78,

    armLengthMeters:
      heightMeters * (agent.role === "child" ? 0.29 : 0.36),

    armRadiusMeters: clamp(
      shoulderWidth * 0.08,
      0.025 * renderBodyScale,
      0.062 * renderBodyScale,
    ),

    legLengthMeters,

    legRadiusMeters: clamp(
      shoulderWidth * 0.095,
      0.035 * renderBodyScale,
      0.078 * renderBodyScale,
    ),

    footLengthMeters: clamp(
      heightMeters * 0.14,
      0.12 * renderBodyScale,
      0.3 * renderBodyScale,
    ),

    footWidthMeters: clamp(
      shoulderWidth * 0.25,
      0.08 * renderBodyScale,
      0.18 * renderBodyScale,
    ),

    shoulderY,
    hipY,
    headY,
  };
}

export function getHomeDriveThreePedestrianAnimationRuntime(
  animationKey: HomeDrivePedestrianAnimationKey,
): HomeDriveThreePedestrianAnimationRuntime {
  switch (animationKey) {
    case "fast-walk":
      return {
        stepAmplitude: 0.72,
        armSwingAmplitude: 0.78,
        bobAmplitude: 0.06,
        baseSpeedMultiplier: 1.36,
      };

    case "child-walk":
      return {
        stepAmplitude: 0.58,
        armSwingAmplitude: 0.62,
        bobAmplitude: 0.052,
        baseSpeedMultiplier: 1.22,
      };

    case "slow-walk":
    case "carry-bags":
      return {
        stepAmplitude: 0.36,
        armSwingAmplitude: 0.32,
        bobAmplitude: 0.032,
        baseSpeedMultiplier: 0.78,
      };

    case "phone":
    case "smoke":
    case "talk":
      return {
        stepAmplitude: 0.08,
        armSwingAmplitude: 0.16,
        bobAmplitude: 0.012,
        baseSpeedMultiplier: 0.24,
      };

    case "idle":
      return {
        stepAmplitude: 0.04,
        armSwingAmplitude: 0.08,
        bobAmplitude: 0.01,
        baseSpeedMultiplier: 0.1,
      };

    case "walk":
    default:
      return {
        stepAmplitude: 0.52,
        armSwingAmplitude: 0.58,
        bobAmplitude: 0.044,
        baseSpeedMultiplier: 1,
      };
  }
}

export function getHomeDriveThreePedestrianRenderOrder(
  agent: HomeDrivePedestrianAgent,
): number {
  if (agent.role === "child") {
    return 27;
  }

  if (agent.groupKind === "adult-child") {
    return 28;
  }

  return 26;
}
