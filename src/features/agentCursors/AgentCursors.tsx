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
] as const;

const PIECES = "[data-agent-piece], img";
const OFF_LIMITS = "nav, header, aside, [data-chat-panel], [data-agent-skip], [data-agent-swarm]";
const CHECK_MS = 100;
const SCROLL_REST_MS = 180;
// A peça já começa fora da tela: espera o fade-in avançar para entrar visível.
const FADE_LEAD_MS = 260;
const REACH_MS = 130;
const PULL_MS = 340;
const STAGGER_MS = 70;
const EXIT_MS = 170;
const MARGIN = 40;
const EASE_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";

const point = (x: number, y: number) => `translate(${x}px, ${y}px)`;

/** Peça pronta para entrar: imagem carregada, inteira na tela e visível. */
function isReady(element: Element) {
	if (element.closest(OFF_LIMITS)) return false;
	if (element instanceof HTMLImageElement && !(element.complete && element.naturalWidth > 0)) return false;
	if (element.tagName === "IMG" && element.closest("[data-agent-piece]")) return false;
	const box = element.getBoundingClientRect();
	const inside = box.top >= -40 && box.left >= -40 && box.right <= innerWidth + 40 && box.bottom <= innerHeight + 40;
	if (!inside || box.width < 48 || box.height < 48) return false;
	if (getComputedStyle(element).visibility !== "visible") return false;
	if (element.hasAttribute("data-agent-piece")) return true;
	// Ainda atrás da tela de carregamento ou de outra camada: espera aparecer.
	const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
	return Boolean(hit && (element === hit || element.contains(hit) || hit.contains(element)));
}

/** Do lado de fora mais próximo até o lugar da peça, em px de tela. */
function entryOffset(box: DOMRect) {
	const toLeft = box.right + MARGIN;
	const toRight = innerWidth - box.left + MARGIN;
	const toBottom = innerHeight - box.top + MARGIN;
	if (toBottom < Math.min(toLeft, toRight)) return { x: 0, y: toBottom };
	return toLeft < toRight ? { x: -toLeft, y: 0 } : { x: toRight, y: 0 };
}

function startSwarm(root: HTMLElement) {
	const seen = new WeakSet<Element>();
	const cursors = [...root.querySelectorAll<HTMLElement>("[data-agent]")];
	const frames = [...root.querySelectorAll<HTMLElement>("[data-agent-frame]")];
	const motions = new Set<Animation>();
	let lastScroll = 0;
	let nextAgent = 0;
	let working = 0;

	const track = (animation: Animation) => {
		motions.add(animation);
		animation.finished.catch(() => undefined).finally(() => motions.delete(animation));
		return animation;
	};

	/** Agente busca a peça fora da tela e a arrasta até o lugar. */
	const pull = (group: readonly Element[], order: number) => {
		const index = nextAgent++ % AGENTS.length;
		const cursor = cursors[index];
		const frame = frames[index];
		const main = group[0];
		const box = main.getBoundingClientRect();
		const offset = entryOffset(box);
		const delay = FADE_LEAD_MS + order * STAGGER_MS;
		const grabX = box.left + box.width * 0.5;
		const grabY = box.top + box.height * 0.4;
		const startX = grabX + offset.x;
		const startY = grabY + offset.y;

		for (const element of group) {
			const html = element as HTMLElement;
			const scale = html.offsetWidth > 0 ? element.getBoundingClientRect().width / html.offsetWidth : 1;
			track(element.animate(
				{ translate: [`${offset.x / scale}px ${offset.y / scale}px`, "0px 0px"] },
				{ delay: delay + REACH_MS, duration: PULL_MS, easing: EASE_OUT, fill: "backwards", composite: "add" },
			));
		}

		const exitX = grabX + (offset.x === 0 ? 0 : Math.sign(offset.x) * (innerWidth + 120));
		const exitY = grabY + (offset.y === 0 ? 0 : innerHeight + 120);
		const total = REACH_MS + PULL_MS + EXIT_MS;
		cursor.dataset.flip = String(grabX > innerWidth - 230);
		working += 1;
		root.dataset.working = "true";
		const flight = track(cursor.animate(
			[
				{ transform: point(startX, startY + 90), opacity: 0, offset: 0 },
				{ transform: point(startX, startY), opacity: 1, offset: REACH_MS / total },
				{ transform: point(grabX, grabY), opacity: 1, offset: (REACH_MS + PULL_MS * 0.8) / total },
				{ transform: point(grabX, grabY), opacity: 1, offset: (REACH_MS + PULL_MS) / total },
				{ transform: point(exitX, exitY), opacity: 1, offset: 1 },
			],
			{ delay, duration: total, easing: "ease-out", fill: "backwards" },
		));

		frame.style.transform = point(box.left - 5, box.top - 5);
		frame.style.width = `${box.width + 10}px`;
		frame.style.height = `${box.height + 10}px`;
		track(frame.animate({ opacity: [0, 1, 0] }, { delay: delay + REACH_MS + PULL_MS * 0.7, duration: 300 }));

		flight.finished.catch(() => undefined).finally(() => {
			working -= 1;
			if (working === 0) root.dataset.working = "false";
		});
	};

	const check = () => {
		if (document.hidden || document.getElementById("boot-curtain")) return;
		if (performance.now() - lastScroll < SCROLL_REST_MS) return;
		const ready = [...document.querySelectorAll(PIECES)].filter((element) => !seen.has(element) && isReady(element));
		if (ready.length === 0) return;
		const groups = new Map<Element | string, Element[]>();
		for (const element of ready) {
			seen.add(element);
			const name = element.getAttribute("data-agent-piece") || element;
			groups.set(name, [...(groups.get(name) ?? []), element]);
		}
		[...groups.values()].slice(0, AGENTS.length * 2).forEach((group, order) => pull(group, order));
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
		root.dataset.working = "false";
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

	if (blocked) return null;

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
