import { expect, test } from "@playwright/test";

const responsiveViewports = [
  { width: 273, height: 431 },
  { width: 320, height: 568 },
  { width: 340, height: 384 },
  { width: 360, height: 640 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 568, height: 320 },
  { width: 667, height: 375 },
] as const;

const homeProgressSamples = [
  0, 0.04, 0.08, 0.16, 0.24, 0.32, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9,
] as const;

test("mantém a logo visível enquanto ela empurra a Home", async ({
  browser,
}) => {
  test.setTimeout(120_000);
  const baseURL = test.info().project.use.baseURL as string;

  for (const viewport of responsiveViewports) {
    await test.step(`${viewport.width}x${viewport.height}`, async () => {
      const context = await browser.newContext({
        viewport,
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 1,
      });
      const page = await context.newPage();
      await page.goto(new URL("/home", baseURL).toString(), {
        waitUntil: "networkidle",
      });
      await page.locator("[data-mobile-editorial-home]").waitFor();

      const scrollRange = await page
        .locator("[data-mobile-editorial-home]")
        .evaluate((element) => element.getBoundingClientRect().height);

      for (const progress of homeProgressSamples) {
        await page.evaluate(
          (scrollTop) => window.scrollTo({ top: scrollTop, behavior: "auto" }),
          scrollRange * progress,
        );
        await page.waitForTimeout(600);

        const metrics = await page.evaluate(() => {
          const root = document.querySelector("[data-mobile-editorial-home]");
          const logo = document.querySelector(
            '[data-mobile-brand-pusher="true"]',
          );
          const landing = document.querySelector(
            'main[data-landing-viewport="mobile"]',
          );
          const navbar = document.querySelector("nav.navbar");

          if (
            !(root instanceof HTMLElement) ||
            !(logo instanceof HTMLElement) ||
            !(navbar instanceof HTMLElement)
          ) {
            return null;
          }

          const elements = {
            eyebrow: root.querySelector(":scope > section > div:first-child"),
            title: root.querySelector("h1"),
            identity: root.querySelector("h1 + div"),
            intro: root.querySelector("p"),
            partnersHeading: root.querySelector(
              '[data-mobile-partners-heading="true"]',
            ),
          };
          const logoRect = logo.getBoundingClientRect();
          const navbarRect = navbar.getBoundingClientRect();
          const logoStyle = getComputedStyle(logo);
          const overlaps: string[] = [];
          const horizontalOverflow: string[] = [];

          for (const [name, element] of Object.entries(elements)) {
            if (!(element instanceof HTMLElement)) continue;
            const rect = element.getBoundingClientRect();
            const overlapWidth =
              Math.min(logoRect.right, rect.right) -
              Math.max(logoRect.left, rect.left);
            const overlapHeight =
              Math.min(logoRect.bottom, rect.bottom) -
              Math.max(logoRect.top, rect.top);

            if (overlapWidth > 2 && overlapHeight > 2) overlaps.push(name);
            if (rect.left < -1 || rect.right > innerWidth + 1) {
              horizontalOverflow.push(name);
            }
          }

          for (const partner of root.querySelectorAll<HTMLElement>(
            "[data-mobile-partner-item]",
          )) {
            const style = getComputedStyle(partner);
            if (Number.parseFloat(style.opacity) <= 0.03) continue;

            const rect = partner.getBoundingClientRect();
            const overlapWidth =
              Math.min(logoRect.right, rect.right) -
              Math.max(logoRect.left, rect.left);
            const overlapHeight =
              Math.min(logoRect.bottom, rect.bottom) -
              Math.max(logoRect.top, rect.top);

            if (overlapWidth > 2 && overlapHeight > 2) {
              overlaps.push(
                `partner:${partner.dataset.mobilePartnerItem ?? "unknown"}`,
              );
            }
          }

          return {
            activeSection: landing?.getAttribute("data-active-section"),
            logoVisible:
              logoStyle.visibility !== "hidden" &&
              Number.parseFloat(logoStyle.opacity) >= 0.99 &&
              logoRect.width > 0 &&
              logoRect.height > 0,
            logoInsideViewport:
              logoRect.left >= -1 &&
              logoRect.right <= innerWidth + 1 &&
              logoRect.top >= -1 &&
              logoRect.bottom <= innerHeight + 1,
            logoInsideNavbar:
              logoRect.top >= navbarRect.top - 1 &&
              logoRect.bottom <= navbarRect.bottom + 1,
            overlaps,
            horizontalOverflow,
            scrollWidth: document.documentElement.scrollWidth,
            viewportWidth: innerWidth,
          };
        });

        expect(metrics).not.toBeNull();
        expect(metrics?.logoVisible).toBe(true);
        expect(metrics?.logoInsideViewport).toBe(true);
        if (metrics?.activeSection === "home") {
          expect(metrics?.overlaps).toEqual([]);
        } else {
          expect(metrics?.logoInsideNavbar).toBe(true);
        }
        expect(metrics?.horizontalOverflow).toEqual([]);
        expect(metrics?.scrollWidth).toBeLessThanOrEqual(
          metrics?.viewportWidth ?? 0,
        );
      }

      await context.close();
    });
  }
});

