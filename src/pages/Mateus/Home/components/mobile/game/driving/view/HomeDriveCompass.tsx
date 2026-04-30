// src/pages/Mateus/Home/components/mobile/game/driving/view/HomeDriveCompass.tsx

import { memo, useMemo, type CSSProperties } from "react";

import type { HomeDriveMissionCompassTarget } from "../domain/missions";
import {
  buildHomeDriveCompassMarks,
  getHomeDriveCompassActiveDirectionLabel,
  getHomeDriveCompassVisibleMarks,
  homeDriveCompassRadiansToDegrees,
  HOME_DRIVE_COMPASS_DEFAULT_CARDINAL_MODE,
  HOME_DRIVE_COMPASS_TOKENS,
  type HomeDriveCompassCardinalMode,
} from "./compass";
import styles from "./HomeDriveCompass.module.css";

export type HomeDriveCompassProps = Readonly<{
  headingRad: number;
  className?: string;
  target?: HomeDriveMissionCompassTarget | null;

  /**
   * legacy: mantém o padrão atual do projeto: N W S O.
   * ptBR: usa N L S O.
   * international: usa N E S W.
   */
  cardinalMode?: HomeDriveCompassCardinalMode;
}>;

type CompassCssProperties = CSSProperties &
  Readonly<Record<string, string | number>>;

type CompassTargetRenderState = Readonly<{
  x: number;
  opacity: number;
  distanceRatio: number;
  isAtEdge: boolean;
  progress: number;
}>;

function cx(...classNames: Array<string | false | null | undefined>): string {
  return classNames.filter(Boolean).join(" ");
}

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

function radiansToSignedDegrees(angleRad: number): number {
  return (angleRad * 180) / Math.PI;
}

function createTargetRenderState(
  target: HomeDriveMissionCompassTarget | null | undefined,
): CompassTargetRenderState | null {
  if (!target) {
    return null;
  }

  const halfVisibleDegrees = HOME_DRIVE_COMPASS_TOKENS.visibleDegrees / 2;
  const maxX =
    halfVisibleDegrees * HOME_DRIVE_COMPASS_TOKENS.pixelsPerDegree;

  const relativeDegrees = radiansToSignedDegrees(target.relativeAngleRad);

  /*
    O domínio calcula o ângulo relativo corretamente, mas a projeção horizontal
    visual da régua do compasso precisa inverter o sinal.
  */
  const rawX = -relativeDegrees * HOME_DRIVE_COMPASS_TOKENS.pixelsPerDegree;

  const x = clampNumber(rawX, -maxX, maxX);
  const distanceRatio = clampNumber(Math.abs(rawX) / Math.max(1, maxX), 0, 1);
  const isAtEdge = Math.abs(rawX) > maxX;

  const edgeOpacity = 1 - distanceRatio * 0.42;
  const behindOpacity = target.isBehind ? 0.58 : 1;
  const opacity = clampNumber(edgeOpacity * behindOpacity, 0.34, 1);

  return {
    x,
    opacity,
    distanceRatio,
    isAtEdge,
    progress: clampNumber(target.checkInProgress, 0, 1),
  };
}

function createTargetStyle(
  state: CompassTargetRenderState,
): CompassCssProperties {
  return {
    "--free-drive-compass-target-x": `${state.x.toFixed(2)}px`,
    "--free-drive-compass-target-opacity": state.opacity.toFixed(3),
    "--free-drive-compass-target-distance": state.distanceRatio.toFixed(3),
    "--free-drive-compass-target-progress": state.progress.toFixed(3),
    "--free-drive-compass-target-edge": state.isAtEdge ? 1 : 0,
  };
}

