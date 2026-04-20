import {
  homeHeroTokens,
  type HomeHeroViewportMode,
} from "./homeHero.tokens";

export function getHomeHeroViewportMode(
  viewportWidth: number,
  viewportHeight: number,
): HomeHeroViewportMode {
  if (viewportWidth < homeHeroTokens.breakpoints.desktopMinWidth) {
    return "compact";
  }

  if (viewportHeight <= homeHeroTokens.breakpoints.compactHeightMax) {
    return "compact";
  }

  if (viewportHeight >= homeHeroTokens.breakpoints.tallHeightMin) {
    return "tall";
  }

  return "default";
}
