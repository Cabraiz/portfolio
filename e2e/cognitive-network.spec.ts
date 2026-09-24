import { expect, test } from "@playwright/test";

const forbiddenPublicTerms = /agilizone|agzn|caminhada|gates? internos?/i;

for (const viewport of [
	{ name: "desktop", width: 1366, height: 720 },
	{ name: "mobile", width: 390, height: 844 },
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
		await expect(page.locator('[data-technologies-root="true"]')).toHaveCount(
			0
		);
		await expect(page.getByText("Como contexto vira decisão.")).toBeVisible();
		await expect(page.getByText("CURADORIA PÚBLICA")).toBeVisible();
		await expect(
			page.getByText("A visualização não consulta bancos operacionais.")
		).toBeAttached();

		const publicText = await network.innerText();
		expect(publicText).not.toMatch(forbiddenPublicTerms);

		await page.getByRole("tab", { name: "Fluxo CAG/RAG" }).click();
		await expect(network).toHaveAttribute("data-cognitive-view", "pipeline");
		await page.getByRole("tab", { name: "Memória", exact: true }).click();
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
				viewport.height + 2
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