test("encerra o deslocamento da logo no header quando o Portfólio fica ativo", async ({
  browser,
}) => {
  test.setTimeout(90_000);
  const baseURL = test.info().project.use.baseURL as string;

  for (const viewport of responsiveViewports) {
    await test.step(`${viewport.width}x${viewport.height}`, async () => {
      const context = await browser.newContext({
        viewport,
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 1,
      });
      const page = await context.newPage();
      await page.goto(new URL("/home", baseURL).toString(), {
        waitUntil: "networkidle",
      });

      const targetScrollTop = await page.evaluate(() => {
        const portfolio = document.querySelector('[data-section="portfolio"]');
        if (!(portfolio instanceof HTMLElement)) return 0;

        const portfolioTop = scrollY + portfolio.getBoundingClientRect().top;
        return Math.max(0, portfolioTop - innerHeight * 0.3);
      });
      await page.evaluate(
        (scrollTop) => window.scrollTo({ top: scrollTop, behavior: "auto" }),
        targetScrollTop,
      );

      const landing = page.locator('main[data-landing-viewport="mobile"]');
      await expect(landing).toHaveAttribute("data-active-section", "portfolio");
      await page.waitForTimeout(700);

      const metrics = await page.evaluate(() => {
        const navbar = document.querySelector("nav.navbar");
        const logo = document.querySelector(
          '[data-mobile-brand-pusher="true"]',
        );
        const portfolio = document.querySelector('[data-section="portfolio"]');

        if (
          !(navbar instanceof HTMLElement) ||
          !(logo instanceof HTMLElement) ||
          !(portfolio instanceof HTMLElement)
        ) {
          return null;
        }

        const navbarBox = navbar.getBoundingClientRect();
        const logoBox = logo.getBoundingClientRect();
        const portfolioBox = portfolio.getBoundingClientRect();
        return {
          logoTop: logoBox.top,
          logoBottom: logoBox.bottom,
          navbarTop: navbarBox.top,
          navbarBottom: navbarBox.bottom,
          portfolioTop: portfolioBox.top,
          viewportHeight: innerHeight,
        };
      });

      expect(metrics).not.toBeNull();
      expect(metrics?.portfolioTop).toBeGreaterThan(metrics?.navbarBottom ?? 0);
      expect(metrics?.portfolioTop).toBeLessThan(metrics?.viewportHeight ?? 0);
      expect(metrics?.logoTop).toBeGreaterThanOrEqual(
        (metrics?.navbarTop ?? 0) - 1,
      );
      expect(metrics?.logoBottom).toBeLessThanOrEqual(
        (metrics?.navbarBottom ?? 0) + 1,
      );

      await context.close();
    });
  }
});

