// src/pages/Mateus/Technologies/ui/hex/TechnologiesHexGrid.tsx

import { memo, useMemo, type CSSProperties } from "react";

import { getTechnologyCategoryPresentation } from "../../data/technologies.categories";
import {
  formatTechnologyYears,
  getTechnologyProficiencyTone,
} from "../../domain/technologies.helpers";
import {
  TECHNOLOGY_CATEGORY_ACCENTS,
  TECHNOLOGY_HEX_GRID_DESKTOP_TOKENS,
  TECHNOLOGY_HEX_GRID_MOBILE_TOKENS,
} from "../../domain/technologies.tokens";
import type {
  TechnologyCategoryId,
  TechnologyItem,
} from "../../domain/technologies.types";

type TechnologiesHexGridProps = Readonly<{
  items: readonly TechnologyItem[];
  className?: string;
  ariaLabel?: string;
  compact?: boolean;
  mobile?: boolean;
  activeTechnologyId?: string | null;
  hoveredTechnologyId?: string | null;
  onSelectTechnology?: (technologyId: string) => void;
  onHoverTechnology?: (technologyId: string | null) => void;
  onClearHover?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
}>;

type GridCssVariables = CSSProperties & {
  "--technologies-grid-columns"?: string;
  "--technologies-grid-gap-x"?: string;
  "--technologies-grid-gap-y"?: string;
  "--technologies-grid-item-height"?: string;
  "--technologies-grid-stagger-offset"?: string;
};

const HEX_CLIP_PATH =
  "polygon(25% 6.7%, 75% 6.7%, 100% 50%, 75% 93.3%, 25% 93.3%, 0% 50%)";

function getSafeYearsValue(item: TechnologyItem): number {
  return item.years ?? 0;
}

