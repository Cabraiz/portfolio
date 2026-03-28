import { memo, type CSSProperties, type ReactNode } from "react";

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

const FONT_FAMILY =
  'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

function DetailSection({
  title,
  children,
}: Readonly<{
  title: string;
  children: ReactNode;
}>) {
  const titleStyle: CSSProperties = {
    margin: 0,
    color: "#475569",
    fontSize: "0.7rem",
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontFamily: FONT_FAMILY,
  };

  return (
    <section style={{ display: "grid", gap: "8px" }}>
      <h4 style={titleStyle}>{title}</h4>
      {children}
    </section>
  );
}

function InfoBadge({
  label,
  active = false,
}: Readonly<{
  label: string;
  active?: boolean;
}>) {
  const style: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "30px",
    padding: "0 10px",
    borderRadius: "999px",
    border: active
      ? "1px solid rgba(37, 99, 235, 0.18)"
      : "1px solid rgba(148, 163, 184, 0.16)",
    background: active ? "rgba(239, 246, 255, 0.96)" : "#ffffff",
    color: active ? "#1d4ed8" : "#334155",
    fontSize: "0.72rem",
    fontWeight: 800,
    lineHeight: 1,
    whiteSpace: "nowrap",
    fontFamily: FONT_FAMILY,
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
        gap: "5px",
        color: "#334155",
        fontSize: "0.88rem",
        lineHeight: 1.55,
        fontFamily: FONT_FAMILY,
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
          fontSize: "0.84rem",
          lineHeight: 1.5,
          fontFamily: FONT_FAMILY,
        }}
      >
        Nenhum item nesta seção.
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

function getDirectionLabel(direction: "incoming" | "outgoing" | "bidirectional") {
  switch (direction) {
    case "incoming":
      return "Entrada";
    case "outgoing":
      return "Saída";
    case "bidirectional":
      return "Mútua";
    default:
      return "Relação";
  }
}

