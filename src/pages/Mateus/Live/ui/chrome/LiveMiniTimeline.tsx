// src/pages/Mateus/Live/ui/chrome/LiveMiniTimeline.tsx

import { useMemo, type CSSProperties, type JSX } from "react";

import { useLiveMetrics } from "../../application/useLiveMetrics";
import { LIVE_PROJECT_STATUS_LABELS } from "../../domain/live.constants";
import type {
	LiveProjectRecord,
	LiveProjectStatus,
} from "../../domain/live.types";

export type LiveMiniTimelineProps = Readonly<{
	className?: string;
	title?: string;
	description?: string;

	projects?: readonly LiveProjectRecord[];
	selectedProjectId?: string | null;
	onProjectSelect?: (projectId: string | null) => void;

	compact?: boolean;
	maxVisibleYears?: number;
	showProjectNames?: boolean;

	accentColor?: string;
}>;

type TimelineCssVariables = CSSProperties & {
	"--live-timeline-accent"?: string;
};

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

function joinClassNames(
	...classNames: Array<string | false | null | undefined>
): string {
	return classNames.filter(Boolean).join(" ");
}

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

function renderSegment(
	label: string,
	count: number,
	color: string
): JSX.Element {
	return (
		<div
			key={label}
			title={`${label}: ${count}`}
			aria-label={`${label}: ${count}`}
			style={{
				position: "relative",
				flex: Math.max(count, 0.25),
				minWidth: count > 0 ? "8px" : "4px",
				height: "100%",
				borderRadius: "999px",
				background: count > 0 ? color : "rgba(255,255,255,0.06)",
				boxShadow: count > 0 ? `0 0 14px ${color}30` : "none",
			}}
		/>
	);
}

