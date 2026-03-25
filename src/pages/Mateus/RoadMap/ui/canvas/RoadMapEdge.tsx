import { memo, useMemo, type CSSProperties } from "react";

import type { RoadMapNode as RoadMapNodeModel } from "../../domain/model/roadmap.types";

type RoadMapCanvasPositionKey = "desktop" | "mobile";

type RoadMapNodeProps = Readonly<{
  node: RoadMapNodeModel;
  positionKey?: RoadMapCanvasPositionKey;
  isActive?: boolean;
  isHovered?: boolean;
  isDimmed?: boolean;
  onSelect?: (nodeId: string) => void;
  onHover?: (nodeId: string | null) => void;
}>;

type NodeDimensions = Readonly<{
  width: number;
  minHeight: number;
}>;

function getNodeDimensions(node: RoadMapNodeModel): NodeDimensions {
  switch (node.kind) {
    case "domain":
      return { width: 260, minHeight: 84 };
    case "topic":
      return { width: 224, minHeight: 60 };
    case "technology":
      return { width: 208, minHeight: 56 };
    case "concept":
      return { width: 176, minHeight: 42 };
    default:
      return { width: 208, minHeight: 56 };
  }
}

function getNodePalette(node: RoadMapNodeModel): Readonly<{
  background: string;
  border: string;
  text: string;
  accent: string;
  eyebrow: string;
}> {
  switch (node.kind) {
    case "domain":
      return {
        background: "#0f172a",
        border: "rgba(59, 130, 246, 0.32)",
        text: "#f8fafc",
        accent: "#60a5fa",
        eyebrow: "rgba(191, 219, 254, 0.92)",
      };
    case "topic":
      return {
        background: "#ffffff",
        border: "rgba(37, 99, 235, 0.16)",
        text: "#0f172a",
        accent: "#2563eb",
        eyebrow: "#1d4ed8",
      };
    case "technology":
      return {
        background: "#ffffff",
        border: "rgba(148, 163, 184, 0.2)",
        text: "#0f172a",
        accent: "#2563eb",
        eyebrow: "#2563eb",
      };
    case "concept":
      return {
        background: "#f8fafc",
        border: "rgba(148, 163, 184, 0.16)",
        text: "#1e293b",
        accent: "#2563eb",
        eyebrow: "#475569",
      };
    default:
      return {
        background: "#ffffff",
        border: "rgba(148, 163, 184, 0.2)",
        text: "#0f172a",
        accent: "#2563eb",
        eyebrow: "#2563eb",
      };
  }
}

function getNodeEyebrow(node: RoadMapNodeModel): string | null {
  if (node.kind === "domain") {
    return "Stack";
  }

  if (node.kind === "topic") {
    return "Bloco";
  }

  if (node.kind === "technology" && node.featured) {
    return "Principal";
  }

  return null;
}

function getPosition(
  node: RoadMapNodeModel,
  positionKey: RoadMapCanvasPositionKey,
): { x: number; y: number } {
  const position = node[positionKey] ?? node.desktop ?? node.mobile ?? { x: 0, y: 0 };

  return {
    x: position.x,
    y: position.y,
  };
}

function RoadMapNodeComponent({
  node,
  positionKey = "desktop",
  isActive = false,
  isHovered = false,
  isDimmed = false,
  onSelect,
  onHover,
}: RoadMapNodeProps) {
  const palette = useMemo(() => getNodePalette(node), [node]);
  const dimensions = useMemo(() => getNodeDimensions(node), [node]);
  const position = useMemo(() => getPosition(node, positionKey), [node, positionKey]);
  const eyebrow = useMemo(() => getNodeEyebrow(node), [node]);

  const style = useMemo<CSSProperties>(() => {
    const borderColor = isActive ? palette.accent : palette.border;
    const backgroundColor =
      isActive && node.kind !== "domain" ? "#eff6ff" : palette.background;

    return {
      position: "absolute",
      left: `${position.x}px`,
      top: `${position.y}px`,
      width: `${dimensions.width}px`,
      minHeight: `${dimensions.minHeight}px`,
      padding:
        node.kind === "domain"
          ? "14px 16px"
          : node.kind === "concept"
            ? "8px 12px"
            : "10px 14px",
      borderRadius:
        node.kind === "domain" ? "18px" : node.kind === "concept" ? "999px" : "14px",
      border: `1px solid ${borderColor}`,
      background: backgroundColor,
      color: palette.text,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: node.kind === "concept" ? "center" : "flex-start",
      gap: eyebrow ? "4px" : 0,
      textAlign: node.kind === "concept" ? "center" : "left",
      cursor: "pointer",
      userSelect: "none",
      opacity: isDimmed ? 0.34 : 1,
      zIndex: isActive ? 6 : isHovered ? 5 : 3,
      fontFamily:
        'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      boxSizing: "border-box",
      outline: isActive ? "2px solid rgba(37, 99, 235, 0.14)" : "none",
      outlineOffset: "0",
    };
  }, [
    dimensions,
    eyebrow,
    isActive,
    isDimmed,
    isHovered,
    node.kind,
    palette,
    position.x,
    position.y,
  ]);

  const eyebrowStyle = useMemo<CSSProperties>(
    () => ({
      display: "inline-flex",
      alignItems: "center",
      minHeight: "16px",
      padding: "0 6px",
      borderRadius: "999px",
      background:
        node.kind === "domain"
          ? "rgba(255,255,255,0.1)"
          : "rgba(37, 99, 235, 0.08)",
      color: palette.eyebrow,
      fontSize: "0.62rem",
      fontWeight: 800,
      lineHeight: 1,
      letterSpacing: "0.04em",
      textTransform: "uppercase",
      whiteSpace: "nowrap",
    }),
    [node.kind, palette.eyebrow],
  );

  const titleStyle = useMemo<CSSProperties>(
    () => ({
      margin: 0,
      width: "100%",
      lineHeight: 1.12,
      fontSize:
        node.kind === "domain"
          ? "1rem"
          : node.kind === "topic"
            ? "0.9rem"
            : node.kind === "technology"
              ? "0.88rem"
              : "0.8rem",
      fontWeight: node.kind === "domain" ? 800 : 700,
      letterSpacing: "-0.02em",
      overflowWrap: "anywhere",
    }),
    [node.kind],
  );

  const accentBarStyle = useMemo<CSSProperties>(
    () => ({
      position: "absolute",
      top: "0",
      left: node.kind === "concept" ? "18%" : "14px",
      right: node.kind === "concept" ? "18%" : "14px",
      height: "2px",
      borderTopLeftRadius: "999px",
      borderTopRightRadius: "999px",
      background:
        node.kind === "domain"
          ? "rgba(96, 165, 250, 0.92)"
          : node.kind === "technology" && node.featured
            ? "rgba(37, 99, 235, 0.82)"
            : "transparent",
    }),
    [node.featured, node.kind],
  );

  return (
    <button
      type="button"
      aria-pressed={isActive}
      aria-label={node.label}
      title={node.description ?? node.label}
      style={style}
      onClick={() => onSelect?.(node.id)}
      onMouseEnter={() => onHover?.(node.id)}
      onMouseLeave={() => onHover?.(null)}
      onFocus={() => onHover?.(node.id)}
      onBlur={() => onHover?.(null)}
    >
      <span aria-hidden="true" style={accentBarStyle} />

      {eyebrow ? <span style={eyebrowStyle}>{eyebrow}</span> : null}

      <span style={titleStyle}>{node.shortLabel ?? node.label}</span>
    </button>
  );
}

export default memo(RoadMapNodeComponent);
