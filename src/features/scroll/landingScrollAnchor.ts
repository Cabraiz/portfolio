import { NAVBAR_HEIGHT_MOBILE } from '../../App/NavBar/navbar.constants';

export type LandingScrollAnchor = Readonly<{
  scrollY: number;
  section: HTMLElement | null;
  progress: number;
}>;

function alignmentOffset(section: HTMLElement): number {
  if (!section.closest("main[data-landing-viewport='mobile']")) return 0;
  if (section.id === 'portfolio') return 0;
  if (section.id === 'home') return NAVBAR_HEIGHT_MOBILE;
  return (document.querySelector('nav.navbar')?.getBoundingClientRect().bottom ?? NAVBAR_HEIGHT_MOBILE) + 2;
}

/** Store a position in the scene, rather than pixels from a previous viewport. */
export function captureLandingScrollAnchor(scrollY = window.scrollY): LandingScrollAnchor {
  const sections = Array.from(document.querySelectorAll<HTMLElement>("main[data-landing-viewport] > section[data-page-section='true']"));
  let section = sections[0] ?? null;
  for (const candidate of sections) {
    const start = candidate.getBoundingClientRect().top + window.scrollY - alignmentOffset(candidate);
    if (start > scrollY + 1) break;
    section = candidate;
  }
  if (!section) return {scrollY, section: null, progress: 0};
  const rect = section.getBoundingClientRect();
  const start = rect.top + window.scrollY - alignmentOffset(section);
  return {scrollY, section, progress: (scrollY - start) / Math.max(1, rect.height)};
}

export function resolveLandingScrollAnchor(anchor: LandingScrollAnchor): number {
  if (!anchor.section?.isConnected) return anchor.scrollY;
  const rect = anchor.section.getBoundingClientRect();
  return Math.max(0, rect.top + window.scrollY - alignmentOffset(anchor.section) + anchor.progress * rect.height);
}

type SectionGeometry = Readonly<{section: HTMLElement; start: number; height: number}>;

/**
 * Âncora a cada quadro de rolagem sem forçar layout: guarda início e altura
 * das seções (posições do documento, que não mudam com o scroll) e só mede de
 * novo quando um ResizeObserver avisa que alguma seção ou o main mudou de tamanho.
 */
export function createLandingScrollAnchorTracker() {
  let geometry: SectionGeometry[] | null = null;
  // Cada observe() entrega o tamanho atual uma vez (marcado com ''): só
  // invalida quando uma entrega seguinte traz outro tamanho.
  const sizes = new WeakMap<Element, string>();
  const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver((entries) => {
    for (const {target, contentRect} of entries) {
      const size = `${contentRect.width}x${contentRect.height}`;
      const previous = sizes.get(target);
      if (previous && previous !== size) geometry = null;
      sizes.set(target, size);
    }
  });
  const watch = (element: Element) => {
    if (sizes.has(element)) return;
    sizes.set(element, '');
    observer?.observe(element);
  };
  const measure = (): SectionGeometry[] => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>("main[data-landing-viewport] > section[data-page-section='true']"));
    const main = sections[0]?.parentElement;
    if (main) watch(main);
    return sections.map((section) => {
      watch(section);
      const rect = section.getBoundingClientRect();
      return {section, start: rect.top + window.scrollY - alignmentOffset(section), height: rect.height};
    });
  };
  return {
    capture(scrollY = window.scrollY): LandingScrollAnchor {
      if (observer === null) return captureLandingScrollAnchor(scrollY);
      if (geometry === null || geometry.some(({section}) => !section.isConnected)) geometry = measure();
      let current = geometry[0];
      for (const candidate of geometry) {
        if (candidate.start > scrollY + 1) break;
        current = candidate;
      }
      if (!current) return {scrollY, section: null, progress: 0};
      return {scrollY, section: current.section, progress: (scrollY - current.start) / Math.max(1, current.height)};
    },
    dispose() { observer?.disconnect(); geometry = null; },
  };
}
