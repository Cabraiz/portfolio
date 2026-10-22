import { useLenis } from "lenis/react";
import { useEffect, useRef } from "react";

import type { LandingSectionId } from "../../../../features/navigation/landingSections";
import type { LandingSectionNavigationNavigateOptions } from "../../../../features/navigation/useLandingSectionNavigation";

/**
 * Paginação por seção no desktop com resistência: são precisos
 * TICKS_PER_SECTION tiques da roda para trocar de tela.
 *
 * - Cada tique empurra a página 1/TICKS_PER_SECTION do caminho até a seção
 *   vizinha; ao completar, a página termina a passagem e para nela.
 * - Se a roda parar antes, a página volta para a seção de onde saiu: nunca
 *   fica parada entre duas telas.
 * - Enquanto qualquer navegação anima (troca de seção, menu), a roda espera.
 * - Depois de uma troca, o resto do mesmo giro (sem pausa de
 *   NEW_GESTURE_GAP_MS) e a inércia do trackpad são ignorados.
 * - Teclas de rolagem trocam de seção direto.
 * - Áreas com rolagem própria (chat, lista do portfólio, painéis) continuam
 *   rolando normalmente enquanto tiverem para onde rolar.
 */

export const DESKTOP_SECTION_PAGING_DURATION_SECONDS = 0.75;

const TICKS_PER_SECTION = 4;
// Um tique de mouse comum (Chrome/Windows) rola 100px.
const TICK_DELTA_PX = 100;
const NUDGE_DURATION_SECONDS = 0.3;
const SNAP_BACK_DELAY_MS = 650;
const SNAP_BACK_DURATION_SECONDS = 0.45;
// Depois de uma troca, a roda precisa ficar parada este tempo para voltar a
// contar tiques: um giro contínuo (de qualquer duração) troca uma tela só.
const NEW_GESTURE_GAP_MS = 200;

const NATIVE_WHEEL_SELECTOR =
	"[data-lenis-prevent], [data-lenis-prevent-wheel], [data-chat-panel], [role='dialog']";
const TEXT_ENTRY_SELECTOR =
	"input, textarea, select, [contenteditable=''], [contenteditable='true']";
const SPACE_ACTIVATED_SELECTOR = "button, a[href], summary, [role='button']";

type Direction = 1 | -1;

type UseDesktopSectionPagingParams = Readonly<{
	containerRef: Readonly<{ current: HTMLElement | null }>;
	navigateToSection: (
		_sectionId: LandingSectionId,
		_options?: LandingSectionNavigationNavigateOptions
	) => void;
}>;

function normalizeWheelDelta(event: WheelEvent): number {
	// Firefox manda tiques em linhas (3 por tique): vale o mesmo que 100px.
	if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
		return (event.deltaY * TICK_DELTA_PX) / 3;
	}
	if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
		return event.deltaY * window.innerHeight;
	}
	return event.deltaY;
}

function easeOutCubic(value: number): number {
	return 1 - (1 - value) ** 3;
}

function canScrollInside(
	target: EventTarget | null,
	boundary: HTMLElement,
	direction: Direction
): boolean {
	for (
		let element = target instanceof Element ? target : null;
		element &&
		element !== boundary &&
		element !== document.body &&
		element !== document.documentElement;
		element = element.parentElement
	) {
		const style = getComputedStyle(element);
		const scrollable =
			/(auto|scroll|overlay)/.test(style.overflowY) &&
			element.scrollHeight > element.clientHeight + 1;

		if (!scrollable) continue;

		const canMove =
			direction > 0
				? element.scrollTop + element.clientHeight < element.scrollHeight - 1
				: element.scrollTop > 0;

		if (canMove) return true;
	}

	return false;
}

// Qualquer navegação em curso (troca de seção, menu, chat) mantém o alvo
// pendente até a animação terminar: enquanto isso a roda não conta tiques.
function isNavigationAnimating(): boolean {
	return document.documentElement.hasAttribute("data-landing-scroll-target");
}

function resolveTargetSection(
	sections: readonly HTMLElement[],
	direction: Direction
): HTMLElement | null {
	// Funciona também fora do alinhamento (ex.: depois de arrastar a barra de
	// rolagem ou no meio de um empurrão): desce para a primeira seção abaixo
	// do topo, sobe para a última acima dele.
	if (direction > 0) {
		return (
			sections.find((section) => section.getBoundingClientRect().top > 2) ??
			null
		);
	}

	return (
		[...sections]
			.reverse()
			.find((section) => section.getBoundingClientRect().top < -2) ?? null
	);
}

