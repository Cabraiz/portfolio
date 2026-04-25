import type {
  HomeGameOrbit,
  ResolvedHomeGameOrbit,
} from "./homeGame.types";

export const HOME_GAME_EXIT_ANIMATION_MS = 220;
export const HOME_GAME_RIPPLE_DURATION_MS = 920;

export const HOME_GAME_STAGE_TOKENS = {
  maxWidthPx: 460,
  minHeightPx: 620,
  cornerRadiusPx: 30,
  overlayInsetPx: 14,
} as const;

export const HOME_GAME_COLLECTIBLE_TOKENS = {
  sizePx: 72,
  iconSizePx: 28,
  rippleSizePx: 152,
  pointerParallaxPx: 14,
} as const;

export const HOME_GAME_POINTER_TOKENS = {
  defaultX: 0,
  defaultY: 0,
  defaultGlowX: "50%",
  defaultGlowY: "50%",
} as const;

export const HOME_GAME_ORBIT_PRESETS: readonly ResolvedHomeGameOrbit[] = [
  { x: 17, y: 25, scale: 1, delayMs: 0, durationMs: 6200 },
  { x: 83, y: 28, scale: 1.08, delayMs: 850, durationMs: 7000 },
  { x: 50, y: 17, scale: 0.96, delayMs: 1200, durationMs: 6600 },
  { x: 22, y: 73, scale: 0.94, delayMs: 1500, durationMs: 7600 },
  { x: 79, y: 74, scale: 1.02, delayMs: 400, durationMs: 6800 },
] as const;

export function clampHomeGameValue(
  value: number,
  min: number,
  max: number,
): number {
  return Math.min(max, Math.max(min, value));
}

export function resolveHomeGameOrbit(
  orbit: HomeGameOrbit | undefined,
  index: number,
): ResolvedHomeGameOrbit {
  const preset = HOME_GAME_ORBIT_PRESETS[index % HOME_GAME_ORBIT_PRESETS.length];

  return {
    x: orbit?.x ?? preset.x,
    y: orbit?.y ?? preset.y,
    scale: orbit?.scale ?? preset.scale,
    delayMs: orbit?.delayMs ?? preset.delayMs,
    durationMs: orbit?.durationMs ?? preset.durationMs,
  };
}

export function createHomeGameCollectibleId(index: number): string {
  return `home-game-item-${index}`;
}

export function createHomeGameRippleId(): string {
  return `home-game-ripple-${Math.random().toString(36).slice(2, 11)}`;
}
