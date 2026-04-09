// src/pages/Mateus/Live/Live.tsx

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import { useLiveMetrics } from "./application/useLiveMetrics";
import { useLiveProjectSpotlight } from "./application/useLiveProjectSpotlight";
import {
  LIVE_DEFAULT_SCENE_CONFIG,
  LIVE_INTERACTION_LABELS,
  LIVE_PROJECT_LIFECYCLE_FILTER_LABELS,
  LIVE_PROJECT_SIZE_FILTER_LABELS,
  LIVE_PROJECT_STATUS_LABELS,
  LIVE_SECTION_ID,
} from "./domain/live.constants";
import {
  buildLiveProjectFilterCounts,
  isLiveProjectVisible,
  mapLiveProjectStatusToLifecycleFilter,
  matchesLiveProjectLifecycleFilter,
  matchesLiveProjectSizeFilter,
} from "./domain/live.helpers";
import type {
  LiveMetricId,
  LiveProjectLifecycleFilter,
  LiveProjectSizeFilter,
  LiveProjectStatus,
} from "./domain/live.types";
import { useLiveGsapScene } from "./hooks/useLiveGsapScene";
import LiveStatsBoard from "./ui/board/LiveStatsBoard";
import LiveHeroBillboard from "./ui/chrome/billboard/LiveHeroBillboard";
import LiveInteractionHint from "./ui/chrome/LiveInteractionHint";
import LiveMiniTimeline from "./ui/chrome/LiveMiniTimeline";
import LiveProjectFilters from "./ui/chrome/LiveProjectFilters";
import LiveWorldGlobe, {
  type LiveWorldGlobePoint,
} from "./ui/chrome/LiveWorldGlobe";
import LiveAmbientGrid from "./ui/scene/LiveAmbientGrid";
import LiveCursorField from "./ui/scene/LiveCursorField";
import LiveProjectNodes from "./ui/scene/LiveProjectNodes";
import LiveSignalPulse from "./ui/scene/LiveSignalPulse";
import LiveSectionShell from "./ui/shell/LiveSectionShell";
import styles from "./Live.module.css";

type PointerSnapshot = Readonly<{
  clientX: number;
  clientY: number;
  normalizedX: number;
  normalizedY: number;
  centeredX: number;
  centeredY: number;
  distance: number;
}>;

const DEFAULT_POINTER: PointerSnapshot = {
  clientX: 0,
  clientY: 0,
  normalizedX: 0.5,
  normalizedY: 0.5,
  centeredX: 0,
  centeredY: 0,
  distance: 0,
};

const LIVE_GLOBE_ORIGIN = {
  id: "fortaleza-br",
  label: "Fortaleza",
  country: "Brasil",
  region: "Ceará · base operacional",
  lat: -3.7319,
  lng: -38.5267,
  size: 0.058,
  color: [0.243, 0.929, 0.925],
} as const satisfies LiveWorldGlobePoint;

const LIVE_GLOBE_TARGETS = {
  active: {
    id: "brazil",
    label: "Brasil",
    country: "Brasil",
    region: "América do Sul",
    lat: -14.235,
    lng: -51.9253,
    size: 0.09,
    color: [0.557, 0.906, 0.992],
  },
  monitoring: {
    id: "united-states",
    label: "Estados Unidos",
    country: "Estados Unidos",
    region: "América do Norte",
    lat: 37.0902,
    lng: -95.7129,
    size: 0.062,
    color: [0.349, 0.592, 0.992],
  },
  delivered: {
    id: "portugal",
    label: "Portugal",
    country: "Portugal",
    region: "Europa",
    lat: 39.3999,
    lng: -8.2245,
    size: 0.056,
    color: [0.753, 0.639, 0.992],
  },
  incubating: {
    id: "japan",
    label: "Japão",
    country: "Japão",
    region: "Ásia",
    lat: 36.2048,
    lng: 138.2529,
    size: 0.058,
    color: [0.992, 0.58, 0.8],
  },
} as const satisfies Record<LiveProjectStatus, LiveWorldGlobePoint>;

const LIVE_GLOBE_MARKERS = [
  LIVE_GLOBE_ORIGIN,
  LIVE_GLOBE_TARGETS.active,
  LIVE_GLOBE_TARGETS.monitoring,
  LIVE_GLOBE_TARGETS.delivered,
  LIVE_GLOBE_TARGETS.incubating,
] as const satisfies readonly LiveWorldGlobePoint[];

