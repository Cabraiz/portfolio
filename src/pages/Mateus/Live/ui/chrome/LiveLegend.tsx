// src/pages/Mateus/Live/ui/chrome/LiveLegend.tsx

import { useMemo, type CSSProperties, type ReactNode } from "react";

import { useLiveMetrics } from "../../application/useLiveMetrics";
import { LIVE_PROJECT_STATUS_LABELS } from "../../domain/live.constants";
import type {
  LiveProjectStatus,
  LiveStatusBucket,
} from "../../domain/live.types";

export type LiveLegendProps = Readonly<{
  className?: string;
  title?: string;
  description?: string;

  statusBuckets?: readonly LiveStatusBucket[];
  selectedStatus?: LiveProjectStatus | null;
  onStatusSelect?: (status: LiveProjectStatus | null) => void;

  showToneLegend?: boolean;
  showStatusLegend?: boolean;
  showHintLegend?: boolean;
  compact?: boolean;

  accentColor?: string;
}>;

type LegendCssVariables = CSSProperties & {
  "--live-legend-accent"?: string;
};

type LegendTone = Readonly<{
  id: string;
  label: string;
  color: string;
  description: string;
}>;

function joinClassNames(
  ...classNames: Array<string | false | null | undefined>
): string {
  return classNames.filter(Boolean).join(" ");
}

function getStatusColor(status: LiveProjectStatus): string {
  switch (status) {
    case "active":
      return "rgba(52, 211, 153, 0.92)";
    case "monitoring":
      return "rgba(96, 165, 250, 0.92)";
    case "incubating":
      return "rgba(251, 191, 36, 0.94)";
    case "delivered":
    default:
      return "rgba(167, 139, 250, 0.9)";
  }
}

function getToneLegend(): readonly LegendTone[] {
  return [
    {
      id: "success",
      label: "Saudável",
      color: "rgba(52, 211, 153, 0.92)",
      description: "Fluxo estável, execução consistente.",
    },
    {
      id: "info",
      label: "Monitorado",
      color: "rgba(96, 165, 250, 0.92)",
      description: "Ativo, mas ainda sob observação.",
    },
    {
      id: "warning",
      label: "Atenção",
      color: "rgba(251, 191, 36, 0.94)",
      description: "Exige leitura mais cuidadosa.",
    },
    {
      id: "neutral",
      label: "Base",
      color: "rgba(167, 139, 250, 0.9)",
      description: "Camada estrutural do radar.",
    },
  ] as const;
}

function resolveBucketMap(
  statusBuckets: readonly LiveStatusBucket[],
): Readonly<Record<LiveProjectStatus, LiveStatusBucket | null>> {
  return {
    active:
      statusBuckets.find((bucket) => bucket.status === "active") ?? null,
    monitoring:
      statusBuckets.find((bucket) => bucket.status === "monitoring") ?? null,
    incubating:
      statusBuckets.find((bucket) => bucket.status === "incubating") ?? null,
    delivered:
      statusBuckets.find((bucket) => bucket.status === "delivered") ?? null,
  };
}

