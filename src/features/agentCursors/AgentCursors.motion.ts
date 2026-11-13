// Tempos, curvas e geometria dos cursores de agentes

const AGENTS = [
	{ name: "layout-01", color: "#b8f53a" },
	{ name: "copy-02", color: "#35d6ff" },
	{ name: "gfx-03", color: "#ff5ca8" },
	{ name: "grade-04", color: "#a98bff" },
	{ name: "qa-05", color: "#ffb23e" },
	{ name: "motion-06", color: "#5ef0c8" },
	{ name: "ux-07", color: "#ff7a59" },
	{ name: "seo-08", color: "#f5e663" },
] as const;

const PIECES = "[data-agent-piece], img";
const OFF_LIMITS = "[data-chat-panel], [data-agent-skip], [data-agent-placeholder], [data-agent-swarm]";
const CHECK_MS = 100;
const SCROLL_REST_MS = 180;
// A peça já começa fora da tela: espera o fade-in avançar para entrar visível.
const FADE_LEAD_MS = 80;
const PULL_MS = 340;
// Os agentes saem um de cada vez, com um intervalo que varia como o de gente.
const LAUNCH_GAP_MS = [150, 260] as const;
// Depois de encaixar, o agente segura a peça um instante com a moldura acesa.
const HOLD_MS = 145;
const MARGIN = 40;
// Peça na tela há mais que isso sem agente aparece sozinha no lugar.
const STUCK_MS = 3000;
const PATH_STEPS = 16;
// Os tempos acima são a base. Cada agente leva várias peças vizinhas de uma vez
// e anda devagar: no desktop (Início e Portfólio largos) a 1,5x da base dividido
// por 2, e no celular a 1,75x dividido por 2.
const DESKTOP_QUERY = "(min-width: 992px)";
const DESKTOP_PACE = 2 / 1.5;
const MOBILE_PACE = 2 / 1.75;
// Peças por viagem, no máximo: desktop leva 2; no celular a média de 2,5 faz o
// Início sair em 15 a 16 viagens, com grupos de 2 e 3. Peça sem vizinha colada
// viaja sozinha, então o total varia um pouco com a ordem em que ficam prontas.
const DESKTOP_PER_TRIP = 2;
const MOBILE_PER_TRIP = 2.5;
// Peça sem vizinha espera até isso de checagens por uma vizinha nova.
const LEFTOVER_CHECKS = 6;
// Só viajam juntas peças coladas (até NEAR_PX de distância, como dois itens do menu) que formem um bloco
// compacto: a moldura não pode passar de TIGHT vezes a área das peças. Assim
// "Fotos" não vai junto com o seletor de idioma do outro lado do menu.
const NEAR_PX = 30;
const TIGHT = 2;

type Pt = { x: number; y: number };

const point = (x: number, y: number) => `translate(${x}px, ${y}px)`;
const rand = (min: number, max: number) => min + Math.random() * (max - min);
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const distance = (a: Pt, b: Pt) => Math.hypot(b.x - a.x, b.y - a.y);
const easeInOut = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2);
const easeOut = (u: number) => 1 - (1 - u) ** 4;
const easeIn = (u: number) => u * u;

/** Curva suave entre dois pontos, com a curvatura aleatória de uma mão de verdade. */
function bend(from: Pt, to: Pt, wobble: number) {
	const dx = to.x - from.x;
	const dy = to.y - from.y;
	const len = Math.hypot(dx, dy) || 1;
	const px = -dy / len;
	const py = dx / len;
	const k1 = rand(-wobble, wobble) * len;
	const k2 = rand(-wobble, wobble) * 0.6 * len;
	const c1 = { x: from.x + dx * 0.3 + px * k1, y: from.y + dy * 0.3 + py * k1 };
	const c2 = { x: from.x + dx * 0.72 + px * k2, y: from.y + dy * 0.72 + py * k2 };
	return (t: number): Pt => {
		const s = 1 - t;
		const a = s * s * s;
		const b = 3 * s * s * t;
		const c = 3 * s * t * t;
		const d = t * t * t;
		return { x: a * from.x + b * c1.x + c * c2.x + d * to.x, y: a * from.y + b * c1.y + c * c2.y + d * to.y };
	};
}

