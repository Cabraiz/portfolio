// src/pages/Mateus/Live/ui/scene/LiveProjectNodes.tsx

import { useMemo, type CSSProperties } from "react";

import { useLiveProjectSpotlight } from "../../application/useLiveProjectSpotlight";
import {
  LIVE_DEFAULT_SCENE_CONFIG,
  LIVE_PROJECT_STATUS_ORDER,
  LIVE_SCENE_DENSITY_WEIGHTS,
} from "../../domain/live.constants";
import {
  getLiveProjectComplexityLabel,
  getLiveProjectHealthTone,
  getLiveProjectStatusLabel,
} from "../../domain/live.helpers";
import type {
  LiveProjectRecord,
  LiveSceneDensity,
} from "../../domain/live.types";

export type LiveProjectNodesProps = Readonly<{
  className?: string;
  projects?: readonly LiveProjectRecord[];
  density?: LiveSceneDensity;
  maxVisibleNodes?: number;
  autoSelectFirstProject?: boolean;
  selectedProjectId?: string | null;
  hoveredProjectId?: string | null;
  spotlightProjectId?: string | null;
  onProjectSelect?: (projectId: string | null) => void;
  onProjectHover?: (projectId: string | null) => void;
  onProjectLeave?: () => void;
  showClient?: boolean;
  showStack?: boolean;
  showTags?: boolean;
  showHealth?: boolean;
}>;

type PositionedProjectNode = Readonly<{
  project: LiveProjectRecord;
  angleDeg: number;
  radiusPercent: number;
  sizePx: number;
  xPercent: number;
  yPercent: number;
  zIndex: number;
}>;

