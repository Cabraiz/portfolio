// src/pages/Mateus/Home/components/mobile/game/driving/view/HomeDriveSpeedometer.tsx

import React, { memo, useMemo, type CSSProperties } from "react";

import {
  getHomeDriveSpeedometerNeedleState,
  getHomeDriveSpeedometerTickDeg,
  HOME_DRIVE_SPEEDOMETER_CSS_VARS,
  HOME_DRIVE_SPEEDOMETER_DEFAULT_LABEL,
  HOME_DRIVE_SPEEDOMETER_MAJOR_TICKS,
  HOME_DRIVE_SPEEDOMETER_MINOR_TICKS,
  type HomeDriveSpeedometerTick,
} from "./speedometer";
import styles from "./HomeDriveSpeedometer.module.css";

export type HomeDriveSpeedometerProps = Readonly<{
  speedMps: number;
  className?: string;
  label?: string;
}>;

type SpeedometerCssProperties = CSSProperties &
  Readonly<Record<string, string | number>>;

function getClassName(className?: string): string {
  return [styles.root, className].filter(Boolean).join(" ");
}

function createSpeedometerStyle(params: {
  needleDeg: number;
  progress: number;
}): SpeedometerCssProperties {
  /*
    Só variáveis dinâmicas do ponteiro.
    Posição, tamanho e responsividade ficam em:
    - cockpit/homeDriveCockpit.tokens.ts
    - HomeDriveSpeedometer.module.css
  */
  return {
    [HOME_DRIVE_SPEEDOMETER_CSS_VARS.needleDeg]: `${params.needleDeg.toFixed(
      3,
    )}deg`,
    [HOME_DRIVE_SPEEDOMETER_CSS_VARS.progress]: params.progress.toFixed(4),
  };
}

function createTickStyle(valueKmh: number): SpeedometerCssProperties {
  return {
    "--home-drive-speedometer-tick-deg": `${getHomeDriveSpeedometerTickDeg(
      valueKmh,
    ).toFixed(3)}deg`,
  };
}

function SpeedometerMinorTick({ valueKmh }: Readonly<{ valueKmh: number }>) {
  return (
    <span
      aria-hidden="true"
      className={styles.minorTick}
      style={createTickStyle(valueKmh)}
    />
  );
}

function SpeedometerMajorTick({
  tick,
}: Readonly<{ tick: HomeDriveSpeedometerTick }>) {
  return (
    <span
      aria-hidden="true"
      className={[
        styles.majorTick,
        tick.isDanger ? styles.majorTickDanger : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={createTickStyle(tick.valueKmh)}
    >
      <span className={styles.majorTickLine} />
      <span className={styles.majorTickLabel}>{tick.label}</span>
    </span>
  );
}

function HomeDriveSpeedometer({
  speedMps,
  className,
  label = HOME_DRIVE_SPEEDOMETER_DEFAULT_LABEL,
}: HomeDriveSpeedometerProps) {
  const needleState = useMemo(
    () => getHomeDriveSpeedometerNeedleState(speedMps),
    [speedMps],
  );

  const rootStyle = useMemo(
    () =>
      createSpeedometerStyle({
        needleDeg: needleState.needleDeg,
        progress: needleState.progress,
      }),
    [needleState.needleDeg, needleState.progress],
  );

  return (
    <aside
      data-home-drive-speedometer="true"
      aria-label={`Velocímetro analógico: ${needleState.displaySpeedKmh} quilômetros por hora`}
      className={getClassName(className)}
      style={rootStyle}
    >
      <div className={styles.shell}>
        <div className={styles.outerBezel} />
        <div className={styles.innerBezel} />

        <div className={styles.face}>
          <div className={styles.paperGrain} />
          <div className={styles.dangerBand} />

          <div className={styles.tickLayer} aria-hidden="true">
            {HOME_DRIVE_SPEEDOMETER_MINOR_TICKS.map((valueKmh) => (
              <SpeedometerMinorTick key={valueKmh} valueKmh={valueKmh} />
            ))}

            {HOME_DRIVE_SPEEDOMETER_MAJOR_TICKS.map((tick) => (
              <SpeedometerMajorTick key={tick.valueKmh} tick={tick} />
            ))}
          </div>

          <div className={styles.brandPlate} aria-hidden="true">
            <span className={styles.brandText}>FREE DRIVE</span>
          </div>

          <div className={styles.digitalReadout} aria-hidden="true">
            {needleState.displaySpeedKmh.toString().padStart(3, "0")}
          </div>

          <div className={styles.unitLabel} aria-hidden="true">
            {label}
          </div>

          <div className={styles.needlePivot}>
            <div className={styles.needleShadow} />
            <div className={styles.needle} />
            <div className={styles.needleCap} />
            <div className={styles.needlePin} />
          </div>

          <div className={styles.glassReflection} />
          <div className={styles.bottomShade} />
        </div>
      </div>
    </aside>
  );
}

export default memo(HomeDriveSpeedometer);
