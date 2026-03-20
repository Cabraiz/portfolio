import { mateusHeroTokens, type HeroViewportMode } from "./mateusHero.tokens";

export function getMateusHeroViewportMode(
  viewportWidth: number,
  viewportHeight: number,
): HeroViewportMode {
  if (viewportWidth < mateusHeroTokens.breakpoints.desktopMinWidth) {
    return "compact";
  }

  if (viewportHeight <= mateusHeroTokens.breakpoints.compactHeightMax) {
    return "compact";
  }

  if (viewportHeight >= mateusHeroTokens.breakpoints.tallHeightMin) {
    return "tall";
  }

  return "default";
}
