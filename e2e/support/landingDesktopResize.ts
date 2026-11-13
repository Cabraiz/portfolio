// Helpers e tabelas de landing-desktop-resize-stress*.spec.ts.
import { expect, type Page } from "@playwright/test";

// A landing tem só Início e Portfólio.
const SECTION_IDS = ["home", "portfolio"] as const;

type SectionId = (typeof SECTION_IDS)[number];

const SECTION_PATHS: Record<SectionId, string> = {
	home: "/home",
	portfolio: "/portfolio",
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

/**
 * Gesto de roda com ritmo fixo, disparado na própria página: o ritmo dos
 * eventos do Playwright varia com a carga do runner.
 */
async function wheelGesture(
	page: Page,
	notches: number,
	deltaY: number,
	gapMs = 40
): Promise<void> {
	await page.evaluate(
		async ([count, delta, gap]) => {
			for (let index = 0; index < count; index += 1) {
				document.elementFromPoint(640, 300)?.dispatchEvent(
					new WheelEvent("wheel", {
						deltaY: delta,
						bubbles: true,
						cancelable: true,
						clientX: 640,
						clientY: 300,
					})
				);
				await new Promise((resolve) => setTimeout(resolve, gap));
			}
		},
		[notches, deltaY, gapMs] as const
	);
}

function createRandom(seed: number): () => number {
	let state = seed;
	return () => {
		state = (state * 1103515245 + 12345) % 2147483648;
		return state / 2147483648;
	};
}

export {
	SECTION_IDS,
	SECTION_PATHS,
	SIZES,
	readLandingSnapshot,
	expectSettled,
	openLanding,
	clickSection,
	wheel,
	wheelGesture,
	createRandom,
};
export type { SectionId, Size, LandingSnapshot };
