import { useLayoutEffect, type RefObject } from "react";
import { ensureGsapRuntime } from "@/features/scroll/gsapRuntime";
import usePrefersReducedMotion from "@/features/scroll/usePrefersReducedMotion";

export default function useMobilePortfolioBrandPush(
  rootRef: RefObject<HTMLElement | null>,
  cardRef: RefObject<HTMLElement | null>,
) {
  const prefersReducedMotion = usePrefersReducedMotion();
  useLayoutEffect(() => {
    const root = rootRef.current;
    const card = cardRef.current;
    const logo = document.querySelector<HTMLElement>('[data-mobile-brand-pusher="true"]');
    const location = root?.querySelector<HTMLElement>('[data-mobile-location="true"]');
    if (!root || !card || !logo || !location || window.innerWidth >= 992 ||
      prefersReducedMotion) return;

    const { gsap } = ensureGsapRuntime();
    const rows = Array.from(location.children) as HTMLElement[];
    const setters = rows.map(row => gsap.quickSetter(row, "x", "px"));
    const ease = gsap.parseEase("power2.out");
    const releaseEase = gsap.parseEase("power2.inOut");
    let frame: number | null = null;
    const contactGain = (box: DOMRect, logoBox: DOMRect, restingLeft: number, restingRight: number) => {
      if (logo.dataset.mobileBrandOwner !== "portfolio" ||
        restingLeft > logoBox.right + 8 || restingRight < logoBox.left - 8) return 0;
      const entering = gsap.utils.clamp(0, 1, (logoBox.bottom + 8 - box.top) / 18);
      const leaving = gsap.utils.clamp(0, 1, (logoBox.top - box.bottom - 8) / 24);
      return ease(entering) * (1 - releaseEase(leaving));
    };
    const update = () => {
      frame = null;
      const logoBox = logo.getBoundingClientRect();
      rows.forEach((row, index) => {
        const box = row.getBoundingClientRect();
        const currentX = Number(gsap.getProperty(row, "x")) || 0;
        const restingLeft = box.left - currentX;
        const restingRight = box.right - currentX;
        const amount = Math.max(0, Math.min(32, window.innerWidth - restingRight - 8));
        setters[index](amount * contactGain(box, logoBox, restingLeft, restingRight));
      });
      const box = card.getBoundingClientRect();
      const gain = contactGain(box, logoBox, 4, root.getBoundingClientRect().right - 4);
      const maxPush = window.innerWidth < 360 ? 20 : 28;
      const amount = maxPush * gain;
      const style = getComputedStyle(card);
      const currentPush = Number.parseFloat(style.getPropertyValue("--mobile-brand-push")) || 0;
      const currentClearance = Number.parseFloat(style.getPropertyValue("--mobile-brand-clearance")) || 0;
      const padding = Number.parseFloat(style.paddingLeft) - currentClearance;
      const clearance = Math.max(0, logoBox.right + 8 - (box.left - currentPush) - maxPush - padding);
      card.style.setProperty("--mobile-brand-push", `${amount.toFixed(2)}px`);
      card.style.setProperty("--mobile-brand-clearance", `${(clearance * gain).toFixed(2)}px`);
      card.dataset.mobileBrandContact = amount > 0.01 ? "true" : "false";
    };
    const schedule = () => {
      if (frame === null) frame = window.requestAnimationFrame(update);
    };
    const logoObserver = new MutationObserver(schedule);
    logoObserver.observe(logo, {attributes: true, attributeFilter: ["style", "data-mobile-brand-owner"]});
    const resizeObserver = new ResizeObserver(schedule);
    [root, card, location, logo].forEach(element => resizeObserver.observe(element));
    const textObserver = new MutationObserver(schedule);
    textObserver.observe(location, {childList: true, characterData: true, subtree: true});
    window.addEventListener("scroll", schedule, {passive: true});
    window.addEventListener("resize", schedule, {passive: true});
    update();
    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      logoObserver.disconnect();
      resizeObserver.disconnect();
      textObserver.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      rows.forEach(row => gsap.set(row, {clearProps: "transform"}));
      card.style.removeProperty("--mobile-brand-push");
      card.style.removeProperty("--mobile-brand-clearance");
      delete card.dataset.mobileBrandContact;
    };
  }, [rootRef, cardRef, prefersReducedMotion]);
}
