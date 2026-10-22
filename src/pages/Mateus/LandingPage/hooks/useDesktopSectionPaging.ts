import { useLenis } from "lenis/react";
import { useEffect, useRef } from "react";

import type { LandingSectionId } from "../../../../features/navigation/landingSections";
import type { LandingSectionNavigationNavigateOptions } from "../../../../features/navigation/useLandingSectionNavigation";

/**
 * Paginação por seção no desktop com resistência: são precisos
 * TICKS_PER_SECTION tiques da roda para trocar de tela.
 *
 * - Cada tique leva a página, suavemente, 1/TICKS_PER_SECTION do caminho até
 *   a seção vizinha; ao completar, a página termina a passagem e para nela.
 * - Se a roda parar antes, a página desliza de volta para a seção de onde
 *   saiu. Tiques dados durante essa volta continuam contando de onde ela
 *   está: o empurrão nunca é perdido.
 * - Fora do alinhamento (barra de rolagem, resize) o empurrão parte da seção
 *   mais próxima, e o resize no meio de um empurrão realinha a seção.
 * - Enquanto a passagem para outra seção anima, a roda espera; depois dela,
 *   o resto do mesmo giro (sem pausa de NEW_GESTURE_GAP_MS) e a inércia do
 *   trackpad são ignorados.
 * - Teclas de rolagem trocam de seção direto.
 * - Áreas com rolagem própria (chat, lista do portfólio, painéis) continuam
 *   rolando normalmente enquanto tiverem para onde rolar.
 */

export const DESKTOP_SECTION_PAGING_DURATION_SECONDS = 1.1;

