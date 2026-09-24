import React, { useId, useMemo, useState } from "react";

import {
	COGNITIVE_EDGES,
	COGNITIVE_LAYER_META,
	COGNITIVE_NODES,
	COGNITIVE_VIEW_OPTIONS,
	type CognitiveNode,
	type CognitiveViewMode,
} from "./cognitiveNetwork.data";
import styles from "./CognitiveNetwork.module.css";

const VIEWBOX_WIDTH = 1000;
const VIEWBOX_HEIGHT = 560;

function resolveEdgePath(
	from: CognitiveNode,
	to: CognitiveNode,
	viewMode: CognitiveViewMode,
	edgeIndex: number
): string {
	const start = from.positions[viewMode];
	const end = to.positions[viewMode];

	if (viewMode === "pipeline") {
		const midpointX = (start.x + end.x) / 2;
		return `M ${start.x} ${start.y} C ${midpointX} ${start.y}, ${midpointX} ${end.y}, ${end.x} ${end.y}`;
	}

	const midpointX = (start.x + end.x) / 2;
	const midpointY = (start.y + end.y) / 2 + (edgeIndex % 2 === 0 ? -22 : 22);

	return `M ${start.x} ${start.y} Q ${midpointX} ${midpointY}, ${end.x} ${end.y}`;
}

function buildAmbientPoints(): readonly Readonly<{
	x: number;
	y: number;
	radius: number;
	opacity: number;
}>[] {
	return Array.from({ length: 92 }, (_, index) => ({
		x: 26 + ((index * 83) % 948),
		y: 20 + ((index * 137) % 516),
		radius: 0.7 + (index % 4) * 0.34,
		opacity: 0.16 + (index % 5) * 0.07,
	}));
}