export default function LiveLegend({
  className,
  title = "Legenda operacional",
  description = "Chaves rápidas para interpretar o radar, o placar e os nós da cena.",
  statusBuckets,
  selectedStatus = null,
  onStatusSelect,
  showToneLegend = true,
  showStatusLegend = true,
  showHintLegend = true,
  compact = false,
  accentColor = "rgba(96, 165, 250, 0.88)",
}: LiveLegendProps) {
  const metrics = useLiveMetrics();

  const resolvedStatusBuckets = statusBuckets ?? metrics.statusBuckets;
  const bucketMap = useMemo(
    () => resolveBucketMap(resolvedStatusBuckets),
    [resolvedStatusBuckets],
  );
  const toneLegend = useMemo(() => getToneLegend(), []);

  const style = useMemo<LegendCssVariables>(() => {
    return {
      "--live-legend-accent": accentColor,
      position: "relative",
      display: "grid",
      gap: compact ? "14px" : "18px",
      width: "100%",
      padding: compact ? "16px" : "20px",
      borderRadius: "24px",
      border: "1px solid rgba(255,255,255,0.08)",
      background:
        "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.012)), rgba(8, 12, 18, 0.84)",
      boxShadow: "0 16px 42px rgba(0,0,0,0.2)",
      overflow: "hidden",
      isolation: "isolate",
    };
  }, [accentColor, compact]);

  const renderStatusItem = (status: LiveProjectStatus): ReactNode => {
    const bucket = bucketMap[status];
    const isSelected = selectedStatus === status;
    const color = getStatusColor(status);
    const count = bucket?.count ?? 0;

    const content = (
      <>
        <span
          aria-hidden="true"
          style={{
            width: "12px",
            height: "12px",
            borderRadius: "999px",
            background: color,
            boxShadow: `0 0 14px ${color}`,
            flexShrink: 0,
          }}
        />

        <span
          style={{
            display: "grid",
            gap: "4px",
            minWidth: 0,
            textAlign: "left",
          }}
        >
          <span
            style={{
              fontSize: "0.72rem",
              fontWeight: 800,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.84)",
            }}
          >
            {LIVE_PROJECT_STATUS_LABELS[status]}
          </span>

          <span
            style={{
              fontSize: "0.76rem",
              lineHeight: 1.5,
              color: "rgba(255,255,255,0.56)",
            }}
          >
            {count} projeto{count === 1 ? "" : "s"}
          </span>
        </span>
      </>
    );

    if (!onStatusSelect) {
      return (
        <div
          key={status}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            minWidth: compact ? "unset" : "180px",
            padding: "12px 14px",
            borderRadius: "18px",
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.025)",
          }}
          data-status={status}
        >
          {content}
        </div>
      );
    }

    return (
      <button
        key={status}
        type="button"
        onClick={() => {
          onStatusSelect(isSelected ? null : status);
        }}
        aria-pressed={isSelected}
        style={{
          appearance: "none",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          minWidth: compact ? "unset" : "180px",
          padding: "12px 14px",
          borderRadius: "18px",
          border: `1px solid ${isSelected ? color : "rgba(255,255,255,0.08)"}`,
          background: isSelected ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.025)",
          boxShadow: isSelected ? `0 0 0 1px ${color}22` : "none",
          color: "inherit",
          cursor: "pointer",
          textAlign: "left",
        }}
        data-status={status}
        data-selected={isSelected ? "true" : "false"}
      >
        {content}
      </button>
    );
  };

  return (
    <aside
      className={joinClassNames(className)}
      style={style}
      aria-label="Legenda da seção ao vivo"
      data-live-legend="true"
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: "auto -14% -30% auto",
          width: "42%",
          aspectRatio: "1 / 1",
          borderRadius: "999px",
          background: `radial-gradient(circle, ${accentColor}18 0%, transparent 72%)`,
          filter: "blur(20px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "grid",
          gap: "8px",
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: compact ? "1rem" : "1.08rem",
            letterSpacing: "-0.03em",
            color: "rgba(255,255,255,0.94)",
          }}
        >
          {title}
        </h3>

        <p
          style={{
            margin: 0,
            fontSize: compact ? "0.84rem" : "0.9rem",
            lineHeight: 1.68,
            color: "rgba(255,255,255,0.66)",
          }}
        >
          {description}
        </p>
      </div>

      {showStatusLegend ? (
        <section
          style={{
            position: "relative",
            zIndex: 1,
            display: "grid",
            gap: "10px",
          }}
          aria-label="Legenda por status"
        >
          <span
            style={{
              fontSize: "0.64rem",
              fontWeight: 800,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.5)",
            }}
          >
            status dos projetos
          </span>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            {renderStatusItem("active")}
            {renderStatusItem("monitoring")}
            {renderStatusItem("incubating")}
            {renderStatusItem("delivered")}
          </div>
        </section>
      ) : null}

      {showToneLegend ? (
        <section
          style={{
            position: "relative",
            zIndex: 1,
            display: "grid",
            gap: "10px",
          }}
          aria-label="Legenda de tom visual"
        >
          <span
            style={{
              fontSize: "0.64rem",
              fontWeight: 800,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.5)",
            }}
          >
            leitura visual
          </span>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: compact
                ? "minmax(0, 1fr)"
                : "repeat(2, minmax(0, 1fr))",
              gap: "10px",
            }}
          >
            {toneLegend.map((tone) => (
              <div
                key={tone.id}
                style={{
                  display: "grid",
                  gap: "6px",
                  padding: "12px 14px",
                  borderRadius: "18px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.025)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      width: "11px",
                      height: "11px",
                      borderRadius: "999px",
                      background: tone.color,
                      boxShadow: `0 0 14px ${tone.color}`,
                      flexShrink: 0,
                    }}
                  />

                  <strong
                    style={{
                      fontSize: "0.76rem",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.84)",
                    }}
                  >
                    {tone.label}
                  </strong>
                </div>

                <span
                  style={{
                    fontSize: "0.78rem",
                    lineHeight: 1.55,
                    color: "rgba(255,255,255,0.58)",
                  }}
                >
                  {tone.description}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {showHintLegend ? (
        <section
          style={{
            position: "relative",
            zIndex: 1,
            display: "grid",
            gap: "10px",
          }}
          aria-label="Dicas de interação"
        >
          <span
            style={{
              fontSize: "0.64rem",
              fontWeight: 800,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.5)",
            }}
          >
            leitura rápida
          </span>

          <div
            style={{
              display: "grid",
              gap: "8px",
              padding: "14px",
              borderRadius: "18px",
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.025)",
            }}
          >
            <span
              style={{
                fontSize: "0.84rem",
                lineHeight: 1.6,
                color: "rgba(255,255,255,0.7)",
              }}
            >
              Passe o mouse pelos nós para abrir o spotlight, use o placar para ler
              volume e acompanhe a legenda para entender o estado operacional de cada
              bloco.
            </span>

            <span
              style={{
                fontSize: "0.76rem",
                lineHeight: 1.55,
                color: "rgba(255,255,255,0.54)",
              }}
            >
              Quando houver filtro ativo, a legenda pode funcionar como chave de
              recorte visual por status.
            </span>
          </div>
        </section>
      ) : null}
    </aside>
  );
}
