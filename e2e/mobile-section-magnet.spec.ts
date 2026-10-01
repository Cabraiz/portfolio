import { expect, test, type Page, type CDPSession } from '@playwright/test';

async function prepare(page: Page) {
  await page.goto('/home', { waitUntil: 'networkidle' });
  await page.locator('[data-mobile-editorial-home]').waitFor();
  await page.mouse.click(5, 50); // Interrupt initial alignment without touching the CTA.
}

async function touch(cdp: CDPSession, type: 'touchStart' | 'touchMove' | 'touchEnd', y = 350, x = 250) {
  await cdp.send('Input.dispatchTouchEvent', {
    type,
    touchPoints: type === 'touchEnd' ? [] : [{ x, y }],
  });
}

test('touch release, interruption and momentum remain free', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await prepare(page);
  const cdp = await context.newCDPSession(page);
  await placeNearPortfolio(page, 0.09);
  await page.waitForTimeout(650);
  await touch(cdp, 'touchStart', 400);
  for (const y of [390, 380, 370, 360]) {
    await touch(cdp, 'touchMove', y);
    await page.waitForTimeout(65);
  }
  await page.waitForTimeout(500);
  const held = await page.locator('#portfolio').evaluate(el => el.getBoundingClientRect().top);
  expect(held).toBeGreaterThan(5);
  expect(held).toBeLessThan(70);
  expect(await page.locator('main[data-landing-viewport]').getAttribute('data-mobile-section-settling')).toBeNull();
  await touch(cdp, 'touchEnd');
  await expect.poll(() => page.locator('#portfolio').evaluate(el => el.getBoundingClientRect().top)).toBeCloseTo(0, 0);

  // Interrupt the correction in progress, without moving the finger.
  await placeNearPortfolio(page, 0.07);
  await page.waitForTimeout(650);
  await page.mouse.move(250, 350);
  await page.mouse.wheel(0, 2);
  await page.waitForFunction(() => document.querySelector('main[data-mobile-section-settling]'));
  await touch(cdp, 'touchStart', 400);
  const paused = await page.evaluate(() => scrollY);
  await page.waitForTimeout(500);
  expect(Math.abs(await page.evaluate(() => scrollY) - paused)).toBeLessThan(1);
  expect(await page.locator('main[data-landing-viewport]').getAttribute('data-mobile-section-settling')).toBeNull();
  await touch(cdp, 'touchEnd');
  await page.waitForTimeout(600);
  expect(Math.abs(await page.evaluate(() => scrollY) - paused)).toBeLessThan(1);

  // A new deliberate gesture can leave the section; there is no mandatory snap.
  await page.mouse.wheel(0, -180);
  await page.waitForTimeout(700);
  expect(await page.evaluate(() => scrollY)).toBeLessThan(paused - 100);
  expect(errors).toEqual([]);
  await context.close();
});

test('input focus, keyboard resize, nested rail and page return do not trigger a magnet', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await prepare(page);
  await placeNearPortfolio(page, 0.07);
  await page.waitForTimeout(650);
  // The project buttons own their input, even while the outer section is near its boundary.
  const project = page.locator('#portfolio button').first();
  await project.dispatchEvent('wheel', { deltaY: 2 });
  const before = await page.evaluate(() => scrollY);
  await page.waitForTimeout(700);
  expect(await page.evaluate(() => scrollY)).toBeCloseTo(before, 0);

  await page.mouse.move(250, 350);
  await page.mouse.wheel(0, 2);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await page.waitForTimeout(500);
  const afterBlur = await page.evaluate(() => scrollY);
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await page.waitForTimeout(500);
  // The existing lifecycle anchor may restore the pre-wheel position by 2 px.
  // A section snap would move ~57 px and erase the visible boundary.
  expect(Math.abs(await page.evaluate(() => scrollY) - afterBlur)).toBeLessThan(4);
  expect(await page.locator('#portfolio').evaluate(el => el.getBoundingClientRect().top)).toBeGreaterThan(40);

  // Use the real mobile chat input, rather than injecting a dummy control.
  await page.getByRole('button', { name: 'Abrir menu', exact: true }).click();
  await page.getByRole('button', { name: 'Contato', exact: true }).click();
  await expect(page).toHaveURL(/\/contact$/);
  await page.getByRole('button', { name: 'Abrir chat', exact: true }).click();
  const input = page.locator('input[name="message"]');
  await input.waitFor();
  await input.focus();
  await page.setViewportSize({ width: 390, height: 500 });
  await page.waitForTimeout(500);
  expect(await page.locator('main[data-landing-viewport]').getAttribute('data-mobile-section-settling')).toBeNull();
  await page.setViewportSize({ width: 390, height: 844 });
  await input.blur();
  await context.close();
});

