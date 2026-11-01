import { expect, test } from "@playwright/test";

// Cortina de espera (index.html): cobre a tela enquanto o app não montou a
// estrutura da página, inclusive o HTML pré-renderizado, e sobe depois.
for (const viewport of [
	{ name: "celular", width: 390, height: 844, isMobile: true, path: "/en/home/" },
	{ name: "desktop", width: 1366, height: 768, isMobile: false, path: "/es/portfolio/" },
]) {
	test(`cortina cobre a espera e sobe no ${viewport.name}`, async ({ browser }) => {
		const context = await browser.newContext({
			viewport: { width: viewport.width, height: viewport.height },
			isMobile: viewport.isMobile,
			hasTouch: viewport.isMobile,
		});
		const page = await context.newPage();
		let release!: () => void;
		const gate = new Promise<void>((resolve) => {
			release = resolve;
		});
		await page.route(
			/\/(?:assets\/)?(?:LandingRouterPage|HomeMobile|HomeDesktop|AppMobile|AppDesktop)(?:-[\w-]+)?\.(?:js|css|tsx)(?:\?.*)?$/,
			async (route) => {
				await gate;
				await route.continue();
			}
		);
		await page.goto(viewport.path, { waitUntil: "commit" });

		const curtain = page.locator("#boot-curtain");
		await expect(curtain).toBeVisible();
		await expect(curtain).not.toHaveAttribute("data-lifted", /.*/);
		const box = await curtain.boundingBox();
		expect(box?.width).toBeCloseTo(viewport.width, 0);
		expect(box?.height).toBeCloseTo(viewport.height, 0);

		release();
		await page.unrouteAll({ behavior: "wait" });
		await expect(page.locator("main[data-landing-viewport]")).toBeAttached({ timeout: 15_000 });
		await expect(curtain).toHaveCount(0, { timeout: 5_000 });
		await context.close();
	});
}