const CognitiveNetwork: React.FC = () => {
	const [viewMode, setViewMode] = useState<CognitiveViewMode>("neural");
	const [activeNodeId, setActiveNodeId] = useState("cognitive-core");
	const rawId = useId();
	const gradientId = `cognitive-core-${rawId.replace(/:/g, "")}`;

	const nodesById = useMemo(
		() => new Map(COGNITIVE_NODES.map((node) => [node.id, node])),
		[]
	);
	const ambientPoints = useMemo(buildAmbientPoints, []);
	const activeNode = nodesById.get(activeNodeId) ?? COGNITIVE_NODES[0];
	const activeLayer = COGNITIVE_LAYER_META[activeNode.layer];
	const activeConnections = useMemo(() => {
		return COGNITIVE_EDGES.filter(
			(edge) => edge.from === activeNode.id || edge.to === activeNode.id
		).length;
	}, [activeNode.id]);

	return (
		<section
			className={styles.section}
			aria-labelledby="cognitive-network-title"
			data-cognitive-network-root="true"
			data-cognitive-view={viewMode}
		>
			<div className={styles.scanline} aria-hidden="true" />

			<header className={styles.header}>
				<div className={styles.headingBlock}>
					<div className={styles.eyebrowRow}>
						<span className={styles.eyebrow}>Arquitetura cognitiva</span>
						<span className={styles.snapshotBadge}>snapshot curado</span>
					</div>
					<h2 className={styles.title} id="cognitive-network-title">
						Como contexto vira decisão.
					</h2>
					<p className={styles.description}>
						Uma representação técnica e pré-calculada das camadas CAG + RAG. O
						diagrama reage à exploração, mas não simula processamento ao vivo.
					</p>
				</div>

				<div
					className={styles.viewSelector}
					role="tablist"
					aria-label="Modos da arquitetura cognitiva"
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
			</header>

			<div className={styles.workspace}>
				<div className={styles.graphPanel} data-cognitive-graph="true">
					<div className={styles.graphMeta}>
						<span>COGNITIVE MAP / CAG.RAG</span>
						<span>{String(COGNITIVE_NODES.length).padStart(2, "0")} NODES</span>
					</div>

					<svg
						className={styles.graph}
						viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
						role="img"
						aria-label="Mapa cognitivo interativo das camadas CAG e RAG"
						preserveAspectRatio="xMidYMid meet"
					>
						<defs>
							<radialGradient id={gradientId} cx="50%" cy="50%" r="50%">
								<stop offset="0%" stopColor="#f8fafc" stopOpacity="0.96" />
								<stop offset="38%" stopColor="#2dd4bf" stopOpacity="0.82" />
								<stop offset="100%" stopColor="#7c3aed" stopOpacity="0.16" />
							</radialGradient>
							<filter
								id={`${gradientId}-glow`}
								x="-80%"
								y="-80%"
								width="260%"
								height="260%"
							>
								<feGaussianBlur stdDeviation="5" result="blur" />
								<feMerge>
									<feMergeNode in="blur" />
									<feMergeNode in="SourceGraphic" />
								</feMerge>
							</filter>
						</defs>

						<g className={styles.ambientField} aria-hidden="true">
							{ambientPoints.map((point, index) => (
								<circle
									key={`${point.x}-${point.y}-${index}`}
									cx={point.x}
									cy={point.y}
									r={point.radius}
									opacity={point.opacity}
								/>
							))}
						</g>

						<g className={styles.edges} aria-hidden="true">
							{COGNITIVE_EDGES.map((edge, edgeIndex) => {
								const from = nodesById.get(edge.from);
								const to = nodesById.get(edge.to);
								if (!from || !to) return null;

								const highlighted =
									edge.from === activeNode.id || edge.to === activeNode.id;

								return (
									<path
										key={`${edge.from}-${edge.to}`}
										d={resolveEdgePath(from, to, viewMode, edgeIndex)}
										className={`${styles.edge} ${
											edge.weight === "primary" ? styles.edgePrimary : ""
										} ${highlighted ? styles.edgeActive : ""}`}
									/>
								);
							})}
						</g>

						<g className={styles.nodes}>
							{COGNITIVE_NODES.map((node) => {
								const position = node.positions[viewMode];
								const layer = COGNITIVE_LAYER_META[node.layer];
								const isActive = node.id === activeNode.id;
								const isCore = node.id === "cognitive-core";

								return (
									<g
										key={node.id}
										className={`${styles.node} ${isActive ? styles.nodeActive : ""}`}
										style={{ color: layer.color }}
										transform={`translate(${position.x} ${position.y})`}
										role="button"
										tabIndex={0}
										aria-label={`${node.label}, camada ${layer.label}`}
										aria-pressed={isActive}
										onClick={() => setActiveNodeId(node.id)}
										onKeyDown={(event) => {
											if (event.key === "Enter" || event.key === " ") {
												event.preventDefault();
												setActiveNodeId(node.id);
											}
										}}
									>
										<circle className={styles.nodeHalo} r={isCore ? 42 : 24} />
										<circle className={styles.nodeRing} r={isCore ? 27 : 14} />
										<circle
											className={styles.nodeCore}
											r={isCore ? 12 : 5.5}
											fill={isCore ? `url(#${gradientId})` : "currentColor"}
											filter={isCore ? `url(#${gradientId}-glow)` : undefined}
										/>
										<text className={styles.nodeLabel} y={isCore ? 58 : 34}>
											{node.shortLabel}
										</text>
									</g>
								);
							})}
						</g>
					</svg>

					<div className={styles.layerLegend} aria-label="Camadas da rede">
						{Object.entries(COGNITIVE_LAYER_META).map(([id, layer]) => (
							<span
								key={id}
								style={{ "--layer-color": layer.color } as React.CSSProperties}
							>
								<i aria-hidden="true" /> {layer.shortLabel}
							</span>
						))}
					</div>
				</div>

				<aside
					className={styles.inspector}
					aria-live="polite"
					data-cognitive-inspector="true"
				>
					<div className={styles.inspectorHeader}>
						<span>NODE INSPECTOR</span>
						<span className={styles.nodeIndex}>
							{String(COGNITIVE_NODES.indexOf(activeNode) + 1).padStart(2, "0")}
						</span>
					</div>

					<div className={styles.inspectorBody}>
						<span
							className={styles.layerPill}
							style={
								{ "--node-color": activeLayer.color } as React.CSSProperties
							}
						>
							{activeLayer.shortLabel}
						</span>
						<h3>{activeNode.label}</h3>
						<p>{activeNode.description}</p>

						<div className={styles.signalGrid}>
							<div>
								<span>FUNÇÃO</span>
								<strong>{activeNode.signal}</strong>
							</div>
							<div>
								<span>CONEXÕES</span>
								<strong>{String(activeConnections).padStart(2, "0")}</strong>
							</div>
						</div>

						<div className={styles.flowPreview} aria-label="Fluxo resumido">
							<span>CAG</span>
							<i aria-hidden="true" />
							<span>RAG</span>
							<i aria-hidden="true" />
							<span>VALIDAÇÃO</span>
						</div>
					</div>

					<footer className={styles.inspectorFooter}>
						<strong>CURADORIA PÚBLICA</strong>
						<span>A visualização não consulta bancos operacionais.</span>
					</footer>
				</aside>
			</div>
		</section>
	);
};

export default CognitiveNetwork;
