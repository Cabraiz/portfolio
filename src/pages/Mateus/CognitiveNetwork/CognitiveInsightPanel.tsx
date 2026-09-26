import React, { useEffect, useMemo, useRef } from "react";

import type { CognitiveViewMode } from "./cognitiveNetwork.data";
import styles from "./CognitiveNetwork.module.css";

type CognitiveInsightPanelProps = Readonly<{
	mode: CognitiveViewMode;
	tick: number;
}>;

export const COGNITIVE_UPDATE_INTERVAL_MS = 1000;

const ATTENTION_BASE_LINK_COUNT = 72;
const ATTENTION_WIRE_MULTIPLIER = 5;
const ATTENTION_LINK_COUNT =
	ATTENTION_BASE_LINK_COUNT * ATTENTION_WIRE_MULTIPLIER;
const ATTENTION_WIRE_DESTINATION_MS = 9000;
const ATTENTION_WIRE_FRAME_INTERVAL_MS = 1000 / 24;
const LATENT_VISIBLE_POINT_COUNT = 96;

type AttentionWire = Readonly<{
	id: number;
	layer: number;
	color: string;
	startAngle: number;
	endAngle: number;
	controlRadius: number;
	controlAngle: number;
	motionSeed: number;
}>;

const ATTENTION_LABELS = [
	"Texto",
	"Visão",
	"Código",
	"Memória",
	"Raciocínio",
	"Outros",
] as const;

const ATTENTION_COLORS = [
	"#188ff2",
	"#27c3f3",
	"#f2e9c8",
	"#62d8df",
	"#c16bf2",
	"#718bea",
] as const;

const RADAR_LABELS = [
	"Raciocínio",
	"Memória",
	"Criatividade",
	"Percepção",
	"Estabilidade",
] as const;

const MODE_SEED: Record<CognitiveViewMode, number> = {
	neural: 0x9e3779b9,
	pipeline: 0x7f4a7c15,
	memory: 0x94d049bb,
};

function sequenceValueAtFrame(tick: number, index: number, seed: number): number {
	let value = (Math.imul(tick + 1, 0x45d9f3b) ^ Math.imul(index + 7, 0x27d4eb2d) ^ seed) >>> 0;
	value ^= value << 13;
	value ^= value >>> 17;
	value ^= value << 5;
	return (value >>> 0) / 0xffffffff;
}

function sequenceValue(tick: number, index: number, seed: number): number {
	const startFrame = Math.floor(tick);
	const progress = tick - startFrame;
	const startValue = sequenceValueAtFrame(startFrame, index, seed);

	if (progress <= 0) {
		return startValue;
	}

	const endValue = sequenceValueAtFrame(startFrame + 1, index, seed);
	const easedProgress = progress * progress * (3 - 2 * progress);
	return startValue + (endValue - startValue) * easedProgress;
}

type AnimatedIntegerProps = Readonly<{
	value: number;
	suffix?: string;
}>;

const AnimatedInteger: React.FC<AnimatedIntegerProps> = ({ value, suffix = "" }) => {
	const displayedValueRef = useRef(value);
	const elementRef = useRef<HTMLSpanElement>(null);

	useEffect(() => {
		const renderValue = (nextValue: number) => {
			const element = elementRef.current;
			if (!element) return;
			element.dataset.currentValue = String(nextValue);
			element.textContent = `${formatInteger(nextValue)}${suffix}`;
		};

		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			displayedValueRef.current = value;
			renderValue(value);
			return undefined;
		}

		const startValue = displayedValueRef.current;
		const difference = value - startValue;
		const startedAt = performance.now();
		const durationMs = 900;

		const renderFrame = () => {
			const now = performance.now();
			const progress = clamp((now - startedAt) / durationMs, 0, 1);
			const easedProgress = progress * progress * (3 - 2 * progress);
			const nextValue = Math.round(startValue + difference * easedProgress);

			if (nextValue !== displayedValueRef.current) {
				displayedValueRef.current = nextValue;
				renderValue(nextValue);
			}

			if (progress >= 1) window.clearInterval(intervalId);
		};

		const intervalId = window.setInterval(renderFrame, 75);
		renderFrame();
		return () => window.clearInterval(intervalId);
	}, [suffix, value]);

	return (
		<span
			ref={elementRef}
			className={styles.animatedNumber}
			data-animated-number="true"
			data-current-value={displayedValueRef.current}
			data-target-value={value}
		>
			{formatInteger(displayedValueRef.current)}{suffix}
		</span>
	);
};

