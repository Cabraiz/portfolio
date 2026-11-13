// Baldes por ano da mini timeline (movido do LiveMiniTimeline).

import type {
	LiveProjectRecord,
	LiveProjectStatus,
} from "../../domain/live.types";

type TimelineYearBucket = Readonly<{
	year: number;
	projects: readonly LiveProjectRecord[];
	total: number;
	activeCount: number;
	monitoringCount: number;
	incubatingCount: number;
	deliveredCount: number;
	dominantStatus: LiveProjectStatus | null;
	featuredProjectId: string | null;
}>;

function getStatusColor(status: LiveProjectStatus): string {
	switch (status) {
		case "active":
			return "rgba(52, 211, 153, 0.96)";
		case "monitoring":
			return "rgba(96, 165, 250, 0.96)";
		case "incubating":
			return "rgba(251, 191, 36, 0.96)";
		case "delivered":
		default:
			return "rgba(167, 139, 250, 0.92)";
	}
}

function isProjectVisible(project: LiveProjectRecord): boolean {
	return project.visible !== false;
}

function isProjectOngoing(project: LiveProjectRecord): boolean {
	return (
		project.status === "active" ||
		project.status === "monitoring" ||
		project.status === "incubating"
	);
}

function getProjectRangeEndYear(
	project: LiveProjectRecord,
	currentYear: number
): number {
	if (
		typeof project.endYear === "number" &&
		project.endYear >= project.startYear
	) {
		return project.endYear;
	}

	return isProjectOngoing(project) ? currentYear : project.startYear;
}

function resolveDominantStatus(
	bucket: Omit<TimelineYearBucket, "dominantStatus" | "featuredProjectId">
): LiveProjectStatus | null {
	const pairs: Array<readonly [LiveProjectStatus, number]> = [
		["active", bucket.activeCount],
		["monitoring", bucket.monitoringCount],
		["incubating", bucket.incubatingCount],
		["delivered", bucket.deliveredCount],
	];

	const winner = pairs.sort((left, right) => right[1] - left[1])[0];

	return winner && winner[1] > 0 ? winner[0] : null;
}

function buildTimelineBuckets(
	projects: readonly LiveProjectRecord[],
	currentYear: number,
	maxVisibleYears: number
): readonly TimelineYearBucket[] {
	const yearMap = new Map<number, LiveProjectRecord[]>();

	projects.filter(isProjectVisible).forEach((project) => {
		const startYear = project.startYear;
		const endYear = getProjectRangeEndYear(project, currentYear);

		for (let year = startYear; year <= endYear; year += 1) {
			const current = yearMap.get(year) ?? [];
			current.push(project);
			yearMap.set(year, current);
		}
	});

	const years = Array.from(yearMap.keys()).sort((left, right) => left - right);
	const trimmedYears =
		maxVisibleYears > 0
			? years.slice(Math.max(0, years.length - maxVisibleYears))
			: years;

	return trimmedYears.map((year) => {
		const bucketProjects = [...(yearMap.get(year) ?? [])].sort(
			(left, right) => {
				const featuredDiff =
					Number(Boolean(right.featured)) - Number(Boolean(left.featured));

				if (featuredDiff !== 0) {
					return featuredDiff;
				}

				if (left.status !== right.status) {
					const leftWeight =
						left.status === "active"
							? 4
							: left.status === "monitoring"
								? 3
								: left.status === "incubating"
									? 2
									: 1;

					const rightWeight =
						right.status === "active"
							? 4
							: right.status === "monitoring"
								? 3
								: right.status === "incubating"
									? 2
									: 1;

					return rightWeight - leftWeight;
				}

				return right.startYear - left.startYear;
			}
		);

		const partial = {
			year,
			projects: bucketProjects,
			total: bucketProjects.length,
			activeCount: bucketProjects.filter(
				(project) => project.status === "active"
			).length,
			monitoringCount: bucketProjects.filter(
				(project) => project.status === "monitoring"
			).length,
			incubatingCount: bucketProjects.filter(
				(project) => project.status === "incubating"
			).length,
			deliveredCount: bucketProjects.filter(
				(project) => project.status === "delivered"
			).length,
		};

		return {
			...partial,
			dominantStatus: resolveDominantStatus(partial),
			featuredProjectId:
				bucketProjects.find((project) => project.featured)?.id ??
				bucketProjects[0]?.id ??
				null,
		};
	});
}

export { buildTimelineBuckets, getStatusColor };
export type { TimelineYearBucket };
