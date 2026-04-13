// src/pages/Mateus/Technologies/data/technologies.trunfo.registry.ts

import type { TechnologyTrunfoEntry } from "../domain/technologies.types";

export type TechnologyTrunfoCategoryRegistry = Readonly<
	Record<string, TechnologyTrunfoEntry>
>;

export const TECHNOLOGIES_TRUNFO_REGISTRY: TechnologyTrunfoCategoryRegistry =
	{};

export function resolveTechnologyTrunfoByTechnologyId(
	technologyId: string | null | undefined
): TechnologyTrunfoEntry | null {
	if (!technologyId) {
		return null;
	}

	return TECHNOLOGIES_TRUNFO_REGISTRY[technologyId] ?? null;
}
