// src/pages/Mateus/Live/ui/chrome/billboard/LiveHeroBillboardMarquee.tsx

import { useMemo } from "react";

import type { LiveHeroBillboardMarqueeProps } from "./LiveHeroBillboard.types";

export default function LiveHeroBillboardMarquee({
  lane,
  copyCount = 4,
  classNames,
}: LiveHeroBillboardMarqueeProps) {
  const eyebrow = lane.eyebrow.trim();

  const sequenceCopies = useMemo(
    () => Array.from({ length: Math.max(2, copyCount) }),
    [copyCount],
  );

  const renderSequence = (sequenceId: string) =>
    sequenceCopies.map((_, copyIndex) => (
      <span
        key={`${lane.id}-marquee-${sequenceId}-${copyIndex}`}
        className={classNames.marqueeWord}
        data-live-hero-marquee-word="true"
        data-text={eyebrow}
      >
        {eyebrow}
      </span>
    ));

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
          <div data-live-hero-marquee-sequence="true">
            {renderSequence("a")}
          </div>

          <div
            data-live-hero-marquee-sequence="true"
            aria-hidden="true"
          >
            {renderSequence("b")}
          </div>
        </div>
      </div>
    </header>
  );
}
