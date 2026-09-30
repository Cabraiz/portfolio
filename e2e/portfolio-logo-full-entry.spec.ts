import { expect, test } from "@playwright/test";

for (const viewport of [
  { width: 273, height: 431 },
  { width: 283, height: 500 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 568, height: 320 },
  { width: 667, height: 375 },
]) {
  test(`logo começa a descida só após entrada completa ${viewport.width}x${viewport.height}`, async ({ browser }) => {
    const context = await browser.newContext({ viewport, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    const root = page.locator("[data-portfolio-root]");
    const brand = page.locator('[data-mobile-brand-pusher="true"]');
    await page.goto(new URL("/portfolio", test.info().project.use.baseURL).toString(), { waitUntil: "networkidle" });
    const measure = () => page.evaluate(() => {
      const logo = document.querySelector<HTMLElement>('[data-mobile-brand-pusher="true"]')!;
      const section = document.querySelector<HTMLElement>("[data-portfolio-root]")!;
      const box = logo.getBoundingClientRect();
      const region = section.getBoundingClientRect();
      return { top: box.top, restTop: box.top - new DOMMatrixReadOnly(getComputedStyle(logo).transform).m42,
        scroll: scrollY, rootTop: region.top, height: region.height, opacity: Number(getComputedStyle(logo).opacity) };
    });
    for (let reload = 0; reload < 2; reload++) {
      if (reload) await page.reload({ waitUntil: "networkidle" });
      await expect.poll(async () => (await root.boundingBox())?.y).toBeCloseTo(0, 0);
      await page.waitForTimeout(250);
      const entered = await measure();
      expect(entered.height).toBe(viewport.height);
      expect(entered.top, "logo must be at the top when the complete Portfolio first appears").toBeCloseTo(entered.restTop, 0);
      expect(entered.opacity).toBe(1);
    }
    // Stop route alignment so it cannot conceal a scroll-motion failure.
    await page.evaluate(() => dispatchEvent(new Event("touchstart")));
    await page.waitForTimeout(5200);
    const entry = await root.evaluate(el => el.getBoundingClientRect().top + scrollY);
    // In the final entry segment the brand rides the incoming section's top.
    for (const offset of [60, 40, 20, 0]) {
      await page.evaluate(y => scrollTo({ top: y, behavior: "instant" }), entry - offset);
      await page.waitForTimeout(150);
      const sample = await measure();
      expect(sample.top - sample.rootTop).toBeCloseTo(sample.restTop, 0);
    }
    let previous: Awaited<ReturnType<typeof measure>> | undefined;
    for (let offset = -60; offset <= 60; offset += 4) {
      await page.evaluate(y => scrollTo({ top: y, behavior: "instant" }), entry + offset);
      await page.waitForTimeout(60);
      const sample = await measure();
      if (previous) expect(Math.abs(sample.top - previous.top), "entry must not reset or jump").toBeLessThanOrEqual(
        Math.abs(sample.scroll - previous.scroll) + .5
      );
      if (offset <= 0) expect(sample.top - sample.rootTop).toBeCloseTo(sample.restTop, 0);
      previous = sample;
    }
    await page.evaluate(y => scrollTo({ top: y, behavior: "instant" }), entry);
    await page.waitForTimeout(150);
    const start = await measure();
    await page.screenshot({ path: test.info().outputPath("portfolio-entry.png") });
    await page.evaluate(y => scrollTo({ top: y, behavior: "instant" }), entry + viewport.height * .18);
    await page.waitForTimeout(200);
    const descending = await measure();
    expect(descending.top).toBeGreaterThan(start.top + 20);
    expect(descending.opacity).toBe(1);
    await expect(brand).toBeVisible();
    // Coming back must restore the same beginning of the Portfolio phase.
    await page.evaluate(y => scrollTo({ top: y, behavior: "instant" }), entry);
    await page.waitForTimeout(200);
    const returned = await measure();
    expect(returned.top).toBeCloseTo(returned.restTop, 0);
    await page.goto(new URL("/home", test.info().project.use.baseURL).toString(), { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Abrir menu", exact: true }).click();
    await page.getByRole("button", { name: "Portfólio", exact: true }).click();
    await expect.poll(async () => (await root.boundingBox())?.y).toBeCloseTo(0, 0);
    await expect.poll(async () => {
      const sample = await measure();
      return sample.top - sample.restTop;
    }).toBeCloseTo(0, 0);
    await context.close();
  });
}