function boundedDrift(tick: number, index: number, seed: number): number {
	const phase = sequenceValue(0, index + 5000, seed) * Math.PI * 2;
	const primary = Math.sin(tick * 0.105 + phase) * 0.68;
	const secondary = Math.sin(tick * 0.037 + phase * 1.73) * 0.28;
	const microNoise =
		(sequenceValue(tick, index + 7000, seed) - 0.5) * 0.08;
	return primary + secondary + microNoise;
}

function steppedTriangleOffset(tick: number, index: number, seed: number): number {
	const cycleLength = 48;
	const phase = Math.floor(sequenceValue(0, index + 12000, seed) * cycleLength);
	const position = (Math.floor(tick) + phase) % cycleLength;
	const triangle = position <= cycleLength / 2 ? position : cycleLength - position;
	return triangle - cycleLength / 4;
}

function clamp(value: number, minimum: number, maximum: number): number {
	return Math.min(maximum, Math.max(minimum, value));
}

function formatInteger(value: number): string {
	return Math.round(value).toLocaleString("pt-BR");
}

function polarPoint(cx: number, cy: number, radius: number, angle: number) {
	const radians = (angle * Math.PI) / 180;
	return {
		x: cx + Math.cos(radians) * radius,
		y: cy + Math.sin(radians) * radius,
	};
}

