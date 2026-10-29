import { expect, test } from "@playwright/test";

// A Rede IA saiu da landing (só Início e Portfólio): a rota abre o Início e
// a rede cognitiva não é montada em nenhuma tela.
for (const viewport of [
	{ name: "desktop", width: 1366, height: 720 },
	{ name: "desktop full hd", width: 1920, height: 1080 },
	{ name: "mobile", width: 390, height: 844 },
]) {
	test(`${viewport.name}: /technologies abre o Início sem montar a rede cognitiva`, async ({
		page,
	}) => {
		await page.setViewportSize(viewport);
		await page.goto("/technologies");

		await expect(page.locator("main[data-landing-viewport]")).toHaveAttribute(
			"data-active-section",
			"home",
			{ timeout: 15_000 }
		);
		await expect(page).toHaveURL(/\/home$/);
		await expect(page.locator("section#technologies")).toHaveCount(0);
		await expect(
			page.locator('[data-cognitive-network-root="true"]')
		).toHaveCount(0);
		await expect(
			page.locator('button[data-nav-link="technologies"]')
		).toHaveCount(0);
	});
}
