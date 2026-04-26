// src/pages/Mateus/Home/components/mobile/game/driving/HomeDrive/view/HomeDriveCompass.tsx

import { useMemo, type CSSProperties } from "react";

import styles from "./HomeDriveCompass.module.css";

export type HomeDriveCompassProps = Readonly<{
	headingRad: number;
	className?: string;
}>;

type CompassMark = Readonly<{
	degrees: number;
	label?: string;
	size: "minor" | "medium" | "major";
}>;

/**
 * Aqui eu deixei o compass mais "comprimido" para aparecer N/W/S/O
 * na mesma linha, em vez de mostrar só a direção próxima do centro.
 */
const COMPASS_VISIBLE_DEGREES = 186;
const COMPASS_PIXELS_PER_DEGREE = 1.08;

/**
 * Mantido exatamente como você pediu:
 * N W S O
 *
 * Observação:
 * - PT-BR geográfico seria N L S O.
 * - Inglês geográfico seria N E S W.
 */
const CARDINAL_LABELS = new Map<number, string>([
	[0, "N"],
	[90, "W"],
	[180, "S"],
	[270, "O"],
]);

function normalizeDegrees(degrees: number): number {
	return ((degrees % 360) + 360) % 360;
}

function radiansToDegrees(radians: number): number {
	return normalizeDegrees((radians * 180) / Math.PI);
}

function getSignedCircularDelta(
	targetDegrees: number,
	headingDegrees: number
): number {
	return ((targetDegrees - headingDegrees + 540) % 360) - 180;
}

function getMarkSize(degrees: number): CompassMark["size"] {
	if (CARDINAL_LABELS.has(degrees)) {
		return "major";
	}

	if (degrees % 45 === 0) {
		return "medium";
	}

	return "minor";
}

function buildCompassMarks(): readonly CompassMark[] {
	return Array.from({ length: 24 }, (_, index) => {
		const degrees = index * 15;

		return {
			degrees,
			label: CARDINAL_LABELS.get(degrees),
			size: getMarkSize(degrees),
		};
	});
}

function getActiveDirectionLabel(headingDegrees: number): string {
	const cardinals = Array.from(CARDINAL_LABELS.entries());

	const nearest = cardinals.reduce(
		(selected, [degrees, label]) => {
			const distance = Math.abs(
				getSignedCircularDelta(degrees, headingDegrees)
			);

			if (distance < selected.distance) {
				return { label, distance };
			}

			return selected;
		},
		{ label: "N", distance: Number.POSITIVE_INFINITY }
	);

	return nearest.label;
}

export default function HomeDriveCompass({
	headingRad,
	className,
}: HomeDriveCompassProps) {
	const headingDegrees = radiansToDegrees(headingRad);

	const marks = useMemo(() => {
		return buildCompassMarks();
	}, []);

	const visibleMarks = useMemo(() => {
		return marks
			.map((mark) => {
				const delta = getSignedCircularDelta(mark.degrees, headingDegrees);
				const distanceRatio = Math.abs(delta) / COMPASS_VISIBLE_DEGREES;

				return {
					...mark,
					delta,
					opacity: Math.max(0.18, 1 - distanceRatio * 0.72),
				};
			})
			.filter((mark) => Math.abs(mark.delta) <= COMPASS_VISIBLE_DEGREES);
	}, [headingDegrees, marks]);

	const activeDirectionLabel = getActiveDirectionLabel(headingDegrees);

	return (
		<div
			className={[styles.root, className].filter(Boolean).join(" ")}
			aria-label={`Bússola: direção ${activeDirectionLabel}`}
		>
			<div className={styles.frame}>
				<div className={styles.edgeFade} aria-hidden="true" />

				<div className={styles.rail} aria-hidden="true" />

				<div className={styles.markLayer} aria-hidden="true">
					{visibleMarks.map((mark) => {
						const markStyle = {
							"--free-drive-compass-x": `${
								mark.delta * COMPASS_PIXELS_PER_DEGREE
							}px`,
							"--free-drive-compass-opacity": mark.opacity.toFixed(3),
						} as CSSProperties;

						return (
							<span
								key={mark.degrees}
								className={[
									styles.mark,
									styles[`mark-${mark.size}`],
									mark.label ? styles.cardinal : "",
								]
									.filter(Boolean)
									.join(" ")}
								style={markStyle}
							>
								{mark.label ? (
									<span className={styles.label}>{mark.label}</span>
								) : (
									<span className={styles.tick} />
								)}
							</span>
						);
					})}
				</div>

				<div className={styles.centerNeedle} aria-hidden="true">
					<span className={styles.centerNotch} />
					<span className={styles.centerGlow} />
				</div>
			</div>
		</div>
	);
}