const AttentionWireCanvas: React.FC<{
	wires: readonly AttentionWire[];
}> = ({ wires }) => {
	const layerARef = useRef<HTMLCanvasElement>(null);
	const layerBRef = useRef<HTMLCanvasElement>(null);
	const layerCRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvases = [layerARef.current, layerBRef.current, layerCRef.current];
		const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
		const reducedMotion = window.matchMedia(
			"(prefers-reduced-motion: reduce)"
		).matches;
		const wiresByLayer = [0, 1, 2].map((layerIndex) =>
			wires.filter((wire) => wire.layer === layerIndex)
		);
		let animationFrameId = 0;
		let lastRenderedAt = Number.NEGATIVE_INFINITY;

		type CanvasState = {
			canvas: HTMLCanvasElement;
			context: CanvasRenderingContext2D;
			layerIndex: number;
			width: number;
			height: number;
			scale: number;
			offsetX: number;
			offsetY: number;
		};

		const canvasStates = canvases.flatMap((canvas, layerIndex) => {
			if (!canvas) return [];
			const context = canvas.getContext("2d", { alpha: true });
			if (!context) return [];
			return [{
				canvas,
				context,
				layerIndex,
				width: 0,
				height: 0,
				scale: 1,
				offsetX: 0,
				offsetY: 0,
			} satisfies CanvasState];
		});

		const resizeCanvas = (state: CanvasState) => {
			const { canvas } = state;
			const bounds = canvas.getBoundingClientRect();
			if (bounds.width <= 0 || bounds.height <= 0) return;
			canvas.width = Math.max(1, Math.round(bounds.width * pixelRatio));
			canvas.height = Math.max(1, Math.round(bounds.height * pixelRatio));
			const viewBoxWidth = 112;
			const viewBoxHeight = 108;
			state.width = bounds.width;
			state.height = bounds.height;
			state.scale = Math.min(
				bounds.width / viewBoxWidth,
				bounds.height / viewBoxHeight
			);
			state.offsetX = (bounds.width - viewBoxWidth * state.scale) / 2;
			state.offsetY = (bounds.height - viewBoxHeight * state.scale) / 2;
		};

		const drawFrame = (timestamp: number) => {
			const motionTick = reducedMotion
				? 0
				: timestamp / ATTENTION_WIRE_DESTINATION_MS;

			canvasStates.forEach((state) => {
				if (state.width <= 0 || state.height <= 0) return;
				const { context } = state;
				context.setTransform(
					pixelRatio * state.scale,
					0,
					0,
					pixelRatio * state.scale,
					pixelRatio * state.offsetX,
					pixelRatio * state.offsetY
				);
				context.clearRect(
					-state.offsetX / state.scale,
					-state.offsetY / state.scale,
					state.width / state.scale,
					state.height / state.scale
				);
				context.lineCap = "round";

				const pathsByColor = new Map<string, Path2D>();
				wiresByLayer[state.layerIndex]?.forEach((wire) => {
					const startAngle =
						wire.startAngle +
						(sequenceValue(motionTick, wire.id + 2400, wire.motionSeed) - 0.5) * 24;
					const endAngle =
						wire.endAngle +
						(sequenceValue(motionTick, wire.id + 2800, wire.motionSeed) - 0.5) * 24;
					const controlRadius = clamp(
						wire.controlRadius +
							(sequenceValue(motionTick, wire.id + 3200, wire.motionSeed) - 0.5) * 7,
						0,
						13
					);
					const controlAngle =
						wire.controlAngle +
						(sequenceValue(motionTick, wire.id + 3600, wire.motionSeed) - 0.5) * 64;
					const start = polarPoint(54, 54, 30.5, startAngle);
					const end = polarPoint(54, 54, 30.5, endAngle);
					const control = polarPoint(54, 54, controlRadius, controlAngle);
					let path = pathsByColor.get(wire.color);
					if (!path) {
						path = new Path2D();
						pathsByColor.set(wire.color, path);
					}
					path.moveTo(start.x, start.y);
					path.quadraticCurveTo(control.x, control.y, end.x, end.y);
				});

				context.globalAlpha = [0.16, 0.13, 0.1][state.layerIndex] ?? 0.12;
				context.lineWidth = [0.34, 0.3, 0.26][state.layerIndex] ?? 0.3;
				pathsByColor.forEach((path, color) => {
					context.strokeStyle = color;
					context.stroke(path);
				});
				context.globalAlpha = 1;
			});
		};

		const renderLoop = (timestamp: number) => {
			if (timestamp - lastRenderedAt >= ATTENTION_WIRE_FRAME_INTERVAL_MS) {
				lastRenderedAt = timestamp;
				drawFrame(timestamp);
			}
			animationFrameId = window.requestAnimationFrame(renderLoop);
		};

		canvasStates.forEach(resizeCanvas);
		const resizeObserver = new ResizeObserver(() => {
			canvasStates.forEach(resizeCanvas);
			drawFrame(performance.now());
		});
		canvasStates.forEach(({ canvas }) => resizeObserver.observe(canvas));

		if (reducedMotion) {
			drawFrame(0);
		} else {
			animationFrameId = window.requestAnimationFrame(renderLoop);
		}

		return () => {
			window.cancelAnimationFrame(animationFrameId);
			resizeObserver.disconnect();
		};
	}, [wires]);

	return (
		<>
			<canvas
				ref={layerARef}
				className={`${styles.attentionWireCanvas} ${styles.attentionWireFieldA}`}
				data-wire-motion="continuous-transform"
				data-wire-coordinate-motion="interpolated-raf"
				aria-hidden="true"
			/>
			<canvas
				ref={layerBRef}
				className={`${styles.attentionWireCanvas} ${styles.attentionWireFieldB}`}
				data-wire-motion="continuous-transform"
				data-wire-coordinate-motion="interpolated-raf"
				aria-hidden="true"
			/>
			<canvas
				ref={layerCRef}
				className={`${styles.attentionWireCanvas} ${styles.attentionWireFieldC}`}
				data-wire-motion="continuous-transform"
				data-wire-coordinate-motion="interpolated-raf"
				aria-hidden="true"
			/>
		</>
	);
};

