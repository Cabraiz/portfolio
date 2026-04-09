// src/pages/Mateus/Live/ui/chrome/LiveSupportingPanel.tsx

import type { LiveInteractionMode, LiveMetricId, LiveMetricSnapshot, LiveProjectRecord, LiveStatusBucket } from "../../domain/live.types";
import LiveStatsBoard from "../board/LiveStatsBoard";
import LiveInteractionHint from "./LiveInteractionHint";
import LiveMiniTimeline from "./LiveMiniTimeline";

export type LiveSupportingPanelProps = Readonly<{
  className?: string;
  boardClassName?: string;
  chromeGridClassName?: string;
  chromePanelClassName?: string;

  metrics: readonly LiveMetricSnapshot[];
  heroMetrics: readonly LiveMetricSnapshot[];
  secondaryMetrics: readonly LiveMetricSnapshot[];
  statusBuckets: readonly LiveStatusBucket[];

  elapsedMs: number;
  isRunning: boolean;
  hasAnimatedMetrics: boolean;

  selectedMetricId?: LiveMetricId | null;
  onMetricSelect?: (metricId: LiveMetricId) => void;
  onToggleRunning?: () => void;
  onRestart?: () => void;

  projects: readonly LiveProjectRecord[];
  selectedProjectId?: string | null;
  onProjectSelect?: (projectId: string | null) => void;

  interactionMode: LiveInteractionMode;
  selectedProjectName?: string | null;
  activeMetricLabel?: string | null;
}>;

function joinClassNames(
  ...classNames: Array<string | false | null | undefined>
): string {
  return classNames.filter(Boolean).join(" ");
}

export default function LiveSupportingPanel({
  className,
  boardClassName,
  chromeGridClassName,
  chromePanelClassName,
  metrics,
  heroMetrics,
  secondaryMetrics,
  statusBuckets,
  elapsedMs,
  isRunning,
  hasAnimatedMetrics,
  selectedMetricId = null,
  onMetricSelect,
  onToggleRunning,
  onRestart,
  projects,
  selectedProjectId = null,
  onProjectSelect,
  interactionMode,
  selectedProjectName = null,
  activeMetricLabel = null,
}: LiveSupportingPanelProps) {
  return (
    <div
      className={joinClassNames(className)}
      style={{
        display: "grid",
        gap: "20px",
        width: "100%",
      }}
    >
      <LiveStatsBoard
        className={joinClassNames(boardClassName)}
        metrics={metrics}
        heroMetrics={heroMetrics}
        secondaryMetrics={secondaryMetrics}
        statusBuckets={statusBuckets}
        elapsedMs={elapsedMs}
        isRunning={isRunning}
        hasAnimatedMetrics={hasAnimatedMetrics}
        selectedMetricId={selectedMetricId}
        onMetricSelect={onMetricSelect}
        onToggleRunning={onToggleRunning}
        onRestart={onRestart}
      />

      <div
        className={joinClassNames(chromeGridClassName)}
        style={{
          display: "grid",
          gap: "18px",
          gridTemplateColumns: "minmax(0, 1.2fr) minmax(320px, 0.8fr)",
        }}
      >
        <div
          className={joinClassNames(chromePanelClassName)}
          style={{
            minWidth: 0,
            borderRadius: "24px",
            border: "1px solid rgba(255,255,255,0.08)",
            background:
              "linear-gradient(180deg, rgba(10,14,20,0.74) 0%, rgba(10,14,20,0.5) 100%)",
            boxShadow:
              "0 18px 46px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.04)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            overflow: "hidden",
          }}
        >
          <LiveMiniTimeline
            projects={projects}
            selectedProjectId={selectedProjectId}
            onProjectSelect={onProjectSelect}
          />
        </div>

        <div
          className={joinClassNames(chromePanelClassName)}
          data-live-hint="true"
          style={{
            minWidth: 0,
            borderRadius: "24px",
            border: "1px solid rgba(255,255,255,0.08)",
            background:
              "linear-gradient(180deg, rgba(10,14,20,0.74) 0%, rgba(10,14,20,0.5) 100%)",
            boxShadow:
              "0 18px 46px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.04)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            overflow: "hidden",
          }}
        >
          <LiveInteractionHint
            interactionMode={interactionMode}
            isRunning={isRunning}
            selectedProjectName={selectedProjectName}
            activeMetricLabel={activeMetricLabel}
          />
        </div>
      </div>
    </div>
  );
}
