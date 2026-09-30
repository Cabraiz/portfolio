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
  // Desktop has pinned scenes whose document geometry can change during a GSAP
  // refresh. Preserve its existing absolute restoration; mobile uses scene anchors.
  const sections = Array.from(document.querySelectorAll<HTMLElement>("main[data-landing-viewport='mobile'] > section[data-page-section='true']"));
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
