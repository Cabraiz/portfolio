import { expect, test } from "@playwright/test";

// Continuação de portfolio-mobile.spec.ts.

test("troca o projeto e mantém os controles do mapa funcionais", async ({
	browser,
}) => {
	const context = await browser.newContext({locale:'pt-BR',
		viewport: { width: 390, height: 844 },
		deviceScaleFactor: 3,
		isMobile: true,
		reducedMotion: "reduce",
	});
	const page = await context.newPage();
	const baseURL = test.info().project.use.baseURL as string;
	await page.goto(new URL("/portfolio", baseURL).toString());

	// O portfólio abre no primeiro projeto estrangeiro; estes passos partem do

	// NEXOVARE (rota local do Brasil).

	await page.locator('[data-mobile-project-id="erp-varejo"]').click();

	await expect(page.locator('[data-mobile-project-id="erp-varejo"]')).toHaveAttribute("aria-pressed", "true");

	const root = page.locator('[data-portfolio-root="true"]');
	const location = page.locator('[data-mobile-location="true"]');
	const zoomValue = () =>
		root.evaluate((element) =>
			Number(
				getComputedStyle(element).getPropertyValue("--mobile-map-zoom").trim()
			)
		);

	await expect.poll(zoomValue).toBe(1);
	await page.getByRole("button", { name: "Aumentar mapa" }).click();
	await expect.poll(zoomValue).toBe(1.08);
	await page.getByRole("button", { name: "Centralizar mapa" }).click();
	await expect.poll(zoomValue).toBe(1);

	await page.locator('[data-mobile-project-id="app-bank"]').click();
	await expect(
		page.locator('[data-mobile-project-id="app-bank"]')
	).toHaveAttribute("aria-pressed", "true");
	await expect(location).toContainText("México");
	await expect(location).toContainText("Puerto Vallarta");
	await expect(page.locator('[data-world-journey="app-bank"]')).toBeVisible();
	await expect(
		page.locator('[data-world-journey-origin="fortaleza"]')
	).toBeVisible();
	await expect(
		page.locator('[data-world-journey-route="app-bank"]')
	).toHaveCount(1);
	const [worldRouteBox, worldOriginBox, worldDestinationBox] = await Promise.all([
		page.locator('[data-world-journey-route="app-bank"]').boundingBox(),
		page.locator('[data-world-journey-origin="fortaleza"]').boundingBox(),
		page.locator('[data-world-journey-destination="app-bank"]').boundingBox(),
	]);
	expect(worldRouteBox).not.toBeNull();
	expect(worldOriginBox).not.toBeNull();
	expect(worldDestinationBox).not.toBeNull();
	if (worldRouteBox && worldOriginBox && worldDestinationBox) {
		expect(worldRouteBox.width).toBeGreaterThan(30);
		expect(worldRouteBox.height).toBeGreaterThan(20);
	}
	await expect(page.locator('[data-mobile-detail-card="true"] h2')).toHaveText(
		"APP BANCO"
	);
	await expect(
		page.locator('[data-mobile-project-preview="true"] img')
	).toHaveAttribute("alt", "Preview do projeto APP BANCO");

	await page.getByRole("button", { name: "Próximo projeto" }).click();
	await expect(
		page.locator('[data-mobile-project-id="guine-bissau-commerce"]')
	).toHaveAttribute("aria-pressed", "true");
	await expect(
		page.locator('[data-world-journey-route="guine-bissau-commerce"]')
	).toHaveCount(1);
	await expect(
		page.locator('[data-world-journey-destination="guine-bissau-commerce"]')
	).toHaveCount(1);
	await expect(page.locator('[data-mobile-detail-card="true"] h2')).toHaveText(
		"BIDEIRAS"
	);

	await page.locator('[data-mobile-project-id="clockright"]').click();
	await expect(page.locator('[data-mobile-feature-copy="true"] p')).toHaveText(
		"Ponto por biometria facial"
	);
	const [subtitleBox, metaBox, technologiesBox, projectsHeadingBox] =
		await Promise.all([
			page.locator('[data-mobile-feature-copy="true"] p').boundingBox(),
			page.locator('[data-mobile-meta="true"]').boundingBox(),
			page.locator('[data-mobile-technologies="true"]').boundingBox(),
			page.getByRole("heading", { name: "Todos os projetos" }).boundingBox(),
		]);
	expect(subtitleBox).not.toBeNull();
	expect(metaBox).not.toBeNull();
	expect(technologiesBox).not.toBeNull();
	expect(projectsHeadingBox).not.toBeNull();
	if (subtitleBox && metaBox && technologiesBox && projectsHeadingBox) {
		expect(metaBox.y - (subtitleBox.y + subtitleBox.height)).toBeLessThanOrEqual(
			8
		);
                const previewBox=await page.locator('[data-mobile-project-preview]').boundingBox();
                expect(projectsHeadingBox.y - Math.max(technologiesBox.y + technologiesBox.height,previewBox!.y + previewBox!.height)).toBeLessThanOrEqual(12);
	}
	await context.close();
});

