import React, { useMemo } from "react";

import type { HomeDriveRuntimeState } from "./domain/homeDrive.types";
import styles from "./HomeDriveHud.module.css";

type HomeDriveRuntimeAssistExtras = Readonly<{
  driveFlow: number;
  driveSyncPct: number;
  assistStatus: "auto" | "boost" | "control" | "danger" | "paused";
  autoThrottle: number;
  autoBrake: number;
  stability: number;
  targetSpeedKmh: number;
  maxSafeSpeedKmh: number;
}>;

export type HomeDriveHudProps = Readonly<{
  runtime: HomeDriveRuntimeState & Partial<HomeDriveRuntimeAssistExtras>;
  onPauseToggle: () => void;
  onReset: () => void;
  onClose?: () => void;
  onStart?: () => void;
  className?: string;
}>;

type SpeedometerLabel = Readonly<{
  value: number;
  x: number;
  y: number;
}>;

const SPEEDOMETER_SIZE = 148;
const SPEEDOMETER_CENTER = 74;
const SPEEDOMETER_RADIUS = 55;
const SPEEDOMETER_LABEL_RADIUS = 41;
const SPEEDOMETER_START_ANGLE = 135;
const SPEEDOMETER_SWEEP_ANGLE = 270;
const SPEEDOMETER_MAX_KMH_FALLBACK = 140;

function buildClassName(...classNames: Array<string | false | undefined>): string {
  return classNames.filter(Boolean).join(" ");
}

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

function formatDistance(meters: number): string {
  if (!Number.isFinite(meters)) {
    return "0 m";
  }

  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }

  return `${Math.round(meters)} m`;
}

function formatWorldCoordinate(value: number | undefined): string {
  if (!Number.isFinite(value)) {
    return "0";
  }

  return Math.round(Number(value)).toString();
}

function getPhaseLabel(phase: HomeDriveRuntimeState["phase"]): string {
  if (phase === "ready") {
    return "Ready";
  }

  if (phase === "paused") {
    return "Paused";
  }

  return "Drive";
}

function getAssistLabel(
  status: HomeDriveRuntimeAssistExtras["assistStatus"] | undefined,
): string {
  if (status === "boost") {
    return "Boost";
  }

  if (status === "control") {
    return "Control";
  }

  if (status === "danger") {
    return "Assist";
  }

  if (status === "paused") {
    return "Paused";
  }

  return "Open world";
}

function getAssistStatusClassName(
  status: HomeDriveRuntimeAssistExtras["assistStatus"] | undefined,
): string {
  if (status === "boost") {
    return styles.assistBoost;
  }

  if (status === "control") {
    return styles.assistControl;
  }

  if (status === "danger") {
    return styles.assistDanger;
  }

  if (status === "paused") {
    return styles.assistPaused;
  }

  return styles.assistAuto;
}

function getHeadingCompassLabel(headingDeg: number | undefined): string {
  const heading = clampNumber(Number(headingDeg ?? 0), 0, 360);
  const normalized = ((heading % 360) + 360) % 360;

  if (normalized >= 337.5 || normalized < 22.5) return "N";
  if (normalized < 67.5) return "NE";
  if (normalized < 112.5) return "L";
  if (normalized < 157.5) return "SE";
  if (normalized < 202.5) return "S";
  if (normalized < 247.5) return "SO";
  if (normalized < 292.5) return "O";

  return "NO";
}

function getRoadLabel(runtime: HomeDriveRuntimeState): string {
  return (
    runtime.currentRoadLabel ??
    runtime.currentRoadId ??
    runtime.districtLabel ??
    "Rua livre"
  );
}

function getDistrictLabel(runtime: HomeDriveRuntimeState): string {
  return (
    runtime.currentDistrictLabel ??
    runtime.currentDistrictId ??
    runtime.districtLabel ??
    "Fortaleza"
  );
}

function getNextIntersectionLabel(runtime: HomeDriveRuntimeState): string {
  const intersection = runtime.intersectionAhead;

  if (!intersection) {
    return "sem cruzamento";
  }

  const sideLabel =
    intersection.turnSide === "left"
      ? "↰"
      : intersection.turnSide === "right"
        ? "↱"
        : intersection.turnSide === "behind"
          ? "↶"
          : "↑";

  return `${sideLabel} ${intersection.targetRoadLabel} · ${formatDistance(
    intersection.distanceMeters,
  )}`;
}

