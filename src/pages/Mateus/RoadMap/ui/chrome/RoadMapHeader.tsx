import { memo, useMemo, type CSSProperties } from "react";

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

function MetaPill({ label, active = false }: MetaPillProps) {
  const style: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "34px",
    padding: "0 12px",
    borderRadius: "999px",
    border: active
      ? "1px solid rgba(37, 99, 235, 0.22)"
      : "1px solid rgba(148, 163, 184, 0.18)",
    background: active ? "rgba(37, 99, 235, 0.08)" : "rgba(255,255,255,0.88)",
    color: active ? "#1d4ed8" : "#0f172a",
    fontSize: "0.75rem",
    fontWeight: 800,
    lineHeight: 1,
    whiteSpace: "nowrap",
    boxShadow: active
      ? "0 10px 24px rgba(37, 99, 235, 0.10)"
      : "0 8px 18px rgba(15, 23, 42, 0.04)",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
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
  const containerStyle = useMemo<CSSProperties>(
    () => ({
      display: "grid",
      gridTemplateColumns: "minmax(0, 1fr) auto",
      gap: "20px",
      alignItems: "start",
      padding: "20px 22px",
      borderRadius: "24px",
      border: "1px solid rgba(148, 163, 184, 0.16)",
      background:
        "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.98) 100%)",
      boxShadow:
        "0 18px 50px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255,255,255,0.78)",
    }),
    [],
  );

  const contentStyle = useMemo<CSSProperties>(
    () => ({
      display: "grid",
      gap: "10px",
      minWidth: 0,
    }),
    [],
  );

  const eyebrowStyle = useMemo<CSSProperties>(
    () => ({
      display: "inline-flex",
      alignItems: "center",
      width: "fit-content",
      minHeight: "24px",
      padding: "0 10px",
      borderRadius: "999px",
      background: "rgba(37, 99, 235, 0.08)",
      color: "#1d4ed8",
      fontSize: "0.68rem",
      fontWeight: 800,
      lineHeight: 1,
      textTransform: "uppercase",
      letterSpacing: "0.08em",
      fontFamily:
        'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }),
    [],
  );

  const titleStyle = useMemo<CSSProperties>(
    () => ({
      margin: 0,
      color: "#0f172a",
      fontSize: "1.45rem",
      fontWeight: 900,
      lineHeight: 1.04,
      letterSpacing: "-0.03em",
      fontFamily:
        'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }),
    [],
  );

  const subtitleStyle = useMemo<CSSProperties>(
    () => ({
      margin: 0,
      color: "#475569",
      fontSize: "0.94rem",
      lineHeight: 1.55,
      maxWidth: "72ch",
      fontFamily:
        'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }),
    [],
  );

  const metaWrapperStyle = useMemo<CSSProperties>(
    () => ({
      display: "flex",
      flexWrap: "wrap",
      justifyContent: "flex-end",
      alignItems: "center",
      gap: "10px",
      maxWidth: "340px",
    }),
    [],
  );

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
