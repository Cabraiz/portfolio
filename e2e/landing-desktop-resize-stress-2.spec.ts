import { expect, test } from "@playwright/test";
import {
	SECTION_IDS,
	SIZES,
	readLandingSnapshot,
	expectSettled,
	openLanding,
	clickSection,
	wheel,
	wheelGesture,
	createRandom,
	type SectionId,
} from "./support/landingDesktopResize";

// Continuação de landing-desktop-resize-stress.spec.ts (mesmo contrato do desktop).

test("teclado anda uma seção por tecla", async ({ page }) => {
	await openLanding(page, SIZES[1]);

	const steps = [
		["PageDown", "portfolio"],
		["ArrowDown", "portfolio"],
		["ArrowUp", "home"],
		["Space", "portfolio"],
		["Shift+Space", "home"],
		["ArrowDown", "portfolio"],
		["PageUp", "home"],
	] as const;

	for (const [key, sectionId] of steps) {
		await page.keyboard.press(key);
		await expectSettled(page, `tecla ${key}`, sectionId);
	}
});

test("rolar dentro do chat não pagina a landing", async ({ page }) => {
	await openLanding(page, SIZES[3]);
	await page.getByRole("button", { name: "Abrir chat" }).click();
	const panel = page.locator("[data-chat-panel]");
	await expect(panel).toBeVisible();

	// Para baixo a landing sairia do Início se a roda vazasse do painel.
	const box = (await panel.boundingBox())!;
	await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
	for (let tick = 0; tick < 6; tick += 1) {
		await page.mouse.wheel(0, tick % 2 ? -300 : 300);
	}
	await page.waitForTimeout(1_000);
	await expectSettled(page, "landing parada com o chat aberto", "home");
});

test("clicar no menu durante a paginação navega mesmo assim", async ({
	page,
}) => {
	await openLanding(page, SIZES[3]);

	// Quatro tiques começam a passagem e o clique no menu a substitui.
	for (const [direction, target] of [
		[100, "home"],
		[100, "portfolio"],
		[-100, "home"],
	] as const) {
		await wheelGesture(page, 4, direction, 60);
		await page.waitForFunction(
			() => document.documentElement.hasAttribute("data-landing-scroll-target"),
			null,
			{ timeout: 3_000 }
		);
		await page.waitForTimeout(150);
		await clickSection(page, target);
		await expectSettled(
			page,
			`clique em ${target} durante a paginação`,
			target
		);
	}
});

test("interromper uma navegação com a roda não deixa alvo pendente", async ({
	page,
}) => {
	await openLanding(page, SIZES[1]);
	await clickSection(page, "portfolio");
	await page.waitForTimeout(150);
	await wheel(page, -200, 2);
	await expect(page.locator("html")).not.toHaveAttribute(
		"data-landing-scroll-target",
		/.+/
	);

	await page.waitForTimeout(1_500);
	const scrollBeforeBlur = await page.evaluate(() => window.scrollY);
	await page.evaluate(() => window.dispatchEvent(new Event("blur")));
	await page.waitForTimeout(200);
	await page.evaluate(() => window.dispatchEvent(new Event("focus")));
	await page.waitForTimeout(500);

	// Voltar o foco não pode reaplicar o alvo antigo (portfólio).
	expect(
		Math.abs((await page.evaluate(() => window.scrollY)) - scrollBeforeBlur)
	).toBeLessThanOrEqual(2);
});

