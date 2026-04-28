export const homeDriveTokens = {
  colors: {
    text: "#f7f2e8",
    textSoft: "rgba(247, 242, 232, 0.82)",
    textMuted: "rgba(247, 242, 232, 0.62)",
    textSubtle: "rgba(247, 242, 232, 0.74)",

    background:
      "linear-gradient(180deg, #040507 0%, #07111b 24%, #0a1c2d 42%, #121212 72%, #050505 100%)",

    glass: {
      panel: "rgba(7, 8, 11, 0.58)",
      panelStrong: "rgba(7, 8, 11, 0.62)",
      panelSoft: "rgba(7, 8, 11, 0.48)",
      border: "rgba(255, 255, 255, 0.12)",
      borderSoft: "rgba(255, 255, 255, 0.1)",
      shadow: "0 14px 26px rgba(0, 0, 0, 0.24)",
      shadowSoft: "0 12px 24px rgba(0, 0, 0, 0.22)",
      blur: "blur(12px)",
      blurSoft: "blur(10px)",
    },

    buttons: {
      defaultBackground:
        "linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(12, 12, 15, 0.88))",
      activeBackground:
        "linear-gradient(180deg, rgba(203, 154, 82, 0.32), rgba(92, 58, 18, 0.82))",
      defaultBorder: "rgba(255, 255, 255, 0.14)",
      defaultShadow:
        "0 10px 18px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
      activeShadow:
        "0 14px 28px rgba(0, 0, 0, 0.34), inset 0 1px 0 rgba(255, 255, 255, 0.18)",
      text: "#f5efe3",
    },

    progress: {
      route:
        "linear-gradient(90deg, rgba(196, 147, 68, 0.92), rgba(255, 214, 134, 0.98))",
      motor: "linear-gradient(90deg, #93a56b, #d8be78)",
      motorHot: "linear-gradient(90deg, #d09255, #ff8b6b)",
      track: "rgba(255, 255, 255, 0.08)",
    },

    road: {
      asphalt:
        "linear-gradient(180deg, rgba(70, 70, 76, 0.94), rgba(22, 22, 24, 0.98) 30%, rgba(10, 10, 11, 1) 100%)",
      centerLane:
        "repeating-linear-gradient(180deg, rgba(246, 233, 184, 0.95) 0 34px, transparent 34px 68px)",
      sideLane: "rgba(255, 255, 255, 0.18)",
      borderTop: "rgba(255, 255, 255, 0.08)",
    },

    cockpit: {
      wheelOuter: "rgba(20, 20, 22, 0.96)",
      wheelInner: "rgba(52, 52, 56, 0.98)",
      wheelAccent:
        "linear-gradient(180deg, rgba(218, 171, 91, 0.96), rgba(110, 69, 21, 0.98))",
      wheelNeutralAccent:
        "linear-gradient(180deg, rgba(184,184,194,0.92), rgba(96,96,112,0.96))",
      dashboard:
        "linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.12) 14%, rgba(8, 8, 10, 0.52) 15%, rgba(12, 12, 14, 0.95) 45%, rgba(6, 6, 7, 1) 100%)",
      windshield:
        "linear-gradient(180deg, rgba(2,4,8,0.56), rgba(2,4,8,0.12) 72%, transparent 100%)",
      reflection:
        "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02) 36%, rgba(255,255,255,0) 100%)",
    },

    skyline: {
      bar:
        "linear-gradient(180deg, rgba(31, 36, 45, 0.86), rgba(8, 8, 10, 0.98))",
      glow:
        "linear-gradient(180deg, rgba(255, 190, 102, 0.12), rgba(255, 190, 102, 0.01))",
      foreground:
        "linear-gradient(180deg, rgba(21, 28, 18, 0.42), rgba(12, 16, 12, 0.9))",
      window: "rgba(255, 220, 168, 0.12)",
    },

    atmosphere: {
      cityGlow:
        "radial-gradient(circle at 50% 18%, rgba(250,182,88,0.16), rgba(250,182,88,0.02) 28%, transparent 54%)",
      lowerVignette:
        "radial-gradient(circle at 50% 110%, rgba(0,0,0,0.36), rgba(0,0,0,0.84) 55%)",
      glassVignette:
        "linear-gradient(180deg, rgba(255,255,255,0.04), transparent 18%, transparent 82%, rgba(0,0,0,0.34)), radial-gradient(circle at 50% 50%, transparent 56%, rgba(0,0,0,0.12) 100%)",
      noise:
        "repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 24px)",
    },
  },

  spacing: {
    safeTop: "max(14px, env(safe-area-inset-top))",
    safeRight: "max(14px, env(safe-area-inset-right))",
    safeBottom: "max(16px, calc(env(safe-area-inset-bottom) + 16px))",
    safeLeft: "max(14px, env(safe-area-inset-left))",

    gapXs: "8px",
    gapSm: "10px",
    gapMd: "12px",
    gapLg: "14px",

    radiusSm: "12px",
    radiusMd: "16px",
    radiusLg: "18px",
    radiusXl: "20px",
    radius2xl: "26px",
    radius3xl: "30px",
  },

  viewport: {
    height: "100dvh",
    roadBottom: "22%",
    roadHeight: "42%",
    dashboardHeight: "30%",
    skylineTop: "10%",
    skylineHeight: "18%",
    horizonTop: "18%",
    horizonHeight: "10%",
    foregroundBottom: "24%",
    foregroundHeight: "30%",
  },

  wheel: {
    bottom: "12.8%",
    width: "46%",
    maxWidth: 220,
    outerBorderWidth: 16,
    innerInset: "18%",
    innerBorderWidth: 10,
    nubWidth: 12,
    nubHeight: "22%",
    rotationFactor: 20,
  },

  lane: {
    sideLeft: "16%",
    sideRight: "16%",
    centerWidth: "1.6%",
    centerMinWidth: 4,
    segmentPx: 34,
    cyclePx: 68,
  },

  road: {
    bottom: "22%",
    height: "42%",
    perspective: 720,
    rotateXDeg: 67,
    driftMultiplier: -14,
    sideLineWidth: 2,
    centerMinWidth: 4,
  },

  roadside: {
    zIndex: 2,
    transition: "transform 120ms linear",
    depthMin: 0.12,
    depthMax: 0.9,
    leftBase: 10,
    rightBase: 90,
    laneOffsetMultiplier: -8,
  },

  landmarks: {
    zIndex: 3,
    laneOffsetMultiplier: -5,
    visibleAheadMeters: 1200,
    visibleBehindMeters: -180,
    markerBaseWidth: 44,
    markerBaseHeight: 68,
    labelRadius: 12,
  },

  typography: {
    title: {
      size: "15px",
      tracking: "0.08em",
    },
    phase: {
      size: "10px",
      tracking: "0.16em",
    },
    metricValue: {
      size: "28px",
      tracking: "-0.05em",
    },
    speedValue: {
      size: "34px",
      tracking: "-0.04em",
    },
    button: {
      size: "14px",
      tracking: "0.12em",
    },
    buttonSmall: {
      size: "11px",
      tracking: "0.14em",
    },
  },

  shadows: {
    panel: "0 14px 26px rgba(0, 0, 0, 0.24)",
    panelSoft: "0 12px 24px rgba(0, 0, 0, 0.22)",
    button: "0 10px 18px rgba(0, 0, 0, 0.28)",
    buttonActive: "0 14px 28px rgba(0, 0, 0, 0.34)",
    wheel: "0 20px 40px rgba(0, 0, 0, 0.35)",
    road: "0 -30px 44px rgba(0, 0, 0, 0.24)",
    skyline: "0 8px 18px rgba(0,0,0,0.14)",
    landmark: "0 14px 26px rgba(0,0,0,0.26)",
  },

  zIndex: {
    scene: 1,
    roadside: 2,
    landmarks: 3,
    vignette: 6,
    dashboard: 7,
    steeringWheel: 8,
    chrome: 9,
    hud: 20,
    controls: 21,
    introOverlay: 39,
    pauseOverlay: 40,
  },

  motion: {
    environmentTransition: "transform 120ms linear",
    controlTransition:
      "transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease, opacity 160ms ease",
  },
} as const;

export type HomeDriveTokens = typeof homeDriveTokens;
