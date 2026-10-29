import { expect, test, type Page } from "@playwright/test";

/**
 * Orçamento de peso da landing. Antes destes limites a /home baixava
 * ~15 MB no desktop e ~30 MB no mobile (PNGs de até 2,5 MB exibidos a ~100 px
 * e a placa animada de serviços de ~6 MB), o que travava o carregamento.
 */
const HOME_IMAGE_BUDGET_BYTES = 4.5 * 1024 * 1024;
const SINGLE_IMAGE_BUDGET_BYTES = 1024 * 1024;
const ANIMATED_SIGN =
	/services-front-wall-rail-lag-arthur-104frames[^/]*\.webp/;

const viewports = [
	{ name: "desktop", width: 1440, height: 900, isMobile: false },
	{ name: "mobile", width: 390, height: 844, isMobile: true },
] as const;

type LoadedImage = Readonly<{ url: string; bytes: number }>;

function trackImages(page: Page): LoadedImage[] {
	const images: LoadedImage[] = [];

	page.on("requestfinished", async (request) => {
		if (
			request.resourceType() !== "image" ||
			request.url().startsWith("data:")
		) {
			return;
		}

		const sizes = await request.sizes().catch(() => null);
		images.push({ url: request.url(), bytes: sizes?.responseBodySize ?? 0 });
	});

	return images;
}

function sumBytes(images: readonly LoadedImage[]): number {
	return images.reduce((total, image) => total + image.bytes, 0);
}

async function showSection(page: Page, sectionId: string): Promise<void> {
	await page
		.locator(`section[data-page-section='true']#${sectionId}`)
		.evaluate((element) => {
			element.scrollIntoView({ behavior: "instant", block: "start" });
		});
	await expect(page.locator("main[data-landing-viewport]")).toHaveAttribute(
		"data-active-section",
		sectionId,
		{ timeout: 6_000 }
	);
}

for (const viewport of viewports) {
	test(`home stays within the image budget on ${viewport.name}`, async ({
		browser,
	}) => {
		const context = await browser.newContext({
			viewport: { width: viewport.width, height: viewport.height },
			isMobile: viewport.isMobile,
			hasTouch: viewport.isMobile,
			locale: "pt-BR",
			serviceWorkers: "block",
		});
		const page = await context.newPage();
		const externalStylesheets: string[] = [];
		page.on("request", (request) => {
			if (
				request.resourceType() === "stylesheet" &&
				!request.url().startsWith("http://127.0.0.1")
			) {
				externalStylesheets.push(request.url());
			}
		});
		const images = trackImages(page);

		await page.goto("/home", { waitUntil: "load" });
		await page.waitForLoadState("networkidle");

		expect(externalStylesheets).toEqual([]);
		expect(images.filter((image) => ANIMATED_SIGN.test(image.url))).toEqual([]);
		expect(
			images.filter((image) => image.bytes > SINGLE_IMAGE_BUDGET_BYTES)
		).toEqual([]);
		expect(sumBytes(images)).toBeLessThan(HOME_IMAGE_BUDGET_BYTES);

		await context.close();
	});

	// A landing tem só Início e Portfólio: Serviços nunca carrega.
	test(`services never load on ${viewport.name} (only Home and Portfolio)`, async ({
		browser,
	}) => {
		const context = await browser.newContext({
			viewport: { width: viewport.width, height: viewport.height },
			isMobile: viewport.isMobile,
			hasTouch: viewport.isMobile,
			locale: "pt-BR",
			serviceWorkers: "block",
		});
		const page = await context.newPage();
		const images = trackImages(page);

		await page.goto("/home", { waitUntil: "load" });
		await showSection(page, "portfolio");
		await page.waitForLoadState("networkidle");

		await expect(page.locator("[data-services-root]")).toHaveCount(0);
		expect(images.filter((image) => ANIMATED_SIGN.test(image.url))).toEqual([]);
		await context.close();
	});
}

test("no landing image outside the animated sign exceeds 1 MB", async ({
	browser,
}) => {
	test.setTimeout(90_000);

	for (const viewport of viewports) {
		const context = await browser.newContext({
			viewport: { width: viewport.width, height: viewport.height },
			isMobile: viewport.isMobile,
			hasTouch: viewport.isMobile,
			locale: "pt-BR",
			serviceWorkers: "block",
		});
		const page = await context.newPage();
		const images = trackImages(page);

		await page.goto("/home", { waitUntil: "load" });
		const sectionIds = await page.$$eval(
			"section[data-page-section='true']",
			(sections) => sections.map((section) => section.id)
		);

		for (const sectionId of sectionIds) {
			await showSection(page, sectionId);
			await page.waitForLoadState("networkidle");
		}

		expect(
			images
				.filter((image) => !ANIMATED_SIGN.test(image.url))
				.filter((image) => image.bytes > SINGLE_IMAGE_BUDGET_BYTES)
				.map((image) => `${viewport.name}: ${image.url} (${image.bytes} B)`)
		).toEqual([]);

		await context.close();
	}
});
