import { memo, useMemo, type CSSProperties } from "react";

import type { RoadMapLayoutViewport } from "../../domain/model/roadmap.layout.types";
import type { RoadMapNode as RoadMapNodeModel } from "../../domain/model/roadmap.types";
import {
  getRoadMapNodeDimensions,
  getRoadMapNodePosition,
} from "../../application/services/resolveRoadMapNodeCollisions";

type RoadMapNodeProps = Readonly<{
  node: RoadMapNodeModel;
  positionKey?: RoadMapLayoutViewport;
  isActive?: boolean;
  isHovered?: boolean;
  isDimmed?: boolean;
  onSelect?: (nodeId: string) => void;
  onHover?: (nodeId: string | null) => void;
}>;

type NodePalette = Readonly<{
  background: string;
  border: string;
  text: string;
  accent: string;
  eyebrow: string;
}>;

const DEFAULT_NODE_PALETTE: NodePalette = {
  background: "#ffffff",
  border: "rgba(148, 163, 184, 0.18)",
  text: "#0f172a",
  accent: "#2563eb",
  eyebrow: "#475569",
};

function getNodePalette(node: RoadMapNodeModel): NodePalette {
  switch (node.kind) {
    case "domain":
      return {
        background: "#0f172a",
        border: "rgba(148, 163, 184, 0.18)",
        text: "#f8fafc",
        accent: "#93c5fd",
        eyebrow: "rgba(219, 234, 254, 0.96)",
      };

    case "topic":
      return {
        background: "#ffffff",
        border: "rgba(148, 163, 184, 0.2)",
        text: "#0f172a",
        accent: "#2563eb",
        eyebrow: "#334155",
      };

    case "technology":
      return DEFAULT_NODE_PALETTE;

    case "concept":
      return {
        background: "#f8fafc",
        border: "rgba(148, 163, 184, 0.16)",
        text: "#334155",
        accent: "#2563eb",
        eyebrow: "#475569",
      };

    default:
      return DEFAULT_NODE_PALETTE;
  }
}

function getNodeEyebrow(node: RoadMapNodeModel): string | null {
  if (node.kind === "domain") {
    return "Frente";
  }

  if (node.kind === "topic") {
    return "Bloco";
  }

  if (node.kind === "technology" && node.featured) {
    return "Foco";
  }

  return null;
}

function getNodePadding(node: RoadMapNodeModel): string {
  switch (node.kind) {
    case "domain":
      return "16px 18px";
    case "concept":
      return "8px 12px";
    default:
      return "11px 14px";
  }
}

function getNodeBorderRadius(node: RoadMapNodeModel): string {
  switch (node.kind) {
    case "domain":
      return "20px";
    case "concept":
      return "999px";
    default:
      return "16px";
  }
}

function getNodeTitleFontSize(node: RoadMapNodeModel): string {
  switch (node.kind) {
    case "domain":
      return "0.98rem";
    case "topic":
      return "0.9rem";
    case "technology":
      return "0.86rem";
    case "concept":
      return "0.8rem";
    default:
      return "0.86rem";
  }
}

function getNodeTitleFontWeight(node: RoadMapNodeModel): number {
  return node.kind === "domain" ? 800 : 700;
}

function getNodeBackgroundColor(
  node: RoadMapNodeModel,
  isActive: boolean,
  palette: NodePalette,
): string {
  if (isActive && node.kind !== "domain") {
    return "#f8fbff";
  }

  return palette.background;
}

function getNodeBorderColor(
  isActive: boolean,
  palette: NodePalette,
): string {
  if (isActive) {
    return palette.accent;
  }

  return palette.border;
}

function getNodeBoxShadow(
  node: RoadMapNodeModel,
  isActive: boolean,
  isHovered: boolean,
): string {
  if (isActive) {
    if (node.kind === "domain") {
      return "0 18px 38px rgba(15, 23, 42, 0.22)";
    }

    return "0 12px 28px rgba(15, 23, 42, 0.08)";
  }

  if (isHovered) {
    return "0 8px 18px rgba(15, 23, 42, 0.06)";
  }

  return "0 1px 2px rgba(15, 23, 42, 0.03)";
}

function getNodeTransform(isActive: boolean, isHovered: boolean): string {
  return isActive || isHovered ? "translateY(-1px)" : "translateY(0)";
}

function getAccentBarBackground(
  node: RoadMapNodeModel,
  isActive: boolean,
): string {
  if (isActive || node.kind === "domain") {
    return "rgba(147, 197, 253, 0.9)";
  }

  if (node.kind === "technology" && node.featured) {
    return "rgba(37, 99, 235, 0.76)";
  }

  return "transparent";
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
  const dimensions = useMemo(() => getRoadMapNodeDimensions(node), [node]);
  const position = useMemo(
    () => getRoadMapNodePosition(node, positionKey),
    [node, positionKey],
  );
  const eyebrow = useMemo(() => getNodeEyebrow(node), [node]);

  const style = useMemo<CSSProperties>(() => {
    const backgroundColor = getNodeBackgroundColor(node, isActive, palette);
    const borderColor = getNodeBorderColor(isActive, palette);
    const boxShadow = getNodeBoxShadow(node, isActive, isHovered);
    const transform = getNodeTransform(isActive, isHovered);

    return {
      position: "absolute",
      left: `${position.x}px`,
      top: `${position.y}px`,
      width: `${dimensions.width}px`,
      minHeight: `${dimensions.height}px`,
      padding: getNodePadding(node),
      borderRadius: getNodeBorderRadius(node),
      border: `1px solid ${borderColor}`,
      background: backgroundColor,
      color: palette.text,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: node.kind === "concept" ? "center" : "flex-start",
      gap: eyebrow ? "6px" : 0,
      textAlign: node.kind === "concept" ? "center" : "left",
      cursor: "pointer",
      userSelect: "none",
      opacity: isDimmed ? 0.28 : 1,
      zIndex: isActive ? 6 : isHovered ? 5 : 3,
      fontFamily:
        'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      boxSizing: "border-box",
      boxShadow,
      transform,
      transition:
        "transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease, background-color 160ms ease, opacity 160ms ease",
      appearance: "none",
      WebkitAppearance: "none",
    };
  }, [
    dimensions.height,
    dimensions.width,
    eyebrow,
    isActive,
    isDimmed,
    isHovered,
    node,
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
          : "rgba(148, 163, 184, 0.1)",
      color: palette.eyebrow,
      fontSize: "0.61rem",
      fontWeight: 700,
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
      lineHeight: 1.16,
      fontSize: getNodeTitleFontSize(node),
      fontWeight: getNodeTitleFontWeight(node),
      letterSpacing: "-0.02em",
      overflowWrap: "anywhere",
    }),
    [node],
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
      background: getAccentBarBackground(node, isActive),
    }),
    [isActive, node],
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