const AttentionMap: React.FC<CognitiveInsightPanelProps> = ({ mode, tick }) => {
	const seed = MODE_SEED[mode];
	const rawValues = ATTENTION_LABELS.map(
		(_, index) =>
			18 +
			sequenceValue(0, index, seed) * 18 +
			boundedDrift(tick, index, seed) * 1.8
	);
	const rawTotal = rawValues.reduce((total, value) => total + value, 0);
	const values = rawValues.map((value) => (value / rawTotal) * 100);
	const totalSignals = Math.round(
		12800 +
			sequenceValue(0, 37, seed) * 2400 +
			boundedDrift(tick, 37, seed) * 180 +
			steppedTriangleOffset(tick, 37, seed) * 40
	);
	const signalCounts = values.map((value) =>
		Math.round((value / 100) * totalSignals)
	);
	const attentionBlinkFraction =
		0.3 + sequenceValue(tick, 9100, seed) * 0.2;
	const activeAttentionLinkCount = Math.round(
		ATTENTION_LINK_COUNT * attentionBlinkFraction
	);
	let runningOffset = 0;
	const segments = values.map((value, index) => {
		const offset = runningOffset;
		runningOffset += value;
		return { value, offset, color: ATTENTION_COLORS[index] };
	});
	const attentionLinks = useMemo(() => {
		let baseRunningOffset = 0;
		const baseRawValues = ATTENTION_LABELS.map(
			(_, index) => 18 + sequenceValue(0, index, seed) * 18
		);
		const baseTotal = baseRawValues.reduce((total, value) => total + value, 0);
		const baseSegments = baseRawValues.map((rawValue, index) => {
			const value = (rawValue / baseTotal) * 100;
			const offset = baseRunningOffset;
			baseRunningOffset += value;
			return { value, offset, color: ATTENTION_COLORS[index] };
		});

		return Array.from({ length: ATTENTION_LINK_COUNT }, (_, linkIndex) => {
			const sourceIndex = Math.floor(
				sequenceValue(0, linkIndex + 200, seed) * baseSegments.length
			);
			const targetOffset =
				1 +
				Math.floor(
					sequenceValue(0, linkIndex + 500, seed) *
						(baseSegments.length - 1)
				);
			const targetIndex = (sourceIndex + targetOffset) % baseSegments.length;
			const sourceSegment = baseSegments[sourceIndex];
			const targetSegment = baseSegments[targetIndex];
			const sourceAngle =
				-90 +
				(sourceSegment.offset +
					clamp(
						sequenceValue(0, linkIndex + 800, seed),
						0.02,
						0.98
					) *
						sourceSegment.value) *
					3.6;
			const targetAngle =
				-90 +
				(targetSegment.offset +
					clamp(
						sequenceValue(0, linkIndex + 1100, seed),
						0.02,
						0.98
					) *
						targetSegment.value) *
					3.6;
			const controlRadius = sequenceValue(0, linkIndex + 1400, seed) * 9;
			const controlAngle = sequenceValue(0, linkIndex + 1700, seed) * 360;

			return {
				id: linkIndex,
				layer: linkIndex % 3,
				color: ATTENTION_COLORS[sourceIndex],
				startAngle: sourceAngle,
				endAngle: targetAngle,
				controlRadius,
				controlAngle,
				motionSeed: seed ^ Math.imul(linkIndex + 1, 0x9e3779b1),
			};
		});
	}, [seed]);

	return (
		<section
			className={styles.insightCard}
			data-cognitive-feature="attention-map"
			data-simulated-value-count={totalSignals}
			data-blink-fraction={attentionBlinkFraction.toFixed(3)}
		>
			<header className={styles.insightHeader}>
				<span>Mapa de atenção</span>
				<strong><AnimatedInteger value={Math.max(...signalCounts)} suffix=" sinais" /></strong>
			</header>
			<div className={styles.attentionLayout}>
				<div
					className={styles.attentionGraphic}
					role="img"
					aria-label="Distribuição dinâmica da atenção"
					data-wire-count={ATTENTION_LINK_COUNT}
					data-visible-wire-count={ATTENTION_LINK_COUNT}
					data-active-wire-count={activeAttentionLinkCount}
					data-wire-multiplier={ATTENTION_WIRE_MULTIPLIER}
					data-wire-renderer="three-layer-canvas"
					data-wire-destination-duration={ATTENTION_WIRE_DESTINATION_MS}
				>
					<AttentionWireCanvas wires={attentionLinks} />
					<svg viewBox="0 0 112 108" aria-hidden="true">
						<circle className={styles.attentionTrack} cx="54" cy="54" r="38" />
						{segments.map((segment, index) => (
							<circle
								key={ATTENTION_LABELS[index]}
								className={styles.attentionSegment}
								cx="54"
								cy="54"
								r="38"
								pathLength="100"
								stroke={segment.color}
								strokeDasharray={`${Math.max(1, segment.value - 1.5)} ${101.5 - segment.value}`}
								strokeDashoffset={-segment.offset}
							/>
						))}
						<circle className={styles.attentionCore} cx="54" cy="54" r="4.2" />
					</svg>
				</div>
				<ul className={styles.attentionLegend}>
					{ATTENTION_LABELS.map((label, index) => (
						<li key={label}>
							<i style={{ backgroundColor: ATTENTION_COLORS[index] }} />
							<span>{label}</span>
							<strong><AnimatedInteger value={signalCounts[index]} /></strong>
						</li>
					))}
				</ul>
			</div>
		</section>
	);
};

