// src/pages/Mateus/Live/Live.tsx

import {
	useEffect,
	useMemo,
	useRef,
	useState,
	type CSSProperties,
} from "react";

import { useLiveMetrics } from "./application/useLiveMetrics";
import { useLiveProjectSpotlight } from "./application/useLiveProjectSpotlight";
import {
	LIVE_DEFAULT_SCENE_CONFIG,
	LIVE_INTERACTION_LABELS,
	LIVE_PROJECT_STATUS_LABELS,
	LIVE_SCENE_DENSITY_WEIGHTS,
	LIVE_SECTION_ID,
} from "./domain/live.constants";
import type {
	LiveMetricId,
	LiveProjectStatus,
	LiveSceneDensity,
} from "./domain/live.types";
import { useLiveGsapScene } from "./hooks/useLiveGsapScene";
import LiveStatsBoard from "./ui/board/LiveStatsBoard";
import LiveInteractionHint from "./ui/chrome/LiveInteractionHint";
import LiveLegend from "./ui/chrome/LiveLegend";
import LiveMiniTimeline from "./ui/chrome/LiveMiniTimeline";
import LiveSectionHeader from "./ui/chrome/LiveSectionHeader";
import LiveAmbientGrid from "./ui/scene/LiveAmbientGrid";
import LiveCursorField from "./ui/scene/LiveCursorField";
import LiveProjectNodes from "./ui/scene/LiveProjectNodes";
import LiveSignalPulse from "./ui/scene/LiveSignalPulse";
import LiveSectionShell, {
	type LiveShellMetricItem,
} from "./ui/shell/LiveSectionShell";
import styles from "./Live.module.css";

type PointerSnapshot = Readonly<{
	clientX: number;
	clientY: number;
	normalizedX: number;
	normalizedY: number;
	centeredX: number;
	centeredY: number;
	distance: number;
}>;

const DEFAULT_POINTER: PointerSnapshot = {
	clientX: 0,
	clientY: 0,
	normalizedX: 0.5,
	normalizedY: 0.5,
	centeredX: 0,
	centeredY: 0,
	distance: 0,
};

function joinClassNames(
	...classNames: Array<string | false | null | undefined>
): string {
	return classNames.filter(Boolean).join(" ");
}

function mapMetricToStatus(
	metricId: LiveMetricId | null
): LiveProjectStatus | null {
	switch (metricId) {
		case "projects-active":
		case "automations":
			return "active";

		case "projects-monitoring":
			return "monitoring";

		case "projects-delivered":
		case "deliveries-shipped":
			return "delivered";

		default:
			return null;
	}
}

function getSceneTitle(selectedStatus: LiveProjectStatus | null): string {
	if (!selectedStatus) {
		return "Radar de projetos";
	}

	return `Radar • ${LIVE_PROJECT_STATUS_LABELS[selectedStatus]}`;
}

function getSceneHint(
	selectedStatus: LiveProjectStatus | null,
	selectedMetricLabel: string | null
): string {
	if (selectedStatus && selectedMetricLabel) {
		return `Recorte ativo: ${LIVE_PROJECT_STATUS_LABELS[selectedStatus]}. O spotlight acompanha ${selectedMetricLabel.toLowerCase()}.`;
	}

	if (selectedStatus) {
		return `Recorte ativo: ${LIVE_PROJECT_STATUS_LABELS[selectedStatus]}. Passe o mouse pelos nós para abrir o spotlight.`;
	}

	if (selectedMetricLabel) {
		return `Métrica em foco: ${selectedMetricLabel}. Passe o mouse pelos nós e compare placar com radar.`;
	}

	return "Passe o mouse pelos nós para abrir o spotlight e deixar o radar vivo.";
}

function toNodeCountLabel(count: number): string {
	return `${count} ${count === 1 ? "nó" : "nós"}`;
}

