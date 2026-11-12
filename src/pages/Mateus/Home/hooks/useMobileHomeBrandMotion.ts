import { useLayoutEffect, type RefObject } from "react";
import { ensureGsapRuntime } from "@/features/scroll/gsapRuntime";
import usePrefersReducedMotion from "@/features/scroll/usePrefersReducedMotion";

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
// Folga mínima entre a caixa do logo e a do texto empurrado.
const MIN_BOX_GAP = 4;
// A barra de contato abre espaço para o logo ao longo destes px de descida
// dele (e volta ao longo dos mesmos px depois que ele passa). Com poucos px
// ela andava 40–60px num único quadro, como um salto.
const ACTION_RAMP = 192;
// Pontas do fundo e do contorno da barra (px): o resto é o meio reto que encolhe.
const BAR_CAP = 24;
const PILL_CAP = 25;
// Amostragem da curva do logo/textos para a ScrollTimeline (px de rolagem) e
// tolerância da simplificação (px de desvio máximo da curva original).
const SAMPLE_STEP = 2;
const SIMPLIFY_PX = 0.15;
const SIMPLIFY_SCALE = 0.0005;

type Sample = readonly [scroll: number, value: number];

/** Ramer–Douglas–Peucker: menos keyframes, desvio máximo `tolerance`. */
function simplify(points: readonly Sample[], tolerance: number): Sample[] {
  if (points.length < 3) return [...points];
  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;
  const stack: Array<[number, number]> = [[0, points.length - 1]];
  while (stack.length > 0) {
    const [first, last] = stack.pop()!;
    const [x0, y0] = points[first];
    const [x1, y1] = points[last];
    let worst = -1;
    let worstError = tolerance;
    for (let index = first + 1; index < last; index += 1) {
      const [x, y] = points[index];
      const expected = y0 + ((y1 - y0) * (x - x0)) / Math.max(1e-9, x1 - x0);
      const error = Math.abs(y - expected);
      if (error > worstError) {
        worstError = error;
        worst = index;
      }
    }
    if (worst > 0) {
      keep[worst] = 1;
      stack.push([first, worst], [worst, last]);
    }
  }
  return points.filter((_, index) => keep[index] === 1);
}

/** Une duas séries simplificadas nos mesmos pontos de rolagem. */
function mergeScrolls(...series: Sample[][]): number[] {
  return [...new Set(series.flatMap((points) => points.map(([scroll]) => scroll)))]
    .sort((a, b) => a - b);
}

function valueAt(points: readonly Sample[], scroll: number): number {
  let index = 1;
  while (index < points.length - 1 && points[index][0] < scroll) index += 1;
  const [x0, y0] = points[index - 1];
  const [x1, y1] = points[index];
  if (x1 === x0) return y1;
  return y0 + ((y1 - y0) * (scroll - x0)) / (x1 - x0);
}

