import { useLayoutEffect, useRef, useState, type RefObject } from 'react';

import { normalizeLandingSectionId, type LandingSectionId } from '../../../features/navigation/landingSections';

/** The material follows the background under the symbol, independently of menu selection. */
export default function useBrandSectionContact(
  symbolRef: RefObject<HTMLSpanElement | null>,
  initialSection: LandingSectionId | '',
): LandingSectionId {
  const [sectionId, setSectionId] = useState<LandingSectionId>(initialSection || 'home');
  const ownerRef = useRef(sectionId);

  useLayoutEffect(() => {
    const symbol = symbolRef.current;
    if (!symbol) return;
    let frame: number | undefined;
    const observedSections = new Set<HTMLElement>();

    const measure = () => {
      frame = undefined;
      const rect = symbol.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const viewport = symbol.closest('[data-mobile-brand-pusher]') ? 'mobile' : 'desktop';
      const sections = document.querySelectorAll<HTMLElement>(
        `main[data-landing-viewport="${viewport}"] > section[data-page-section="true"]`,
      );
      for (const section of sections) {
        if (!observedSections.has(section)) {
          observedSections.add(section);
          sizeObserver.observe(section);
        }
        const bounds = section.getBoundingClientRect();
        if (x < bounds.left || x >= bounds.right || y < bounds.top || y >= bounds.bottom) continue;
        const owner = normalizeLandingSectionId(section.id);
        if (owner && ownerRef.current !== owner) {
          ownerRef.current = owner;
          setSectionId(owner);
        }
        return;
      }
      // Loading/outer gaps retain the last material, never anticipate the menu target.
    };
    const schedule = () => {
      if (frame === undefined) frame = window.requestAnimationFrame(measure);
    };
    const sizeObserver = new ResizeObserver(schedule);
    sizeObserver.observe(symbol);
    const geometryObserver = new MutationObserver(schedule);
    // GSAP moves the mobile button after the scroll event; watch that existing
    // transform without writing another transform or running a continuous ticker.
    if (symbol.parentElement) geometryObserver.observe(symbol.parentElement, { attributes: true, attributeFilter: ['style'] });
    // Sections can mount later or resize with lazy content/font loading.
    geometryObserver.observe(document.body, { childList: true, subtree: true });
    document.fonts.addEventListener('loadingdone', schedule);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('pageshow', schedule);
    window.visualViewport?.addEventListener('resize', schedule);
    window.visualViewport?.addEventListener('scroll', schedule);
    schedule();

    return () => {
      if (frame !== undefined) window.cancelAnimationFrame(frame);
      sizeObserver.disconnect();
      geometryObserver.disconnect();
      document.fonts.removeEventListener('loadingdone', schedule);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('pageshow', schedule);
      window.visualViewport?.removeEventListener('resize', schedule);
      window.visualViewport?.removeEventListener('scroll', schedule);
    };
  }, [symbolRef, initialSection]);

  return sectionId;
}
