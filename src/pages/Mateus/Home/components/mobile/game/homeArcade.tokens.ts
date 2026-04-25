export const HOME_ARCADE_TOKENS = {
  timing: {
    exitDurationMs: 220,
    playerBlinkIntervalMs: 72,
    reducedMotionTransitionMs: 0,
  },

  stage: {
    maxWidthPx: 480,
    minViewportOffsetPx: 24,
    borderRadiusPx: 30,
    overlayPaddingPx: 12,
  },

  arena: {
    heightPx: 386,
    groundHeightPx: 76,
    progressBarHeightPx: 10,
    progressBarRadiusPx: 999,
  },

  player: {
    sizePx: 56,
    minXPx: 26,
    maxXPx: 212,
    hitboxInsetPx: 10,
    moveSpeed: 214,
    jumpVelocity: -560,
    gravity: 1480,
    invulnerableSeconds: 1.15,
  },

  world: {
    gameDurationSeconds: 38,
    baseScrollSpeed: 228,
    turboScrollSpeed: 338,
    maxFrameDeltaSeconds: 0.032,
    distanceFactor: 0.22,
  },

  spawn: {
    coinInitialDelaySeconds: 0.55,
    coinMinDelaySeconds: 0.62,
    coinRandomDelaySeconds: 0.78,
    hazardInitialDelaySeconds: 1.15,
    hazardMinDelaySeconds: 0.92,
    hazardRandomDelaySeconds: 0.88,
  },

  coin: {
    sizePx: 24,
    value: 120,
    lanesFromGroundPx: [54, 110, 164] as const,
  },

  hazard: {
    wide: {
      widthPx: 48,
      heightPx: 34,
      hue: 18,
    },
    tall: {
      widthPx: 34,
      heightPx: 58,
      hue: 323,
    },
    tallChance: 0.38,
  },

  controls: {
    buttonMinHeightPx: 68,
    sideButtonWidthPx: 82,
    borderRadiusPx: 20,
  },

  hud: {
    avatarSizePx: 46,
    actionButtonSizePx: 44,
    statMinHeightPx: 46,
  },
} as const;

export const HOME_ARCADE_STRINGS = {
  titleWon: "YOU WIN",
  titleLost: "GAME OVER",
  titlePaused: "PAUSADO",
  subtitleWon: "Você segurou a arena até o fim.",
  subtitleLost: "As colisões drenaram todas as vidas.",
  subtitlePaused: "Toque em continuar para voltar à partida.",
  statScore: "Score",
  statLives: "Lives",
  statTime: "Time",
  statFinalScore: "Final Score",
  statBestCombo: "Best Combo",
  actionRestart: "Reiniciar",
  actionContinue: "Continuar",
  actionClose: "Fechar",
  controlJump: "JUMP",
  controlTurbo: "TURBO",
  controlReset: "RESET",
} as const;

export const HOME_ARCADE_COLORS = {
  overlayBackdrop:
    "radial-gradient(circle at 50% 50%, rgba(75, 18, 176, 0.22) 0%, rgba(9, 11, 24, 0.82) 48%, rgba(3, 4, 10, 0.96) 100%)",

  shellBackground:
    "linear-gradient(180deg, rgba(10, 12, 32, 0.98) 0%, rgba(15, 10, 26, 0.99) 100%)",

  arenaBackground:
    "linear-gradient(180deg, #171f61 0%, #2a1d55 44%, #110f20 100%)",

  progressFill:
    "linear-gradient(90deg, #4be1ff 0%, #8b6dff 38%, #ff5db5 72%, #ffd04c 100%)",

  groundBackground:
    "linear-gradient(180deg, #2d2336 0%, #191521 100%)",

  trackBackground:
    "repeating-linear-gradient(90deg, rgba(255,255,255,0.00) 0 24px, rgba(255,255,255,0.08) 24px 36px)",

  statPillBackground:
    "linear-gradient(180deg, rgba(39,42,88,0.72) 0%, rgba(16,17,38,0.88) 100%)",

  hudBackground:
    "linear-gradient(180deg, rgba(9,11,25,0.92) 0%, rgba(9,11,25,0.68) 100%)",

  avatarBackground:
    "linear-gradient(180deg, rgba(37,39,64,0.96) 0%, rgba(13,14,28,0.98) 100%)",

  playerBackground:
    "linear-gradient(180deg, rgba(44,48,76,0.98) 0%, rgba(16,18,28,0.98) 100%)",

  playerBorder: "rgba(255, 226, 141, 0.9)",
  playerInvulnerableBorder: "rgba(255, 88, 176, 0.95)",

  coinBackground:
    "radial-gradient(circle at 35% 30%, rgba(255,245,185,0.98) 0%, rgba(255,221,87,1) 42%, rgba(255,166,0,0.98) 100%)",
  coinInnerBorder: "rgba(160, 110, 0, 0.35)",

  overlayCardBackground:
    "linear-gradient(180deg, rgba(24,26,58,0.92) 0%, rgba(14,16,31,0.96) 100%)",

  overlayActionBackground:
    "linear-gradient(180deg, rgba(90, 104, 255, 0.28) 0%, rgba(20, 22, 44, 0.96) 100%)",
} as const;

