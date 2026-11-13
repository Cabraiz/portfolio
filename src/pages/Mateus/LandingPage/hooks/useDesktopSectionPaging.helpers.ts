// Constantes, seletores e funções puras da paginação por seção.
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

function normalizeWheelDelta(event: WheelEvent): number {
	// Firefox manda tiques em linhas (3 por tique): vale o mesmo que 100px.
	if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
		return (event.deltaY * TICK_DELTA_PX) / 3;
	}
	if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
		return event.deltaY * window.innerHeight;
	}
	// Com escala do Windows ou zoom (125%, 150%, 200%), o Chrome divide o tique
	// pela escala (80px, 67px, 50px): volta para o tamanho de um tique inteiro.
	return event.deltaY * Math.max(1, window.devicePixelRatio || 1);
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

export type { Direction };
export {
	TICKS_PER_SECTION,
	TICK_DELTA_PX,
	PUSH_LERP,
	SNAP_BACK_DELAY_MS,
	RESIZE_REALIGN_DELAY_MS,
	REALIGN_WINDOW_MS,
	SNAP_BACK_RESIZE_DURATION_SECONDS,
	NEW_GESTURE_GAP_MS,
	NATIVE_WHEEL_SELECTOR,
	TEXT_ENTRY_SELECTOR,
	SPACE_ACTIVATED_SELECTOR,
	normalizeWheelDelta,
	canScrollInside,
	isNavigationAnimating,
	resolveTargetSection,
};
