import React, { useMemo, type CSSProperties, type JSX } from "react";

import styles from "./HomeGameStage.module.css";
import {
  createHomeGameCollectibleId,
  resolveHomeGameOrbit,
} from "./homeGame.tokens";
import type {
  HomeGameCollectHandler,
  HomeGameCollectible,
  ResolvedHomeGameCollectible,
} from "./homeGame.types";

type CssVars = CSSProperties &
  Readonly<Record<`--${string}`, string | number | undefined>>;

export type HomeGameCollectiblesProps = Readonly<{
  items?: readonly HomeGameCollectible[];
  collectedIds?: readonly string[];
  onCollect: HomeGameCollectHandler;
  className?: string;
}>;

function buildTargetRel(
  target?: React.AnchorHTMLAttributes<HTMLAnchorElement>["target"],
  rel?: React.AnchorHTMLAttributes<HTMLAnchorElement>["rel"],
): string | undefined {
  if (rel) {
    return rel;
  }

  if (target === "_blank") {
    return "noreferrer noopener";
  }

  return undefined;
}

function GlyphCircle(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle
        cx="12"
        cy="12"
        r="6.25"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="12" r="2.2" fill="currentColor" opacity="0.94" />
    </svg>
  );
}

function GlyphDiamond(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 3.5L20.5 12 12 20.5 3.5 12 12 3.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M12 7.2L16.8 12 12 16.8 7.2 12 12 7.2Z" fill="currentColor" />
    </svg>
  );
}

function GlyphTriangle(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 4.2L20.1 18.2H3.9L12 4.2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12.8" r="2.15" fill="currentColor" />
    </svg>
  );
}

function getFallbackGlyph(index: number): JSX.Element {
  const glyphIndex = index % 3;

  if (glyphIndex === 0) {
    return <GlyphCircle />;
  }

  if (glyphIndex === 1) {
    return <GlyphDiamond />;
  }

  return <GlyphTriangle />;
}

export function createDefaultHomeGameCollectibles(): readonly HomeGameCollectible[] {
  return [
    {
      id: "contact-orbit-a",
      label: "Orbit A",
      ariaLabel: "Primeiro artefato",
      icon: <GlyphCircle />,
    },
    {
      id: "contact-orbit-b",
      label: "Orbit B",
      ariaLabel: "Segundo artefato",
      icon: <GlyphDiamond />,
    },
    {
      id: "contact-orbit-c",
      label: "Orbit C",
      ariaLabel: "Terceiro artefato",
      icon: <GlyphTriangle />,
    },
  ] as const;
}

export function resolveHomeGameCollectibles(
  items: readonly HomeGameCollectible[],
): readonly ResolvedHomeGameCollectible[] {
  const source = items.length > 0 ? items : createDefaultHomeGameCollectibles();

  return source.map((item, index) => {
    return {
      id: item.id ?? createHomeGameCollectibleId(index),
      label: item.label,
      ariaLabel: item.ariaLabel,
      icon: item.icon ?? getFallbackGlyph(index),
      href: item.href,
      target: item.target,
      rel: item.rel,
      orbit: resolveHomeGameOrbit(item.orbit, index),
    };
  });
}

export default function HomeGameCollectibles({
  items = [],
  collectedIds = [],
  onCollect,
  className,
}: HomeGameCollectiblesProps) {
  const resolvedItems = useMemo(() => {
    return resolveHomeGameCollectibles(items);
  }, [items]);

  const collectedSet = useMemo(() => {
    return new Set(collectedIds);
  }, [collectedIds]);

  return (
    <div
      className={[styles.collectiblesLayer, className].filter(Boolean).join(" ")}
    >
      {resolvedItems.map((item, index) => {
        const isCollected = collectedSet.has(item.id);

        const itemVars: CssVars = {
          "--item-x": `${item.orbit.x}%`,
          "--item-y": `${item.orbit.y}%`,
          "--item-scale": item.orbit.scale,
          "--item-delay": `${item.orbit.delayMs}ms`,
          "--item-duration": `${item.orbit.durationMs}ms`,
          "--item-index": index,
        };

        const collectibleClassName = [
          styles.collectible,
          isCollected ? styles.collectibleCollected : "",
        ]
          .filter(Boolean)
          .join(" ");

        const content = (
          <>
            <span className={styles.collectibleAura} />
            <span className={styles.collectibleCore}>
              <span className={styles.collectibleIcon}>{item.icon}</span>
            </span>
          </>
        );

        if (item.href) {
          return (
            <div
              key={item.id}
              className={collectibleClassName}
              style={itemVars}
            >
              <a
                href={item.href}
                target={item.target ?? "_blank"}
                rel={buildTargetRel(item.target, item.rel)}
                aria-label={item.ariaLabel ?? item.label}
                className={styles.collectibleAction}
                onPointerDown={(event) => onCollect(item, event)}
              >
                {content}
              </a>
            </div>
          );
        }

        return (
          <div key={item.id} className={collectibleClassName} style={itemVars}>
            <button
              type="button"
              aria-label={item.ariaLabel ?? item.label}
              className={styles.collectibleAction}
              onPointerDown={(event) => onCollect(item, event)}
            >
              {content}
            </button>
          </div>
        );
      })}
    </div>
  );
}
