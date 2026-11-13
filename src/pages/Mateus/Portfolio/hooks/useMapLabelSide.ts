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
		let deadline = 0;

		const place = () => {
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

				if (flip) marker.dataset.labelSide = "left";
				else delete marker.dataset.labelSide;
			}
		};

		const follow = () => {
			place();
			if (performance.now() < deadline) frameId = requestAnimationFrame(follow);
		};
		const start = () => {
			deadline = performance.now() + CAMERA_SETTLE_MS;
			cancelAnimationFrame(frameId);
			frameId = requestAnimationFrame(follow);
		};

		start();
		window.addEventListener("resize", start);
		return () => {
			cancelAnimationFrame(frameId);
			window.removeEventListener("resize", start);
		};
	}, [rootRef, activeProjectId, mapZoom]);
}
