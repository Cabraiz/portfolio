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
    // Valores aplicados por último: sem getComputedStyle nem escrita repetida
    // a cada quadro da rolagem (cada escrita invalidava o estilo do card).
    const rowX = rows.map(() => 0);
    let push = 0;
    let clearance = 0;
    let contact = "";
    let padding: number | null = null;
    const update = () => {
      frame = null;
      // Fora do Portfólio nada encosta: com tudo já em zero, nem mede.
      if (logo.dataset.mobileBrandOwner !== "portfolio" && push === 0 && clearance === 0 &&
        rowX.every(x => x === 0) && contact === "false") return;
      const logoBox = logo.getBoundingClientRect();
      rows.forEach((row, index) => {
        const box = row.getBoundingClientRect();
        const restingLeft = box.left - rowX[index];
        const restingRight = box.right - rowX[index];
        const amount = Math.max(0, Math.min(32, window.innerWidth - restingRight - 8));
        const x = Math.round(amount * contactGain(box, logoBox, restingLeft, restingRight) * 100) / 100;
        if (x !== rowX[index]) { rowX[index] = x; setters[index](x); }
      });
      const box = card.getBoundingClientRect();
      const gain = contactGain(box, logoBox, 4, root.getBoundingClientRect().right - 4);
      const maxPush = window.innerWidth < 360 ? 20 : 28;
      const amount = Math.round(maxPush * gain * 100) / 100;
      padding ??= Number.parseFloat(getComputedStyle(card).paddingLeft) - clearance;
      const nextClearance = Math.round(Math.max(0, logoBox.right + 8 - (box.left - push) - maxPush - padding) * gain * 100) / 100;
      if (amount !== push) { push = amount; card.style.setProperty("--mobile-brand-push", `${amount.toFixed(2)}px`); }
      if (nextClearance !== clearance) { clearance = nextClearance; card.style.setProperty("--mobile-brand-clearance", `${nextClearance.toFixed(2)}px`); }
      const nextContact = amount > 0.01 ? "true" : "false";
      if (nextContact !== contact) { contact = nextContact; card.dataset.mobileBrandContact = nextContact; }
    };
    const schedule = () => {
      if (frame === null) frame = window.requestAnimationFrame(update);
    };
    const logoObserver = new MutationObserver(schedule);
    logoObserver.observe(logo, {attributes: true, attributeFilter: ["style", "data-mobile-brand-owner"]});
    // O padding do card muda com a largura da tela: mede de novo no próximo update.
    const resizeObserver = new ResizeObserver(() => { padding = null; schedule(); });
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
