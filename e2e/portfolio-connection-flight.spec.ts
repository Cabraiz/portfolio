import { expect, test, type Page } from "@playwright/test";

// Ao trocar de destino, o avião sai de onde estava por uma linha temporária;
// a rota que fica no mapa é sempre Fortaleza → novo destino.
const journeyState = (page: Page) =>
	page.evaluate(() => {
		const traveler = document.querySelector<HTMLElement>(
			"[data-world-journey-traveler]"
		);
		return {
			from: traveler?.dataset.worldJourneyFrom ?? null,
			transfer: document.querySelectorAll("[data-world-journey-transfer-route]")
				.length,
			route: document.querySelectorAll(
				'[data-world-journey-route="central-clube-livro"]'
			).length,
		};
	});

for (const [name, viewport, selector] of [
	[
		"desktop",
		{ width: 1440, height: 900 },
		(id: string) => `aside button[data-project-id="${id}"]`,
	],
	[
		"celular",
		{ width: 412, height: 839 },
		(id: string) => `[data-mobile-project-id="${id}"]`,
	],
] as const) {
	test(`voo de conexão de Salt Lake City para Coimbra (${name})`, async ({
		browser,
	}) => {
		test.setTimeout(60_000);
		const mobile = name === "celular";
		const context = await browser.newContext({
			viewport,
			isMobile: mobile,
			hasTouch: mobile,
		});
		const page = await context.newPage();
		await page.goto("/portfolio", { waitUntil: "networkidle" });

		await page.locator(selector("clockright")).click();
		// Pousou em Salt Lake City: as voltas usam a rota de Fortaleza.
		await expect
			.poll(() => journeyState(page), { timeout: 8_000 })
			.toMatchObject({ from: "fortaleza", transfer: 0 });

		await page.locator(selector("central-clube-livro")).click();
		await expect
			.poll(() => journeyState(page))
			.toEqual({ from: "previous", transfer: 1, route: 1 });
		const angles = await page.evaluate(() => ({
			transfer: Number.parseFloat(
				getComputedStyle(
					document.querySelector("[data-world-journey-transfer-route]")!
				).getPropertyValue("--route-angle")
			),
			route: Number.parseFloat(
				getComputedStyle(
					document.querySelector("[data-world-journey-route]")!
				).getPropertyValue("--route-angle")
			),
		}));
		// De Salt Lake City para Coimbra o avião vai para o leste (quase 0°); a
		// rota que fica, de Fortaleza, sobe para o nordeste.
		expect(Math.abs(angles.transfer)).toBeLessThan(15);
		expect(angles.route).toBeLessThan(-30);

		// Depois do pouso a linha da conexão sai e fica só Fortaleza → Coimbra.
		await expect
			.poll(() => journeyState(page), { timeout: 8_000 })
			.toEqual({ from: "fortaleza", transfer: 0, route: 1 });
		await context.close();
	});
}
