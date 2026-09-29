import { expect, test } from "@playwright/test";

const mobileViewports = [
	{ name: "referência compacta", width: 273, height: 431 },
	{ name: "iPhone SE", width: 320, height: 568 },
	{ name: "Referência enviada", width: 381, height: 539 },
	{ name: "Retrato baixo", width: 381, height: 500 },
	{ name: "Android pequeno", width: 360, height: 640 },
	{ name: "Pixel", width: 390, height: 844 },
	{ name: "Android grande", width: 412, height: 915 },
	{ name: "iPhone Pro Max", width: 430, height: 932 },
	{ name: "iPhone em paisagem", width: 667, height: 375 },
] as const;

test("mantém o portfólio mobile completo dentro de diferentes telas", async ({
	browser,
}) => {
	const baseURL = test.info().project.use.baseURL as string;

	for (const viewport of mobileViewports) {
		await test.step(viewport.name, async () => {
			const context = await browser.newContext({
				viewport: { width: viewport.width, height: viewport.height },
				deviceScaleFactor: 2,
				isMobile: true,
				reducedMotion: "reduce",
			});
			const page = await context.newPage();
			await page.goto(new URL("/portfolio", baseURL).toString());

			const portfolioRoot = page.locator('[data-portfolio-root="true"]');
			const stage = page.locator('[data-mobile-portfolio="true"]');
			const navbar = page.locator(".navbar");
			const brandLogo = page.locator(
				'[data-mobile-brand-pusher="true"] img'
			);
			const location = page.locator('[data-mobile-location="true"]');
			const detailCard = page.locator('[data-mobile-detail-card="true"]');
			const requiredElements = [
				location,
				page.locator('[data-mobile-map-route="true"]'),
				page.locator('[data-mobile-map-controls="true"]'),
				detailCard,
				page.locator('[data-mobile-feature-copy="true"]'),
				page.locator('[data-mobile-project-preview="true"] img'),
				page.locator('[data-mobile-meta="true"]'),
				page.locator('[data-mobile-technologies="true"]'),
				page.locator('[data-mobile-project-list="true"]'),
				page.locator('[data-mobile-project-id][aria-pressed="true"]'),
			];

			await expect(stage).toBeVisible();
			for (const element of requiredElements) {
				await expect(element).toBeVisible();
			}
			await expect(page.locator('[data-mobile-route-network="true"]')).toBeVisible();
			await expect(page.locator("[data-mobile-route-base]")).toHaveCount(2);
			await expect(page.locator("[data-mobile-route-node]")).toHaveCount(3);

			const routeBox = await page
				.locator('[data-mobile-map-route="true"]')
				.boundingBox();
			expect(routeBox).not.toBeNull();
			if (routeBox) {
				expect(routeBox.width).toBeGreaterThan(30);
				expect(routeBox.height).toBeGreaterThan(50);
			}

			const [featureBox, previewBox, metaBox, technologiesBox] =
				await Promise.all([
					page.locator('[data-mobile-feature-copy="true"]').boundingBox(),
					page.locator('[data-mobile-project-preview="true"]').boundingBox(),
					page.locator('[data-mobile-meta="true"]').boundingBox(),
					page.locator('[data-mobile-technologies="true"]').boundingBox(),
				]);
			expect(featureBox).not.toBeNull();
			expect(previewBox).not.toBeNull();
			expect(metaBox).not.toBeNull();
			expect(technologiesBox).not.toBeNull();
			if (featureBox && previewBox && metaBox && technologiesBox) {
				expect(Math.abs(featureBox.y - previewBox.y)).toBeLessThanOrEqual(1);
				expect(Math.abs(metaBox.x - technologiesBox.x)).toBeLessThanOrEqual(1);
				expect(technologiesBox.y).toBeGreaterThanOrEqual(
					metaBox.y + metaBox.height
				);
			}

			const [
				stageBox,
				rootBox,
				navbarBox,
				brandLogoBox,
				locationBox,
				cardBox,
				viewportMetrics,
				cardContentMetrics,
			] = await Promise.all(
				[
					stage.boundingBox(),
					portfolioRoot.boundingBox(),
					navbar.boundingBox(),
					brandLogo.boundingBox(),
					location.boundingBox(),
					detailCard.boundingBox(),
					page.evaluate(() => ({
						width: globalThis.innerWidth,
						height: globalThis.innerHeight,
						documentWidth: document.documentElement.scrollWidth,
					})),
					detailCard.evaluate((card) => {
						const cardBox = card.getBoundingClientRect();
						const contentBottom = Math.max(
							...Array.from(card.children).map(
								(child) => child.getBoundingClientRect().bottom
							)
						);
						return {
							blankBottom: cardBox.bottom - contentBottom,
						};
					}),
				]
			);

			expect(stageBox).not.toBeNull();
			expect(rootBox).not.toBeNull();
			expect(navbarBox).not.toBeNull();
			expect(brandLogoBox).not.toBeNull();
			expect(locationBox).not.toBeNull();
			expect(cardBox).not.toBeNull();
			if (
				!stageBox ||
				!rootBox ||
				!navbarBox ||
				!brandLogoBox ||
				!locationBox ||
				!cardBox
			)
				return;

			expect(Math.abs(locationBox.x - brandLogoBox.x)).toBeLessThanOrEqual(1);
			expect(locationBox.y).toBeGreaterThanOrEqual(
				brandLogoBox.y + brandLogoBox.height
			);
			expect(
				locationBox.y - (brandLogoBox.y + brandLogoBox.height)
			).toBeLessThanOrEqual(30);

			expect(stageBox.y).toBeGreaterThanOrEqual(
				navbarBox.y + navbarBox.height - 1
			);
			expect(stageBox.y + stageBox.height).toBeLessThanOrEqual(
				viewportMetrics.height + 1
			);
			expect(
				Math.abs(rootBox.y + rootBox.height - viewportMetrics.height)
			).toBeLessThanOrEqual(1);
			expect(Math.abs(stageBox.height - rootBox.height)).toBeLessThanOrEqual(1);
			expect(cardBox.y).toBeGreaterThanOrEqual(stageBox.y - 1);
			expect(cardBox.y + cardBox.height).toBeLessThanOrEqual(
				viewportMetrics.height + 1
			);
			expect(cardBox.height).toBeGreaterThanOrEqual(150);
			expect(cardBox.height).toBeLessThanOrEqual(205);
			expect(cardContentMetrics.blankBottom).toBeLessThanOrEqual(10);
			expect(viewportMetrics.documentWidth).toBeLessThanOrEqual(
				viewportMetrics.width
			);

			await page.locator('[data-mobile-project-id="app-bank"]').click();
			const worldRoute = page.locator('[data-world-journey-route="app-bank"]');
			const worldOrigin = page.locator(
				'[data-world-journey-origin="fortaleza"]'
			);
			const worldDestination = page.locator(
				'[data-world-journey-destination="app-bank"]'
			);
			for (const element of [worldRoute, worldOrigin, worldDestination]) {
				await expect(element).toBeVisible();
			}
			const [worldRouteBox, worldOriginBox, worldDestinationBox] =
				await Promise.all([
					worldRoute.boundingBox(),
					worldOrigin.boundingBox(),
					worldDestination.boundingBox(),
				]);
			expect(worldRouteBox).not.toBeNull();
			expect(worldOriginBox).not.toBeNull();
			expect(worldDestinationBox).not.toBeNull();
			if (worldRouteBox && worldOriginBox && worldDestinationBox) {
				expect(worldRouteBox.width).toBeGreaterThan(30);
				expect(worldRouteBox.height).toBeGreaterThan(20);
			}
			await context.close();
		});
	}
});

