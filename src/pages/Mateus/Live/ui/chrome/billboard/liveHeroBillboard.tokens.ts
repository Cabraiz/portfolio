// src/pages/Mateus/Live/ui/chrome/billboard/liveHeroBillboard.tokens.ts

export type LiveHeroBillboardSkinTokens = Readonly<{
  shell: Readonly<{
    border: string;
    innerBorder: string;
    cornerShadow: string;
    outerShadow: string;
    background: string;
  }>;
  glass: Readonly<{
    tint: string;
    topReflectionOpacity: number;
    sideReflectionOpacity: number;
    vignetteOpacity: number;
    noiseOpacity: number;
    blur: string;
  }>;
  marquee: Readonly<{
    duration: string;
    compactDuration: string;
    speed: string;
    railHeight: string;
    railInset: string;
    dotSize: string;
    dotSizeTablet: string;
    dotSizeMobile: string;
    textColor: string;
    textGlow: string;
    letterSpacing: string;
    separatorOpacity: number;
    glowOpacity: number;
    trailOpacity: number;
  }>;
  counter: Readonly<{
    slotMinWidth: string;
    slotMinWidthTablet: string;
    slotMinWidthMobile: string;
    slotMinHeight: string;
    slotMinHeightTablet: string;
    slotMinHeightMobile: string;
    glyphDotSize: string;
    glyphDotSizeTablet: string;
    glyphDotSizeMobile: string;
    dividerColor: string;
    dividerGlow: string;
    flickerDuration: string;
    flickerStepDelay: number;
    ambientGlow: string;
  }>;
  counterDock: Readonly<{
    topDivider: string;
    dockShadow: string;
    ambientGlow: string;
  }>;
  screen: Readonly<{
    borderColor: string;
    borderHoverColor: string;
    innerBorderColor: string;
    railColor: string;
    highlightOpacity: number;
    shadow: string;
    runningOutlineColor: string;
    background: string;
  }>;
}>;

export const LIVE_HERO_BILLBOARD_SKIN_TOKENS = {
  shell: {
    border: "rgba(156, 171, 194, 0.22)",
    innerBorder: "rgba(255, 255, 255, 0.05)",
    cornerShadow:
      "inset 22px 0 32px rgba(0, 0, 0, 0.28), inset -22px 0 32px rgba(0, 0, 0, 0.28)",
    outerShadow:
      "0 20px 52px rgba(0, 0, 0, 0.42), 0 6px 18px rgba(0, 0, 0, 0.2)",
    background:
      "linear-gradient(180deg, rgba(12, 18, 28, 0.98) 0%, rgba(7, 11, 18, 0.99) 52%, rgba(3, 6, 11, 1) 100%)",
  },

  glass: {
    tint: "rgba(7, 11, 18, 0.82)",
    topReflectionOpacity: 0.46,
    sideReflectionOpacity: 0.22,
    vignetteOpacity: 0.58,
    noiseOpacity: 0.16,
    blur: "18px",
  },

  marquee: {
    duration: "13.8s",
    compactDuration: "11.2s",
    speed: "linear",
    railHeight: "clamp(46px, 4.15vw, 58px)",
    railInset: "clamp(12px, 1.1vw, 16px)",
    dotSize: "5px 5px",
    dotSizeTablet: "4px 4px",
    dotSizeMobile: "4px 4px",
    textColor: "rgba(240, 187, 98, 0.98)",
    textGlow: "rgba(234, 160, 56, 0.14)",
    letterSpacing: "clamp(0.08em, 0.16vw, 0.12em)",
    separatorOpacity: 0.16,
    glowOpacity: 0.12,
    trailOpacity: 0.08,
  },

  counter: {
    slotMinWidth: "clamp(58px, 6vw, 78px)",
    slotMinWidthTablet: "clamp(50px, 8vw, 66px)",
    slotMinWidthMobile: "44px",
    slotMinHeight: "clamp(104px, 10.8vw, 140px)",
    slotMinHeightTablet: "clamp(90px, 12vw, 118px)",
    slotMinHeightMobile: "80px",
    glyphDotSize: "7px 7px",
    glyphDotSizeTablet: "6px 6px",
    glyphDotSizeMobile: "5px 5px",
    dividerColor: "rgba(196, 203, 214, 0.22)",
    dividerGlow:
      "linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(196, 203, 214, 0.12) 20%, rgba(196, 203, 214, 0.12) 80%, rgba(255, 255, 255, 0) 100%)",
    flickerDuration: "2.15s",
    flickerStepDelay: 0.16,
    ambientGlow: "rgba(241, 176, 70, 0.08)",
  },

  counterDock: {
    topDivider: "rgba(182, 194, 212, 0.18)",
    dockShadow:
      "inset 0 1px 0 rgba(255, 255, 255, 0.04), inset 0 18px 28px rgba(255, 255, 255, 0.015), inset 0 -24px 30px rgba(0, 0, 0, 0.18)",
    ambientGlow:
      "radial-gradient(120% 90% at 50% 0%, rgba(255, 185, 84, 0.08) 0%, rgba(255, 185, 84, 0) 44%)",
  },

  screen: {
    borderColor: "rgba(156, 171, 194, 0.22)",
    borderHoverColor: "rgba(196, 210, 230, 0.28)",
    innerBorderColor: "rgba(255, 255, 255, 0.05)",
    railColor:
      "linear-gradient(180deg, rgba(255, 255, 255, 0.045) 0%, rgba(255, 255, 255, 0.015) 18%, rgba(8, 13, 22, 0) 38%, rgba(0, 0, 0, 0.14) 100%)",
    highlightOpacity: 0.46,
    shadow:
      "inset 0 1px 0 rgba(255, 255, 255, 0.08), inset 0 0 0 1px rgba(255, 255, 255, 0.028), inset 0 -46px 60px rgba(0, 0, 0, 0.42), 0 20px 52px rgba(0, 0, 0, 0.42)",
    runningOutlineColor: "rgba(255, 255, 255, 0.04)",
    background:
      "linear-gradient(180deg, rgba(12, 18, 28, 0.98) 0%, rgba(7, 11, 18, 0.99) 52%, rgba(3, 6, 11, 1) 100%)",
  },
} as const satisfies LiveHeroBillboardSkinTokens;