export const HOME_ARCADE_CONTROL_TONES = {
  cyan: {
    border: "rgba(95, 236, 255, 0.42)",
    background:
      "linear-gradient(180deg, rgba(44, 221, 255, 0.32) 0%, rgba(14, 29, 46, 0.98) 100%)",
    glow: "rgba(95, 236, 255, 0.42)",
  },
  gold: {
    border: "rgba(255, 217, 110, 0.48)",
    background:
      "linear-gradient(180deg, rgba(255, 209, 82, 0.36) 0%, rgba(36, 28, 16, 0.98) 100%)",
    glow: "rgba(255, 217, 110, 0.48)",
  },
  pink: {
    border: "rgba(255, 112, 194, 0.42)",
    background:
      "linear-gradient(180deg, rgba(255, 79, 179, 0.34) 0%, rgba(40, 16, 36, 0.98) 100%)",
    glow: "rgba(255, 112, 194, 0.42)",
  },
  violet: {
    border: "rgba(165, 135, 255, 0.42)",
    background:
      "linear-gradient(180deg, rgba(133, 98, 255, 0.34) 0%, rgba(25, 18, 48, 0.98) 100%)",
    glow: "rgba(165, 135, 255, 0.42)",
  },
} as const;

export function clampHomeArcadeValue(
  value: number,
  min: number,
  max: number,
): number {
  return Math.min(max, Math.max(min, value));
}

export function getHomeArcadeProgress(
  timeLeftSeconds: number,
  totalDurationSeconds = HOME_ARCADE_TOKENS.world.gameDurationSeconds,
): number {
  if (totalDurationSeconds <= 0) {
    return 0;
  }

  return clampHomeArcadeValue(
    1 - timeLeftSeconds / totalDurationSeconds,
    0,
    1,
  );
}

export function getHomeArcadeGroundTop(
  arenaHeight = HOME_ARCADE_TOKENS.arena.heightPx,
  groundHeight = HOME_ARCADE_TOKENS.arena.groundHeightPx,
): number {
  return arenaHeight - groundHeight;
}

export function getHomeArcadeFloorY(
  arenaHeight = HOME_ARCADE_TOKENS.arena.heightPx,
  groundHeight = HOME_ARCADE_TOKENS.arena.groundHeightPx,
  playerSize = HOME_ARCADE_TOKENS.player.sizePx,
): number {
  return getHomeArcadeGroundTop(arenaHeight, groundHeight) - playerSize;
}

export function getHomeArcadeCoinLaneYPx(
  laneIndex: number,
  arenaHeight = HOME_ARCADE_TOKENS.arena.heightPx,
  groundHeight = HOME_ARCADE_TOKENS.arena.groundHeightPx,
): number {
  const groundTop = getHomeArcadeGroundTop(arenaHeight, groundHeight);
  const lanes = HOME_ARCADE_TOKENS.coin.lanesFromGroundPx;
  const safeIndex = clampHomeArcadeValue(laneIndex, 0, lanes.length - 1);

  return groundTop - lanes[safeIndex];
}

export function getHomeArcadePhaseTitle(
  phase: "playing" | "paused" | "won" | "lost",
): string {
  if (phase === "won") {
    return HOME_ARCADE_STRINGS.titleWon;
  }

  if (phase === "lost") {
    return HOME_ARCADE_STRINGS.titleLost;
  }

  if (phase === "paused") {
    return HOME_ARCADE_STRINGS.titlePaused;
  }

  return "";
}

export function getHomeArcadePhaseSubtitle(
  phase: "playing" | "paused" | "won" | "lost",
): string {
  if (phase === "won") {
    return HOME_ARCADE_STRINGS.subtitleWon;
  }

  if (phase === "lost") {
    return HOME_ARCADE_STRINGS.subtitleLost;
  }

  if (phase === "paused") {
    return HOME_ARCADE_STRINGS.subtitlePaused;
  }

  return "";
}
