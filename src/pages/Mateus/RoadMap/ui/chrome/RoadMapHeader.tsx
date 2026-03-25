import { memo, useMemo, type CSSProperties } from "react";

type RoadMapHeaderProps = Readonly<{
  title: string;
  subtitle?: string;
  visibleNodeCount?: number;
  visibleEdgeCount?: number;
  activeNodeLabel?: string | null;
}>;

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
      border: "1px solid rgba(30, 94, 255, 0.08)",
      background:
        "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.96) 100%)",
      boxShadow:
        "0 18px 50px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255,255,255,0.78)",
    }),
    [],
  );

  const titleStyle = useMemo<CSSProperties>(
    () => ({
      margin: 0,
      color: "#0f172a",
      fontSize: "1.55rem",
      fontWeight: 900,
      lineHeight: 1.05,
      letterSpacing: "-0.03em",
      fontFamily:
        'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }),
    [],
  );

  const subtitleStyle = useMemo<CSSProperties>(
    () => ({
      margin: "8px 0 0",
      color: "#475569",
      fontSize: "0.97rem",
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
      gap: "10px",
      alignItems: "center",
    }),
    [],
  );

  const badgeStyle = useMemo<CSSProperties>(
    () => ({
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "36px",
      padding: "0 12px",
      borderRadius: "999px",
      border: "1px solid rgba(15, 23, 42, 0.08)",
      background: "rgba(255,255,255,0.94)",
      color: "#0f172a",
      fontSize: "0.76rem",
      fontWeight: 800,
      lineHeight: 1,
      whiteSpace: "nowrap",
      boxShadow: "0 8px 20px rgba(15, 23, 42, 0.05)",
      fontFamily:
        'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }),
    [],
  );

  const activeBadgeStyle = useMemo<CSSProperties>(
    () => ({
      ...badgeStyle,
      background: "rgba(30, 94, 255, 0.08)",
      border: "1px solid rgba(30, 94, 255, 0.18)",
      color: "#15308f",
    }),
    [badgeStyle],
  );

  return (
    <header style={containerStyle}>
      <div>
        <h2 style={titleStyle}>{title}</h2>
        {subtitle ? <p style={subtitleStyle}>{subtitle}</p> : null}
      </div>

      <div style={metaWrapperStyle}>
        <span style={badgeStyle}>{visibleNodeCount} nós visíveis</span>
        <span style={badgeStyle}>{visibleEdgeCount} relações visíveis</span>
        {activeNodeLabel ? (
          <span style={activeBadgeStyle}>Selecionado: {activeNodeLabel}</span>
        ) : null}
      </div>
    </header>
  );
}

export default memo(RoadMapHeaderComponent);