function HomeDriveCompass({
  headingRad,
  className,
  target,
  cardinalMode = HOME_DRIVE_COMPASS_DEFAULT_CARDINAL_MODE,
}: HomeDriveCompassProps) {
  const headingDegrees = homeDriveCompassRadiansToDegrees(headingRad);

  const marks = useMemo(() => {
    return buildHomeDriveCompassMarks({
      cardinalMode,
      markIntervalDegrees: HOME_DRIVE_COMPASS_TOKENS.markIntervalDegrees,
    });
  }, [cardinalMode]);

  const visibleMarks = useMemo(() => {
    return getHomeDriveCompassVisibleMarks({
      headingDegrees,
      marks,
      visibleDegrees: HOME_DRIVE_COMPASS_TOKENS.visibleDegrees,
      pixelsPerDegree: HOME_DRIVE_COMPASS_TOKENS.pixelsPerDegree,
      minOpacity: HOME_DRIVE_COMPASS_TOKENS.minMarkOpacity,
      edgeOpacityFalloff: HOME_DRIVE_COMPASS_TOKENS.edgeOpacityFalloff,
    });
  }, [headingDegrees, marks]);

  const targetRenderState = useMemo(() => {
    return createTargetRenderState(target);
  }, [target]);

  const targetStyle = useMemo(() => {
    return targetRenderState ? createTargetStyle(targetRenderState) : undefined;
  }, [targetRenderState]);

  const activeDirectionLabel = getHomeDriveCompassActiveDirectionLabel(
    headingDegrees,
    cardinalMode,
  );

  const ariaLabel = target
    ? `Bússola: direção ${activeDirectionLabel}. Destino ${target.label}, ${target.distanceLabel}.`
    : `Bússola: direção ${activeDirectionLabel}`;

  return (
    <div
      className={cx(styles.root, className)}
      aria-label={ariaLabel}
      role="status"
    >
      <div className={styles.frame}>
        <div className={styles.edgeFade} aria-hidden="true" />
        <div className={styles.materialNoise} aria-hidden="true" />
        <div className={styles.rail} aria-hidden="true" />

        <div className={styles.markLayer} aria-hidden="true">
          {visibleMarks.map((mark) => {
            const markStyle = {
              "--free-drive-compass-x": `${mark.x}px`,
              "--free-drive-compass-opacity": mark.opacity.toFixed(3),
              "--free-drive-compass-distance": mark.distanceRatio.toFixed(3),
              "--free-drive-compass-emphasis": mark.emphasis.toFixed(3),
            } as CompassCssProperties;

            return (
              <span
                key={mark.degrees}
                className={cx(
                  styles.mark,
                  styles[`mark-${mark.size}`],
                  mark.label && styles.cardinal,
                )}
                style={markStyle}
              >
                {mark.label ? (
                  <span className={styles.label}>{mark.label}</span>
                ) : (
                  <span className={styles.tick} />
                )}
              </span>
            );
          })}
        </div>

        {target && targetRenderState && targetStyle ? (
          <div
            className={styles.targetLayer}
            aria-hidden="true"
            style={targetStyle}
          >
            <div
              className={cx(
                styles.targetMarker,
                target.isInsideCheckInRadius && styles.targetMarkerInside,
                target.isBehind && styles.targetMarkerBehind,
                targetRenderState.isAtEdge && styles.targetMarkerEdge,
              )}
            >
              <span className={styles.targetPointer} />
              <span className={styles.targetCard}>
                <span className={styles.targetImageWrap}>
                  <img
                    className={styles.targetImage}
                    src={target.imageSrc}
                    alt=""
                    draggable={false}
                    decoding="async"
                  />
                </span>

                <span className={styles.targetText}>
                  <span className={styles.targetLabel}>{target.label}</span>
                  <span className={styles.targetDistance}>
                    {target.isInsideCheckInRadius
                      ? "check-in"
                      : target.distanceLabel}
                  </span>
                </span>

                <span className={styles.targetProgressTrack}>
                  <span className={styles.targetProgressFill} />
                </span>
              </span>
            </div>
          </div>
        ) : null}

        <div className={styles.centerNeedle} aria-hidden="true">
          <span className={styles.centerNotch} />
          <span className={styles.centerStem} />
          <span className={styles.centerBase} />
          <span className={styles.centerGlow} />
        </div>
      </div>
    </div>
  );
}

export default memo(HomeDriveCompass);