test("mantém Contato inteiro e livre do chat em retrato e paisagem", async ({
  browser,
}) => {
  test.setTimeout(90_000);
  const baseURL = test.info().project.use.baseURL as string;

  for (const viewport of responsiveViewports) {
    await test.step(`${viewport.width}x${viewport.height}`, async () => {
      const context = await browser.newContext({
        viewport,
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 1,
        reducedMotion: "reduce",
      });
      const page = await context.newPage();
      await page.goto(new URL("/contact", baseURL).toString(), {
        waitUntil: "networkidle",
      });

      const metrics = await page.evaluate(() => {
        const navbar = document.querySelector("nav.navbar");
        const section = document.querySelector('[data-section="contact"]');
        const contact = document.querySelector('[data-mobile-contact="true"]');
        const chatButton = document.querySelector('[aria-label="Abrir chat"]');

        if (
          !(navbar instanceof HTMLElement) ||
          !(section instanceof HTMLElement) ||
          !(contact instanceof HTMLElement)
        ) {
          return null;
        }

        const sectionRect = section.getBoundingClientRect();
        const contactRect = contact.getBoundingClientRect();
        const chatRect =
          chatButton instanceof HTMLElement
            ? chatButton.getBoundingClientRect()
            : null;
        const items = Array.from(contact.children[2]?.children ?? []).map(
          (element) => element.getBoundingClientRect(),
        );
        const lastItem = items.at(-1) ?? null;
        const overlapsChat =
          lastItem !== null &&
          chatRect !== null &&
          Math.min(lastItem.right, chatRect.right) -
            Math.max(lastItem.left, chatRect.left) >
            2 &&
          Math.min(lastItem.bottom, chatRect.bottom) -
            Math.max(lastItem.top, chatRect.top) >
            2;

        return {
          viewportHeight: innerHeight,
          navbarHeight: navbar.getBoundingClientRect().height,
          sectionHeight: sectionRect.height,
          contactTop: contactRect.top,
          contactBottom: contactRect.bottom,
          sectionTop: sectionRect.top,
          sectionBottom: sectionRect.bottom,
          itemsInside:
            items.length === 4 &&
            items.every(
              (rect) =>
                rect.top >= sectionRect.top - 1 &&
                rect.bottom <= sectionRect.bottom + 1,
            ),
          overlapsChat,
        };
      });

      expect(metrics).not.toBeNull();
      expect(
        Math.abs(
          (metrics?.sectionHeight ?? 0) -
            ((metrics?.viewportHeight ?? 0) -
              (metrics?.navbarHeight ?? 0)),
        ),
      ).toBeLessThanOrEqual(1);
      expect(metrics?.contactTop).toBeGreaterThanOrEqual(
        (metrics?.sectionTop ?? 0) - 1,
      );
      expect(metrics?.contactBottom).toBeLessThanOrEqual(
        (metrics?.sectionBottom ?? 0) + 1,
      );
      expect(metrics?.itemsInside).toBe(true);
      expect(metrics?.overlapsChat).toBe(false);

      await context.close();
    });
  }
});

test("recalcula o ScrollTrigger após resize e troca de orientação", async ({
  browser,
}) => {
  test.setTimeout(45_000);
  const baseURL = test.info().project.use.baseURL as string;
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await page.goto(new URL("/home", baseURL).toString(), {
    waitUntil: "networkidle",
  });

  for (const viewport of [
    { width: 667, height: 375 },
    { width: 320, height: 568 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.evaluate(() => window.dispatchEvent(new Event("orientationchange")));
    const scrollRange = await page
      .locator("[data-mobile-editorial-home]")
      .evaluate((element) => element.getBoundingClientRect().height);
    await page.evaluate(
      (scrollTop) => window.scrollTo({ top: scrollTop, behavior: "auto" }),
      scrollRange * 0.4,
    );
    await page.waitForTimeout(900);

    const overlaps = await page.evaluate(() => {
      const root = document.querySelector("[data-mobile-editorial-home]");
      const logo = document.querySelector(
        '[data-mobile-brand-pusher="true"]',
      );
      if (!(root instanceof HTMLElement) || !(logo instanceof HTMLElement)) {
        return ["missing-elements"];
      }

      const logoRect = logo.getBoundingClientRect();
      const elements = [
        root.querySelector(":scope > section > div:first-child"),
        root.querySelector("h1"),
        root.querySelector("h1 + div"),
        root.querySelector("p"),
        root.querySelector('[data-mobile-partners-heading="true"]'),
        ...Array.from(
          root.querySelectorAll<HTMLElement>("[data-mobile-partner-item]"),
        ).filter(
          (element) => Number.parseFloat(getComputedStyle(element).opacity) > 0.03,
        ),
      ];

      return elements
        .filter((element): element is HTMLElement => element instanceof HTMLElement)
        .filter((element) => {
          const rect = element.getBoundingClientRect();
          return (
            Math.min(logoRect.right, rect.right) -
                Math.max(logoRect.left, rect.left) >
              2 &&
            Math.min(logoRect.bottom, rect.bottom) -
                Math.max(logoRect.top, rect.top) >
              2
          );
        })
        .map((element) => element.tagName);
    });

    expect(overlaps).toEqual([]);
  }

  await context.close();
});
