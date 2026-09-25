import React, { useEffect, useMemo, useRef, useState } from "react";

import {
	COGNITIVE_VIEW_OPTIONS,
	type CognitiveViewMode,
} from "./cognitiveNetwork.data";
import styles from "./CognitiveNetwork.module.css";

type Particle = Readonly<{
	theta: number;
	phi: number;
	noise: number;
	size: number;
	spike: number;
}>;

type ProjectedParticle = Readonly<{
	id: number;
	x: number;
	y: number;
	depth: number;
	size: number;
	spike: number;
	hue: number;
	alpha: number;
	activity: number;
}>;

type PointerState = {
	x: number;
	y: number;
	active: boolean;
};

type ThoughtStep = Readonly<{
	verb: string;
	target: string;
	result: string;
}>;

const TAU = Math.PI * 2;

const MODE_READOUT: Readonly<
	Record<
		CognitiveViewMode,
		Readonly<{
			label: string;
			status: string;
			cycle: string;
			latency: string;
			density: string;
			confidence: string;
			phase: number;
			hueShift: number;
		}>
	>
> = {
	neural: {
		label: "ATIVIDADE DO CÉREBRO",
		status: "ESCOLHENDO UM CAMINHO",
		cycle: "09-C417",
		latency: "8.42 MS",
		density: "92.6%",
		confidence: "0.947",
		phase: 0,
		hueShift: 0,
	},
	pipeline: {
		label: "CAMINHO DA RESPOSTA",
		status: "JUNTANDO INFORMAÇÕES",
		cycle: "11-F280",
		latency: "11.08 MS",
		density: "87.4%",
		confidence: "0.923",
		phase: 0.8,
		hueShift: 34,
	},
	memory: {
		label: "LEMBRANÇAS ATIVAS",
		status: "BUSCANDO LEMBRANÇAS",
		cycle: "04-A912",
		latency: "6.93 MS",
		density: "96.1%",
		confidence: "0.971",
		phase: 1.6,
		hueShift: -24,
	},
};

const SIGNALS = [
	[12, 20, 15, 27, 18, 29, 24, 36, 28, 41, 33, 44, 38, 53, 47, 58],
	[52, 44, 49, 37, 43, 32, 39, 26, 34, 22, 29, 18, 25, 14, 22, 10],
	[18, 25, 20, 31, 26, 42, 34, 47, 41, 55, 45, 61, 53, 68, 57, 72],
] as const;

const THOUGHT_STEPS: Readonly<
	Record<CognitiveViewMode, readonly ThoughtStep[]>
> = {
	neural: [
		{ verb: "ENTENDER", target: "PEDIDO RECEBIDO", result: "ENTENDIDO" },
		{ verb: "IMAGINAR", target: "CAMINHOS POSSÍVEIS", result: "12 IDEIAS" },
		{ verb: "LEMBRAR", target: "EXPERIÊNCIAS ÚTEIS", result: "48 LEMBRANÇAS" },
		{ verb: "COMPARAR", target: "MELHOR OPÇÃO", result: "95% SEGURA" },
		{ verb: "DECIDIR", target: "PRÓXIMA AÇÃO", result: "ESCOLHIDA" },
	],
	pipeline: [
		{ verb: "LER", target: "PEDIDO E CONTEXTO", result: "6 PARTES" },
		{ verb: "BUSCAR", target: "INFORMAÇÕES ÚTEIS", result: "31 ENCONTRADAS" },
		{ verb: "SEPARAR", target: "MELHORES FONTES", result: "8 USADAS" },
		{ verb: "JUNTAR", target: "INFORMAÇÕES", result: "PRONTO" },
		{ verb: "MONTAR", target: "RESPOSTA FINAL", result: "EM CURSO" },
	],
	memory: [
		{ verb: "PROCURAR", target: "LEMBRANÇAS RELACIONADAS", result: "96%" },
		{ verb: "ENCONTRAR", target: "CASOS PARECIDOS", result: "24 ITENS" },
		{ verb: "PRIORIZAR", target: "MAIS RECENTES", result: "87%" },
		{ verb: "CONECTAR", target: "LEMBRANÇAS", result: "4 GRUPOS" },
		{ verb: "DEVOLVER", target: "CONTEXTO ÚTIL", result: "PRONTO" },
	],
};

