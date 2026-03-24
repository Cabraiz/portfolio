import type { CSSProperties, ReactNode } from "react";

import type { LandingSectionId } from "@/features/navigation/landingSections";

export type LandingSectionViewportMode = "shared" | "desktop" | "mobile";

export type LandingSectionRenderStrategy =
  | "always-mounted"
  | "placeholder-when-far";

export type LandingSectionMeasurementStrategy = "none" | "resize-observer";

export type LandingSectionBehavior = Readonly<{
  /**
   * Define se a seção permanece montada sempre
   * ou se pode cair para placeholder quando estiver "far".
   */
  renderStrategy?: LandingSectionRenderStrategy;

  /**
   * Define se a altura deve ser medida automaticamente.
   */
  measurementStrategy?: LandingSectionMeasurementStrategy;

  /**
   * Mantém a última altura conhecida mesmo quando o conteúdo desmonta.
   */
  cacheMeasurements?: boolean;

  /**
   * Mantém o conteúdo real montado quando a seção está em estado "near".
   * Combina bem com a política atual active/near/far.
   */
  keepMountedWhenNear?: boolean;

  /**
   * Fallback usado quando ainda não existe medição real.
   */
  placeholderFallbackMinHeight?: CSSProperties["minHeight"];
}>;

export type ResolvedLandingSectionBehavior = Readonly<{
  renderStrategy: LandingSectionRenderStrategy;
  measurementStrategy: LandingSectionMeasurementStrategy;
  cacheMeasurements: boolean;
  keepMountedWhenNear: boolean;
  placeholderFallbackMinHeight: CSSProperties["minHeight"];
}>;

export type LandingSectionDefinition<
  SectionId extends string = LandingSectionId,
> = Readonly<{
  id: SectionId;
  content: ReactNode;
  viewportMode?: LandingSectionViewportMode;
  className?: string;
  placeholderMinHeight?: CSSProperties["minHeight"];
  sectionStyle?: CSSProperties;
  contentStyle?: CSSProperties;
  behavior?: LandingSectionBehavior;
}>;

export type LandingSectionMeasurement<
  SectionId extends string = string,
> = Readonly<{
  id: SectionId;
  height: number;
  updatedAt: number;
}>;

export type LandingSectionMeasurementsMap<
  SectionId extends string = string,
> = ReadonlyMap<SectionId, LandingSectionMeasurement<SectionId>>;

export const DEFAULT_LANDING_SECTION_BEHAVIOR: ResolvedLandingSectionBehavior = {
  renderStrategy: "placeholder-when-far",
  measurementStrategy: "resize-observer",
  cacheMeasurements: true,
  keepMountedWhenNear: true,
  placeholderFallbackMinHeight: "100dvh",
};

export function resolveLandingSectionBehavior(
  behavior?: LandingSectionBehavior,
): ResolvedLandingSectionBehavior {
  return {
    renderStrategy:
      behavior?.renderStrategy ??
      DEFAULT_LANDING_SECTION_BEHAVIOR.renderStrategy,
    measurementStrategy:
      behavior?.measurementStrategy ??
      DEFAULT_LANDING_SECTION_BEHAVIOR.measurementStrategy,
    cacheMeasurements:
      behavior?.cacheMeasurements ??
      DEFAULT_LANDING_SECTION_BEHAVIOR.cacheMeasurements,
    keepMountedWhenNear:
      behavior?.keepMountedWhenNear ??
      DEFAULT_LANDING_SECTION_BEHAVIOR.keepMountedWhenNear,
    placeholderFallbackMinHeight:
      behavior?.placeholderFallbackMinHeight ??
      DEFAULT_LANDING_SECTION_BEHAVIOR.placeholderFallbackMinHeight,
  };
}
