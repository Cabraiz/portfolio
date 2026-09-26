import React, { useEffect, useState } from "react";

import { type CognitiveViewMode } from "./cognitiveNetwork.data";
import NeuralCore3D from "./CognitiveBrainScene";
import CognitiveInsightPanel, {
	COGNITIVE_UPDATE_INTERVAL_MS,
} from "./CognitiveInsightPanel";
import styles from "./CognitiveNetwork.module.css";

type ThoughtStep = Readonly<{
	verb: string;
	target: string;
	result: string;
}>;

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
		status: "ESCOLHENDO CAMINHOS",
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

const CognitiveNetwork: React.FC = () => {
	const viewMode: CognitiveViewMode = "neural";
	const [telemetryTick, setTelemetryTick] = useState(0);
	const readout = MODE_READOUT[viewMode];
	const thoughtSteps = THOUGHT_STEPS[viewMode];
	const thoughtIndex = telemetryTick % thoughtSteps.length;
	const currentThought = thoughtSteps[thoughtIndex];
	const liveLatency = (
		Number.parseFloat(readout.latency) +
		Math.cos(telemetryTick * 0.61) * 0.84
	).toFixed(2);
	useEffect(() => {
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			return undefined;
		}

		const intervalId = window.setInterval(() => {
			setTelemetryTick((current) => current + 1);
		}, COGNITIVE_UPDATE_INTERVAL_MS);

		return () => window.clearInterval(intervalId);
	}, []);

	return (
		<section
			className={styles.section}
			aria-labelledby="cognitive-network-title"
			data-cognitive-network-root="true"
			data-cognitive-view={viewMode}
			data-cognitive-thinking="active"
			data-cognitive-visual-theme="clinical-neural-light"
			data-telemetry-update-interval={COGNITIVE_UPDATE_INTERVAL_MS}
			data-telemetry-transition="native-continuous-motion"
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

			</header>

			<div className={styles.workspace}>
				<div className={styles.graphPanel} data-cognitive-graph="true">
					<div className={styles.graphGrid} aria-hidden="true" />
					<NeuralCore3D mode={viewMode} />

					<div className={styles.axisLabels} aria-hidden="true">
						<span className={styles.axisY}>NÍVEL DE ATIVAÇÃO</span>
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
							<span>{"// RACIOCÍNIO AGORA"}</span>
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

					<div className={styles.coreCaption}>
						<span className={styles.thinkingStatus}>
							<i aria-hidden="true" /> PENSANDO · {readout.status}
						</span>
						<strong>CÉREBRO IA</strong>
					</div>
				</div>

				<CognitiveInsightPanel mode={viewMode} tick={telemetryTick} />
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
