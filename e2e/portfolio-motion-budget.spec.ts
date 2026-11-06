import { expect, test } from "@playwright/test";

// O avião do mapa precisa rodar só no compositor (GPU): se animar `left`,
// variáveis CSS ou filtros, ele trava sempre que a troca de projeto ocupa a
// thread principal. E nada fora da tela pode ficar animando por JS.
test("avião anima só transform/opacity e o Início para fora da tela", async ({
	browser,
}) => {
	test.setTimeout(60_000);
	const context = await browser.newContext({
		viewport: { width: 1440, height: 900 },
	});
	const page = await context.newPage();
	await page.goto("/portfolio", { waitUntil: "networkidle" });
	await page.locator('aside button[data-project-id="clockright"]').click();

	const planeProps = await page.evaluate(() => {
		const traveler = document.querySelector("[data-world-journey-traveler]")!;
		return document
			.getAnimations()
			.filter((animation) => {
				const target = (animation.effect as KeyframeEffect | null)?.target;
				return target instanceof Element && traveler.contains(target);
			})
			.flatMap((animation) =>
				(animation.effect as KeyframeEffect)
					.getKeyframes()
					.flatMap((frame) => Object.keys(frame))
			)
			.filter(
				(key) =>
					!["offset", "computedOffset", "easing", "composite"].includes(key)
			);
	});
	expect(planeProps.length).toBeGreaterThan(0);
	expect([...new Set(planeProps)].sort()).toEqual(["opacity", "transform"]);

	// Início fora da tela (encostado em cima): depois que a rolagem assenta
	// (o scrub da saída do Início leva ~0,6 s) e o avião pousa, os brilhos e o
	// idle do herói não podem seguir mudando estilos por JS.
	await expect
		.poll(
			() =>
				page
					.locator("[data-world-journey-traveler]")
					.getAttribute("data-world-journey-from"),
			{ timeout: 8_000 }
		)
		.toBe("fortaleza");
	await page.waitForTimeout(800);
	const homeMutations = await page.evaluate(
		() =>
			new Promise<number>((resolve) => {
				const home = document.getElementById("home")!;
				let count = 0;
				const observer = new MutationObserver((records) => {
					count += records.length;
				});
				observer.observe(home, {
					attributes: true,
					attributeFilter: ["style"],
					subtree: true,
				});
				setTimeout(() => {
					observer.disconnect();
					resolve(count);
				}, 1500);
			})
	);
	expect(homeMutations).toBeLessThanOrEqual(2);
	await context.close();
});
