import { expect, test } from "@playwright/test";

const referenceViewports = [
	{ name: "720p", width: 1366, height: 720 },
	{ name: "1080p", width: 1920, height: 1080 },
	{ name: "square", width: 1080, height: 1080 },
] as const;

test("reduces the visible neck through framing without changing the portrait", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1366, height: 720 });
	await page.goto("/home");

	const portrait = page.locator('img[data-hero-option="6"]');
	await expect(portrait).toBeVisible();
	await expect(portrait).toHaveAttribute(
		"data-hero-crop",
		"css-neck-reduction"
	);
	await expect(portrait).toHaveAttribute("data-hero-source-unchanged", "true");
	await expect(page.locator('[data-hero-crop-frame="true"]')).toBeVisible();

	const framing = await portrait.evaluate((image: HTMLImageElement) => {
		const transform = new DOMMatrixReadOnly(getComputedStyle(image).transform);
		const stage = image.closest('[data-mateus-hero-root="true"]') as HTMLElement;
		return {
			currentSrc: image.currentSrc,
			naturalWidth: image.naturalWidth,
			naturalHeight: image.naturalHeight,
			scale: transform.a,
			transformOrigin: getComputedStyle(image).transformOrigin,
			stageClientHeight: stage.clientHeight,
			stageScrollHeight: stage.scrollHeight,
		};
	});
	expect(framing.currentSrc).toMatch(/hero-cinema-vote-6[^/]*\.webp(?:$|\?)/);
	expect(framing.naturalWidth).toBe(1672);
	expect(framing.naturalHeight).toBe(941);
	expect(framing.scale).toBeGreaterThanOrEqual(1.05);
	expect(framing.transformOrigin).not.toBe("50% 50%");
	expect(framing.stageScrollHeight).toBeLessThanOrEqual(framing.stageClientHeight);
});

for (const viewport of referenceViewports) {
	test.describe(viewport.name, () => {
		test.use({ viewport });

		test("keeps the desktop home typography and primary action scale", async ({
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

			const primaryAction = page.getByRole("link", {
				name: "Open meeting link",
			});
			await expect(primaryAction).toBeVisible();
			const actionBox = await primaryAction.boundingBox();
			expect(actionBox).not.toBeNull();
			expect(actionBox!.height).toBeLessThanOrEqual(viewport.height * 0.08);
		});

		test("keeps the live marquee and animated globe", async ({ page }) => {
			await page.goto("/live");
			await expect(page.locator("main[data-landing-viewport]")).toHaveAttribute(
				"data-active-section",
				"live",
				{ timeout: 15_000 }
			);

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