function getTechnologyInitials(item: TechnologyItem): string {
  const source = item.shortName?.trim() || item.name.trim();

  const words = source
    .split(/[\s/+-]+/)
    .map((value) => value.trim())
    .filter(Boolean);

  if (words.length === 0) {
    return "TK";
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase();
}

function getToneLabel(item: TechnologyItem): string {
  const tone = getTechnologyProficiencyTone(item.years);

  switch (tone) {
    case "flagship":
      return "Flagship";
    case "advanced":
      return "Advanced";
    case "strong":
      return "Strong";
    case "solid":
      return "Solid";
    case "growing":
    default:
      return "Growing";
  }
}

function getAccentCategoryId(item: TechnologyItem): TechnologyCategoryId {
  return item.accentCategoryId ?? item.categoryId;
}

function getCardOffset(
  index: number,
  columns: number,
  staggerOffsetY: number,
): number {
  if (columns <= 1 || staggerOffsetY <= 0) {
    return 0;
  }

  const columnIndex = index % columns;

  return columnIndex % 2 === 1 ? staggerOffsetY : 0;
}

function joinClassName(
  ...values: Array<string | undefined | null | false>
): string | undefined {
  const nextValue = values.filter(Boolean).join(" ").trim();

  return nextValue.length > 0 ? nextValue : undefined;
}

function TechnologiesHexGridComponent({
  items,
  className,
  ariaLabel = "Grade hexagonal de tecnologias",
  compact = false,
  mobile = false,
  activeTechnologyId = null,
  hoveredTechnologyId = null,
  onSelectTechnology,
  onHoverTechnology,
  onClearHover,
  emptyTitle = "Nenhuma tecnologia encontrada",
  emptyDescription = "Ajuste os filtros para exibir novamente a matriz de skills.",
}: TechnologiesHexGridProps) {
  const gridTokens = mobile
    ? TECHNOLOGY_HEX_GRID_MOBILE_TOKENS
    : TECHNOLOGY_HEX_GRID_DESKTOP_TOKENS;

  const resolvedHeight = compact
    ? Math.max(132, gridTokens.itemHeight - 20)
    : gridTokens.itemHeight;

  const resolvedGapX = compact
    ? Math.max(12, gridTokens.gapX - 4)
    : gridTokens.gapX;
  const resolvedGapY = compact
    ? Math.max(12, gridTokens.gapY - 4)
    : gridTokens.gapY;
  const resolvedStaggerOffset = compact
    ? Math.max(0, gridTokens.staggerOffsetY - 20)
    : gridTokens.staggerOffsetY;

  const gridStyle = useMemo<GridCssVariables>(
    () => ({
      "--technologies-grid-columns": String(gridTokens.columns),
      "--technologies-grid-gap-x": `${resolvedGapX}px`,
      "--technologies-grid-gap-y": `${resolvedGapY}px`,
      "--technologies-grid-item-height": `${resolvedHeight}px`,
      "--technologies-grid-stagger-offset": `${resolvedStaggerOffset}px`,
      display: "grid",
      gridTemplateColumns:
        gridTokens.columns <= 1
          ? "minmax(0, 1fr)"
          : `repeat(${gridTokens.columns}, minmax(${gridTokens.itemMinWidth}px, 1fr))`,
      gap: `${resolvedGapY}px ${resolvedGapX}px`,
      alignItems: "start",
      minWidth: 0,
      width: "100%",
    }),
    [
      gridTokens.columns,
      gridTokens.itemMinWidth,
      resolvedGapX,
      resolvedGapY,
      resolvedHeight,
      resolvedStaggerOffset,
    ],
  );

  if (items.length === 0) {
    return (
      <div
        className={className}
        role="status"
        aria-live="polite"
        style={{
          minHeight: mobile ? 240 : 360,
          width: "100%",
          display: "grid",
          placeItems: "center",
          padding: mobile ? 18 : 28,
          borderRadius: 28,
          border: "1px solid rgba(255, 255, 255, 0.08)",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.012)), linear-gradient(180deg, rgba(12,12,16,0.96), rgba(8,8,11,0.985))",
          textAlign: "center",
          boxShadow: "0 18px 44px rgba(0, 0, 0, 0.18)",
          overflow: "hidden",
          position: "relative",
          isolation: "isolate",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            width: mobile ? 180 : 260,
            aspectRatio: "1 / 1",
            clipPath: HEX_CLIP_PATH,
            border: "1px solid rgba(139, 92, 246, 0.18)",
            background:
              "radial-gradient(circle at center, rgba(139, 92, 246, 0.12), transparent 62%)",
            opacity: 0.72,
          }}
        />
        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "grid",
            gap: 10,
            maxWidth: 560,
          }}
        >
          <span
            style={{
              color: "rgba(255,255,255,0.56)",
              fontSize: "0.76rem",
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
            }}
          >
            Skill Matrix
          </span>
          <h3
            style={{
              margin: 0,
              color: "rgba(255,255,255,0.96)",
              fontSize: mobile ? "1.2rem" : "1.52rem",
              lineHeight: 1.08,
              fontWeight: 800,
              letterSpacing: "-0.03em",
            }}
          >
            {emptyTitle}
          </h3>
          <p
            style={{
              margin: 0,
              color: "rgba(255,255,255,0.74)",
              fontSize: "0.96rem",
              lineHeight: 1.68,
            }}
          >
            {emptyDescription}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={joinClassName(className)}
      style={{ minWidth: 0, width: "100%" }}
      data-technologies-hex-grid="true"
    >
      <div role="list" aria-label={ariaLabel} style={gridStyle}>
        {items.map((item, index) => {
          const category = getTechnologyCategoryPresentation(item.categoryId);
          const accentCategoryId = getAccentCategoryId(item);
          const accent = TECHNOLOGY_CATEGORY_ACCENTS[accentCategoryId];
          const isActive = activeTechnologyId === item.id;
          const isHovered = hoveredTechnologyId === item.id;
          const yearsLabel = formatTechnologyYears(
            item.years,
            "Tempo não informado",
          );
          const toneLabel = getToneLabel(item);
          const cardOffset = getCardOffset(
            index,
            gridTokens.columns,
            resolvedStaggerOffset,
          );
          const monogram = getTechnologyInitials(item);
          const safeYearsValue = getSafeYearsValue(item);
          const showLogo = Boolean(item.logoSrc);

          const wrapperStyle: CSSProperties = {
            minWidth: 0,
            width: "100%",
            marginTop: cardOffset,
          };

          const buttonStyle: CSSProperties = {
            position: "relative",
            width: "100%",
            minWidth: 0,
            minHeight: resolvedHeight,
            padding: mobile ? "16px 16px 18px" : "18px 18px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            textAlign: "left",
            color: accent.text,
            border:
              isActive || isHovered
                ? `1px solid ${accent.border}`
                : "1px solid rgba(255,255,255,0.07)",
            background: accent.background,
            boxShadow: isActive
              ? `0 26px 54px rgba(0, 0, 0, 0.28), ${accent.glow}`
              : isHovered
                ? `0 20px 46px rgba(0, 0, 0, 0.24), ${accent.glow}`
                : "0 14px 34px rgba(0, 0, 0, 0.16)",
            cursor: "pointer",
            transition:
              "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease, opacity 180ms ease",
            transform: isActive
              ? "translateY(-4px)"
              : isHovered
                ? "translateY(-2px)"
                : "translateY(0)",
            clipPath: HEX_CLIP_PATH,
            overflow: "hidden",
            isolation: "isolate",
            outline: "none",
            appearance: "none",
            WebkitTapHighlightColor: "transparent",
          };

          const glowStyle: CSSProperties = {
            position: "absolute",
            inset: 0,
            background: `
              radial-gradient(circle at 12% 12%, ${accent.backgroundSoft}, transparent 34%),
              linear-gradient(180deg, rgba(255,255,255,0.04), transparent 52%)
            `,
            pointerEvents: "none",
            opacity: isActive ? 1 : 0.86,
          };

          const topRowStyle: CSSProperties = {
            position: "relative",
            zIndex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            minWidth: 0,
          };

          const badgeStyle: CSSProperties = {
            display: "inline-flex",
            alignItems: "center",
            minHeight: 28,
            maxWidth: "100%",
            padding: "0 10px",
            borderRadius: 999,
            border: `1px solid ${accent.border}`,
            background: "rgba(255,255,255,0.04)",
            color: "rgba(255,255,255,0.82)",
            fontSize: "0.7rem",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          };

          const yearsStyle: CSSProperties = {
            color: "rgba(255,255,255,0.82)",
            fontSize: "0.76rem",
            fontWeight: 700,
            letterSpacing: "0.02em",
            whiteSpace: "nowrap",
          };

          const identityStyle: CSSProperties = {
            position: "relative",
            zIndex: 1,
            display: "grid",
            gridTemplateColumns: "auto minmax(0, 1fr)",
            gap: 12,
            alignItems: "center",
            minWidth: 0,
          };

          const logoShellStyle: CSSProperties = {
            position: "relative",
            width: mobile ? 44 : 48,
            height: mobile ? 44 : 48,
            display: "grid",
            placeItems: "center",
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.08)",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.025))",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
            overflow: "hidden",
          };

          const logoImageStyle: CSSProperties = {
            width: "70%",
            height: "70%",
            objectFit: "contain",
            objectPosition: "center",
            display: "block",
            opacity: 0.95,
          };

          const monogramStyle: CSSProperties = {
            color: "rgba(255,255,255,0.92)",
            fontSize: mobile ? "0.84rem" : "0.88rem",
            fontWeight: 800,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          };

          const titleWrapStyle: CSSProperties = {
            minWidth: 0,
            display: "grid",
            gap: 4,
          };

          const titleStyle: CSSProperties = {
            margin: 0,
            color: "rgba(255,255,255,0.96)",
            fontSize: mobile ? "1rem" : "1.06rem",
            lineHeight: 1.08,
            fontWeight: 800,
            letterSpacing: "-0.02em",
          };

          const subtitleStyle: CSSProperties = {
            margin: 0,
            color: "rgba(255,255,255,0.6)",
            fontSize: "0.8rem",
            lineHeight: 1.35,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          };

          const footerStyle: CSSProperties = {
            position: "relative",
            zIndex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            minWidth: 0,
            marginTop: "auto",
          };

          const tonePillStyle: CSSProperties = {
            display: "inline-flex",
            alignItems: "center",
            minHeight: 28,
            maxWidth: "100%",
            padding: "0 10px",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.04)",
            color: "rgba(255,255,255,0.82)",
            fontSize: "0.74rem",
            fontWeight: 700,
            letterSpacing: "0.02em",
          };

          const yearsBarTrackStyle: CSSProperties = {
            position: "relative",
            width: mobile ? 72 : 84,
            height: 6,
            borderRadius: 999,
            background: "rgba(255,255,255,0.1)",
            overflow: "hidden",
            flexShrink: 0,
          };

          const yearsBarFillStyle: CSSProperties = {
            position: "absolute",
            inset: 0,
            width: `${Math.min(100, Math.max(10, safeYearsValue * 10))}%`,
            borderRadius: 999,
            background: accent.accent,
            boxShadow: `0 0 18px ${accent.accent}`,
          };

          const srLabel = [
            item.name,
            yearsLabel,
            category.label,
            isActive ? "selecionada" : null,
          ]
            .filter(Boolean)
            .join(", ");

          return (
            <div key={item.id} role="listitem" style={wrapperStyle}>
              <button
                type="button"
                aria-pressed={isActive}
                aria-label={srLabel}
                data-active={isActive ? "true" : "false"}
                data-hovered={isHovered ? "true" : "false"}
                data-category={item.categoryId}
                onClick={() => onSelectTechnology?.(item.id)}
                onMouseEnter={() => onHoverTechnology?.(item.id)}
                onMouseLeave={() => {
                  onHoverTechnology?.(null);
                  onClearHover?.();
                }}
                onFocus={() => onHoverTechnology?.(item.id)}
                onBlur={() => {
                  onHoverTechnology?.(null);
                  onClearHover?.();
                }}
                style={buttonStyle}
              >
                <div aria-hidden="true" style={glowStyle} />

                <div style={topRowStyle}>
                  <span style={badgeStyle}>{category.panelBadge}</span>
                  <span style={yearsStyle}>{yearsLabel}</span>
                </div>

                <div style={identityStyle}>
                  <div style={logoShellStyle} aria-hidden="true">
                    {showLogo ? (
                      <div
                        style={{
                          ...logoImageStyle,
                          backgroundImage: `url("${item.logoSrc}")`,
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: "center",
                          backgroundSize: "contain",
                        }}
                      />
                    ) : (
                      <span style={monogramStyle}>{monogram}</span>
                    )}
                  </div>

                  <div style={titleWrapStyle}>
                    <h3 style={titleStyle}>{item.shortName || item.name}</h3>
                    <p style={subtitleStyle}>{item.label || item.name}</p>
                  </div>
                </div>

                <div style={footerStyle}>
                  <span style={tonePillStyle}>{toneLabel}</span>

                  <div style={yearsBarTrackStyle} aria-hidden="true">
                    <span style={yearsBarFillStyle} />
                  </div>
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const TechnologiesHexGrid = memo(TechnologiesHexGridComponent);

TechnologiesHexGrid.displayName = "TechnologiesHexGrid";

export default TechnologiesHexGrid;
