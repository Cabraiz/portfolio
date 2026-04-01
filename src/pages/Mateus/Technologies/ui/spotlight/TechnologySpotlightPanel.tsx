import { memo, CSSProperties } from "react";

import TechnologyHexBadge, {
	type TechnologyBadgeTone,
} from "../hex/TechnologyHexBadge";
import type {
	TechnologyHexCardItem,
	TechnologyRelatedIcon,
} from "../hex/TechnologyHexCard";
import TechnologyEvidenceGallery, {
	type TechnologyEvidenceGalleryItem,
} from "./TechnologyEvidenceGallery";
import TechnologyExperienceMeter from "./TechnologyExperienceMeter";
import TechnologyRelatedStack, {
	type TechnologyRelatedStackItem,
} from "./TechnologyRelatedStack";
import styles from "./TechnologySpotlightPanel.module.css";

function joinClasses(
	...classes: Array<string | undefined | null | false>
): string {
	return classes.filter(Boolean).join(" ");
}

type TechnologySpotlightMetric = Readonly<{
	id: string;
	label: string;
	value: string;
}>;

export type TechnologySpotlightItem = TechnologyHexCardItem &
	Readonly<{
		eyebrow?: string;
		subtitle?: string;
		levelDescription?: string;
		heroImageSrc?: string;
		heroCaptionTitle?: string;
		heroCaptionText?: string;
		highlights?: readonly string[];
		relatedStack?: readonly TechnologyRelatedStackItem[];
		evidenceGallery?: readonly TechnologyEvidenceGalleryItem[];
		metrics?: readonly TechnologySpotlightMetric[];
		deliveryLabel?: string;
		confidenceLabel?: string;
	}>;

type TechnologySpotlightPanelProps = Readonly<{
	item?: TechnologySpotlightItem | null;
	className?: string;
	emptyEyebrow?: string;
	emptyTitle?: string;
	emptyText?: string;
}>;

function formatYears(years?: number | null): string {
	if (typeof years !== "number" || Number.isNaN(years) || years <= 0) {
		return "Experiência sólida";
	}

	if (years === 1) {
		return "1 ano";
	}

	return `${years} anos`;
}

function getInitials(name: string): string {
	const tokens = name
		.split(/[\s/|()-]+/)
		.map((token) => token.trim())
		.filter(Boolean);

	if (tokens.length === 0) {
		return "SK";
	}

	if (tokens.length === 1) {
		return tokens[0].slice(0, 2).toUpperCase();
	}

	return `${tokens[0][0] ?? ""}${tokens[1][0] ?? ""}`.toUpperCase();
}

function mapRelatedIconsToStackItems(
	icons: readonly TechnologyRelatedIcon[] | undefined,
	tone?: TechnologyBadgeTone
): TechnologyRelatedStackItem[] {
	return (icons ?? []).map((item) => ({
		id: item.id,
		name: item.name,
		iconSrc: item.src,
		tone,
	}));
}

function buildFallbackMetrics(
	item: TechnologySpotlightItem
): TechnologySpotlightMetric[] {
	const metrics: TechnologySpotlightMetric[] = [
		{
			id: "experience",
			label: "Experiência",
			value: formatYears(item.years),
		},
		{
			id: "category",
			label: "Domínio",
			value: item.categoryLabel,
		},
	];

	if (item.levelLabel) {
		metrics.push({
			id: "level",
			label: "Nível",
			value: item.levelLabel,
		});
	}

	if (item.deliveryLabel) {
		metrics.push({
			id: "delivery",
			label: "Entrega",
			value: item.deliveryLabel,
		});
	}

	return metrics.slice(0, 4);
}

