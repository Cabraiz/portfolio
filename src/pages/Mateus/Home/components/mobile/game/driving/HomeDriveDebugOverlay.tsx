import React, { useEffect, useMemo, useState, type CSSProperties } from "react";

import {
  HOME_DRIVE_CAMERA_DEBUG_STORAGE_KEY,
  roundNumber,
} from "./domain/homeDriveCamera.tokens";
import type { HomeDriveRuntimeState } from "./domain/homeDrive.types";
import useHomeDriveViewportProfile, {
  type HomeDriveViewportProfile,
} from "../../../../hooks/useHomeDriveViewportProfile";

export type HomeDriveDebugOverlayProps = Readonly<{
  profile?: HomeDriveViewportProfile;
  runtime?: HomeDriveRuntimeState;
  enabled?: boolean;
  className?: string;
}>;

function readAutoEnabled(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const searchParams = new URLSearchParams(window.location.search);

  return (
    searchParams.has("driveDebug") ||
    window.localStorage.getItem(HOME_DRIVE_CAMERA_DEBUG_STORAGE_KEY) === "1"
  );
}

function formatPx(value: number): string {
  return `${Math.round(value)}px`;
}

function formatBool(value: boolean): string {
  return value ? "yes" : "no";
}

function formatNumber(value: number | undefined, digits = 2): string {
  if (!Number.isFinite(value)) {
    return "0";
  }

  return Number(value).toFixed(digits);
}

function formatMeters(value: number | undefined): string {
  if (!Number.isFinite(value)) {
    return "0 m";
  }

  return `${Number(value).toFixed(1)} m`;
}

function formatDeg(value: number | undefined): string {
  if (!Number.isFinite(value)) {
    return "0.0°";
  }

  return `${Number(value).toFixed(1)}°`;
}

function formatText(value: string | undefined): string {
  if (!value || value.trim().length === 0) {
    return "none";
  }

  return value;
}

function buildRootStyle(): CSSProperties {
  return {
    position: "absolute",
    left: 10,
    bottom: 10,
    zIndex: 9999,
    width: "min(340px, calc(100% - 20px))",
    maxHeight: "min(68vh, 500px)",
    overflow: "auto",
    borderRadius: 14,
    border: "1px solid rgba(255, 255, 255, 0.16)",
    background: "rgba(5, 6, 9, 0.78)",
    color: "rgba(247, 242, 232, 0.94)",
    boxShadow:
      "0 18px 48px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    padding: "10px 11px",
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
    fontSize: 10,
    lineHeight: 1.35,
    pointerEvents: "none",
  };
}

function buildHeaderStyle(): CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 8,
    paddingBottom: 7,
    borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
  };
}

function buildTitleStyle(): CSSProperties {
  return {
    margin: 0,
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
  };
}

function buildBadgeStyle(): CSSProperties {
  return {
    flex: "0 0 auto",
    borderRadius: 999,
    padding: "3px 7px",
    border: "1px solid rgba(216, 190, 120, 0.32)",
    background: "rgba(216, 190, 120, 0.14)",
    color: "rgba(255, 232, 172, 0.96)",
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  };
}

function buildGridStyle(): CSSProperties {
  return {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    columnGap: 12,
    rowGap: 4,
    alignItems: "baseline",
  };
}

