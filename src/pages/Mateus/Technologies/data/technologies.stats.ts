import rawTechnologyStats from "./technologies.stats.json";
import type { TechnologyStarsStat } from "../domain/technologies.types";

export type TechnologyStarsStatsMap = Readonly<
  Record<string, readonly TechnologyStarsStat[]>
>;

type RawTechnologyStatRecord = Readonly<{
  id?: unknown;
  nome?: unknown;
  aliases?: unknown;
  projetos?: unknown;
  arquiteturas?: unknown;
  iaAplicada?: unknown;
}>;

type RawTechnologyStatsFile = Readonly<{
  tecnologias?: unknown;
}>;

const DEFAULT_MAX_STARS = 5;

const STAT_LABELS: Record<TechnologyStarsStat["id"], string> = {
  projetos: "Projetos",
  arquiteturas: "Arquiteturas",
  iaAplicada: "IA aplicada",
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeLookupKey(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function toFiniteNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value.replace(",", ".").trim());

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function buildStat(
  id: TechnologyStarsStat["id"],
  rawValue: unknown,
): TechnologyStarsStat {
  const value = clamp(
    Number(toFiniteNumber(rawValue, 0).toFixed(1)),
    0,
    DEFAULT_MAX_STARS,
  );

  return {
    id,
    label: STAT_LABELS[id],
    value,
    max: DEFAULT_MAX_STARS,
  };
}

function isRawTechnologyStatRecord(
  value: unknown,
): value is RawTechnologyStatRecord {
  return Boolean(value) && typeof value === "object";
}

function extractTechnologyRecords(
  rawFile: RawTechnologyStatsFile,
): readonly RawTechnologyStatRecord[] {
  if (!rawFile || typeof rawFile !== "object") {
    return [];
  }

  if (!Array.isArray(rawFile.tecnologias)) {
    return [];
  }

  return rawFile.tecnologias.filter(isRawTechnologyStatRecord);
}

function normalizeStringArray(value: unknown): readonly string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isNonEmptyString).map((item) => item.trim());
}

function buildCandidateKeys(value: string): readonly string[] {
  const normalized = normalizeLookupKey(value);
  const compact = normalized.replace(/\s+/g, "");
  const withoutDots = normalized.replace(/\./g, "");
  const compactWithoutDots = compact.replace(/\./g, "");
  const withoutHyphen = normalized.replace(/-/g, " ");
  const compactWithoutHyphen = normalized.replace(/[\s-]+/g, "");
  const slugLike = normalized.replace(/[\s./]+/g, "-");

  return Array.from(
    new Set([
      normalized,
      compact,
      withoutDots,
      compactWithoutDots,
      withoutHyphen,
      compactWithoutHyphen,
      slugLike,
    ].filter(Boolean)),
  );
}

function getRecordLookupSources(
  record: RawTechnologyStatRecord,
): readonly string[] {
  const sources: string[] = [];

  if (isNonEmptyString(record.id)) {
    sources.push(record.id);
  }

  if (isNonEmptyString(record.nome)) {
    sources.push(record.nome);
  }

  for (const alias of normalizeStringArray(record.aliases)) {
    sources.push(alias);
  }

  return Array.from(new Set(sources));
}

function normalizeTechnologyStatsMap(
  rawFile: RawTechnologyStatsFile,
): TechnologyStarsStatsMap {
  const records = extractTechnologyRecords(rawFile);
  const accumulator: Record<string, readonly TechnologyStarsStat[]> = {};

  for (const record of records) {
    const lookupSources = getRecordLookupSources(record);

    if (lookupSources.length === 0) {
      continue;
    }

    const stats: readonly TechnologyStarsStat[] = [
      buildStat("projetos", record.projetos),
      buildStat("arquiteturas", record.arquiteturas),
      buildStat("iaAplicada", record.iaAplicada),
    ];

    for (const source of lookupSources) {
      for (const key of buildCandidateKeys(source)) {
        accumulator[key] = stats;
      }
    }
  }

  return Object.freeze(accumulator);
}

export const TECHNOLOGY_STARS_STATS: TechnologyStarsStatsMap =
  normalizeTechnologyStatsMap(rawTechnologyStats as RawTechnologyStatsFile);

export function getTechnologyStarsStats(
  technologyName: string | null | undefined,
): readonly TechnologyStarsStat[] {
  if (!isNonEmptyString(technologyName)) {
    return [];
  }

  const candidates = buildCandidateKeys(technologyName);

  for (const candidate of candidates) {
    const stats = TECHNOLOGY_STARS_STATS[candidate];

    if (stats?.length) {
      return stats;
    }
  }

  return [];
}

export function getTechnologyStarsStatsByCandidates(
  candidates: readonly (string | null | undefined)[],
): readonly TechnologyStarsStat[] {
  for (const candidate of candidates) {
    const stats = getTechnologyStarsStats(candidate);

    if (stats.length > 0) {
      return stats;
    }
  }

  return [];
}

export function hasTechnologyStarsStats(
  technologyName: string | null | undefined,
): boolean {
  return getTechnologyStarsStats(technologyName).length > 0;
}

export function getTechnologyStarsAverage(
  technologyName: string | null | undefined,
): number | null {
  const stats = getTechnologyStarsStats(technologyName);

  if (stats.length === 0) {
    return null;
  }

  const total = stats.reduce((sum, stat) => sum + stat.value, 0);
  return Number((total / stats.length).toFixed(1));
}

export default TECHNOLOGY_STARS_STATS;
