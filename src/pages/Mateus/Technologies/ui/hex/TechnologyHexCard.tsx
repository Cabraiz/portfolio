import React, { memo, useEffect, useMemo, useState } from "react";
import type { TechnologyCatalogItem } from "../../Technologies";

import TechnologyHexBadge, {
  type TechnologyBadgeTone,
} from "./TechnologyHexBadge";
import styles from "./TechnologyHexCard.module.css";

function joinClasses(
  ...classes: Array<string | undefined | null | false>
): string {
  return classes.filter(Boolean).join(" ");
}

export type TechnologyRelatedIcon = Readonly<{
  id: string;
  name: string;
  src?: string;
}>;

export type TechnologyHexCardItem = Readonly<{
  id: string;
  name: string;
  description: string;
  years?: number | null;
  categoryLabel: string;
  levelLabel?: string;
  logoSrc?: string;
  iconSrc?: string;
  tone?: TechnologyBadgeTone;
  accentRgb?: string;
  badges?: readonly string[];
  relatedIcons?: readonly TechnologyRelatedIcon[];
}>;

type TechnologyHexCardProps = Readonly<{
  item: TechnologyCatalogItem;
  isActive?: boolean;
  disabled?: boolean;
  className?: string;
  onSelect?: (item: TechnologyCatalogItem) => void;
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

function resolveItemVisualSrc(item: TechnologyCatalogItem): string | undefined {
  if ("logoSrc" in item && typeof item.logoSrc === "string" && item.logoSrc) {
    return item.logoSrc;
  }

  if ("iconSrc" in item && typeof item.iconSrc === "string" && item.iconSrc) {
    return item.iconSrc;
  }

  return undefined;
}

function TechnologyHexCardComponent({
  item,
  isActive = false,
  disabled = false,
  className,
  onSelect,
}: TechnologyHexCardProps) {
  const cssVars = {
    "--technology-accent-rgb": item.accentRgb ?? "212, 175, 55",
  } as React.CSSProperties;

  const relatedIcons = item.relatedIcons?.slice(0, 4) ?? [];
  const metaBadges = item.badges?.slice(0, 3) ?? [];

  const visualSrc = useMemo(() => resolveItemVisualSrc(item), [item]);
  const [hasVisualError, setHasVisualError] = useState(false);

  useEffect(() => {
    setHasVisualError(false);
  }, [visualSrc, item.id]);

  const shouldShowImage = Boolean(visualSrc) && !hasVisualError;

  const handleClick = (): void => {
    if (disabled) {
      return;
    }

    onSelect?.(item);
  };

  const handleVisualError = (): void => {
    setHasVisualError(true);
  };

  return (
    <article
      className={joinClasses(
        styles.card,
        isActive && styles.cardActive,
        className,
      )}
      style={cssVars}
      data-technology-card="true"
      data-technology-id={item.id}
      data-technology-active={isActive ? "true" : "false"}
    >
      <button
        type="button"
        className={joinClasses(styles.button, isActive && styles.buttonActive)}
        onClick={handleClick}
        disabled={disabled}
        aria-pressed={isActive}
        aria-label={`Abrir detalhes da tecnologia ${item.name}`}
      >
        <div className={styles.inner}>
          <header className={styles.header}>
            <div className={styles.headerBadges}>
              <TechnologyHexBadge
                label={item.categoryLabel}
                tone={item.tone ?? "neutral"}
              />
            </div>

            <div className={styles.headerSide} />
          </header>

          <div className={styles.visual} aria-hidden="true">
            <div className={styles.visualHalo} />
            <div className={styles.visualCore}>
              {shouldShowImage ? (
                <img
                  src={visualSrc}
                  alt=""
                  className={styles.visualMedia}
                  loading="lazy"
                  decoding="async"
                  onError={handleVisualError}
                />
              ) : (
                <span className={styles.visualFallback}>
                  {getInitials(item.name)}
                </span>
              )}
            </div>
          </div>

          <div className={styles.content}>
            <div className={styles.titleWrap}>
              <h3 className={styles.title}>{item.name}</h3>
              <p className={styles.description}>{item.description}</p>
            </div>

            {metaBadges.length > 0 ? (
              <div className={styles.metaList}>
                {metaBadges.map((badge) => (
                  <span key={badge} className={styles.metaItem}>
                    {badge}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <footer className={styles.footer}>
            {relatedIcons.length > 0 ? (
              <div className={styles.relatedList} aria-hidden="true">
                {relatedIcons.map((icon) => (
                  <span
                    key={icon.id}
                    className={styles.relatedItem}
                    title={icon.name}
                  >
                    {icon.src ? (
                      <img
                        src={icon.src}
                        alt=""
                        className={styles.relatedIcon}
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <span className={styles.relatedFallback}>
                        {getInitials(icon.name).slice(0, 1)}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            ) : (
              <span className={styles.relatedSummary}>
                Ecossistema visual disponível no spotlight.
              </span>
            )}

            <span className={styles.cta}>
              {isActive ? "Selecionado" : "Explorar"}
            </span>
          </footer>
        </div>
      </button>
    </article>
  );
}

const TechnologyHexCard = memo(TechnologyHexCardComponent);
TechnologyHexCard.displayName = "TechnologyHexCard";

export default TechnologyHexCard;
