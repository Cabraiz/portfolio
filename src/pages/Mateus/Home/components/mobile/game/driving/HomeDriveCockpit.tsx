import React, { useMemo, type CSSProperties } from "react";

import type { HomeDriveRuntimeState } from "./domain/homeDrive.types";
import cockpitPng from "../../../../../../../assets/Mateus/driving/cockpit.png";
import steeringWheelPng from "../../../../../../../assets/Mateus/driving/steering-wheel.png";
import styles from "./HomeDriveCockpit.module.css";

export type HomeDriveCockpitProps = Readonly<{
  runtime: HomeDriveRuntimeState;
  className?: string;
}>;

type CockpitCssVars = CSSProperties &
  Readonly<{
    "--home-drive-steering-rotation": string;
  }>;

/**
 * Move somente o volante.
 *
 * X negativo = esquerda.
 * X positivo = direita.
 *
 * Y positivo = baixo.
 * Y negativo = cima.
 */
const STEERING_WHEEL_SHIFT_X_PCT = -9.5;
const STEERING_WHEEL_SHIFT_Y_PCT = 8.5;

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

function buildClassName(className?: string): string {
  return [styles.root, className].filter(Boolean).join(" ");
}

function getSteeringWheelPlacementStyle(): CSSProperties {
  return {
    width: "100%",
    height: "100%",
    display: "grid",
    placeItems: "center",
    transform: `translate(${STEERING_WHEEL_SHIFT_X_PCT}%, ${STEERING_WHEEL_SHIFT_Y_PCT}%)`,
    transformOrigin: "center center",
    pointerEvents: "none",
  };
}

export default function HomeDriveCockpit({
  runtime,
  className,
}: HomeDriveCockpitProps) {
  const cockpitStyle = useMemo<CockpitCssVars>(() => {
    const steering = clampNumber(runtime.steering, -1, 1);
    const steeringRotationDeg = steering * 132;

    return {
      "--home-drive-steering-rotation": `${steeringRotationDeg}deg`,
    };
  }, [runtime.steering]);

  const steeringWheelPlacementStyle = useMemo(() => {
    return getSteeringWheelPlacementStyle();
  }, []);

  return (
    <div
      aria-hidden="true"
      className={buildClassName(className)}
      data-home-drive-cockpit="true"
      style={cockpitStyle}
    >
      <div className={styles.glassReflection} />
      <div className={styles.windshieldTop} />

      <div className={styles.cockpitImageShell}>
        <img
          className={styles.cockpitImage}
          src={cockpitPng}
          alt=""
          draggable={false}
        />
      </div>

      <div className={styles.steeringWheelShell}>
        <div style={steeringWheelPlacementStyle}>
          <img
            className={styles.steeringWheelImage}
            src={steeringWheelPng}
            alt=""
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
}