const TICKS_PER_SECTION = 4;
// Um tique de mouse comum (Chrome/Windows) rola 100px; tiques maiores
// (Windows com mais linhas por tique) contam como um tique só.
const TICK_DELTA_PX = 100;
// Suavização dos empurrões e da volta (mesma escala do lerp do Lenis).
const PUSH_LERP = 0.06;
const SNAP_BACK_DELAY_MS = 900;
const RESIZE_REALIGN_DELAY_MS = 400;
const REALIGN_WINDOW_MS = 1500;
const SNAP_BACK_RESIZE_DURATION_SECONDS = 0.5;
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
		let pointerIsDown = false;
		// Seção de onde o empurrão saiu e quantos tiques ele acumula (pode ser
		// fracionário: mouse de alta resolução e trackpad mandam pedaços).
		let anchorIndex: number | null = null;
		let pushTicks = 0;
		let snapBackTimerId: number | undefined;
		let resizeTimerId: number | undefined;
		// Seção a realinhar depois de um resize que pegou um empurrão no meio.
		let realignIndex: number | null = null;
		let realignExpiryTimerId: number | undefined;

		const getSections = () =>
			Array.from(
				container.querySelectorAll<HTMLElement>(
					":scope > section[data-page-section='true']"
				)
			);

		const sectionTop = (section: HTMLElement) =>
			window.scrollY + section.getBoundingClientRect().top;

		const glideTo = (top: number, onComplete?: () => void) => {
			const activeLenis = lenisRef.current;

			if (activeLenis) {
				activeLenis.scrollTo(top, {
					lerp: PUSH_LERP,
					force: true,
					onComplete,
				});
				return;
			}

			window.scrollTo({ top, behavior: "auto" });
			onComplete?.();
		};

		const resetPush = () => {
			window.clearTimeout(snapBackTimerId);
			window.clearTimeout(resizeTimerId);
			snapBackTimerId = undefined;
			resizeTimerId = undefined;
			anchorIndex = null;
			pushTicks = 0;
			// Roda ou teclado assumiram: um resize não volta mais para a seção antiga.
			realignIndex = null;
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
			const anchor = anchorIndex === null ? null : getSections()[anchorIndex];

			// Menu, teclado ou a barra de rolagem assumiram a posição.
			if (!anchor || isNavigationAnimating() || pointerIsDown) {
				resetPush();
				return;
			}

			pushTicks = 0;
			glideTo(sectionTop(anchor), () => {
				// Um tique durante a volta reabre o empurrão desta mesma seção.
				if (pushTicks === 0) anchorIndex = null;
			});
		};

		const scheduleSnapBack = () => {
			window.clearTimeout(snapBackTimerId);
			snapBackTimerId = window.setTimeout(snapBack, SNAP_BACK_DELAY_MS);
		};

		const ensureAnchor = (sections: readonly HTMLElement[]) => {
			const height = window.innerHeight;
			const current = anchorIndex === null ? null : sections[anchorIndex];

			if (
				current &&
				Math.abs(current.getBoundingClientRect().top) < height * 1.05
			) {
				return;
			}

			// Começa da seção mais próxima, contando o quanto a página já está
			// fora dela (barra de rolagem, resize, volta interrompida).
			let nearest = 0;
			sections.forEach((section, index) => {
				if (
					Math.abs(section.getBoundingClientRect().top) <
					Math.abs(sections[nearest].getBoundingClientRect().top)
				) {
					nearest = index;
				}
			});

			anchorIndex = nearest;
			pushTicks =
				(-sections[nearest].getBoundingClientRect().top / height) *
				TICKS_PER_SECTION;
		};

		const push = (ticks: number): void => {
			const sections = getSections();
			if (sections.length === 0) return;

			// A roda assumiu depois de um resize: o realinhamento pendente sai.
			window.clearTimeout(resizeTimerId);
			realignIndex = null;

			ensureAnchor(sections);
			if (anchorIndex === null) return;

			pushTicks += ticks;

			// Não há para onde empurrar além da primeira/última seção.
			if (
				(anchorIndex === 0 && pushTicks < 0) ||
				(anchorIndex === sections.length - 1 && pushTicks > 0)
			) {
				pushTicks = 0;
			}

			if (Math.abs(pushTicks) >= TICKS_PER_SECTION - 0.001) {
				const target = sections[anchorIndex + Math.sign(pushTicks)];
				resetPush();
				gestureConsumed = true;
				if (target) navigateTo(target, DESKTOP_SECTION_PAGING_DURATION_SECONDS);
				return;
			}

			const anchor = sections[anchorIndex];
			glideTo(
				sectionTop(anchor) +
					(pushTicks / TICKS_PER_SECTION) * window.innerHeight
			);
			scheduleSnapBack();
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

			// Hora em que o navegador criou o evento: com a página ocupada, a hora do
			// processamento espaçaria tiques de um mesmo giro.
			const now = event.timeStamp || performance.now();
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

			// Um tique vale no máximo um: tiques maiores (mais linhas por tique)
			// não pulam etapas; deltas pequenos somam frações.
			push(direction * Math.min(1, Math.abs(delta) / TICK_DELTA_PX));
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

		const handlePointerDown = (): void => {
			pointerIsDown = true;
		};

		const handlePointerUp = (): void => {
			pointerIsDown = false;
		};

		// Resize no meio de um empurrão: espera a janela assentar e realinha a
		// seção de onde ele saiu (sem isso a página ficava entre duas telas).
		// Resizes seguidos (ir para outra tela e voltar) refazem o alinhamento.
		const handleResize = (): void => {
			if (anchorIndex !== null) {
				realignIndex = anchorIndex;
				window.clearTimeout(snapBackTimerId);
				snapBackTimerId = undefined;
				anchorIndex = null;
				pushTicks = 0;
			}

			if (realignIndex === null) return;

			window.clearTimeout(realignExpiryTimerId);
			window.clearTimeout(resizeTimerId);
			resizeTimerId = window.setTimeout(() => {
				const anchor =
					realignIndex === null ? null : getSections()[realignIndex];
				if (anchor) navigateTo(anchor, SNAP_BACK_RESIZE_DURATION_SECONDS);
				realignExpiryTimerId = window.setTimeout(() => {
					realignIndex = null;
				}, REALIGN_WINDOW_MS);
			}, RESIZE_REALIGN_DELAY_MS);
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
		window.addEventListener("pointerup", handlePointerUp, {
			capture: true,
			passive: true,
		});
		window.addEventListener("pointercancel", handlePointerUp, {
			capture: true,
			passive: true,
		});
		window.addEventListener("resize", handleResize);

		return () => {
			resetPush();
			window.clearTimeout(realignExpiryTimerId);
			window.removeEventListener("wheel", handleWheel, true);
			window.removeEventListener("keydown", handleKeyDown);
			window.removeEventListener("pointerdown", handlePointerDown, true);
			window.removeEventListener("pointerup", handlePointerUp, true);
			window.removeEventListener("pointercancel", handlePointerUp, true);
			window.removeEventListener("resize", handleResize);
		};
	}, [containerRef]);
}
