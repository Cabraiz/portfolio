import { useEffect, useLayoutEffect, type RefObject } from "react";

import { ensureGsapRuntime } from "@/features/scroll/gsapRuntime";

const MOTION_QUERY = "(prefers-reduced-motion: no-preference)";

/**
 * Movimento do Início no celular. O logo empurra título, identidade e
 * introdução (useMobileHomeBrandMotion) e mede a posição deles, então esses
 * textos só entram por opacidade e recorte; a foto e os botões de contato
 * ganham o idle (CSS) e a saída atrelada à rolagem (--home-exit).
 */
export default function useHomeMobileMotion(
	pageRef: RefObject<HTMLElement | null>
): void {
	// Idle só com o Início na tela.
	useEffect(() => {
		const page = pageRef.current;
		if (!page) return undefined;

		const observer = new IntersectionObserver(
			([entry]) => {
				page.dataset.motionIdle = entry?.isIntersecting ? "on" : "off";
			},
			{ threshold: 0.12 }
		);
		observer.observe(page);

		return () => {
			observer.disconnect();
			delete page.dataset.motionIdle;
		};
	}, [pageRef]);

	useLayoutEffect(() => {
		const page = pageRef.current;
		if (!page) return undefined;

		const { gsap } = ensureGsapRuntime();
		const mm = gsap.matchMedia(page);

		mm.add(MOTION_QUERY, () => {
			const q = gsap.utils.selector(page);

			// Entrada: título "digitado", linhas e identidade aparecendo em sequência.
			gsap
				.timeline({ defaults: { ease: "power2.out" }, delay: 0.1 })
				.fromTo(
					q("#mobile-home-title > span"),
					{ clipPath: "inset(0 100% 0 0)" },
					{ clipPath: "inset(0 0% 0 0)", duration: 0.7, stagger: 0.22, ease: "steps(12)", clearProps: "clipPath" },
					0
				)
				.from(
					q("[data-mobile-intro-line]"),
					{ autoAlpha: 0, duration: 0.5, stagger: 0.1, clearProps: "opacity,visibility" },
					0.35
				)
				.from(
					q('[data-home-motion="identity"] > *'),
					{ autoAlpha: 0, duration: 0.45, stagger: 0.08, clearProps: "opacity,visibility" },
					0.25
				)
				.from(
					q("[data-mobile-contact-actions] a"),
					{ autoAlpha: 0, duration: 0.5, stagger: 0.12, clearProps: "opacity,visibility" },
					0.55
				);

			// Saída: a foto sobe e esmaece e os botões descem ao rolar para o Portfólio.
			gsap.fromTo(
				page,
				{ "--home-exit": 0 },
				{
					"--home-exit": 1,
					ease: "none",
					scrollTrigger: {
						trigger: page,
						start: "top top",
						end: "bottom top",
						scrub: 0.5,
						invalidateOnRefresh: true,
					},
				}
			);

			return undefined;
		});

		return () => mm.revert();
	}, [pageRef]);
}
