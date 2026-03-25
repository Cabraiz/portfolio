import { memo, useMemo, type CSSProperties } from "react";

import type { RoadMapNode as RoadMapNodeModel } from "../../domain/model/roadmap.types";

type RoadMapCanvasPositionKey = "desktop" | "mobile";

type RoadMapNodeProps = Readonly<{
  node: RoadMapNodeModel;
  positionKey?: RoadMapCanvasPositionKey;
  isActive?: boolean;
  isHovered?: boolean;
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
      return { width: 240, minHeight: 72 };
    case "topic":
      return { width: 220, minHeight: 64 };
    case "technology":
      return { width: 200, minHeight: 64 };
    case "concept":
      return { width: 176, minHeight: 52 };
    default:
      return { width: 200, minHeight: 60 };
  }
}

function getNodePalette(node: RoadMapNodeModel): Readonly<{
  background: string;
  border: string;
  text: string;
  shadow: string;
  accent: string;
}> {
  switch (node.kind) {
    case "domain":
      return {
        background: "#fff35c",
        border: "#191919",
        text: "#0f0f0f",
        shadow: "0 12px 28px rgba(0, 0, 0, 0.16)",
        accent: "#1e5eff",
      };
    case "topic":
      return {
        background: "#f3e4a0",
        border: "#1f1f1f",
        text: "#161616",
        shadow: "0 10px 22px rgba(0, 0, 0, 0.12)",
        accent: "#1e5eff",
      };
    case "technology":
      return {
        background: "#efe5c7",
        border: "#1f1f1f",
        text: "#181818",
        shadow: "0 8px 18px rgba(0, 0, 0, 0.10)",
        accent: "#155eef",
      };
    case "concept":
      return {
        background: "#f5ebc8",
        border: "#262626",
        text: "#1a1a1a",
        shadow: "0 6px 14px rgba(0, 0, 0, 0.08)",
        accent: "#155eef",
      };
    default:
      return {
        background: "#f1e6bf",
        border: "#1f1f1f",
        text: "#181818",
        shadow: "0 8px 18px rgba(0, 0, 0, 0.10)",
        accent: "#155eef",
      };
  }
}

function getDemandBadgeLabel(node: RoadMapNodeModel): string {
  switch (node.demand) {
    case "core":
      return "Essencial";
    case "important":
      return "Importante";
    case "optional":
      return "Opcional";
    case "niche":
      return "Nicho";
    default:
      return "";
  }
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
  onSelect,
  onHover,
}: RoadMapNodeProps) {
  const palette = useMemo(() => getNodePalette(node), [node]);
  const dimensions = useMemo(() => getNodeDimensions(node), [node]);
  const position = useMemo(
    () => getPosition(node, positionKey),
    [node, positionKey],
  );

  const style = useMemo<CSSProperties>(() => {
    const borderColor = isActive ? palette.accent : palette.border;
    const transform = isActive
      ? "translate3d(0, 0, 0) scale(1.02)"
      : isHovered
        ? "translate3d(0, 0, 0) scale(1.01)"
        : "translate3d(0, 0, 0) scale(1)";

    return {
      position: "absolute",
      left: `${position.x}px`,
      top: `${position.y}px`,
      width: `${dimensions.width}px`,
      minHeight: `${dimensions.minHeight}px`,
      padding: node.kind === "concept" ? "8px 12px" : "12px 14px",
      borderRadius: node.kind === "domain" ? "8px" : "7px",
      border: `2px solid ${borderColor}`,
      background: palette.background,
      color: palette.text,
      boxShadow: isActive
        ? `0 0 0 3px rgba(30, 94, 255, 0.15), ${palette.shadow}`
        : palette.shadow,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      gap: node.kind === "concept" ? "2px" : "6px",
      textAlign: "center",
      cursor: "pointer",
      userSelect: "none",
      transform,
      transition:
        "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease, opacity 180ms ease",
      zIndex: isActive ? 5 : isHovered ? 4 : 3,
      fontFamily:
        'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    };
  }, [dimensions, isActive, isHovered, node.kind, palette, position.x, position.y]);

  const titleStyle = useMemo<CSSProperties>(
    () => ({
      margin: 0,
      lineHeight: 1.15,
      fontSize: node.kind === "domain" ? "0.96rem" : node.kind === "concept" ? "0.84rem" : "0.9rem",
      fontWeight: node.kind === "domain" ? 800 : 700,
      letterSpacing: "-0.01em",
    }),
    [node.kind],
  );

  const subtitleStyle = useMemo<CSSProperties>(
    () => ({
      margin: 0,
      fontSize: "0.7rem",
      lineHeight: 1.2,
      fontWeight: 600,
      opacity: 0.85,
    }),
    [],
  );

  const badgeStyle = useMemo<CSSProperties>(
    () => ({
      display: node.kind === "concept" ? "none" : "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "2px 8px",
      borderRadius: "999px",
      background: "rgba(15, 15, 15, 0.08)",
      color: "#111111",
      fontSize: "0.68rem",
      fontWeight: 700,
      lineHeight: 1,
      whiteSpace: "nowrap",
    }),
    [node.kind],
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
    >
      <span style={titleStyle}>{node.shortLabel ?? node.label}</span>

      {node.kind !== "concept" && (
        <span style={badgeStyle}>{getDemandBadgeLabel(node)}</span>
      )}

      {node.kind === "domain" && node.description && (
        <span style={subtitleStyle}>{node.description}</span>
      )}
    </button>
  );
}

export default memo(RoadMapNodeComponent);
