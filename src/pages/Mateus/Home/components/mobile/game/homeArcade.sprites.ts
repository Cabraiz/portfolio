function encodeSvg(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const HOME_ARCADE_SPRITES = {
  playerTrail: encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <defs>
        <radialGradient id="trailGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="rgba(255,215,120,0.9)"/>
          <stop offset="45%" stop-color="rgba(255,120,210,0.55)"/>
          <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill="url(#trailGlow)"/>
    </svg>
  `),

  coinGlyph: encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <defs>
        <radialGradient id="coinFill" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#fff5b9"/>
          <stop offset="42%" stop-color="#ffdd57"/>
          <stop offset="100%" stop-color="#ffa600"/>
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="10" fill="url(#coinFill)" stroke="rgba(255,247,205,0.9)" stroke-width="1.6"/>
      <circle cx="12" cy="12" r="5.8" fill="none" stroke="rgba(160,110,0,0.42)" stroke-width="1.8"/>
      <path d="M12 6.2v11.6M8.4 9.2h6.2c1.3 0 2.2.8 2.2 2s-.9 2-2.2 2H10.7c-1.4 0-2.3.8-2.3 2s.9 2 2.3 2h5.1"
            fill="none" stroke="rgba(131,85,0,0.55)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `),

  spikeWide: encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 40">
      <defs>
        <linearGradient id="lavaWide" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#ff89b7"/>
          <stop offset="55%" stop-color="#ff5a73"/>
          <stop offset="100%" stop-color="#b01939"/>
        </linearGradient>
      </defs>
      <path d="M0 40 L10 16 L20 40 L32 6 L44 40 L54 18 L64 40 Z"
            fill="url(#lavaWide)"
            stroke="rgba(255,255,255,0.16)"
            stroke-width="1.4"
            stroke-linejoin="round"/>
    </svg>
  `),

  crystalTall: encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 64">
      <defs>
        <linearGradient id="crystalTall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#ff8be1"/>
          <stop offset="46%" stop-color="#ff54a4"/>
          <stop offset="100%" stop-color="#8e1467"/>
        </linearGradient>
      </defs>
      <path d="M20 2 L38 24 L31 62 H9 L2 24 Z"
            fill="url(#crystalTall)"
            stroke="rgba(255,255,255,0.14)"
            stroke-width="1.5"
            stroke-linejoin="round"/>
      <path d="M20 2 L20 62 M10 24 H30"
            fill="none"
            stroke="rgba(255,255,255,0.16)"
            stroke-width="1.2"/>
    </svg>
  `),

  pauseIcon: encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <path d="M7 5h3v14H7zm7 0h3v14h-3z" fill="currentColor"/>
    </svg>
  `),

  playIcon: encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <path d="M8 5.5l10 6.5-10 6.5V5.5z" fill="currentColor"/>
    </svg>
  `),

  closeIcon: encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `),

  leftArrowIcon: encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <path d="M14.8 5.8L8.6 12l6.2 6.2" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `),

  rightArrowIcon: encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <path d="M9.2 5.8L15.4 12l-6.2 6.2" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `),

  jumpBadge: encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 24">
      <rect x="1" y="1" width="62" height="22" rx="11" fill="rgba(255,209,82,0.20)" stroke="rgba(255,217,110,0.5)" stroke-width="1.5"/>
      <path d="M18 16V8l6 4-6 4zm11-8h3v8h-3zm6 0h3v8h-3zm7 0h4v8h-4z" fill="rgba(255,255,255,0.94)"/>
    </svg>
  `),

  turboBadge: encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 24">
      <rect x="1" y="1" width="62" height="22" rx="11" fill="rgba(255,79,179,0.16)" stroke="rgba(255,112,194,0.44)" stroke-width="1.5"/>
      <path d="M18 8h28M24 12h22M30 16h16" fill="none" stroke="rgba(255,255,255,0.94)" stroke-width="2" stroke-linecap="round"/>
      <circle cx="50" cy="12" r="3" fill="rgba(255,255,255,0.96)"/>
    </svg>
  `),

  resetBadge: encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 24">
      <rect x="1" y="1" width="62" height="22" rx="11" fill="rgba(133,98,255,0.16)" stroke="rgba(165,135,255,0.44)" stroke-width="1.5"/>
      <path d="M20 12a8 8 0 1 0 2.3-5.7M20 6v5h5" fill="none" stroke="rgba(255,255,255,0.94)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `),
} as const;

export type HomeArcadeSpriteKey = keyof typeof HOME_ARCADE_SPRITES;

export function getHomeArcadeSprite(
  key: HomeArcadeSpriteKey,
): string {
  return HOME_ARCADE_SPRITES[key];
}
