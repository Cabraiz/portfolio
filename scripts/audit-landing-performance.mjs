import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const ROUTES = [
	["home", "/home"],
	["portfolio", "/portfolio"],
	["roadmap", "/roadmap"],
	["technologies", "/technologies"],
	["live", "/live"],
	["contact", "/contact"],
];

const VIEWPORTS = [
	{ name: "notebook", width: 1366, height: 720, isMobile: false },
	{ name: "low-height", width: 1366, height: 600, isMobile: false },
	{ name: "mobile", width: 390, height: 844, isMobile: true },
];

function readArgument(name, fallback) {
	const prefix = `--${name}=`;
	const value = process.argv.find((argument) => argument.startsWith(prefix));
	return value ? value.slice(prefix.length) : fallback;
}

function percentile(values, ratio) {
	if (values.length === 0) return 0;
	const sorted = [...values].sort((left, right) => left - right);
	return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * ratio))];
}

function round(value, digits = 1) {
	const factor = 10 ** digits;
	return Math.round(value * factor) / factor;
}

const label = readArgument("label", "audit");
const baseUrl = readArgument("base-url", "http://127.0.0.1:4173");
const outputDirectory = path.resolve(
	readArgument("output", "artifacts/performance")
);
const captureScreenshots = process.argv.includes("--screenshots");
const requestedScreens = new Set(
	readArgument("screens", ROUTES.map(([screen]) => screen).join(",")).split(",")
);
const requestedViewports = new Set(
	readArgument("viewports", VIEWPORTS.map(({ name }) => name).join(",")).split(
		","
	)
);
const selectedRoutes = ROUTES.filter(([screen]) =>
	requestedScreens.has(screen)
);
const selectedViewports = VIEWPORTS.filter(({ name }) =>
	requestedViewports.has(name)
);

await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch({ headless: true });
const results = [];

