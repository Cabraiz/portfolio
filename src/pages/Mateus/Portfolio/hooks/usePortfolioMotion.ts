import type gsapLib from "gsap";
import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";

import {
	ensureGsapRuntime,
	scheduleScrollRuntimeRefresh,
} from "@/features/scroll/gsapRuntime";

import styles from "../Portfolio.module.css";

const DESKTOP_QUERY = "(min-width: 992px)";
const MOBILE_QUERY = "(max-width: 991px)";
const MOTION_QUERY = "(prefers-reduced-motion: no-preference)";

type TweenVars = Record<string, string | number>;

/**
 * Cascata atrelada à rolagem: uma animação por item, para que todos já
 * comecem no estado inicial (numa animação única com stagger o GSAP só
 * aplica o estado inicial no primeiro item até a rolagem chegar aos outros).
 */
function addScrubCascade(
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

const TWEEN_CONTROL_KEYS = new Set([
	"duration",
	"delay",
	"ease",
	"stagger",
	"immediateRender",
	"overwrite",
	"onComplete",
]);

/** Propriedades CSS inline que cada animação deixou, para limpar só elas. */
function inlinePropsOf(vars: Record<string, unknown>): string[] {
	return Object.keys(vars)
		.filter((key) => !TWEEN_CONTROL_KEYS.has(key))
		.flatMap((key) => {
			if (["x", "y", "scale", "rotation", "rotationX", "rotationY"].includes(key)) {
				return ["transform"];
			}
			if (key === "autoAlpha") return ["opacity", "visibility"];
			return [key];
		});
}

function prefersMotion(): boolean {
	return (
		typeof window !== "undefined" && window.matchMedia(MOTION_QUERY).matches
	);
}

/**
 * Movimento do Portfólio com os próprios elementos da seção:
 * - idle (CSS, ver Portfolio.module.css) ligado só com a seção visível;
 * - entrada atrelada à rolagem (ScrollTrigger com scrub, sincronizado ao Lenis);
 * - card flutuando e inclinando com o mouse no desktop;
 * - troca de projeto com card girando, imagem em cortina e textos digitados.
 */
export default function usePortfolioMotion(
	rootRef: RefObject<HTMLElement | null>,
	activeProjectId: string
): void {
	const isFirstProjectRef = useRef(true);

	// Idle só com a seção na tela: fora dela nada fica animando à toa.
	useEffect(() => {
		const root = rootRef.current;
		if (!root) return undefined;

		const observer = new IntersectionObserver(
			([entry]) => {
				root.dataset.motionIdle = entry?.isIntersecting ? "on" : "off";
			},
			{ threshold: 0.12 }
		);
		observer.observe(root);

		return () => {
			observer.disconnect();
			delete root.dataset.motionIdle;
		};
	}, [rootRef]);

	useLayoutEffect(() => {
		const root = rootRef.current;
		if (!root) return undefined;

		const { gsap } = ensureGsapRuntime();
		const mm = gsap.matchMedia(root);

		mm.add(
			{ desktop: DESKTOP_QUERY, mobile: MOBILE_QUERY, motion: MOTION_QUERY },
			(context) => {
				const { desktop, motion } = context.conditions ?? {};
				if (!motion) return undefined;

				const q = gsap.utils.selector(root);

				if (!desktop) {
					// Celular: a lista de projetos entra deslizando e os controles do
					// mapa aparecem conforme a seção sobe.
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
						q(`.${styles.mobileProjectButton}`),
						{ x: 56, autoAlpha: 0 },
						{ x: 0, autoAlpha: 1, duration: 0.5 },
						0,
						0.06
					);
					mobileEntrance
						.fromTo(
							q(`.${styles.mobileMapControls}`),
							{ autoAlpha: 0, y: 14 },
							{ autoAlpha: 1, y: 0, duration: 0.5 },
							0.1
						);
					return undefined;
				}

				const card = q(`.${styles.detailCard}`)[0] as HTMLElement | undefined;
				const preview = q(`.${styles.projectPreview}`)[0] as HTMLElement | undefined;
				if (!card || !preview) return undefined;

				// Entrada: acompanha a rolagem do Início para o Portfólio (os 4 tiques).
				const entrance = gsap.timeline({
					defaults: { ease: "none" },
					scrollTrigger: {
						trigger: root,
						start: "top bottom",
						end: "top top",
						scrub: 0.6,
						invalidateOnRefresh: true,
					},
				});
				addScrubCascade(
					entrance,
					q(`.${styles.projectButton}`),
					{ "--enter-x": "-150px", "--enter-o": 0 },
					{ "--enter-x": "0px", "--enter-o": 1, duration: 0.5 },
					0,
					0.07
				);
				entrance.fromTo(
					card,
					{ "--card-enter-y": "150px", "--card-enter-o": 0, "--card-turn": "-24deg" },
					{ "--card-enter-y": "0px", "--card-enter-o": 1, "--card-turn": "0deg", duration: 0.85 },
					0.15
				);
				addScrubCascade(
					entrance,
					q(`.${styles.mapPoint}`),
					{ "--enter-o": 0 },
					{ "--enter-o": 1, duration: 0.3 },
					0.3,
					0.05
				);
				addScrubCascade(
					entrance,
					q(`.${styles.routeLine}`),
					{ "--enter-o": 0 },
					{ "--enter-o": 1, duration: 0.3 },
					0.35,
					0.04
				);
				addScrubCascade(
					entrance,
					q(`.${styles.atlasPager} button`),
					{ "--enter-s": 0.3, "--enter-o": 0 },
					{ "--enter-s": 1, "--enter-o": 1, duration: 0.3 },
					0.6,
					0.1
				);

				// Card flutuando devagar em volta do repouso (±3px reais, dentro da
				// folga de 12px até a barra e o chat); só com a seção visível.
				const float = gsap.fromTo(
					card,
					{ "--card-float-y": "3px" },
					{
						"--card-float-y": "-3px",
						duration: 3.4,
						ease: "sine.inOut",
						yoyo: true,
						repeat: -1,
					}
				);
				const idleObserver = new IntersectionObserver(([entry]) => {
					if (entry?.isIntersecting) float.play();
					else float.pause();
				});
				idleObserver.observe(root);

				// A imagem do projeto inclina em 3D seguindo o mouse sobre o card.
				gsap.set(preview, { transformPerspective: 900 });
				const tiltX = gsap.quickTo(preview, "rotationX", {
					duration: 0.7,
					ease: "power3.out",
				});
				const tiltY = gsap.quickTo(preview, "rotationY", {
					duration: 0.7,
					ease: "power3.out",
				});
				const handlePointerMove = (event: PointerEvent) => {
					const bounds = card.getBoundingClientRect();
					const x = (event.clientX - bounds.left) / bounds.width - 0.5;
					const y = (event.clientY - bounds.top) / bounds.height - 0.5;
					tiltX(-y * 8);
					tiltY(x * 10);
				};
				const handlePointerLeave = () => {
					tiltX(0);
					tiltY(0);
				};
				const listeners = new AbortController();
				card.addEventListener("pointermove", handlePointerMove, {
					signal: listeners.signal,
				});
				card.addEventListener("pointerleave", handlePointerLeave, {
					signal: listeners.signal,
				});

				// As seções da landing montam aos poucos: recalcula o início e o fim
				// da entrada quando a altura delas muda.
				const landing = root.closest("main") ?? document.body;
				const layoutObserver = new ResizeObserver(() => {
					scheduleScrollRuntimeRefresh();
				});
				layoutObserver.observe(landing);
				scheduleScrollRuntimeRefresh();

				return () => {
					idleObserver.disconnect();
					layoutObserver.disconnect();
					listeners.abort();
				};
			}
		);

		return () => mm.revert();
	}, [rootRef]);

	// Troca de projeto: card gira entrando, imagem em cortina, textos digitados.
	useEffect(() => {
		if (isFirstProjectRef.current) {
			isFirstProjectRef.current = false;
			return undefined;
		}

		const root = rootRef.current;
		if (!root || !prefersMotion()) return undefined;

		const { gsap } = ensureGsapRuntime();
		const desktop = window.matchMedia(DESKTOP_QUERY).matches;
		const q = gsap.utils.selector(root);
		const typing = { clipPath: "inset(0 100% 0 0)" };
		const typed = { clipPath: "inset(0 0% 0 0)" };

		const ctx = gsap.context(() => {
			const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });

			if (desktop) {
				timeline
					.fromTo(
						q(`.${styles.detailCard}`),
						{ "--card-turn": "-28deg" },
						{ "--card-turn": "0deg", duration: 1 },
						0
					)
					.fromTo(
						q(`.${styles.projectPreview}`),
						{ clipPath: "inset(0 0 0 100% round 14px 14px 0 0)" },
						{
							clipPath: "inset(0 0 0 0% round 14px 14px 0 0)",
							duration: 0.9,
							ease: "expo.out",
						},
						0.05
					)
					.fromTo(
						q(`.${styles.locationHeader} > *`),
						typing,
						{ ...typed, duration: 0.6, stagger: 0.14, ease: "steps(14)" },
						0.1
					)
					.fromTo(
						q(`.${styles.detailTitleCopy} h2`),
						typing,
						{ ...typed, duration: 0.6, ease: "steps(16)" },
						0.3
					)
					.fromTo(
						q(`.${styles.detailTitleCopy} p`),
						{ y: 12, autoAlpha: 0 },
						{ y: 0, autoAlpha: 1, duration: 0.6 },
						0.45
					)
					.fromTo(
						q(`.${styles.detailTitleRow} > img`),
						{ scale: 0.55, rotation: -14, autoAlpha: 0 },
						{ scale: 1, rotation: 0, autoAlpha: 1, duration: 0.75, ease: "back.out(2.2)" },
						0.35
					)
					.fromTo(
						q(`.${styles.detailMeta} span`),
						{ x: -12, autoAlpha: 0 },
						{ x: 0, autoAlpha: 1, stagger: 0.08, duration: 0.45 },
						0.55
					)
					.fromTo(
						q(`.${styles.technologyList} span`),
						{ y: 10, scale: 0.7, autoAlpha: 0 },
						{ y: 0, scale: 1, autoAlpha: 1, stagger: 0.07, duration: 0.5, ease: "back.out(2.4)" },
						0.6
					);
			} else {
				timeline
					.fromTo(
						q(`.${styles.mobileFeatureCopy} h2`),
						typing,
						{ ...typed, duration: 0.55, ease: "steps(14)" },
						0
					)
					.fromTo(
						q(`.${styles.mobileFeatureCopy} p`),
						{ y: 10, autoAlpha: 0 },
						{ y: 0, autoAlpha: 1, duration: 0.5 },
						0.2
					)
					.fromTo(
						q(`.${styles.mobileProjectPreview}`),
						{ clipPath: "inset(0 0 0 100%)" },
						{ clipPath: "inset(0 0 0 0%)", duration: 0.8, ease: "expo.out" },
						0.05
					)
					.fromTo(
						q(`.${styles.mobileTechnologies} > *`),
						{ y: 8, autoAlpha: 0 },
						{ y: 0, autoAlpha: 1, stagger: 0.06, duration: 0.4, ease: "back.out(2)" },
						0.3
					);
			}

			// Ao terminar, cada elemento perde só o que esta animação pôs nele
			// (o card mantém a transformação do encaixe; a imagem, a inclinação).
			timeline.eventCallback("onComplete", () => {
				timeline.getChildren(true, true, false).forEach((tween) => {
					const props = inlinePropsOf(tween.vars as Record<string, unknown>);
					if (props.length > 0) {
						gsap.set(tween.targets(), { clearProps: [...new Set(props)].join(",") });
					}
				});
			});
		}, root);

		return () => ctx.revert();
	}, [activeProjectId, rootRef]);
}