function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number,
): { x: number; y: number } {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;

  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describeArc(
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number,
): string {
  const start = polarToCartesian(centerX, centerY, radius, endAngle);
  const end = polarToCartesian(centerX, centerY, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    "M",
    start.x,
    start.y,
    "A",
    radius,
    radius,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
  ].join(" ");
}

function getSpeedometerLabelValues(maxKmh: number): readonly number[] {
  const normalizedMaxKmh = Math.round(clampNumber(maxKmh, 80, 240));
  const baseValues = [0, 40, 80, 120, normalizedMaxKmh];

  return baseValues.filter((value, index, values) => {
    return value <= normalizedMaxKmh && values.indexOf(value) === index;
  });
}

function getSpeedometerLabels(maxKmh: number): readonly SpeedometerLabel[] {
  const normalizedMaxKmh = Math.round(clampNumber(maxKmh, 80, 240));

  return getSpeedometerLabelValues(normalizedMaxKmh).map((value) => {
    const ratio = clampNumber(value / normalizedMaxKmh, 0, 1);
    const angle = SPEEDOMETER_START_ANGLE + SPEEDOMETER_SWEEP_ANGLE * ratio;
    const point = polarToCartesian(
      SPEEDOMETER_CENTER,
      SPEEDOMETER_CENTER,
      SPEEDOMETER_LABEL_RADIUS,
      angle,
    );

    return {
      value,
      x: point.x,
      y: point.y,
    };
  });
}

export default function HomeDriveHud({
  runtime,
  onClose,
  onPauseToggle,
  onReset,
  onStart,
  className,
}: HomeDriveHudProps) {
  const nextLandmarkDistance = useMemo(() => {
    if (!runtime.nextLandmark) {
      return "trecho livre";
    }

    const distance = runtime.nextLandmark.atMeter - runtime.traveledMeters;
    const wrappedDistance =
      distance < 0 ? distance + runtime.routeLengthMeters : distance;

    return formatDistance(Math.max(0, wrappedDistance));
  }, [runtime.nextLandmark, runtime.routeLengthMeters, runtime.traveledMeters]);

  const routeProgressPct = useMemo(() => {
    return clampNumber(runtime.routeProgress * 100, 0, 100);
  }, [runtime.routeProgress]);

  const assistStatus = runtime.assistStatus ?? "auto";
  const assistLabel = getAssistLabel(assistStatus);
  const phaseLabel = getPhaseLabel(runtime.phase);
  const speedKmh = Math.round(clampNumber(runtime.speedKmh, 0, 240));

  const targetSpeedKmh = Math.round(
    clampNumber(runtime.targetSpeedKmh ?? runtime.speedKmh, 0, 240),
  );

  const maxSafeSpeedKmh = Math.round(
    clampNumber(
      runtime.maxSafeSpeedKmh ?? SPEEDOMETER_MAX_KMH_FALLBACK,
      80,
      180,
    ),
  );

  const speedometerMaxKmh = Math.max(
    SPEEDOMETER_MAX_KMH_FALLBACK,
    maxSafeSpeedKmh,
    targetSpeedKmh,
  );

  const speedRatio = clampNumber(speedKmh / speedometerMaxKmh, 0, 1);
  const progressEndAngle =
    SPEEDOMETER_START_ANGLE + SPEEDOMETER_SWEEP_ANGLE * speedRatio;

  const speedometerLabels = useMemo(() => {
    return getSpeedometerLabels(speedometerMaxKmh);
  }, [speedometerMaxKmh]);

  const trackArcPath = useMemo(() => {
    return describeArc(
      SPEEDOMETER_CENTER,
      SPEEDOMETER_CENTER,
      SPEEDOMETER_RADIUS,
      SPEEDOMETER_START_ANGLE,
      SPEEDOMETER_START_ANGLE + SPEEDOMETER_SWEEP_ANGLE,
    );
  }, []);

  const progressArcPath = useMemo(() => {
    return describeArc(
      SPEEDOMETER_CENTER,
      SPEEDOMETER_CENTER,
      SPEEDOMETER_RADIUS,
      SPEEDOMETER_START_ANGLE,
      progressEndAngle,
    );
  }, [progressEndAngle]);

  const roadLabel = useMemo(() => {
    return getRoadLabel(runtime);
  }, [runtime]);

  const districtLabel = useMemo(() => {
    return getDistrictLabel(runtime);
  }, [runtime]);

  const nextIntersectionLabel = useMemo(() => {
    return getNextIntersectionLabel(runtime);
  }, [runtime]);

  const headingLabel = useMemo(() => {
    return getHeadingCompassLabel(runtime.headingDeg);
  }, [runtime.headingDeg]);

  const worldPositionLabel = useMemo(() => {
    return `${formatWorldCoordinate(runtime.worldX)}, ${formatWorldCoordinate(
      runtime.worldY,
    )}`;
  }, [runtime.worldX, runtime.worldY]);

  const needleAngle = -135 + speedRatio * 270;
  const shouldShowStart = runtime.phase === "ready" && onStart;
  const pauseLabel = runtime.phase === "paused" ? "Resume" : "Pause";

  return (
    <div className={buildClassName(styles.root, className)}>
      <div className={styles.topRow}>
        <section className={buildClassName(styles.card, styles.summaryCard)}>
          <div className={styles.summaryHead}>
            <div>
              <div className={styles.title}>Fortaleza Drive</div>
              <div
                className={buildClassName(
                  styles.phase,
                  runtime.phase === "ready" && styles.phaseReady,
                  runtime.phase === "playing" && styles.phasePlaying,
                  runtime.phase === "paused" && styles.phasePaused,
                )}
              >
                {phaseLabel}
              </div>
            </div>

            <div
              className={buildClassName(
                styles.assistBadge,
                getAssistStatusClassName(assistStatus),
              )}
            >
              {assistLabel}
            </div>
          </div>

          <div className={styles.summaryFooter}>
            <span>
              Bairro: <strong>{districtLabel}</strong>
            </span>
            <span>
              Rua: <strong>{roadLabel}</strong>
            </span>
            <span>
              Próximo: <strong>{nextIntersectionLabel}</strong>
            </span>
            <span>
              Dir: <strong>{headingLabel}</strong> · Pos:{" "}
              <strong>{worldPositionLabel}</strong>
            </span>
            <span>
              Marco:{" "}
              <strong>{runtime.nextLandmark?.label ?? "Trecho livre"}</strong>{" "}
              · {nextLandmarkDistance}
            </span>
          </div>

          <div className={styles.routeTrack} aria-hidden="true">
            <span
              className={styles.routeFill}
              style={{ width: `${routeProgressPct}%` }}
            />
          </div>
        </section>

        <div className={styles.actions}>
          {shouldShowStart ? (
            <button
              type="button"
              className={buildClassName(styles.actionButton, styles.actionPrimary)}
              onClick={onStart}
            >
              Start
            </button>
          ) : null}

          <button
            type="button"
            className={styles.actionButton}
            onClick={onPauseToggle}
          >
            {pauseLabel}
          </button>

          <button type="button" className={styles.actionButton} onClick={onReset}>
            Reset
          </button>

          {onClose ? (
            <button
              type="button"
              className={buildClassName(styles.actionButton, styles.actionExit)}
              onClick={onClose}
            >
              Exit
            </button>
          ) : null}
        </div>
      </div>

      <div className={styles.speedometerDock} aria-hidden="true">
        <div className={styles.speedometerCard}>
          <svg
            className={styles.speedometerSvg}
            viewBox={`0 0 ${SPEEDOMETER_SIZE} ${SPEEDOMETER_SIZE}`}
          >
            <path
              className={styles.speedometerTrack}
              d={trackArcPath}
              pathLength={100}
            />

            <path
              className={buildClassName(
                styles.speedometerProgress,
                assistStatus === "danger" && styles.speedometerProgressDanger,
                assistStatus === "control" && styles.speedometerProgressControl,
                assistStatus === "boost" && styles.speedometerProgressBoost,
              )}
              d={progressArcPath}
              pathLength={100}
            />

            {speedometerLabels.map((label) => (
              <text
                key={`speedometer-label-${label.value}`}
                className={buildClassName(
                  styles.speedometerNumber,
                  label.value === 0 && styles.speedometerNumberEdge,
                  label.value === speedometerMaxKmh && styles.speedometerNumberEdge,
                )}
                x={label.x}
                y={label.y}
                textAnchor="middle"
                dominantBaseline="central"
              >
                {label.value}
              </text>
            ))}

            <g
              transform={`rotate(${needleAngle} ${SPEEDOMETER_CENTER} ${SPEEDOMETER_CENTER})`}
            >
              <line
                className={styles.speedometerNeedleShadow}
                x1={SPEEDOMETER_CENTER}
                y1={SPEEDOMETER_CENTER + 3}
                x2={SPEEDOMETER_CENTER}
                y2={SPEEDOMETER_CENTER - 40}
              />
              <line
                className={styles.speedometerNeedle}
                x1={SPEEDOMETER_CENTER}
                y1={SPEEDOMETER_CENTER}
                x2={SPEEDOMETER_CENTER}
                y2={SPEEDOMETER_CENTER - 42}
              />
            </g>

            <circle
              className={styles.speedometerHubShadow}
              cx={SPEEDOMETER_CENTER}
              cy={SPEEDOMETER_CENTER}
              r="8"
            />
            <circle
              className={styles.speedometerHub}
              cx={SPEEDOMETER_CENTER}
              cy={SPEEDOMETER_CENTER}
              r="6"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