for (const size of [SIZES[3], SIZES[0]]) {
	test(`nenhuma seção pinta por cima da anterior ao rolar devagar em ${size.width}x${size.height}`, async ({
		page,
	}) => {
		test.setTimeout(120_000);
		await openLanding(page, size);

		// Desce e sobe em passos curtos, esperando a seção ativa assentar: a
		// borda visível entre duas seções tem que acompanhar o scroll, sem
		// camadas (fundo, textura, mapa) invadindo a seção de cima.
		const intrusions = await page.evaluate(async () => {
			const sections = Array.from(
				document.querySelectorAll<HTMLElement>(
					"main[data-landing-viewport='desktop'] > section[data-page-section='true']"
				)
			);
			const paints = (element: Element): boolean => {
				const style = getComputedStyle(element);
				if (
					style.visibility === "hidden" ||
					style.display === "none" ||
					Number(style.opacity) === 0
				) {
					return false;
				}
				return (
					element.tagName === "IMG" ||
					element.tagName === "CANVAS" ||
					style.backgroundImage !== "none" ||
					!/rgba\(0, 0, 0, 0\)|transparent/.test(style.backgroundColor)
				);
			};
			const isClippedAbove = (
				element: Element,
				section: HTMLElement,
				edge: number
			): boolean => {
				for (
					let parent = element.parentElement;
					parent && parent !== section.parentElement;
					parent = parent.parentElement
				) {
					const style = getComputedStyle(parent);
					if (
						style.overflowY !== "visible" &&
						parent.getBoundingClientRect().top >= edge - 2
					) {
						return true;
					}
				}
				return false;
			};

			const found = new Set<string>();
			const maxScroll =
				document.documentElement.scrollHeight - window.innerHeight;
			const step = Math.round(window.innerHeight / 12);
			const positions: number[] = [];
			for (let y = 0; y <= maxScroll; y += step) positions.push(y);
			for (let y = maxScroll; y >= 0; y -= step) positions.push(y);

			for (const y of positions) {
				window.scrollTo(0, y);
				await new Promise((resolve) => setTimeout(resolve, 260));

				sections.slice(1).forEach((section) => {
					const edge = section.getBoundingClientRect().top;
					if (edge < 4 || edge > window.innerHeight - 4) return;

					section.querySelectorAll("*").forEach((element) => {
						const rect = element.getBoundingClientRect();
						if (
							rect.width < 40 ||
							rect.top >= edge - 2 ||
							rect.bottom <= edge - 2
						) {
							return;
						}
						if (!paints(element) || isClippedAbove(element, section, edge)) {
							return;
						}
						found.add(
							`${section.id}: ${element.tagName}.${String(element.className).split(" ")[0]} invade ${Math.round(edge - rect.top)}px`
						);
					});
				});
			}

			return Array.from(found);
		});

		expect(intrusions).toEqual([]);
	});
}

for (const seed of [11, 23, 37]) {
	test(`sequência aleatória de roda, teclado, menu e resize (seed ${seed})`, async ({
		page,
	}) => {
		test.setTimeout(240_000);
		const random = createRandom(seed);
		const pick = <T>(items: readonly T[]): T =>
			items[Math.floor(random() * items.length)];
		const errors = await openLanding(page, pick(SIZES), pick(SECTION_IDS));
		const steps: string[] = [];

		for (let step = 0; step < 25; step += 1) {
			const roll = random();

			if (roll < 0.3) {
				const sectionId = pick(SECTION_IDS);
				steps.push(`clique ${sectionId}`);
				await clickSection(page, sectionId);
				await expectSettled(page, steps.join(" → "), sectionId);
				continue;
			}

			if (roll < 0.55) {
				const delta = pick([-1, 1]) * pick([100, 240, 400]);
				const times = 1 + Math.floor(random() * 5);
				steps.push(`roda ${times}x${delta}`);
				await wheel(page, delta, times);
				await page.waitForTimeout(400);
				await expectSettled(page, steps.join(" → "));
				continue;
			}

			if (roll < 0.65) {
				const key = pick(["PageDown", "PageUp", "ArrowDown", "Space"]);
				steps.push(`tecla ${key}`);
				await page.keyboard.press(key);
				await page.waitForTimeout(400);
				await expectSettled(page, steps.join(" → "));
				continue;
			}

			const before = await readLandingSnapshot(page);
			const size = pick(SIZES);
			steps.push(`resize ${size.width}x${size.height}`);
			await page.setViewportSize(size);
			await expectSettled(
				page,
				steps.join(" → "),
				before.activeTop === 0 && before.violations.length === 0
					? (before.activeSectionId as SectionId)
					: undefined
			);
		}

		expect(errors).toEqual([]);
	});
}
