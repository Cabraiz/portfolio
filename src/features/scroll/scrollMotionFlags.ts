// src/features/scroll/scrollMotionFlags.ts

export const scrollMotionFlags = {
  /**
   * Liga/desliga fades e reveals atrelados ao scroll
   * para teste de performance.
   *
   * true  => desabilita fade in / fade out
   * false => mantém comportamento normal
   */
  disableScrollFades: false,
} as const;

export function shouldDisableScrollFades(): boolean {
  return scrollMotionFlags.disableScrollFades;
}
