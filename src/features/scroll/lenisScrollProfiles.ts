export type ScrollPlatform = "desktop" | "tablet" | "mobile"

export type ScrollProfileName =
  | "desktop"
  | "desktop1080p"
  | "weakMachine"
  | "reducedMotion"
  | "mobile"

export type ScrollViewport = Readonly<{
  width: number
  height: number
}>

export type ScrollHardwareInfo = Readonly<{
  /**
   * navigator.deviceMemory
   */
  deviceMemoryGb?: number | null

  /**
   * navigator.hardwareConcurrency
   */
  hardwareConcurrency?: number | null

  /**
   * Override manual para testes.
   */
  isWeakMachine?: boolean

  /**
   * Sinal opcional vindo de alguma heurística externa.
   */
  lowPowerMode?: boolean
}>

export type LenisScrollSettings = Readonly<{
  smoothWheel: boolean
  lerp: number
  wheelMultiplier: number
  touchMultiplier: number
}>

export const LENIS_SCROLL_PROFILES: Record<
  ScrollProfileName,
  LenisScrollSettings
> = {
  /**
   * Desktop padrão.
   * Mantido colado ao default oficial do Lenis.
   */
  desktop: {
    smoothWheel: true,
    lerp: 0.1,
    wheelMultiplier: 1,
    touchMultiplier: 1,
  },

  /**
   * 1080p / desktop alto.
   * Primeiro passo: igual ao desktop padrão.
   * Isso remove feeling artificial por viewport.
   */
  desktop1080p: {
    smoothWheel: true,
    lerp: 0.1,
    wheelMultiplier: 1,
    touchMultiplier: 1,
  },

  /**
   * Máquina fraca.
   * Ainda estável, mas sem smoothing de wheel
   * para diminuir custo percebido e arrasto.
   */
  weakMachine: {
    smoothWheel: false,
    lerp: 0.1,
    wheelMultiplier: 1,
    touchMultiplier: 1,
  },

  /**
   * Acessibilidade / movimento reduzido.
   */
  reducedMotion: {
    smoothWheel: false,
    lerp: 1,
    wheelMultiplier: 1,
    touchMultiplier: 1,
  },

  /**
   * Mobile / touch.
   * Mantido sem smoothWheel.
   */
  mobile: {
    smoothWheel: false,
    lerp: 0.1,
    wheelMultiplier: 1,
    touchMultiplier: 1,
  },
}

export function cloneLenisScrollSettings(
  settings: LenisScrollSettings,
): LenisScrollSettings {
  return {
    smoothWheel: settings.smoothWheel,
    lerp: settings.lerp,
    wheelMultiplier: settings.wheelMultiplier,
    touchMultiplier: settings.touchMultiplier,
  }
}

export function getLenisScrollProfile(
  profileName: ScrollProfileName,
): LenisScrollSettings {
  return cloneLenisScrollSettings(LENIS_SCROLL_PROFILES[profileName])
}

export function isDesktop1080pViewport(viewport: ScrollViewport): boolean {
  return viewport.width >= 1280 && viewport.height >= 900
}

export function resolvePlatformFromViewport(
  viewport: ScrollViewport,
): ScrollPlatform {
  if (viewport.width < 768) {
    return "mobile"
  }

  if (viewport.width < 1024) {
    return "tablet"
  }

  return "desktop"
}
