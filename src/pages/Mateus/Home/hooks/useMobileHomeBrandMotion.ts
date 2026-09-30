import { useLayoutEffect, type RefObject } from "react";
import { ensureGsapRuntime } from "@/features/scroll/gsapRuntime";

type ElementRef = RefObject<HTMLElement | null>;
type MotionRefs = {
  pageRef: ElementRef;
  eyebrowRef: ElementRef;
  titleRef: ElementRef;
  identityRef: ElementRef;
  introRef: ElementRef;
  partnersRef: ElementRef;
  partnersHeadingRef: ElementRef;
  portraitRef: ElementRef;
};
const REST_X = -24;
const CONTACT_GAP = 8;

export default function useMobileHomeBrandMotion({
  pageRef, eyebrowRef, titleRef, identityRef, introRef, partnersRef,
  partnersHeadingRef, portraitRef,
}: MotionRefs) {
  useLayoutEffect(() => {
    const page = pageRef.current;
    const logo = document.querySelector<HTMLElement>('[data-mobile-brand-pusher="true"]');
    const navbar = logo?.closest("nav");
    const portfolio = page?.closest("main[data-landing-viewport='mobile']")?.querySelector<HTMLElement>("#portfolio");
    const actions = page?.querySelector<HTMLElement>('nav[aria-label="Ações de contato"]');
    if (!page || !logo || !navbar || !portfolio || !actions ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const { gsap, ScrollTrigger } = ensureGsapRuntime();
    const items = [
      { element: eyebrowRef.current, distance: 58, releaseAt: .2 },
      { element: titleRef.current, distance: 72, releaseAt: .54 },
      { element: identityRef.current, distance: 60, releaseAt: .72 },
      ...Array.from(introRef.current?.querySelectorAll<HTMLElement>("[data-mobile-intro-line]") ?? [])
        .map(element => ({ element, distance: 66, releaseAt: .84 })),
      { element: partnersHeadingRef.current, distance: 72, releaseAt: .9 },
      ...Array.from(partnersRef.current?.querySelectorAll<HTMLElement>("[data-mobile-partner-item]") ?? [])
        .map(element => ({ element, distance: 40, releaseAt: .9 })),
    ].filter((item): item is { element: HTMLElement; distance: number; releaseAt: number } => Boolean(item.element));
    const rows = items.map(item => ({ ...item, x: 0, scale: 1, fitScale: 1, top: 0, bottom: 0,
      left: 0, right: 0, setter: gsap.quickSetter(item.element, "x", "px"),
      fitSetter: item.element === titleRef.current ? gsap.quickSetter(item.element, "scaleX") : null }));
    const layout = { start: 0, homeEnd: 1, end: 1, portfolioTop: 0, portfolioBottom: 1,
      navHeight: 72, restTop: 0, homeTop: 0, left: 0, width: 44, height: 44,
      viewportWidth: 0, viewportHeight: 0, actionsTop: 0, actionsBottom: 0,
      actionsLeft: 0, actionsPadding: 0 };
    let logoY = 0;
    let actionPush = 0;
    let actionClearance = 0;
    let refreshFrame: number | null = null;
    let disposed = false;
    const ease = gsap.parseEase("power2.out");
    const releaseEase = gsap.parseEase("power2.inOut");
    const clamp = (value: number) => Math.max(0, Math.min(1, value));
    const measureLayout = () => {
      const scroll = window.scrollY;
      const nav = navbar.getBoundingClientRect();
      const brand = logo.getBoundingClientRect();
      const home = page.getBoundingClientRect();
      const projects = portfolio.getBoundingClientRect();
      const bar = actions.getBoundingClientRect();
      layout.navHeight = nav.height;
      layout.start = home.top + scroll - nav.height;
      layout.end = projects.bottom + scroll - nav.height;
      layout.portfolioTop = projects.top + scroll;
      layout.homeEnd = layout.portfolioTop - nav.height;
      layout.portfolioBottom = projects.bottom + scroll;
      layout.restTop = brand.top - logoY;
      layout.homeTop = layout.restTop + (72 - nav.height) / 2 - (44 - logo.offsetHeight) / 2;
      layout.left = brand.left;
      layout.width = logo.offsetWidth;
      layout.height = logo.offsetHeight;
      layout.viewportWidth = window.innerWidth;
      layout.viewportHeight = window.innerHeight;
      layout.actionsTop = bar.top + scroll;
      layout.actionsBottom = bar.bottom + scroll;
      layout.actionsLeft = bar.left - actionPush;
      layout.actionsPadding = parseFloat(getComputedStyle(actions).paddingLeft) - actionClearance;
      rows.forEach(row => {
        const box = row.element.getBoundingClientRect();
        const parentTransform = getComputedStyle(row.element.parentElement!).transform;
        row.scale = new DOMMatrixReadOnly(parentTransform).a || 1;
        row.top = box.top + scroll;
        row.bottom = box.bottom + scroll;
        row.left = box.left - row.x * row.scale;
        row.right = row.left + box.width / row.fitScale;
      });
    };
    const context = gsap.context(() => {
      gsap.set(logo, { x: REST_X, y: 0, rotation: 0, scale: 1, autoAlpha: 1,
        willChange: "transform", force3D: true });
      gsap.set(rows.map(row => row.element), { autoAlpha: 1, willChange: "transform", force3D: true });
      gsap.set(titleRef.current, { transformOrigin: "left center" });
      const setLogoY = gsap.quickSetter(logo, "y", "px");
      measureLayout();
      const update = (progress: number) => {
        const scroll = window.scrollY;
        const travel = layout.viewportHeight - layout.homeTop - layout.height - 16;
        // A single path crosses Home's outgoing edge without attaching to its CTA.
        // Only Portfolio's final edge carries the brand back to the following header.
        const top = Math.max(layout.restTop, Math.min(
          layout.homeTop + progress * travel,
          layout.portfolioBottom - scroll - layout.height - 12,
        ));
        logoY = top - layout.restTop;
        setLogoY(logoY);
        const bottom = top + layout.height;
        const right = layout.left + layout.width;
        logo.dataset.mobileBrandOwner = layout.portfolioBottom - scroll <= layout.navHeight
          ? "roadMap" : bottom + CONTACT_GAP >= layout.portfolioTop - scroll ? "portfolio" : "home";
        const homeProgress = clamp((scroll - layout.start) / Math.max(1, layout.homeEnd - layout.start));
        rows.forEach(row => {
          const near = row.left <= right + CONTACT_GAP && row.right >= layout.left - CONTACT_GAP;
          const contact = near ? clamp((bottom + CONTACT_GAP - (row.top - scroll)) / 18) : 0;
          const release = clamp((homeProgress - row.releaseAt) / .13);
          const gain = ease(contact) * (1 - releaseEase(release));
          // Reserve room for the brand without letting the long title cross the viewport edge.
          const fittingScale = Math.min(1, Math.max(.88,
            (layout.viewportWidth - 8 - Math.max(row.left, right + CONTACT_GAP)) /
            Math.max(1, row.right - row.left)));
          row.fitScale = row.fitSetter ? 1 - (1 - fittingScale) * gain : 1;
          row.fitSetter?.(row.fitScale);
          const fittedRight = row.left + (row.right - row.left) * row.fitScale;
          const distance = Math.max(0, Math.min(row.distance,
            (layout.viewportWidth - fittedRight - 8) / row.scale));
          row.x = distance * gain;
          row.setter(row.x);
        });
        const contact = clamp((bottom + CONTACT_GAP - (layout.actionsTop - scroll)) / 18);
        const release = clamp((top - (layout.actionsBottom - scroll) - CONTACT_GAP) / 24);
        const gain = ease(contact) * (1 - releaseEase(release));
        const maxPush = layout.viewportWidth < 360 ? 20 : 28;
        actionPush = maxPush * gain;
        actionClearance = Math.max(0, right + CONTACT_GAP - layout.actionsLeft - maxPush - layout.actionsPadding) * gain;
        actions.style.setProperty("--mobile-brand-push", `${actionPush.toFixed(2)}px`);
        actions.style.setProperty("--mobile-brand-clearance", `${actionClearance.toFixed(2)}px`);
      };
      ScrollTrigger.create({ trigger: page, start: () => layout.start, end: () => layout.end,
        onRefreshInit: measureLayout, onRefresh: self => update(self.progress),
        onUpdate: self => update(self.progress) });
      gsap.to(portraitRef.current, { y: -22, scale: 1.018, ease: "none",
        scrollTrigger: { trigger: page, start: () => `top top+=${layout.navHeight}`,
          end: () => `bottom top+=${layout.navHeight}`, scrub: true, invalidateOnRefresh: true } });
    }, page);

    const scheduleRefresh = () => {
      if (disposed || refreshFrame !== null) return;
      refreshFrame = requestAnimationFrame(() => { refreshFrame = null; ScrollTrigger.refresh(); });
    };
    const observer = new ResizeObserver(scheduleRefresh);
    [page, navbar, logo, portfolio].forEach(element => observer.observe(element));
    document.fonts.addEventListener("loadingdone", scheduleRefresh);
    void document.fonts.ready.then(scheduleRefresh);
    scheduleRefresh();
    return () => {
      disposed = true;
      if (refreshFrame !== null) cancelAnimationFrame(refreshFrame);
      observer.disconnect();
      document.fonts.removeEventListener("loadingdone", scheduleRefresh);
      context.revert();
      delete logo.dataset.mobileBrandOwner;
      actions.style.removeProperty("--mobile-brand-push");
      actions.style.removeProperty("--mobile-brand-clearance");
    };
  }, [pageRef, eyebrowRef, titleRef, identityRef, introRef, partnersRef, partnersHeadingRef, portraitRef]);
}
