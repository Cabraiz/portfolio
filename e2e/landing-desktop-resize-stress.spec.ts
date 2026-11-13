import { expect, test } from "@playwright/test";
import {
	SECTION_IDS,
	SIZES,
	expectSettled,
	openLanding,
	clickSection,
	wheel,
	wheelGesture,
	type Size,
} from "./support/landingDesktopResize";

/**
 * Contrato do desktop: cada seção tem exatamente a altura da viewport, as
 * seções são contíguas e, depois de navegar ou redimensionar, a seção que
 * estava alinhada continua alinhada no topo. Estes testes misturam roda,
 * teclado, cliques no menu e redimensionamentos (720p <-> 1080p etc.).
 */

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

	for (const sectionId of ["home", "portfolio"] as const) {
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

test("posição parcial (barra de rolagem) é preservada ao redimensionar", async ({
	page,
}) => {
	await openLanding(page, SIZES[0]);
	await clickSection(page, "home");
	await expectSettled(page, "clique no início", "home");

	// A roda pagina por seção; uma posição parcial só vem de arrastar a barra.
	const readProgress = () =>
		page.evaluate(
			() =>
				-document.getElementById("home")!.getBoundingClientRect().top /
				window.innerHeight
		);
	await page.evaluate(() =>
		window.scrollTo(0, window.scrollY + window.innerHeight * 0.4)
	);
	await expect.poll(readProgress).toBeCloseTo(0.4, 2);

	await page.setViewportSize(SIZES[3]);
	await expect
		.poll(async () => Math.abs((await readProgress()) - 0.4), {
			message: "progresso dentro do início após redimensionar",
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

for (const size of [SIZES[3], SIZES[0]]) {
	test(`quatro tiques da roda andam exatamente uma seção em ${size.width}x${size.height}`, async ({
		page,
	}) => {
		test.setTimeout(120_000);
		const errors = await openLanding(page, size);

		// Menos de quatro tiques empurram a página e ela volta para onde estava.
		for (const ticks of [1, 2, 3]) {
			await wheelGesture(page, ticks, 100, 120);
			// O empurrão só é desfeito 900ms depois do último tique (SNAP_BACK_DELAY_MS
			// em useDesktopSectionPaging); antes disso os tiques seguintes somam a ele
			// de propósito. No CI lento a página ainda nem tinha saído do topo, a
			// checagem passava na hora e 2 + 3 tiques viravam uma troca de seção.
			// O timer da página dispara antes deste, que vence depois.
			await page.evaluate(
				() => new Promise((resolve) => setTimeout(resolve, 1_100))
			);
			await expectSettled(page, `${ticks} tique(s) e para`, "home");
		}

		for (const sectionId of SECTION_IDS.slice(1)) {
			await wheelGesture(page, 4, 100, 120);
			await expectSettled(
				page,
				`quatro tiques para baixo até ${sectionId}`,
				sectionId
			);
		}

		// Na última seção tiques a mais não saem do lugar.
		await wheelGesture(page, 4, 100, 120);
		await expectSettled(page, "tiques além do fim", "portfolio");

		for (const sectionId of [...SECTION_IDS].reverse().slice(1)) {
			await wheelGesture(page, 4, -100, 120);
			await expectSettled(
				page,
				`quatro tiques para cima até ${sectionId}`,
				sectionId
			);
		}

		expect(errors).toEqual([]);
	});
}

test("giro rápido ou swipe de trackpad anda uma seção só", async ({ page }) => {
	await openLanding(page, SIZES[3]);

	// Giro rápido: vários tiques seguidos contam como um só.
	await wheelGesture(page, 12, 100);
	await expectSettled(page, "giro rápido para baixo", "portfolio");
	await wheelGesture(page, 12, -100);
	await expectSettled(page, "giro rápido para cima", "home");

	// Swipe de trackpad: deltas pequenos com inércia.
	await page.evaluate(async () => {
		const deltas = [4, 8, 16, 28, 44, 60, 68, 64, 56, 48, 40, 34, 28, 24, 20];
		for (const deltaY of [...deltas, 16, 12, 10, 8, 6, 4, 4, 2, 2, 2, 2]) {
			document
				.elementFromPoint(640, 300)
				?.dispatchEvent(
					new WheelEvent("wheel", { deltaY, bubbles: true, cancelable: true })
				);
			await new Promise((resolve) => setTimeout(resolve, 16));
		}
	});
	await expectSettled(page, "swipe de trackpad", "portfolio");

	// Depois de uma pausa, mais quatro tiques andam mais uma seção.
	await page.waitForTimeout(300);
	await wheelGesture(page, 4, -100, 120);
	await expectSettled(page, "tique depois de uma pausa", "home");
});

test("Firefox (linhas) e mouse de alta resolução andam uma seção a cada quatro tiques", async ({
	page,
}) => {
	await openLanding(page, SIZES[3]);

	const dispatch = (
		events: readonly (readonly [number, number])[],
		gap: number
	) =>
		page.evaluate(
			async ([list, delay]) => {
				for (const [deltaY, deltaMode] of list) {
					document.elementFromPoint(640, 300)?.dispatchEvent(
						new WheelEvent("wheel", {
							deltaY,
							deltaMode,
							bubbles: true,
							cancelable: true,
						})
					);
					await new Promise((resolve) => setTimeout(resolve, delay));
				}
			},
			[events, gap] as const
		);

	// Firefox: um tique = 3 linhas (deltaMode 1).
	await dispatch(
		Array.from({ length: 4 }, () => [3, 1] as const),
		120
	);
	await expectSettled(page, "quatro tiques em linhas", "portfolio");

	// Mouse de alta resolução: vários deltas pequenos por tique.
	await page.waitForTimeout(300);
	await dispatch(
		Array.from({ length: 40 }, () => [-12, 0] as const),
		16
	);
	await expectSettled(page, "quatro tiques de alta resolução", "home");
});

for (const size of [SIZES[3], SIZES[7], SIZES[0]]) {
	test(`tique quebrado no meio sempre termina alinhado em ${size.width}x${size.height}`, async ({
		page,
	}) => {
		test.setTimeout(120_000);
		const errors = await openLanding(page, size);

		// Ida e volta no meio do empurrão: não sai da seção.
		for (const deltaY of [100, -100, 100, -100]) {
			await wheelGesture(page, 1, deltaY);
			await page.waitForTimeout(80);
		}
		await expectSettled(page, "vai-e-volta", "home");

		// Tiques durante a volta continuam contando de onde a página está.
		await wheelGesture(page, 3, 100, 120);
		await page.waitForTimeout(1_000);
		await wheelGesture(page, 4, 100, 120);
		await expectSettled(page, "quatro tiques durante a volta", "portfolio");

		// Tiques lentos (meio segundo entre eles) ainda somam.
		await wheelGesture(page, 4, -100, 500);
		await expectSettled(page, "quatro tiques lentos", "home");

		// Tique grande (Windows com mais linhas por tique) vale um só.
		await wheelGesture(page, 3, 300, 120);
		await expectSettled(page, "três tiques grandes", "home");

		// Clique fora do menu no meio do empurrão: a página volta.
		await wheelGesture(page, 2, 100, 120);
		await page.mouse.click(5, size.height - 5);
		await expectSettled(page, "clique fora no meio", "home");

		// Tecla no meio do empurrão anda a partir da seção certa.
		await wheelGesture(page, 2, 100, 120);
		await page.keyboard.press("PageDown");
		await expectSettled(page, "PageDown no meio", "portfolio");

		// Resize no meio do empurrão realinha a seção.
		await wheelGesture(page, 3, -100, 120);
		await page.setViewportSize({
			width: Math.round(size.width * 0.8),
			height: Math.round(size.height * 0.85),
		});
		await page.waitForTimeout(300);
		await page.setViewportSize(size);
		await expectSettled(page, "resize no meio", "portfolio");

		expect(errors).toEqual([]);
	});
}

// Escala do Windows ou zoom: o Chrome manda cada tique dividido pela escala
// (80px em 125%, 50px em 200%), como a roda real medida no Chromium.
for (const deviceScaleFactor of [1.25, 2]) {
	test.describe(`escala ${deviceScaleFactor * 100}%`, () => {
		test.use({ deviceScaleFactor });

		test("quatro tiques da roda andam uma seção", async ({ page }) => {
			await openLanding(page, SIZES[7]);
			const tickPx = await page.evaluate(() => 100 / window.devicePixelRatio);

			await wheelGesture(page, 3, tickPx, 120);
			await expectSettled(page, "três tiques e para", "home");

			await wheelGesture(page, 4, tickPx, 120);
			await expectSettled(page, "quatro tiques", "portfolio");
		});
	});
}

