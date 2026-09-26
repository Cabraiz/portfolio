import { expect, test } from "@playwright/test";

const forbiddenPublicTerms = /agilizone|agzn|caminhada|gates? internos?/i;

test.describe.configure({ timeout: 60_000 });

for (const viewport of [
	{ name: "desktop", width: 1366, height: 720 },
	{ name: "desktop baixo", width: 1366, height: 631 },
	{ name: "desktop full hd", width: 1920, height: 1080 },
	{ name: "mobile", width: 390, height: 844 },
	{ name: "mobile compacto", width: 360, height: 640 },
]) {
	test(`${viewport.name}: mostra a rede cognitiva pública sem montar Skills`, async ({
		page,
	}) => {
		await page.setViewportSize(viewport);
		await page.goto("/technologies");

		const landing = page.locator("main[data-landing-viewport]");
		await expect(landing).toHaveAttribute(
			"data-active-section",
			"technologies",
			{ timeout: 15_000 }
		);

		const network = page.locator('[data-cognitive-network-root="true"]');
		await expect(network).toBeVisible();
		await expect
			.poll(async () => {
				const bounds = await network.boundingBox();
				if (!bounds) return null;

				return {
					top: Math.round(bounds.y),
					bottom: Math.round(bounds.y + bounds.height),
					height: Math.round(bounds.height),
				};
			})
			.toEqual({ top: 0, bottom: viewport.height, height: viewport.height });
		await expect(network).toHaveAttribute("data-cognitive-view", "neural");
		await expect(network).toHaveAttribute("data-cognitive-thinking", "active");
		await expect(network).toHaveAttribute(
			"data-cognitive-visual-theme",
			"clinical-neural-light"
		);
		await expect(page.locator('[data-technologies-root="true"]')).toHaveCount(
			0
		);
		await expect(
			page.locator('[data-cognitive-core-canvas="true"]')
		).toBeVisible();
		await expect(
			page.locator('[data-cognitive-core-canvas="true"]')
		).toHaveAttribute("data-cognitive-form", "anatomical-brain");
		await expect(
			page.locator('[data-cognitive-core-canvas="true"]')
		).toHaveAttribute("data-brain-model-ready", "true", { timeout: 20_000 });
		await expect(
			page.locator('[data-cognitive-core-canvas="true"]')
		).toHaveAttribute("data-tunnel-count", "0");
		await expect(
			page.locator('[data-cognitive-core-canvas="true"]')
		).toHaveAttribute("data-brain-surface-signals", "0");
		await expect(
			page.locator('[data-cognitive-core-canvas="true"]')
		).toHaveAttribute("data-line-glow", "none");
		await expect(
			page.locator('[data-cognitive-core-canvas="true"]')
		).toHaveAttribute("data-fissure-glow", "dense-animated-cortical-contours");
		await expect(
			page.locator('[data-cognitive-core-canvas="true"]')
		).toHaveAttribute("data-fissure-motion", "traveling-dashes");
		await expect(
			page.locator('[data-cognitive-core-canvas="true"]')
		).toHaveAttribute("data-external-lines", "none");
		await expect(
			page.locator('[data-cognitive-core-canvas="true"]')
		).toHaveAttribute("data-brain-material", "wet-reflective-tissue");
		await expect(
			page.locator('[data-cognitive-core-canvas="true"]')
		).toHaveAttribute("data-brain-lighting", "bright-studio-three-point");
		await expect(
			page.locator('[data-cognitive-core-canvas="true"]')
		).toHaveAttribute("data-brain-rotation", "bounded-front-hemisphere");
		await expect(
			page.locator('[data-cognitive-core-canvas="true"]')
		).toHaveAttribute("data-inferior-anatomy", "hidden");
		await expect(
			page.locator('[data-cognitive-core-canvas="true"]')
		).toHaveAttribute(
			"data-render-profile",
			"merged-geometry-hidpi-no-msaa"
		);
		await expect(
			page.locator('[data-cognitive-core-canvas="true"]')
		).toHaveAttribute("data-visible-triangle-budget", "30000");
		await expect(
			page.getByText("CÉREBRO IA", { exact: true })
		).toBeVisible();
		await expect(page.getByText(/SIMULAÇÃO VISUAL AO VIVO/)).toHaveCount(0);
		await expect(page.getByText(/MOUSE \/ TOQUE/)).toHaveCount(0);
		await expect(page.getByText(/CERTEZA \d/)).toHaveCount(0);
		await expect(page.getByText("POSSÍVEIS CAMINHOS", { exact: true })).toHaveCount(0);
		await expect(page.getByText("Mapa de atenção")).toBeVisible();
		await expect(page.getByText("Ativação latente")).toBeVisible();
		await expect(page.getByText("Radar cognitivo")).toBeVisible();
		await expect(page.getByText(/\bPTS\b/i)).toHaveCount(0);
		await expect(
			page.getByText("SIMULAÇÃO VISUAL DO CÉREBRO ARTIFICIAL")
		).toBeAttached();

		const publicText = await network.innerText();
		expect(publicText).not.toMatch(forbiddenPublicTerms);

		await expect(network).toHaveAttribute("data-cognitive-view", "neural");
		await expect(page.getByRole("tab")).toHaveCount(0);
		await expect(page.getByText(/GIRO \d/)).toHaveCount(0);
		await expect(page.getByText(/INCLINAÇÃO \d/)).toHaveCount(0);

		const bounds = await network.boundingBox();
		expect(bounds).not.toBeNull();
		expect(bounds!.width).toBeLessThanOrEqual(viewport.width + 1);
		const inspector = page.locator('[data-cognitive-inspector="true"]');
		await expect(inspector).toHaveAttribute("data-cognitive-feature-count", "3");
		await expect(inspector).toHaveAttribute("data-update-interval", "1000");
		await expect(inspector).toHaveAttribute("data-value-scale", "100");
		await expect(inspector).toHaveAttribute(
			"data-transition-mode",
			"native-continuous-motion"
		);
		await expect(inspector).toHaveAttribute("data-transition-duration", "900");
		await expect(inspector).toHaveAttribute(
			"data-change-envelope",
			"bounded-micro-variation"
		);
		await expect(inspector).toHaveAttribute(
			"data-signal-blink-range",
			"0.30:0.50"
		);
		await expect(inspector).toHaveAttribute(
			"data-sequence",
			"xorshift32-long-cycle"
		);
		await expect(inspector).toHaveAttribute(
			"data-motion-profile",
			"continuous-micro-variation-with-signal-flow"
		);
		for (const feature of [
			"attention-map",
			"latent-activation",
			"cognitive-radar",
		]) {
			const featurePanel = inspector.locator(
				`[data-cognitive-feature="${feature}"]`
			);
			await expect(featurePanel).toBeVisible();
			const simulatedValueCount = Number(
				await featurePanel.getAttribute("data-simulated-value-count")
			);
			expect(simulatedValueCount).toBeGreaterThan(1000);
		}
		for (const feature of ["attention-map", "latent-activation"]) {
			const featurePanel = inspector.locator(
				`[data-cognitive-feature="${feature}"]`
			);
			const declaredBlinkFraction = Number(
				await featurePanel.getAttribute("data-blink-fraction")
			);
			expect(declaredBlinkFraction).toBeGreaterThanOrEqual(0.3);
			expect(declaredBlinkFraction).toBeLessThanOrEqual(0.5);
			let renderedBlinkFraction: number;
			if (feature === "attention-map") {
				const wireGraphic = featurePanel.locator('[data-wire-renderer="three-layer-canvas"]');
				await expect(wireGraphic).toHaveAttribute("data-wire-count", "360");
				await expect(wireGraphic).toHaveAttribute("data-wire-multiplier", "5");
				const wireCount = Number(await wireGraphic.getAttribute("data-wire-count"));
				const activeWireCount = Number(
					await wireGraphic.getAttribute("data-active-wire-count")
				);
				renderedBlinkFraction = activeWireCount / wireCount;
			} else {
				const activeSignals = featurePanel.locator(
					'[data-blink-state="active"]'
				);
				const allSignals = featurePanel.locator("[data-blink-state]");
				renderedBlinkFraction =
					(await activeSignals.count()) / (await allSignals.count());
			}
			expect(renderedBlinkFraction).toBeGreaterThanOrEqual(0.3);
			expect(renderedBlinkFraction).toBeLessThanOrEqual(0.5);
		}
		await expect(page.getByText("DECISÕES / S")).toHaveCount(0);
		await expect(page.getByText(/LEMBRANÇAS ENCONTRADAS/)).toHaveCount(0);

		for (const selector of [
			'[data-cognitive-graph="true"]',
			'[data-cognitive-inspector="true"]',
		]) {
			const panelBounds = await page.locator(selector).boundingBox();
			expect(panelBounds).not.toBeNull();
			expect(panelBounds!.y + panelBounds!.height).toBeLessThanOrEqual(
				viewport.height + 0.5
			);
		}
		if (viewport.width <= 767) {
			const maximumInternalOverflow = await page
				.locator('[data-cognitive-graph="true"]')
				.evaluate(async (element) => {
					const graph = element as HTMLElement;
					const samples: number[] = [];
					for (let index = 0; index < 36; index += 1) {
						samples.push(graph.scrollWidth - graph.clientWidth);
						await new Promise((resolve) => window.setTimeout(resolve, 45));
					}
					return Math.max(...samples);
				});
			expect(maximumInternalOverflow).toBeLessThanOrEqual(0);
		}
		expect(
			await page.evaluate(
				() =>
					document.documentElement.scrollWidth <=
					document.documentElement.clientWidth
			)
		).toBe(true);
	});
}

