import { memo, useMemo, type CSSProperties, type ReactNode } from "react";

import {
	ROADMAP_CATEGORY_LABELS,
	ROADMAP_DEMAND_LABELS,
	ROADMAP_KIND_LABELS,
	ROADMAP_MARKET_SIGNAL_LABELS,
	ROADMAP_RELATION_LABELS,
} from "../../domain/model/roadmap.constants";
import type { RoadMapResolvedRelations } from "../../application/services/resolveRoadMapRelations";
import type { RoadMapNode } from "../../domain/model/roadmap.types";

type RoadMapDetailsPanelProps = Readonly<{
	node: RoadMapNode | null;
	parentNode?: RoadMapNode | null;
	childNodes?: readonly RoadMapNode[];
	relatedNodes?: readonly RoadMapNode[];
	lineageNodes?: readonly RoadMapNode[];
	resolvedRelations?: RoadMapResolvedRelations | null;
}>;

function DetailSection({
	title,
	children,
}: Readonly<{
	title: string;
	children: ReactNode;
}>) {
	const titleStyle: CSSProperties = {
		margin: 0,
		color: "#334155",
		fontSize: "0.75rem",
		fontWeight: 900,
		textTransform: "uppercase",
		letterSpacing: "0.08em",
		fontFamily:
			'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
	};

	return (
		<section style={{ display: "grid", gap: "10px" }}>
			<h4 style={titleStyle}>{title}</h4>
			{children}
		</section>
	);
}

function InfoBadge({
	label,
}: Readonly<{
	label: string;
}>) {
	const style: CSSProperties = {
		display: "inline-flex",
		alignItems: "center",
		justifyContent: "center",
		minHeight: "32px",
		padding: "0 10px",
		borderRadius: "999px",
		border: "1px solid rgba(15, 23, 42, 0.08)",
		background: "#ffffff",
		color: "#0f172a",
		fontSize: "0.74rem",
		fontWeight: 800,
		lineHeight: 1,
		whiteSpace: "nowrap",
		boxShadow: "0 6px 16px rgba(15, 23, 42, 0.04)",
		fontFamily:
			'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
	};

	return <span style={style}>{label}</span>;
}

function DetailList({
	items,
}: Readonly<{
	items: readonly string[];
}>) {
	if (items.length === 0) {
		return null;
	}

	return (
		<ul
			style={{
				margin: 0,
				paddingLeft: "18px",
				display: "grid",
				gap: "6px",
				color: "#334155",
				fontSize: "0.9rem",
				lineHeight: 1.55,
				fontFamily:
					'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
			}}
		>
			{items.map((item) => (
				<li key={item}>{item}</li>
			))}
		</ul>
	);
}

function NodeLinks({
	nodes,
}: Readonly<{
	nodes: readonly RoadMapNode[];
}>) {
	if (nodes.length === 0) {
		return (
			<span
				style={{
					color: "#64748b",
					fontSize: "0.88rem",
					lineHeight: 1.5,
					fontFamily:
						'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
				}}
			>
				Nenhum item relacionado nesta seção.
			</span>
		);
	}

	return (
		<div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
			{nodes.map((item) => (
				<InfoBadge key={item.id} label={item.shortLabel ?? item.label} />
			))}
		</div>
	);
}

