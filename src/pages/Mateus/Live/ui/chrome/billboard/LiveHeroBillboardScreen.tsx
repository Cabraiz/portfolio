// src/pages/Mateus/Live/ui/chrome/billboard/LiveHeroBillboardScreen.tsx

import { Children, type ReactNode } from "react";

import type {
  BillboardCssVariables,
  LiveHeroLane,
} from "./LiveHeroBillboard.types";

type LiveHeroBillboardScreenClassNames = Readonly<{
  root: string;
  compact: string;
  screen: string;
  board: string;
  hiddenLabel: string;
}>;

export type LiveHeroBillboardScreenProps = Readonly<{
  className?: string;
  compact?: boolean;
  isRunning?: boolean;
  style?: BillboardCssVariables;
  lane: Pick<LiveHeroLane, "label" | "ariaLabel" | "tone">;
  classNames: LiveHeroBillboardScreenClassNames;
  children: ReactNode;
}>;

function joinClassNames(
  ...classNames: Array<string | false | null | undefined>
): string {
  return classNames.filter(Boolean).join(" ");
}

export default function LiveHeroBillboardScreen({
  className,
  compact = false,
  isRunning = false,
  style,
  lane,
  classNames,
  children,
}: LiveHeroBillboardScreenProps) {
  const childArray = Children.toArray(children);

  const hasDedicatedHeader = childArray.length > 1;
  const headerChild = hasDedicatedHeader ? childArray[0] : null;
  const counterChildren = hasDedicatedHeader ? childArray.slice(1) : childArray;

  return (
    <aside
      className={joinClassNames(
        classNames.root,
        compact && classNames.compact,
        className,
      )}
      style={style}
      aria-label="Painel ao vivo de projetos em andamento"
      data-running={isRunning ? "true" : "false"}
      data-live-hero-root="true"
      data-live-hero-compact={compact ? "true" : "false"}
    >
      <div
        className={classNames.screen}
        data-live-hero-screen="true"
        data-live-hero-screen-shell="true"
      >
        <span
          aria-hidden="true"
          data-live-hero-glass-layer="true"
        />

        <span
          aria-hidden="true"
          data-live-hero-glass-reflection="true"
        />

        <span
          aria-hidden="true"
          data-live-hero-glass-noise="true"
        />

        <article
          className={classNames.board}
          data-live-hero-board="true"
          data-tone={lane.tone}
          aria-label={lane.ariaLabel}
        >
          <span className={classNames.hiddenLabel}>{lane.label}</span>

          {headerChild ? (
            <div
              data-live-hero-marquee-rail="true"
              data-live-hero-board-slot="marquee"
            >
              {headerChild}
            </div>
          ) : null}

          {headerChild && counterChildren.length > 0 ? (
            <div
              aria-hidden="true"
              data-live-hero-board-separator="true"
            />
          ) : null}

          {counterChildren.length > 0 ? (
            <div
              data-live-hero-counter-dock="true"
              data-live-hero-board-slot="counter"
            >
              {counterChildren}
            </div>
          ) : null}
        </article>
      </div>
    </aside>
  );
}