test('desktop and reduced motion preserve unsnapped scrolling', async ({ browser }) => {
  for (const mobile of [false, true]) {
    const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 720 }, isMobile: mobile, hasTouch: mobile, reducedMotion: mobile ? 'reduce' : 'no-preference' });
    const page = await context.newPage();
    await page.goto('/home', { waitUntil: 'networkidle' });
    await page.mouse.click(250, 350);
    const geometry = await placeNearPortfolio(page, 0.07);
    await page.waitForTimeout(650);
    await page.mouse.move(250, 350);
    await page.mouse.wheel(0, 2);
    await page.waitForTimeout(1100);
    expect(Math.abs(await page.evaluate(() => scrollY) - geometry.position)).toBeLessThan(5);
    await context.close();
  }
});

test('nearby boundaries in Services, AI Network and Contact use their normal alignment', async ({ browser }) => {
  test.setTimeout(60_000);
  const context = await browser.newContext({ locale: 'pt-BR', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await prepare(page);
  for (const section of [
    { id: 'roadMap', label: 'Serviços' },
    { id: 'technologies', label: 'Rede IA' },
    { id: 'contact', label: 'Contato' },
  ]) {
    await page.getByRole('button', { name: 'Abrir menu', exact: true }).click();
    await page.getByRole('button', { name: section.label, exact: true }).click();
    await expect(page.locator('main[data-landing-viewport]')).toHaveAttribute('data-active-section', section.id);
    await page.waitForTimeout(1100);
    const locator = page.locator(`section#${section.id}`);
    const alignment = await locator.evaluate(element => {
      const rect = element.getBoundingClientRect();
      return { top: rect.top, y: scrollY, height: rect.height };
    });
    expect(alignment.top).toBeGreaterThanOrEqual(-1);
    expect(alignment.top).toBeLessThan(100);
    await page.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), alignment.y - alignment.height * 0.06);
    await page.waitForTimeout(650);
    await page.mouse.move(5, 350);
    await page.mouse.wheel(0, 2);
    await expect.poll(() => locator.evaluate(el => el.getBoundingClientRect().top)).toBeCloseTo(alignment.top, 0);
  }
  await context.close();
});

async function placeNearPortfolio(page: Page, fraction: number) {
  // Pixel rounding can reach the destination before Lenis completes its easing.
  // Do not start the next programmatic fixture placement during that animation.
  await expect(page.locator('main[data-mobile-section-settling]')).toHaveCount(0);
  return page.locator('#portfolio').evaluate((element, fraction) => {
    const rect = element.getBoundingClientRect();
    const target = window.scrollY + rect.top;
    const position = target - rect.height * fraction;
    window.scrollTo({ top: position, behavior: 'instant' });
    return { target, height: rect.height, position };
  }, fraction);
}

for (const viewport of [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 667, height: 375 },
]) {
  test(`gentle mobile magnet ${viewport.width}x${viewport.height}`, async ({ browser }) => {
    const context = await browser.newContext({ viewport, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await prepare(page);
    const geometry = await placeNearPortfolio(page, 0.07);
    await page.waitForTimeout(650);
    // Programmatic scrolling alone must remain free.
    expect(await page.evaluate(() => scrollY)).toBeCloseTo(geometry.position, 0);
    await page.mouse.move(220, viewport.height / 2);
    await page.mouse.wheel(0, 2);
    await expect.poll(() => page.locator('#portfolio').evaluate(el => el.getBoundingClientRect().top)).toBeCloseTo(0, 0);
    await page.screenshot({ path: test.info().outputPath('settled.png') });

    // Moving slightly past the boundary also settles back, without a section skip.
    await placeNearPortfolio(page, -0.07);
    await page.waitForTimeout(650);
    await page.mouse.wheel(0, -2);
    await expect.poll(() => page.locator('#portfolio').evaluate(el => el.getBoundingClientRect().top)).toBeCloseTo(0, 0);

    const belowThreshold = await placeNearPortfolio(page, 0.15);
    await page.waitForTimeout(650);
    await page.mouse.wheel(0, 2);
    await page.waitForTimeout(700);
    expect(Math.abs(await page.evaluate(() => scrollY) - belowThreshold.position)).toBeLessThan(5);
    expect(errors).toEqual([]);
    await context.close();
  });
}