export default function Live() {
	const rootRef = useRef<HTMLDivElement | null>(null);

	const metricsState = useLiveMetrics();

	const [selectedMetricId, setSelectedMetricId] = useState<LiveMetricId | null>(
		null
	);
	const [selectedStatus, setSelectedStatus] =
		useState<LiveProjectStatus | null>(null);
	const [density, setDensity] = useState<LiveSceneDensity>(
		LIVE_DEFAULT_SCENE_CONFIG.density
	);
	const [pointer, setPointer] = useState<PointerSnapshot>(DEFAULT_POINTER);

	useEffect(() => {
		if (selectedMetricId !== null) {
			return;
		}

		const firstHeroMetric = metricsState.heroMetrics[0];

		if (firstHeroMetric) {
			setSelectedMetricId(firstHeroMetric.id);
		}
	}, [metricsState.heroMetrics, selectedMetricId]);

	const filteredProjects = useMemo(() => {
		if (!selectedStatus) {
			return metricsState.projects;
		}

		return metricsState.projects.filter(
			(project) => project.status === selectedStatus
		);
	}, [metricsState.projects, selectedStatus]);

	const spotlight = useLiveProjectSpotlight({
		projects: filteredProjects,
		autoSelectFirstProject: true,
		featuredLimit: LIVE_DEFAULT_SCENE_CONFIG.maxVisibleNodes,
	});

	const selectedMetric = useMemo(() => {
		if (!selectedMetricId) {
			return metricsState.heroMetrics[0] ?? metricsState.snapshots[0] ?? null;
		}

		return metricsState.getSnapshotById(selectedMetricId);
	}, [
		metricsState,
		metricsState.heroMetrics,
		metricsState.snapshots,
		selectedMetricId,
	]);

	const {
		isReady: isSceneReady,
		refresh: refreshScene,
		replay: replayScene,
	} = useLiveGsapScene({
		rootRef,
		hintSelector: '[data-live-hint="true"]',
	});

	useEffect(() => {
		refreshScene();
	}, [
		density,
		filteredProjects.length,
		refreshScene,
		selectedMetricId,
		selectedStatus,
	]);

	const shellMetrics = useMemo<readonly LiveShellMetricItem[]>(() => {
		return metricsState.heroMetrics.map((metric) => ({
			id: metric.id,
			label: metric.shortLabel,
			value: metric.formattedValue,
			helperText: metric.description,
			badge: metric.badge,
			tone: metric.tone,
		}));
	}, [metricsState.heroMetrics]);

	const pulseSize = Math.round(102 * LIVE_SCENE_DENSITY_WEIGHTS[density]);
	const pulseX = `${30 + pointer.normalizedX * 40}%`;
	const pulseY = `${24 + pointer.normalizedY * 36}%`;

	const sceneTitle = getSceneTitle(selectedStatus);
	const sceneHint = getSceneHint(selectedStatus, selectedMetric?.label ?? null);

	const spotlightProject = spotlight.spotlightProject;
	const spotlightTags = spotlightProject?.tags.slice(0, 3) ?? [];

	const sceneHudStyle = useMemo<CSSProperties>(() => {
		return {
			["--live-scene-pointer-x" as const]: `${Math.round(pointer.normalizedX * 100)}%`,
			["--live-scene-pointer-y" as const]: `${Math.round(pointer.normalizedY * 100)}%`,
		} as CSSProperties;
	}, [pointer.normalizedX, pointer.normalizedY]);

	const handleMetricSelect = (metricId: LiveMetricId) => {
		setSelectedMetricId(metricId);
		setSelectedStatus(mapMetricToStatus(metricId));
	};

	const handleStatusSelect = (status: LiveProjectStatus | null) => {
		setSelectedStatus(status);
	};

	const hasResults = metricsState.projects.length > 0;

	return (
		<div ref={rootRef} className={styles.root}>
			<LiveSectionShell
				id={LIVE_SECTION_ID}
				className={styles.shell}
				ariaLabel="Seção ao vivo do portfólio"
				eyebrow="Ao vivo"
				title="Projetos, entregas e operação em leitura editorial."
				description="Um placar interativo inspirado em painéis urbanos de contagem contínua, mas traduzido para um radar profissional de software, produto e execução."
				caption="O foco aqui é transformar histórico e trabalho ativo em um painel que pareça vivo, observável e agradável de explorar."
				metrics={shellMetrics}
				hasResults={hasResults}
				filtersSlot={
					<div className={styles.filtersBar}>
						<div className={styles.filterGroup}>
							<button
								type="button"
								className={joinClassNames(
									styles.filterPill,
									!selectedStatus && styles.filterPillActive
								)}
								onClick={() => {
									setSelectedStatus(null);
								}}
							>
								Todos
							</button>

							{(
								Object.keys(LIVE_PROJECT_STATUS_LABELS) as LiveProjectStatus[]
							).map((status) => (
								<button
									key={status}
									type="button"
									className={joinClassNames(
										styles.filterPill,
										selectedStatus === status && styles.filterPillActive
									)}
									onClick={() => {
										handleStatusSelect(
											selectedStatus === status ? null : status
										);
									}}
								>
									{LIVE_PROJECT_STATUS_LABELS[status]}
								</button>
							))}
						</div>

						<div className={styles.filterGroup}>
							{(["calm", "balanced", "dense"] as LiveSceneDensity[]).map(
								(option) => (
									<button
										key={option}
										type="button"
										className={joinClassNames(
											styles.filterPill,
											density === option && styles.filterPillActive
										)}
										onClick={() => {
											setDensity(option);
										}}
									>
										{option}
									</button>
								)
							)}
						</div>

						<div className={styles.filterGroup}>
							<button
								type="button"
								className={styles.filterGhostButton}
								onClick={replayScene}
							>
								Reanimar cena
							</button>

							<span className={styles.filterMeta}>
								{toNodeCountLabel(spotlight.visibleProjects.length)} ·{" "}
								{
									LIVE_INTERACTION_LABELS[
										LIVE_DEFAULT_SCENE_CONFIG.interactionMode
									]
								}
							</span>
						</div>
					</div>
				}
				sceneSlot={
					<div className={styles.sceneViewport}>
						<LiveCursorField
							className={styles.sceneField}
							label={sceneTitle}
							hint={sceneHint}
							minHeight="clamp(420px, 48vw, 680px)"
							onPointerStateChange={setPointer}
							onPointerLeaveField={() => {
								setPointer(DEFAULT_POINTER);
							}}
						>
							<LiveAmbientGrid
								density={density}
								pointer={pointer}
								minHeight="clamp(420px, 48vw, 680px)"
								borderRadius="30px"
							>
								{[0.28, 0.42, 0.56].map((ringFactor, index) => {
									const size = `${Math.round(100 * ringFactor)}%`;

									return (
										<div
											key={`scene-ring-${ringFactor}`}
											className={styles.sceneRing}
											data-live-parallax={String(0.2 + index * 0.16)}
											style={{
												width: size,
												height: size,
												transform: `translate(-50%, -50%) rotate(${index * 12}deg)`,
												opacity: 0.16 + index * 0.06,
											}}
										/>
									);
								})}

								<LiveSignalPulse
									x={pulseX}
									y={pulseY}
									size={pulseSize}
									variant="radar"
									label="scan"
									dataParallax={0.8}
								/>

								<LiveSignalPulse
									x="50%"
									y="50%"
									size={76}
									variant="soft"
									label="core"
									dataParallax={0.25}
								/>

								{spotlightProject ? (
									<LiveSignalPulse
										x={`${46 + pointer.normalizedX * 10}%`}
										y={`${46 + pointer.normalizedY * 10}%`}
										size={64}
										variant="focus"
										label="focus"
										dataParallax={0.96}
									/>
								) : null}

								<div
									className={styles.sceneHud}
									style={sceneHudStyle}
									data-live-parallax="0.18"
								>
									<span className={styles.sceneHudEyebrow}>spotlight</span>

									<strong className={styles.sceneHudTitle}>
										{spotlight.spotlightTitle}
									</strong>

									<span className={styles.sceneHudMeta}>
										{spotlightProject
											? `${spotlightProject.clientLabel} · ${Math.round(
													spotlightProject.healthScore
												)}% saúde`
											: "Passe o mouse pelos nós para abrir o spotlight."}
									</span>

									<p className={styles.sceneHudDescription}>
										{spotlightProject?.summary ?? spotlight.projectNarrative}
									</p>

									{spotlightTags.length > 0 ? (
										<div className={styles.sceneTagRow}>
											{spotlightTags.map((tag) => (
												<span key={tag} className={styles.sceneTag}>
													{tag}
												</span>
											))}
										</div>
									) : null}
								</div>

								<LiveProjectNodes
									projects={spotlight.visibleProjects}
									density={density}
									maxVisibleNodes={LIVE_DEFAULT_SCENE_CONFIG.maxVisibleNodes}
									selectedProjectId={spotlight.activeProjectId}
									hoveredProjectId={spotlight.hoveredProjectId}
									spotlightProjectId={spotlight.spotlightProjectId}
									onProjectSelect={spotlight.selectProject}
									onProjectHover={spotlight.hoverProject}
									onProjectLeave={spotlight.clearHover}
									showClient
									showStack
									showHealth
								/>

								<div className={styles.sceneControls} data-live-parallax="0.32">
									<button
										type="button"
										className={styles.sceneControlButton}
										onClick={spotlight.selectPreviousProject}
									>
										Prev
									</button>

									<button
										type="button"
										className={styles.sceneControlButton}
										onClick={spotlight.selectNextProject}
									>
										Next
									</button>

									<span className={styles.sceneMetaPill}>
										{toNodeCountLabel(spotlight.visibleProjects.length)} ·{" "}
										{density}
									</span>
								</div>
							</LiveAmbientGrid>
						</LiveCursorField>
					</div>
				}
				spotlightSlot={
					<div className={styles.sidebarStack}>
						<div data-live-hint="true">
							<LiveSectionHeader
								elapsedMs={metricsState.elapsedMs}
								isRunning={metricsState.isRunning}
								summary={metricsState.summary}
								density={density}
								interactionMode={LIVE_DEFAULT_SCENE_CONFIG.interactionMode}
								spotlightTitle={spotlight.spotlightTitle}
								footerSlot={
									<div className={styles.headerFooter}>
										<span className={styles.headerBadge}>
											{metricsState.isRunning
												? "Painel vivo"
												: "Painel pausado"}
										</span>
										<span className={styles.headerBadge}>
											Cena {isSceneReady ? "pronta" : "preparando"}
										</span>
										{selectedStatus ? (
											<button
												type="button"
												className={styles.headerBadgeButton}
												onClick={() => {
													setSelectedStatus(null);
												}}
											>
												Limpar recorte
											</button>
										) : null}
									</div>
								}
							/>
						</div>

						<LiveLegend
							statusBuckets={metricsState.statusBuckets}
							selectedStatus={selectedStatus}
							onStatusSelect={handleStatusSelect}
							showToneLegend
							showStatusLegend
							showHintLegend={false}
						/>
					</div>
				}
				supportingSlot={
					<div className={styles.supportingGrid}>
						<LiveStatsBoard
							className={styles.board}
							metrics={metricsState.snapshots}
							heroMetrics={metricsState.heroMetrics}
							secondaryMetrics={metricsState.secondaryMetrics}
							statusBuckets={metricsState.statusBuckets}
							elapsedMs={metricsState.elapsedMs}
							isRunning={metricsState.isRunning}
							hasAnimatedMetrics={metricsState.hasAnimatedMetrics}
							selectedMetricId={selectedMetricId}
							onMetricSelect={handleMetricSelect}
							onToggleRunning={metricsState.toggle}
							onRestart={metricsState.restart}
						/>

						<div className={styles.chromeGrid}>
							<div className={styles.chromePanel}>
								<LiveMiniTimeline
									projects={filteredProjects}
									selectedProjectId={spotlight.activeProjectId}
									onProjectSelect={spotlight.selectProject}
								/>
							</div>

							<div className={styles.chromePanel} data-live-hint="true">
								<LiveInteractionHint
									interactionMode={LIVE_DEFAULT_SCENE_CONFIG.interactionMode}
									isRunning={metricsState.isRunning}
									selectedProjectName={spotlightProject?.name ?? null}
									activeMetricLabel={selectedMetric?.label ?? null}
								/>
							</div>
						</div>
					</div>
				}
			/>
		</div>
	);
}
