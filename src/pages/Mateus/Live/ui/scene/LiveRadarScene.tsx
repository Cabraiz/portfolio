// src/pages/Mateus/Live/ui/scene/LiveRadarScene.tsx

import { useMemo, type CSSProperties } from "react";

import { LIVE_DEFAULT_SCENE_CONFIG } from "../../domain/live.constants";
import type { PointerSnapshot } from "../../domain/live.scene";
import type { LiveProjectRecord, LiveSceneDensity } from "../../domain/live.types";
import LiveAmbientGrid from "./LiveAmbientGrid";
import LiveCursorField from "./LiveCursorField";
import LiveProjectNodes from "./LiveProjectNodes";
import LiveSignalPulse from "./LiveSignalPulse";

type LiveRadarSceneSpotlight = Readonly<{
  visibleProjects: readonly LiveProjectRecord[];
  activeProjectId: string | null;
  hoveredProjectId: string | null;
  spotlightProjectId: string | null;
  spotlightProject: LiveProjectRecord | null;
  spotlightTitle: string;
  projectNarrative: string;
  selectProject: (projectId: string | null) => void;
  hoverProject: (projectId: string | null) => void;
  clearHover: () => void;
  selectPreviousProject: () => void;
  selectNextProject: () => void;
}>;

export type LiveRadarSceneProps = Readonly<{
  className?: string;

  density?: LiveSceneDensity;
  pointer: PointerSnapshot;

  sceneTitle: string;
  sceneHint: string;
  sceneMetaLabel: string;

  spotlight: LiveRadarSceneSpotlight;

  onPointerStateChange?: (pointer: PointerSnapshot) => void;
  onPointerLeaveField?: () => void;

  minHeight?: CSSProperties["minHeight"];
  borderRadius?: CSSProperties["borderRadius"];
}>;

function joinClassNames(
  ...classNames: Array<string | false | null | undefined>
): string {
  return classNames.filter(Boolean).join(" ");
}

function toNodeCountLabel(count: number): string {
  return `${count} ${count === 1 ? "nó" : "nós"}`;
}

