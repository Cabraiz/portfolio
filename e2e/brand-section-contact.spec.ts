import { expect, test } from '@playwright/test';

for (const viewport of [{ width: 1280, height: 720 }, { width: 1920, height: 1080 }, { width: 390, height: 844 }]) {
  test(`brand follows the section behind it ${viewport.width}x${viewport.height}`, async ({ browser }) => {
    const mobile = viewport.width < 768;
    const context = await browser.newContext({ viewport, locale: 'pt-BR', isMobile: mobile, hasTouch: mobile });
    const page = await context.newPage();
    await page.goto('/home', { waitUntil: 'networkidle' });
    const symbol = page.locator('[data-brand-symbol]');
    if (!mobile) {
      const texture = await symbol.locator('span').evaluate(el => getComputedStyle(el).backgroundImage);
      expect(texture).toContain('home-white-cotton');
    }
    // Commit Services through real navigation; its scroll must not recolor the
    // logo while the symbol is still physically over Portfolio.
    if (mobile) await page.getByRole('button', { name: 'Abrir menu', exact: true }).click();
    if (mobile) await page.getByRole('button', { name: 'Serviços', exact: true }).click();
    else await page.locator('[data-nav-link="roadMap"]').click();
    await expect(page.locator('main[data-landing-viewport]')).toHaveAttribute('data-active-section', 'roadMap');
    await page.waitForTimeout(1100);
    await page.mouse.click(viewport.width - 5, viewport.height / 2);
    const positionBoundary = async (delta: number) => {
      await page.evaluate(delta => {
        const symbol = document.querySelector('[data-brand-symbol]')!.getBoundingClientRect();
        const services = document.querySelector('#roadMap')!.getBoundingClientRect();
        scrollTo({ top: scrollY + services.top - (symbol.top + symbol.height / 2 + delta), behavior: 'instant' });
      }, delta);
      await page.waitForTimeout(350);
    };
    await positionBoundary(25);
    const geometry = await page.evaluate(() => {
      const symbol = document.querySelector('[data-brand-symbol]')!.getBoundingClientRect();
      const portfolio = document.querySelector('#portfolio')!.getBoundingClientRect();
      const services = document.querySelector('#roadMap')!.getBoundingClientRect();
      return { middle: symbol.top + symbol.height / 2, portfolioBottom: portfolio.bottom, servicesTop: services.top };
    });
    expect(geometry.middle).toBeLessThan(geometry.portfolioBottom);
    expect(geometry.middle).toBeLessThan(geometry.servicesTop);
    await expect(symbol).toHaveAttribute('data-brand-material', 'carpet');
    await page.screenshot({ path: test.info().outputPath('still-over-portfolio.png') });
    await positionBoundary(-25);
    await expect(symbol).toHaveAttribute('data-brand-material', 'suede');
    await positionBoundary(25);
    await expect(symbol).toHaveAttribute('data-brand-material', 'carpet');
    await context.close();
  });
}
