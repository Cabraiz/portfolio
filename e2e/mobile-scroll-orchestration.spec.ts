import { expect, test } from "@playwright/test";
import { homeProgressSamples, responsiveViewports } from "./support/mobileScrollOrchestration";

test("mantém a logo visível enquanto ela empurra a Home", async ({
  browser,
}) => {
  test.setTimeout(180_000);
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
      await page.locator("[data-mobile-editorial-home]").waitFor();

      const scrollRange = await page
        .locator("[data-mobile-editorial-home]")
        .evaluate((element) => element.getBoundingClientRect().height);

      let previousLogoTop: number | undefined;
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
            ...Object.fromEntries(
              Array.from(root.querySelectorAll("[data-mobile-intro-line]"),
                (line, index) => [`intro:${index + 1}`, line]),
            ),
            partnersHeading: root.querySelector(
              '[data-mobile-partners-heading="true"]',
            ),
          };
          const logoRect = logo.getBoundingClientRect();
          const navbarRect = navbar.getBoundingClientRect();
          const logoStyle = getComputedStyle(logo);
          const overlaps: string[] = [];
          const horizontalOverflow: string[] = [];
          const invalidPartnerExitDirections: string[] = [];
          const hiddenPartners: string[] = [];

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
            const rect = partner.getBoundingClientRect();
            const partnerX = new DOMMatrixReadOnly(style.transform).m41;
            if (partnerX < -0.5 || partnerX > 40.5) {
              invalidPartnerExitDirections.push(
                partner.dataset.mobilePartnerItem ?? "unknown",
              );
            }
            if (Number.parseFloat(style.opacity) < 0.99 || style.visibility === "hidden") {
              hiddenPartners.push(partner.dataset.mobilePartnerItem ?? "unknown");
            }

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
            logoTop: logoRect.top,
            overlaps,
            horizontalOverflow,
            invalidPartnerExitDirections,
            hiddenPartners,
            scrollWidth: document.documentElement.scrollWidth,
            viewportWidth: innerWidth,
          };
        });

        expect(metrics).not.toBeNull();
        expect(metrics?.logoVisible).toBe(true);
        expect(metrics?.logoInsideViewport).toBe(true);
        if (previousLogoTop !== undefined) {
          expect(metrics!.logoTop).toBeGreaterThanOrEqual(previousLogoTop - 1);
        }
        previousLogoTop = metrics!.logoTop;
        if (metrics?.activeSection === "home") {
          expect(metrics?.overlaps).toEqual([]);
        }
        expect(metrics?.horizontalOverflow).toEqual([]);
        expect(metrics?.invalidPartnerExitDirections).toEqual([]);
        expect(metrics?.hiddenPartners).toEqual([]);
        expect(metrics?.scrollWidth).toBeLessThanOrEqual(
          metrics?.viewportWidth ?? 0,
        );
      }

      await context.close();
    });
  }
});

test("acompanha a entrada do Portfólio ao alcançar a base da Home", async ({
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
        return Math.max(0, portfolioTop - innerHeight * 0.3);
      });
      await page.evaluate(
        (scrollTop) => window.scrollTo({ top: scrollTop, behavior: "auto" }),
        targetScrollTop,
      );

      await expect(page.locator('[data-mobile-brand-pusher="true"]')).toHaveAttribute(
        "data-mobile-brand-owner", "portfolio",
      );
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
        const actionsBox = document.querySelector('nav[aria-label="Ações de contato"]')!.getBoundingClientRect();
        return {
          logoTop: logoBox.top,
          logoBottom: logoBox.bottom,
          navbarTop: navbarBox.top,
          navbarBottom: navbarBox.bottom,
          portfolioTop: portfolioBox.top,
          actionsTop: actionsBox.top,
          viewportHeight: innerHeight,
        };
      });

      expect(metrics).not.toBeNull();
      expect(metrics?.portfolioTop).toBeGreaterThan(metrics?.navbarBottom ?? 0);
      expect(metrics?.portfolioTop).toBeLessThan(metrics?.viewportHeight ?? 0);
      expect(metrics?.logoTop).toBeGreaterThanOrEqual(
        (metrics?.navbarTop ?? 0) - 1,
      );
      expect(metrics!.logoTop).toBeGreaterThanOrEqual(metrics!.portfolioTop - 1);
      expect(metrics!.logoBottom).toBeLessThanOrEqual(metrics!.viewportHeight + 1);

      await context.close();
    });
  }
});
