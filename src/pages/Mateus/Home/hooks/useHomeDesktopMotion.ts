import { useLayoutEffect, type RefObject } from "react";

import { ensureGsapRuntime } from "@/features/scroll/gsapRuntime";

const MOTION_QUERY = "(prefers-reduced-motion: no-preference)";

/**
 * Movimento do Início no desktop com os próprios elementos da tela
 * (marcados com data-home-motion):
 * - entrada: a foto de fundo abre num zoom-out e título, selos e ações sobem
 *   em sequência;
 * - idle: foto com zoom lento, selos ganhando cor um a um e a frase
 *   editorial respirando;
 * - profundidade com o mouse (foto e linhas da frase deslocam);
 * - saída em camadas atrelada à rolagem para o Portfólio.
 * Tudo para quando o Início sai da tela e nada roda com menos movimento.
 */
export default function useHomeDesktopMotion(
	containerRef: RefObject<HTMLElement | null>
): void {
	useLayoutEffect(() => {
		const container = containerRef.current;
		if (!container) return undefined;

		const { gsap } = ensureGsapRuntime();
		const mm = gsap.matchMedia(container);

		mm.add(MOTION_QUERY, (context) => {
			const q = gsap.utils.selector(container);
			const all = (name: string) => q(`[data-home-motion="${name}"]`);
			const one = (name: string) => all(name)[0] as HTMLElement | undefined;

			const photoFrame = one("photo-frame");
			const phraseLines = all("phrase-line");
			const seals = all("seal");
			const sealImages = seals
				.map((seal) => seal.querySelector("img"))
				.filter((image): image is HTMLImageElement => image !== null);

			// Entrada: a foto de fundo abre num zoom-out e o conteúdo sobe em sequência.
			// O fim de cada entrada é explícito: visível e no lugar.
			const shown = { x: 0, y: 0, autoAlpha: 1 };
			gsap
				.timeline({
					defaults: { ease: "power3.out" },
					delay: 0.15,
					// A saída com a rolagem só nasce depois da entrada (ver createExit).
					onComplete: () => context.add(() => createExit()),
				})
				.fromTo(
					photoFrame ?? [],
					{ scale: 1.14, transformOrigin: "62% 40%" },
					{ scale: 1.04, duration: 1.8, ease: "expo.out" },
					0
				)
				.fromTo(all("eyebrow"), { y: 24, autoAlpha: 0 }, { ...shown, duration: 0.6 }, 0.1)
				.fromTo(all("role"), { y: 30, autoAlpha: 0 }, { ...shown, duration: 0.7 }, 0.18)
				.fromTo(seals, { y: 18, autoAlpha: 0 }, { ...shown, stagger: 0.08, duration: 0.5 }, 0.35)
				.fromTo(all("actions"), { y: 26, autoAlpha: 0 }, { ...shown, duration: 0.6 }, 0.45)
				.fromTo(phraseLines, { x: -22, autoAlpha: 0 }, { ...shown, stagger: 0.12, duration: 0.7 }, 0.4);

			// Idle: só enquanto o Início está na tela.
			const idle = gsap.timeline({ paused: true });
			if (photoFrame) {
				// Zoom lento (Ken Burns) depois da entrada.
				idle.to(
					photoFrame,
					{ scale: 1.09, rotation: 0.4, duration: 9, ease: "sine.inOut", yoyo: true, repeat: -1 },
					1.9
				);
			}
			phraseLines.forEach((line, index) => {
				idle.to(
					line,
					{ y: index % 2 ? 3 : -3, duration: 3.2 + index * 0.7, ease: "sine.inOut", yoyo: true, repeat: -1 },
					0
				);
			});
			if (sealImages.length > 0) {
				// Os selos (cinza) ganham cor um de cada vez, em ciclo.
				const sealCycle = gsap.timeline({ repeat: -1, repeatDelay: 1.4 });
				sealImages.forEach((image) => {
					sealCycle
						.to(image, { filter: "grayscale(0%)", opacity: 1, duration: 0.5, ease: "sine.out" })
						.to(image, { filter: "grayscale(100%)", opacity: 0.8, duration: 0.7, ease: "sine.in" }, "+=0.6");
				});
				idle.add(sealCycle, 1.2);
			}

			const visibility = new IntersectionObserver(
				([entry]) => {
					if (entry?.isIntersecting) idle.play();
					else idle.pause();
				},
				// Encostar na borda da tela não conta como visível (interseção de área
				// zero): sem a margem o idle seguia rodando com o Portfólio na tela.
				{ rootMargin: "-1px 0px -1px 0px" }
			);
			visibility.observe(container);

			// Profundidade com o mouse: a foto se desloca ao contrário do cursor e
			// as linhas da frase em velocidades diferentes.
			const listeners = new AbortController();
			if (photoFrame) {
				const photoX = gsap.quickTo(photoFrame, "x", { duration: 1, ease: "power3.out" });
				const photoY = gsap.quickTo(photoFrame, "y", { duration: 1, ease: "power3.out" });
				const phraseShifts = phraseLines.map((line) =>
					gsap.quickTo(line, "x", { duration: 1.1, ease: "power3.out" })
				);

				container.addEventListener(
					"pointermove",
					(event) => {
						const x = event.clientX / window.innerWidth - 0.5;
						const y = event.clientY / window.innerHeight - 0.5;
						photoX(-x * 18);
						photoY(-y * 12);
						phraseShifts.forEach((shift, index) => shift(x * (8 + index * 5)));
					},
					{ signal: listeners.signal }
				);
				container.addEventListener(
					"pointerleave",
					() => {
						photoX(0);
						photoY(0);
						phraseShifts.forEach((shift) => shift(0));
					},
					{ signal: listeners.signal }
				);
			}

			// Saída em camadas ao rolar para o Portfólio (os elementos do fundo e o
			// trilho de conteúdo já têm a própria saída em HomeDesktop).
			// O ScrollTrigger guarda o estado "original" das peças na primeira vez que
			// roda e o restaura a cada recálculo da rolagem. Criada junto com a
			// entrada, com a página aberta já rolada (ex.: /portfolio), ele guardava
			// selos e botões invisíveis e, ao voltar ao Início, eles sumiam. Por isso
			// ela só é criada quando a entrada termina e tudo está visível.
			const createExit = () =>
				gsap
				.timeline({
					defaults: { ease: "none" },
					scrollTrigger: {
						trigger: container,
						start: "top top",
						end: "bottom top",
						scrub: 0.55,
						invalidateOnRefresh: true,
					},
				})
				// Ponto de partida explícito: no topo, tudo visível e no lugar.
				.fromTo(all("eyebrow"), { x: 0, autoAlpha: 1 }, { x: -36, autoAlpha: 0.2, duration: 1, immediateRender: false }, 0)
				.fromTo(all("role"), { x: 0 }, { x: -22, duration: 1, immediateRender: false }, 0)
				.fromTo(seals, { y: 0, autoAlpha: 1 }, { y: 24, autoAlpha: 0.15, stagger: 0.06, duration: 0.7, immediateRender: false }, 0.05)
				.fromTo(all("actions"), { y: 0, autoAlpha: 1 }, { y: 28, autoAlpha: 0.3, duration: 0.8, immediateRender: false }, 0.1);

			return () => {
				visibility.disconnect();
				listeners.abort();
			};
		});

		return () => mm.revert();
	}, [containerRef]);
}
