import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

import { isHomeGameRoutePath, isHomeGameStandaloneHost } from "../../App/appHostRouting";
import styles from "./AgentCursors.module.css";

/*
 * Charme decorativo: cursores de "agentes de IA" entram bem rápido, puxam as
 * imagens de fora da tela para o lugar e somem. O movimento é somado ao
 * `translate` da peça (composite: "add"), então o fade-in e o idle continuam.
 * Desktop e celular, sem pedido de menos movimento, e nunca capturam o toque.
 * Fica de fora em testes automatizados, que medem a posição real das peças.
 */

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
// Os tempos acima são a base: no desktop (Início e Portfólio largos) os agentes
// andam 1,5x mais rápido e no celular 1,75x.
const DESKTOP_QUERY = "(min-width: 992px)";
const DESKTOP_PACE = 1 / 1.5;
const MOBILE_PACE = 1 / 1.75;

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

function startSwarm(root: HTMLElement) {
	const seen = new WeakSet<Element>();
	// Liga o CSS que esconde as peças marcadas até um agente trazê-las.
	document.documentElement.dataset.agents = "on";
	document.documentElement.dataset.agentsLive = "";
	const cursors = [...root.querySelectorAll<HTMLElement>("[data-agent]")];
	const frames = [...root.querySelectorAll<HTMLElement>("[data-agent-frame]")];
	const motions = new Set<Animation>();
	const timers = new Set<ReturnType<typeof setTimeout>>();
	const frameLoops = new Set<number>();
	let lastScroll = 0;
	// Cada agente só pega a próxima peça depois de soltar a anterior.
	const freeAt = AGENTS.map(() => 0);
	let lastLaunch = -Infinity;
	let working = 0;

	const track = (animation: Animation) => {
		motions.add(animation);
		animation.finished.catch(() => undefined).finally(() => motions.delete(animation));
		return animation;
	};

	/** Agente busca a peça fora da tela e a arrasta até o lugar. */
	const pull = (group: readonly Element[]) => {
		const now = performance.now();
		const pace = globalThis.matchMedia(DESKTOP_QUERY).matches ? DESKTOP_PACE : MOBILE_PACE;
		const pullMs = PULL_MS * pace;
		const index = freeAt.indexOf(Math.min(...freeAt));
		const cursor = cursors[index];
		const frame = frames[index];
		// Pega pela peça do grupo que mais aparece na tela.
		const visibleArea = (element: Element) => {
			const r = element.getBoundingClientRect();
			return Math.max(0, Math.min(r.right, innerWidth) - Math.max(r.left, 0)) * Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0));
		};
		const main = group.reduce((best, element) => (visibleArea(element) > visibleArea(best) ? element : best));
		const box = main.getBoundingClientRect();
		const offset = entryOffset(box);
		const delay = Math.max(
			FADE_LEAD_MS,
			freeAt[index] - now + rand(40, 160) * pace,
			lastLaunch + rand(...LAUNCH_GAP_MS) * pace - now,
		);
		lastLaunch = now + delay;
		// Ponto de pega dentro da parte visível da peça, guardado relativo a ela.
		const visLeft = Math.max(box.left, 12);
		const visRight = Math.min(box.right, innerWidth - 12);
		const visTop = Math.max(box.top, 12);
		const visBottom = Math.min(box.bottom, innerHeight - 12);
		const relX = (visLeft + visRight) / 2 - box.left;
		const relY = visTop + (visBottom - visTop) * 0.4 - box.top;
		const grabAt = () => {
			const live = main.getBoundingClientRect();
			return { x: live.left + relX, y: live.top + relY };
		};
		const start = { x: box.left + relX + offset.x, y: box.top + relY + offset.y };
		const rest = { x: box.left + relX, y: box.top + relY };
		// Vem de um ponto qualquer fora da tela e vai embora para outro, sempre em curva.
		const comeFrom = offscreenPoint();
		const goTo = offscreenPoint();
		const approach = bend(comeFrom, start, 0.35);
		const reachMs = clamp(160 + distance(comeFrom, start) * 0.135, 215, 400) * pace;
		const exitMs = clamp(170 + distance(rest, goTo) * 0.135, 235, 425) * pace;
		const t0 = now + delay;
		const tGrab = t0 + reachMs;
		const tRelease = tGrab + pullMs + HOLD_MS * pace;
		const tEnd = tRelease + exitMs;
		freeAt[index] = tEnd;

		// A peça também faz curva até o lugar, desacelerando no fim como um arrasto de mão.
		const drag = bend(offset, { x: 0, y: 0 }, 0.18);
		const path = Array.from({ length: PATH_STEPS + 1 }, (_, step) => drag(easeOut(step / PATH_STEPS)));
		for (const element of group) {
			const html = element as HTMLElement;
			element.setAttribute("data-agent-placed", "");
			const scale = html.offsetWidth > 0 ? element.getBoundingClientRect().width / html.offsetWidth : 1;
			track(element.animate(
				{ translate: path.map((at) => `${at.x / scale}px ${at.y / scale}px`) },
				{ delay: delay + reachMs, duration: pullMs, fill: "backwards", composite: "add" },
			));
		}

		const later = (ms: number, run: () => void) => {
			const id = setTimeout(() => {
				timers.delete(id);
				run();
			}, ms);
			timers.add(id);
		};
		const loop = (run: () => void) => {
			const id = requestAnimationFrame(() => {
				frameLoops.delete(id);
				run();
			});
			frameLoops.add(id);
		};

		// Tremor leve de mão, diferente a cada viagem.
		const phase = Array.from({ length: 4 }, () => rand(0, Math.PI * 2));
		const shake = (t: number, amp: number): Pt => ({
			x: amp * (2 * Math.sin(t / 180 + phase[0]) + Math.sin(t / 83 + phase[1])),
			y: amp * (2 * Math.sin(t / 150 + phase[2]) + Math.sin(t / 71 + phase[3])),
		});

		working += 1;
		root.dataset.working = "true";
		let last = comeFrom;
		let exitPath: ReturnType<typeof bend> | undefined;
		const place = (at: Pt, opacity: number) => {
			last = at;
			cursor.style.transform = point(at.x, at.y);
			cursor.style.opacity = String(opacity);
			const flip = String(at.x > innerWidth - 230);
			if (cursor.dataset.flip !== flip) cursor.dataset.flip = flip;
		};
		// A moldura acompanha a peça (e o grupo inteiro), sem sair da tela. Acende no
		// fim do arrasto e apaga um pouco antes de o agente soltar. Anda no mesmo
		// quadro do cursor: nunca aparece sozinha nem na posição da viagem anterior.
		const tFrameStart = tGrab + pullMs * 0.6;
		const tFrameEnd = tRelease - 60 * pace;
		const follow = () => {
			const boxes = group.map((element) => element.getBoundingClientRect());
			const left = Math.max(2, Math.min(...boxes.map((item) => item.left)) - 5);
			const top = Math.max(2, Math.min(...boxes.map((item) => item.top)) - 5);
			const right = Math.min(innerWidth - 2, Math.max(...boxes.map((item) => item.right)) + 5);
			const bottom = Math.min(innerHeight - 2, Math.max(...boxes.map((item) => item.bottom)) + 5);
			// Enquanto a peça ainda está fora da tela, a moldura não aparece espremida na borda.
			frame.style.visibility = right - left > 12 && bottom - top > 12 ? "visible" : "hidden";
			frame.style.transform = point(left, top);
			frame.style.width = `${Math.max(0, right - left)}px`;
			frame.style.height = `${Math.max(0, bottom - top)}px`;
		};
		const frameAt = (t: number) => {
			if (t < tFrameStart || t > tFrameEnd) {
				frame.style.opacity = "0";
				return;
			}
			follow();
			const u = (t - tFrameStart) / (tFrameEnd - tFrameStart);
			frame.style.opacity = String(Math.min(1, u / 0.15, (1 - u) / 0.15));
		};

		// O cursor inteiro anda quadro a quadro: chega em curva, arrasta preso à peça, sai em curva.
		const fly = () => {
			const t = performance.now();
			frameAt(t);
			if (t < tGrab) {
				const u = clamp((t - t0) / reachMs, 0, 1);
				place(approach(easeInOut(u)), Math.min(1, u * 5));
			} else if (t < tRelease) {
				const at = grabAt();
				const amp = t < tGrab + pullMs ? 1 - (0.75 * (t - tGrab)) / pullMs : 0.25;
				const wobble = shake(t, amp);
				place({ x: at.x + wobble.x, y: at.y + wobble.y }, 1);
			} else if (t < tEnd) {
				exitPath ??= bend(last, goTo, 0.3);
				const u = (t - tRelease) / exitMs;
				place(exitPath(easeIn(u)), u > 0.85 ? (1 - u) / 0.15 : 1);
			} else {
				cursor.style.opacity = "0";
				working -= 1;
				if (working === 0) root.dataset.working = "false";
				return;
			}
			loop(fly);
		};
		later(delay, fly);
	};

	const check = () => {
		if (document.hidden) return;
		// Começa assim que a tela de carregamento começa a subir, sem esperar ela sumir.
		const curtain = document.getElementById("boot-curtain");
		if (curtain && !curtain.hasAttribute("data-lifted")) return;
		rescue();
		if (performance.now() - lastScroll < SCROLL_REST_MS) return;
		const ready = [...document.querySelectorAll(PIECES)].filter((element) => !seen.has(element) && isReady(element));
		if (ready.length === 0) return;
		const groups = new Map<Element | string, Element[]>();
		for (const element of ready) {
			const name = element.getAttribute("data-agent-piece");
			// Peças com o mesmo nome entram juntas, mesmo a parte que sai da tela.
			const members = name ? [...document.querySelectorAll(`[data-agent-piece="${CSS.escape(name)}"]`)] : [element];
			for (const member of members) seen.add(member);
			groups.set(name || element, members);
		}
		// De cima para baixo: a legenda entra junto com as peças do projeto, não depois.
		const top = (group: readonly Element[]) => Math.min(...group.map((element) => element.getBoundingClientRect().top));
		for (const group of [...groups.values()].sort((a, b) => top(a) - top(b))) {
			try {
				pull(group);
			} catch {
				// Se a viagem falhar, a peça aparece no lugar em vez de ficar escondida.
				for (const element of group) element.setAttribute("data-agent-placed", "");
			}
		}
	};

	/**
	 * Rede de segurança: nenhuma peça fica escondida para sempre. A que já foi
	 * vista e não recebeu agente aparece na hora; a que está na tela há alguns
	 * segundos sem ficar pronta aparece no lugar, sem agente.
	 */
	const waitingSince = new WeakMap<Element, number>();
	const rescue = () => {
		const now = performance.now();
		for (const element of document.querySelectorAll("[data-agent-piece]:not([data-agent-placed])")) {
			if (seen.has(element)) {
				element.setAttribute("data-agent-placed", "");
				continue;
			}
			const box = element.getBoundingClientRect();
			const onScreen = box.width > 0 && box.height > 0 && box.bottom > 0 && box.top < innerHeight && box.right > 0 && box.left < innerWidth;
			// Imagem ainda baixando não conta: quando carregar, um agente a traz.
			const loading = element instanceof HTMLImageElement && !(element.complete && element.naturalWidth > 0);
			if (!onScreen || loading) {
				waitingSince.delete(element);
				continue;
			}
			const since = waitingSince.get(element) ?? now;
			waitingSince.set(element, since);
			if (now - since > STUCK_MS) {
				seen.add(element);
				element.setAttribute("data-agent-placed", "");
			}
		}
	};

	const onScroll = () => {
		lastScroll = performance.now();
	};
	addEventListener("scroll", onScroll, { capture: true, passive: true });
	const timer = setInterval(check, CHECK_MS);

	return () => {
		clearInterval(timer);
		removeEventListener("scroll", onScroll, { capture: true });
		for (const animation of motions) animation.cancel();
		for (const id of timers) clearTimeout(id);
		for (const id of frameLoops) cancelAnimationFrame(id);
		for (const element of [...cursors, ...frames]) element.style.opacity = "0";
		root.dataset.working = "false";
		delete document.documentElement.dataset.agents;
	};
}

