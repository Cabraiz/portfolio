// src/pages/Mateus/Live/Live.tsx

import { useEffect, useRef } from "react";

import useLiveExperience from "./application/useLiveExperience";
import {
  LIVE_DEFAULT_SCENE_CONFIG,
  LIVE_SECTION_ID,
} from "./domain/live.constants";
import {
  LIVE_GLOBE_MARKERS,
  LIVE_GLOBE_ORIGIN,
} from "./domain/live.globe";
import { useLiveGsapScene } from "./hooks/useLiveGsapScene";
import LiveHeroBillboard from "./ui/chrome/billboard/LiveHeroBillboard";
import LiveProjectFilters from "./ui/chrome/LiveProjectFilters";
import LiveSupportingPanel from "./ui/chrome/LiveSupportingPanel";
import LiveWorldGlobe from "./ui/chrome/LiveWorldGlobe";
import LiveRadarScene from "./ui/scene/LiveRadarScene";
import LiveSectionShell from "./ui/shell/LiveSectionShell";
import styles from "./Live.module.css";

export default function Live() {
  const rootRef = useRef<HTMLDivElement | null>(null);

  const {
    metricsState,
    density,
    hasResults,
    hasActiveFilters,
    pointer,
    setPointer,
    resetPointer,
    selectedMetric,
    selectedMetricId,
    selectedStatus,
    lifecycleFilter,
    selectedLifecycleFilter,
    sizeFilter,
    filteredProjects,
    projectFilterCounts,
    spotlight,
    spotlightProject,
    visibleNodeCountLabel,
    scene,
    globe,
    actions,
  } = useLiveExperience();

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

  return (
    <div ref={rootRef} className={styles.root}>
      <LiveSectionShell
        id={LIVE_SECTION_ID}
        className={styles.shell}
        ariaLabel="Seção ao vivo do portfólio"
        title="Tudo em curso, ao vivo."
        description=""
        caption=""
        hasResults={hasResults}
        heroSlot={
          <LiveHeroBillboard
            metrics={metricsState.snapshots}
            summary={metricsState.summary}
            isRunning={metricsState.isRunning}
          />
        }
        filtersSlot={
          <div className={styles.filtersBar}>
            <LiveProjectFilters
              className={styles.filtersRail}
              compact
              lifecycleFilter={selectedLifecycleFilter}
              sizeFilter={sizeFilter}
              onLifecycleFilterChange={actions.handleLifecycleFilterChange}
              onSizeFilterChange={actions.handleSizeFilterChange}
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
                Reanimar
              </button>
            </div>
          </div>
        }
        sceneSlot={
          <LiveRadarScene
            className={styles.sceneViewport}
            density={density}
            pointer={pointer}
            sceneTitle={scene.title}
            sceneHint={scene.hint}
            sceneMetaLabel={scene.metaLabel}
            spotlight={spotlight}
            onPointerStateChange={setPointer}
            onPointerLeaveField={resetPointer}
          />
        }
        spotlightSlot={
          <div className={styles.sidebarStack}>
            <div className={styles.headerFooter}>
              {hasActiveFilters ? (
                <button
                  type="button"
                  className={styles.headerBadgeButton}
                  onClick={actions.clearFilters}
                >
                  Limpar recorte
                </button>
              ) : null}
            </div>

            <LiveWorldGlobe
              title={globe.title}
              subtitle={globe.subtitle}
              eyebrow="world focus"
              target={globe.target}
              origin={LIVE_GLOBE_ORIGIN}
              markers={LIVE_GLOBE_MARKERS}
              showArcToTarget={globe.target.id !== LIVE_GLOBE_ORIGIN.id}
            />
          </div>
        }
        supportingSlot={
          <LiveSupportingPanel
            className={styles.supportingGrid}
            boardClassName={styles.board}
            chromeGridClassName={styles.chromeGrid}
            chromePanelClassName={styles.chromePanel}
            metrics={metricsState.snapshots}
            heroMetrics={metricsState.heroMetrics}
            secondaryMetrics={metricsState.secondaryMetrics}
            statusBuckets={metricsState.statusBuckets}
            elapsedMs={metricsState.elapsedMs}
            isRunning={metricsState.isRunning}
            hasAnimatedMetrics={metricsState.hasAnimatedMetrics}
            selectedMetricId={selectedMetricId}
            onMetricSelect={actions.handleMetricSelect}
            onToggleRunning={metricsState.toggle}
            onRestart={metricsState.restart}
            projects={filteredProjects}
            selectedProjectId={spotlight.activeProjectId}
            onProjectSelect={spotlight.selectProject}
            interactionMode={LIVE_DEFAULT_SCENE_CONFIG.interactionMode}
            selectedProjectName={spotlightProject?.name ?? null}
            activeMetricLabel={selectedMetric?.label ?? null}
          />
        }
      />
    </div>
  );
}
