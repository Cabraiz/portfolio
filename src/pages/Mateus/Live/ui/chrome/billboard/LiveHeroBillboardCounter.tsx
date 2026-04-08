// src/pages/Mateus/Live/ui/chrome/billboard/LiveHeroBillboardCounter.tsx

import type {
  DigitSlotCssVariables,
  LiveHeroBillboardCounterProps,
} from "./LiveHeroBillboard.types";

export default function LiveHeroBillboardCounter({
  lane,
  digits,
  classNames,
}: LiveHeroBillboardCounterProps) {
  return (
    <div
      className={classNames.counter}
      aria-live="polite"
      aria-atomic="true"
      aria-label={lane.ariaLabel}
      data-live-hero-counter="true"
    >
      {digits.map((digit, index) => (
        <span
          className={classNames.digitSlot}
          data-live-hero-digit-slot="true"
          key={`${lane.id}-${index}-${digit}`}
          style={
            {
              "--digit-flicker-delay": `${index * 0.16}s`,
            } as DigitSlotCssVariables
          }
        >
          <span
            className={classNames.digitGlyph}
            data-live-hero-digit-glyph="true"
            data-text={digit}
            aria-hidden="true"
          >
            {digit}
          </span>
        </span>
      ))}
    </div>
  );
}
