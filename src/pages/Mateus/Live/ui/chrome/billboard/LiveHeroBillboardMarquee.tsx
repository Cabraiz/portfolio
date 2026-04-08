// src/pages/Mateus/Live/ui/chrome/billboard/LiveHeroBillboardMarquee.tsx

import { useMemo } from "react";

import type { LiveHeroBillboardMarqueeProps } from "./LiveHeroBillboard.types";

export default function LiveHeroBillboardMarquee({
  lane,
  copyCount = 4,
  classNames,
}: LiveHeroBillboardMarqueeProps) {
  const marqueeCopies = useMemo(
    () => Array.from({ length: Math.max(1, copyCount) }),
    [copyCount],
  );

  return (
    <header
      className={classNames.header}
      aria-hidden="true"
      data-live-hero-header="true"
    >
      <div
        className={classNames.marqueeViewport}
        data-live-hero-marquee-viewport="true"
      >
        <div
          className={classNames.marqueeTrack}
          data-live-hero-marquee-track="true"
        >
          {marqueeCopies.map((_, copyIndex) => (
            <span
              className={classNames.marqueeWord}
              data-live-hero-marquee-word="true"
              data-text={lane.eyebrow}
              key={`${lane.id}-marquee-${copyIndex}`}
            >
              {lane.eyebrow}
            </span>
          ))}
        </div>
      </div>
    </header>
  );
}
