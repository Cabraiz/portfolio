import {
  getLenisScrollProfile,
  isDesktop1080pViewport,
  resolvePlatformFromViewport,
  type LenisScrollSettings,
  type ScrollHardwareInfo,
  type ScrollPlatform,
  type ScrollProfileName,
  type ScrollViewport,
} from "./lenisScrollProfiles"
import {
  resolveScrollRuntimeFlags,
  type ScrollRuntimeFlags,
} from "./scrollRuntimeFlags"

export type GetLenisScrollSettingsParams = Readonly<{
  viewport: ScrollViewport
  hardware?: ScrollHardwareInfo
  prefersReducedMotion?: boolean
  platform?: ScrollPlatform
  flags?: Partial<ScrollRuntimeFlags>
}>

export type ResolvedLenisScrollSettings = Readonly<{
  profileName: ScrollProfileName
  platform: ScrollPlatform
  isDesktop1080p: boolean
  isWeakMachine: boolean
  settings: LenisScrollSettings
}>

function detectWeakMachine(
  hardware: ScrollHardwareInfo | undefined,
  flags: ScrollRuntimeFlags,
): boolean {
  if (flags.disableWeakMachineDetection) {
    return false
  }

  if (!hardware) {
    return false
  }

  if (typeof hardware.isWeakMachine === "boolean") {
    return hardware.isWeakMachine
  }

  const hasLowMemory =
    typeof hardware.deviceMemoryGb === "number" && hardware.deviceMemoryGb <= 4

  const hasFewCores =
    typeof hardware.hardwareConcurrency === "number" &&
    hardware.hardwareConcurrency <= 4

  return hasLowMemory || hasFewCores || hardware.lowPowerMode === true
}

function resolveProfileName(
  params: Readonly<{
    platform: ScrollPlatform
    prefersReducedMotion: boolean
    isDesktop1080p: boolean
    isWeakMachine: boolean
    flags: ScrollRuntimeFlags
  }>,
): ScrollProfileName {
  const {
    platform,
    prefersReducedMotion,
    isDesktop1080p,
    isWeakMachine,
    flags,
  } = params

  if (prefersReducedMotion) {
    return "reducedMotion"
  }

  if (platform === "mobile") {
    return "mobile"
  }

  if (flags.force1080pProfile) {
    return "desktop1080p"
  }

  if (flags.forceDesktopProfile) {
    return "desktop"
  }

  if (isWeakMachine) {
    return "weakMachine"
  }

  if (isDesktop1080p) {
    return "desktop1080p"
  }

  return "desktop"
}

function applyRuntimeFlags(
  settings: LenisScrollSettings,
  flags: ScrollRuntimeFlags,
): LenisScrollSettings {
  if (!flags.forceDisableSmoothWheel) {
    return settings
  }

  return {
    ...settings,
    smoothWheel: false,
  }
}

/**
 * Resolve apenas os settings finais do Lenis.
 * Útil quando o componente só precisa passar opções para o ReactLenis.
 */
export function getLenisScrollSettings(
  params: GetLenisScrollSettingsParams,
): LenisScrollSettings {
  return getResolvedLenisScrollSettings(params).settings
}

/**
 * Resolve profile + metadata + settings finais.
 * Útil para debug e calibração.
 */
export function getResolvedLenisScrollSettings(
  params: GetLenisScrollSettingsParams,
): ResolvedLenisScrollSettings {
  const flags = resolveScrollRuntimeFlags(params.flags)
  const platform =
    params.platform ?? resolvePlatformFromViewport(params.viewport)
  const prefersReducedMotion = params.prefersReducedMotion ?? false
  const isDesktop1080p = isDesktop1080pViewport(params.viewport)
  const isWeakMachine = detectWeakMachine(params.hardware, flags)

  const profileName = resolveProfileName({
    platform,
    prefersReducedMotion,
    isDesktop1080p,
    isWeakMachine,
    flags,
  })

  const baseSettings = getLenisScrollProfile(profileName)
  const settings = applyRuntimeFlags(baseSettings, flags)

  return {
    profileName,
    platform,
    isDesktop1080p,
    isWeakMachine,
    settings,
  }
}
