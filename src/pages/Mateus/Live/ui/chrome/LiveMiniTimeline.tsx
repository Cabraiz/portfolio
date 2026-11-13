// src/pages/Mateus/Live/ui/chrome/LiveMiniTimeline.tsx

import { useMemo, type CSSProperties } from "react";

import { useLiveMetrics } from "../../application/useLiveMetrics";
import type { LiveProjectRecord } from "../../domain/live.types";

import { LiveMiniTimelineBucket } from "./LiveMiniTimeline.bucket";
import { buildTimelineBuckets } from "./LiveMiniTimeline.timeline";

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

function joinClassNames(
	...classNames: Array<string | false | null | undefined>
): string {
	return classNames.filter(Boolean).join(" ");
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
					{buckets.map((bucket) => (
						<LiveMiniTimelineBucket
							key={bucket.year}
							bucket={bucket}
							selectedBucketYear={selectedBucketYear}
							currentYear={currentYear}
							onProjectSelect={onProjectSelect}
							compact={compact}
							accentColor={accentColor}
							showProjectNames={showProjectNames}
							selectedProjectId={selectedProjectId}
						/>
					))}
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
