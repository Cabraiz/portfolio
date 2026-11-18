import type gsapLib from "gsap";

import styles from "../Portfolio.module.css";

type TweenVars = Record<string, string | number>;
type Selector = (selector: string) => Element[];

/**
 * Cascata atrelada à rolagem: uma animação por item, para que todos já
 * comecem no estado inicial (numa animação única com stagger o GSAP só
 * aplica o estado inicial no primeiro item até a rolagem chegar aos outros).
 */
export function addScrubCascade(
	timeline: ReturnType<typeof gsapLib.timeline>,
	targets: Element[],
	from: TweenVars,
	to: TweenVars,
	start: number,
	each: number
): void {
	targets.forEach((target, index) => {
		timeline.fromTo(target, { ...from }, { ...to }, start + index * each);
	});
}

/** Scroll-driven Animations com ViewTimeline e faixa em vh (Chrome 115+, Safari 26+). */
function supportsViewTimeline(): boolean {
	return (
		typeof window !== "undefined" &&
		"ViewTimeline" in window &&
		typeof CSS !== "undefined" &&
		CSS.supports("animation-range", "cover 10vh cover 20vh")
	);
}

/**
 * Celular: a lista de projetos entra deslizando e os controles do mapa
 * aparecem conforme a seção sobe. Devolve a limpeza, se houver.
 */
export function startMobilePortfolioEntrance(
	gsap: typeof gsapLib,
	root: HTMLElement,
	q: Selector
): (() => void) | undefined {
	const buttons = q(`.${styles.mobileProjectButton}`) as HTMLElement[];
	const controls = q(`.${styles.mobileMapControls}`) as HTMLElement[];

	if (supportsViewTimeline()) {
		// Ligada à rolagem pelo navegador (compositor): o scrub do GSAP
		// escrevia o estilo de cada botão a cada quadro da rolagem.
		const timeline = new ViewTimeline({ subject: root, axis: "block" });
		// Mesma faixa do ScrollTrigger: do topo da seção na base da tela
		// ("top bottom") até ele a 25% do topo ("top 25%"), ou seja 75vh.
		const total = Math.max(0.5 + 0.06 * Math.max(0, buttons.length - 1), 0.6);
		const animate = (element: HTMLElement, from: number, offset: string) =>
			element.animate(
				[
					{ transform: offset, opacity: 0 },
					{ transform: "none", opacity: 1 },
				],
				{
					timeline,
					fill: "both",
					easing: "linear",
					rangeStart: `cover ${((75 * from) / total).toFixed(3)}vh`,
					rangeEnd: `cover ${((75 * (from + 0.5)) / total).toFixed(3)}vh`,
				} as unknown as KeyframeAnimationOptions
			);
		const animations = [
			...buttons.map((button, index) =>
				animate(button, index * 0.06, "translate3d(56px, 0, 0)")
			),
			...controls.map((element) => animate(element, 0.1, "translate3d(0, 14px, 0)")),
		];
		return () => animations.forEach((animation) => animation.cancel());
	}

	const mobileEntrance = gsap.timeline({
		defaults: { ease: "none" },
		scrollTrigger: {
			trigger: root,
			start: "top bottom",
			end: "top 25%",
			scrub: 0.5,
			invalidateOnRefresh: true,
		},
	});
	addScrubCascade(
		mobileEntrance,
		buttons,
		{ x: 56, autoAlpha: 0 },
		{ x: 0, autoAlpha: 1, duration: 0.5 },
		0,
		0.06
	);
	mobileEntrance.fromTo(
		controls,
		{ autoAlpha: 0, y: 14 },
		{ autoAlpha: 1, y: 0, duration: 0.5 },
		0.1
	);
	return undefined;
}