function mapMetricToStatus(
  metricId: LiveMetricId | null
): LiveProjectStatus | null {
  switch (metricId) {
    case "projects-active":
    case "automations":
      return "active";

    case "projects-monitoring":
      return "monitoring";

    case "projects-delivered":
    case "deliveries-shipped":
      return "delivered";

    default:
      return null;
  }
}

function getSceneTitle(options: Readonly<{
  selectedStatus: LiveProjectStatus | null;
  lifecycleFilter: LiveProjectLifecycleFilter;
  sizeFilter: LiveProjectSizeFilter;
}>): string {
  const { selectedStatus, lifecycleFilter, sizeFilter } = options;

  if (selectedStatus) {
    return `Radar • ${LIVE_PROJECT_STATUS_LABELS[selectedStatus]}`;
  }

  const activeLabels: string[] = [];

  if (lifecycleFilter !== "all") {
    activeLabels.push(LIVE_PROJECT_LIFECYCLE_FILTER_LABELS[lifecycleFilter]);
  }

  if (sizeFilter !== "all") {
    activeLabels.push(LIVE_PROJECT_SIZE_FILTER_LABELS[sizeFilter]);
  }

  if (activeLabels.length === 0) {
    return "Radar de projetos";
  }

  return `Radar • ${activeLabels.join(" · ")}`;
}

function getSceneHint(options: Readonly<{
  selectedStatus: LiveProjectStatus | null;
  lifecycleFilter: LiveProjectLifecycleFilter;
  sizeFilter: LiveProjectSizeFilter;
  selectedMetricLabel: string | null;
}>): string {
  const {
    selectedStatus,
    lifecycleFilter,
    sizeFilter,
    selectedMetricLabel,
  } = options;

  const activeSlices: string[] = [];

  if (selectedStatus) {
    activeSlices.push(LIVE_PROJECT_STATUS_LABELS[selectedStatus]);
  } else if (lifecycleFilter !== "all") {
    activeSlices.push(LIVE_PROJECT_LIFECYCLE_FILTER_LABELS[lifecycleFilter]);
  }

  if (sizeFilter !== "all") {
    activeSlices.push(LIVE_PROJECT_SIZE_FILTER_LABELS[sizeFilter]);
  }

  if (activeSlices.length > 0 && selectedMetricLabel) {
    return `Recorte ativo: ${activeSlices.join(" · ")}. O spotlight acompanha ${selectedMetricLabel.toLowerCase()}.`;
  }

  if (activeSlices.length > 0) {
    return `Recorte ativo: ${activeSlices.join(" · ")}. Passe o mouse pelos nós para abrir o spotlight.`;
  }

  if (selectedMetricLabel) {
    return `Métrica em foco: ${selectedMetricLabel}. Passe o mouse pelos nós e compare placar com radar.`;
  }

  return "Passe o mouse pelos nós para abrir o spotlight e deixar o radar vivo.";
}

function getSceneMetaLabel(options: Readonly<{
  selectedStatus: LiveProjectStatus | null;
  lifecycleFilter: LiveProjectLifecycleFilter;
  sizeFilter: LiveProjectSizeFilter;
}>): string {
  const { selectedStatus, lifecycleFilter, sizeFilter } = options;

  if (selectedStatus) {
    return LIVE_PROJECT_STATUS_LABELS[selectedStatus];
  }

  if (sizeFilter !== "all") {
    return LIVE_PROJECT_SIZE_FILTER_LABELS[sizeFilter];
  }

  if (lifecycleFilter !== "all") {
    return LIVE_PROJECT_LIFECYCLE_FILTER_LABELS[lifecycleFilter];
  }

  return LIVE_INTERACTION_LABELS[LIVE_DEFAULT_SCENE_CONFIG.interactionMode];
}

function toNodeCountLabel(count: number): string {
  return `${count} ${count === 1 ? "nó" : "nós"}`;
}

