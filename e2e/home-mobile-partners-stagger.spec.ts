import { expect, test } from "@playwright/test";

const mobileViewports = [
	{ width: 273, height: 431 },
	{ width: 320, height: 568 },
	{ width: 381, height: 539 },
	{ width: 360, height: 640 },
	{ width: 390, height: 844 },
	{ width: 430, height: 932 },
] as const;

type PartnerState = {
	id: string;
	opacity: number;
	x: number;
	right: number;
	left: number;
	gap: number;
};

type PartnerProbe = {
	firstContact: Record<string, number>;
	isolatedPushPhases: boolean[];
};
type ProbeWindow = Window & { __mobilePartnerProbe: PartnerProbe };

const readPartnerStates = async (
	page: import("@playwright/test").Page
): Promise<PartnerState[]> =>
	page.locator("[data-mobile-partner-item]").evaluateAll((elements) => {
		const logo = document.querySelector('[data-mobile-brand-pusher="true"]')!;
		return elements.map((element) => {
			const style = getComputedStyle(element);
			const matrix = new DOMMatrixReadOnly(style.transform);
			return {
				id: element.getAttribute("data-mobile-partner-item") ?? "",
				opacity: Number.parseFloat(style.opacity),
				x: matrix.m41,
				right: element.getBoundingClientRect().right,
				left: element.getBoundingClientRect().left,
				gap:
					element.getBoundingClientRect().top -
					logo.getBoundingClientRect().bottom,
			};
		});
	});

for (const viewport of mobileViewports) {
	test(`empurra clientes e parceiros levemente e individualmente durante o scroll ${viewport.width}x${viewport.height}`, async ({
		browser,
	}) => {
		test.setTimeout(60_000);
		const baseURL = test.info().project.use.baseURL as string;

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

		await page.evaluate(() => {
			const probe: PartnerProbe = {
				firstContact: {},
				isolatedPushPhases: [false, false, false, false],
			};
			(window as ProbeWindow).__mobilePartnerProbe = probe;
			const sample = () => {
				const logo = document
					.querySelector('[data-mobile-brand-pusher="true"]')!
					.getBoundingClientRect();
				const states = Array.from(
					document.querySelectorAll("[data-mobile-partner-item]"),
					(item) => {
						const style = getComputedStyle(item);
						return {
							id: item.getAttribute("data-mobile-partner-item")!,
							x: new DOMMatrixReadOnly(style.transform).m41,
							opacity: Number(style.opacity),
							gap: item.getBoundingClientRect().top - logo.bottom,
						};
					}
				);
				for (const state of states) {
					if (state.x > 0.5 && !(state.id in probe.firstContact))
						probe.firstContact[state.id] = state.gap;
				}
				states.forEach((state, index) => {
					if (
						states.slice(0, index).every((item) => item.x >= 39.5) &&
						state.x > 0.5 &&
						state.x < 39.5 &&
						states.every((item) => item.opacity >= 0.99) &&
						states
							.slice(index + 1)
							.every((item) => item.opacity >= 0.97 && Math.abs(item.x) <= 0.5)
					)
						probe.isolatedPushPhases[index] = true;
				});
				if (probe.isolatedPushPhases.some((phase) => !phase))
					requestAnimationFrame(sample);
			};
			requestAnimationFrame(sample);
		});
		let isolatedPushPhases = [false, false, false, false];
		for (
			let step = 0;
			step < 160 && isolatedPushPhases.some((phase) => !phase);
			step += 1
		) {
			await page.mouse.wheel(0, 4);
			await page.waitForTimeout(90);
			const states = await readPartnerStates(page);
			const probe = await page.evaluate(
				() => (window as ProbeWindow).__mobilePartnerProbe
			);
			isolatedPushPhases = probe.isolatedPushPhases;
			for (const [id, gap] of Object.entries(probe.firstContact)) {
				expect(
					gap,
					`${id} foi empurrado antes da logo se aproximar`
				).toBeLessThanOrEqual(13);
			}
			for (const state of states) {
				expect(state.opacity, `${state.id} não pode desaparecer`).toBe(1);
				expect(state.x).toBeGreaterThanOrEqual(-0.5);
				expect(
					state.x,
					`${state.id} atravessou a tela em vez de receber um pequeno empurrão`
				).toBeLessThanOrEqual(40.5);
			}
		}

		expect(
			isolatedPushPhases,
			"LinkedIn, Gmail, Claude e Codex devem receber um empurrão individual"
		).toEqual([true, true, true, true]);

		let finalState = await readPartnerStates(page);
		for (
			let step = 0;
		step < 12 && finalState.some(({ x }) => x < 39.5);
			step += 1
		) {
			await page.mouse.wheel(0, 24);
			await page.waitForTimeout(145);
			finalState = await readPartnerStates(page);
		}

		expect(finalState.every(({ opacity }) => opacity === 1)).toBe(true);
		expect(
			finalState.every(
				({ x, left, right }) =>
					x >= 39.5 && x <= 40.5 && left >= 0 && right <= viewport.width
			)
		).toBe(true);
		await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
		await page.waitForTimeout(900);
		const restored = await readPartnerStates(page);
		expect(
			restored.every(({ opacity, x }) => opacity >= 0.99 && Math.abs(x) <= 0.5)
		).toBe(true);
		await context.close();
	});
}

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
