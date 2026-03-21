export type ScrollRuntimeFlags = {
  /**
   * Força desligar smoothWheel, mesmo que o profile base o mantenha ligado.
   */
  forceDisableSmoothWheel: boolean

  /**
   * Força usar o profile desktop padrão, ignorando a detecção de 1080p/tall desktop.
   */
  forceDesktopProfile: boolean

  /**
   * Força usar o profile de desktop alto / 1080p.
   */
  force1080pProfile: boolean

  /**
   * Desliga a heurística de weak machine.
   */
  disableWeakMachineDetection: boolean
}

export const defaultScrollRuntimeFlags: ScrollRuntimeFlags = {
  forceDisableSmoothWheel: false,
  forceDesktopProfile: false,
  force1080pProfile: false,
  disableWeakMachineDetection: false,
}

/**
 * Objeto mutável para testes rápidos em runtime.
 * Você pode editar estes valores diretamente durante calibração.
 */
export const scrollRuntimeFlags: ScrollRuntimeFlags = {
  ...defaultScrollRuntimeFlags,
}

export function resolveScrollRuntimeFlags(
  overrides?: Partial<ScrollRuntimeFlags>,
): ScrollRuntimeFlags {
  return {
    ...defaultScrollRuntimeFlags,
    ...scrollRuntimeFlags,
    ...overrides,
  }
}
