export const PORTFOLIO_PROJECT_COUNTER_TOKENS = {
  size: {
    base: "clamp(5.75rem, 8vw, 8rem)",
    inner: "78%",
    core: "52%",
  },

  ring: {
    thickness: "0.1rem",
    outerInset: "0.35rem",
    innerInset: "1rem",
  },

  marks: {
    countFallback: 6,
    width: "0.16rem",
    height: "0.72rem",
    radiusOffset: "calc(50% - 0.7rem)",
    activeScale: 1.18,
  },

  motion: {
    durationMs: 680,
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    hoverDurationMs: 220,
  },

  colors: {
    accent: "rgba(242, 201, 76, 0.96)",
    accentSoft: "rgba(242, 201, 76, 0.22)",
    accentMuted: "rgba(242, 201, 76, 0.12)",
    textStrong: "rgba(255, 255, 255, 0.96)",
    textSoft: "rgba(255, 255, 255, 0.56)",
    markIdle: "rgba(255, 255, 255, 0.16)",
    markActive: "rgba(242, 201, 76, 0.96)",
    borderOuter: "rgba(255, 255, 255, 0.1)",
    borderInner: "rgba(255, 255, 255, 0.08)",
    surfaceTop: "rgba(19, 21, 28, 0.94)",
    surfaceBottom: "rgba(9, 11, 17, 0.98)",
    coreTop: "rgba(28, 31, 40, 0.96)",
    coreBottom: "rgba(13, 15, 22, 0.98)",
    shadow: "rgba(0, 0, 0, 0.34)",
    glow: "rgba(242, 201, 76, 0.24)",
  },

  typography: {
    overlineSize: "clamp(0.58rem, 0.62vw, 0.72rem)",
    overlineSpacing: "0.22em",
    valueSize: "clamp(1.4rem, 2vw, 2.15rem)",
    valueSpacing: "0.08em",
    captionSize: "clamp(0.6rem, 0.68vw, 0.76rem)",
    captionSpacing: "0.18em",
  },
} as const;

export type PortfolioProjectCounterTokens =
  typeof PORTFOLIO_PROJECT_COUNTER_TOKENS;