function TechnologySpotlightPanelComponent({
	item,
	className,
	emptyEyebrow = "Technology Spotlight",
	emptyTitle = "Selecione uma tecnologia para abrir o painel técnico.",
	emptyText = "Aqui entram profundidade, ecossistema relacionado, experiência, imagens e provas visuais da stack. Esse painel deve ser o protagonista analítico da seção.",
}: TechnologySpotlightPanelProps) {
	if (!item) {
		return (
			<aside className={joinClasses(styles.empty, className)}>
				<div className={styles.emptyInner}>
					<p className={styles.emptyEyebrow}>{emptyEyebrow}</p>
					<h2 className={styles.emptyTitle}>{emptyTitle}</h2>
					<p className={styles.emptyText}>{emptyText}</p>
				</div>
			</aside>
		);
	}

	const relatedStackItems = item.relatedStack?.length
		? item.relatedStack
		: mapRelatedIconsToStackItems(item.relatedIcons, item.tone);

	const metrics = item.metrics?.length
		? item.metrics
		: buildFallbackMetrics(item);

	const cssVars = {
		"--technology-spotlight-accent-rgb": item.accentRgb ?? "212, 175, 55",
	} as CSSProperties;

	return (
		<aside
			className={joinClasses(styles.panel, className)}
			style={cssVars}
			aria-labelledby={`technology-spotlight-title-${item.id}`}
			data-technology-spotlight="true"
			data-technology-id={item.id}
		>
			<header className={styles.header}>
				<div className={styles.headerTop}>
					<div className={styles.headerIdentity}>
						<div className={styles.identityRow}>
							<div className={styles.iconFrame} aria-hidden="true">
								{item.iconSrc ? (
									<img
										src={item.iconSrc}
										alt=""
										className={styles.iconMedia}
										loading="lazy"
										decoding="async"
									/>
								) : (
									<span className={styles.iconFallback}>
										{getInitials(item.name)}
									</span>
								)}
							</div>

							<div className={styles.identityContent}>
								<p className={styles.eyebrow}>
									{item.eyebrow ?? "Technology Spotlight"}
								</p>

								<h2
									className={styles.title}
									id={`technology-spotlight-title-${item.id}`}
								>
									{item.name}
								</h2>

								<p className={styles.subtitle}>
									{item.subtitle ?? item.levelDescription ?? item.description}
								</p>

								<div className={styles.badges}>
									<TechnologyHexBadge
										label={item.categoryLabel}
										tone={item.tone ?? "neutral"}
									/>
									<TechnologyHexBadge
										label={formatYears(item.years)}
										emphasis="strong"
									/>
									{item.levelLabel ? (
										<TechnologyHexBadge label={item.levelLabel} />
									) : null}
									{item.confidenceLabel ? (
										<TechnologyHexBadge label={item.confidenceLabel} />
									) : null}
								</div>
							</div>
						</div>
					</div>

					<div className={styles.headerAside}>
						<div className={styles.metricChips}>
							{item.deliveryLabel ? (
								<span className={styles.metricChip}>{item.deliveryLabel}</span>
							) : null}

							{item.confidenceLabel ? (
								<span className={styles.metricChip}>
									{item.confidenceLabel}
								</span>
							) : null}
						</div>
					</div>
				</div>

				<div className={styles.visual}>
					<div className={styles.heroMediaFrame}>
						{item.heroImageSrc ? (
							<img
								src={item.heroImageSrc}
								alt=""
								className={styles.heroMedia}
								loading="lazy"
								decoding="async"
							/>
						) : (
							<div className={styles.heroMediaFallback} aria-hidden="true">
								<div className={styles.heroMediaFallbackInner}>
									<span className={styles.heroMediaFallbackText}>
										{getInitials(item.name)}
									</span>
								</div>
							</div>
						)}

						<div className={styles.heroMediaOverlay} aria-hidden="true" />

						{item.heroCaptionTitle || item.heroCaptionText ? (
							<div className={styles.heroCaption}>
								{item.heroCaptionTitle ? (
									<h3 className={styles.heroCaptionTitle}>
										{item.heroCaptionTitle}
									</h3>
								) : null}

								{item.heroCaptionText ? (
									<p className={styles.heroCaptionText}>
										{item.heroCaptionText}
									</p>
								) : null}
							</div>
						) : null}
					</div>
				</div>
			</header>

			<div className={styles.content}>
				<div className={styles.grid}>
					<div className={styles.main}>
						<section className={styles.card}>
							<h3 className={styles.cardTitle}>Leitura executiva</h3>
							<p className={styles.cardText}>{item.description}</p>

							{item.highlights?.length ? (
								<div className={styles.highlights}>
									{item.highlights.map((highlight) => (
										<span key={highlight} className={styles.highlightPill}>
											{highlight}
										</span>
									))}
								</div>
							) : null}
						</section>

						<section className={styles.card}>
							<TechnologyEvidenceGallery items={item.evidenceGallery ?? []} />
						</section>
					</div>

					<div className={styles.side}>
						<section className={styles.card}>
							<h3 className={styles.cardTitle}>Profundidade de experiência</h3>
							<TechnologyExperienceMeter
								years={item.years}
								label={item.levelLabel}
							/>
						</section>

						<section className={styles.card}>
							<h3 className={styles.cardTitle}>Métricas rápidas</h3>

							<div className={styles.metricsGrid}>
								{metrics.map((metric) => (
									<div key={metric.id} className={styles.metricCard}>
										<span className={styles.metricLabel}>{metric.label}</span>
										<span className={styles.metricValue}>{metric.value}</span>
									</div>
								))}
							</div>
						</section>

						{relatedStackItems.length ? (
							<section className={styles.card}>
								<TechnologyRelatedStack items={relatedStackItems} />
							</section>
						) : null}
					</div>
				</div>
			</div>
		</aside>
	);
}

const TechnologySpotlightPanel = memo(TechnologySpotlightPanelComponent);
TechnologySpotlightPanel.displayName = "TechnologySpotlightPanel";

export default TechnologySpotlightPanel;