test("troca o projeto e mantém os controles do mapa funcionais", async ({
	browser,
}) => {
	const context = await browser.newContext({
		viewport: { width: 390, height: 844 },
		deviceScaleFactor: 3,
		isMobile: true,
		reducedMotion: "reduce",
	});
	const page = await context.newPage();
	const baseURL = test.info().project.use.baseURL as string;
	await page.goto(new URL("/portfolio", baseURL).toString());

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

	await page.locator('[data-mobile-project-id="app-barber"]').click();
	await expect(page.locator('[data-mobile-feature-copy="true"] p')).toHaveText(
		"Agenda e recorrência"
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
		expect(
			projectsHeadingBox.y - (technologiesBox.y + technologiesBox.height)
		).toBeLessThanOrEqual(12);
	}
	await context.close();
});

test("desenha as rotas locais e replica a viagem do desktop no mobile", async ({
	browser,
}) => {
	const context = await browser.newContext({
		viewport: { width: 381, height: 539 },
		deviceScaleFactor: 2,
		isMobile: true,
		reducedMotion: "no-preference",
	});
	const page = await context.newPage();
	const baseURL = test.info().project.use.baseURL as string;
	await page.goto(new URL("/portfolio", baseURL).toString());

	const activeRoute = page.locator('[data-mobile-route-active="erp-varejo"]');
	const revealMask = page.locator('[data-mobile-route-reveal="erp-varejo"]');
	await expect(activeRoute).toHaveCount(1);
	await expect(page.locator("[data-mobile-route-base]")).toHaveCount(2);
	await expect(page.locator("[data-mobile-route-node]")).toHaveCount(3);

	const animation = await revealMask.evaluate((element) => {
		const [routeAnimation] = element.getAnimations();
		const timing = routeAnimation?.effect?.getComputedTiming();
		return {
			name: getComputedStyle(element).animationName,
			duration: timing?.duration ?? 0,
			playState: routeAnimation?.playState ?? "missing",
		};
	});
	expect(animation.name).toContain("mobileRouteReveal");
	expect(animation.duration).toBe(1100);
	expect(["running", "finished"]).toContain(animation.playState);

	await page.locator('[data-mobile-project-id="site-adv"]').click();
	await expect(page.locator('[data-mobile-route-active="site-adv"]')).toHaveCount(1);
	await expect(page.locator('[data-mobile-route-reveal="site-adv"]')).toHaveCount(1);
	await expect(page.locator("[data-mobile-route-base]")).toHaveCount(2);

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
	expect(routeAnimation.duration).toBe(2350);
	expect(routeAnimation.delay).toBe(120);
	expect(travelerAnimation.name).toContain("journeyTravelerMove");
	expect(travelerAnimation.duration).toBe(2350);
	expect(travelerAnimation.delay).toBe(180);
	expect(destinationAnimation.name).toContain("destinationAppear");
	expect(destinationAnimation.duration).toBe(520);
	expect(destinationAnimation.delay).toBe(2260);
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