test("corrige a altura ao navegar de Portfólio para Rede IA em viewport equivalente a zoom de 80%", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1708, height: 900 });
	await page.goto("/portfolio");
	await page.locator('button[data-nav-link="technologies"]').click();

	const network = page.locator('[data-cognitive-network-root="true"]');
	await expect(network).toBeVisible();
	await expect
		.poll(async () => {
			return network.evaluate((element) => {
				const bounds = element.getBoundingClientRect();
				return {
					top: Math.round(bounds.top),
					bottom: Math.round(bounds.bottom),
					height: Math.round(bounds.height),
				};
			});
		})
		.toEqual({ top: 0, bottom: 900, height: 900 });
});

test("mantém o núcleo 3D e a telemetria em atividade", async ({ page }) => {
	await page.setViewportSize({ width: 1366, height: 720 });
	await page.goto("/technologies");

	const network = page.locator('[data-cognitive-network-root="true"]');
	const core = page.locator('[data-cognitive-core-canvas="true"]');
	const canvas = core.locator("canvas");
	const inspector = page.locator('[data-cognitive-inspector="true"]');
	await expect(core).toHaveAttribute("data-brain-model-ready", "true", {
		timeout: 20_000,
	});
	await expect(core).toHaveAttribute("data-line-glow", "none");
	await expect(core).toHaveAttribute(
		"data-fissure-glow",
		"dense-animated-cortical-contours"
	);
	await expect(core).toHaveAttribute("data-fissure-motion", "traveling-dashes");
	await expect(core).toHaveAttribute("data-tunnel-count", "0");
	await expect(core).toHaveAttribute("data-brain-surface-signals", "0");
	await expect(core).toHaveAttribute("data-external-lines", "none");
	await expect(core).toHaveAttribute(
		"data-brain-material",
		"wet-reflective-tissue"
	);
	await expect(core).toHaveAttribute(
		"data-brain-lighting",
		"bright-studio-three-point"
	);
	await expect(core).toHaveAttribute(
		"data-brain-rotation",
		"bounded-front-hemisphere"
	);
	await expect(core).toHaveAttribute(
		"data-brain-tilt",
		"top-forward-base-receded"
	);
	await expect(core).toHaveAttribute("data-brain-pitch-range", "0.28:0.40");
	await expect(core).toHaveAttribute("data-brain-yaw-range", "-0.28:0.72");
	await expect(core).toHaveAttribute("data-inferior-anatomy", "hidden");
	await expect(network).toHaveAttribute("data-cognitive-thinking", "active");
	await expect(
		page.getByText(/PENSANDO · ESCOLHENDO CAMINHOS/)
	).toBeVisible();

	const firstFrame = await canvas.screenshot();
	const firstReadout = await page
		.locator('[data-cognitive-inspector="true"]')
		.innerText();
	const firstInsightFrame = await page
		.locator('[data-cognitive-inspector="true"]')
		.getAttribute("data-cognitive-frame");
	const firstInsightSignature = await page
		.locator('[data-cognitive-inspector="true"]')
		.getAttribute("data-frame-signature");
	const firstFeatureCounts = await page
		.locator('[data-cognitive-feature]')
		.evaluateAll((elements) =>
			elements.map((element) =>
				Number(element.getAttribute("data-simulated-value-count"))
			)
		);
	const firstBlinkPattern = await page
		.locator("[data-blink-state]")
		.evaluateAll((elements) =>
			elements
				.map((element) => element.getAttribute("data-blink-state")?.[0])
				.join("")
		);
	const firstThoughtPhase = await network.getAttribute("data-thought-phase");
	await page.waitForTimeout(1150);
	const secondFrame = await canvas.screenshot();
	const secondReadout = await page
		.locator('[data-cognitive-inspector="true"]')
		.innerText();
	const secondInsightFrame = await page
		.locator('[data-cognitive-inspector="true"]')
		.getAttribute("data-cognitive-frame");
	const secondInsightSignature = await page
		.locator('[data-cognitive-inspector="true"]')
		.getAttribute("data-frame-signature");
	const secondFeatureCounts = await page
		.locator('[data-cognitive-feature]')
		.evaluateAll((elements) =>
			elements.map((element) =>
				Number(element.getAttribute("data-simulated-value-count"))
			)
		);
	const secondBlinkPattern = await page
		.locator("[data-blink-state]")
		.evaluateAll((elements) =>
			elements
				.map((element) => element.getAttribute("data-blink-state")?.[0])
				.join("")
		);

	expect(secondFrame.equals(firstFrame)).toBe(false);
	expect(secondReadout).not.toBe(firstReadout);
	expect(secondInsightFrame).not.toBe(firstInsightFrame);
	expect(secondInsightSignature).not.toBe(firstInsightSignature);
	expect(secondBlinkPattern).not.toBe(firstBlinkPattern);
	const relativeFeatureChanges = firstFeatureCounts.map((firstValue, index) =>
		Math.abs(secondFeatureCounts[index] - firstValue) / firstValue
	);
	expect(Math.max(...relativeFeatureChanges)).toBeLessThan(0.04);
	expect(relativeFeatureChanges.some((change) => change > 0)).toBe(true);
	const liveTransition = await inspector.evaluate(
		(element) =>
			new Promise<{
				values: string[];
				wireTransforms: string[];
			}>((resolve) => {
				const initialTarget = element.getAttribute("data-cognitive-target-frame");
				const timeoutId = window.setTimeout(
					() => resolve({ values: [], wireTransforms: [] }),
					1800
				);
				const targetObserver = new MutationObserver(() => {
					if (
						element.getAttribute("data-cognitive-target-frame") === initialTarget
					) {
						return;
					}

					targetObserver.disconnect();
					const values: string[] = [];
					const wireTransforms: string[] = [];
					const animatedNumbers = Array.from(
						element.querySelectorAll('[data-animated-number="true"]')
					);
					const captureValue = () => {
						values.push(
							animatedNumbers
								.map(
									(number) =>
										number.getAttribute("data-current-value") ?? ""
								)
								.join("|")
						);
					};
					captureValue();
					const valueObserver = new MutationObserver(captureValue);
					valueObserver.observe(element, {
						attributes: true,
						attributeFilter: ["data-current-value"],
						subtree: true,
					});
					const sampleId = window.setInterval(() => {
						const wireField = element.querySelector('[data-wire-motion="continuous-transform"]');
						if (wireField) {
							wireTransforms.push(window.getComputedStyle(wireField).transform);
						}
					}, 55);

					window.setTimeout(() => {
						window.clearTimeout(timeoutId);
						window.clearInterval(sampleId);
						valueObserver.disconnect();
						resolve({ values, wireTransforms });
					}, 720);
				});
				targetObserver.observe(element, {
					attributes: true,
					attributeFilter: ["data-cognitive-target-frame"],
				});
			})
	);
	expect(new Set(liveTransition.values).size).toBeGreaterThan(3);
	expect(new Set(liveTransition.wireTransforms).size).toBeGreaterThan(2);
	expect(liveTransition.wireTransforms.every((value) => value !== "none")).toBe(true);
	const wireAnimationContract = await inspector
		.locator('[data-wire-motion="continuous-transform"]')
		.first()
		.evaluate((element) => {
			const animation = element.getAnimations()[0];
			const timing = animation?.effect?.getComputedTiming();
			return {
				animationName: window.getComputedStyle(element).animationName,
				duration: Number(timing?.duration ?? 0),
				iterations: timing?.iterations ?? 0,
				playState: animation?.playState ?? "missing",
			};
		});
	expect(wireAnimationContract.animationName).not.toBe("none");
	expect(wireAnimationContract.duration).toBeGreaterThanOrEqual(3700);
	expect(wireAnimationContract.iterations).toBe(Number.POSITIVE_INFINITY);
	expect(wireAnimationContract.playState).toBe("running");
	await expect
		.poll(() => network.getAttribute("data-thought-phase"))
		.not.toBe(firstThoughtPhase);
	await expect(page.getByText("// RACIOCÍNIO AGORA")).toBeVisible();

	const canvasBounds = await canvas.boundingBox();
	expect(canvasBounds).not.toBeNull();
	await page.mouse.move(
		canvasBounds!.x + canvasBounds!.width * 0.47,
		canvasBounds!.y + canvasBounds!.height * 0.51
	);
	await expect(core).toHaveAttribute("data-pointer-active", "true");
	await expect(core).toHaveAttribute("data-last-pointer-type", "mouse");
	await expect(core).toHaveCSS("cursor", "crosshair");

	await core.dispatchEvent("pointermove", {
		pointerType: "touch",
		pointerId: 7,
		clientX: canvasBounds!.x + canvasBounds!.width * 0.52,
		clientY: canvasBounds!.y + canvasBounds!.height * 0.48,
	});
	await expect(core).toHaveAttribute("data-last-pointer-type", "touch");

	await page.mouse.move(0, 0);
	await expect(core).toHaveAttribute("data-pointer-active", "false");
});

