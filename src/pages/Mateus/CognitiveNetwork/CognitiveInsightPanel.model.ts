// Constantes, tipos e funções puras dos gráficos do painel cognitivo.
import i18n from '@/i18n/i18n';

import type { CognitiveViewMode } from "./cognitiveNetwork.data";

type CognitiveInsightPanelProps = Readonly<{
	mode: CognitiveViewMode;
	tick: number;
}>;

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

function formatInteger(value: number, language = i18n.resolvedLanguage): string {
        return Math.round(value).toLocaleString(language === 'en' ? 'en-US' : 'pt-BR');
}

function polarPoint(cx: number, cy: number, radius: number, angle: number) {
	const radians = (angle * Math.PI) / 180;
	return {
		x: cx + Math.cos(radians) * radius,
		y: cy + Math.sin(radians) * radius,
	};
}

export type { CognitiveInsightPanelProps, AttentionWire };
export {
	ATTENTION_LINK_COUNT,
	ATTENTION_WIRE_MULTIPLIER,
	ATTENTION_WIRE_DESTINATION_MS,
	ATTENTION_WIRE_FRAME_INTERVAL_MS,
	LATENT_VISIBLE_POINT_COUNT,
	ATTENTION_LABELS,
	ATTENTION_COLORS,
	RADAR_LABELS,
	MODE_SEED,
	sequenceValue,
	boundedDrift,
	steppedTriangleOffset,
	clamp,
	formatInteger,
	polarPoint,
};
