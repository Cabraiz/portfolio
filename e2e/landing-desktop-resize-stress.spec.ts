import { expect, test, type Page } from "@playwright/test";

/**
 * Contrato do desktop: cada seção tem exatamente a altura da viewport, as
 * seções são contíguas e, depois de navegar ou redimensionar, a seção que
 * estava alinhada continua alinhada no topo. Estes testes misturam roda,
 * teclado, cliques no menu e redimensionamentos (720p <-> 1080p etc.).
 */

const SECTION_IDS = [
	"home",
	"portfolio",
	"roadMap",
	"technologies",
	"contact",
] as const;

type SectionId = (typeof SECTION_IDS)[number];

const SECTION_PATHS: Record<SectionId, string> = {
	home: "/home",
	portfolio: "/portfolio",
	roadMap: "/servicos",
	technologies: "/technologies",
	contact: "/contact",
};

const SIZES = [
	{ width: 1351, height: 630 },
	{ width: 1280, height: 720 },
	{ width: 1366, height: 768 },
	{ width: 1920, height: 1080 },
	{ width: 1920, height: 960 },
	{ width: 1536, height: 864 },
	{ width: 1366, height: 600 },
	{ width: 1440, height: 900 },
] as const;

type Size = (typeof SIZES)[number];

type LandingSnapshot = Readonly<{
	violations: string[];
	activeSectionId: string;
	activeTop: number | null;
}>;

function readLandingSnapshot(page: Page): Promise<LandingSnapshot> {
	return page.evaluate(
		(sectionPaths) => {
			const violations: string[] = [];
			const viewportHeight = window.innerHeight;
			const landing = document.querySelector<HTMLElement>(
				"main[data-landing-viewport='desktop']"
			);
			const sections = Array.from(
				document.querySelectorAll<HTMLElement>(
					"main[data-landing-viewport='desktop'] > section[data-page-section='true']"
				)
			);

			sections.forEach((section, index) => {
				const rect = section.getBoundingClientRect();

				if (Math.abs(rect.height - viewportHeight) > 1) {
					violations.push(
						`${section.id} tem ${Math.round(rect.height)}px numa viewport de ${viewportHeight}px`
					);
				}

				const previous = sections[index - 1]?.getBoundingClientRect();
				if (previous && Math.abs(rect.top - previous.bottom) > 1) {
					violations.push(`${section.id} não encosta na seção anterior`);
				}
			});

			const activeSectionId = landing?.dataset.activeSection ?? "";
			const mostVisible = sections
				.map((section) => {
					const rect = section.getBoundingClientRect();
					return {
						id: section.id,
						visible: Math.max(
							0,
							Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0)
						),
					};
				})
				.sort((left, right) => right.visible - left.visible)[0];

			if (
				mostVisible &&
				mostVisible.id !== activeSectionId &&
				mostVisible.visible > viewportHeight * 0.6
			) {
				violations.push(
					`seção ativa é ${activeSectionId}, mas ${mostVisible.id} ocupa a tela`
				);
			}

			const expectedPath = sectionPaths[activeSectionId];
			if (expectedPath && location.pathname !== expectedPath) {
				violations.push(
					`URL ${location.pathname} não bate com ${activeSectionId}`
				);
			}

			if (
				document.documentElement.scrollWidth >
				document.documentElement.clientWidth
			) {
				violations.push("rolagem horizontal");
			}

			const activeRect = document
				.getElementById(activeSectionId)
				?.getBoundingClientRect();

			return {
				violations,
				activeSectionId,
				activeTop: activeRect ? Math.round(activeRect.top) : null,
			};
		},
		SECTION_PATHS as Record<string, string>
	);
}

