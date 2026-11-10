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
const OFF_LIMITS = "[data-chat-panel], [data-agent-skip], [data-agent-swarm]";
const CHECK_MS = 100;
const SCROLL_REST_MS = 180;
// A peça já começa fora da tela: espera o fade-in avançar para entrar visível.
const FADE_LEAD_MS = 260;
const REACH_MS = 320;
const PULL_MS = 760;
const STAGGER_MS = 70;
// Depois de encaixar, o agente segura a peça um instante com a moldura acesa.
const HOLD_MS = 320;
const EXIT_MS = 420;
const MARGIN = 40;
const EASE_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";

const point = (x: number, y: number) => `translate(${x}px, ${y}px)`;

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
	if (toTop < Math.min(toLeft, toRight, toBottom)) return { x: 0, y: -toTop };
	if (toBottom < Math.min(toLeft, toRight)) return { x: 0, y: toBottom };
	return toLeft < toRight ? { x: -toLeft, y: 0 } : { x: toRight, y: 0 };
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
	let working = 0;

	const track = (animation: Animation) => {
		motions.add(animation);
		animation.finished.catch(() => undefined).finally(() => motions.delete(animation));
		return animation;
	};

	/** Agente busca a peça fora da tela e a arrasta até o lugar. */
	const pull = (group: readonly Element[], order: number) => {
		const now = performance.now();
		const index = freeAt.indexOf(Math.min(...freeAt));
		const cursor = cursors[index];
		const frame = frames[index];
		const main = group[0];
		const box = main.getBoundingClientRect();
		const offset = entryOffset(box);
		const delay = Math.max(FADE_LEAD_MS + order * STAGGER_MS, freeAt[index] - now + 60);
		freeAt[index] = now + delay + REACH_MS + PULL_MS + HOLD_MS + EXIT_MS;
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
		const startX = box.left + relX + offset.x;
		const startY = box.top + relY + offset.y;

		for (const element of group) {
			const html = element as HTMLElement;
			element.setAttribute("data-agent-placed", "");
			const scale = html.offsetWidth > 0 ? element.getBoundingClientRect().width / html.offsetWidth : 1;
			track(element.animate(
				{ translate: [`${offset.x / scale}px ${offset.y / scale}px`, "0px 0px"] },
				{ delay: delay + REACH_MS, duration: PULL_MS, easing: EASE_OUT, fill: "backwards", composite: "add" },
			));
		}

		cursor.dataset.flip = String(box.left + relX > innerWidth - 230);
		working += 1;
		root.dataset.working = "true";
		// 1) Chega até a peça, ainda fora da tela.
		track(cursor.animate(
			[
				{ transform: point(startX, startY + 90), opacity: 0 },
				{ transform: point(startX, startY), opacity: 1 },
			],
			{ delay, duration: REACH_MS, easing: "ease-out" },
		));
		// 2) Preso à peça quadro a quadro enquanto a arrasta e segura no lugar.
		const later = (ms: number, run: () => void) => {
			const id = setTimeout(() => {
				timers.delete(id);
				run();
			}, ms);
			timers.add(id);
		};
		later(delay + REACH_MS, () => {
			cursor.style.opacity = "1";
			const end = performance.now() + PULL_MS + HOLD_MS;
			const glue = () => {
				const at = grabAt();
				cursor.style.transform = point(at.x, at.y);
				if (performance.now() < end) frameLoops.add(requestAnimationFrame(glue));
				else leave(at);
			};
			glue();
		});
		// 3) Solta e sai pelo mesmo lado de onde veio.
		const leave = (at: { x: number; y: number }) => {
			cursor.style.opacity = "0";
			const exitX = at.x + (offset.x === 0 ? 0 : Math.sign(offset.x) * (innerWidth + 120));
			const exitY = at.y + (offset.y === 0 ? 0 : Math.sign(offset.y) * (innerHeight + 120));
			const exit = track(cursor.animate(
				[
					{ transform: point(at.x, at.y), opacity: 1 },
					{ transform: point(exitX, exitY), opacity: 1, offset: 0.85 },
					{ transform: point(exitX, exitY), opacity: 0 },
				],
				{ duration: EXIT_MS, easing: "ease-in" },
			));
			exit.finished.catch(() => undefined).finally(() => {
				working -= 1;
				if (working === 0) root.dataset.working = "false";
			});
		};

		// A moldura acompanha a peça quadro a quadro (e o grupo inteiro), sem sair da tela.
		const frameStart = delay + REACH_MS + PULL_MS * 0.6;
		const frameMs = PULL_MS * 0.4 + HOLD_MS;
		const follow = () => {
			const boxes = group.map((element) => element.getBoundingClientRect());
			const left = Math.max(2, Math.min(...boxes.map((item) => item.left)) - 5);
			const top = Math.max(2, Math.min(...boxes.map((item) => item.top)) - 5);
			const right = Math.min(innerWidth - 2, Math.max(...boxes.map((item) => item.right)) + 5);
			const bottom = Math.min(innerHeight - 2, Math.max(...boxes.map((item) => item.bottom)) + 5);
			frame.style.transform = point(left, top);
			frame.style.width = `${Math.max(0, right - left)}px`;
			frame.style.height = `${Math.max(0, bottom - top)}px`;
		};
		later(frameStart, () => {
			const end = performance.now() + frameMs;
			const step = () => {
				follow();
				if (performance.now() < end) frameLoops.add(requestAnimationFrame(step));
			};
			step();
		});
		track(frame.animate({ opacity: [0, 1, 1, 0], offset: [0, 0.15, 0.85, 1] }, { delay: frameStart, duration: frameMs }));
	};

	const check = () => {
		if (document.hidden || document.getElementById("boot-curtain")) return;
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
		[...groups.values()].sort((a, b) => top(a) - top(b)).forEach((group, order) => pull(group, order));
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
		for (const cursor of cursors) cursor.style.opacity = "0";
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
