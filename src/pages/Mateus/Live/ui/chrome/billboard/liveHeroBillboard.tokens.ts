// src/pages/Mateus/Live/ui/chrome/billboard/liveHeroBillboard.tokens.ts

export type LiveHeroBillboardSkinTokens = Readonly<{
  marquee: Readonly<{
    duration: string;
    compactDuration: string;
    dotSize: string;
    dotSizeTablet: string;
    dotSizeMobile: string;
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
  }>;
  screen: Readonly<{
    borderColor: string;
    borderHoverColor: string;
    innerBorderColor: string;
    railColor: string;
    highlightOpacity: number;
    shadow: string;
    runningOutlineColor: string;
  }>;
}>;

export const LIVE_HERO_BILLBOARD_SKIN_TOKENS = {
  marquee: {
    duration: "11.5s",
    compactDuration: "9.5s",
    dotSize: "6px 6px",
    dotSizeTablet: "5px 5px",
    dotSizeMobile: "4px 4px",
    glowOpacity: 0.24,
    trailOpacity: 0.22,
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
    dividerColor: "rgba(173, 146, 100, 0.24)",
    dividerGlow:
      "linear-gradient(180deg, rgba(214, 190, 145, 0) 0%, rgba(214, 190, 145, 0.22) 18%, rgba(214, 190, 145, 0.22) 82%, rgba(214, 190, 145, 0) 100%)",
    flickerDuration: "2.2s",
    flickerStepDelay: 0.16,
  },

  screen: {
    borderColor: "rgba(153, 126, 84, 0.24)",
    borderHoverColor: "rgba(174, 145, 96, 0.3)",
    innerBorderColor: "rgba(109, 84, 49, 0.16)",
    railColor:
      "linear-gradient(180deg, rgba(191, 162, 111, 0.96) 0%, rgba(118, 90, 52, 0.16) 100%)",
    highlightOpacity: 0.024,
    shadow:
      "inset 0 1px 0 rgba(255, 245, 225, 0.035), inset 0 0 0 1px rgba(109, 84, 49, 0.16), 0 18px 36px rgba(0, 0, 0, 0.22)",
    runningOutlineColor: "rgba(153, 126, 84, 0.06)",
  },
} as const satisfies LiveHeroBillboardSkinTokens;