function RoadMapDetailsPanelComponent({
	node,
	parentNode = null,
	childNodes = [],
	relatedNodes = [],
	lineageNodes = [],
	resolvedRelations = null,
}: RoadMapDetailsPanelProps) {
	const wrapperStyle = useMemo<CSSProperties>(
		() => ({
			display: "grid",
			gap: "18px",
			padding: "20px 22px",
			borderRadius: "24px",
			border: "1px solid rgba(30, 94, 255, 0.08)",
			background:
				"linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.96) 100%)",
			boxShadow:
				"0 18px 50px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255,255,255,0.78)",
			minHeight: "420px",
		}),
		[]
	);

	const titleStyle = useMemo<CSSProperties>(
		() => ({
			margin: 0,
			color: "#0f172a",
			fontSize: "1.15rem",
			fontWeight: 900,
			lineHeight: 1.1,
			letterSpacing: "-0.02em",
			fontFamily:
				'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
		}),
		[]
	);

	const paragraphStyle = useMemo<CSSProperties>(
		() => ({
			margin: 0,
			color: "#475569",
			fontSize: "0.92rem",
			lineHeight: 1.6,
			fontFamily:
				'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
		}),
		[]
	);

	const metaRowStyle = useMemo<CSSProperties>(
		() => ({
			display: "flex",
			flexWrap: "wrap",
			gap: "8px",
		}),
		[]
	);

	const emptyState = !node;

	if (emptyState) {
		return (
			<aside style={wrapperStyle}>
				<h3 style={titleStyle}>Detalhes do nó</h3>
				<p style={paragraphStyle}>
					Selecione um domínio, tópico, tecnologia ou conceito no mapa para ver
					contexto, prioridade, sinais de mercado e relações.
				</p>
			</aside>
		);
	}

	const detailSummary = node.details?.summary ?? node.description;
	const marketSignals = node.marketSignals ?? [];
	const relationEntries = resolvedRelations?.all ?? [];

	return (
		<aside style={wrapperStyle}>
			<div style={{ display: "grid", gap: "12px" }}>
				<h3 style={titleStyle}>{node.label}</h3>

				<div style={metaRowStyle}>
					<InfoBadge label={ROADMAP_KIND_LABELS[node.kind]} />
					<InfoBadge label={ROADMAP_CATEGORY_LABELS[node.category]} />
					<InfoBadge label={ROADMAP_DEMAND_LABELS[node.demand]} />
					{typeof node.difficulty === "number" ? (
						<InfoBadge label={`Dificuldade ${node.difficulty}/5`} />
					) : null}
				</div>

				{detailSummary ? <p style={paragraphStyle}>{detailSummary}</p> : null}
			</div>

			{marketSignals.length > 0 ? (
				<DetailSection title="Sinais de mercado">
					<div style={metaRowStyle}>
						{marketSignals.map((signal) => (
							<InfoBadge
								key={signal}
								label={ROADMAP_MARKET_SIGNAL_LABELS[signal]}
							/>
						))}
					</div>
				</DetailSection>
			) : null}

			{node.details?.whyItMatters ? (
				<DetailSection title="Por que isso importa">
					<p style={paragraphStyle}>{node.details.whyItMatters}</p>
				</DetailSection>
			) : null}

			{node.details?.whenToUse?.length ? (
				<DetailSection title="Quando usar">
					<DetailList items={node.details.whenToUse} />
				</DetailSection>
			) : null}

			{node.details?.whenNotToUse?.length ? (
				<DetailSection title="Quando evitar">
					<DetailList items={node.details.whenNotToUse} />
				</DetailSection>
			) : null}

			{node.details?.useCases?.length ? (
				<DetailSection title="Casos de uso">
					<DetailList items={node.details.useCases} />
				</DetailSection>
			) : null}

			{node.details?.cautions?.length ? (
				<DetailSection title="Cuidados">
					<DetailList items={node.details.cautions} />
				</DetailSection>
			) : null}

			{parentNode ? (
				<DetailSection title="Nó pai">
					<NodeLinks nodes={[parentNode]} />
				</DetailSection>
			) : null}

			{lineageNodes.length > 0 ? (
				<DetailSection title="Linha hierárquica">
					<NodeLinks nodes={lineageNodes} />
				</DetailSection>
			) : null}

			{childNodes.length > 0 ? (
				<DetailSection title="Filhos diretos">
					<NodeLinks nodes={childNodes} />
				</DetailSection>
			) : null}

			{relatedNodes.length > 0 ? (
				<DetailSection title="Relacionados">
					<NodeLinks nodes={relatedNodes} />
				</DetailSection>
			) : null}

			{relationEntries.length > 0 ? (
				<DetailSection title="Relações do nó">
					<div style={{ display: "grid", gap: "8px" }}>
						{relationEntries.map((relation) => (
							<div
								key={relation.edge.id}
								style={{
									display: "grid",
									gap: "4px",
									padding: "10px 12px",
									borderRadius: "14px",
									border: "1px solid rgba(15, 23, 42, 0.06)",
									background: "#ffffff",
								}}
							>
								<span
									style={{
										color: "#0f172a",
										fontSize: "0.82rem",
										fontWeight: 800,
										lineHeight: 1.3,
										fontFamily:
											'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
									}}
								>
									{ROADMAP_RELATION_LABELS[relation.type]} ·{" "}
									{relation.counterpartNode.label}
								</span>

								<span
									style={{
										color: "#64748b",
										fontSize: "0.78rem",
										lineHeight: 1.45,
										fontFamily:
											'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
									}}
								>
									Direção:{" "}
									{relation.direction === "incoming"
										? "entrada"
										: relation.direction === "outgoing"
											? "saída"
											: "bidirecional"}
								</span>
							</div>
						))}
					</div>
				</DetailSection>
			) : null}
		</aside>
	);
}

export default memo(RoadMapDetailsPanelComponent);