test("desenha as rotas locais e replica a viagem do desktop no mobile", async ({
	browser,
}) => {
	const context = await browser.newContext({locale:'pt-BR',
		viewport: { width: 381, height: 539 },
		deviceScaleFactor: 2,
		isMobile: true,
		reducedMotion: "no-preference",
	});
	const page = await context.newPage();
	const baseURL = test.info().project.use.baseURL as string;
	await page.goto(new URL("/portfolio", baseURL).toString());

	// O portfólio abre no primeiro projeto estrangeiro; estes passos partem do

	// NEXOVARE (rota local do Brasil).

	await page.locator('[data-mobile-project-id="erp-varejo"]').click();

	await expect(page.locator('[data-mobile-project-id="erp-varejo"]')).toHaveAttribute("aria-pressed", "true");

	const activeRoute = page.locator('[data-mobile-route-active="erp-varejo"]');
	await expect(activeRoute).toHaveCount(1);
	await expect(page.locator("[data-mobile-route-base]")).toHaveCount(1);
	await expect(page.locator("[data-mobile-route-node]")).toHaveCount(2);

	const animation = await activeRoute.evaluate((element) => {
		const [routeAnimation] = element.getAnimations();
		const timing = routeAnimation?.effect?.getComputedTiming();
		return {
			name: getComputedStyle(element).animationName,
			duration: timing?.duration ?? 0,
			playState: routeAnimation?.playState ?? "missing",
		};
	});
	expect(animation.name).toContain("journeyRouteDraw");
	expect(animation.duration).toBe(1100);
	expect(["running", "finished"]).toContain(animation.playState);

	await page.locator('[data-mobile-project-id="app-bank"]').click();
	const journeyRoute = page.locator('[data-world-journey-route="app-bank"]');
	const journeyTraveler = page.locator(
		'[data-world-journey-traveler-dot="true"]'
	);
	const journeyDestination = page.locator(
		'[data-world-journey-destination="app-bank"]'
	);
	await expect(journeyRoute).toHaveCount(1);
	await expect(journeyTraveler).toHaveCount(1);
	await expect(journeyDestination).toHaveCount(1);

	const [routeAnimation, travelerAnimation, destinationAnimation, mapTransforms] =
		await Promise.all([
			journeyRoute.evaluate(readAnimation),
			journeyTraveler.evaluate(readAnimation),
			journeyDestination.evaluate(readAnimation),
			page.evaluate(() => ({
				map: getComputedStyle(
					document.querySelector('[data-world-map-surface="true"]')!
				).transform,
				geo: getComputedStyle(
					document.querySelector('[data-world-geo-surface="true"]')!
				).transform,
			})),
		]);
	expect(routeAnimation.name).toContain("journeyRouteDraw");
	// Vem de erp-varejo (outro ponto do Brasil): voo de conexão, então a rota de
	// Fortaleza desenha 1 s mais devagar, esperando o avião.
	expect(routeAnimation.duration).toBe(3800);
	expect(routeAnimation.delay).toBe(0);
	// O avião voa no ritmo da câmera do mapa (2800 ms, sem atraso).
	expect(travelerAnimation.name).toContain("journeyTravelerMove");
	expect(travelerAnimation.duration).toBe(2800);
	expect(travelerAnimation.delay).toBe(0);
	expect(destinationAnimation.name).toContain("destinationAppear");
	expect(destinationAnimation.duration).toBe(520);
	expect(destinationAnimation.delay).toBe(2530);
	expect(mapTransforms.geo).toBe(mapTransforms.map);
	await context.close();
});

function readAnimation(element: Element) {
	const [animation] = element.getAnimations();
	const timing = animation?.effect?.getComputedTiming();
	const style = getComputedStyle(element);
	return {
		name: style.animationName,
		duration: timing?.duration ?? 0,
		delay: Number.parseFloat(style.animationDelay) * 1000,
	};
}
