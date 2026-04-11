// src/pages/Mateus/Technologies/data/technologies.trunfo.registry.ts

import { TECHNOLOGIES_TRUNFO_BACKEND_APIS } from "./technologies.trunfo.backend-apis";
import { TECHNOLOGIES_TRUNFO_CLOUD_INFRASTRUCTURE } from "./technologies.trunfo.cloud-infrastructure";
import { TECHNOLOGIES_TRUNFO_DATASTORAGE_MESSAGING } from "./technologies.trunfo.datastorage-messaging";
import { TECHNOLOGIES_TRUNFO_FRONTEND_MOBILE } from "./technologies.trunfo.frontend-mobile";

export type TechnologyTrunfoCategoryKey =
  | "cloud-infrastructure"
  | "frontend-mobile"
  | "backend-apis"
  | "datastorage-messaging";

export type TechnologyTrunfoStat = Readonly<{
  id: string;
  label: string;
  value: string | number;
}>;

export type TechnologyTrunfoEntry = Readonly<{
  technologyId: string;
  name?: string;
  imageSrc?: string | null;
  imageAlt?: string;
  stats: readonly TechnologyTrunfoStat[];
}>;

export type TechnologyTrunfoCategoryRegistry = Readonly<
  Record<string, TechnologyTrunfoEntry>
>;

export const TECHNOLOGY_TRUNFO_CATEGORY_LABELS: Readonly<
  Record<TechnologyTrunfoCategoryKey, string>
> = {
  "cloud-infrastructure": "Cloud & Infrastructure",
  "frontend-mobile": "Frontend & Mobile",
  "backend-apis": "Backend & APIs",
  "datastorage-messaging": "DataStorage & Messaging",
};

export const TECHNOLOGY_TRUNFO_REGISTRY: Readonly<
  Record<TechnologyTrunfoCategoryKey, TechnologyTrunfoCategoryRegistry>
> = {
  "cloud-infrastructure": TECHNOLOGIES_TRUNFO_CLOUD_INFRASTRUCTURE,
  "frontend-mobile": TECHNOLOGIES_TRUNFO_FRONTEND_MOBILE,
  "backend-apis": TECHNOLOGIES_TRUNFO_BACKEND_APIS,
  "datastorage-messaging": TECHNOLOGIES_TRUNFO_DATASTORAGE_MESSAGING,
};

export const TECHNOLOGY_TRUNFO_ALL_BY_ID: Readonly<
  Record<string, TechnologyTrunfoEntry>
> = Object.freeze(
  Object.values(TECHNOLOGY_TRUNFO_REGISTRY).reduce<Record<string, TechnologyTrunfoEntry>>(
    (accumulator, categoryRegistry) => {
      for (const [technologyId, entry] of Object.entries(categoryRegistry)) {
        accumulator[technologyId] = entry;
      }

      return accumulator;
    },
    {},
  ),
);

export function resolveTechnologyTrunfoByTechnologyId(
  technologyId: string | null | undefined,
): TechnologyTrunfoEntry | null {
  if (!technologyId) {
    return null;
  }

  return TECHNOLOGY_TRUNFO_ALL_BY_ID[technologyId] ?? null;
}

export function resolveTechnologyTrunfoCategoryByTechnologyId(
  technologyId: string | null | undefined,
): TechnologyTrunfoCategoryKey | null {
  if (!technologyId) {
    return null;
  }

  for (const [categoryKey, registry] of Object.entries(
    TECHNOLOGY_TRUNFO_REGISTRY,
  ) as Array<[TechnologyTrunfoCategoryKey, TechnologyTrunfoCategoryRegistry]>) {
    if (technologyId in registry) {
      return categoryKey;
    }
  }

  return null;
}

export function getTechnologyTrunfoEntriesByCategory(
  categoryKey: TechnologyTrunfoCategoryKey,
): readonly TechnologyTrunfoEntry[] {
  return Object.values(TECHNOLOGY_TRUNFO_REGISTRY[categoryKey]);
}