async function expectSettled(
	page: Page,
	context: string,
	alignedSectionId?: SectionId
): Promise<void> {
	await expect
		.poll(
			async () => {
				const snapshot = await readLandingSnapshot(page);
				const violations = [...snapshot.violations];
				const pendingTarget = await page
					.locator("html")
					.getAttribute("data-landing-scroll-target");

				if (alignedSectionId) {
					if (snapshot.activeSectionId !== alignedSectionId) {
						violations.push(
							`esperava ${alignedSectionId} ativa, veio ${snapshot.activeSectionId}`
						);
					} else if (Math.abs(snapshot.activeTop ?? Infinity) > 2) {
						violations.push(
							`${alignedSectionId} deveria estar no topo, está em ${snapshot.activeTop}px`
						);
					}

					if (pendingTarget !== null) {
						violations.push(`alvo de rolagem pendente ${pendingTarget}`);
					}
				}

				return violations;
			},
			{ timeout: 8_000, message: context }
		)
		.toEqual([]);
}

async function openLanding(
	page: Page,
	size: Size,
	sectionId: SectionId = "home"
): Promise<string[]> {
	const errors: string[] = [];
	page.on("pageerror", (error) => errors.push(error.message));
	// Máquinas com poucos núcleos desligam a suavização do Lenis; força o
	// perfil de um desktop comum para testar o mesmo scroll do usuário e do CI.
	await page.addInitScript(() => {
		Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 8 });
		Object.defineProperty(navigator, "deviceMemory", { get: () => 8 });
	});
	await page.setViewportSize(size);
	await page.goto(SECTION_PATHS[sectionId], { waitUntil: "networkidle" });
	await expectSettled(page, `abre ${sectionId}`, sectionId);
	return errors;
}

async function clickSection(page: Page, sectionId: SectionId): Promise<void> {
	await page.locator(`button[data-nav-link="${sectionId}"]`).click();
}

async function wheel(page: Page, deltaY: number, times = 1): Promise<void> {
	await page.mouse.move(640, 300);
	for (let index = 0; index < times; index += 1) {
		await page.mouse.wheel(0, deltaY);
		await page.waitForTimeout(60);
	}
}

const RESIZE_ROUND_TRIPS: readonly (readonly [Size, Size])[] = [
	[SIZES[0], SIZES[3]],
	[SIZES[3], SIZES[1]],
	[SIZES[2], SIZES[6]],
];

for (const [from, to] of RESIZE_ROUND_TRIPS) {
	test(`mantém a seção alinhada ao ir de ${from.width}x${from.height} para ${to.width}x${to.height} e voltar`, async ({
		page,
	}) => {
		test.setTimeout(120_000);
		const errors = await openLanding(page, from);

		for (const sectionId of SECTION_IDS) {
			await clickSection(page, sectionId);
			await expectSettled(page, `clique em ${sectionId}`, sectionId);

			await page.setViewportSize(to);
			await expectSettled(
				page,
				`${sectionId} após redimensionar para ${to.width}x${to.height}`,
				sectionId
			);

			await page.setViewportSize(from);
			await expectSettled(
				page,
				`${sectionId} após voltar para ${from.width}x${from.height}`,
				sectionId
			);
		}

		expect(errors).toEqual([]);
	});
}

test("redimensionamento contínuo (arrastar a janela) termina alinhado", async ({
	page,
}) => {
	test.setTimeout(60_000);
	await openLanding(page, SIZES[3]);

	for (const sectionId of ["technologies", "portfolio"] as const) {
		await clickSection(page, sectionId);
		await expectSettled(page, `clique em ${sectionId}`, sectionId);

		for (let step = 0; step <= 12; step += 1) {
			await page.setViewportSize({
				width: Math.round(1920 - step * 47),
				height: Math.round(1080 - step * 37),
			});
			await page.waitForTimeout(25);
		}
		await expectSettled(page, `${sectionId} ao encolher arrastando`, sectionId);

		for (let step = 12; step >= 0; step -= 2) {
			await page.setViewportSize({
				width: Math.round(1920 - step * 47),
				height: Math.round(1080 - step * 37),
			});
			await page.waitForTimeout(25);
		}
		await expectSettled(page, `${sectionId} ao crescer arrastando`, sectionId);
	}
});