export default function useDesktopSectionPaging({
	containerRef,
	navigateToSection,
}: UseDesktopSectionPagingParams): void {
	const lenis = useLenis();
	const navigateRef = useRef(navigateToSection);
	const lenisRef = useRef(lenis);

	useEffect(() => {
		navigateRef.current = navigateToSection;
		lenisRef.current = lenis;
	}, [navigateToSection, lenis]);

	useEffect(() => {
		const container = containerRef.current;

		if (!container || typeof window === "undefined") {
			return undefined;
		}

		let lastWheelAt = Number.NEGATIVE_INFINITY;
		let lastWheelDelta = 0;
		let gestureConsumed = false;
		// Seção de onde o empurrão saiu e quanto (em px de roda) já acumulou.
		let anchorIndex: number | null = null;
		let accumulatedDelta = 0;
		let snapBackTimerId: number | undefined;

		const getSections = () =>
			Array.from(
				container.querySelectorAll<HTMLElement>(
					":scope > section[data-page-section='true']"
				)
			);

		const resetPush = () => {
			window.clearTimeout(snapBackTimerId);
			snapBackTimerId = undefined;
			anchorIndex = null;
			accumulatedDelta = 0;
		};

		const navigateTo = (section: HTMLElement, duration: number) => {
			navigateRef.current(section.id as LandingSectionId, {
				replace: true,
				syncUrl: true,
				offsetPx: 0,
				duration,
			});
		};

		const page = (direction: Direction): void => {
			resetPush();
			gestureConsumed = true;

			const target = resolveTargetSection(getSections(), direction);
			if (target) navigateTo(target, DESKTOP_SECTION_PAGING_DURATION_SECONDS);
		};

		const snapBack = () => {
			snapBackTimerId = undefined;
			const sections = getSections();
			const anchor = anchorIndex === null ? null : sections[anchorIndex];

			resetPush();

			if (anchor && !isNavigationAnimating()) {
				navigateTo(anchor, SNAP_BACK_DURATION_SECONDS);
			}
		};

		const push = (delta: number): void => {
			const sections = getSections();

			if (anchorIndex === null) {
				const alignedIndex = sections.findIndex(
					(section) => Math.abs(section.getBoundingClientRect().top) <= 2
				);

				// Fora do alinhamento (barra de rolagem): vai direto para a seção.
				if (alignedIndex < 0) {
					page(delta > 0 ? 1 : -1);
					return;
				}

				anchorIndex = alignedIndex;
			}

			accumulatedDelta += delta;

			// Não há para onde empurrar além da primeira/última seção.
			if (
				(anchorIndex === 0 && accumulatedDelta < 0) ||
				(anchorIndex === sections.length - 1 && accumulatedDelta > 0)
			) {
				accumulatedDelta = 0;
			}

			const progress =
				accumulatedDelta / (TICKS_PER_SECTION * TICK_DELTA_PX);

			if (Math.abs(progress) >= 1) {
				const target = sections[anchorIndex + Math.sign(progress)];
				resetPush();
				gestureConsumed = true;
				if (target) navigateTo(target, DESKTOP_SECTION_PAGING_DURATION_SECONDS);
				return;
			}

			const anchor = sections[anchorIndex];
			const anchorTop = window.scrollY + anchor.getBoundingClientRect().top;
			const nudgeTop = anchorTop + progress * window.innerHeight;
			const activeLenis = lenisRef.current;

			if (activeLenis) {
				activeLenis.scrollTo(nudgeTop, {
					duration: NUDGE_DURATION_SECONDS,
					easing: easeOutCubic,
					force: true,
				});
			} else {
				window.scrollTo({ top: nudgeTop, behavior: "auto" });
			}

			window.clearTimeout(snapBackTimerId);
			snapBackTimerId = window.setTimeout(snapBack, SNAP_BACK_DELAY_MS);
		};

		const handleWheel = (event: WheelEvent): void => {
			if (event.ctrlKey || event.defaultPrevented) return;
			if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;

			const delta = normalizeWheelDelta(event);
			if (delta === 0) return;

			const direction: Direction = delta > 0 ? 1 : -1;
			const target = event.target instanceof Element ? event.target : null;

			if (target?.closest(NATIVE_WHEEL_SELECTOR)) return;
			if (canScrollInside(target, container, direction)) return;

			event.preventDefault();

			const now = performance.now();
			const gap = now - lastWheelAt;
			const sameDirection = Math.sign(lastWheelDelta) === direction;
			const accelerating =
				sameDirection && Math.abs(delta) > Math.abs(lastWheelDelta) * 1.5 + 4;

			lastWheelAt = now;
			lastWheelDelta = delta;

			if (gap >= NEW_GESTURE_GAP_MS || !sameDirection) {
				gestureConsumed = false;
			}

			if (isNavigationAnimating()) return;
			if (gestureConsumed && !accelerating) return;

			push(delta);
		};

		const handleKeyDown = (event: KeyboardEvent): void => {
			if (
				event.defaultPrevented ||
				event.altKey ||
				event.ctrlKey ||
				event.metaKey
			) {
				return;
			}

			const target = event.target instanceof Element ? event.target : null;
			if (target?.closest(TEXT_ENTRY_SELECTOR)) return;
			if (target?.closest(NATIVE_WHEEL_SELECTOR)) return;

			let direction: Direction;

			switch (event.key) {
				case "ArrowDown":
				case "PageDown":
					direction = 1;
					break;
				case "ArrowUp":
				case "PageUp":
					direction = -1;
					break;
				case " ":
					if (target?.closest(SPACE_ACTIVATED_SELECTOR)) return;
					direction = event.shiftKey ? -1 : 1;
					break;
				default:
					return;
			}

			event.preventDefault();

			if (isNavigationAnimating() || event.repeat) return;

			page(direction);
		};

		// Um clique (menu, chat) assume a posição: o empurrão em curso acaba.
		const handlePointerDown = (): void => {
			resetPush();
		};

		window.addEventListener("wheel", handleWheel, {
			capture: true,
			passive: false,
		});
		window.addEventListener("keydown", handleKeyDown);
		window.addEventListener("pointerdown", handlePointerDown, {
			capture: true,
			passive: true,
		});

		return () => {
			resetPush();
			window.removeEventListener("wheel", handleWheel, true);
			window.removeEventListener("keydown", handleKeyDown);
			window.removeEventListener("pointerdown", handlePointerDown, true);
		};
	}, [containerRef]);
}
