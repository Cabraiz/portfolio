import { expect, test } from "@playwright/test";

test.describe.configure({ mode: "serial" });

const routes = [
	["/home", "home"],
	["/portfolio", "portfolio"],
	["/servicos", "roadMap"],
	["/technologies", "technologies"],
	["/live", "live"],
	["/contact", "contact"],
] as const;

for (const viewport of [
	{ name: "desktop", width: 1366, height: 720 },
	{ name: "mobile", width: 390, height: 844 },
]) {
	test.describe(viewport.name, () => {
		test.use({ viewport });

		for (const [route, sectionId] of routes) {
			test(`${route} opens its section without mounting the whole site`, async ({
				page,
			}) => {
				await page.goto(route);

				const landing = page.locator("main[data-landing-viewport]");
				await expect(landing).toHaveAttribute(
					"data-active-section",
					sectionId,
					{
						timeout: 15_000,
					}
				);
				await expect(
					page.locator(`section[data-page-section='true']#${sectionId}`)
				).toHaveAttribute("data-section-mounted", "true");

				const mountedCount = await page
					.locator(
						"section[data-page-section='true'][data-section-mounted='true']"
					)
					.count();
				expect(mountedCount).toBeLessThan(routes.length);
			});
		}
	});
}

test("legacy pricing route points to technologies", async ({ page }) => {
	await page.goto("/pricing");
	await expect(page).toHaveURL(/\/technologies$/, { timeout: 15_000 });
	await expect(page.locator("main[data-landing-viewport]")).toHaveAttribute(
		"data-active-section",
		"technologies",
		{ timeout: 15_000 }
	);
});