const LatentActivation: React.FC<CognitiveInsightPanelProps> = ({ mode, tick }) => {
	const seed = MODE_SEED[mode] ^ 0xa511e9b3;
	const simulatedSamples = Math.round(
		4800 +
			sequenceValue(0, 17, seed) * 900 +
			boundedDrift(tick, 17, seed) * 42 +
			steppedTriangleOffset(tick, 17, seed) * 9
	);
	const scatterBlinkFraction =
		0.3 + sequenceValue(tick, 9600, seed) * 0.2;
	const activeScatterPointCount = Math.round(
		LATENT_VISIBLE_POINT_COUNT * scatterBlinkFraction
	);
	const scatterBlinkOffset = Math.floor(
		sequenceValue(tick, 9601, seed) * LATENT_VISIBLE_POINT_COUNT
	);
	const points = Array.from({ length: LATENT_VISIBLE_POINT_COUNT }, (_, index) => {
		const progress = index / (LATENT_VISIBLE_POINT_COUNT - 1);
		const jitterX =
			(sequenceValue(0, index, seed) - 0.5) * 7;
		const jitterY =
			(sequenceValue(0, index + 361, seed) - 0.5) * 28;
		const curve = 72 - Math.pow(progress - 0.48, 2) * 118;
		return {
			id: index,
			x: 17 + progress * 205 + jitterX,
			y: Math.max(12, Math.min(92, curve + jitterY)),
			color: `hsl(${112 + progress * 112} 88% 48%)`,
		};
	});
	const curvePoints = Array.from({ length: 27 }, (_, index) => {
		const progress = index / 26;
		const jitter =
			(sequenceValue(0, index + 900, seed) - 0.5) * 10 +
			boundedDrift(tick, index + 900, seed) * 1.1;
		return {
			x: 17 + progress * 205,
			y: Math.max(
				12,
				Math.min(92, 72 - Math.pow(progress - 0.48, 2) * 118 + jitter)
			),
		};
	})
		.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`)
		.join(" ");
	const activation =
		210 +
		sequenceValue(0, 93, seed) * 38 +
		boundedDrift(tick, 93, seed) * 3.6;

	return (
		<section
			className={styles.insightCard}
			data-cognitive-feature="latent-activation"
			data-simulated-value-count={simulatedSamples}
			data-blink-fraction={scatterBlinkFraction.toFixed(3)}
		>
			<header className={styles.insightHeader}>
				<span>Ativação latente</span>
				<strong><AnimatedInteger value={simulatedSamples} suffix=" amostras" /></strong>
			</header>
			<svg className={styles.scatterPlot} viewBox="0 0 240 110" aria-label="Ativação por dimensão latente">
				{[22, 46, 70, 94].map((y) => (
					<line key={`y-${y}`} className={styles.chartGridLine} x1="14" y1={y} x2="230" y2={y} />
				))}
				{[18, 66, 114, 162, 210].map((x) => (
					<line key={`x-${x}`} className={styles.chartGridLine} x1={x} y1="8" x2={x} y2="96" />
				))}
				<polyline className={styles.scatterCurve} points={curvePoints} />
				{points.map((point, index) => {
					const active =
						(index - scatterBlinkOffset + LATENT_VISIBLE_POINT_COUNT) %
							LATENT_VISIBLE_POINT_COUNT <
						activeScatterPointCount;
					return <circle
						key={point.id}
						className={styles.scatterPoint}
						cx={point.x}
						cy={point.y}
						r={index % 11 === 0 ? 1.55 : 0.82}
						fill={point.color}
						data-activation={Math.round(activation)}
						opacity={active ? 0.96 : 0.24}
						data-blink-state={active ? "active" : "dim"}
					/>
				})}
				<text x="120" y="107">DIMENSÃO LATENTE</text>
				<text className={styles.verticalChartLabel} x="-54" y="8">ATIVAÇÃO</text>
			</svg>
		</section>
	);
};

const CognitiveRadar: React.FC<CognitiveInsightPanelProps> = ({ mode, tick }) => {
	const seed = MODE_SEED[mode] ^ 0x63d83595;
	const center = { x: 110, y: 59 };
	const radius = 40;
	const axes = RADAR_LABELS.map((_, index) =>
		polarPoint(center.x, center.y, radius, -90 + index * 72)
	);
	const referencePoints = axes.map((point) => `${point.x},${point.y}`).join(" ");
	const values = RADAR_LABELS.map(
		(_, index) =>
			clamp(
				0.45 +
					sequenceValue(0, index + 140, seed) * 0.35 +
					boundedDrift(tick, index + 140, seed) * 0.025,
				0.35,
				0.9
			)
	);
	const currentPoints = values
		.map((value, index) => {
			const point = polarPoint(center.x, center.y, radius * value, -90 + index * 72);
			return `${point.x.toFixed(1)},${point.y.toFixed(1)}`;
		})
		.join(" ");
	const average = values.reduce((total, value) => total + value, 0) / values.length;
	const compositeScore = Math.round(
		average * 10000 + steppedTriangleOffset(tick, 173, seed) * 12
	);

	return (
		<section
			className={styles.insightCard}
			data-cognitive-feature="cognitive-radar"
			data-simulated-value-count={compositeScore}
		>
			<header className={styles.insightHeader}>
				<span>Radar cognitivo</span>
				<strong><AnimatedInteger value={compositeScore} /></strong>
			</header>
			<svg className={styles.radarChart} viewBox="0 0 220 116" aria-label="Equilíbrio das capacidades cognitivas">
				{[0.33, 0.66, 1].map((scale) => (
					<polygon
						key={scale}
						className={styles.radarGrid}
						points={axes
							.map((_, index) => {
								const point = polarPoint(center.x, center.y, radius * scale, -90 + index * 72);
								return `${point.x},${point.y}`;
							})
							.join(" ")}
					/>
				))}
				{axes.map((point, index) => (
					<line key={RADAR_LABELS[index]} className={styles.radarAxis} x1={center.x} y1={center.y} x2={point.x} y2={point.y} />
				))}
				<polygon className={styles.radarReference} points={referencePoints} />
				<polygon className={styles.radarValue} points={currentPoints} />
				{values.map((value, index) => {
					const point = polarPoint(center.x, center.y, radius * value, -90 + index * 72);
					return <circle key={RADAR_LABELS[index]} className={styles.radarPoint} cx={point.x} cy={point.y} r="2.2" />;
				})}
				{RADAR_LABELS.map((label, index) => {
					const point = polarPoint(center.x, center.y, radius + 15, -90 + index * 72);
					return <text key={label} x={point.x} y={point.y}>{label}</text>;
				})}
			</svg>
		</section>
	);
};

const CognitiveInsightPanel: React.FC<CognitiveInsightPanelProps> = (props) => {
	const signatureSeed = MODE_SEED[props.mode] ^ 0x1b873593;
	const frameSignature = Array.from({ length: 4 }, (_, index) =>
		Math.floor(sequenceValue(props.tick, index + 4000, signatureSeed) * 0xffff)
			.toString(16)
			.padStart(4, "0")
	).join("");

	return (
		<aside
			className={styles.inspector}
			data-cognitive-inspector="true"
			data-cognitive-feature-count="3"
			data-cognitive-frame={props.tick.toFixed(4)}
			data-cognitive-target-frame={props.tick}
			data-frame-signature={frameSignature}
			data-update-interval={COGNITIVE_UPDATE_INTERVAL_MS}
			data-value-scale="100"
			data-transition-mode="native-continuous-motion"
			data-transition-duration="900"
			data-change-envelope="bounded-micro-variation"
			data-signal-blink-range="0.30:0.50"
			data-sequence="xorshift32-long-cycle"
			data-motion-profile="continuous-micro-variation-with-signal-flow"
			aria-label="Leituras cognitivas em transição contínua"
		>
			<AttentionMap {...props} />
			<LatentActivation {...props} />
			<CognitiveRadar {...props} />
		</aside>
	);
};

export default CognitiveInsightPanel;