function joinClassNames(
  ...classNames: Array<string | false | null | undefined>
): string {
  return classNames.filter(Boolean).join(" ");
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function resolveToneColor(project: LiveProjectRecord): string {
  switch (getLiveProjectHealthTone(project.healthScore)) {
    case "success":
      return "rgba(52, 211, 153, 0.92)";
    case "warning":
      return "rgba(251, 191, 36, 0.94)";
    case "info":
      return "rgba(96, 165, 250, 0.92)";
    case "neutral":
    default:
      return "rgba(167, 139, 250, 0.9)";
  }
}

function buildNodeLayout(
  projects: readonly LiveProjectRecord[],
  density: LiveSceneDensity,
): readonly PositionedProjectNode[] {
  const densityWeight = LIVE_SCENE_DENSITY_WEIGHTS[density];
  const safeTotal = Math.max(projects.length, 1);

  return projects.map((project, index) => {
    const angleDeg = -90 + (360 / safeTotal) * index;
    const angleRad = (angleDeg * Math.PI) / 180;
    const tier = index % 2 === 0 ? 0 : 1;

    const radiusPercent =
      density === "dense"
        ? 33 + tier * 10
        : density === "calm"
          ? 28 + tier * 8
          : 31 + tier * 9;

    const isFeatured = Boolean(project.featured);
    const sizePx = Math.round((isFeatured ? 142 : 124) * densityWeight);

    const xPercent = 50 + Math.cos(angleRad) * radiusPercent;
    const yPercent = 50 + Math.sin(angleRad) * (radiusPercent * 0.72);

    return {
      project,
      angleDeg,
      radiusPercent,
      sizePx,
      xPercent,
      yPercent,
      zIndex:
        10_000 -
        LIVE_PROJECT_STATUS_ORDER[project.status] * 100 -
        index * 10 +
        Math.round(project.healthScore),
    };
  });
}

export default function LiveProjectNodes({
  className,
  projects,
  density = LIVE_DEFAULT_SCENE_CONFIG.density,
  maxVisibleNodes = LIVE_DEFAULT_SCENE_CONFIG.maxVisibleNodes,
  autoSelectFirstProject = true,
  selectedProjectId,
  hoveredProjectId,
  spotlightProjectId,
  onProjectSelect,
  onProjectHover,
  onProjectLeave,
  showClient = true,
  showStack = true,
  showTags = false,
  showHealth = true,
}: LiveProjectNodesProps) {
  const spotlight = useLiveProjectSpotlight({
    projects,
    autoSelectFirstProject,
    featuredLimit: maxVisibleNodes,
  });

  const resolvedProjects = useMemo(() => {
    return spotlight.visibleProjects.slice(0, maxVisibleNodes);
  }, [maxVisibleNodes, spotlight.visibleProjects]);

  const resolvedActiveProjectId =
    selectedProjectId ?? spotlight.activeProjectId ?? null;
  const resolvedHoveredProjectId =
    hoveredProjectId ?? spotlight.hoveredProjectId ?? null;
  const resolvedSpotlightProjectId =
    spotlightProjectId ?? spotlight.spotlightProjectId ?? null;

  const nodes = useMemo(() => {
    return buildNodeLayout(resolvedProjects, density);
  }, [density, resolvedProjects]);

  const handleSelect = (projectId: string) => {
    if (onProjectSelect) {
      onProjectSelect(projectId);
      return;
    }

    spotlight.selectProject(projectId);
  };

  const handleHover = (projectId: string) => {
    if (onProjectHover) {
      onProjectHover(projectId);
      return;
    }

    spotlight.hoverProject(projectId);
  };

  const handleLeave = () => {
    if (onProjectLeave) {
      onProjectLeave();
      return;
    }

    spotlight.clearHover();
  };

  return (
    <div
      className={joinClassNames(className)}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 4,
        pointerEvents: "none",
      }}
      data-live-project-nodes="true"
      aria-label="Nós de projetos ao vivo"
    >
      {nodes.map(({ project, angleDeg, sizePx, xPercent, yPercent, zIndex }) => {
        const isActive = resolvedActiveProjectId === project.id;
        const isHovered = resolvedHoveredProjectId === project.id;
        const isSpotlighted = resolvedSpotlightProjectId === project.id;
        const accentColor = resolveToneColor(project);
        const shadowColor = accentColor.replace("0.92", "0.22").replace("0.94", "0.22");
        const healthWidth = `${clamp(project.healthScore, 0, 100)}%`;

        const nodeStyle: CSSProperties = {
          position: "absolute",
          left: `${xPercent}%`,
          top: `${yPercent}%`,
          width: `${sizePx}px`,
          minHeight: `${Math.round(sizePx * 0.82)}px`,
          transform: `translate(-50%, -50%) rotate(${angleDeg * 0.04}deg) scale(${
            isSpotlighted ? 1.06 : isHovered ? 1.03 : 1
          })`,
          transformOrigin: "center",
          zIndex,
          pointerEvents: "auto",
          appearance: "none",
          display: "grid",
          gap: "8px",
          padding: "14px 14px 12px",
          borderRadius: "20px",
          border: `1px solid ${
            isSpotlighted ? accentColor : "rgba(255, 255, 255, 0.12)"
          }`,
          background:
            isSpotlighted || isActive
              ? "linear-gradient(180deg, rgba(14, 19, 28, 0.96), rgba(8, 12, 18, 0.98))"
              : "linear-gradient(180deg, rgba(11, 16, 22, 0.9), rgba(7, 10, 15, 0.94))",
          boxShadow: isSpotlighted
            ? `0 16px 40px ${shadowColor}, 0 0 0 1px ${accentColor}`
            : isHovered
              ? `0 14px 30px ${shadowColor}`
              : "0 12px 28px rgba(0, 0, 0, 0.22)",
          color: "rgba(255, 255, 255, 0.9)",
          textAlign: "left",
          cursor: "pointer",
          transition:
            "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease",
          backdropFilter: "blur(12px)",
        };

        return (
          <button
            key={project.id}
            type="button"
            style={nodeStyle}
            title={`${project.name} · ${getLiveProjectStatusLabel(project.status)}`}
            aria-label={`${project.name} · ${project.clientLabel} · ${getLiveProjectStatusLabel(
              project.status,
            )}`}
            data-live-node="true"
            data-live-project-id={project.id}
            data-live-parallax={String(project.featured ? 1.1 : 0.72)}
            data-status={project.status}
            data-complexity={project.complexity}
            data-featured={project.featured ? "true" : "false"}
            data-active={isActive ? "true" : "false"}
            data-hovered={isHovered ? "true" : "false"}
            data-spotlighted={isSpotlighted ? "true" : "false"}
            aria-pressed={isActive}
            onClick={() => {
              handleSelect(project.id);
            }}
            onMouseEnter={() => {
              handleHover(project.id);
            }}
            onMouseLeave={handleLeave}
            onFocus={() => {
              handleHover(project.id);
            }}
            onBlur={handleLeave}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "10px",
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  minHeight: "24px",
                  padding: "5px 8px",
                  borderRadius: "999px",
                  border: `1px solid ${accentColor}`,
                  background: "rgba(255, 255, 255, 0.04)",
                  color: "rgba(255, 255, 255, 0.82)",
                  fontSize: "0.62rem",
                  fontWeight: 800,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                }}
              >
                {getLiveProjectStatusLabel(project.status)}
              </span>

              <span
                style={{
                  width: "10px",
                  height: "10px",
                  flexShrink: 0,
                  borderRadius: "999px",
                  background: accentColor,
                  boxShadow: `0 0 12px ${shadowColor}`,
                }}
              />
            </div>

            <div style={{ display: "grid", gap: "4px" }}>
              <strong
                style={{
                  fontSize: "0.88rem",
                  lineHeight: 1.15,
                  letterSpacing: "-0.03em",
                }}
              >
                {project.name}
              </strong>

              {showClient ? (
                <span
                  style={{
                    fontSize: "0.72rem",
                    lineHeight: 1.35,
                    color: "rgba(255, 255, 255, 0.62)",
                  }}
                >
                  {project.clientLabel}
                </span>
              ) : null}
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "6px",
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  minHeight: "24px",
                  padding: "4px 8px",
                  borderRadius: "999px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  fontSize: "0.62rem",
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.68)",
                }}
              >
                {getLiveProjectComplexityLabel(project.complexity)}
              </span>

              {showStack
                ? project.stack.slice(0, 2).map((stackItem) => (
                    <span
                      key={`${project.id}-${stackItem}`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        minHeight: "24px",
                        padding: "4px 8px",
                        borderRadius: "999px",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        fontSize: "0.62rem",
                        fontWeight: 700,
                        color: "rgba(255,255,255,0.68)",
                      }}
                    >
                      {stackItem}
                    </span>
                  ))
                : null}

              {showTags
                ? project.tags.slice(0, 2).map((tag) => (
                    <span
                      key={`${project.id}-${tag}`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        minHeight: "24px",
                        padding: "4px 8px",
                        borderRadius: "999px",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        fontSize: "0.62rem",
                        fontWeight: 700,
                        color: "rgba(255,255,255,0.68)",
                      }}
                    >
                      {tag}
                    </span>
                  ))
                : null}
            </div>

            {showHealth ? (
              <div
                style={{
                  display: "grid",
                  gap: "6px",
                  marginTop: "auto",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "10px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.62rem",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.52)",
                    }}
                  >
                    saúde operacional
                  </span>

                  <strong
                    style={{
                      fontSize: "0.72rem",
                      color: "rgba(255,255,255,0.84)",
                    }}
                  >
                    {Math.round(project.healthScore)}%
                  </strong>
                </div>

                <div
                  style={{
                    width: "100%",
                    height: "7px",
                    borderRadius: "999px",
                    background: "rgba(255,255,255,0.08)",
                    overflow: "hidden",
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      width: healthWidth,
                      height: "100%",
                      borderRadius: "999px",
                      background: accentColor,
                      boxShadow: `0 0 12px ${shadowColor}`,
                    }}
                  />
                </div>
              </div>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
