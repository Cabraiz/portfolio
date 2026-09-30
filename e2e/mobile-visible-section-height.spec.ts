import { expect, test } from "@playwright/test";

const routes = [
  { id: "home", path: "/home", root: "[data-mobile-editorial-home]" },
  { id: "portfolio", path: "/portfolio", root: "[data-portfolio-root]" },
  { id: "roadMap", path: "/servicos", root: "[data-services-root]" },
  { id: "technologies", path: "/technologies", root: "[data-cognitive-network-root]" },
  { id: "contact", path: "/contact", root: "[data-mobile-contact]" },
];

for (const viewport of [
  { width: 283, height: 500 },
  { width: 320, height: 568 },
  { width: 360, height: 640 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 568, height: 320 },
  { width: 667, height: 375 },
  { width: 844, height: 390 },
  { width: 915, height: 412 },
]) {
  test(`componentes reais cabem na tela ${viewport.width}x${viewport.height}`, async ({ browser }) => {
    test.setTimeout(90_000);
    const context = await browser.newContext({ viewport, isMobile: true, hasTouch: true, reducedMotion: "reduce" });
    const page = await context.newPage();
    for (const route of routes) {
      await test.step(route.id, async () => {
        await page.goto(new URL(route.path, test.info().project.use.baseURL).toString(), { waitUntil: "networkidle" });
        await page.locator(route.root).waitFor();
        await page.waitForTimeout(250);
        const result = await page.evaluate(route => {
          const root = document.querySelector(route.root)!;
          const box = root.getBoundingClientRect();
          const nav = document.querySelector('nav.navbar')!.getBoundingClientRect();
          const visibleHeight = visualViewport?.height ?? innerHeight;
          const actions = root.querySelector('nav[aria-label="Ações de contato"]')?.getBoundingClientRect();
          return { top: box.top, bottom: box.bottom, height: box.height, navBottom: nav.bottom,
            visibleHeight, expectedTop: route.id === "home" ? nav.bottom : nav.bottom + 2,
            actionsBottom: actions?.bottom, width: innerWidth, scrollWidth: document.documentElement.scrollWidth };
        }, route);
        expect(Math.abs(result.top - result.expectedTop), JSON.stringify(result)).toBeLessThanOrEqual(1);
        expect(Math.abs(result.bottom - result.visibleHeight), JSON.stringify(result)).toBeLessThanOrEqual(1);
        expect(result.scrollWidth).toBeLessThanOrEqual(result.width);
        if (route.id === 'home') {
          expect(result.actionsBottom).toBeLessThanOrEqual(result.visibleHeight);
          await expect(page.getByRole('link', { name: 'WhatsApp' })).toBeVisible();
          await expect(page.getByRole('link', { name: 'Currículo' })).toBeVisible();
        }
      });
    }
    await context.close();
  });
}