export default function LiveRadarScene({
  className,
  density = LIVE_DEFAULT_SCENE_CONFIG.density,
  pointer,
  sceneTitle,
  sceneHint,
  sceneMetaLabel,
  spotlight,
  onPointerStateChange,
  onPointerLeaveField,
  minHeight = "clamp(420px, 48vw, 680px)",
  borderRadius = "30px",
}: LiveRadarSceneProps) {
  const spotlightProject = spotlight.spotlightProject;
  const spotlightTags = spotlightProject?.tags.slice(0, 3) ?? [];

  const pulseSize = 102;
  const pulseX = `${30 + pointer.normalizedX * 40}%`;
  const pulseY = `${24 + pointer.normalizedY * 36}%`;

  const sceneHudStyle = useMemo<CSSProperties>(() => {
    return {
      ["--live-scene-pointer-x" as const]: `${Math.round(pointer.normalizedX * 100)}%`,
      ["--live-scene-pointer-y" as const]: `${Math.round(pointer.normalizedY * 100)}%`,
    } as CSSProperties;
  }, [pointer.normalizedX, pointer.normalizedY]);

  return (
    <div
      className={joinClassNames(className)}
      style={{
        position: "relative",
        width: "100%",
      }}
    >
        <LiveCursorField
          label={sceneTitle}
          hint={sceneHint}
          minHeight={minHeight}
          borderRadius={borderRadius}
          showCoordinates={false}
          onPointerStateChange={onPointerStateChange}
          onPointerLeaveField={onPointerLeaveField}
        >
        <LiveAmbientGrid
          density={density}
          pointer={pointer}
          minHeight={minHeight}
          borderRadius={borderRadius}
        >
          {[0.28, 0.42, 0.56].map((ringFactor, index) => {
            const size = `${Math.round(100 * ringFactor)}%`;

            return (
              <div
                key={`scene-ring-${ringFactor}`}
                data-live-parallax={String(0.2 + index * 0.16)}
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  width: size,
                  height: size,
                  borderRadius: "999px",
                  border: "1px solid rgba(255,255,255,0.12)",
                  transform: `translate(-50%, -50%) rotate(${index * 12}deg)`,
                  opacity: 0.16 + index * 0.06,
                  zIndex: 1,
                  pointerEvents: "none",
                  boxShadow: "0 0 28px rgba(96,165,250,0.08), inset 0 0 18px rgba(255,255,255,0.03)",
                }}
              />
            );
          })}

          <LiveSignalPulse
            x={pulseX}
            y={pulseY}
            size={pulseSize}
            variant="radar"
            label="scan"
            dataParallax={0.8}
          />

          <LiveSignalPulse
            x="50%"
            y="50%"
            size={76}
            variant="soft"
            label="core"
            dataParallax={0.25}
          />

          {spotlightProject ? (
            <LiveSignalPulse
              x={`${46 + pointer.normalizedX * 10}%`}
              y={`${46 + pointer.normalizedY * 10}%`}
              size={64}
              variant="focus"
              label="focus"
              dataParallax={0.96}
            />
          ) : null}

          <div
            style={{
              ...sceneHudStyle,
              position: "absolute",
              left: "24px",
              top: "24px",
              zIndex: 6,
              display: "grid",
              gap: "8px",
              width: "min(420px, calc(100% - 48px))",
              padding: "18px 18px 16px",
              borderRadius: "22px",
              border: "1px solid rgba(255,255,255,0.1)",
              background:
                "linear-gradient(180deg, rgba(9,14,22,0.82) 0%, rgba(9,14,22,0.58) 100%)",
              boxShadow:
                "0 18px 46px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.05)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
            }}
            data-live-parallax="0.18"
          >
            <span
              style={{
                fontSize: "0.68rem",
                fontWeight: 800,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(148, 163, 184, 0.88)",
              }}
            >
              spotlight
            </span>

            <strong
              style={{
                fontSize: "clamp(1rem, 1.2vw, 1.16rem)",
                lineHeight: 1.05,
                color: "rgba(255,255,255,0.94)",
                letterSpacing: "-0.03em",
              }}
            >
              {spotlight.spotlightTitle}
            </strong>

            <span
              style={{
                fontSize: "0.76rem",
                color: "rgba(255,255,255,0.7)",
                lineHeight: 1.35,
              }}
            >
              {spotlightProject
                ? `${spotlightProject.clientLabel} · ${Math.round(
                    spotlightProject.healthScore
                  )}% saúde`
                : "Passe o mouse pelos nós para abrir o spotlight."}
            </span>

            <p
              style={{
                margin: 0,
                fontSize: "0.84rem",
                lineHeight: 1.55,
                color: "rgba(226,232,240,0.82)",
              }}
            >
              {spotlightProject?.summary ?? spotlight.projectNarrative}
            </p>

            {spotlightTags.length > 0 ? (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                {spotlightTags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      minHeight: "30px",
                      padding: "7px 11px",
                      borderRadius: "999px",
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "rgba(255,255,255,0.04)",
                      color: "rgba(255,255,255,0.74)",
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <LiveProjectNodes
            projects={spotlight.visibleProjects}
            density={density}
            maxVisibleNodes={LIVE_DEFAULT_SCENE_CONFIG.maxVisibleNodes}
            selectedProjectId={spotlight.activeProjectId}
            hoveredProjectId={spotlight.hoveredProjectId}
            spotlightProjectId={spotlight.spotlightProjectId}
            onProjectSelect={spotlight.selectProject}
            onProjectHover={spotlight.hoverProject}
            onProjectLeave={spotlight.clearHover}
            showClient
            showStack
            showHealth
          />

          <div
            style={{
              position: "absolute",
              right: "24px",
              bottom: "24px",
              zIndex: 7,
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
            data-live-parallax="0.32"
          >
            <button
              type="button"
              onClick={spotlight.selectPreviousProject}
              style={{
                appearance: "none",
                minHeight: "40px",
                padding: "10px 14px",
                borderRadius: "999px",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(8, 12, 18, 0.72)",
                color: "rgba(255,255,255,0.86)",
                font: "inherit",
                fontSize: "0.74rem",
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                cursor: "pointer",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
              }}
            >
              Anterior
            </button>

            <button
              type="button"
              onClick={spotlight.selectNextProject}
              style={{
                appearance: "none",
                minHeight: "40px",
                padding: "10px 14px",
                borderRadius: "999px",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(8, 12, 18, 0.72)",
                color: "rgba(255,255,255,0.86)",
                font: "inherit",
                fontSize: "0.74rem",
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                cursor: "pointer",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
              }}
            >
              Próximo
            </button>

            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                minHeight: "40px",
                padding: "10px 14px",
                borderRadius: "999px",
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(8, 12, 18, 0.58)",
                color: "rgba(255,255,255,0.72)",
                fontSize: "0.72rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
              }}
            >
              {toNodeCountLabel(spotlight.visibleProjects.length)} · {sceneMetaLabel}
            </span>
          </div>
        </LiveAmbientGrid>
      </LiveCursorField>
    </div>
  );
}
