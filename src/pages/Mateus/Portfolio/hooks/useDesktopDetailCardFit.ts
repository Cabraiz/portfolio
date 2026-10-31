import { useLayoutEffect, type RefObject } from "react";

// Folga entre o card e a barra, o botão do chat e os pontos laterais.
const FIT_GAP_PX = 12;
// Botão "Mensagens" do FloatingChat no desktop: 3vh acima da base, 62px de
// altura. Usar a geometria fixa mantém o card do mesmo tamanho com o chat
// aberto ou fechado.
const CHAT_BOTTOM_VIEWPORT_RATIO = 0.03;
const CHAT_TRIGGER_HEIGHT_PX = 62;
const NAVBAR_FALLBACK_BOTTOM_PX = 70;
const DOTS_FALLBACK_RIGHT_INSET_PX = 66;
const DOTS_SELECTOR = "aside[aria-label='Navegação lateral por seções']";

/**
 * No desktop o card do projeto ocupa exatamente a faixa entre a barra (em
 * cima) e o botão do chat (embaixo), encostado à esquerda dos pontos
 * laterais. O card muda de altura conforme o projeto, então a escala é
 * recalculada a cada troca de conteúdo e a cada resize.
 */
export default function useDesktopDetailCardFit(
	cardRef: RefObject<HTMLElement | null>,
	leftBoundaryRef: RefObject<HTMLElement | null>
): void {
	useLayoutEffect(() => {
		const card = cardRef.current;
		if (!card || typeof window === "undefined") return undefined;

		const desktopQuery = window.matchMedia("(min-width: 992px)");
		let frameId: number | null = null;

		const fit = () => {
			frameId = null;
			card.style.transform = "";
			card.style.transformOrigin = "";
			if (!desktopQuery.matches) return;

			// Mede sem o deslocamento das animações (entrada, flutuação e giro
			// usam translate/rotate separados): o encaixe vale para o repouso.
			card.style.translate = "none";
			card.style.rotate = "none";
			const natural = card.getBoundingClientRect();
			const releaseMotion = () => {
				card.style.translate = "";
				card.style.rotate = "";
			};
			if (natural.width === 0 || natural.height === 0) {
				releaseMotion();
				return;
			}
			// O atlas usa CSS zoom: transformações do card são em unidades dele.
			const zoom = natural.width / Math.max(1, card.offsetWidth);

			const navbarBottom =
				document.querySelector("nav.navbar")?.getBoundingClientRect().bottom ??
				NAVBAR_FALLBACK_BOTTOM_PX;
			const dotsLeft =
				document.querySelector(DOTS_SELECTOR)?.getBoundingClientRect().left ??
				window.innerWidth - DOTS_FALLBACK_RIGHT_INSET_PX;
			const chatTop =
				window.innerHeight * (1 - CHAT_BOTTOM_VIEWPORT_RATIO) -
				CHAT_TRIGGER_HEIGHT_PX;

			// A barra e o chat são fixos na tela; o card é do Portfólio. A faixa é
			// calculada para quando o Portfólio estiver alinhado no topo, seja qual
			// for a rolagem agora (o ajuste também roda com o Início na tela).
			const sectionTop =
				card.closest("[data-portfolio-root]")?.getBoundingClientRect().top ?? 0;
			const top = sectionTop + navbarBottom + FIT_GAP_PX;
			const bottom = sectionTop + chatTop - FIT_GAP_PX;
			const right = dotsLeft - FIT_GAP_PX;
			const leftLimit =
				(leftBoundaryRef.current?.getBoundingClientRect().right ?? 0) +
				FIT_GAP_PX;

			const scale = Math.min(
				(bottom - top) / natural.height,
				(right - leftLimit) / natural.width
			);
			if (!(scale > 0)) {
				releaseMotion();
				return;
			}

			const width = natural.width * scale;
			const height = natural.height * scale;
			const targetLeft = right - width;
			const targetTop = top + (bottom - top - height) / 2;

			card.style.transformOrigin = "top left";
			let translateX = (targetLeft - natural.left) / zoom;
			let translateY = (targetTop - natural.top) / zoom;
			const apply = () => {
				card.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
			};
			apply();
			// O zoom do atlas arredonda tamanhos: uma segunda medida corrige o resto.
			const placed = card.getBoundingClientRect();
			translateX += (targetLeft - placed.left) / zoom;
			translateY += (targetTop - placed.top) / zoom;
			apply();
			releaseMotion();
		};

		const schedule = () => {
			if (frameId !== null) return;
			frameId = window.requestAnimationFrame(fit);
		};

		fit();
		// A transformação não muda o tamanho observado. O card dispara quando o
		// conteúdo muda; o atlas e as colunas vizinhas, quando imagens e fontes
		// mudam a grade e empurram a coluna do card; os pontos, quando o tema
		// (claro no Portfólio) muda a largura deles.
		const observer = new ResizeObserver(schedule);
		observer.observe(card);
		const dots = document.querySelector(DOTS_SELECTOR);
		if (dots) observer.observe(dots);
		const grid = card.parentElement;
		if (grid) {
			observer.observe(grid);
			Array.from(grid.children).forEach((child) => {
				if (child !== card) observer.observe(child);
			});
		}
		window.addEventListener("resize", schedule);
		desktopQuery.addEventListener("change", schedule);
		void document.fonts?.ready.then(schedule);

		return () => {
			if (frameId !== null) window.cancelAnimationFrame(frameId);
			observer.disconnect();
			window.removeEventListener("resize", schedule);
			desktopQuery.removeEventListener("change", schedule);
			card.style.transform = "";
			card.style.transformOrigin = "";
		};
	}, [cardRef, leftBoundaryRef]);
}
