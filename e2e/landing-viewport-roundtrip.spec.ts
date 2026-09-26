import { expect, test, type Page } from "@playwright/test";

type LandingSection = Readonly<{
	id: "home" | "portfolio" | "roadMap" | "technologies" | "contact";
	label: string;
	path: string;
}>;

const sections: readonly LandingSection[] = [
	{ id: "home", label: "Início", path: "/home" },
	{ id: "portfolio", label: "Portfólio", path: "/portfolio" },
	{ id: "roadMap", label: "Serviços", path: "/servicos" },
	{ id: "technologies", label: "Rede IA", path: "/technologies" },
	{ id: "contact", label: "Contato", path: "/contact" },
] as const;

const roundTrip = [...sections, ...sections.slice(0, -1).reverse()] as const;

const viewports = [
	{ name: "desktop-1366x631", width: 1366, height: 631, mobile: false },
	{ name: "desktop-1366x720", width: 1366, height: 720, mobile: false },
	{ name: "desktop-1920x1080", width: 1920, height: 1080, mobile: false },
	{ name: "mobile-390x844", width: 390, height: 844, mobile: true },
	{ name: "mobile-360x640", width: 360, height: 640, mobile: true },
] as const;

async function navigateToSection(
	page: Page,
	section: LandingSection,
	mobile: boolean
): Promise<void> {
	if (mobile) {
		await page.getByRole("button", { name: /abrir menu/i }).click();
		await page
			.getByRole("button", { name: section.label, exact: true })
			.click();
		return;
	}

	await page.locator(`button[data-nav-link="${section.id}"]`).click();
}

async function expectSectionToOwnViewport(
	page: Page,
	section: LandingSection,
	mobile: boolean
): Promise<void> {
	await expect
		.poll(
			async () =>
				page.evaluate(
					({ sectionId, expectedPath, mobile }) => {
						const landing = document.querySelector<HTMLElement>(
							"main[data-landing-viewport]"
						);
						const current = document.querySelector<HTMLElement>(
							`section[data-page-section="true"]#${sectionId}`
						);
						const navbar = document.querySelector<HTMLElement>("nav.navbar");
						const serviceRoot = document.querySelector<HTMLElement>(
							"#roadMap [data-services-root='true']"
						);
						const allSections = Array.from(
							document.querySelectorAll<HTMLElement>(
								"section[data-page-section='true']"
							)
						);
						const currentIndex = current ? allSections.indexOf(current) : -1;
						const previous =
							currentIndex > 0 ? allSections[currentIndex - 1] : null;
						const next =
							currentIndex >= 0 && currentIndex < allSections.length - 1
								? allSections[currentIndex + 1]
								: null;
						const currentRect = current?.getBoundingClientRect();
						const navbarRect = navbar?.getBoundingClientRect();
						const previousRect = previous?.getBoundingClientRect();
						const nextRect = next?.getBoundingClientRect();
						const expectedTop = mobile ? (navbarRect?.bottom ?? 0) : 0;
						const serviceOverflow = serviceRoot
							? getComputedStyle(serviceRoot).overflow
							: null;

						return {
							active: landing?.dataset.activeSection === sectionId,
							path: location.pathname === expectedPath,
							mounted: current?.dataset.sectionMounted === "true",
							content: Boolean(
								current?.querySelector(":scope > [data-section-content='true']")
							),
							topAligned: Boolean(
								currentRect && Math.abs(currentRect.top - expectedTop) <= 5
							),
							exactDesktopHeight: Boolean(
								mobile ||
								(currentRect && Math.abs(currentRect.height - window.innerHeight) <= 1)
							),
							coversViewport: Boolean(
								currentRect && currentRect.bottom >= window.innerHeight - 1
							),
							previousIsOutsideContent: Boolean(
								!previousRect ||
								previousRect.bottom <= (navbarRect?.bottom ?? 0) + 5
							),
							nextIsOutsideViewport: Boolean(
								!nextRect || nextRect.top >= window.innerHeight - 1
							),
							noHorizontalOverflow:
								document.documentElement.scrollWidth ===
								document.documentElement.clientWidth,
							servicesAreIsolated:
								sectionId === "roadMap"
									? serviceOverflow === "clip" || serviceOverflow === "hidden"
									: serviceOverflow === null ||
										serviceOverflow === "hidden" ||
										serviceOverflow === "clip",
						};
					},
					{ sectionId: section.id, expectedPath: section.path, mobile }
				),
			{
				timeout: 8_000,
				message: `${section.label} deve ocupar corretamente a viewport`,
			}
		)
		.toEqual({
			active: true,
			path: true,
			mounted: true,
			content: true,
			topAligned: true,
			exactDesktopHeight: true,
			coversViewport: true,
			previousIsOutsideContent: true,
			nextIsOutsideViewport: true,
			noHorizontalOverflow: true,
			servicesAreIsolated: true,
		});
}

for (const viewport of viewports) {
	test(`${viewport.name}: mantém 100% da tela na ida e na volta`, async ({
		page,
	}) => {
		test.setTimeout(150_000);
		const runtimeErrors: string[] = [];
		page.on("console", (message) => {
			if (
				message.type() === "error" &&
				!message.text().startsWith("Failed to load resource")
			) {
				runtimeErrors.push(message.text());
			}
		});
		page.on("pageerror", (error) => runtimeErrors.push(error.message));
		page.on("response", (response) => {
			const resourceType = response.request().resourceType();
			if (
				response.status() >= 400 &&
				["document", "script", "stylesheet"].includes(resourceType)
			) {
				runtimeErrors.push(`${response.status()} ${response.url()}`);
			}
		});

		await page.setViewportSize({
			width: viewport.width,
			height: viewport.height,
		});
		await page.goto("/home", { waitUntil: "networkidle" });

		for (let index = 0; index < roundTrip.length; index += 1) {
			const section = roundTrip[index];
			if (index > 0) {
				await navigateToSection(page, section, viewport.mobile);
			}
			await expectSectionToOwnViewport(page, section, viewport.mobile);
		}

		expect(runtimeErrors).toEqual([]);
	});
}

for (const viewport of [
	{ name: "720p", width: 1366, height: 720 },
	{ name: "1080p", width: 1920, height: 1080 },
] as const) {
	test(`${viewport.name}: conclui a navegação após desfocar durante a descida e a volta`, async ({
		page,
	}) => {
		await page.setViewportSize(viewport);
		await page.goto("/portfolio", { waitUntil: "networkidle" });

		for (const target of [sections[2], sections[3], sections[2]]) {
			await page.locator(`button[data-nav-link="${target.id}"]`).click();
			await page.waitForTimeout(180);
			await page.evaluate(() => window.dispatchEvent(new Event("blur")));
			await page.waitForTimeout(320);
			await page.evaluate(() => window.dispatchEvent(new Event("focus")));
			await expectSectionToOwnViewport(page, target, false);
			await expect(page.locator("html")).not.toHaveAttribute(
				"data-landing-scroll-target",
				/.+/
			);
		}
	});
}
