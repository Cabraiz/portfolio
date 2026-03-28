import type { LandingSectionViewportMode } from "./landing.types";

export type LandingViewportBucket = "mobile" | "desktop-compact" | "desktop-wide";

export type LandingActiveSectionCommitTokens = Readonly<{
  /**
   * Linha-base de observação da seção dominante.
   * Continua existindo, mas agora varia por viewport.
   */
  activationViewportRatio: number;

  /**
   * Visibilidade mínima para uma nova seção poder ser promovida.
   */
  commitVisibilityThreshold: number;

  /**
   * Faixa de saída da seção já commitada.
   * Enquanto a seção atual estiver acima disso,
   * evitamos troca agressiva.
   */
  releaseVisibilityThreshold: number;

  /**
   * Diferença mínima de score entre candidata e commitada
   * para permitir swap.
   */
  swapScoreDelta: number;

  /**
   * Histerese espacial em pixels.
   * A nova seção precisa ficar materialmente mais próxima
   * da linha de ativação do que a seção atual.
   */
  distanceHysteresisPx: number;

  /**
   * Tempo mínimo de estabilidade antes do commit.
   */
  commitIdleMs: number;

  /**
   * Distância de montagem recomendada para desktop amplo.
   * Serve como token para o render policy.
   */
  preferredNearDistance: number;
}>;

export type ResolveLandingActiveSectionTokensOptions = Readonly<{
  viewportWidth?: number | null;
  overrides?: Partial<LandingActiveSectionCommitTokens> | null;
}>;

export type ResolvedLandingActiveSectionCommitTokens =
  LandingActiveSectionCommitTokens &
    Readonly<{
      viewportWidth: number;
      viewportBucket: LandingViewportBucket;
    }>;

const MOBILE_TOKENS: LandingActiveSectionCommitTokens = {
  activationViewportRatio: 0.42,
  commitVisibilityThreshold: 0.42,
  releaseVisibilityThreshold: 0.22,
  swapScoreDelta: 64,
  distanceHysteresisPx: 28,
  commitIdleMs: 90,
  preferredNearDistance: 2,
};

const DESKTOP_COMPACT_TOKENS: LandingActiveSectionCommitTokens = {
  activationViewportRatio: 0.46,
  commitVisibilityThreshold: 0.48,
  releaseVisibilityThreshold: 0.26,
  swapScoreDelta: 92,
  distanceHysteresisPx: 48,
  commitIdleMs: 120,
  preferredNearDistance: 3,
};

const DESKTOP_WIDE_TOKENS: LandingActiveSectionCommitTokens = {
  activationViewportRatio: 0.52,
  commitVisibilityThreshold: 0.54,
  releaseVisibilityThreshold: 0.30,
  swapScoreDelta: 128,
  distanceHysteresisPx: 72,
  commitIdleMs: 160,
  preferredNearDistance: 999,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function resolveSafeViewportWidth(explicitWidth?: number | null): number {
  if (typeof explicitWidth === "number" && Number.isFinite(explicitWidth)) {
    return explicitWidth;
  }

  if (typeof globalThis.window !== "undefined") {
    return globalThis.window.innerWidth;
  }

  return 1280;
}

export function resolveLandingViewportBucket(
  viewportMode: LandingSectionViewportMode,
  viewportWidth?: number | null,
): LandingViewportBucket {
  if (viewportMode === "mobile") {
    return "mobile";
  }

  const safeViewportWidth = resolveSafeViewportWidth(viewportWidth);

  if (safeViewportWidth >= 1440) {
    return "desktop-wide";
  }

  return "desktop-compact";
}

function resolveBaseTokensForBucket(
  bucket: LandingViewportBucket,
): LandingActiveSectionCommitTokens {
  switch (bucket) {
    case "mobile":
      return MOBILE_TOKENS;
    case "desktop-wide":
      return DESKTOP_WIDE_TOKENS;
    case "desktop-compact":
    default:
      return DESKTOP_COMPACT_TOKENS;
  }
}

function sanitizeTokens(
  tokens: LandingActiveSectionCommitTokens,
): LandingActiveSectionCommitTokens {
  return {
    activationViewportRatio: clamp(tokens.activationViewportRatio, 0.2, 0.8),
    commitVisibilityThreshold: clamp(tokens.commitVisibilityThreshold, 0.15, 0.95),
    releaseVisibilityThreshold: clamp(tokens.releaseVisibilityThreshold, 0.05, 0.9),
    swapScoreDelta: Math.max(0, tokens.swapScoreDelta),
    distanceHysteresisPx: Math.max(0, tokens.distanceHysteresisPx),
    commitIdleMs: Math.max(0, tokens.commitIdleMs),
    preferredNearDistance: Math.max(0, Math.floor(tokens.preferredNearDistance)),
  };
}

export function resolveLandingActiveSectionTokens(
  viewportMode: LandingSectionViewportMode,
  options: ResolveLandingActiveSectionTokensOptions = {},
): ResolvedLandingActiveSectionCommitTokens {
  const viewportWidth = resolveSafeViewportWidth(options.viewportWidth);
  const viewportBucket = resolveLandingViewportBucket(viewportMode, viewportWidth);

  const baseTokens = resolveBaseTokensForBucket(viewportBucket);

  const mergedTokens = sanitizeTokens({
    ...baseTokens,
    ...(options.overrides ?? {}),
  });

  return {
    ...mergedTokens,
    viewportWidth,
    viewportBucket,
  };
}

export function resolveLandingActivationViewportRatio(
  viewportMode: LandingSectionViewportMode,
  options: ResolveLandingActiveSectionTokensOptions = {},
): number {
  return resolveLandingActiveSectionTokens(viewportMode, options)
    .activationViewportRatio;
}

export function resolveLandingPreferredNearDistance(
  viewportMode: LandingSectionViewportMode,
  options: ResolveLandingActiveSectionTokensOptions = {},
): number {
  return resolveLandingActiveSectionTokens(viewportMode, options)
    .preferredNearDistance;
}
