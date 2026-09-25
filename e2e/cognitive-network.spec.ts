import { expect, test } from "@playwright/test";

const forbiddenPublicTerms = /agilizone|agzn|caminhada|gates? internos?/i;

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
		await expect(network).toHaveAttribute("data-cognitive-view", "neural");
		await expect(network).toHaveAttribute("data-cognitive-thinking", "active");
		await expect(page.locator('[data-technologies-root="true"]')).toHaveCount(
			0
		);
		await expect(
			page.locator('[data-cognitive-core-canvas="true"]')
		).toBeVisible();
		await expect(
			page.locator('[data-cognitive-core-canvas="true"]')
		).toHaveAttribute("data-cognitive-form", "brain-orbits");
		await expect(
			page.getByText("CÉREBRO ARTIFICIAL", { exact: true })
		).toBeVisible();
		await expect(page.getByText("ATIVIDADE DO CÉREBRO")).toBeVisible();
		await expect(
			page.getByText("SIMULAÇÃO VISUAL DO CÉREBRO ARTIFICIAL")
		).toBeAttached();

		const publicText = await network.innerText();
		expect(publicText).not.toMatch(forbiddenPublicTerms);

		await page.getByRole("tab", { name: "Como responde" }).click();
		await expect(network).toHaveAttribute("data-cognitive-view", "pipeline");
		await page.getByRole("tab", { name: "Lembranças", exact: true }).click();
		await expect(network).toHaveAttribute("data-cognitive-view", "memory");

		const bounds = await network.boundingBox();
		expect(bounds).not.toBeNull();
		expect(bounds!.width).toBeLessThanOrEqual(viewport.width + 1);
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
		.toEqual({ top: 72, bottom: 900, height: 828 });
});

test("mantém o núcleo 3D e a telemetria em atividade", async ({ page }) => {
	await page.setViewportSize({ width: 1366, height: 720 });
	await page.goto("/technologies");

	const network = page.locator('[data-cognitive-network-root="true"]');
	const canvas = page.locator('[data-cognitive-core-canvas="true"]');
	await expect(network).toHaveAttribute("data-cognitive-thinking", "active");
	await expect(
		page.getByText(/PENSANDO · ESCOLHENDO UM CAMINHO/)
	).toBeVisible();

	const firstFrame = await canvas.evaluate((element) =>
		(element as HTMLCanvasElement).toDataURL()
	);
	const firstReadout = await page
		.locator('[data-cognitive-inspector="true"]')
		.innerText();
	const firstThoughtPhase = await network.getAttribute("data-thought-phase");
	await page.waitForTimeout(900);
	const secondFrame = await canvas.evaluate((element) =>
		(element as HTMLCanvasElement).toDataURL()
	);
	const secondReadout = await page
		.locator('[data-cognitive-inspector="true"]')
		.innerText();

	expect(secondFrame).not.toBe(firstFrame);
	expect(secondReadout).not.toBe(firstReadout);
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
	await expect(canvas).toHaveAttribute("data-pointer-active", "true");
	await expect(canvas).toHaveAttribute("data-last-pointer-type", "mouse");

	await canvas.dispatchEvent("pointermove", {
		pointerType: "touch",
		pointerId: 7,
		clientX: canvasBounds!.x + canvasBounds!.width * 0.52,
		clientY: canvasBounds!.y + canvasBounds!.height * 0.48,
	});
	await expect(canvas).toHaveAttribute("data-last-pointer-type", "touch");

	await page.mouse.move(0, 0);
	await expect(canvas).toHaveAttribute("data-pointer-active", "false");
});
