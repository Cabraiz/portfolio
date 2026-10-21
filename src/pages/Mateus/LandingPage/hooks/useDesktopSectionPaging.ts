import { useEffect, useRef } from "react";

import type { LandingSectionId } from "../../../../features/navigation/landingSections";
import type { LandingSectionNavigationNavigateOptions } from "../../../../features/navigation/useLandingSectionNavigation";

/**
 * Paginação por seção no desktop: cada tique da roda (ou tecla de rolagem)
 * leva exatamente à tela seguinte/anterior e para nela.
 *
 * - Enquanto a animação roda, os tiques seguintes são ignorados.
 * - Depois dela, tiques do mesmo giro (intervalo curto, sem aceleração) e a
 *   inércia do trackpad continuam ignorados; um tique após uma pausa curta, ou
 *   um novo empurrão no trackpad, avança mais uma tela.
 * - Áreas com rolagem própria (chat, lista do portfólio, painéis) continuam
 *   rolando normalmente enquanto tiverem para onde rolar.
 */

export const DESKTOP_SECTION_PAGING_DURATION_SECONDS = 0.75;

const NEW_GESTURE_GAP_MS = 110;
const TRACKPAD_DELTA_THRESHOLD_PX = 24;
const LOCK_RELEASE_MARGIN_MS = 60;

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
	if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) return event.deltaY * 16;
	if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
		return event.deltaY * window.innerHeight;
	}
	return event.deltaY;
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

function resolveTargetSection(
	sections: readonly HTMLElement[],
	direction: Direction
): HTMLElement | null {
	// Funciona também fora do alinhamento (ex.: depois de arrastar a barra de
	// rolagem): desce para a primeira seção abaixo do topo, sobe para a última
	// acima dele.
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
	const navigateRef = useRef(navigateToSection);

	useEffect(() => {
		navigateRef.current = navigateToSection;
	}, [navigateToSection]);

	useEffect(() => {
		const container = containerRef.current;

		if (!container || typeof window === "undefined") {
			return undefined;
		}

		let lockedUntil = 0;
		let lastWheelAt = Number.NEGATIVE_INFINITY;
		let lastWheelDelta = 0;
		let gestureConsumed = false;
		let pendingTrackpadDelta = 0;

		const getSections = () =>
			Array.from(
				container.querySelectorAll<HTMLElement>(
					":scope > section[data-page-section='true']"
				)
			);

		const page = (direction: Direction): void => {
			const target = resolveTargetSection(getSections(), direction);

			gestureConsumed = true;
			pendingTrackpadDelta = 0;

			if (!target) {
				return;
			}

			lockedUntil =
				performance.now() +
				DESKTOP_SECTION_PAGING_DURATION_SECONDS * 1000 +
				LOCK_RELEASE_MARGIN_MS;

			navigateRef.current(target.id as LandingSectionId, {
				replace: true,
				syncUrl: true,
				offsetPx: 0,
				duration: DESKTOP_SECTION_PAGING_DURATION_SECONDS,
			});
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
				pendingTrackpadDelta = 0;
			}

			if (now < lockedUntil) return;
			if (gestureConsumed && !accelerating) return;

			// Trackpads mandam deltas pequenos: acumula até um empurrão claro.
			pendingTrackpadDelta += delta;
			if (Math.abs(pendingTrackpadDelta) < TRACKPAD_DELTA_THRESHOLD_PX) return;

			page(direction);
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

			if (performance.now() < lockedUntil || event.repeat) return;

			page(direction);
		};

		window.addEventListener("wheel", handleWheel, {
			capture: true,
			passive: false,
		});
		window.addEventListener("keydown", handleKeyDown);

		return () => {
			window.removeEventListener("wheel", handleWheel, true);
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [containerRef]);
}
