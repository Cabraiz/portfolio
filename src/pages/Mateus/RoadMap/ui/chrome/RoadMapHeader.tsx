import { memo, type CSSProperties } from "react";

type RoadMapHeaderProps = Readonly<{
  title: string;
  subtitle?: string;
  visibleNodeCount?: number;
  visibleEdgeCount?: number;
  activeNodeLabel?: string | null;
}>;

type MetaPillProps = Readonly<{
  label: string;
  active?: boolean;
}>;

const FONT_FAMILY =
  'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

function MetaPill({ label, active = false }: MetaPillProps) {
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

function RoadMapHeaderComponent({
  title,
  subtitle,
  visibleNodeCount = 0,
  visibleEdgeCount = 0,
  activeNodeLabel = null,
}: RoadMapHeaderProps) {
  const containerStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    gap: "16px",
    alignItems: "start",
    padding: "18px 20px",
    borderRadius: "20px",
    border: "1px solid rgba(148, 163, 184, 0.16)",
    background: "#ffffff",
  };

  const contentStyle: CSSProperties = {
    display: "grid",
    gap: "8px",
    minWidth: 0,
  };

  const eyebrowStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    width: "fit-content",
    minHeight: "22px",
    padding: "0 9px",
    borderRadius: "999px",
    background: "rgba(37, 99, 235, 0.08)",
    color: "#1d4ed8",
    fontSize: "0.66rem",
    fontWeight: 800,
    lineHeight: 1,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontFamily: FONT_FAMILY,
  };

  const titleStyle: CSSProperties = {
    margin: 0,
    color: "#0f172a",
    fontSize: "1.3rem",
    fontWeight: 900,
    lineHeight: 1.06,
    letterSpacing: "-0.03em",
    fontFamily: FONT_FAMILY,
  };

  const subtitleStyle: CSSProperties = {
    margin: 0,
    color: "#475569",
    fontSize: "0.9rem",
    lineHeight: 1.55,
    maxWidth: "68ch",
    fontFamily: FONT_FAMILY,
  };

  const metaWrapperStyle: CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: "8px",
    maxWidth: "320px",
  };

  return (
    <header style={containerStyle}>
      <div style={contentStyle}>
        <span style={eyebrowStyle}>Stack visual</span>
        <h2 style={titleStyle}>{title}</h2>
        {subtitle ? <p style={subtitleStyle}>{subtitle}</p> : null}
      </div>

      <div style={metaWrapperStyle}>
        <MetaPill label={`${visibleNodeCount} itens`} />
        <MetaPill label={`${visibleEdgeCount} conexões`} />
        {activeNodeLabel ? (
          <MetaPill label={`Foco: ${activeNodeLabel}`} active />
        ) : null}
      </div>
    </header>
  );
}

export default memo(RoadMapHeaderComponent);
