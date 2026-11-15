// Efeitos do Portfolio: geometria do card no celular, teclado e lista centralizada.
import { useEffect, useState, type Dispatch, type RefObject, type SetStateAction } from "react";

export function usePortfolioMobileGeometry(
	mobileDetailCardRef: RefObject<HTMLElement | null>,
	rootRef: RefObject<HTMLElement | null>,
	setMobileDetailCardHeight: Dispatch<SetStateAction<number>>,
	setMobileMapAreaHeight: Dispatch<SetStateAction<number>>
) {
	useEffect(() => {
		const card = mobileDetailCardRef.current;
		const root = rootRef.current;
		if (!card || !root) return undefined;

		const updateMobileGeometry = () => {
			const cardBox = card.getBoundingClientRect();
			const rootBox = root.getBoundingClientRect();
			if (cardBox.height > 0) {
				setMobileDetailCardHeight(Math.round(cardBox.height * 100) / 100);
			}
			if (cardBox.top > rootBox.top) {
				setMobileMapAreaHeight(
					Math.round((cardBox.top - rootBox.top) * 100) / 100
				);
			}
		};

		updateMobileGeometry();
		const observer = new ResizeObserver(updateMobileGeometry);
		observer.observe(card);
		observer.observe(root);

		return () => observer.disconnect();
	}, []);
}

export function usePortfolioKeyboardNavigation(
	isPortfolioActive: boolean,
	goToPrevious: () => void,
	goToNext: () => void,
	setIsAutoplayPaused: Dispatch<SetStateAction<boolean>>
) {
	useEffect(() => {
		function handleKeyDown(event: KeyboardEvent) {
			if (!isPortfolioActive) return;
			// Com o print ampliado aberto, as setas não trocam de projeto.
			if (document.querySelector("[data-project-lightbox]")) return;

			const target = event.target;
			if (
				target instanceof HTMLElement &&
				(target.matches("input, textarea, select") || target.isContentEditable)
			) {
				return;
			}

			if (event.key === "ArrowLeft") {
				event.preventDefault();
				setIsAutoplayPaused(true);
				goToPrevious();
			}

			if (event.key === "ArrowRight") {
				event.preventDefault();
				setIsAutoplayPaused(true);
				goToNext();
			}
		}

		globalThis.addEventListener("keydown", handleKeyDown);
		return () => globalThis.removeEventListener("keydown", handleKeyDown);
	}, [goToNext, goToPrevious, isPortfolioActive]);
}

export function useMobileProjectListCentering(
	mobileProjectListRef: RefObject<HTMLDivElement | null>,
	projectListRef: RefObject<HTMLDivElement | null>,
	activeIndex: number
) {
	useEffect(() => {
		const projectList = mobileProjectListRef.current ?? projectListRef.current;
                if (!projectList || globalThis.innerWidth >= 992) return;

		const activeButton = projectList.querySelector<HTMLElement>(
                        '[data-mobile-project-id][aria-pressed="true"]'
		);
		if (!activeButton) return;

		const nextScrollLeft = Math.max(
			0,
                        projectList.scrollLeft + activeButton.getBoundingClientRect().left - projectList.getBoundingClientRect().left -
				(projectList.clientWidth - activeButton.offsetWidth) / 2
		);

		projectList.scrollTo({
			left: nextScrollLeft,
			behavior: globalThis.matchMedia("(prefers-reduced-motion: reduce)")
				.matches
				? "auto"
				: "smooth",
		});
	}, [activeIndex]);
}

/**
 * Voo de chegada ao Portfólio. O avião e a câmera do mapa esperam em Fortaleza
 * (`home`) até pelo menos metade da seção aparecer na tela (seção mais alta
 * que a tela conta pela altura da tela); aí os dois saem juntos para o destino,
 * e quem chega vê a decolagem. Antes o voo acontecia no carregamento da página
 * e a câmera já abria no destino: no celular, com o mapa ampliado, Fortaleza
 * nem aparecia.
 * Quando a seção sai inteira da tela, os dois voltam para Fortaleza sem
 * ninguém ver, prontos para a próxima entrada. `entries` conta as entradas e
 * serve de chave para reiniciar o voo.
 */
export function usePortfolioArrivalFlight(rootRef: RefObject<HTMLElement | null>) {
	const [flight, setFlight] = useState({ entries: 0, home: true });
	useEffect(() => {
		const root = rootRef.current;
		if (!root) return undefined;
		let visible = false;
		const observer = new IntersectionObserver(
			([entry]) => {
				const full = Math.min(entry.boundingClientRect.height, entry.rootBounds?.height ?? globalThis.innerHeight);
				const next = full > 0 && entry.intersectionRect.height / full >= 0.5;
				if (next && !visible) setFlight(({ entries }) => ({ entries: entries + 1, home: false }));
				else if (!entry.isIntersecting) setFlight((current) => (current.home ? current : { ...current, home: true }));
				visible = next;
			},
			// A tela encolhida em 1 px: com a borda da seção encostada na da tela (o
			// Início inteiro à vista), o navegador ainda a conta como na tela.
			{ rootMargin: "-1px 0px", threshold: [0, ...Array.from({ length: 20 }, (_, step) => (step + 1) / 20)] }
		);
		observer.observe(root);
		return () => observer.disconnect();
	}, [rootRef]);
	return flight;
}