function seededNoise(index: number, salt: number): number {
	const value = Math.sin(index * 91.733 + salt * 17.17) * 43758.5453;
	return value - Math.floor(value);
}

function buildParticles(): readonly Particle[] {
	return Array.from({ length: 1120 }, (_, index) => ({
		theta: seededNoise(index, 1) * TAU,
		phi: seededNoise(index, 2) * TAU,
		noise: seededNoise(index, 3),
		size: 0.45 + seededNoise(index, 4) * 1.55,
		spike: index % 7 === 0 ? 0.18 + seededNoise(index, 5) * 0.72 : 0,
	}));
}

function signalPath(values: readonly number[]): string {
	return values
		.map((value, index) => {
			const x = (index / (values.length - 1)) * 100;
			const y = 82 - value;
			return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
		})
		.join(" ");
}

const NeuralCoreCanvas: React.FC<{ mode: CognitiveViewMode }> = ({ mode }) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const pointerRef = useRef<PointerState>({ x: 0, y: 0, active: false });
	const particles = useMemo(buildParticles, []);
	const updatePointer = (event: React.PointerEvent<HTMLCanvasElement>) => {
		const bounds = event.currentTarget.getBoundingClientRect();
		pointerRef.current = {
			x: event.clientX - bounds.left,
			y: event.clientY - bounds.top,
			active: true,
		};
		event.currentTarget.dataset.pointerActive = "true";
		event.currentTarget.dataset.lastPointerType = event.pointerType;
	};
	const deactivatePointer = (element: HTMLCanvasElement) => {
		pointerRef.current.active = false;
		element.dataset.pointerActive = "false";
	};

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return undefined;
		const context = canvas.getContext("2d");
		if (!context) return undefined;

		let width = 0;
		let height = 0;
		let animationFrame = 0;
		let stopped = false;
		const reducedMotion = window.matchMedia(
			"(prefers-reduced-motion: reduce)"
		).matches;
		const readout = MODE_READOUT[mode];

		const resize = () => {
			const bounds = canvas.getBoundingClientRect();
			const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
			width = Math.max(1, bounds.width);
			height = Math.max(1, bounds.height);
			canvas.width = Math.round(width * pixelRatio);
			canvas.height = Math.round(height * pixelRatio);
			context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
		};

		const render = (timestamp: number) => {
			if (stopped) return;
			const time = reducedMotion ? 4.2 : timestamp * 0.00034;
			context.clearRect(0, 0, width, height);
			const centerX = width * (width < 700 ? 0.5 : 0.47);
			const centerY = height * 0.51;
			const scale = Math.min(width, height) * 0.255;
			const pointer = pointerRef.current;
			const pointerInfluenceX = pointer.active
				? (pointer.x / width - 0.5) * 2
				: 0;
			const pointerInfluenceY = pointer.active
				? (pointer.y / height - 0.5) * 2
				: 0;
			const pitch =
				(mode === "pipeline" ? 0.04 : mode === "memory" ? -0.24 : -0.1) +
				Math.sin(time * 0.72) * 0.035 +
				pointerInfluenceY * 0.13;
			const yaw =
				(mode === "memory" ? -0.34 : mode === "pipeline" ? 0.34 : 0.48) +
				Math.cos(time * 0.54) * 0.035 +
				pointerInfluenceX * 0.22;
			const roll =
				(mode === "pipeline" ? -0.08 : mode === "memory" ? 0.12 : -0.12) +
				Math.sin(time * 0.38) * 0.025;
			const projected: ProjectedParticle[] = [];
			const projectPoint = (x: number, y: number, z: number) => {
				const tiltedY = y * Math.cos(pitch) - z * Math.sin(pitch);
				const tiltedZ = y * Math.sin(pitch) + z * Math.cos(pitch);
				const rotatedX = x * Math.cos(yaw) + tiltedZ * Math.sin(yaw);
				const rotatedZ = -x * Math.sin(yaw) + tiltedZ * Math.cos(yaw);
				const screenX = rotatedX * Math.cos(roll) - tiltedY * Math.sin(roll);
				const screenY = rotatedX * Math.sin(roll) + tiltedY * Math.cos(roll);
				const perspective = 1 / (1.18 - rotatedZ * 0.17);

				return {
					x: centerX + screenX * scale * perspective,
					y: centerY + screenY * scale * perspective,
					depth: rotatedZ,
					perspective,
				};
			};

			for (const [particleIndex, particle] of particles.entries()) {
				const hemisphere = particleIndex % 2 === 0 ? -1 : 1;
				const longitude = (particle.theta / TAU - 0.5) * Math.PI;
				const latitude = (particle.phi / TAU - 0.5) * Math.PI;
				const cosLatitude = Math.cos(latitude);
				const fold =
					Math.sin(longitude * 6 + latitude * 7 + particle.noise * 5) * 0.085 +
					Math.sin(longitude * 11 - latitude * 4) * 0.035;
				const breathing =
					1 + Math.sin(time * 2.1 + particle.noise * TAU) * 0.012;
				const lowerTaper = 1 - Math.max(0, Math.sin(-latitude)) * 0.14;
				const surface = (1 + fold) * breathing;
				const x =
					hemisphere *
					(0.1 + cosLatitude * Math.cos(longitude) * 0.78) *
					surface *
					lowerTaper;
				const y = Math.sin(latitude) * 0.86 * surface;
				const z = cosLatitude * Math.sin(longitude) * 0.72 * surface;
				const point3d = projectPoint(x, y, z);
				const activity = Math.pow(
					Math.max(0, Math.sin(longitude * 5 - time * 15 + particle.phi * 0.6)),
					10
				);
				projected.push({
					id: particleIndex,
					x: point3d.x,
					y: point3d.y,
					depth: point3d.depth,
					size: particle.size * point3d.perspective * (1 + activity * 2.6),
					spike:
						particle.spike * (0.76 + point3d.perspective * 0.4) +
						activity * 0.38,
					hue:
						(hemisphere < 0 ? 309 : 332) +
						readout.hueShift * 0.24 +
						z * 12 -
						activity * 44,
					alpha: 0.34 + point3d.perspective * 0.4 + activity * 0.34,
					activity,
				});
			}

			const projectedById = [...projected];
			projected.sort((a, b) => a.depth - b.depth);
			const ringConfigurations = [
				{ radius: 1.56, tiltX: 0.52, tiltY: 0.16, tiltZ: -0.18, hue: 322 },
				{ radius: 1.78, tiltX: 1.04, tiltY: -0.42, tiltZ: 0.34, hue: 192 },
				{ radius: 1.96, tiltX: 0.24, tiltY: 0.72, tiltZ: 0.78, hue: 286 },
			] as const;
			const orbitalRings = ringConfigurations.map((ring, ringIndex) => ({
				...ring,
				ringIndex,
				points: Array.from({ length: 181 }, (_, pointIndex) => {
					const angle = (pointIndex / 180) * TAU;
					const orbitX = Math.cos(angle) * ring.radius;
					const orbitY = Math.sin(angle) * ring.radius;
					const tiltedOrbitY = orbitY * Math.cos(ring.tiltX);
					const tiltedOrbitZ = orbitY * Math.sin(ring.tiltX);
					const yawedOrbitX =
						orbitX * Math.cos(ring.tiltY) + tiltedOrbitZ * Math.sin(ring.tiltY);
					const yawedOrbitZ =
						-orbitX * Math.sin(ring.tiltY) +
						tiltedOrbitZ * Math.cos(ring.tiltY);
					const spunOrbitX =
						yawedOrbitX * Math.cos(ring.tiltZ) -
						tiltedOrbitY * Math.sin(ring.tiltZ);
					const spunOrbitY =
						yawedOrbitX * Math.sin(ring.tiltZ) +
						tiltedOrbitY * Math.cos(ring.tiltZ);
					return {
						...projectPoint(spunOrbitX, spunOrbitY, yawedOrbitZ),
						angle,
						ringIndex,
					};
				}),
			}));
			context.save();
			context.globalCompositeOperation = "lighter";
			const brainGlow = context.createRadialGradient(
				centerX,
				centerY,
				0,
				centerX,
				centerY,
				scale * 1.15
			);
			brainGlow.addColorStop(0, "rgba(255, 42, 166, 0.2)");
			brainGlow.addColorStop(0.45, "rgba(130, 53, 220, 0.08)");
			brainGlow.addColorStop(1, "rgba(9, 10, 28, 0)");
			context.fillStyle = brainGlow;
			context.beginPath();
			context.arc(centerX, centerY, scale * 1.15, 0, TAU);
			context.fill();

			for (const ring of orbitalRings) {
				context.strokeStyle = `hsla(${ring.hue}, 100%, 70%, 0.2)`;
				context.lineWidth = 0.75;
				context.beginPath();
				ring.points.forEach((point, pointIndex) => {
					if (pointIndex === 0) context.moveTo(point.x, point.y);
					else context.lineTo(point.x, point.y);
				});
				context.stroke();
			}

			context.save();
			context.translate(centerX, centerY);
			context.rotate(roll + yaw * 0.1);
			const brainSurface = context.createRadialGradient(
				-scale * 0.2,
				-scale * 0.28,
				scale * 0.04,
				0,
				0,
				scale * 1.08
			);
			brainSurface.addColorStop(0, "rgba(255, 104, 207, 0.28)");
			brainSurface.addColorStop(0.52, "rgba(159, 30, 132, 0.2)");
			brainSurface.addColorStop(1, "rgba(45, 12, 67, 0.08)");
			context.fillStyle = brainSurface;
			context.strokeStyle = "rgba(255, 107, 207, 0.38)";
			context.lineWidth = 1.1;

			for (const side of [-1, 1] as const) {
				context.beginPath();
				context.moveTo(side * scale * 0.055, -scale * 0.76);
				context.bezierCurveTo(
					side * scale * 0.25,
					-scale * 0.94,
					side * scale * 0.61,
					-scale * 0.82,
					side * scale * 0.66,
					-scale * 0.59
				);
				context.bezierCurveTo(
					side * scale * 0.91,
					-scale * 0.53,
					side * scale * 0.98,
					-scale * 0.2,
					side * scale * 0.84,
					-scale * 0.02
				);
				context.bezierCurveTo(
					side * scale * 0.98,
					scale * 0.19,
					side * scale * 0.8,
					scale * 0.45,
					side * scale * 0.61,
					scale * 0.47
				);
				context.bezierCurveTo(
					side * scale * 0.53,
					scale * 0.74,
					side * scale * 0.22,
					scale * 0.8,
					side * scale * 0.055,
					scale * 0.61
				);
				context.closePath();
				context.fill();
				context.stroke();
			}

			context.strokeStyle = "rgba(255, 132, 216, 0.24)";
			context.lineWidth = 1;
			for (const side of [-1, 1] as const) {
				for (let foldIndex = 0; foldIndex < 5; foldIndex += 1) {
					const foldY = scale * (-0.56 + foldIndex * 0.27);
					context.beginPath();
					context.moveTo(side * scale * 0.13, foldY);
					context.bezierCurveTo(
						side * scale * (0.36 + (foldIndex % 2) * 0.1),
						foldY - scale * 0.14,
						side * scale * 0.74,
						foldY + scale * 0.05,
						side * scale * (0.5 + (foldIndex % 3) * 0.08),
						foldY + scale * 0.17
					);
					context.stroke();
				}
			}
			context.restore();

			const thoughtPhase = Math.floor(time * 2.35 + readout.phase * 3);
			for (let routeIndex = 0; routeIndex < 18; routeIndex += 1) {
				const sourceId =
					(thoughtPhase * 47 +
						routeIndex * 61 +
						Math.round(readout.phase * 100)) %
					projectedById.length;
				const source = projectedById[sourceId];
				let target = projectedById[(sourceId + 1) % projectedById.length];
				let targetDistance = Number.POSITIVE_INFINITY;

				for (let offset = 17; offset < 170; offset += 17) {
					const candidate =
						projectedById[(sourceId + offset) % projectedById.length];
					const distance = Math.hypot(
						candidate.x - source.x,
						candidate.y - source.y
					);
					if (distance > scale * 0.22 && distance < targetDistance) {
						target = candidate;
						targetDistance = distance;
					}
				}

				if (targetDistance > scale * 1.35) continue;
				const routeHue = (source.hue + target.hue) / 2;
				const controlX =
					(source.x + target.x) / 2 + (target.y - source.y) * 0.12;
				const controlY =
					(source.y + target.y) / 2 - (target.x - source.x) * 0.12;
				const travel = (time * 2.7 + routeIndex * 0.071) % 1;
				const inverseTravel = 1 - travel;
				const pulseX =
					inverseTravel * inverseTravel * source.x +
					2 * inverseTravel * travel * controlX +
					travel * travel * target.x;
				const pulseY =
					inverseTravel * inverseTravel * source.y +
					2 * inverseTravel * travel * controlY +
					travel * travel * target.y;

				context.strokeStyle = `hsla(${routeHue}, 100%, 66%, 0.12)`;
				context.lineWidth = 0.55;
				context.beginPath();
				context.moveTo(source.x, source.y);
				context.quadraticCurveTo(controlX, controlY, target.x, target.y);
				context.stroke();
				context.fillStyle = `hsla(${routeHue}, 100%, 78%, 0.95)`;
				context.shadowColor = `hsla(${routeHue}, 100%, 68%, 0.9)`;
				context.shadowBlur = 8;
				context.beginPath();
				context.arc(pulseX, pulseY, 1.5 + source.activity * 1.8, 0, TAU);
				context.fill();
				context.shadowBlur = 0;
			}

			for (const point of projected) {
				const dx = point.x - centerX;
				const dy = point.y - centerY;
				if (point.activity > 0.16) {
					context.fillStyle = `hsla(${point.hue}, 100%, 68%, ${
						point.activity * 0.16
					})`;
					context.beginPath();
					context.arc(
						point.x,
						point.y,
						point.size * (2.4 + point.activity * 1.6),
						0,
						TAU
					);
					context.fill();
				}
				if (point.spike > 0) {
					const extension = 1 + point.spike * 0.22;
					const gradient = context.createLinearGradient(
						point.x,
						point.y,
						centerX + dx * extension,
						centerY + dy * extension
					);
					gradient.addColorStop(0, `hsla(${point.hue}, 95%, 68%, 0.34)`);
					gradient.addColorStop(1, `hsla(${point.hue}, 95%, 68%, 0)`);
					context.strokeStyle = gradient;
					context.lineWidth = Math.max(0.35, point.size * 0.42);
					context.beginPath();
					context.moveTo(point.x, point.y);
					context.lineTo(centerX + dx * extension, centerY + dy * extension);
					context.stroke();
				}

				context.fillStyle = `hsla(${point.hue}, 100%, 72%, ${Math.min(
					0.96,
					point.alpha
				)})`;
				context.beginPath();
				context.arc(point.x, point.y, point.size, 0, TAU);
				context.fill();
			}

			for (const ring of orbitalRings) {
				context.strokeStyle = `hsla(${ring.hue}, 100%, 76%, 0.46)`;
				context.lineWidth = 1.05;
				context.beginPath();
				let drawingForeground = false;
				for (const point of ring.points) {
					if (point.depth > 0.08) {
						if (!drawingForeground) context.moveTo(point.x, point.y);
						else context.lineTo(point.x, point.y);
						drawingForeground = true;
					} else {
						drawingForeground = false;
					}
				}
				context.stroke();

				const satelliteIndex =
					Math.floor(
						(((time * (31 + ring.ringIndex * 7) + ring.ringIndex * 53) % 180) +
							180) %
							180
					) % ring.points.length;
				const satellite = ring.points[satelliteIndex];
				context.shadowColor = `hsla(${ring.hue}, 100%, 72%, 0.95)`;
				context.shadowBlur = 11;
				context.fillStyle = `hsla(${ring.hue}, 100%, 82%, 0.98)`;
				context.beginPath();
				context.arc(satellite.x, satellite.y, 2.4, 0, TAU);
				context.fill();
				context.shadowBlur = 0;
			}
			context.restore();

			context.save();
			context.translate(centerX, centerY);
			context.rotate(roll + yaw * 0.16);
			context.strokeStyle = "rgba(0, 2, 10, 0.88)";
			context.lineWidth = Math.max(3, scale * 0.038);
			context.beginPath();
			context.moveTo(-scale * 0.025, -scale * 0.72);
			context.bezierCurveTo(
				scale * 0.08,
				-scale * 0.26,
				-scale * 0.08,
				scale * 0.24,
				scale * 0.02,
				scale * 0.72
			);
			context.stroke();
			context.strokeStyle = "rgba(255, 111, 205, 0.22)";
			context.lineWidth = 0.8;
			context.stroke();
			context.restore();

			if (pointer.active) {
				const interactionRadius = Math.min(width, height) * 0.29;
				const neighbors = projected
					.map((point) => ({
						point,
						distance: Math.hypot(point.x - pointer.x, point.y - pointer.y),
					}))
					.filter(({ distance }) => distance < interactionRadius)
					.sort((left, right) => left.distance - right.distance)
					.slice(0, 20);

				context.save();
				context.globalCompositeOperation = "lighter";
				for (const { point, distance } of neighbors) {
					const strength = 1 - distance / interactionRadius;
					const connectionGradient = context.createLinearGradient(
						pointer.x,
						pointer.y,
						point.x,
						point.y
					);
					connectionGradient.addColorStop(
						0,
						`hsla(${point.hue}, 100%, 76%, ${0.5 * strength})`
					);
					connectionGradient.addColorStop(
						1,
						`hsla(${point.hue}, 100%, 68%, ${0.1 + 0.7 * strength})`
					);
					context.strokeStyle = connectionGradient;
					context.lineWidth = 0.45 + strength * 1.35;
					context.beginPath();
					context.moveTo(pointer.x, pointer.y);
					context.quadraticCurveTo(
						(pointer.x + point.x) / 2 + (point.y - pointer.y) * 0.08,
						(pointer.y + point.y) / 2 - (point.x - pointer.x) * 0.08,
						point.x,
						point.y
					);
					context.stroke();
				}

				for (
					let index = 1;
					index < Math.min(neighbors.length, 10);
					index += 1
				) {
					const previous = neighbors[index - 1].point;
					const current = neighbors[index].point;
					context.strokeStyle = `hsla(${current.hue}, 100%, 70%, 0.2)`;
					context.lineWidth = 0.55;
					context.beginPath();
					context.moveTo(previous.x, previous.y);
					context.lineTo(current.x, current.y);
					context.stroke();
				}

				context.strokeStyle = "rgba(121, 245, 255, 0.82)";
				context.lineWidth = 1;
				context.beginPath();
				context.arc(pointer.x, pointer.y, 8 + Math.sin(time * 12) * 2, 0, TAU);
				context.stroke();
				context.fillStyle = "rgba(233, 253, 255, 0.92)";
				context.beginPath();
				context.arc(pointer.x, pointer.y, 1.8, 0, TAU);
				context.fill();
				context.restore();
			}

			if (!reducedMotion) animationFrame = requestAnimationFrame(render);
		};

		const resizeObserver = new ResizeObserver(() => {
			resize();
			if (reducedMotion) render(0);
		});
		resizeObserver.observe(canvas);
		resize();
		animationFrame = requestAnimationFrame(render);

		return () => {
			stopped = true;
			resizeObserver.disconnect();
			cancelAnimationFrame(animationFrame);
		};
	}, [mode, particles]);

	return (
		<canvas
			ref={canvasRef}
			className={styles.coreCanvas}
			data-cognitive-core-canvas="true"
			data-cognitive-form="brain-orbits"
			data-pointer-active="false"
			data-last-pointer-type="none"
			aria-label="Cérebro artificial 3D com anéis orbitais; mova o mouse ou o dedo para revelar conexões"
			role="img"
			onPointerEnter={updatePointer}
			onPointerMove={updatePointer}
			onPointerDown={(event) => {
				event.currentTarget.setPointerCapture(event.pointerId);
				updatePointer(event);
			}}
			onPointerUp={(event) => {
				if (event.currentTarget.hasPointerCapture(event.pointerId)) {
					event.currentTarget.releasePointerCapture(event.pointerId);
				}
				if (event.pointerType !== "mouse") {
					deactivatePointer(event.currentTarget);
				}
			}}
			onPointerCancel={(event) => deactivatePointer(event.currentTarget)}
			onPointerLeave={(event) => deactivatePointer(event.currentTarget)}
		/>
	);
};

