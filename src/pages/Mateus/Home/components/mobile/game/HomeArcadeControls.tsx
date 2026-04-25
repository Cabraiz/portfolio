import React, { useCallback } from "react";

import styles from "./HomeArcadeControls.module.css";

export type HomeArcadeControlsProps = Readonly<{
  isInteractive?: boolean;
  onJumpPress: () => void;
  className?: string;
}>;

export default function HomeArcadeControls({
  isInteractive = true,
  onJumpPress,
  className,
}: HomeArcadeControlsProps) {
  const handleJumpPointerDown = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      event.preventDefault();

      if (!isInteractive) {
        return;
      }

      onJumpPress();
    },
    [isInteractive, onJumpPress],
  );

  return (
    <div
      className={[
        styles.root,
        !isInteractive ? styles.disabled : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <button
        type="button"
        aria-label="Pular"
        className={styles.button}
        onPointerDown={handleJumpPointerDown}
      >
        <span className={styles.innerShade} />
        <span className={styles.innerGlow} />
        <span className={styles.label}>Jump</span>
      </button>
    </div>
  );
}
