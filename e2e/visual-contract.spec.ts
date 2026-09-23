import { expect, test } from "@playwright/test";

const referenceViewports = [
	{ name: "720p", width: 1366, height: 720 },
	{ name: "1080p", width: 1920, height: 1080 },
	{ name: "square", width: 1080, height: 1080 },
] as const;

for (const viewport of referenceViewports) {
	test.describe(viewport.name, () => {
		test.use({ viewport });

		test("keeps the desktop home typography and social icon scale", async ({
			page,
		}) => {
			await page.goto("/home");

			const role = page.locator(".font-sequel");
			await expect(role).toBeVisible();
			const roleStyle = await role.evaluate((element) => {
				const style = getComputedStyle(element);
				return {
					backgroundClip: style.backgroundClip,
					color: style.color,
					fontSize: Number.parseFloat(style.fontSize),
				};
			});

			expect(roleStyle.backgroundClip).toBe("text");
			expect(roleStyle.color).toBe("rgba(0, 0, 0, 0)");
			expect(roleStyle.fontSize).toBeGreaterThan(50);

			const linkedInIcon = page.getByAltText("LinkedIn");
			await expect(linkedInIcon).toBeVisible();
			const iconBox = await linkedInIcon.boundingBox();
			expect(iconBox).not.toBeNull();
			expect(iconBox!.height).toBeLessThanOrEqual(viewport.height * 0.05);
		});

		test("keeps the live marquee and animated globe", async ({ page }) => {
			await page.goto("/live");

			await expect(
				page.locator('[data-live-hero-marquee-viewport="true"]')
			).toBeVisible();
			await expect(
				page.getByText("Rotação viva", { exact: true })
			).toBeVisible();

			const globeCanvas = page.locator("#live canvas").first();
			await expect(globeCanvas).toBeVisible();
			await expect
				.poll(async () => globeCanvas.evaluate((canvas) => canvas.width))
				.toBeGreaterThan(100);
		});
	});
}
