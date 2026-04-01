import { memo } from "react";

type TechnologyExperienceMeterProps = Readonly<{
	years?: number | null;
	label?: string;
	maxYears?: number;
	size?: "default" | "compact";
	className?: string;
}>;

function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

function resolveLabel(years?: number | null, explicitLabel?: string): string {
	if (explicitLabel) {
		return explicitLabel;
	}

	if (typeof years !== "number" || Number.isNaN(years) || years <= 0) {
		return "Experiência consolidada";
	}

	if (years >= 10) {
		return "Profundidade avançada";
	}

	if (years >= 6) {
		return "Atuação forte";
	}

	if (years >= 3) {
		return "Experiência consistente";
	}

	return "Base prática";
}

function formatYears(years?: number | null): string {
	if (typeof years !== "number" || Number.isNaN(years) || years <= 0) {
		return "Nível sólido";
	}

	if (years === 1) {
		return "1 ano";
	}

	return `${years} anos`;
}

function TechnologyExperienceMeterComponent({
	years,
	label,
	maxYears = 12,
	size = "default",
	className,
}: TechnologyExperienceMeterProps) {
	const resolvedYears =
		typeof years === "number" && Number.isFinite(years) ? years : null;

	const ratio =
		resolvedYears === null
			? 0.72
			: clamp(resolvedYears / Math.max(maxYears, 1), 0.08, 1);

	const barHeight = size === "compact" ? 10 : 12;
	const titleFontSize = size === "compact" ? "0.88rem" : "0.94rem";
	const bodyFontSize = size === "compact" ? "0.78rem" : "0.82rem";

	return (
		<div
			className={className}
			aria-label={`Indicador de experiência: ${formatYears(years)}`}
			style={{
				display: "grid",
				gap: size === "compact" ? 10 : 12,
			}}
		>
			<div
				style={{
					display: "grid",
					gap: 6,
				}}
			>
				<div
					style={{
						display: "flex",
						alignItems: "baseline",
						justifyContent: "space-between",
						gap: 12,
						flexWrap: "wrap",
					}}
				>
					<strong
						style={{
							color: "#fff8ea",
							fontSize: titleFontSize,
							lineHeight: 1.2,
							fontWeight: 700,
							letterSpacing: "-0.02em",
						}}
					>
						{formatYears(years)}
					</strong>

					<span
						style={{
							color: "rgba(255, 245, 230, 0.58)",
							fontSize: "0.72rem",
							lineHeight: 1,
							fontWeight: 700,
							letterSpacing: "0.08em",
							textTransform: "uppercase",
						}}
					>
						{resolveLabel(years, label)}
					</span>
				</div>

				<p
					style={{
						margin: 0,
						color: "rgba(255, 245, 230, 0.68)",
						fontSize: bodyFontSize,
						lineHeight: 1.6,
					}}
				>
					Intensidade visual baseada no tempo de prática e recorrência de uso na
					stack.
				</p>
			</div>

			<div
				aria-hidden="true"
				style={{
					position: "relative",
					width: "100%",
					height: barHeight,
					borderRadius: 999,
					overflow: "hidden",
					background:
						"linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.018))",
					boxShadow:
						"inset 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)",
				}}
			>
				<div
					style={{
						width: `${ratio * 100}%`,
						height: "100%",
						borderRadius: "inherit",
						background:
							"linear-gradient(90deg, rgba(212,175,55,0.98), rgba(255,215,120,0.92))",
						boxShadow:
							"0 0 0 1px rgba(255,255,255,0.08), 0 0 26px rgba(212,175,55,0.24)",
					}}
				/>
			</div>

			<div
				aria-hidden="true"
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
					gap: 8,
				}}
			>
				{["Base", "Consistência", "Amplitude", "Profundidade"].map((item) => (
					<span
						key={item}
						style={{
							color: "rgba(255, 245, 230, 0.48)",
							fontSize: "0.68rem",
							lineHeight: 1,
							fontWeight: 700,
							letterSpacing: "0.08em",
							textTransform: "uppercase",
						}}
					>
						{item}
					</span>
				))}
			</div>
		</div>
	);
}

const TechnologyExperienceMeter = memo(TechnologyExperienceMeterComponent);
TechnologyExperienceMeter.displayName = "TechnologyExperienceMeter";

export default TechnologyExperienceMeter;
