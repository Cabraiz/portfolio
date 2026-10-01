import { expect, test, type Page } from '@playwright/test';

async function mountCommitHarness(page: Page) {
  await page.route('**/__section-commit', route => route.fulfill({
    contentType: 'text/html', body: '<!doctype html><html><body><div id="fixture"></div></body></html>',
  }));
  await page.goto('/__section-commit');
  await page.addScriptTag({type:'module',url:'/e2e/fixtures/sectionCommitHarness.ts'});
  await expect(page.locator('output')).toHaveAttribute('data-committed','home');
  await expect.poll(()=>page.evaluate(()=>Boolean(Reflect.get(window,'commitHarness')))).toBe(true);
}

test('sync before observations uses the observation clock', async ({page}) => {
  await mountCommitHarness(page);
  await page.evaluate(()=>{
    const harness=Reflect.get(window,'commitHarness');
    harness.sync('portfolio'); harness.observe('home');
  });
  await expect(page.locator('output')).toHaveAttribute('data-committed','home',{timeout:1000});
});

test('a stationary candidate commits after cooldown without another scroll', async ({page}) => {
  await mountCommitHarness(page);
  await page.evaluate(()=>Reflect.get(window,'commitHarness').rapid());
  await expect(page.locator('output')).toHaveAttribute('data-committed','portfolio',{timeout:1000});
});

for (const action of ['observe','sync','disable'] as const) {
  test(`pending candidate is cancelled by ${action}`, async ({page}) => {
    await mountCommitHarness(page);
    await page.evaluate(action=>{
      const harness=Reflect.get(window,'commitHarness'); harness.rapid();
      if(action==='observe') harness.observe('home');
      else if(action==='sync') harness.sync('contact');
      else harness.disable();
    },action);
    await page.waitForTimeout(180);
    await expect(page.locator('output')).toHaveAttribute('data-committed',action==='sync'?'contact':'home');
  });
}

test('unmount cancels the pending decision', async ({page}) => {
  await mountCommitHarness(page);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.evaluate(() => {
    const harness = Reflect.get(window, 'commitHarness');
    harness.rapid(); harness.unmount();
  });
  await page.waitForTimeout(180);
  await expect(page.locator('output')).toHaveCount(0);
  expect(errors).toEqual([]);
});