const CognitiveNetwork: React.FC = () => {
	const [viewMode, setViewMode] = useState<CognitiveViewMode>("neural");
	const [telemetryTick, setTelemetryTick] = useState(0);
	const readout = MODE_READOUT[viewMode];
	const thoughtSteps = THOUGHT_STEPS[viewMode];
	const thoughtIndex = telemetryTick % thoughtSteps.length;
	const currentThought = thoughtSteps[thoughtIndex];
	const liveConfidence = (
		Number(readout.confidence) +
		Math.sin(telemetryTick * 0.73) * 0.012
	).toFixed(3);
	const liveLatency = (
		Number.parseFloat(readout.latency) +
		Math.cos(telemetryTick * 0.61) * 0.84
	).toFixed(2);
	const liveDensity = (
		Number.parseFloat(readout.density) +
		Math.sin(telemetryTick * 0.47) * 1.6
	).toFixed(1);
	const liveSignals = [
		(356 + Math.sin(telemetryTick * 0.57) * 18.4).toFixed(1),
		Math.round(108 + Math.cos(telemetryTick * 0.41) * 11).toString(),
		(3.2 + Math.sin(telemetryTick * 0.83) * 0.7).toFixed(1),
	];

	useEffect(() => {
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			return undefined;
		}

		const intervalId = window.setInterval(() => {
			setTelemetryTick((current) => current + 1);
		}, 420);

		return () => window.clearInterval(intervalId);
	}, []);

	return (
		<section
			className={styles.section}
			aria-labelledby="cognitive-network-title"
			data-cognitive-network-root="true"
			data-cognitive-view={viewMode}
			data-cognitive-thinking="active"
			data-thought-phase={currentThought.verb.toLowerCase()}
		>
			<h2 id="cognitive-network-title" className={styles.srOnly}>
				Cérebro artificial em funcionamento
			</h2>
			<div className={styles.scanline} aria-hidden="true" />

			<header className={styles.commandBar}>
				<div className={styles.commandIdentity}>
					<span>CÉREBRO ARTIFICIAL EM ATIVIDADE</span>
					<i aria-hidden="true" />
					<span>CICLO 24C</span>
					<strong>ETAPA 37</strong>
				</div>

				<div
					className={styles.viewSelector}
					role="tablist"
					aria-label="Formas de acompanhar o pensamento"
				>
					{COGNITIVE_VIEW_OPTIONS.map((option) => (
						<button
							key={option.id}
							type="button"
							className={styles.viewButton}
							role="tab"
							aria-selected={viewMode === option.id}
							title={option.description}
							onClick={() => setViewMode(option.id)}
						>
							{option.label}
						</button>
					))}
				</div>

				<div className={styles.clockReadout}>
					<span>
						GIRO {(44.2 + Math.sin(telemetryTick * 0.4) * 2.3).toFixed(1)}°
					</span>
					<span>
						INCLINAÇÃO {(38.6 + Math.cos(telemetryTick * 0.3) * 1.7).toFixed(1)}
						°
					</span>
					<strong>CONEXÕES 2,5 MIL</strong>
				</div>
			</header>

			<div className={styles.workspace}>
				<div className={styles.graphPanel} data-cognitive-graph="true">
					<div className={styles.graphGrid} aria-hidden="true" />
					<NeuralCoreCanvas mode={viewMode} />

					<div className={styles.axisLabels} aria-hidden="true">
						<span className={styles.axisY}>NÍVEL DE ATIVAÇÃO</span>
						<span className={styles.axisX}>POSSÍVEIS CAMINHOS</span>
					</div>

					<div className={styles.routeCard} aria-hidden="true">
						<span>{currentThought.verb} · PENSAMENTO ATUAL</span>
						<strong>
							{currentThought.target} → {currentThought.result}
						</strong>
						<small>
							etapa {thoughtIndex + 1} de 5 · {liveLatency} MS
						</small>
					</div>

					<div className={styles.thoughtLog} aria-hidden="true">
						<header>
							<span>// RACIOCÍNIO AGORA</span>
							<strong>{String(telemetryTick + 8211).padStart(6, "0")}</strong>
						</header>
						{thoughtSteps.map((step, index) => (
							<div
								key={`${step.verb}-${step.target}`}
								className={
									index === thoughtIndex ? styles.activeThought : undefined
								}
							>
								<i>{String(index + 1).padStart(2, "0")}</i>
								<span>
									{step.verb.toLowerCase()} · {step.target.toLowerCase()}
								</span>
								<strong>
									{index <= thoughtIndex ? step.result : "AGUARDA"}
								</strong>
							</div>
						))}
					</div>

					<div className={styles.scoreTag} aria-hidden="true">
						CERTEZA {liveDensity}%
					</div>

					<div className={styles.coreCaption}>
						<span className={styles.thinkingStatus}>
							<i aria-hidden="true" /> PENSANDO · {readout.status}
						</span>
						<strong>CÉREBRO ARTIFICIAL</strong>
						<small>SIMULAÇÃO VISUAL AO VIVO · MEMÓRIA + CONTEXTO</small>
						<small className={styles.interactionHint}>
							MOUSE / TOQUE · EXPLORE AS CONEXÕES
						</small>
					</div>
				</div>

				<aside
					className={styles.inspector}
					aria-live="polite"
					data-cognitive-inspector="true"
				>
					<div className={styles.inspectorTitle}>
						<span>{readout.label}</span>
						<strong>{liveLatency} MS</strong>
					</div>

					<div className={styles.signalStack}>
						{SIGNALS.map((values, index) => (
							<div className={styles.signalChart} key={values.join("-")}>
								<span>
									{["DECISÕES / S", "IDEIAS ATIVAS", "REVISÕES / S"][index]}
								</span>
								<strong>{liveSignals[index]}</strong>
								<svg
									viewBox="0 0 100 86"
									preserveAspectRatio="none"
									aria-hidden="true"
								>
									<path
										d={signalPath(values)}
										className={styles[`signalLine${index + 1}`]}
									/>
								</svg>
							</div>
						))}
					</div>

					<div className={styles.histogramPanel}>
						<div className={styles.panelLabel}>
							<span>LEMBRANÇAS ENCONTRADAS · 48</span>
							<strong>FILTRO 85%</strong>
						</div>
						<div className={styles.histogram} aria-hidden="true">
							{Array.from({ length: 14 }, (_, index) => (
								<i
									key={index}
									style={
										{
											"--bar-width": `${24 + ((index * 31) % 72)}%`,
											"--bar-index": index,
										} as React.CSSProperties
									}
								/>
							))}
						</div>
					</div>

					<div className={styles.splitPanel}>
						<div className={styles.panelLabel}>
							<span>TEMPO · CRIAR / DECIDIR / RESPONDER</span>
							<strong>AÇÃO 17%</strong>
						</div>
						<div className={styles.splitBar} aria-hidden="true">
							<i />
							<i />
							<i />
						</div>
					</div>

					<div className={styles.readoutPanel}>
						<span>PENSAMENTO ATUAL</span>
						<dl>
							<div>
								<dt>ETAPA</dt>
								<dd>{readout.cycle}</dd>
							</div>
							<div>
								<dt>FOCO</dt>
								<dd>IDEIA CENTRAL</dd>
							</div>
							<div>
								<dt>CERTEZA</dt>
								<dd>{liveConfidence}</dd>
							</div>
							<div>
								<dt>TEMPO DE RESPOSTA</dt>
								<dd>{liveLatency} MS</dd>
							</div>
							<div>
								<dt>AÇÃO AUTOMÁTICA</dt>
								<dd>NÃO</dd>
							</div>
						</dl>
					</div>

					<div className={styles.statusKey}>
						<span>
							<i /> ESCOLHA
						</span>
						<span>
							<i /> CERTEZA
						</span>
						<span>
							<i /> IDEIA
						</span>
						<span>
							<i /> EM ESPERA
						</span>
					</div>
				</aside>
			</div>

			<footer className={styles.timeline}>
				<div className={styles.timelineLabels}>
					<span>ENTENDER</span>
					<span>DECIDIR</span>
				</div>
				<svg
					viewBox="0 0 1200 46"
					preserveAspectRatio="none"
					aria-hidden="true"
				>
					<path
						className={styles.timelineViolet}
						d="M0 31 C95 12 135 39 218 22 S366 12 454 29 S620 40 708 19 S862 9 946 27 S1088 39 1200 17 L1200 46 L0 46 Z"
					/>
					<path
						className={styles.timelineCyan}
						d="M0 39 C94 27 169 43 254 30 S402 18 486 36 S639 40 732 28 S885 22 968 37 S1104 42 1200 29 L1200 46 L0 46 Z"
					/>
					<path
						className={styles.timelineGold}
						d="M0 43 C103 36 187 45 281 39 S449 34 535 42 S702 45 788 37 S945 34 1034 42 S1131 44 1200 38 L1200 46 L0 46 Z"
					/>
				</svg>
				<span className={styles.simulationNote}>
					SIMULAÇÃO VISUAL DO CÉREBRO ARTIFICIAL
				</span>
			</footer>
		</section>
	);
};

export default CognitiveNetwork;
