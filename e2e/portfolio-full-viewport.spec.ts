import { expect, test } from '@playwright/test';

for (const viewport of [{ width: 283, height: 500 }, { width: 320, height: 568 }, { width: 360, height: 640 }, { width: 390, height: 844 }, { width: 430, height: 932 }, { width: 667, height: 375 }]) {
  test(`Portfólio mobile ocupa a viewport inteira ${viewport.width}x${viewport.height}`, async ({ browser }) => {
    test.setTimeout(60_000);
    const context = await browser.newContext({ viewport, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const baseURL = test.info().project.use.baseURL as string;
    const check = async () => {
      const expectedHeight = page.viewportSize()!.height;
      await page.locator('[data-portfolio-root]').waitFor();
      await expect.poll(() => page.evaluate(() => {
        const section = document.querySelector('[data-section="portfolio"]')!.getBoundingClientRect();
        const root = document.querySelector('[data-portfolio-root]')!.getBoundingClientRect();
        const card = document.querySelector('[data-mobile-detail-card]')!.getBoundingClientRect();
        const location = document.querySelector('[data-mobile-location]')!.getBoundingClientRect();
        const navbar = document.querySelector('nav.navbar')!.getBoundingClientRect();
        const height = visualViewport?.height ?? innerHeight;
        return { sectionTop: Math.round(section.top), rootTop: Math.round(root.top), rootHeight: Math.round(root.height), sectionHeight: Math.round(section.height), bottom: Math.round(root.bottom), height: Math.round(height), locationSafe: location.top >= navbar.bottom, cardFits: card.bottom <= height + 1, overflow: document.documentElement.scrollWidth > innerWidth };
      }), { timeout: 6000 }).toEqual({ sectionTop: 0, rootTop: 0, rootHeight: expectedHeight, sectionHeight: expectedHeight, bottom: expectedHeight, height: expectedHeight, locationSafe: true, cardFits: true, overflow: false });
    };
    await page.goto(new URL('/portfolio', baseURL).toString(), { waitUntil: 'networkidle' });
    await check();
    await page.reload({ waitUntil: 'networkidle' });
    await check();
    await page.setViewportSize({ ...viewport, height: viewport.height - 60 });
    await check();
    await page.setViewportSize(viewport);
    await check();
    await page.goto(new URL('/home', baseURL).toString(), { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Abrir menu', exact: true }).click();
    await page.getByRole('button', { name: 'Portfólio', exact: true }).click();
    await check();
    await context.close();
  });
}