export default function LiveMiniTimeline({
	className,
	title = "Linha de evolução",
	description = "Recorte compacto do histórico recente, com leitura rápida por ano e estado operacional.",
	projects,
	selectedProjectId = null,
	onProjectSelect,
	compact = false,
	maxVisibleYears = 8,
	showProjectNames = true,
	accentColor = "rgba(96, 165, 250, 0.9)",
}: LiveMiniTimelineProps) {
	const metrics = useLiveMetrics();

	const resolvedProjects = projects ?? metrics.projects;
	const currentYear = new Date().getFullYear();

	const buckets = useMemo(
		() => buildTimelineBuckets(resolvedProjects, currentYear, maxVisibleYears),
		[currentYear, maxVisibleYears, resolvedProjects]
	);

	const selectedBucketYear = useMemo(() => {
		if (!selectedProjectId) {
			return null;
		}

		return (
			buckets.find((bucket) =>
				bucket.projects.some((project) => project.id === selectedProjectId)
			)?.year ?? null
		);
	}, [buckets, selectedProjectId]);

	const startYear = buckets[0]?.year ?? currentYear;
	const endYear = buckets[buckets.length - 1]?.year ?? currentYear;
	const totalSignals = buckets.reduce((sum, bucket) => sum + bucket.total, 0);

	const style = useMemo<TimelineCssVariables>(() => {
		return {
			"--live-timeline-accent": accentColor,
			position: "relative",
			display: "grid",
			gap: compact ? "14px" : "18px",
			width: "100%",
			padding: compact ? "16px" : "20px",
			borderRadius: "24px",
			border: "1px solid rgba(255,255,255,0.08)",
			background:
				"linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.012)), rgba(8, 12, 18, 0.84)",
			boxShadow: "0 16px 42px rgba(0,0,0,0.2)",
			overflow: "hidden",
			isolation: "isolate",
		};
	}, [accentColor, compact]);

	return (
		<aside
			className={joinClassNames(className)}
			style={style}
			aria-label="Mini timeline da seção ao vivo"
		>
			<div
				aria-hidden="true"
				style={{
					position: "absolute",
					inset: "0 auto auto 0",
					width: "220px",
					height: "220px",
					background: `radial-gradient(circle, ${accentColor}1f 0%, transparent 72%)`,
					pointerEvents: "none",
				}}
			/>

			<header
				style={{
					position: "relative",
					zIndex: 1,
					display: "grid",
					gap: "8px",
				}}
			>
				<span
					style={{
						fontSize: "0.64rem",
						fontWeight: 800,
						letterSpacing: "0.18em",
						textTransform: "uppercase",
						color: "rgba(255,255,255,0.5)",
					}}
				>
					timeline
				</span>

				<div
					style={{
						display: "flex",
						flexWrap: "wrap",
						alignItems: "center",
						justifyContent: "space-between",
						gap: "12px",
					}}
				>
					<div
						style={{
							display: "grid",
							gap: "6px",
						}}
					>
						<strong
							style={{
								fontSize: compact ? "0.98rem" : "1.06rem",
								lineHeight: 1.1,
								letterSpacing: "-0.03em",
								color: "rgba(255,255,255,0.92)",
							}}
						>
							{title}
						</strong>

						<span
							style={{
								maxWidth: "62ch",
								fontSize: compact ? "0.78rem" : "0.82rem",
								lineHeight: 1.55,
								color: "rgba(255,255,255,0.62)",
							}}
						>
							{description}
						</span>
					</div>

					<div
						style={{
							display: "flex",
							flexWrap: "wrap",
							gap: "8px",
						}}
					>
						<span
							style={{
								padding: "8px 12px",
								borderRadius: "999px",
								border: "1px solid rgba(255,255,255,0.08)",
								background: "rgba(255,255,255,0.035)",
								fontSize: "0.72rem",
								fontWeight: 700,
								letterSpacing: "0.08em",
								textTransform: "uppercase",
								color: "rgba(255,255,255,0.7)",
							}}
						>
							{startYear}–{endYear}
						</span>

						<span
							style={{
								padding: "8px 12px",
								borderRadius: "999px",
								border: `1px solid ${accentColor}36`,
								background: `${accentColor}14`,
								fontSize: "0.72rem",
								fontWeight: 800,
								letterSpacing: "0.08em",
								textTransform: "uppercase",
								color: "rgba(255,255,255,0.84)",
							}}
						>
							{totalSignals} sinais
						</span>
					</div>
				</div>
			</header>

			<div
				style={{
					position: "relative",
					zIndex: 1,
					display: "grid",
					gap: "12px",
				}}
			>
				<div
					style={{
						display: "grid",
						gridTemplateColumns: `repeat(${Math.max(buckets.length, 1)}, minmax(${compact ? "112px" : "132px"}, 1fr))`,
						gap: compact ? "10px" : "12px",
						overflowX: "auto",
						paddingBottom: "2px",
					}}
				>
					{buckets.map((bucket) => {
						const isSelected = selectedBucketYear === bucket.year;
						const isCurrentYear = bucket.year === currentYear;
						const dominantColor = bucket.dominantStatus
							? getStatusColor(bucket.dominantStatus)
							: "rgba(255,255,255,0.24)";

						return (
							<button
								key={bucket.year}
								type="button"
								onClick={() => {
									if (!onProjectSelect) {
										return;
									}

									if (isSelected) {
										onProjectSelect(null);
										return;
									}

									onProjectSelect(bucket.featuredProjectId);
								}}
								disabled={!onProjectSelect || bucket.total === 0}
								aria-pressed={isSelected}
								aria-label={`Ano ${bucket.year}, ${bucket.total} projetos`}
								style={{
									appearance: "none",
									display: "grid",
									alignContent: "start",
									gap: "10px",
									minHeight: compact ? "148px" : "164px",
									padding: compact ? "12px" : "14px",
									borderRadius: "20px",
									textAlign: "left",
									border: isSelected
										? `1px solid ${dominantColor}`
										: "1px solid rgba(255,255,255,0.08)",
									background: isSelected
										? `linear-gradient(180deg, ${dominantColor}16, rgba(255,255,255,0.03)), rgba(9,13,18,0.8)`
										: "linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.01)), rgba(9,13,18,0.68)",
									boxShadow: isSelected
										? `0 14px 30px rgba(0,0,0,0.24), inset 0 0 0 1px ${dominantColor}18`
										: "0 10px 24px rgba(0,0,0,0.18)",
									color: "inherit",
									cursor: onProjectSelect ? "pointer" : "default",
									opacity: onProjectSelect || bucket.total > 0 ? 1 : 0.88,
								}}
							>
								<div
									style={{
										display: "flex",
										alignItems: "flex-start",
										justifyContent: "space-between",
										gap: "8px",
									}}
								>
									<div
										style={{
											display: "grid",
											gap: "6px",
										}}
									>
										<strong
											style={{
												fontSize: "0.98rem",
												lineHeight: 1,
												letterSpacing: "-0.03em",
												color: "rgba(255,255,255,0.94)",
											}}
										>
											{bucket.year}
										</strong>

										<span
											style={{
												fontSize: "0.72rem",
												lineHeight: 1.3,
												color: "rgba(255,255,255,0.58)",
											}}
										>
											{bucket.total}{" "}
											{bucket.total === 1 ? "projeto" : "projetos"}
										</span>
									</div>

									{isCurrentYear ? (
										<span
											style={{
												padding: "6px 8px",
												borderRadius: "999px",
												border: `1px solid ${accentColor}34`,
												background: `${accentColor}12`,
												fontSize: "0.64rem",
												fontWeight: 800,
												letterSpacing: "0.14em",
												textTransform: "uppercase",
												color: "rgba(255,255,255,0.74)",
											}}
										>
											hoje
										</span>
									) : null}
								</div>

								<div
									aria-hidden="true"
									style={{
										display: "flex",
										gap: "4px",
										height: "6px",
										width: "100%",
									}}
								>
									{renderSegment(
										"Ativos",
										bucket.activeCount,
										getStatusColor("active")
									)}
									{renderSegment(
										"Monitoramento",
										bucket.monitoringCount,
										getStatusColor("monitoring")
									)}
									{renderSegment(
										"Exploração",
										bucket.incubatingCount,
										getStatusColor("incubating")
									)}
									{renderSegment(
										"Concluídos",
										bucket.deliveredCount,
										getStatusColor("delivered")
									)}
								</div>

								<div
									style={{
										display: "grid",
										gap: "6px",
									}}
								>
									<span
										style={{
											fontSize: "0.64rem",
											fontWeight: 800,
											letterSpacing: "0.14em",
											textTransform: "uppercase",
											color: "rgba(255,255,255,0.48)",
										}}
									>
										estado dominante
									</span>

									<span
										style={{
											display: "inline-flex",
											alignItems: "center",
											gap: "8px",
											fontSize: "0.78rem",
											color: "rgba(255,255,255,0.8)",
										}}
									>
										<span
											aria-hidden="true"
											style={{
												width: "9px",
												height: "9px",
												borderRadius: "999px",
												background: dominantColor,
												boxShadow: `0 0 16px ${dominantColor}40`,
											}}
										/>

										{bucket.dominantStatus
											? LIVE_PROJECT_STATUS_LABELS[bucket.dominantStatus]
											: "Sem leitura"}
									</span>
								</div>

								{showProjectNames ? (
									<div
										style={{
											display: "grid",
											gap: "5px",
										}}
									>
										{bucket.projects
											.slice(0, compact ? 2 : 3)
											.map((project) => (
												<span
													key={`${bucket.year}-${project.id}`}
													style={{
														fontSize: "0.72rem",
														lineHeight: 1.35,
														color:
															project.id === selectedProjectId
																? "rgba(255,255,255,0.9)"
																: "rgba(255,255,255,0.58)",
														fontWeight:
															project.id === selectedProjectId ? 700 : 500,
													}}
												>
													{project.name}
												</span>
											))}
									</div>
								) : null}
							</button>
						);
					})}
				</div>
			</div>

			<footer
				style={{
					position: "relative",
					zIndex: 1,
					display: "flex",
					flexWrap: "wrap",
					gap: "10px",
				}}
			>
				<span
					style={{
						padding: "8px 12px",
						borderRadius: "999px",
						border: "1px solid rgba(255,255,255,0.08)",
						background: "rgba(255,255,255,0.025)",
						fontSize: "0.72rem",
						color: "rgba(255,255,255,0.62)",
					}}
				>
					Primeira leitura:{" "}
					<strong style={{ color: "rgba(255,255,255,0.86)" }}>
						{startYear}
					</strong>
				</span>

				<span
					style={{
						padding: "8px 12px",
						borderRadius: "999px",
						border: "1px solid rgba(255,255,255,0.08)",
						background: "rgba(255,255,255,0.025)",
						fontSize: "0.72rem",
						color: "rgba(255,255,255,0.62)",
					}}
				>
					Janela atual:{" "}
					<strong style={{ color: "rgba(255,255,255,0.86)" }}>{endYear}</strong>
				</span>

				{selectedBucketYear ? (
					<span
						style={{
							padding: "8px 12px",
							borderRadius: "999px",
							border: `1px solid ${accentColor}2c`,
							background: `${accentColor}10`,
							fontSize: "0.72rem",
							color: "rgba(255,255,255,0.7)",
						}}
					>
						Recorte ativo:{" "}
						<strong style={{ color: "rgba(255,255,255,0.9)" }}>
							{selectedBucketYear}
						</strong>
					</span>
				) : null}
			</footer>
		</aside>
	);
}