export default function useMobileHomeBrandMotion({
  pageRef, eyebrowRef, titleRef, identityRef, introRef, partnersRef,
  partnersHeadingRef, portraitRef,
}: MotionRefs) {
  const prefersReducedMotion = usePrefersReducedMotion();
  useLayoutEffect(() => {
    const page = pageRef.current;
    const logo = document.querySelector<HTMLElement>('[data-mobile-brand-pusher="true"]');
    const navbar = logo?.closest("nav");
    const portfolio = page?.closest("main[data-landing-viewport='mobile']")?.querySelector<HTMLElement>("#portfolio");
    const actions = page?.querySelector<HTMLElement>('[data-mobile-contact-actions]');
    if (!page || !logo || !navbar || !portfolio || !actions ||
      prefersReducedMotion) return;

    const { gsap, ScrollTrigger } = ensureGsapRuntime();
    // Com Scroll-driven Animations o navegador move o logo e os textos no
    // compositor, no mesmo quadro da rolagem (a rolagem do celular é nativa e
    // roda fora da thread principal). Pelo onUpdate do ScrollTrigger eles
    // chegavam um quadro depois do conteúdo e, quando a thread engasgava,
    // ficavam parados e saltavam. Sem suporte, segue o caminho por JS.
    const scrollDriven = "ScrollTimeline" in window &&
      typeof CSS !== "undefined" && typeof CSS.px === "function";
    let scrollAnimations: Animation[] = [];
    const cancelScrollAnimations = () => {
      scrollAnimations.forEach((animation) => animation.cancel());
      scrollAnimations = [];
    };
    // Quanto cada linha anda para dar lugar ao logo. Ajustado para que o
    // espaço visível entre o logo e o texto fique em ~15-26px (metade do que
    // era: o título chegava a 52px de vão).
    const items = [
      { element: eyebrowRef.current, distance: 41 },
      { element: titleRef.current, distance: 46 },
      { element: identityRef.current, distance: 42 },
      ...Array.from(introRef.current?.querySelectorAll<HTMLElement>("[data-mobile-intro-line]") ?? [])
        .map(element => ({ element, distance: 47 })),
      { element: partnersHeadingRef.current, distance: 48 },
      ...Array.from(partnersRef.current?.querySelectorAll<HTMLElement>("[data-mobile-partner-item]") ?? [])
        .map(element => ({ element, distance: 40, keepClear: false })),
    ].filter((item): item is { element: HTMLElement; distance: number; keepClear?: boolean } =>
      Boolean(item.element));
    const rows = items.map(item => ({ ...item, x: 0, scale: 1, fitScale: 1, top: 0, bottom: 0,
      left: 0, right: 0, setter: gsap.quickSetter(item.element, "x", "px"),
      fitSetter: item.element === titleRef.current ? gsap.quickSetter(item.element, "scaleX") : null }));
    const layout = { start: 0, end: 1, portfolioTop: 0, portfolioBottom: 1,
      navHeight: 72, restTop: 0, homeTop: 0, left: 0, width: 44, height: 44,
      viewportWidth: 0, viewportHeight: 0, actionsTop: 0, actionsBottom: 0,
      actionsLeft: 0, barBody: 1, pillBand: 1 };
    let logoY = 0;
    // A barra de contato estreita para o logo passar sem mudar de layout: só
    // transform (compositor). As pontas deslizam, os meios retos encolhem a
    // partir da direita e o conteúdo de cada botão acompanha o centro dele.
    const part = (selector: string) => actions.querySelector<HTMLElement>(selector);
    const [firstButton, lastButton] = Array.from(actions.querySelectorAll<HTMLElement>(":scope > a"));
    const barParts = {
      cap: part('[data-bar-part="cap"]'),
      body: part('[data-bar-part="body"]'),
      firstCap: firstButton?.querySelector<HTMLElement>('[data-pill-part="cap"]') ?? null,
      firstBand: firstButton?.querySelector<HTMLElement>('[data-pill-part="band"]') ?? null,
      lastBand: lastButton?.querySelector<HTMLElement>('[data-pill-part="band"]') ?? null,
      divider: part("[data-action-divider]"),
      firstContent: firstButton?.querySelector<HTMLElement>("[data-action-content]") ?? null,
      lastContent: lastButton?.querySelector<HTMLElement>("[data-action-content]") ?? null,
    };
    /** Transform de cada parte da barra para `push` px de estreitamento. */
    const barTransforms = (push: number) => {
      const half = push / 2;
      const band = `scaleX(${Math.max(0, (layout.pillBand - half) / layout.pillBand).toFixed(5)})`;
      return [
        [barParts.cap, `translateX(${push.toFixed(3)}px)`],
        [barParts.body, `scaleX(${Math.max(0, (layout.barBody - push) / layout.barBody).toFixed(5)})`],
        [barParts.firstCap, `translateX(${push.toFixed(3)}px)`],
        [barParts.firstBand, `translateX(${half.toFixed(3)}px) ${band}`],
        [barParts.lastBand, band],
        [barParts.divider, `translateX(${half.toFixed(3)}px)`],
        [barParts.firstContent, `translateX(${(push * 0.75).toFixed(3)}px)`],
        [barParts.lastContent, `translateX(${(push * 0.25).toFixed(3)}px)`],
      ].filter((entry): entry is [HTMLElement, string] => entry[0] !== null);
    };
    let refreshFrame: number | null = null;
    let disposed = false;
    const ease = gsap.parseEase("power2.out");
    const releaseEase = gsap.parseEase("power2.inOut");
    const actionEase = gsap.parseEase("sine.inOut");
    const clamp = (value: number) => Math.max(0, Math.min(1, value));
    const measureLayout = () => {
      // Mede a geometria sem as animações da rolagem aplicadas.
      cancelScrollAnimations();
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
      layout.actionsLeft = bar.left;
      layout.barBody = Math.max(1, (barParts.body?.offsetWidth ?? 0) || bar.width - 2 * BAR_CAP);
      layout.pillBand = Math.max(1, (barParts.firstBand?.offsetWidth ?? 0) ||
        (firstButton?.offsetWidth ?? 0) - PILL_CAP);
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
      const progressAt = (scroll: number) =>
        clamp((scroll - layout.start) / Math.max(1, layout.end - layout.start));
      /** Posição do logo e de cada linha para uma rolagem (sem efeitos). */
      const frameAt = (scroll: number, progress = progressAt(scroll)) => {
        const travel = layout.viewportHeight - layout.homeTop - layout.height - 16;
        // Join the incoming Portfolio top before starting its own downward phase.
        // At full entry (section top = viewport top), that phase is still at zero.
        const portfolioProgress = clamp((scroll - layout.portfolioTop) /
          Math.max(1, layout.end - layout.portfolioTop));
        const phaseTop = scroll < layout.portfolioTop
          ? Math.min(layout.homeTop + progress * travel,
            layout.portfolioTop - scroll + layout.restTop)
          : layout.restTop + portfolioProgress * travel;
        const top = Math.max(layout.restTop, Math.min(
          phaseTop,
          layout.portfolioBottom - scroll - layout.height - 12,
        ));
        const bottom = top + layout.height;
        const right = layout.left + layout.width;
        const rowFrames = rows.map(row => {
          const near = row.left <= right + CONTACT_GAP && row.right >= layout.left - CONTACT_GAP;
          const contact = near ? clamp((bottom + CONTACT_GAP - (row.top - scroll)) / 18) : 0;
          const release = clamp((top - (row.bottom - scroll) - CONTACT_GAP) / 24);
          const gain = ease(contact) * (1 - releaseEase(release));
          // Reserve room for the brand without letting the long title cross the viewport edge.
          const fittingScale = Math.min(1, Math.max(.88,
            (layout.viewportWidth - 8 - Math.max(row.left, right + CONTACT_GAP)) /
            Math.max(1, row.right - row.left)));
          const fitScale = row.fitSetter ? 1 - (1 - fittingScale) * gain : 1;
          const fittedRight = row.left + (row.right - row.left) * fitScale;
          // Nunca menos que o necessário para a caixa do texto não encostar no
          // logo (telas estreitas têm o texto mais perto da borda).
          const clearance = row.keepClear === false ? 0 : (right + MIN_BOX_GAP - row.left) / row.scale;
          const distance = Math.max(0, Math.min(Math.max(row.distance, clearance),
            (layout.viewportWidth - fittedRight - 8) / row.scale));
          return { x: distance * gain, fitScale };
        });
        // A barra abre espaço ACTION_RAMP px antes de o logo chegar nela e
        // termina de abrir antes de ele cruzar a borda do fundo vermelho.
        const contact = clamp((bottom + CONTACT_GAP + ACTION_RAMP - (layout.actionsTop - scroll)) / ACTION_RAMP);
        const release = clamp((top - (layout.actionsBottom - scroll) - CONTACT_GAP) / ACTION_RAMP);
        const push = Math.max(0, right + CONTACT_GAP - layout.actionsLeft) *
          actionEase(contact) * (1 - actionEase(release));
        return { top, bottom, right, logoY: top - layout.restTop, rows: rowFrames, push };
      };
      /** Curva amostrada → animações ligadas à rolagem (compositor). */
      const buildScrollAnimations = () => {
        cancelScrollAnimations();
        if (!scrollDriven) return;
        const scroller = document.scrollingElement ?? document.documentElement;
        const maxScroll = Math.max(1, scroller.scrollHeight - window.innerHeight);
        const scrolls: number[] = [];
        for (let scroll = 0; scroll < maxScroll; scroll += SAMPLE_STEP) scrolls.push(scroll);
        scrolls.push(maxScroll);
        const frames = scrolls.map(scroll => frameAt(scroll));
        const timeline = new ScrollTimeline({ source: scroller, axis: "block" });
        // Faixa em px (não em %): a barra de endereço do celular muda o
        // tamanho total da rolagem e deslocaria a curva.
        const options = {
          timeline, fill: "both", easing: "linear", duration: "auto",
          rangeStart: { offset: CSS.px(0) }, rangeEnd: { offset: CSS.px(maxScroll) },
        } as unknown as Parameters<Element["animate"]>[1];
        const logoCurve = simplify(scrolls.map((scroll, index) => [scroll, frames[index].logoY] as const), SIMPLIFY_PX);
        scrollAnimations.push(logo.animate(logoCurve.map(([scroll, y]) => ({
          offset: scroll / maxScroll,
          transform: `translate3d(${REST_X}px, ${y.toFixed(3)}px, 0px)`,
        })), options));
        rows.forEach((row, rowIndex) => {
          const xCurve = simplify(scrolls.map((scroll, index) =>
            [scroll, frames[index].rows[rowIndex].x] as const), SIMPLIFY_PX);
          const scaleCurve = row.fitSetter
            ? simplify(scrolls.map((scroll, index) =>
              [scroll, frames[index].rows[rowIndex].fitScale] as const), SIMPLIFY_SCALE)
            : null;
          const points = scaleCurve ? mergeScrolls(xCurve, scaleCurve) : xCurve.map(([scroll]) => scroll);
          scrollAnimations.push(row.element.animate(points.map(scroll => ({
            offset: scroll / maxScroll,
            transform: `translate3d(${valueAt(xCurve, scroll).toFixed(3)}px, 0px, 0px)` +
              (scaleCurve ? ` scaleX(${valueAt(scaleCurve, scroll).toFixed(4)})` : ""),
          })), options));
        });
        const pushCurve = simplify(scrolls.map((scroll, index) => [scroll, frames[index].push] as const), SIMPLIFY_PX / 2);
        const pushKeyframes = pushCurve.map(([scroll, push]) => ({ offset: scroll / maxScroll, parts: barTransforms(push) }));
        barTransforms(0).forEach(([element], partIndex) => {
          scrollAnimations.push(element.animate(pushKeyframes.map(({ offset, parts }) => ({
            offset, transform: parts[partIndex][1],
          })), options));
        });
      };
      const update = (progress: number) => {
        const scroll = window.scrollY;
        const frame = frameAt(scroll, progress);
        const { bottom } = frame;
        if (!scrollDriven) {
          barTransforms(frame.push).forEach(([element, transform]) => { element.style.transform = transform; });
          logoY = frame.logoY;
          setLogoY(logoY);
          rows.forEach((row, index) => {
            row.fitScale = frame.rows[index].fitScale;
            row.fitSetter?.(row.fitScale);
            row.x = frame.rows[index].x;
            row.setter(row.x);
          });
        }
        logo.dataset.mobileBrandOwner = layout.portfolioBottom - scroll <= layout.navHeight
          ? "roadMap" : bottom + CONTACT_GAP >= layout.portfolioTop - scroll ? "portfolio" : "home";
      };
      ScrollTrigger.create({ trigger: page, start: () => layout.start, end: () => layout.end,
        onRefreshInit: measureLayout,
        onRefresh: self => { buildScrollAnimations(); update(self.progress); },
        onUpdate: self => update(self.progress) });
      // Valores de partida explícitos: se o ScrollTrigger refizer o tween enquanto
      // um agente arrasta a foto (translate), o GSAP não guarda esse desvio.
      gsap.fromTo(portraitRef.current, { x: 0, y: 0, scale: 1 }, { x: 0, y: -22, scale: 1.018, ease: "none",
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
      cancelScrollAnimations();
      context.revert();
      delete logo.dataset.mobileBrandOwner;
      barTransforms(0).forEach(([element]) => { element.style.removeProperty("transform"); });
    };
  }, [pageRef, eyebrowRef, titleRef, identityRef, introRef, partnersRef, partnersHeadingRef, portraitRef, prefersReducedMotion]);
}
