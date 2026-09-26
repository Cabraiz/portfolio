import { expect, test } from "@playwright/test";

test.describe.configure({ mode: "serial" });

const routes = [
	["/home", "home"],
	["/portfolio", "portfolio"],
	["/servicos", "roadMap"],
	["/technologies", "technologies"],
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

		test("keeps the legacy live section out of navigation and scroll flow", async ({
			page,
		}) => {
			await page.goto("/technologies");
			await expect(page.locator("main[data-landing-viewport]")).toHaveAttribute(
				"data-active-section",
				"technologies",
				{ timeout: 15_000 }
			);
			await expect(page.locator("section#live")).toHaveCount(0);
			await expect(page.getByRole("button", { name: "Ao Vivo" })).toHaveCount(0);
			await expect(
				page.locator('[data-rede-ia-live-indicator="true"]')
			).toHaveCount(viewport.name === "desktop" ? 1 : 0);
		});
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

test("legacy live stays hidden and redirects to technologies", async ({
	page,
}) => {
	await page.goto("/live");
	await expect(page).toHaveURL(/\/technologies$/, { timeout: 15_000 });
	await expect(page.locator("main[data-landing-viewport]")).toHaveAttribute(
		"data-active-section",
		"technologies",
		{ timeout: 15_000 }
	);
});