/** Um ponto qualquer logo fora da tela, em qualquer lado. */
function offscreenPoint(): Pt {
	const pad = 60;
	const side = Math.floor(Math.random() * 4);
	if (side === 0) return { x: rand(0, innerWidth), y: -pad };
	if (side === 1) return { x: innerWidth + pad, y: rand(0, innerHeight) };
	if (side === 2) return { x: rand(0, innerWidth), y: innerHeight + pad };
	return { x: -pad, y: rand(0, innerHeight) };
}

/** Peça pronta para entrar: imagem carregada e visível na tela. */
function isReady(element: Element) {
	if (element.closest(OFF_LIMITS)) return false;
	if (element instanceof HTMLImageElement && !(element.complete && element.naturalWidth > 0)) return false;
	const explicit = element.hasAttribute("data-agent-piece");
	if (!explicit && element.closest("[data-agent-piece]")) return false;
	const box = element.getBoundingClientRect();
	if (explicit) {
		// Peça marcada fica escondida até o agente trazê-la: basta aparecer na tela,
		// mesmo que passe da borda (como as pessoas de corpo inteiro).
		const onScreen = box.width > 0 && box.height > 0 && box.bottom > 0 && box.top < innerHeight && box.right > 0 && box.left < innerWidth;
		return onScreen && getComputedStyle(element.parentElement ?? element).visibility === "visible";
	}
	const inside = box.top >= -40 && box.left >= -40 && box.right <= innerWidth + 40 && box.bottom <= innerHeight + 40;
	if (!inside || box.width < 48 || box.height < 48) return false;
	if (getComputedStyle(element).visibility !== "visible") return false;
	// Ainda atrás da tela de carregamento ou de outra camada: espera aparecer.
	const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
	return Boolean(hit && (element === hit || element.contains(hit) || hit.contains(element)));
}

/** Do lado de fora mais próximo até o lugar da peça, em px de tela. */
function entryOffset(box: DOMRect) {
	const toLeft = box.right + MARGIN;
	const toRight = innerWidth - box.left + MARGIN;
	const toBottom = innerHeight - box.top + MARGIN;
	const toTop = box.bottom + MARGIN;
	// Um desvio de lado, para não entrar sempre em linha reta com a borda.
	const side = (along: number) => rand(-1, 1) * Math.min(160, along * 0.3);
	if (toTop < Math.min(toLeft, toRight, toBottom)) return { x: side(toTop), y: -toTop };
	if (toBottom < Math.min(toLeft, toRight)) return { x: side(toBottom), y: toBottom };
	return toLeft < toRight ? { x: -toLeft, y: side(toLeft) } : { x: toRight, y: side(toRight) };
}

type Box = { left: number; top: number; right: number; bottom: number };

/** Caixa que envolve todas as caixas dadas (a moldura de uma viagem). */
function unionOf(boxes: readonly Box[]): Box {
	return {
		left: Math.min(...boxes.map((box) => box.left)),
		top: Math.min(...boxes.map((box) => box.top)),
		right: Math.max(...boxes.map((box) => box.right)),
		bottom: Math.max(...boxes.map((box) => box.bottom)),
	};
}
// Com a folga de 5 px da moldura: peças finas (os traços do ☰) contam como a moldura as vê.
const areaOf = (box: Box) => (box.right - box.left + 10) * (box.bottom - box.top + 10);
/** Distância entre as bordas de duas caixas (0 quando se tocam ou se cruzam). */
const gapOf = (a: Box, b: Box) =>
	Math.hypot(Math.max(0, a.left - b.right, b.left - a.right), Math.max(0, a.top - b.bottom, b.top - a.bottom));

export {
	AGENTS,
	PIECES,
	CHECK_MS,
	SCROLL_REST_MS,
	FADE_LEAD_MS,
	PULL_MS,
	LAUNCH_GAP_MS,
	HOLD_MS,
	STUCK_MS,
	PATH_STEPS,
	DESKTOP_QUERY,
	DESKTOP_PACE,
	MOBILE_PACE,
	DESKTOP_PER_TRIP,
	MOBILE_PER_TRIP,
	LEFTOVER_CHECKS,
	NEAR_PX,
	TIGHT,
	point,
	rand,
	clamp,
	distance,
	easeInOut,
	easeOut,
	easeIn,
	bend,
	offscreenPoint,
	isReady,
	entryOffset,
	unionOf,
	areaOf,
	gapOf,
};
export type { Pt };
