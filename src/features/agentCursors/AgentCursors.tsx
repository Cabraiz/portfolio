import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

import { isHomeGameRoutePath, isHomeGameStandaloneHost } from "../../App/appHostRouting";
import styles from "./AgentCursors.module.css";
import { AGENTS } from "./AgentCursors.motion";
import { startSwarm } from "./AgentCursors.swarm";

/*
 * Charme decorativo: cursores de "agentes de IA" entram bem rápido, puxam as
 * imagens de fora da tela para o lugar e somem. O movimento é somado ao
 * `translate` da peça (composite: "add"), então o fade-in e o idle continuam.
 * Desktop e celular, sem pedido de menos movimento, e nunca capturam o toque.
 * Fica de fora em testes automatizados, que medem a posição real das peças.
 */

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
