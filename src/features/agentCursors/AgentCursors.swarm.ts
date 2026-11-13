import {
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
	type Pt,
} from "./AgentCursors.motion";

// Laço que solta os agentes e devolve a função que para tudo
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
		root.dataset.pulled = String(Number(root.dataset.pulled ?? 0) + 1);
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
		// A peça já fica visível enquanto espera o agente, deslocada por este
		// offset: ele tem de tirar da tela o grupo inteiro, não só a peça principal.
		// Pela foto sozinha, a barra de contato que vinha junto ficava com uma
		// ponta parada na borda até o agente chegar.
		const offset = entryOffset(unionOf(group.map((element) => element.getBoundingClientRect())));
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
			// Escala só quando a peça está de fato escalada: em peças de 1 px (a
			// divisória da barra) o arredondamento dava 0,3 px de desvio do grupo.
			const measured = html.offsetWidth > 0 ? element.getBoundingClientRect().width / html.offsetWidth : 1;
			const scale = Math.abs(measured - 1) < 0.02 ? 1 : measured;
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

	// Peças sozinhas que esperam uma vizinha aparecer, e há quantas checagens.
	let waiting: Element[][] = [];
	const waitedChecks = new WeakMap<Element[], number>();
	// Fração de peça que sobra de uma viagem para a próxima (grupos de 2 e 3 no celular).
	let carry = 0;
	/** Junta, em ordem de leitura, cada grupo às vizinhas coladas que formam um bloco com ele. */
	const bundle = (groups: Element[][]) => {
		const perTrip = globalThis.matchMedia(DESKTOP_QUERY).matches ? DESKTOP_PER_TRIP : MOBILE_PER_TRIP;
		const pool = groups.map((group) => ({ group, box: unionOf(group.map((element) => element.getBoundingClientRect())) }));
		const trips: Element[][] = [];
		const stay: Element[][] = [];
		while (pool.length > 0) {
			const want = Math.floor(carry + perTrip);
			const first = pool.shift()!;
			const members = [first.group];
			let frame = first.box;
			let filled = areaOf(first.box);
			while (members.length < want) {
				let best = -1;
				let bestGap = NEAR_PX;
				for (let index = 0; index < pool.length; index++) {
					const gap = gapOf(frame, pool[index].box);
					if (gap > bestGap) continue;
					if (areaOf(unionOf([frame, pool[index].box])) > TIGHT * (filled + areaOf(pool[index].box))) continue;
					best = index;
					bestGap = gap;
				}
				if (best < 0) break;
				const [next] = pool.splice(best, 1);
				members.push(next.group);
				frame = unionOf([frame, next.box]);
				filled += areaOf(next.box);
			}
			// Sozinha: espera um pouco por uma vizinha que ainda vai ficar pronta.
			const age = waitedChecks.get(first.group) ?? 0;
			if (members.length === 1 && want > 1 && age < LEFTOVER_CHECKS) {
				waitedChecks.set(first.group, age + 1);
				stay.push(first.group);
				continue;
			}
			carry = clamp(carry + perTrip - members.length, 0, 1.99);
			trips.push(members.flat());
		}
		waiting = stay;
		return trips;
	};
	const check = () => {
		if (document.hidden) return;
		// Começa assim que a tela de carregamento começa a subir, sem esperar ela sumir.
		const curtain = document.getElementById("boot-curtain");
		if (curtain && !curtain.hasAttribute("data-lifted")) return;
		rescue();
		if (performance.now() - lastScroll < SCROLL_REST_MS) return;
		const ready = [...document.querySelectorAll(PIECES)].filter((element) => !seen.has(element) && isReady(element));
		if (ready.length === 0 && waiting.length === 0) return;
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
		const left = (group: readonly Element[]) => Math.min(...group.map((element) => element.getBoundingClientRect().left));
		const byReading = (a: Element[], b: Element[]) => top(a) - top(b) || left(a) - left(b);
		// Vizinhas na tela viajam juntas com o mesmo agente.
		const ordered = bundle([...waiting, ...groups.values()].sort(byReading));
		for (const group of ordered) {
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
				// A peça guardada para ganhar par ainda vai receber agente.
				if (waiting.some((group) => group.includes(element))) continue;
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

export { startSwarm };
