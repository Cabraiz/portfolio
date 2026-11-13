// src/pages/Mateus/Home/components/mobile/game/driving/hooks/useHomeDriveSteeringWheel.keyboard.ts

import { useEffect } from "react";

import {
  FREE_DRIVE_WHEEL_VISUAL_MAX_ROTATION_DEG as HOME_DRIVE_WHEEL_VISUAL_MAX_ROTATION_DEG,
} from "../domain/homeDrive.constants";

// setas esquerda/direita giram o volante enquanto pressionadas
export function useHomeDriveSteeringWheelKeyboard(
  commitRotation: (nextRotationDeg: number) => void,
  resetRotation: () => void,
): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
        return;
      }

      event.preventDefault();

      commitRotation(
        event.key === "ArrowLeft"
          ? -HOME_DRIVE_WHEEL_VISUAL_MAX_ROTATION_DEG * 0.72
          : HOME_DRIVE_WHEEL_VISUAL_MAX_ROTATION_DEG * 0.72,
      );
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
        return;
      }

      event.preventDefault();
      resetRotation();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [commitRotation, resetRotation]);
}