test("mantém cadência interativa com o cérebro 3D ativo", async ({ page }) => {
	await page.setViewportSize({ width: 1920, height: 1080 });
	await page.goto("/technologies");

	const core = page.locator('[data-cognitive-core-canvas="true"]');
	await expect(core).toHaveAttribute("data-brain-model-ready", "true", {
		timeout: 20_000,
	});
	await page.waitForTimeout(500);

	const cadence = await page.evaluate(
		() =>
			new Promise<{
				fps: number;
				averageFrameMs: number;
				p95FrameMs: number;
			}>((resolve) => {
				const frameTimes: number[] = [];
				let previousFrame = performance.now();
				const startedAt = previousFrame;

				const sampleFrame = (now: number) => {
					frameTimes.push(now - previousFrame);
					previousFrame = now;
					if (now - startedAt < 2500) {
						window.requestAnimationFrame(sampleFrame);
						return;
					}

					const sorted = [...frameTimes].sort((first, second) => first - second);
					const averageFrameMs =
						frameTimes.reduce((total, value) => total + value, 0) /
						frameTimes.length;
					resolve({
						fps: 1000 / averageFrameMs,
						averageFrameMs,
						p95FrameMs: sorted[Math.floor(sorted.length * 0.95)] ?? 0,
					});
				};

				window.requestAnimationFrame(sampleFrame);
			})
	);

	expect(cadence.fps).toBeGreaterThanOrEqual(18);
	expect(cadence.averageFrameMs).toBeLessThanOrEqual(56);
	expect(cadence.p95FrameMs).toBeLessThanOrEqual(90);

	const optimizedModelBytes = await page.evaluate(async () => {
		const response = await fetch("/models/cognitive-brain/brain-optimized.glb");
		return (await response.arrayBuffer()).byteLength;
	});
	expect(optimizedModelBytes).toBeLessThan(1_200_000);
});
