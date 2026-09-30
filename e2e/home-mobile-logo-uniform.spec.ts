import { expect, test } from "@playwright/test";
for (const viewport of [
	{ width: 273, height: 431 },
	{ width: 381, height: 539 },
	{ width: 390, height: 844 },
	{ width: 667, height: 375 },
]) {
	test(`desce uniformemente e empurra cinco segmentos ${viewport.width}x${viewport.height}`, async ({
		browser,
	}) => {
		const context = await browser.newContext({
			viewport,
			isMobile: true,
			hasTouch: true,
		});
		const page = await context.newPage();
                await page.goto(
			new URL("/home", test.info().project.use.baseURL).toString(),
                        { waitUntil: "networkidle" }
                );
                // User input releases the initial reload alignment before measuring scroll.
                await page.mouse.wheel(0, 1);
                await page.waitForTimeout(120);
                const height = await page
			.locator("[data-mobile-editorial-home]")
			.evaluate((el) => el.getBoundingClientRect().height);
		const samples = [];
		for (const p of [0.11, 0.13, 0.15, 0.17, 0.19, 0.21, 0.23, 0.25]) {
			await page.evaluate(
				(y) => scrollTo({ top: y, behavior: "instant" }),
				height * p
			);
			await page.waitForTimeout(550);
			samples.push(
				await page
					.locator('[data-mobile-brand-pusher="true"]')
					.evaluate((el) => ({
						scroll: scrollY,
						y: new DOMMatrixReadOnly(getComputedStyle(el).transform).m42,
					}))
			);
		}
		const speeds = samples
			.slice(1)
			.map((s, i) => (s.y - samples[i].y) / (s.scroll - samples[i].scroll));
		expect(
			Math.max(...speeds) / Math.min(...speeds),
			JSON.stringify({ samples, speeds })
		).toBeLessThan(1.12);
		const lines = page.locator("[data-mobile-intro-line]");
		await expect(lines).toHaveCount(5);
		expect(
			await lines.evaluateAll((els) => els.map((el) => el.textContent?.trim()))
		).toEqual([
			"Transformando",
			"ideias em",
			"produtos reais,",
			"do código ao",
			"impacto.",
		]);
		await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
		await page.waitForTimeout(700);
		for (const p of [0.15, 0.17, 0.19, 0.21, 0.23, 0.25, 0.32, 0.4]) {
			await page.evaluate(
				(y) => scrollTo({ top: y, behavior: "instant" }),
				height * p
			);
			await page.waitForTimeout(500);
			const rows = await lines.evaluateAll((els) =>
				els.map((el) => ({
					x: new DOMMatrixReadOnly(getComputedStyle(el).transform).m41,
					opacity: Number(getComputedStyle(el).opacity),
				}))
			);
			expect(
				rows.every((r) => r.opacity === 1 && r.x >= -0.5 && r.x <= 66.5)
			).toBe(true);
		}
		await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
		await page.waitForTimeout(850);
		expect(
			await lines.evaluateAll((els) =>
				els.every(
					(el) =>
						Math.abs(
							new DOMMatrixReadOnly(getComputedStyle(el).transform).m41
						) <= 0.5
				)
			)
		).toBe(true);
		await context.close();
	});
}
