// Cartão de um ano da mini timeline (movido do LiveMiniTimeline).

import type { JSX } from "react";

import { LIVE_PROJECT_STATUS_LABELS } from "../../domain/live.constants";
import { getStatusColor } from "./LiveMiniTimeline.timeline";
import type { TimelineYearBucket } from "./LiveMiniTimeline.timeline";

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

type LiveMiniTimelineBucketProps = Readonly<{
	bucket: TimelineYearBucket;
	selectedBucketYear: number | null;
	currentYear: number;
	onProjectSelect: ((projectId: string | null) => void) | undefined;
	compact: boolean;
	accentColor: string;
	showProjectNames: boolean;
	selectedProjectId: string | null;
}>;

// Corpo do map de anos, igual ao original.
export function LiveMiniTimelineBucket({
	bucket,
	selectedBucketYear,
	currentYear,
	onProjectSelect,
	compact,
	accentColor,
	showProjectNames,
	selectedProjectId,
}: LiveMiniTimelineBucketProps) {
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
}
