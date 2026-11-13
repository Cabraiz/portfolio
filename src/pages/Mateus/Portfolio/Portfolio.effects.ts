// Efeitos do Portfolio: geometria do card no celular, teclado e lista centralizada.
import { useEffect, type Dispatch, type RefObject, type SetStateAction } from "react";

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
