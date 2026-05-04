// src/pages/Mateus/Home/components/mobile/game/driving/view/HomeDriveBootLoadingScreen.tsx

import React, { memo, useMemo } from "react";

import type {
  HomeDriveBootPhase,
  HomeDriveBootProgressSnapshot,
} from "../boot/homeDriveBootAssets";
import styles from "./HomeDriveBootLoadingScreen.module.css";

export type HomeDriveBootLoadingScreenProps = Readonly<{
  snapshot: HomeDriveBootProgressSnapshot;
  onRetry?: () => void;
}>;

type BootStep = Readonly<{
  phase: HomeDriveBootPhase;
  label: string;
}>;

const BOOT_STEPS: readonly BootStep[] = [
  { phase: "images", label: "IMG" },
  { phase: "audio", label: "SOM" },
  { phase: "buildings", label: "CID" },
  { phase: "cars", label: "CAR" },
  { phase: "city-fixtures", label: "RUA" },
  { phase: "pedestrians", label: "NPC" },
  { phase: "rendering", label: "GPU" },
];

const STEP_ORDER = BOOT_STEPS.reduce<Record<string, number>>(
  (order, step, index) => ({
    ...order,
    [step.phase]: index,
  }),
  {},
);

function formatPercent(progress: number): string {
  return `${Math.round(Math.max(0, Math.min(100, progress)))}%`;
}

function getPublicDetail(phase: HomeDriveBootPhase, fallback: string): string {
  switch (phase) {
    case "idle":
      return "Aperte nada. O Drive está acordando.";
    case "images":
      return "Preparando o painel e a tela.";
    case "audio":
      return "Aquecendo o motor.";
    case "buildings":
      return "Montando a cidade.";
    case "cars":
      return "Colocando o trânsito na pista.";
    case "city-fixtures":
      return "Acendendo ruas e cruzamentos.";
    case "pedestrians":
      return "Posicionando pessoas e animações.";
    case "finalizing":
      return "Travando tudo antes do primeiro frame.";
    case "rendering":
      return "Esperando o mundo aparecer de verdade.";
    case "ready":
      return "Drive pronto.";
    case "error":
      return fallback || "Não foi possível carregar o Drive.";
    default:
      return fallback;
  }
}

function getPhaseOrder(phase: HomeDriveBootPhase): number {
  if (phase === "idle") {
    return -1;
  }

  if (phase === "finalizing") {
    return (STEP_ORDER.pedestrians ?? 5) + 0.5;
  }

  if (phase === "ready") {
    return (STEP_ORDER.rendering ?? 6) + 1;
  }

  if (phase === "error") {
    return (STEP_ORDER.rendering ?? 6) + 1;
  }

  return STEP_ORDER[phase] ?? -1;
}

function getStepState(
  step: BootStep,
  phase: HomeDriveBootPhase,
): "done" | "active" | "pending" {
  if (phase === "ready") {
    return "done";
  }

  if (phase === "error") {
    return STEP_ORDER[step.phase] <= (STEP_ORDER.rendering ?? 0)
      ? "done"
      : "pending";
  }

  const currentOrder = getPhaseOrder(phase);
  const stepOrder = STEP_ORDER[step.phase] ?? -1;

  if (stepOrder < currentOrder) {
    return "done";
  }

  if (stepOrder === currentOrder) {
    return "active";
  }

  return "pending";
}

function HomeDriveBootLoadingScreen({
  snapshot,
  onRetry,
}: HomeDriveBootLoadingScreenProps) {
  const percentLabel = useMemo(() => {
    return formatPercent(snapshot.progress);
  }, [snapshot.progress]);

  const publicDetail = useMemo(() => {
    return getPublicDetail(snapshot.phase, snapshot.detail);
  }, [snapshot.detail, snapshot.phase]);

  const barStyle = useMemo<React.CSSProperties>(() => {
    return {
      "--home-drive-boot-progress": `${Math.max(
        0,
        Math.min(100, snapshot.progress),
      )}%`,
    } as React.CSSProperties;
  }, [snapshot.progress]);

  const isError = snapshot.phase === "error";

  return (
    <section
      className={styles.root}
      data-home-drive-interactive="true"
      aria-live="polite"
      aria-busy={!isError}
    >
      <div className={styles.scanline} aria-hidden="true" />

      <div className={styles.panel}>
        <header className={styles.header}>
          <span className={styles.brand}>CABRAIZ DRIVE</span>
          <span className={styles.version}>FLASH MODE</span>
        </header>

        <div className={styles.mainRow}>
          <div className={styles.percentBox}>{percentLabel}</div>
          <div className={styles.copyBlock}>
            <h1 className={styles.title}>
              {isError ? "LOAD ERROR" : snapshot.label}
            </h1>
            <p className={styles.detail}>{publicDetail}</p>
          </div>
        </div>

        <div className={styles.progressTrack} aria-label={percentLabel}>
          <span className={styles.progressFill} style={barStyle} />
        </div>

        <div className={styles.steps} aria-label="Etapas do carregamento">
          {BOOT_STEPS.map((step) => (
            <span
              key={step.phase}
              className={styles.step}
              data-state={getStepState(step, snapshot.phase)}
            >
              {step.label}
            </span>
          ))}
        </div>

        <footer className={styles.footer}>
          <span>LOADING</span>
          <span>NO CLICK</span>
          <span>WAIT</span>
        </footer>

        {isError ? (
          <button className={styles.retryButton} type="button" onClick={onRetry}>
            RELOAD
          </button>
        ) : null}
      </div>
    </section>
  );
}

export default memo(HomeDriveBootLoadingScreen);
