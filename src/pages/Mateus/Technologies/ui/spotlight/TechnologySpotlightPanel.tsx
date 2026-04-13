import { memo, type CSSProperties } from "react";

import { getTechnologyStarsStatsByCandidates } from "../../data/technologies.stats";
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
    label?: string;
    shortName?: string;
    eyebrow?: string;
    subtitle?: string;
    levelDescription?: string;
    heroImageSrc?: string;
    heroCaptionTitle?: string;
    heroCaptionText?: string;
    trunfoData?: TechnologyTrunfoEntry | null;
    aliases?: readonly string[];
  }>;

type TechnologySpotlightPanelProps = Readonly<{
  item?: TechnologySpotlightItem | null;
  className?: string;
  emptyEyebrow?: string;
  emptyTitle?: string;
  emptyText?: string;
}>;

type SpotlightRenderableStat = Readonly<{
  id: string;
  label: string;
  rawValue: string | number;
  numericValue: number | null;
  max: number;
  formattedValue: string;
}>;

const DEFAULT_MAX_STARS = 5;

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
  const jsonStats = getTechnologyStarsStatsByCandidates([
    item.id,
    item.name,
    item.label,
    item.shortName,
    ...(item.aliases ?? []),
  ]);

  if (jsonStats.length === 0) {
    return null;
  }

  return {
    technologyId: item.id,
    name: item.name,
    imageSrc: item.heroImageSrc ?? null,
    imageAlt: `${item.name} technical card visual`,
    stats: jsonStats.map((stat) => ({
      id: stat.id,
      label: stat.label,
      value: stat.value,
    })),
  };
}

function parseNumericStatValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.min(Math.max(Number(value.toFixed(1)), 0), DEFAULT_MAX_STARS);
  }

  if (typeof value === "string") {
    const parsed = Number(value.replace(",", ".").trim());

    if (Number.isFinite(parsed)) {
      return Math.min(
        Math.max(Number(parsed.toFixed(1)), 0),
        DEFAULT_MAX_STARS,
      );
    }
  }

  return null;
}

function formatStatValue(
  value: string | number,
  numericValue: number | null,
): string {
  if (numericValue !== null) {
    return `${numericValue.toFixed(1)}/${DEFAULT_MAX_STARS}`;
  }

  return String(value);
}

function normalizeRenderableStats(
  stats: readonly TechnologyTrunfoStat[],
): readonly SpotlightRenderableStat[] {
  return stats.map((stat) => {
    const numericValue = parseNumericStatValue(stat.value);

    return {
      id: String(stat.id),
      label: stat.label,
      rawValue: stat.value,
      numericValue,
      max: DEFAULT_MAX_STARS,
      formattedValue: formatStatValue(stat.value, numericValue),
    };
  });
}

function getStarFillPercent(starIndex: number, value: number): number {
  const starStart = starIndex;
  const starEnd = starIndex + 1;

  if (value >= starEnd) {
    return 100;
  }

  if (value <= starStart) {
    return 0;
  }

  return Math.round((value - starStart) * 100);
}

function renderStars(stat: SpotlightRenderableStat) {
  const ratingValue = stat.numericValue;

  if (ratingValue === null) {
    return null;
  }

  return (
    <div
      className={styles.statRating}
      aria-label={`${stat.label}: ${stat.formattedValue}`}
      title={`${stat.label}: ${stat.formattedValue}`}
    >
      {Array.from({ length: stat.max }, (_, index) => {
        const fillPercent = getStarFillPercent(index, ratingValue);

        return (
          <span
            key={`${stat.id}-star-${index}`}
            className={styles.star}
            aria-hidden="true"
          >
            <span className={styles.starBase}>★</span>
            <span
              className={styles.starFill}
              style={{ width: `${fillPercent}%` }}
            >
              ★
            </span>
          </span>
        );
      })}
    </div>
  );
}

function TechnologySpotlightPanelComponent({
  item,
  className,
  emptyEyebrow = "Technology Spotlight",
  emptyTitle = "Selecione uma tecnologia para abrir o card técnico.",
  emptyText = "A coluna direita foi preparada para funcionar como um card técnico com imagem superior e atributos dinâmicos vindos do JSON da tecnologia.",
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

  const stats = normalizeRenderableStats(trunfoData?.stats ?? []);

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
                key={heroImageSrc}
                src={heroImageSrc}
                alt={heroImageAlt}
                className={styles.heroMedia}
                loading="lazy"
                decoding="async"
                draggable={false}
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

          <img
            src="/images/technologies/super.webp"
            alt=""
            aria-hidden="true"
            className={styles.heroCornerBadge}
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        </div>

        <div className={styles.boardArea}>
          {stats.length ? (
            <div className={styles.statsList}>
              {stats.map((stat) => (
                <div key={stat.id} className={styles.statRow}>
                  <span className={styles.statLabel}>{stat.label}</span>
                  {renderStars(stat)}
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
