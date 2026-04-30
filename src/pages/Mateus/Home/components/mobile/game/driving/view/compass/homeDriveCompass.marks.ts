// src/pages/Mateus/Home/components/mobile/game/driving/view/compass/homeDriveCompass.marks.ts

import {
  getHomeDriveCompassDistanceRatio,
  getHomeDriveCompassSignedDeltaDegrees,
  normalizeHomeDriveCompassDegrees,
  roundHomeDriveCompassNumber,
} from "./homeDriveCompass.math";
import {
  HOME_DRIVE_COMPASS_CARDINAL_LABELS,
  HOME_DRIVE_COMPASS_DEFAULT_CARDINAL_MODE,
  HOME_DRIVE_COMPASS_MARK_EMPHASIS,
  HOME_DRIVE_COMPASS_TOKENS,
  type HomeDriveCompassCardinalMode,
  type HomeDriveCompassMarkSize,
} from "./homeDriveCompass.tokens";

export type HomeDriveCompassMark = Readonly<{
  degrees: number;
  label?: string;
  size: HomeDriveCompassMarkSize;
  emphasis: number;
}>;

export type HomeDriveCompassVisibleMark = Readonly<
  HomeDriveCompassMark & {
    delta: number;
    x: number;
    opacity: number;
    distanceRatio: number;
  }
>;

export type HomeDriveCompassBuildMarksOptions = Readonly<{
  cardinalMode?: HomeDriveCompassCardinalMode;
  markIntervalDegrees?: number;
}>;

export type HomeDriveCompassVisibleMarksOptions = Readonly<{
  headingDegrees: number;
  marks?: readonly HomeDriveCompassMark[];
  visibleDegrees?: number;
  pixelsPerDegree?: number;
  minOpacity?: number;
  edgeOpacityFalloff?: number;
}>;

export function getHomeDriveCompassCardinalLabelMap(
  mode: HomeDriveCompassCardinalMode = HOME_DRIVE_COMPASS_DEFAULT_CARDINAL_MODE,
): ReadonlyMap<number, string> {
  const entries =
    HOME_DRIVE_COMPASS_CARDINAL_LABELS[mode] ??
    HOME_DRIVE_COMPASS_CARDINAL_LABELS[
      HOME_DRIVE_COMPASS_DEFAULT_CARDINAL_MODE
    ];

  return new Map(
    entries.map(([degrees, label]) => [
      normalizeHomeDriveCompassDegrees(degrees),
      label,
    ]),
  );
}

export function getHomeDriveCompassMarkSize(
  degrees: number,
  cardinalMode: HomeDriveCompassCardinalMode = HOME_DRIVE_COMPASS_DEFAULT_CARDINAL_MODE,
): HomeDriveCompassMarkSize {
  const normalizedDegrees = normalizeHomeDriveCompassDegrees(degrees);
  const cardinalLabels = getHomeDriveCompassCardinalLabelMap(cardinalMode);

  if (cardinalLabels.has(normalizedDegrees)) {
    return "major";
  }

  if (
    normalizedDegrees % HOME_DRIVE_COMPASS_TOKENS.mediumEveryDegrees ===
    0
  ) {
    return "medium";
  }

  return "minor";
}

export function buildHomeDriveCompassMarks(
  options: HomeDriveCompassBuildMarksOptions = {},
): readonly HomeDriveCompassMark[] {
  const {
    cardinalMode = HOME_DRIVE_COMPASS_DEFAULT_CARDINAL_MODE,
    markIntervalDegrees = HOME_DRIVE_COMPASS_TOKENS.markIntervalDegrees,
  } = options;

  const safeIntervalDegrees = Math.max(1, Math.abs(markIntervalDegrees));
  const markCount = Math.max(1, Math.floor(360 / safeIntervalDegrees));
  const cardinalLabels = getHomeDriveCompassCardinalLabelMap(cardinalMode);

  return Array.from({ length: markCount }, (_, index) => {
    const degrees = normalizeHomeDriveCompassDegrees(
      index * safeIntervalDegrees,
    );

    const size = getHomeDriveCompassMarkSize(degrees, cardinalMode);

    return {
      degrees,
      label: cardinalLabels.get(degrees),
      size,
      emphasis: HOME_DRIVE_COMPASS_MARK_EMPHASIS[size],
    };
  });
}

export function getHomeDriveCompassVisibleMarks({
  headingDegrees,
  marks = buildHomeDriveCompassMarks(),
  visibleDegrees = HOME_DRIVE_COMPASS_TOKENS.visibleDegrees,
  pixelsPerDegree = HOME_DRIVE_COMPASS_TOKENS.pixelsPerDegree,
  minOpacity = HOME_DRIVE_COMPASS_TOKENS.minMarkOpacity,
  edgeOpacityFalloff = HOME_DRIVE_COMPASS_TOKENS.edgeOpacityFalloff,
}: HomeDriveCompassVisibleMarksOptions): readonly HomeDriveCompassVisibleMark[] {
  const safeVisibleDegrees = Math.max(1, Math.abs(visibleDegrees));

  return marks
    .map((mark) => {
      const delta = getHomeDriveCompassSignedDeltaDegrees(
        mark.degrees,
        headingDegrees,
      );

      const distanceRatio = getHomeDriveCompassDistanceRatio(
        delta,
        safeVisibleDegrees,
      );

      const opacity = Math.max(
        minOpacity,
        1 - distanceRatio * edgeOpacityFalloff,
      );

      return {
        ...mark,
        delta: roundHomeDriveCompassNumber(delta),
        x: roundHomeDriveCompassNumber(delta * pixelsPerDegree),
        opacity: roundHomeDriveCompassNumber(opacity),
        distanceRatio: roundHomeDriveCompassNumber(distanceRatio),
      };
    })
    .filter((mark) => Math.abs(mark.delta) <= safeVisibleDegrees);
}

export function getHomeDriveCompassActiveDirectionLabel(
  headingDegrees: number,
  cardinalMode: HomeDriveCompassCardinalMode = HOME_DRIVE_COMPASS_DEFAULT_CARDINAL_MODE,
): string {
  const cardinalLabels = Array.from(
    getHomeDriveCompassCardinalLabelMap(cardinalMode).entries(),
  );

  const nearest = cardinalLabels.reduce(
    (selected, [degrees, label]) => {
      const distance = Math.abs(
        getHomeDriveCompassSignedDeltaDegrees(degrees, headingDegrees),
      );

      if (distance < selected.distance) {
        return {
          label,
          distance,
        };
      }

      return selected;
    },
    {
      label: cardinalLabels[0]?.[1] ?? "N",
      distance: Number.POSITIVE_INFINITY,
    },
  );

  return nearest.label;
}
