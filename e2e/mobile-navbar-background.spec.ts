import { expect, test } from "@playwright/test";

const mobileViewports = [
	{ width: 320, height: 568 },
	{ width: 360, height: 640 },
	{ width: 390, height: 844 },
	{ width: 430, height: 932 },
] as const;

test("mantém o cabeçalho transparente sobre o papel da página inicial", async ({
	browser,
}) => {
	const baseURL = test.info().project.use.baseURL as string;

	for (const viewport of mobileViewports) {
		await test.step(`${viewport.width}x${viewport.height}`, async () => {
			const context = await browser.newContext({
				viewport,
				deviceScaleFactor: 2,
				isMobile: true,
			});
			const page = await context.newPage();
			await page.goto(new URL("/home", baseURL).toString(), {
				waitUntil: "networkidle",
			});

			const navbar = page.locator("nav.navbar");
			const pageContent = page.locator('[data-mobile-page-content="true"]');
			await expect(navbar).toBeVisible();
			await expect(pageContent).toBeVisible();

			const styles = await page.evaluate(() => {
				const navbarElement = document.querySelector("nav.navbar");
				const pageContentElement = document.querySelector(
					'[data-mobile-page-content="true"]'
				);
				if (!(navbarElement instanceof HTMLElement)) return null;
				if (!(pageContentElement instanceof HTMLElement)) return null;
				const navbarStyle = getComputedStyle(navbarElement);
				const pageContentStyle = getComputedStyle(pageContentElement);
				return {
					navbarBackground: navbarStyle.backgroundColor,
					navbarBackgroundImage: navbarStyle.backgroundImage,
					navbarBackdrop: navbarStyle.backdropFilter,
					navbarShadow: navbarStyle.boxShadow,
					pageBackground: pageContentStyle.backgroundColor,
					pageBackgroundImage: pageContentStyle.backgroundImage,
					pageTop: pageContentElement.getBoundingClientRect().top,
				};
			});

			expect(styles?.navbarBackground).toBe("rgba(0, 0, 0, 0)");
			expect(styles?.navbarBackgroundImage).toBe("none");
			expect(styles?.navbarBackdrop).toBe("none");
			expect(styles?.navbarShadow).toBe("none");
			expect(styles?.pageBackground).toBe("rgb(244, 239, 229)");
			expect(styles?.pageBackgroundImage).toContain("radial-gradient");
			expect(styles?.pageBackgroundImage).toContain("linear-gradient");
			expect(styles?.pageTop).toBe(0);

			const homeRoot = page.locator("[data-mobile-editorial-home]");
			await expect(homeRoot).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
			await context.close();
		});
	}
});
