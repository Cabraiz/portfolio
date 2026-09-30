import { expect, test } from "@playwright/test";

const landingRoutes = [
	{ id: "home", path: "/home" },
	{ id: "portfolio", path: "/portfolio" },
	{ id: "roadMap", path: "/servicos" },
	{ id: "technologies", path: "/technologies" },
	{ id: "contact", path: "/contact" },
] as const;

const homeViewports = [
	{ width: 273, height: 431 },
	{ width: 320, height: 568 },
	{ width: 381, height: 539 },
	{ width: 360, height: 640 },
	{ width: 390, height: 844 },
	{ width: 430, height: 932 },
	{ width: 667, height: 375 },
] as const;

test("usa a altura contratada em todas as seções mobile", async ({
	browser,
}) => {
	test.setTimeout(60_000);
	const baseURL = test.info().project.use.baseURL as string;
	const context = await browser.newContext({
		viewport: { width: 390, height: 844 },
		isMobile: true,
		deviceScaleFactor: 1,
		reducedMotion: "reduce",
	});
	const page = await context.newPage();

	for (const route of landingRoutes) {
		await test.step(route.id, async () => {
			await page.goto(new URL(route.path, baseURL).toString(), {
				waitUntil: "networkidle",
			});
			const section = page.locator(`[data-section="${route.id}"]`);
			await expect(section).toBeVisible();
			const metrics = await page.evaluate((sectionId) => {
				const navbar = document.querySelector("nav.navbar")!;
				const activeSection = document.querySelector(
					`[data-section="${sectionId}"]`
				)!;
				return {
					viewportHeight: innerHeight,
					navbarHeight: navbar.getBoundingClientRect().height,
					sectionHeight: activeSection.getBoundingClientRect().height,
				};
			}, route.id);
				const expectedHeight = route.id === "portfolio" ? metrics.viewportHeight
					: metrics.viewportHeight - metrics.navbarHeight - (route.id === "home" ? 0 : 2);
			expect(Math.abs(metrics.sectionHeight - expectedHeight)).toBeLessThanOrEqual(
				2
			);
		});
	}

	await context.close();
});

test("remove o header fantasma da Home em retrato e paisagem", async ({
	browser,
}) => {
	test.setTimeout(60_000);
	const baseURL = test.info().project.use.baseURL as string;

	for (const viewport of homeViewports) {
		await test.step(`${viewport.width}x${viewport.height}`, async () => {
			const context = await browser.newContext({
				viewport,
				isMobile: true,
				deviceScaleFactor: 1,
				reducedMotion: "reduce",
			});
			const page = await context.newPage();
			await page.goto(new URL("/home", baseURL).toString(), {
				waitUntil: "networkidle",
			});

			const metrics = await page.evaluate(() => {
				const getRect = (selector: string) =>
					document.querySelector(selector)!.getBoundingClientRect();
				const navbar = getRect("nav.navbar");
				const home = getRect("[data-mobile-editorial-home]");
				const hero = getRect("[data-mobile-editorial-home] > section");
				const eyebrow = getRect(
					"[data-mobile-editorial-home] > section > div:first-child"
				);
				const lastPartner = getRect('[data-mobile-partner-item="codex"]');
				const actions = getRect('[aria-label="Ações de contato"]');
				return {
					viewportHeight: innerHeight,
					documentWidth: document.documentElement.scrollWidth,
					viewportWidth: innerWidth,
					navbarBottom: navbar.bottom,
					homeTop: home.top,
					homeBottom: home.bottom,
					homeHeight: home.height,
					heroHeight: hero.height,
					eyebrowTop: eyebrow.top,
					lastPartnerBottom: lastPartner.bottom,
					actionsTop: actions.top,
					actionsBottom: actions.bottom,
				};
			});

			expect(Math.abs(metrics.homeTop - metrics.navbarBottom)).toBeLessThanOrEqual(1);
                        expect(Math.abs(metrics.homeBottom - metrics.viewportHeight)).toBeLessThanOrEqual(1);
			expect(Math.abs(metrics.homeHeight - metrics.heroHeight)).toBeLessThanOrEqual(1);
			expect(metrics.eyebrowTop - metrics.navbarBottom).toBeGreaterThanOrEqual(4);
			expect(metrics.eyebrowTop - metrics.navbarBottom).toBeLessThanOrEqual(14);
			expect(metrics.lastPartnerBottom).toBeLessThanOrEqual(metrics.actionsTop);
			expect(metrics.actionsBottom).toBeLessThanOrEqual(metrics.viewportHeight);
			expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewportWidth);
			await context.close();
		});
	}
});
