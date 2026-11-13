import { expect, test } from "@playwright/test";
import { responsiveViewports } from "./support/mobileScrollOrchestration";

// Continuação de mobile-scroll-orchestration.spec.ts.

test("mostra o mapa e preserva as ações durante a passagem ao Portfólio", async ({
  browser,
}) => {
  test.setTimeout(90_000);
  const baseURL = test.info().project.use.baseURL as string;

  for (const viewport of responsiveViewports) {
    await test.step(`${viewport.width}x${viewport.height}`, async () => {
      const context = await browser.newContext({locale:'pt-BR',
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
        return Math.max(0, portfolioTop - innerHeight * 0.72);
      });
      await page.evaluate(
        (scrollTop) => window.scrollTo({ top: scrollTop, behavior: "auto" }),
        targetScrollTop,
      );
      await page.waitForTimeout(700);

      const metrics = await page.evaluate(() => {
        const landing = document.querySelector(
          'main[data-landing-viewport="mobile"]',
        );
        const portfolioSection = document.querySelector(
          '[data-section="portfolio"]',
        );
        const portfolioRoot = document.querySelector(
          '[data-portfolio-root="true"]',
        );
        const map = document.querySelector('[data-world-map-surface="true"]');
        const actions = document.querySelector(
          '[data-mobile-editorial-home] nav[aria-label="Ações de contato"]',
        );

        if (
          !(portfolioSection instanceof HTMLElement) ||
          !(portfolioRoot instanceof HTMLElement) ||
          !(map instanceof HTMLElement) ||
          !(actions instanceof HTMLElement)
        ) {
          return null;
        }

        const portfolioBox = portfolioSection.getBoundingClientRect();
        const actionsBox = actions.getBoundingClientRect();
        const actionsStyle = getComputedStyle(actions);
        const mapStyle = getComputedStyle(map);
        const mapImages = Array.from(map.querySelectorAll("img"));

        return {
          activeSection: landing?.getAttribute("data-active-section"),
          portfolioState: portfolioSection.dataset.renderState,
          portfolioMounted: portfolioSection.dataset.sectionMounted,
          portfolioTop: portfolioBox.top,
          actionsVisible:
            actionsStyle.visibility !== "hidden" &&
            Number.parseFloat(actionsStyle.opacity) > 0.99 &&
            actionsBox.bottom > 0 &&
            actionsBox.top < innerHeight,
          mapVisible:
            mapStyle.visibility !== "hidden" &&
            Number.parseFloat(mapStyle.opacity) > 0.8,
          mapImagesReady:
            mapImages.length > 0 &&
            mapImages.every((image) => image.complete && image.naturalWidth > 0),
          viewportHeight: innerHeight,
        };
      });

      expect(metrics).not.toBeNull();
      expect(metrics?.activeSection).toBe("home");
      expect(metrics?.portfolioState).toBe("near");
      expect(metrics?.portfolioMounted).toBe("true");
      expect(metrics?.portfolioTop).toBeGreaterThan(0);
      expect(metrics?.portfolioTop).toBeLessThan(metrics?.viewportHeight ?? 0);
      expect(metrics?.actionsVisible).toBe(true);
      expect(metrics?.mapVisible).toBe(true);
      expect(metrics?.mapImagesReady).toBe(true);

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
      const context = await browser.newContext({locale:'pt-BR',
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
      await page.locator('[data-mobile-contact="true"]').waitFor();

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
              (metrics?.navbarHeight ?? 0) - 2),
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
  const context = await browser.newContext({locale:'pt-BR',
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
        ...Array.from(root.querySelectorAll("[data-mobile-intro-line]")),
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

  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(850);
  const restoredLogoY = await page.locator('[data-mobile-brand-pusher="true"]')
    .evaluate(element => new DOMMatrixReadOnly(getComputedStyle(element).transform).m42);
  expect(Math.abs(restoredLogoY)).toBeLessThan(1);
  expect(await page.locator('[data-mobile-partner-item]').evaluateAll(items =>
    items.every(element => Math.abs(new DOMMatrixReadOnly(getComputedStyle(element).transform).m41) < 0.5),
  )).toBe(true);

  await context.close();
});
