import { expect, test } from "@playwright/test";

// No celular, tocar na imagem do resumo abre o print do projeto em tela cheia.
for (const [language, path, open, close] of [
	["pt", "/portfolio", "Ampliar imagem do projeto", "Fechar imagem ampliada"],
	["en", "/en/portfolio", "Enlarge project image", "Close enlarged image"],
	["es", "/es/portfolio", "Ampliar imagen del proyecto", "Cerrar imagen ampliada"],
] as const) {
	test(`print do projeto ampliado no celular (${language})`, async ({ browser }) => {
		test.setTimeout(60_000);
		const context = await browser.newContext({
			viewport: { width: 390, height: 844 },
			isMobile: true,
			hasTouch: true,
			reducedMotion: "reduce",
		});
		const page = await context.newPage();
		await page.goto(path, { waitUntil: "networkidle" });
		const card = page.locator("[data-mobile-detail-card]");
		await card.locator('[data-mobile-project-id="clockright"]').click();
		await expect(card.locator("h2")).toHaveText("ClockRight");

		await card.getByRole("button", { name: open, exact: true }).click();
		const dialog = page.getByRole("dialog", { name: "ClockRight" });
		await expect(dialog).toBeVisible();
		const image = dialog.locator("[data-project-lightbox-image]");
		await expect(image).toHaveAttribute("src", /clockright-home-preview-v1/);
		await expect
			.poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth))
			.toBeGreaterThan(1000);

		// Cabe na largura da tela; um toque aproxima e permite arrastar para os lados.
		const fitted = await image.boundingBox();
		expect(fitted!.width).toBeLessThanOrEqual(390);
		expect(fitted!.width).toBeGreaterThan(300);
		await image.click();
		const zoomed = await image.boundingBox();
		expect(zoomed!.height).toBeGreaterThan(fitted!.height * 2);
		const scroller = dialog.locator("[data-zoomed]");
		await expect(scroller).toHaveAttribute("data-zoomed", "true");
		expect(await scroller.evaluate((el) => el.scrollWidth > el.clientWidth && el.scrollLeft > 0)).toBe(true);
		await image.click();
		await expect(scroller).toHaveAttribute("data-zoomed", "false");

		// Fecha pelo X, com Esc e tocando fora da imagem; o projeto não muda.
		await dialog.getByRole("button", { name: close, exact: true }).click();
		await expect(dialog).toHaveCount(0);
		await card.getByRole("button", { name: open, exact: true }).click();
		await page.keyboard.press("Escape");
		await expect(dialog).toHaveCount(0);
		await card.getByRole("button", { name: open, exact: true }).click();
		await page.mouse.click(195, 820);
		await expect(dialog).toHaveCount(0);
		await expect(card.locator("h2")).toHaveText("ClockRight");
		await context.close();
	});
}
