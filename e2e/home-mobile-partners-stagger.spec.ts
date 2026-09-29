import { expect, test } from "@playwright/test";

const mobileViewports = [
	{ width: 320, height: 568 },
	{ width: 360, height: 640 },
	{ width: 390, height: 844 },
	{ width: 430, height: 932 },
] as const;

type PartnerState = {
	id: string;
	opacity: number;
	x: number;
};

const readPartnerStates = async (
	page: import("@playwright/test").Page
): Promise<PartnerState[]> =>
	page.locator("[data-mobile-partner-item]").evaluateAll((elements) =>
		elements.map((element) => {
			const style = getComputedStyle(element);
			const matrix = new DOMMatrixReadOnly(style.transform);
			return {
				id: element.getAttribute("data-mobile-partner-item") ?? "",
				opacity: Number.parseFloat(style.opacity),
				x: matrix.m41,
			};
		})
	);

test("retira clientes e parceiros individualmente durante o scroll", async ({
	browser,
}) => {
	test.setTimeout(60_000);
	const baseURL = test.info().project.use.baseURL as string;

	for (const viewport of mobileViewports) {
		await test.step(`${viewport.width}x${viewport.height}`, async () => {
			const context = await browser.newContext({
				viewport,
				deviceScaleFactor: 1,
				isMobile: true,
				reducedMotion: "no-preference",
			});
			const page = await context.newPage();
			await page.goto(new URL("/home", baseURL).toString(), {
				waitUntil: "networkidle",
			});

			const partnerItems = page.locator("[data-mobile-partner-item]");
			await expect(partnerItems).toHaveCount(4);
			expect(
				await partnerItems.evaluateAll((elements) =>
					elements.map((element) =>
						element.getAttribute("data-mobile-partner-order")
					)
				)
			).toEqual(["1", "2", "3", "4"]);

			const isolatedExitPhases = [false, false, false, false];
			for (
				let step = 0;
				step < 38 && isolatedExitPhases.some((phase) => !phase);
				step += 1
			) {
				await page.mouse.wheel(0, 24);
				await page.waitForTimeout(145);
				const states = await readPartnerStates(page);

				for (let activeIndex = 0; activeIndex < states.length; activeIndex += 1) {
					const previousItemsFinished = states
						.slice(0, activeIndex)
						.every(({ opacity }) => opacity <= 0.03);
					const activeItemIsMoving =
						states[activeIndex].opacity >= 0.08 &&
						states[activeIndex].opacity <= 0.92 &&
						states[activeIndex].x > 0;
					const nextItemsAreStill = states
						.slice(activeIndex + 1)
						.every(({ opacity, x }) => opacity >= 0.97 && Math.abs(x) <= 0.5);

					if (
						previousItemsFinished &&
						activeItemIsMoving &&
						nextItemsAreStill
					) {
						isolatedExitPhases[activeIndex] = true;
					}
				}
			}

			expect(
				isolatedExitPhases,
				"LinkedIn, Gmail, Claude e Codex devem ter uma saída isolada"
			).toEqual([true, true, true, true]);

			let finalState = await readPartnerStates(page);
			for (let step = 0; step < 12 && finalState.some(({ opacity }) => opacity > 0.02); step += 1) {
				await page.mouse.wheel(0, 24);
				await page.waitForTimeout(145);
				finalState = await readPartnerStates(page);
			}

			expect(finalState.every(({ opacity }) => opacity <= 0.02)).toBe(true);
			expect(finalState.every(({ x }) => x >= viewport.width - 26)).toBe(true);
			await context.close();
		});
	}
});

test("mantém os parceiros visíveis quando movimento reduzido está ativo", async ({
	browser,
}) => {
	const baseURL = test.info().project.use.baseURL as string;
	const context = await browser.newContext({
		viewport: { width: 390, height: 844 },
		isMobile: true,
		reducedMotion: "reduce",
	});
	const page = await context.newPage();
	await page.goto(new URL("/home", baseURL).toString(), {
		waitUntil: "networkidle",
	});
	await page.mouse.wheel(0, 650);
	await page.waitForTimeout(350);

	const states = await readPartnerStates(page);
	expect(states.every(({ opacity, x }) => opacity === 1 && x === 0)).toBe(true);
	await context.close();
});
