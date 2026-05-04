// src/pages/Mateus/Home/components/mobile/game/driving/view/HomeDriveDiagnosticsOverlay.tsx

import React from "react";

import type {
  HomeDriveRuntimeDiagnosticsGroup,
  HomeDriveRuntimeDiagnosticsSnapshot,
} from "../domain/diagnostics";
import styles from "./HomeDriveDiagnosticsOverlay.module.css";

export type HomeDriveDiagnosticsOverlayProps = Readonly<{
  snapshot: HomeDriveRuntimeDiagnosticsSnapshot | null;
}>;

type WorldGroupKey = "cars" | "pedestrians" | "buildings";

type WorldBarItem = Readonly<{
  key: WorldGroupKey;
  label: string;
  enabled: boolean;
  rawPercent: number;
  normalizedPercent: number;
}>;

const WORLD_GROUP_ORDER: readonly WorldGroupKey[] = [
  "cars",
  "pedestrians",
  "buildings",
] as const;

function formatPercent(value: number): string {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: value >= 10 ? 0 : 1,
    maximumFractionDigits: value >= 10 ? 0 : 1,
  });
}

function getWorldGroups(snapshot: HomeDriveRuntimeDiagnosticsSnapshot): readonly WorldBarItem[] {
  const sourceGroups = WORLD_GROUP_ORDER.map((key) => {
    return snapshot.groups.find((group) => group.key === key);
  }).filter(Boolean) as HomeDriveRuntimeDiagnosticsGroup[];

  const sortedGroups = [...sourceGroups].sort((first, second) => {
    const firstPercent = Math.max(
      0,
      first.profiledSharePercent ?? first.workSharePercent,
    );
    const secondPercent = Math.max(
      0,
      second.profiledSharePercent ?? second.workSharePercent,
    );

    return secondPercent - firstPercent;
  });

  const total = sortedGroups.reduce((sum, group) => {
    return sum + Math.max(0, group.profiledSharePercent ?? group.workSharePercent);
  }, 0);

  return sortedGroups.map((group) => {
    const rawPercent = Math.max(0, group.profiledSharePercent ?? group.workSharePercent);
    const normalizedPercent = total > 0 ? (rawPercent / total) * 100 : 0;

    return {
      key: group.key as WorldGroupKey,
      label: group.label,
      enabled: group.enabled,
      rawPercent,
      normalizedPercent,
    };
  });
}

function getSegmentStyle(item: WorldBarItem): React.CSSProperties {
  return {
    width: `${item.normalizedPercent}%`,
  };
}

export default function HomeDriveDiagnosticsOverlay({
  snapshot,
}: HomeDriveDiagnosticsOverlayProps) {
  if (!snapshot) {
    return (
      <aside className={styles.panel} aria-live="polite">
        <strong className={styles.title}>Diagnóstico HomeDrive</strong>
        <span className={styles.caption}>coletando primeiros dados…</span>
      </aside>
    );
  }

  const items = getWorldGroups(snapshot);

  return (
    <aside className={styles.panel} aria-live="polite">
      <header className={styles.header}>
        <strong className={styles.title}>Peso atual do frame</strong>
        <span className={styles.caption}>barra 100% · carros · pedestres · prédios</span>
      </header>

      <div className={styles.barShell} aria-label="Distribuição de custo do frame entre carros, pedestres e prédios">
        {items.map((item) => (
          <span
            key={item.key}
            className={styles.barSegment}
            data-kind={item.key}
            data-enabled={item.enabled ? "true" : "false"}
            style={getSegmentStyle(item)}
            title={`${item.label}: ${formatPercent(item.normalizedPercent)}%`}
          />
        ))}
      </div>

      <ul className={styles.legendList}>
        {items.map((item) => (
          <li
            key={item.key}
            className={styles.legendItem}
            data-kind={item.key}
            data-enabled={item.enabled ? "true" : "false"}
          >
            <span className={styles.legendLeft}>
              <span className={styles.legendDot} aria-hidden="true" />
              <span className={styles.legendLabel}>{item.label}</span>
            </span>

            <span className={styles.legendRight}>
              <strong>{formatPercent(item.normalizedPercent)}%</strong>
              <small>{item.enabled ? "on" : "off"}</small>
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
