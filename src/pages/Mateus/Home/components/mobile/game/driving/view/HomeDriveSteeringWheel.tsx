// src/pages/Mateus/Home/components/mobile/game/driving/view/HomeDriveSteeringWheel.tsx

import React, {
  memo,
  useCallback,
  useMemo,
  useState,
  type CSSProperties,
} from "react";

import type { HomeDriveSteeringWheelController } from "../hooks/useHomeDriveSteeringWheel";
import { HOME_DRIVE_COCKPIT_ASSETS } from "./cockpit";
import styles from "./HomeDriveSteeringWheel.module.css";

export type HomeDriveSteeringWheelProps = Readonly<{
  controller: HomeDriveSteeringWheelController;
}>;

function HomeDriveSteeringWheel({
  controller,
}: HomeDriveSteeringWheelProps) {
  const [imageFailed, setImageFailed] = useState(false);

  const rootClassName = useMemo(() => {
    return [styles.root, controller.isDragging ? styles.dragging : ""]
      .filter(Boolean)
      .join(" ");
  }, [controller.isDragging]);

  const wheelStyle = useMemo<CSSProperties>(() => {
    return {
      "--free-drive-wheel-rotation": `${controller.wheelRotationDeg.toFixed(
        3,
      )}deg`,
    } as CSSProperties;
  }, [controller.wheelRotationDeg]);

  const ariaValueNow = useMemo(() => {
    return Number(controller.steering.toFixed(2));
  }, [controller.steering]);

  const handleImageError = useCallback(() => {
    setImageFailed((current) => {
      if (current) {
        return current;
      }

      return true;
    });
  }, []);

  return (
    <div className={rootClassName}>
      <div
        ref={controller.wheelRef}
        className={styles.touchTarget}
        style={wheelStyle}
        aria-label="Volante"
        role="slider"
        aria-valuemin={-1}
        aria-valuemax={1}
        aria-valuenow={ariaValueNow}
        tabIndex={0}
        {...controller.handlers}
      >
        <div className={styles.wheel}>
          {!imageFailed ? (
            <img
              className={styles.wheelImage}
              src={HOME_DRIVE_COCKPIT_ASSETS.steeringWheelSrc}
              alt=""
              draggable={false}
              decoding="async"
              onError={handleImageError}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default memo(HomeDriveSteeringWheel);