function buildLabelStyle(): CSSProperties {
  return {
    minWidth: 0,
    color: "rgba(247, 242, 232, 0.56)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  };
}

function buildValueStyle(): CSSProperties {
  return {
    color: "rgba(247, 242, 232, 0.94)",
    fontWeight: 800,
    textAlign: "right",
    whiteSpace: "nowrap",
  };
}

function buildSectionStyle(): CSSProperties {
  return {
    marginTop: 9,
    paddingTop: 8,
    borderTop: "1px solid rgba(255, 255, 255, 0.1)",
  };
}

function DebugRow({
  label,
  value,
}: Readonly<{
  label: string;
  value: React.ReactNode;
}>) {
  return (
    <>
      <span style={buildLabelStyle()}>{label}</span>
      <span style={buildValueStyle()}>{value}</span>
    </>
  );
}

function DebugSection({
  title,
  children,
}: Readonly<{
  title: string;
  children: React.ReactNode;
}>) {
  return (
    <section style={buildSectionStyle()}>
      <div
        style={{
          marginBottom: 5,
          color: "rgba(216, 190, 120, 0.9)",
          fontSize: 9,
          fontWeight: 900,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        {title}
      </div>

      <div style={buildGridStyle()}>{children}</div>
    </section>
  );
}

export default function HomeDriveDebugOverlay({
  profile,
  runtime,
  enabled,
  className,
}: HomeDriveDebugOverlayProps) {
  const fallbackProfile = useHomeDriveViewportProfile();
  const resolvedProfile = profile ?? fallbackProfile;

  const [autoEnabled, setAutoEnabled] = useState(false);

  useEffect(() => {
    setAutoEnabled(readAutoEnabled());
  }, []);

  const visible = enabled ?? autoEnabled;

  const rootStyle = useMemo(() => {
    return buildRootStyle();
  }, []);

  const headerStyle = useMemo(() => {
    return buildHeaderStyle();
  }, []);

  const titleStyle = useMemo(() => {
    return buildTitleStyle();
  }, []);

  const badgeStyle = useMemo(() => {
    return buildBadgeStyle();
  }, []);

  if (!visible) {
    return null;
  }

  const { snapshot, flags, values } = resolvedProfile;

  return (
    <aside
      aria-label="Home drive debug overlay"
      className={className}
      data-home-drive-debug-overlay="true"
      style={rootStyle}
    >
      <header style={headerStyle}>
        <h2 style={titleStyle}>Drive debug</h2>
        <span style={badgeStyle}>{flags.kind}</span>
      </header>

      <div style={buildGridStyle()}>
        <DebugRow
          label="stage"
          value={`${formatPx(values.stageWidth)} × ${formatPx(
            values.stageHeight,
          )}`}
        />
        <DebugRow
          label="visual"
          value={`${formatPx(values.visualWidth)} × ${formatPx(
            values.visualHeight,
          )}`}
        />
        <DebugRow
          label="layout"
          value={`${formatPx(snapshot.layoutWidth)} × ${formatPx(
            snapshot.layoutHeight,
          )}`}
        />
        <DebugRow label="aspect" value={roundNumber(values.aspectRatio, 3)} />
        <DebugRow label="dpr" value={snapshot.devicePixelRatio} />
      </div>

      {runtime ? (
        <>
          <DebugSection title="world">
            <DebugRow label="phase" value={runtime.phase} />
            <DebugRow label="speed" value={`${formatNumber(runtime.speedKmh, 1)} km/h`} />
            <DebugRow label="rpm" value={runtime.rpm} />
            <DebugRow label="gear" value={runtime.gearLabel} />
            <DebugRow label="world x" value={formatNumber(runtime.worldX, 2)} />
            <DebugRow label="world y" value={formatNumber(runtime.worldY, 2)} />
            <DebugRow label="heading" value={formatDeg(runtime.headingDeg)} />
            <DebugRow label="steering" value={formatNumber(runtime.steering, 3)} />
          </DebugSection>

          <DebugSection title="road">
            <DebugRow label="road id" value={formatText(runtime.currentRoadId)} />
            <DebugRow
              label="road label"
              value={formatText(runtime.currentRoadLabel)}
            />
            <DebugRow
              label="district id"
              value={formatText(runtime.currentDistrictId)}
            />
            <DebugRow
              label="district"
              value={formatText(runtime.currentDistrictLabel ?? runtime.districtLabel)}
            />
            <DebugRow
              label="nearest road"
              value={formatMeters(runtime.nearestRoadDistanceMeters)}
            />
            <DebugRow
              label="visible roads"
              value={runtime.visibleWorldRoads.length}
            />
            <DebugRow
              label="intersections"
              value={runtime.intersectionsAhead.length}
            />
          </DebugSection>

          <DebugSection title="camera runtime">
            <DebugRow label="road drift" value={formatPx(runtime.roadDriftPx)} />
            <DebugRow label="camera roll" value={formatDeg(runtime.cameraRollDeg)} />
            <DebugRow
              label="horizon shift"
              value={formatPx(runtime.horizonShiftPx)}
            />
            <DebugRow label="parallax" value={formatPx(runtime.parallaxPx)} />
            <DebugRow label="yaw" value={formatDeg(runtime.cameraYaw)} />
            <DebugRow label="pitch" value={formatDeg(runtime.cameraPitch)} />
            <DebugRow
              label="intensity"
              value={formatNumber(runtime.steeringIntensity, 3)}
            />
          </DebugSection>

          {runtime.intersectionAhead ? (
            <DebugSection title="intersection ahead">
              <DebugRow
                label="target"
                value={runtime.intersectionAhead.targetRoadLabel}
              />
              <DebugRow
                label="side"
                value={runtime.intersectionAhead.turnSide}
              />
              <DebugRow
                label="distance"
                value={formatMeters(runtime.intersectionAhead.distanceMeters)}
              />
              <DebugRow
                label="angle"
                value={formatDeg(runtime.intersectionAhead.angleDeg)}
              />
            </DebugSection>
          ) : null}
        </>
      ) : null}

      <DebugSection title="flags">
        <DebugRow label="narrow" value={formatBool(flags.isNarrow)} />
        <DebugRow label="compact" value={formatBool(flags.isCompact)} />
        <DebugRow label="short" value={formatBool(flags.isShort)} />
        <DebugRow label="very short" value={formatBool(flags.isVeryShort)} />
        <DebugRow label="tall" value={formatBool(flags.isTall)} />
        <DebugRow
          label="reduced viewport"
          value={formatBool(flags.hasReducedVisualViewport)}
        />
        <DebugRow
          label="bottom inset risk"
          value={formatBool(flags.hasSystemBottomInsetRisk)}
        />
      </DebugSection>

      <DebugSection title="system">
        <DebugRow label="visual offset top" value={formatPx(snapshot.visualOffsetTop)} />
        <DebugRow
          label="visual offset left"
          value={formatPx(snapshot.visualOffsetLeft)}
        />
        <DebugRow
          label="visual bottom gap"
          value={formatPx(snapshot.visualViewportBottomGap)}
        />
        <DebugRow
          label="reduced viewport"
          value={formatPx(snapshot.reducedVisualViewportPx)}
        />
        <DebugRow label="bottom safe zone" value={formatPx(values.bottomSafeZonePx)} />
        <DebugRow
          label="system bottom inset"
          value={formatPx(values.systemBottomInsetPx)}
        />
      </DebugSection>

      <DebugSection title="cockpit">
        <DebugRow label="width" value={formatPx(values.cockpitWidthPx)} />
        <DebugRow label="height" value={formatPx(values.cockpitHeightPx)} />
        <DebugRow label="bottom" value={formatPx(values.cockpitBottomPx)} />
      </DebugSection>

      <DebugSection title="steering">
        <DebugRow label="width" value={formatPx(values.steeringWidthPx)} />
        <DebugRow label="bottom" value={formatPx(values.steeringBottomPx)} />
      </DebugSection>

      <DebugSection title="speedometer">
        <DebugRow label="size" value={formatPx(values.speedometerSizePx)} />
        <DebugRow label="x" value={formatPx(values.speedometerXpx)} />
        <DebugRow label="bottom" value={formatPx(values.speedometerYpx)} />
      </DebugSection>
    </aside>
  );
}
