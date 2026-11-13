// Número animado e fios do mapa de atenção (canvas em três camadas).
import { localizeLabel, useLabelLanguage } from '@/i18n/labels';
import i18n from '@/i18n/i18n';
import React, { useEffect, useRef } from "react";

import styles from "./CognitiveNetwork.module.css";
import {
	ATTENTION_WIRE_DESTINATION_MS,
	ATTENTION_WIRE_FRAME_INTERVAL_MS,
	clamp,
	formatInteger,
	polarPoint,
	sequenceValue,
} from "./CognitiveInsightPanel.model";
import type { AttentionWire } from "./CognitiveInsightPanel.model";

type AnimatedIntegerProps = Readonly<{
	value: number;
	suffix?: string;
}>;

const AnimatedInteger: React.FC<AnimatedIntegerProps> = ({ value, suffix = "" }) => {
  useLabelLanguage();
        const language = i18n.resolvedLanguage;
        const translatedSuffix = localizeLabel(suffix);
	const displayedValueRef = useRef(value);
	const elementRef = useRef<HTMLSpanElement>(null);

	useEffect(() => {
		const renderValue = (nextValue: number) => {
			const element = elementRef.current;
			if (!element) return;
			element.dataset.currentValue = String(nextValue);
                        element.textContent = `${formatInteger(nextValue, language)}${translatedSuffix}`;
		};

		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			displayedValueRef.current = value;
			renderValue(value);
			return undefined;
		}

                const startValue = displayedValueRef.current;
                renderValue(startValue);
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
        }, [language, translatedSuffix, value]);

	return (
		<span
			ref={elementRef}
			className={styles.animatedNumber}
			data-animated-number="true"
			data-current-value={displayedValueRef.current}
			data-target-value={value}
		>
			{localizeLabel(formatInteger(displayedValueRef.current))}{localizeLabel(suffix)}
		</span>
	);
};

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

export { AnimatedInteger, AttentionWireCanvas };
