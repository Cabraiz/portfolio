// src/pages/Mateus/Live/ui/chrome/billboard/LiveHeroBillboardScreen.tsx

import type { ReactNode } from "react";

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
      >
        <article
          className={classNames.board}
          data-live-hero-board="true"
          data-tone={lane.tone}
          aria-label={lane.ariaLabel}
        >
          <span className={classNames.hiddenLabel}>{lane.label}</span>
          {children}
        </article>
      </div>
    </aside>
  );
}
