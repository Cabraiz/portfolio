import { useEffect, type RefObject } from "react";

/** Balões do ponto ativo: destino no exterior ou ponto do Brasil. */
const ACTIVE_MARKER_SELECTOR =
	"[data-world-journey-destination], [data-mobile-map-marker]";
const CONTROLS_SELECTOR = "[data-mobile-map-controls]";
/** Distância da borda do ponto até o balão (left/right no CSS). */
const JOURNEY_LABEL_OFFSET_PX = 29;
const POINT_LABEL_OFFSET_PX = 26;
const SAFE_GAP_PX = 8;
/** Câmera do atlas (--atlas-camera-duration) + o balão aparecendo. */
const CAMERA_SETTLE_MS = 3600;
/**
 * Intervalo entre medições enquanto a câmera anda. A cada quadro, medir
 * forçava um layout no meio da rolagem (a câmera anda justamente quando o
 * Portfólio entra na tela): ~70 ms de CPU por travessia.
 */
const FOLLOW_INTERVAL_MS = 120;

type Box = Readonly<{ left: number; right: number; top: number; bottom: number }>;

function overlaps(a: Box, b: Box): boolean {
	return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

/**
 * O balão do ponto ativo fica à direita do ponto. Quando ali ele sairia do
 * mapa ou passaria por baixo dos botões de zoom (celular estreito, Fortaleza
 * na borda leste), vira para a esquerda (data-label-side="left").
 * Acompanha a câmera por alguns quadros depois de cada troca de projeto, zoom
 * ou redimensionamento, porque o ponto só para no fim da animação.
 */
export default function useMapLabelSide(
	rootRef: RefObject<HTMLElement | null>,
	activeProjectId: string,
	mapZoom: number,
): void {
	useEffect(() => {
		const root = rootRef.current;
		if (!root) return undefined;

		let frameId = 0;
		let timerId = 0;
		let deadline = 0;
		const stop = () => {
			cancelAnimationFrame(frameId);
			window.clearTimeout(timerId);
		};

		const place = () => {
			// Lê tudo antes de escrever: escrever o atributo de um ponto e medir
			// o próximo forçava um novo layout a cada ponto.
			const sides: Array<[HTMLElement, boolean]> = [];
			for (const marker of root.querySelectorAll<HTMLElement>(ACTIVE_MARKER_SELECTOR)) {
				const label = marker.lastElementChild as HTMLElement | null;
				if (!label) continue;
				const dot = marker.getBoundingClientRect();
				if (dot.width === 0) continue;

				const offset = marker.hasAttribute("data-mobile-map-marker")
					? POINT_LABEL_OFFSET_PX
					: JOURNEY_LABEL_OFFSET_PX;
				const rootBox = root.getBoundingClientRect();
				const limitRight = Math.min(rootBox.right, window.innerWidth) - SAFE_GAP_PX;
				const centerY = dot.top + dot.height / 2;
				const labelTop = centerY - label.offsetHeight / 2;
				const rightSide: Box = {
					left: dot.left + offset,
					right: dot.left + offset + label.offsetWidth,
					top: labelTop,
					bottom: labelTop + label.offsetHeight,
				};

				const controls = root.querySelector<HTMLElement>(CONTROLS_SELECTOR)?.getBoundingClientRect();
				const hitsControls =
					!!controls &&
					controls.width > 0 &&
					overlaps(rightSide, {
						left: controls.left - SAFE_GAP_PX,
						right: controls.right,
						top: controls.top - SAFE_GAP_PX,
						bottom: controls.bottom + SAFE_GAP_PX,
					});
				const leftRoom = dot.right - offset - label.offsetWidth - rootBox.left;
				const flip = (rightSide.right > limitRight || hitsControls) && leftRoom >= SAFE_GAP_PX;

				sides.push([marker, flip]);
			}
			for (const [marker, flip] of sides) {
				if (flip === (marker.dataset.labelSide === "left")) continue;
				if (flip) marker.dataset.labelSide = "left";
				else delete marker.dataset.labelSide;
			}
		};

		const follow = () => {
			place();
			if (performance.now() >= deadline) return;
			timerId = window.setTimeout(() => {
				frameId = requestAnimationFrame(follow);
			}, FOLLOW_INTERVAL_MS);
		};
		const start = () => {
			deadline = performance.now() + CAMERA_SETTLE_MS;
			stop();
			frameId = requestAnimationFrame(follow);
		};

		// No celular a barra de endereço some e volta durante a rolagem e cada
		// vez dispara "resize" só de altura: aí basta reposicionar uma vez (o
		// acompanhamento de 3,6 s mediria a página durante a rolagem).
		let width = window.innerWidth;
		const handleResize = () => {
			if (window.innerWidth !== width) {
				width = window.innerWidth;
				start();
				return;
			}
			if (performance.now() >= deadline) {
				stop();
				frameId = requestAnimationFrame(place);
			}
		};

		start();
		window.addEventListener("resize", handleResize);
		return () => {
			stop();
			window.removeEventListener("resize", handleResize);
		};
	}, [rootRef, activeProjectId, mapZoom]);
}