function RoadMapDetailsPanelComponent({
  node,
  parentNode = null,
  childNodes = [],
  relatedNodes = [],
  lineageNodes = [],
  resolvedRelations = null,
}: RoadMapDetailsPanelProps) {
  const wrapperStyle: CSSProperties = {
    display: "grid",
    gap: "16px",
    padding: "18px 20px",
    borderRadius: "20px",
    border: "1px solid rgba(148, 163, 184, 0.16)",
    background: "#ffffff",
    minHeight: "360px",
  };

  const titleStyle: CSSProperties = {
    margin: 0,
    color: "#0f172a",
    fontSize: "1.04rem",
    fontWeight: 900,
    lineHeight: 1.1,
    letterSpacing: "-0.02em",
    fontFamily: FONT_FAMILY,
  };

  const headlineStyle: CSSProperties = {
    margin: 0,
    color: "#1d4ed8",
    fontSize: "0.86rem",
    fontWeight: 800,
    lineHeight: 1.45,
    fontFamily: FONT_FAMILY,
  };

  const paragraphStyle: CSSProperties = {
    margin: 0,
    color: "#475569",
    fontSize: "0.9rem",
    lineHeight: 1.58,
    fontFamily: FONT_FAMILY,
  };

  const metaRowStyle: CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  };

  if (!node) {
    return (
      <aside style={wrapperStyle}>
        <h3 style={titleStyle}>Detalhes do item</h3>
        <p style={paragraphStyle}>
          Selecione uma tecnologia, prática ou bloco do mapa para ver contexto de
          uso, posição na stack e conexões principais.
        </p>
      </aside>
    );
  }

  const detailSummary = node.details?.summary ?? node.description;
  const detailHeadline = node.details?.headline;
  const marketSignals = node.marketSignals ?? [];
  const relationEntries = resolvedRelations?.all ?? [];
  const primaryRelations = resolvedRelations?.primary ?? [];

  const strengths = node.details?.strengths ?? [];
  const projectContexts = node.details?.projectContexts ?? [];
  const responsibilities = node.details?.responsibilities ?? [];
  const relatedStacks = node.details?.relatedStacks ?? [];
  const evidencePoints = node.details?.evidencePoints ?? [];

  const legacyUseCases = node.details?.useCases ?? [];
  const legacyWhenToUse = node.details?.whenToUse ?? [];
  const legacyCautions = node.details?.cautions ?? [];
  const legacyWhenNotToUse = node.details?.whenNotToUse ?? [];

  return (
    <aside style={wrapperStyle}>
      <div style={{ display: "grid", gap: "10px" }}>
        <h3 style={titleStyle}>{node.label}</h3>

        <div style={metaRowStyle}>
          <InfoBadge label={ROADMAP_KIND_LABELS[node.kind]} />
          <InfoBadge label={ROADMAP_CATEGORY_LABELS[node.category]} />
          <InfoBadge label={ROADMAP_DEMAND_LABELS[node.demand]} />
          {typeof node.proficiency === "number" ? (
            <InfoBadge label={`Profundidade ${node.proficiency}/5`} active />
          ) : typeof node.difficulty === "number" ? (
            <InfoBadge label={`Profundidade ${node.difficulty}/5`} active />
          ) : null}
        </div>

        {detailHeadline ? <p style={headlineStyle}>{detailHeadline}</p> : null}
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

      {projectContexts.length > 0 ? (
        <DetailSection title="Contextos de atuação">
          <DetailList items={projectContexts} />
        </DetailSection>
      ) : null}

      {responsibilities.length > 0 ? (
        <DetailSection title="Responsabilidades recorrentes">
          <DetailList items={responsibilities} />
        </DetailSection>
      ) : null}

      {strengths.length > 0 ? (
        <DetailSection title="Pontos fortes">
          <DetailList items={strengths} />
        </DetailSection>
      ) : null}

      {relatedStacks.length > 0 ? (
        <DetailSection title="Stack relacionada">
          <div style={metaRowStyle}>
            {relatedStacks.map((item) => (
              <InfoBadge key={item} label={item} />
            ))}
          </div>
        </DetailSection>
      ) : null}

      {evidencePoints.length > 0 ? (
        <DetailSection title="Leitura prática">
          <DetailList items={evidencePoints} />
        </DetailSection>
      ) : null}

      {legacyUseCases.length > 0 ? (
        <DetailSection title="Casos de uso">
          <DetailList items={legacyUseCases} />
        </DetailSection>
      ) : null}

      {legacyWhenToUse.length > 0 ? (
        <DetailSection title="Quando usar">
          <DetailList items={legacyWhenToUse} />
        </DetailSection>
      ) : null}

      {legacyWhenNotToUse.length > 0 ? (
        <DetailSection title="Quando evitar">
          <DetailList items={legacyWhenNotToUse} />
        </DetailSection>
      ) : null}

      {legacyCautions.length > 0 ? (
        <DetailSection title="Cuidados">
          <DetailList items={legacyCautions} />
        </DetailSection>
      ) : null}

      {parentNode ? (
        <DetailSection title="Bloco acima">
          <NodeLinks nodes={[parentNode]} />
        </DetailSection>
      ) : null}

      {lineageNodes.length > 0 ? (
        <DetailSection title="Linha estrutural">
          <NodeLinks nodes={lineageNodes} />
        </DetailSection>
      ) : null}

      {childNodes.length > 0 ? (
        <DetailSection title="Itens abaixo">
          <NodeLinks nodes={childNodes} />
        </DetailSection>
      ) : null}

      {relatedNodes.length > 0 ? (
        <DetailSection title="Relacionados">
          <NodeLinks nodes={relatedNodes} />
        </DetailSection>
      ) : null}

      {relationEntries.length > 0 ? (
        <DetailSection title="Conexões">
          <div style={{ display: "grid", gap: "8px" }}>
            {relationEntries.map((relation) => {
              const isPrimary = primaryRelations.some(
                (entry) => entry.edge.id === relation.edge.id,
              );

              return (
                <div
                  key={relation.edge.id}
                  style={{
                    display: "grid",
                    gap: "4px",
                    padding: "9px 10px",
                    borderRadius: "12px",
                    border: isPrimary
                      ? "1px solid rgba(37, 99, 235, 0.16)"
                      : "1px solid rgba(148, 163, 184, 0.14)",
                    background: isPrimary ? "rgba(239, 246, 255, 0.62)" : "#ffffff",
                  }}
                >
                  <span
                    style={{
                      color: "#0f172a",
                      fontSize: "0.8rem",
                      fontWeight: 800,
                      lineHeight: 1.35,
                      fontFamily: FONT_FAMILY,
                    }}
                  >
                    {ROADMAP_RELATION_LABELS[relation.type]} ·{" "}
                    {relation.counterpartNode.label}
                  </span>

                  <span
                    style={{
                      color: "#64748b",
                      fontSize: "0.76rem",
                      lineHeight: 1.45,
                      fontFamily: FONT_FAMILY,
                    }}
                  >
                    {getDirectionLabel(relation.direction)}
                    {relation.label !== ROADMAP_RELATION_LABELS[relation.type]
                      ? ` · ${relation.label}`
                      : ""}
                  </span>
                </div>
              );
            })}
          </div>
        </DetailSection>
      ) : null}
    </aside>
  );
}

export default memo(RoadMapDetailsPanelComponent);