test("posição parcial da roda é preservada ao redimensionar", async ({
	page,
}) => {
	await openLanding(page, SIZES[0]);
	await clickSection(page, "roadMap");
	await expectSettled(page, "clique em serviços", "roadMap");

	// Para no meio do caminho entre serviços e a rede IA, rolando como o
	// usuário (a suavização do Lenis decide onde exatamente).
	const readProgress = () =>
		page.evaluate(
			() =>
				-document.getElementById("roadMap")!.getBoundingClientRect().top /
				window.innerHeight
		);
	await wheel(page, 120, 2);
	let progress = -1;
	await expect
		.poll(
			async () => {
				const next = await readProgress();
				const settled = Math.abs(next - progress) < 0.001;
				progress = next;
				return settled;
			},
			{ intervals: [250], message: "rolagem parcial assentar" }
		)
		.toBe(true);
	expect(progress).toBeGreaterThan(0.1);
	expect(progress).toBeLessThan(0.9);

	await page.setViewportSize(SIZES[3]);
	await expect
		.poll(async () => Math.abs((await readProgress()) - progress), {
			message: "progresso dentro de serviços após redimensionar",
		})
		.toBeLessThan(0.01);
	await expectSettled(page, "geometria após redimensionar parcialmente");
});

test("clique no menu depois de rolar com a roda chega exatamente na seção", async ({
	page,
}) => {
	test.setTimeout(90_000);
	const errors = await openLanding(page, SIZES[0]);

	for (const sectionId of SECTION_IDS) {
		await wheel(page, 300, 6);
		await page.waitForTimeout(500);
		await wheel(page, -300, 6);
		await page.waitForTimeout(500);
		await clickSection(page, sectionId);
		await expectSettled(page, `clique em ${sectionId} após rolar`, sectionId);
	}

	expect(errors).toEqual([]);
});

test("entrar no portfólio pela roda alinha a seção no topo da tela", async ({
	page,
}) => {
	await openLanding(page, SIZES[1]);
	await wheel(page, 120, 2);
	await expectSettled(page, "ímã do portfólio", "portfolio");
});

for (const size of [SIZES[3], SIZES[0]]) {
	test(`gesto rápido da home que passa do topo do portfólio volta para ele em ${size.width}x${size.height}`, async ({
		page,
	}) => {
		await openLanding(page, size);
		// Cliques de 100px seguidos: o gesto atravessa a borda e para ~10% além.
		const notches = Math.floor(size.height / 100) + 2;
		await page.mouse.move(640, 300);
		for (let index = 0; index < notches; index += 1) {
			await page.mouse.wheel(0, 100);
			await page.waitForTimeout(40);
		}
		await expectSettled(page, "ímã depois de passar do portfólio", "portfolio");
	});
}

test("descer devagar a partir do portfólio alinhado não é puxado de volta", async ({
	page,
}) => {
	await openLanding(page, SIZES[3]);
	// Chega pelo próprio ímã e espera o encaixe terminar.
	await wheel(page, 120, 2);
	await expectSettled(page, "ímã do portfólio", "portfolio");
	await page.waitForTimeout(1_000);
	await page.mouse.move(640, 300);
	for (let notch = 1; notch <= 3; notch += 1) {
		await page.mouse.wheel(0, 100);
		await page.waitForTimeout(700);
		const top = await page.evaluate(() =>
			Math.round(
				document.getElementById("portfolio")!.getBoundingClientRect().top
			)
		);
		expect(top).toBeLessThan(-notch * 100 + 20);
	}
});

test("interromper uma navegação com a roda não deixa alvo pendente", async ({
	page,
}) => {
	await openLanding(page, SIZES[1]);
	await clickSection(page, "contact");
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

	// Voltar o foco não pode reaplicar o alvo antigo (contato).
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

function createRandom(seed: number): () => number {
	let state = seed;
	return () => {
		state = (state * 1103515245 + 12345) % 2147483648;
		return state / 2147483648;
	};
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
