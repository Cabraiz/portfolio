// src/pages/Mateus/Home/components/mobile/game/driving/view/HomeDriveCompass.tsx

import { useMemo, type CSSProperties } from "react";

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

  /**
   * legacy: mantém o padrão atual do projeto: N W S O.
   * ptBR: usa N L S O.
   * international: usa N E S W.
   */
  cardinalMode?: HomeDriveCompassCardinalMode;
}>;

function cx(...classNames: Array<string | false | null | undefined>): string {
  return classNames.filter(Boolean).join(" ");
}

export default function HomeDriveCompass({
  headingRad,
  className,
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

  const activeDirectionLabel = getHomeDriveCompassActiveDirectionLabel(
    headingDegrees,
    cardinalMode,
  );

  return (
    <div
      className={cx(styles.root, className)}
      aria-label={`Bússola: direção ${activeDirectionLabel}`}
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
            } as CSSProperties;

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