try {
	for (const viewport of selectedViewports) {
		const context = await browser.newContext({
			viewport: { width: viewport.width, height: viewport.height },
			isMobile: viewport.isMobile,
			deviceScaleFactor: 1,
			reducedMotion: "no-preference",
			serviceWorkers: "block",
		});

		await context.addInitScript(() => {
			window.__landingAuditLongTasks = [];
			new PerformanceObserver((list) => {
				for (const entry of list.getEntries()) {
					window.__landingAuditLongTasks.push({
						startTime: entry.startTime,
						duration: entry.duration,
					});
				}
			}).observe({ type: "longtask", buffered: true });
		});

		for (const [screen, route] of selectedRoutes) {
			const page = await context.newPage();
			const runtimeErrors = [];

			page.on("pageerror", (error) => runtimeErrors.push(error.message));

			const startedAt = Date.now();
			await page.goto(`${baseUrl}/home`, { waitUntil: "domcontentloaded" });
			await page
				.locator("main[data-landing-viewport]")
				.waitFor({ state: "visible" });
			await page.waitForLoadState("networkidle").catch(() => undefined);

			const targetSectionId = screen === "roadmap" ? "roadMap" : screen;
			const targetSection = page.locator(
				`section[data-page-section='true']#${targetSectionId}`
			);
			await targetSection.evaluate((element) => {
				element.scrollIntoView({ behavior: "instant", block: "start" });
			});
			await page.waitForFunction(
				(sectionId) => {
					const main = document.querySelector("main[data-landing-viewport]");
					return main?.getAttribute("data-active-section") === sectionId;
				},
				targetSectionId,
				{ timeout: 5_000 }
			);
			await page.waitForTimeout(650);

			await page.evaluate(() => {
				window.__landingAuditLongTasks = [];
				window.__landingAuditFrameDeltas = [];
				let previous = performance.now();
				const collect = (now) => {
					window.__landingAuditFrameDeltas.push(now - previous);
					previous = now;
					window.__landingAuditRaf = requestAnimationFrame(collect);
				};
				window.__landingAuditRaf = requestAnimationFrame(collect);
			});

			const wheelDelta = viewport.isMobile ? 120 : 180;
			for (const direction of [1, -1, 1, -1]) {
				await page.mouse.wheel(0, wheelDelta * direction);
				await page.waitForTimeout(180);
			}

			await targetSection.evaluate((element) => {
				element.scrollIntoView({ behavior: "instant", block: "start" });
			});
			await page.waitForFunction(
				(sectionId) => {
					const main = document.querySelector("main[data-landing-viewport]");
					return main?.getAttribute("data-active-section") === sectionId;
				},
				targetSectionId,
				{ timeout: 5_000 }
			);
			await page.waitForTimeout(350);

			const metrics = await page.evaluate(() => {
				cancelAnimationFrame(window.__landingAuditRaf);
				const frameDeltas = window.__landingAuditFrameDeltas.slice(1);
				const resources = performance.getEntriesByType("resource");
				const navigation = performance.getEntriesByType("navigation")[0];
				const longTasks = window.__landingAuditLongTasks;

				return {
					frameDeltas,
					longTasks,
					domNodes: document.getElementsByTagName("*").length,
					mountedSections: Array.from(
						document.querySelectorAll("section[data-page-section='true']")
					).filter((section) => section.dataset.sectionMounted === "true")
						.length,
					totalSections: document.querySelectorAll(
						"section[data-page-section='true']"
					).length,
					canvases: document.querySelectorAll("canvas").length,
					animatedElements: Array.from(
						document.getElementsByTagName("*")
					).filter(
						(element) => getComputedStyle(element).animationName !== "none"
					).length,
					activeSection: document
						.querySelector("main[data-landing-viewport]")
						?.getAttribute("data-active-section"),
					mountedSectionIds: Array.from(
						document.querySelectorAll("section[data-page-section='true']")
					)
						.filter((section) => section.dataset.sectionMounted === "true")
						.map((section) => section.id),
					incompleteImages: Array.from(document.images).filter(
						(image) => !image.complete || image.naturalWidth === 0
					).length,
					resourceTransferKb:
						resources.reduce((total, entry) => total + entry.transferSize, 0) /
						1024,
					scriptTransferKb:
						resources
							.filter((entry) => entry.initiatorType === "script")
							.reduce((total, entry) => total + entry.transferSize, 0) / 1024,
					domContentLoadedMs: navigation?.domContentLoadedEventEnd ?? 0,
					loadMs: navigation?.loadEventEnd ?? 0,
					scrollY: window.scrollY,
					documentHeight: document.documentElement.scrollHeight,
				};
			});

			const frameDeltas = metrics.frameDeltas;
			const longTaskDurationMs = metrics.longTasks.reduce(
				(total, task) => total + task.duration,
				0
			);
			const result = {
				label,
				viewport: viewport.name,
				screen,
				route,
				elapsedMs: Date.now() - startedAt,
				frames: frameDeltas.length,
				averageFrameMs: round(
					frameDeltas.reduce((total, value) => total + value, 0) /
						Math.max(1, frameDeltas.length),
					2
				),
				p95FrameMs: round(percentile(frameDeltas, 0.95), 2),
				slowFramePercent: round(
					(frameDeltas.filter((value) => value > 24).length /
						Math.max(1, frameDeltas.length)) *
						100,
					2
				),
				longTaskCount: metrics.longTasks.length,
				longTaskDurationMs: round(longTaskDurationMs, 1),
				maxLongTaskMs: round(
					metrics.longTasks.reduce(
						(maximum, task) => Math.max(maximum, task.duration),
						0
					),
					1
				),
				domNodes: metrics.domNodes,
				mountedSections: metrics.mountedSections,
				totalSections: metrics.totalSections,
				canvases: metrics.canvases,
				animatedElements: metrics.animatedElements,
				activeSection: metrics.activeSection,
				mountedSectionIds: metrics.mountedSectionIds,
				incompleteImages: metrics.incompleteImages,
				resourceTransferKb: round(metrics.resourceTransferKb),
				scriptTransferKb: round(metrics.scriptTransferKb),
				domContentLoadedMs: round(metrics.domContentLoadedMs),
				loadMs: round(metrics.loadMs),
				scrollY: round(metrics.scrollY),
				documentHeight: metrics.documentHeight,
				runtimeErrors,
			};

			results.push(result);
			console.log(JSON.stringify(result));

			if (captureScreenshots) {
				await page.screenshot({
					path: path.join(
						outputDirectory,
						`${label}-${viewport.name}-${screen}.png`
					),
					fullPage: false,
				});
			}

			await page.close();
		}

		await context.close();
	}
} finally {
	await browser.close();
}

const aggregate = {
	label,
	generatedAt: new Date().toISOString(),
	baseUrl,
	screens: results.length,
	totals: {
		runtimeErrors: results.reduce(
			(total, result) => total + result.runtimeErrors.length,
			0
		),
		incompleteImages: results.reduce(
			(total, result) => total + result.incompleteImages,
			0
		),
	},
	averages: {
		p95FrameMs: round(
			results.reduce((total, result) => total + result.p95FrameMs, 0) /
				results.length,
			2
		),
		slowFramePercent: round(
			results.reduce((total, result) => total + result.slowFramePercent, 0) /
				results.length,
			2
		),
		longTaskDurationMs: round(
			results.reduce((total, result) => total + result.longTaskDurationMs, 0) /
				results.length,
			1
		),
		domNodes: round(
			results.reduce((total, result) => total + result.domNodes, 0) /
				results.length,
			1
		),
		mountedSections: round(
			results.reduce((total, result) => total + result.mountedSections, 0) /
				results.length,
			1
		),
		scriptTransferKb: round(
			results.reduce((total, result) => total + result.scriptTransferKb, 0) /
				results.length,
			1
		),
	},
	results,
};

const outputPath = path.join(outputDirectory, `${label}.json`);
await writeFile(outputPath, `${JSON.stringify(aggregate, null, 2)}\n`);
console.log(`Audit saved to ${outputPath}`);
