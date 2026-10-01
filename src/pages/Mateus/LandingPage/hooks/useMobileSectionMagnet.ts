import { useEffect } from 'react';
import { useLenis } from 'lenis/react';

import { readPendingLandingScrollTarget } from '../../../../features/scroll/landingScrollTarget';
import { resolveLandingNavbarOffsetPx } from '../landingLayout.tokens';

const QUIET_MS = 220;
const CONTROL_SELECTOR = 'a, button, input, textarea, select, [contenteditable="true"], [role="dialog"], [data-lenis-prevent], [data-lenis-prevent-touch], [data-lenis-prevent-wheel]';

/** A small, interruptible correction after a user scroll, never a scroll lock. */
export default function useMobileSectionMagnet(
  containerRef: Readonly<{ current: HTMLElement | null }>,
): void {
  const lenis = useLenis();

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !lenis) return;

    let timer: number | undefined;
    let armed = false;
    let touching = false;
    let touchX = 0;
    let touchY = 0;
    let originY = 0;
    let expiresAt = 0;
    let settling = false;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const cancel = (stopAnimation = true) => {
      window.clearTimeout(timer);
      armed = false;
      if (settling) {
        settling = false;
        container.removeAttribute('data-mobile-section-settling');
        // Do not overwrite a menu/CTA scroll that has just taken ownership.
        if (stopAnimation && readPendingLandingScrollTarget() === null) {
          lenis.scrollTo(window.scrollY, { immediate: true });
        }
      }
    };

    const blocked = () => {
      const viewport = window.visualViewport;
      return document.hidden || lenis.isStopped || reducedMotion.matches ||
        readPendingLandingScrollTarget() !== null ||
        Boolean(document.activeElement?.matches('input, textarea, select, [contenteditable="true"]')) ||
        Boolean(document.querySelector('button[aria-expanded="true"][aria-controls]')) ||
        (viewport !== null && (Math.abs(viewport.scale - 1) > 0.01 || viewport.height < window.innerHeight * 0.85));
    };

    const canStart = (target: EventTarget | null) => {
      if (!(target instanceof Element) || !container.contains(target) || target.closest(CONTROL_SELECTOR) || blocked()) return false;
      // A gesture inside a scrollable rail/chat belongs to that component.
      for (let node: Element | null = target; node && node !== container; node = node.parentElement) {
        const style = getComputedStyle(node);
        if (/(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight + 2) return false;
        if (/(auto|scroll)/.test(style.overflowX) && node.scrollWidth > node.clientWidth + 2) return false;
      }
      return true;
    };

    const settle = () => {
      if (!armed || touching) return;
      armed = false; // At most one correction per gesture, including ineligible ones.
      if (blocked() || performance.now() > expiresAt || Math.abs(window.scrollY - originY) < 1) return;

      const viewport = window.visualViewport;
      const viewTop = viewport?.offsetTop ?? 0;
      const viewBottom = viewTop + (viewport?.height ?? window.innerHeight);
      let nearest: { id: string; destination: number; distance: number } | undefined;
      for (const section of container.querySelectorAll<HTMLElement>(":scope > section[data-page-section='true']")) {
        const rect = section.getBoundingClientRect();
        const inset = section.id === 'portfolio' ? 0 : resolveLandingNavbarOffsetPx('mobile');
        const top = viewTop + inset;
        const usefulHeight = viewBottom - top;
        // Long scenes/flow sections must remain scrollable inside their content.
        if (rect.height < usefulHeight * 0.9 || rect.height > usefulHeight + 2) continue;
        const visible = Math.max(0, Math.min(rect.bottom, viewBottom) - Math.max(rect.top, top));
        const distance = rect.top - top;
        if (visible / rect.height < 0.9 || Math.abs(distance) > rect.height * 0.1 || Math.abs(distance) < 1) continue;
        if (!nearest || Math.abs(distance) < Math.abs(nearest.distance)) {
          nearest = { id: section.id, destination: Math.max(0, window.scrollY + distance), distance };
        }
      }
      if (!nearest) return;

      settling = true;
      container.setAttribute('data-mobile-section-settling', nearest.id);
      lenis.scrollTo(nearest.destination, {
        duration: 0.28,
        easing: (value) => 1 - (1 - value) ** 3,
        // No force/lock: user input and existing navigation retain priority.
        onComplete: () => {
          settling = false;
          container.removeAttribute('data-mobile-section-settling');
        },
      });
    };
    const schedule = () => {
      window.clearTimeout(timer);
      if (armed && !touching) timer = window.setTimeout(settle, QUIET_MS);
    };
    const onWheel = (event: WheelEvent) => {
      cancel();
      touching = false;
      if (event.ctrlKey || Math.abs(event.deltaY) <= Math.abs(event.deltaX) || !canStart(event.target)) return;
      originY = window.scrollY;
      armed = true;
      expiresAt = performance.now() + 4000;
      schedule();
    };
    const onTouchStart = (event: TouchEvent) => {
      cancel();
      touching = event.touches?.length === 1 && canStart(event.target);
      if (!touching) return;
      touchX = event.touches[0].clientX;
      touchY = event.touches[0].clientY;
      originY = window.scrollY;
    };
    const onTouchMove = (event: TouchEvent) => {
      if (!touching || event.touches?.length !== 1) { cancel(); touching = false; return; }
      const dx = Math.abs(event.touches[0].clientX - touchX);
      const dy = Math.abs(event.touches[0].clientY - touchY);
      if (dy > 8 && dy > dx) armed = true;
      if (dx > 8 && dx > dy) { cancel(); touching = false; }
    };
    const onTouchEnd = () => {
      touching = false;
      expiresAt = performance.now() + 4000;
      schedule();
    };
    const reset = () => { touching = false; cancel(); };
    const onPointerDown = () => cancel();
    const onScroll = () => schedule();
    const navigationObserver = new MutationObserver(() => {
      if (readPendingLandingScrollTarget() !== null) { touching = false; cancel(false); }
    });
    navigationObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-landing-scroll-target'] });
    window.addEventListener('wheel', onWheel, { passive: true, capture: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true, capture: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true, capture: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', reset, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true, capture: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', reset);
    window.addEventListener('blur', reset);
    window.addEventListener('keydown', reset);
    document.addEventListener('visibilitychange', reset);
    document.addEventListener('focusin', reset);
    window.visualViewport?.addEventListener('resize', reset);
    reducedMotion.addEventListener('change', reset);

    return () => {
      reset();
      navigationObserver.disconnect();
      window.removeEventListener('wheel', onWheel, true);
      window.removeEventListener('touchstart', onTouchStart, true);
      window.removeEventListener('touchmove', onTouchMove, true);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', reset);
      window.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', reset);
      window.removeEventListener('blur', reset);
      window.removeEventListener('keydown', reset);
      document.removeEventListener('visibilitychange', reset);
      document.removeEventListener('focusin', reset);
      window.visualViewport?.removeEventListener('resize', reset);
      reducedMotion.removeEventListener('change', reset);
    };
  }, [containerRef, lenis]);
}
