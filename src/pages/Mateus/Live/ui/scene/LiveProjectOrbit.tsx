// src/pages/Mateus/Live/ui/scene/LiveProjectOrbit.tsx

import { useMemo, useState, type CSSProperties } from "react";

import { useLiveProjectSpotlight } from "../../application/useLiveProjectSpotlight";
import {
  LIVE_DEFAULT_SCENE_CONFIG,
  LIVE_EMPTY_PROJECTS_DESCRIPTION,
  LIVE_EMPTY_PROJECTS_TITLE,
  LIVE_SCENE_DENSITY_WEIGHTS,
} from "../../domain/live.constants";
import type {
  LiveProjectRecord,
  LiveSceneDensity,
} from "../../domain/live.types";
import LiveAmbientGrid from "./LiveAmbientGrid";
import LiveCursorField from "./LiveCursorField";
import LiveProjectNodes from "./LiveProjectNodes";
import LiveSignalPulse from "./LiveSignalPulse";

type PointerSnapshot = Readonly<{
  clientX: number;
  clientY: number;
  normalizedX: number;
  normalizedY: number;
  centeredX: number;
  centeredY: number;
  distance: number;
}>;

export type LiveProjectOrbitProps = Readonly<{
  className?: string;
  projects?: readonly LiveProjectRecord[];
  density?: LiveSceneDensity;
  maxVisibleNodes?: number;
  minHeight?: CSSProperties["minHeight"];
  title?: string;
  hint?: string;
  showOrbitRings?: boolean;
  showSignalPulses?: boolean;
  showHud?: boolean;
  autoSelectFirstProject?: boolean;
}>;

