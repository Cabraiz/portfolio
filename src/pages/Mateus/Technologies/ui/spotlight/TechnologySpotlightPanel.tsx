import { memo, type CSSProperties } from "react";

import type { TechnologyHexCardItem } from "../hex/TechnologyHexCard";
import type {
  TechnologyTrunfoEntry,
  TechnologyTrunfoStat,
} from "../../domain/technologies.types";
import styles from "./TechnologySpotlightPanel.module.css";

function joinClasses(
  ...classes: Array<string | undefined | null | false>
): string {
  return classes.filter(Boolean).join(" ");
}

export type TechnologySpotlightItem = TechnologyHexCardItem &
  Readonly<{
    shortName?: string;
    eyebrow?: string;
    subtitle?: string;
    levelDescription?: string;
    heroImageSrc?: string;
    heroCaptionTitle?: string;
    heroCaptionText?: string;
    deliveryLabel?: string;
    confidenceLabel?: string;
    trunfoData?: TechnologyTrunfoEntry | null;
  }>;

type TechnologySpotlightPanelProps = Readonly<{
  item?: TechnologySpotlightItem | null;
  className?: string;
  emptyEyebrow?: string;
  emptyTitle?: string;
  emptyText?: string;
}>;

function getInitials(name: string): string {
  const tokens = name
    .split(/[\s/|()-]+/)
    .map((token) => token.trim())
    .filter(Boolean);

  if (tokens.length === 0) {
    return "SK";
  }

  if (tokens.length === 1) {
    return tokens[0].slice(0, 2).toUpperCase();
  }

  return `${tokens[0][0] ?? ""}${tokens[1][0] ?? ""}`.toUpperCase();
}

function buildFallbackTrunfo(
  item: TechnologySpotlightItem,
): TechnologyTrunfoEntry | null {
  const stats: TechnologyTrunfoStat[] = [];

  if (item.categoryLabel) {
    stats.push({
      id: "category",
      label: "Domínio",
      value: item.categoryLabel,
    });
  }

  if (item.deliveryLabel) {
    stats.push({
      id: "delivery",
      label: "Entrega",
      value: item.deliveryLabel,
    });
  }

  if (item.confidenceLabel) {
    stats.push({
      id: "confidence",
      label: "Recorrência",
      value: item.confidenceLabel,
    });
  }

  if (stats.length === 0) {
    return null;
  }

  return {
    technologyId: item.id,
    name: item.name,
    imageSrc: item.heroImageSrc ?? null,
    imageAlt: `${item.name} technical card visual`,
    stats,
  };
}

function TechnologySpotlightPanelComponent({
  item,
  className,
  emptyEyebrow = "Technology Spotlight",
  emptyTitle = "Selecione uma tecnologia para abrir o card técnico.",
  emptyText = "A coluna direita foi preparada para funcionar como um card de trunfo: imagem superior e atributos dinâmicos vindos do JSON da tecnologia.",
}: TechnologySpotlightPanelProps) {
  if (!item) {
    return (
      <aside className={joinClasses(styles.empty, className)}>
        <div className={styles.emptyInner}>
          <p className={styles.emptyEyebrow}>{emptyEyebrow}</p>
          <h2 className={styles.emptyTitle}>{emptyTitle}</h2>
          <p className={styles.emptyText}>{emptyText}</p>
        </div>
      </aside>
    );
  }

  const trunfoData: TechnologyTrunfoEntry | null =
    item.trunfoData ?? buildFallbackTrunfo(item);

  const heroImageSrc =
    trunfoData?.imageSrc ?? item.heroImageSrc ?? item.iconSrc ?? null;

  const heroImageAlt = trunfoData?.imageAlt ?? `${item.name} spotlight visual`;

  const stats: readonly TechnologyTrunfoStat[] = trunfoData?.stats ?? [];

  const topLeftCode = item.shortName ?? "3B";
  const topRightName = trunfoData?.name ?? item.name;

  const cssVars = {
    "--technology-spotlight-accent-rgb": item.accentRgb ?? "212, 175, 55",
  } as CSSProperties;

  return (
    <aside
      className={joinClasses(styles.panel, className)}
      style={cssVars}
      aria-labelledby={`technology-spotlight-title-${item.id}`}
      data-technology-spotlight="true"
      data-technology-id={item.id}
      data-technology-trunfo={stats.length > 0 ? "true" : "false"}
    >
      <div className={styles.trunfoCard}>
        <div className={styles.topBar}>
          <span className={styles.topBarCode}>{topLeftCode}</span>
          <h2
            className={styles.topBarName}
            id={`technology-spotlight-title-${item.id}`}
          >
            {topRightName}
          </h2>
        </div>

        <div className={styles.heroArea}>
          <div className={styles.heroMediaFrame}>
            {heroImageSrc ? (
              <img
                src={heroImageSrc}
                alt={heroImageAlt}
                className={styles.heroMedia}
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className={styles.heroMediaFallback} aria-hidden="true">
                <div className={styles.heroMediaFallbackInner}>
                  <span className={styles.heroMediaFallbackText}>
                    {getInitials(item.name)}
                  </span>
                </div>
              </div>
            )}

            <div className={styles.heroMediaOverlay} aria-hidden="true" />

            {(item.heroCaptionTitle || item.heroCaptionText) && !stats.length ? (
              <div className={styles.heroCaption}>
                {item.heroCaptionTitle ? (
                  <h3 className={styles.heroCaptionTitle}>
                    {item.heroCaptionTitle}
                  </h3>
                ) : null}

                {item.heroCaptionText ? (
                  <p className={styles.heroCaptionText}>
                    {item.heroCaptionText}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <div className={styles.boardArea}>
          {item.description ? (
            <div className={styles.boardSummary}>
              <p className={styles.boardSummaryText}>{item.description}</p>
            </div>
          ) : null}

          {stats.length ? (
            <div className={styles.statsList}>
              {stats.map((stat) => (
                <div key={stat.id} className={styles.statRow}>
                  <span className={styles.statLabel}>{stat.label}</span>
                  <span className={styles.statValue}>{String(stat.value)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.statsEmpty}>
              <span className={styles.statsEmptyText}>
                Nenhum atributo cadastrado para esta tecnologia.
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

const TechnologySpotlightPanel = memo(TechnologySpotlightPanelComponent);
TechnologySpotlightPanel.displayName = "TechnologySpotlightPanel";

export default TechnologySpotlightPanel;