function resolveGlobeTarget(options: Readonly<{
  selectedStatus: LiveProjectStatus | null;
  fallbackMetricId: LiveMetricId | null;
  spotlightStatus: LiveProjectStatus | null;
}>): LiveWorldGlobePoint {
  const { selectedStatus, fallbackMetricId, spotlightStatus } = options;

  if (spotlightStatus) {
    return LIVE_GLOBE_TARGETS[spotlightStatus];
  }

  if (selectedStatus) {
    return LIVE_GLOBE_TARGETS[selectedStatus];
  }

  const metricStatus = mapMetricToStatus(fallbackMetricId);

  if (metricStatus) {
    return LIVE_GLOBE_TARGETS[metricStatus];
  }

  return LIVE_GLOBE_TARGETS.active;
}

export default function Live() {
  const rootRef = useRef<HTMLDivElement | null>(null);

  const metricsState = useLiveMetrics();
  const density = LIVE_DEFAULT_SCENE_CONFIG.density;

  const [selectedMetricId, setSelectedMetricId] = useState<LiveMetricId | null>(
    null
  );
  const [selectedStatus, setSelectedStatus] =
    useState<LiveProjectStatus | null>(null);
  const [lifecycleFilter, setLifecycleFilter] =
    useState<LiveProjectLifecycleFilter>("all");
  const [sizeFilter, setSizeFilter] = useState<LiveProjectSizeFilter>("all");
  const [pointer, setPointer] = useState<PointerSnapshot>(DEFAULT_POINTER);

  useEffect(() => {
    if (selectedMetricId !== null) {
      return;
    }

    const firstHeroMetric = metricsState.heroMetrics[0];

    if (firstHeroMetric) {
      setSelectedMetricId(firstHeroMetric.id);
    }
  }, [metricsState.heroMetrics, selectedMetricId]);

  const selectedLifecycleFilter = useMemo<LiveProjectLifecycleFilter>(() => {
    if (selectedStatus) {
      return mapLiveProjectStatusToLifecycleFilter(selectedStatus);
    }

    return lifecycleFilter;
  }, [lifecycleFilter, selectedStatus]);

  const projectFilterCounts = useMemo(() => {
    return buildLiveProjectFilterCounts(metricsState.projects);
  }, [metricsState.projects]);

  const filteredProjects = useMemo(() => {
    return metricsState.projects.filter((project) => {
      if (!isLiveProjectVisible(project)) {
        return false;
      }

      if (!matchesLiveProjectSizeFilter(project, sizeFilter)) {
        return false;
      }

      if (selectedStatus !== null) {
        return project.status === selectedStatus;
      }

      return matchesLiveProjectLifecycleFilter(project, lifecycleFilter);
    });
  }, [lifecycleFilter, metricsState.projects, selectedStatus, sizeFilter]);

  const spotlight = useLiveProjectSpotlight({
    projects: filteredProjects,
    autoSelectFirstProject: true,
    featuredLimit: LIVE_DEFAULT_SCENE_CONFIG.maxVisibleNodes,
  });

  const selectedMetric = useMemo(() => {
    if (!selectedMetricId) {
      return metricsState.heroMetrics[0] ?? metricsState.snapshots[0] ?? null;
    }

    return metricsState.getSnapshotById(selectedMetricId);
  }, [metricsState, selectedMetricId]);

  const {
    isReady: isSceneReady,
    refresh: refreshScene,
    replay: replayScene,
  } = useLiveGsapScene({
    rootRef,
    hintSelector: '[data-live-hint="true"]',
  });

  useEffect(() => {
    refreshScene();
  }, [
    filteredProjects.length,
    lifecycleFilter,
    refreshScene,
    selectedMetricId,
    selectedStatus,
    sizeFilter,
  ]);

  const pulseSize = Math.round(102);
  const pulseX = `${30 + pointer.normalizedX * 40}%`;
  const pulseY = `${24 + pointer.normalizedY * 36}%`;

  const sceneTitle = getSceneTitle({
    selectedStatus,
    lifecycleFilter: selectedLifecycleFilter,
    sizeFilter,
  });

  const sceneHint = getSceneHint({
    selectedStatus,
    lifecycleFilter: selectedLifecycleFilter,
    sizeFilter,
    selectedMetricLabel: selectedMetric?.label ?? null,
  });

  const sceneMetaLabel = getSceneMetaLabel({
    selectedStatus,
    lifecycleFilter: selectedLifecycleFilter,
    sizeFilter,
  });

  const spotlightProject = spotlight.spotlightProject;
  const spotlightTags = spotlightProject?.tags.slice(0, 3) ?? [];

  const sceneHudStyle = useMemo<CSSProperties>(() => {
    return {
      ["--live-scene-pointer-x" as const]: `${Math.round(
        pointer.normalizedX * 100
      )}%`,
      ["--live-scene-pointer-y" as const]: `${Math.round(
        pointer.normalizedY * 100
      )}%`,
    } as CSSProperties;
  }, [pointer.normalizedX, pointer.normalizedY]);

  const globeTarget = useMemo(() => {
    return resolveGlobeTarget({
      selectedStatus,
      fallbackMetricId: selectedMetricId,
      spotlightStatus: spotlightProject?.status ?? null,
    });
  }, [selectedMetricId, selectedStatus, spotlightProject?.status]);

  const globeTitle = spotlightProject
    ? spotlightProject.name
    : selectedStatus
      ? `Foco • ${LIVE_PROJECT_STATUS_LABELS[selectedStatus]}`
      : "Presença global";

  const globeSubtitle = spotlightProject
    ? `${LIVE_PROJECT_STATUS_LABELS[spotlightProject.status]} · ${spotlightProject.clientLabel}`
    : selectedMetric
      ? `Leitura guiada por ${selectedMetric.label.toLowerCase()}.`
      : "Globo vivo para apontar o país em foco no radar.";

  const handleMetricSelect = (metricId: LiveMetricId) => {
    const nextStatus = mapMetricToStatus(metricId);

    setSelectedMetricId(metricId);
    setSelectedStatus(nextStatus);
    setLifecycleFilter(
      nextStatus ? mapLiveProjectStatusToLifecycleFilter(nextStatus) : "all"
    );
  };

  const handleLifecycleFilterChange = (
    filter: LiveProjectLifecycleFilter
  ) => {
    setSelectedStatus(null);
    setLifecycleFilter(filter);
  };

  const handleSizeFilterChange = (filter: LiveProjectSizeFilter) => {
    setSizeFilter(filter);
  };

  const clearFilters = () => {
    setSelectedStatus(null);
    setLifecycleFilter("all");
    setSizeFilter("all");
  };

  const hasResults = metricsState.projects.length > 0;
  const hasActiveFilters =
    selectedStatus !== null ||
    lifecycleFilter !== "all" ||
    sizeFilter !== "all";

  return (
    <div ref={rootRef} className={styles.root}>
      <LiveSectionShell
        id={LIVE_SECTION_ID}
        className={styles.shell}
        ariaLabel="Seção ao vivo do portfólio"
        title="Tudo em curso, ao vivo."
        description=""
        caption=""
        heroSlot={
          <LiveHeroBillboard
            metrics={metricsState.snapshots}
            summary={metricsState.summary}
            isRunning={metricsState.isRunning}
          />
        }
        hasResults={hasResults}
        filtersSlot={
          <div className={styles.filtersBar}>
            <LiveProjectFilters
              lifecycleFilter={selectedLifecycleFilter}
              sizeFilter={sizeFilter}
              onLifecycleFilterChange={handleLifecycleFilterChange}
              onSizeFilterChange={handleSizeFilterChange}
              counts={projectFilterCounts}
              showLifecycleAll
              showSizeAll={false}
            />

            <div className={styles.filterGroup}>
              <button
                type="button"
                className={styles.filterGhostButton}
                onClick={replayScene}
              >
                Reanimar cena
              </button>

              <span className={styles.filterMeta}>
                {toNodeCountLabel(spotlight.visibleProjects.length)} ·{" "}
                {
                  LIVE_INTERACTION_LABELS[
                    LIVE_DEFAULT_SCENE_CONFIG.interactionMode
                  ]
                }
              </span>
            </div>
          </div>
        }
        sceneSlot={
          <div className={styles.sceneViewport}>
            <LiveCursorField
              className={styles.sceneField}
              label={sceneTitle}
              hint={sceneHint}
              minHeight="clamp(420px, 48vw, 680px)"
              onPointerStateChange={setPointer}
              onPointerLeaveField={() => {
                setPointer(DEFAULT_POINTER);
              }}
            >
              <LiveAmbientGrid
                density={density}
                pointer={pointer}
                minHeight="clamp(420px, 48vw, 680px)"
                borderRadius="30px"
              >
                {[0.28, 0.42, 0.56].map((ringFactor, index) => {
                  const size = `${Math.round(100 * ringFactor)}%`;

                  return (
                    <div
                      key={`scene-ring-${ringFactor}`}
                      className={styles.sceneRing}
                      data-live-parallax={String(0.2 + index * 0.16)}
                      style={{
                        width: size,
                        height: size,
                        transform: `translate(-50%, -50%) rotate(${index * 12}deg)`,
                        opacity: 0.16 + index * 0.06,
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
                  className={styles.sceneHud}
                  style={sceneHudStyle}
                  data-live-parallax="0.18"
                >
                  <span className={styles.sceneHudEyebrow}>spotlight</span>

                  <strong className={styles.sceneHudTitle}>
                    {spotlight.spotlightTitle}
                  </strong>

                  <span className={styles.sceneHudMeta}>
                    {spotlightProject
                      ? `${spotlightProject.clientLabel} · ${Math.round(
                          spotlightProject.healthScore
                        )}% saúde`
                      : "Passe o mouse pelos nós para abrir o spotlight."}
                  </span>

                  <p className={styles.sceneHudDescription}>
                    {spotlightProject?.summary ?? spotlight.projectNarrative}
                  </p>

                  {spotlightTags.length > 0 ? (
                    <div className={styles.sceneTagRow}>
                      {spotlightTags.map((tag) => (
                        <span key={tag} className={styles.sceneTag}>
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

                <div className={styles.sceneControls} data-live-parallax="0.32">
                  <button
                    type="button"
                    className={styles.sceneControlButton}
                    onClick={spotlight.selectPreviousProject}
                  >
                    Anterior
                  </button>

                  <button
                    type="button"
                    className={styles.sceneControlButton}
                    onClick={spotlight.selectNextProject}
                  >
                    Próximo
                  </button>

                  <span className={styles.sceneMetaPill}>
                    {toNodeCountLabel(spotlight.visibleProjects.length)} ·{" "}
                    {sceneMetaLabel}
                  </span>
                </div>
              </LiveAmbientGrid>
            </LiveCursorField>
          </div>
        }
        spotlightSlot={
          <div className={styles.sidebarStack}>
            <div className={styles.headerFooter}>
              <span className={styles.headerBadge}>
                {metricsState.isRunning ? "Painel vivo" : "Painel pausado"}
              </span>

              <span className={styles.headerBadge}>
                Cena {isSceneReady ? "pronta" : "preparando"}
              </span>

              {hasActiveFilters ? (
                <button
                  type="button"
                  className={styles.headerBadgeButton}
                  onClick={clearFilters}
                >
                  Limpar recorte
                </button>
              ) : null}
            </div>

            <LiveWorldGlobe
              title={globeTitle}
              subtitle={globeSubtitle}
              eyebrow="world focus"
              target={globeTarget}
              origin={LIVE_GLOBE_ORIGIN}
              markers={LIVE_GLOBE_MARKERS}
              showArcToTarget={globeTarget.id !== LIVE_GLOBE_ORIGIN.id}
            />
          </div>
        }
        supportingSlot={
          <div className={styles.supportingGrid}>
            <LiveStatsBoard
              className={styles.board}
              metrics={metricsState.snapshots}
              heroMetrics={metricsState.heroMetrics}
              secondaryMetrics={metricsState.secondaryMetrics}
              statusBuckets={metricsState.statusBuckets}
              elapsedMs={metricsState.elapsedMs}
              isRunning={metricsState.isRunning}
              hasAnimatedMetrics={metricsState.hasAnimatedMetrics}
              selectedMetricId={selectedMetricId}
              onMetricSelect={handleMetricSelect}
              onToggleRunning={metricsState.toggle}
              onRestart={metricsState.restart}
            />

            <div className={styles.chromeGrid}>
              <div className={styles.chromePanel}>
                <LiveMiniTimeline
                  projects={filteredProjects}
                  selectedProjectId={spotlight.activeProjectId}
                  onProjectSelect={spotlight.selectProject}
                />
              </div>

              <div className={styles.chromePanel} data-live-hint="true">
                <LiveInteractionHint
                  interactionMode={LIVE_DEFAULT_SCENE_CONFIG.interactionMode}
                  isRunning={metricsState.isRunning}
                  selectedProjectName={spotlightProject?.name ?? null}
                  activeMetricLabel={selectedMetric?.label ?? null}
                />
              </div>
            </div>
          </div>
        }
      />
    </div>
  );
}
