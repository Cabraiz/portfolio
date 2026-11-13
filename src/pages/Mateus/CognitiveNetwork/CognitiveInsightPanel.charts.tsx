// Os três cartões do painel: mapa de atenção, ativação latente e radar.
import { localizeLabel, useLabelLanguage } from '@/i18n/labels';
import React, { useMemo } from "react";

import styles from "./CognitiveNetwork.module.css";
import {
	ATTENTION_COLORS,
	ATTENTION_LABELS,
	ATTENTION_LINK_COUNT,
	ATTENTION_WIRE_DESTINATION_MS,
	ATTENTION_WIRE_MULTIPLIER,
	LATENT_VISIBLE_POINT_COUNT,
	MODE_SEED,
	RADAR_LABELS,
	boundedDrift,
	clamp,
	polarPoint,
	sequenceValue,
	steppedTriangleOffset,
} from "./CognitiveInsightPanel.model";
import type { CognitiveInsightPanelProps } from "./CognitiveInsightPanel.model";
import { AnimatedInteger, AttentionWireCanvas } from "./CognitiveInsightPanel.widgets";

const AttentionMap: React.FC<CognitiveInsightPanelProps> = ({ mode, tick }) => {
  useLabelLanguage();
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
				<span>{localizeLabel("Mapa de atenção")}</span>
				<strong><AnimatedInteger value={Math.max(...signalCounts)} suffix=" sinais" /></strong>
			</header>
			<div className={styles.attentionLayout}>
				<div
					className={styles.attentionGraphic}
					role="img"
					aria-label={localizeLabel("Distribuição dinâmica da atenção")}
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
							<span>{localizeLabel(label)}</span>
							<strong><AnimatedInteger value={signalCounts[index]} /></strong>
						</li>
					))}
				</ul>
			</div>
		</section>
	);
};

const LatentActivation: React.FC<CognitiveInsightPanelProps> = ({ mode, tick }) => {
  useLabelLanguage();
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
				<span>{localizeLabel("Ativação latente")}</span>
				<strong><AnimatedInteger value={simulatedSamples} suffix=" amostras" /></strong>
			</header>
			<svg className={styles.scatterPlot} viewBox="0 0 240 110" aria-label={localizeLabel("Ativação por dimensão latente")}>
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
				<text x="120" y="107">{localizeLabel("DIMENSÃO LATENTE")}</text>
				<text className={styles.verticalChartLabel} x="-54" y="8">{localizeLabel("ATIVAÇÃO")}</text>
			</svg>
		</section>
	);
};

const CognitiveRadar: React.FC<CognitiveInsightPanelProps> = ({ mode, tick }) => {
  useLabelLanguage();
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
				<span>{localizeLabel("Radar cognitivo")}</span>
				<strong><AnimatedInteger value={compositeScore} /></strong>
			</header>
			<svg className={styles.radarChart} viewBox="0 0 220 116" aria-label={localizeLabel("Equilíbrio das capacidades cognitivas")}>
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
					return <text key={label} x={point.x} y={point.y}>{localizeLabel(label)}</text>;
				})}
			</svg>
		</section>
	);
};

export { AttentionMap, LatentActivation, CognitiveRadar };
