import { expect, test } from "@playwright/test";

for (const viewport of [
	{ width: 273, height: 431 },
	{ width: 320, height: 568 },
	{ width: 381, height: 539 },
	{ width: 360, height: 640 },
	{ width: 390, height: 844 },
	{ width: 430, height: 932 },
	{ width: 568, height: 320 },
	{ width: 667, height: 375 },
]) {
        test(`desce livre da Home ao Portfólio sem reiniciar ${viewport.width}x${viewport.height}`, async ({
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
                await page.locator('[data-section="portfolio"]').waitFor();
                await page.mouse.wheel(0, 1);
                await page.waitForTimeout(120);
		const height = await page
			.locator("[data-mobile-editorial-home]")
			.evaluate((el) => el.getBoundingClientRect().height);
                const samples: Array<{p: number; top: number}> = [];
                for (const p of [0.3, 0.4, 0.5, 0.6, 0.7, 0.9, 1, 1.1, 1.2, 1.1, 1, 0.7, 0.6, 0.5, 0.4]) {
			await page.evaluate(
				(y) => scrollTo({ top: y, behavior: "instant" }),
				height * p
			);
                        await page.waitForTimeout(160);
			const result = await page.evaluate(() => {
				const el = document.querySelector<HTMLElement>(
					'[data-mobile-brand-pusher="true"]'
				)!;
				const logo = el.getBoundingClientRect();
				const actions = document
					.querySelector('nav[aria-label="Ações de contato"]')!
					.getBoundingClientRect();
				const nav = document
					.querySelector("nav.navbar")!
					.getBoundingClientRect();
				const restBottom =
					logo.bottom -
					new DOMMatrixReadOnly(getComputedStyle(el).transform).m42;
				return {
					top: logo.top,
					bottom: logo.bottom,
					restBottom,
					actionsTop: actions.top,
					navBottom: nav.bottom,
					owner: el.dataset.mobileBrandOwner,
					opacity: Number(getComputedStyle(el).opacity),
				};
			});
			expect(result.opacity).toBe(1);
			expect(result.top).toBeGreaterThanOrEqual(0);
			expect(result.bottom).toBeLessThanOrEqual(viewport.height);
                        const previous = samples.at(-1);
                        if (previous && p > previous.p) expect(result.top).toBeGreaterThanOrEqual(previous.top - .5);
                        if (previous && p < previous.p) expect(result.top).toBeLessThanOrEqual(previous.top + .5);
                        if (p >= 1) expect(result.owner).toBe("portfolio");
                        samples.push({p, top: result.top});
                }
                expect(Math.max(...samples.map(s => s.top)) - Math.min(...samples.map(s => s.top))).toBeGreaterThan(40);
		await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
		await page.waitForTimeout(850);
		const logo = page.locator('[data-mobile-brand-pusher="true"]');
		expect(
			await logo.evaluate(
				(el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m42
			)
		).toBeCloseTo(0, 0);
		expect(
			await page
				.locator("[data-mobile-partner-item]")
				.evaluateAll((items) =>
					items.every(
						(el) =>
							Number(getComputedStyle(el).opacity) === 1 &&
							Math.abs(
								new DOMMatrixReadOnly(getComputedStyle(el).transform).m41
							) < 0.5
					)
				)
		).toBe(true);
		await context.close();
	});
}
