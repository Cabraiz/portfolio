import { expect, test } from "@playwright/test";

// Projetos no ar têm um link "Abrir site" no card: no desktop a foto inteira
// abre o site; no celular um selo no canto da miniatura (o toque na
// miniatura continua ampliando a imagem).
test("desktop: foto do card abre o site do projeto", async ({ browser }) => {
	const context = await browser.newContext({
		viewport: { width: 1440, height: 900 },
	});
	const page = await context.newPage();
	await page.goto("/portfolio", { waitUntil: "networkidle" });

	await page.locator('aside button[data-project-id="clockright"]').click();
	const link = page.locator('[data-project-site-link="clockright"]').first();
	await expect(link).toBeVisible();
	await expect(link).toHaveAttribute("href", "https://clockright.cabraiz.com/");
	await expect(link).toHaveAttribute("target", "_blank");
	await expect(link).toHaveAttribute("rel", /noopener/);
	await expect(link).toContainText("Abrir site");
	const [linkBox, imageBox] = await Promise.all([
		link.boundingBox(),
		page.locator("article img[alt^='Tela inicial do ClockRight']").boundingBox(),
	]);
	expect(Math.abs(linkBox!.width - imageBox!.width)).toBeLessThan(2);
	expect(Math.abs(linkBox!.height - imageBox!.height)).toBeLessThan(2);

	await page
		.locator('aside button[data-project-id="guine-bissau-commerce"]')
		.click();
	await expect(
		page.locator('[data-project-site-link="guine-bissau-commerce"]').first()
	).toHaveAttribute("href", "https://ecommerce.cabraiz.com/");

	// Sem site no ar: sem link.
	await page.locator('aside button[data-project-id="erp-varejo"]').click();
	await expect(page.locator("[data-project-site-link]")).toHaveCount(0);
	await context.close();
});

for (const [language, path, label] of [
	["pt", "/portfolio", "Abrir site"],
	["en", "/en/portfolio", "Visit site"],
	["es", "/es/portfolio", "Abrir sitio"],
] as const) {
	test(`celular (${language}): selo abre o site e a miniatura ainda amplia`, async ({
		browser,
	}) => {
		const context = await browser.newContext({
			viewport: { width: 412, height: 839 },
			isMobile: true,
			hasTouch: true,
		});
		const page = await context.newPage();
		await page.goto(path, { waitUntil: "networkidle" });

		await page.locator('[data-mobile-project-id="site-cabeleireira"]').click();
		const link = page.locator(
			'[data-mobile-project-preview] [data-project-site-link="site-cabeleireira"]'
		);
		await expect(link).toBeVisible();
		await expect(link).toHaveAttribute("href", "https://francyaraujo.com/");
		await expect(link).toHaveAttribute("target", "_blank");
		await expect(link).toContainText(label);
		const box = await link.boundingBox();
		expect(box!.height).toBeGreaterThanOrEqual(40);
		expect(box!.x + box!.width).toBeLessThanOrEqual(412);

		await page.locator("[data-mobile-project-preview-open]").click({
			position: { x: 12, y: 12 },
		});
		await expect(page.locator("[data-project-lightbox]")).toBeVisible();
		await context.close();
	});
}