function joinClassNames(
  ...classNames: Array<string | false | null | undefined>
): string {
  return classNames.filter(Boolean).join(" ");
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function getPointerPercent(value: number): number {
  return clamp(value, 0, 1) * 100;
}

export default function LiveProjectOrbit({
  className,
  projects,
  density = LIVE_DEFAULT_SCENE_CONFIG.density,
  maxVisibleNodes = LIVE_DEFAULT_SCENE_CONFIG.maxVisibleNodes,
  minHeight = "clamp(360px, 46vw, 620px)",
  title = "Radar de projetos",
  hint = "Passe o mouse pelos nós para abrir o spotlight e deixar o orbit vivo.",
  showOrbitRings = true,
  showSignalPulses = true,
  showHud = true,
  autoSelectFirstProject = true,
}: LiveProjectOrbitProps) {
  const spotlight = useLiveProjectSpotlight({
    projects,
    autoSelectFirstProject,
    featuredLimit: maxVisibleNodes,
  });

  const [pointer, setPointer] = useState<PointerSnapshot>({
    clientX: 0,
    clientY: 0,
    normalizedX: 0.5,
    normalizedY: 0.5,
    centeredX: 0,
    centeredY: 0,
    distance: 0,
  });

  const densityWeight = LIVE_SCENE_DENSITY_WEIGHTS[density];
  const visibleProjects = spotlight.visibleProjects.slice(0, maxVisibleNodes);
  const hasProjects = visibleProjects.length > 0;

  const relatedProjectNames = useMemo(() => {
    return spotlight.relatedProjects.slice(0, 3);
  }, [spotlight.relatedProjects]);

  const spotlightStatusLabel = spotlight.spotlightProject
    ? `${spotlight.spotlightProject.clientLabel} · ${Math.round(
        spotlight.spotlightProject.healthScore,
      )}% saúde`
    : "Sem projeto em spotlight";

  const pulseX = hasProjects
    ? `${32 + pointer.normalizedX * 36}%`
    : "50%";

  const pulseY = hasProjects
    ? `${24 + pointer.normalizedY * 34}%`
    : "50%";

  if (!hasProjects) {
    return (
      <div
        className={joinClassNames(className)}
        style={{
          minHeight,
          width: "100%",
          display: "grid",
          placeItems: "center",
          borderRadius: "28px",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          background:
            "linear-gradient(180deg, rgba(10, 14, 20, 0.92), rgba(6, 8, 12, 0.96))",
          color: "rgba(255,255,255,0.88)",
          padding: "24px",
          textAlign: "center",
          boxShadow: "0 22px 50px rgba(0, 0, 0, 0.22)",
        }}
      >
        <div style={{ display: "grid", gap: "10px", maxWidth: "42rem" }}>
          <strong
            style={{
              fontSize: "1.14rem",
              letterSpacing: "-0.03em",
            }}
          >
            {LIVE_EMPTY_PROJECTS_TITLE}
          </strong>

          <p
            style={{
              margin: 0,
              fontSize: "0.96rem",
              lineHeight: 1.7,
              color: "rgba(255,255,255,0.62)",
            }}
          >
            {LIVE_EMPTY_PROJECTS_DESCRIPTION}
          </p>
        </div>
      </div>
    );
  }

  return (
    <LiveCursorField
      className={joinClassNames(className)}
      label={title}
      hint={hint}
      minHeight={minHeight}
      onPointerStateChange={setPointer}
      onPointerLeaveField={() => {
        setPointer((current) => ({
          ...current,
          normalizedX: 0.5,
          normalizedY: 0.5,
          centeredX: 0,
          centeredY: 0,
          distance: 0,
        }));
      }}
    >
      <LiveAmbientGrid density={density} pointer={pointer} minHeight={minHeight}>
        {showOrbitRings ? (
          <>
            {[0.28, 0.43, 0.58].map((ringFactor, index) => {
              const size = `${Math.round(100 * ringFactor)}%`;
              const borderOpacity = 0.1 + index * 0.04;

              return (
                <div
                  key={`orbit-ring-${ringFactor}`}
                  data-live-parallax={String(0.18 + index * 0.14)}
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    width: size,
                    height: size,
                    transform: `translate(-50%, -50%) rotate(${index * 14}deg)`,
                    borderRadius: "999px",
                    border: `1px solid rgba(255, 255, 255, ${borderOpacity})`,
                    boxShadow:
                      index === 1
                        ? "0 0 28px rgba(96, 165, 250, 0.08)"
                        : "none",
                    zIndex: 1,
                    pointerEvents: "none",
                  }}
                />
              );
            })}
          </>
        ) : null}

        {showSignalPulses ? (
          <>
            <LiveSignalPulse
              x={pulseX}
              y={pulseY}
              size={Math.round(102 * densityWeight)}
              variant="radar"
              label="scan"
              dataParallax={0.7}
            />

            <LiveSignalPulse
              x="50%"
              y="50%"
              size={Math.round(80 * densityWeight)}
              variant="soft"
              label="core"
              dataParallax={0.25}
            />

            {spotlight.spotlightProject ? (
              <LiveSignalPulse
                x={`${44 + pointer.normalizedX * 12}%`}
                y={`${46 + pointer.normalizedY * 10}%`}
                size={Math.round(64 * densityWeight)}
                variant="focus"
                label="focus"
                dataParallax={0.92}
              />
            ) : null}
          </>
        ) : null}

        <LiveProjectNodes
          projects={visibleProjects}
          density={density}
          maxVisibleNodes={maxVisibleNodes}
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

        {showHud ? (
          <>
            <aside
              style={{
                position: "absolute",
                left: "18px",
                top: "18px",
                zIndex: 7,
                width: "min(360px, calc(100% - 36px))",
                display: "grid",
                gap: "10px",
                padding: "16px",
                borderRadius: "20px",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(8, 12, 18, 0.72)",
                backdropFilter: "blur(14px)",
                boxShadow: "0 16px 38px rgba(0, 0, 0, 0.22)",
              }}
            >
              <span
                style={{
                  fontSize: "0.66rem",
                  fontWeight: 800,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.54)",
                }}
              >
                spotlight
              </span>

              <strong
                style={{
                  fontSize: "1.02rem",
                  lineHeight: 1.1,
                  letterSpacing: "-0.04em",
                  color: "rgba(255,255,255,0.92)",
                }}
              >
                {spotlight.spotlightTitle}
              </strong>

              <span
                style={{
                  fontSize: "0.78rem",
                  color: "rgba(255,255,255,0.62)",
                }}
              >
                {spotlightStatusLabel}
              </span>

              <p
                style={{
                  margin: 0,
                  fontSize: "0.88rem",
                  lineHeight: 1.62,
                  color: "rgba(255,255,255,0.72)",
                }}
              >
                {spotlight.projectNarrative}
              </p>

              {relatedProjectNames.length > 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                  }}
                >
                  {relatedProjectNames.map((project) => (
                    <button
                      key={`related-${project.id}`}
                      type="button"
                      onClick={() => {
                        spotlight.selectProject(project.id);
                      }}
                      onMouseEnter={() => {
                        spotlight.hoverProject(project.id);
                      }}
                      onMouseLeave={() => {
                        spotlight.clearHover();
                      }}
                      style={{
                        appearance: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        minHeight: "30px",
                        padding: "7px 10px",
                        borderRadius: "999px",
                        border: "1px solid rgba(255,255,255,0.1)",
                        background: "rgba(255,255,255,0.04)",
                        color: "rgba(255,255,255,0.76)",
                        font: "inherit",
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {project.name}
                    </button>
                  ))}
                </div>
              ) : null}
            </aside>

            <div
              style={{
                position: "absolute",
                right: "18px",
                bottom: "18px",
                zIndex: 7,
                display: "flex",
                alignItems: "center",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                onClick={spotlight.selectPreviousProject}
                style={{
                  appearance: "none",
                  minHeight: "38px",
                  padding: "10px 14px",
                  borderRadius: "999px",
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(8, 12, 18, 0.72)",
                  color: "rgba(255,255,255,0.84)",
                  font: "inherit",
                  fontSize: "0.74rem",
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  backdropFilter: "blur(10px)",
                }}
              >
                Prev
              </button>

              <button
                type="button"
                onClick={spotlight.selectNextProject}
                style={{
                  appearance: "none",
                  minHeight: "38px",
                  padding: "10px 14px",
                  borderRadius: "999px",
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(8, 12, 18, 0.72)",
                  color: "rgba(255,255,255,0.84)",
                  font: "inherit",
                  fontSize: "0.74rem",
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  backdropFilter: "blur(10px)",
                }}
              >
                Next
              </button>

              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  minHeight: "38px",
                  padding: "10px 14px",
                  borderRadius: "999px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(8, 12, 18, 0.58)",
                  color: "rgba(255,255,255,0.68)",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  backdropFilter: "blur(10px)",
                }}
              >
                {visibleProjects.length} nodes · {density}
              </span>
            </div>
          </>
        ) : null}
      </LiveAmbientGrid>
    </LiveCursorField>
  );
}