export default function AgentCursors() {
	const rootRef = useRef<HTMLDivElement>(null);
	const location = useLocation();
	const blocked = isHomeGameStandaloneHost() || isHomeGameRoutePath(location.pathname);

	useEffect(() => {
		const root = rootRef.current;
		if (!root) return undefined;
		const media = globalThis.matchMedia("(prefers-reduced-motion: no-preference)");
		let stop: (() => void) | undefined;
		const sync = () => {
			stop?.();
			if (!media.matches || navigator.webdriver) delete document.documentElement.dataset.agents;
			const enabled = media.matches && !navigator.webdriver;
			stop = enabled ? startSwarm(root) : undefined;
			root.hidden = !enabled;
		};
		sync();
		media.addEventListener("change", sync);
		return () => {
			media.removeEventListener("change", sync);
			stop?.();
		};
	}, [blocked]);

	if (blocked) {
		if (typeof document !== "undefined") delete document.documentElement.dataset.agents;
		return null;
	}

	return (
		<div ref={rootRef} className={styles.swarm} data-agent-swarm="" data-working="false" aria-hidden="true" hidden>
			{AGENTS.map((agent) => (
				<div key={agent.name} className={styles.frame} data-agent-frame="" style={{ color: agent.color }} />
			))}
			{AGENTS.map((agent, index) => (
				<div key={agent.name} className={styles.cursor} data-agent={index} data-flip="false" style={{ color: agent.color }}>
					<svg className={styles.arrow} viewBox="0 0 20 22" width="20" height="22">
						<path d="M2 1.5 L18 11 L10.6 12.6 L7 20 Z" fill="currentColor" stroke="#10131a" strokeWidth="1.4" strokeLinejoin="round" />
					</svg>
					<span className={styles.tag}>{agent.name}</span>
				</div>
			))}
		</div>
	);
}
