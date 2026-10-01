import { expect, test, type Page } from '@playwright/test';

// A valid scene box alone cannot prove that its absolutely positioned children fit.
async function visibleScene(page: Page, id: 'home' | 'portfolio') {
  return page.evaluate(id => {
    const h = visualViewport?.height ?? innerHeight;
    const section = document.querySelector<HTMLElement>(`#${id}`)!;
    const navbar = document.querySelector('nav.navbar');
    if (!section || !navbar || !section.querySelector(id === 'home' ? '[data-mobile-editorial-home]' : '[data-portfolio-root]')) return {ready:false};
    const nav = navbar.getBoundingClientRect();
    const r = section.getBoundingClientRect();
    const selectors = id === 'home'
      ? ['#mobile-home-title', '[data-mobile-intro-line]', '[data-mobile-partner-item]', 'nav[aria-label="Ações de contato"]', 'nav[aria-label="Ações de contato"] a', 'nav[aria-label="Ações de contato"] a span']
      : ['[data-portfolio-root]', '[data-mobile-location]', '[data-mobile-detail-card]', '[data-mobile-feature-copy]', '[data-mobile-project-preview]', '[data-mobile-map-controls]'];
    const clipped: string[] = [];
    const missing: string[] = [];
    for (const selector of selectors) if (!section.querySelector(selector)) missing.push(selector);
    for (const selector of selectors) for (const node of section.querySelectorAll<HTMLElement>(selector)) {
      const b = node.getBoundingClientRect();
      let top = 0, bottom = h, left = 0, right = innerWidth;
      for (let parent = node.parentElement; parent; parent = parent.parentElement) {
        const s = getComputedStyle(parent), p = parent.getBoundingClientRect();
        if (['hidden', 'clip', 'auto', 'scroll'].includes(s.overflowY)) { top = Math.max(top, p.top); bottom = Math.min(bottom, p.bottom); }
        if (['hidden', 'clip', 'auto', 'scroll'].includes(s.overflowX)) { left = Math.max(left, p.left); right = Math.min(right, p.right); }
      }
      if (b.top < top - 1 || b.bottom > bottom + 1 || b.left < left - 1 || b.right > right + 1 || getComputedStyle(node).visibility !== 'visible') clipped.push(`${selector}: ${node.textContent?.trim().slice(0,80)}`);
    }
    const backdrop = document.querySelector('[data-portfolio-root] > div:first-child');
    const portfolio = document.querySelector('[data-portfolio-root]');
    const mapDoesNotCoverHome = !backdrop || !portfolio || backdrop.getBoundingClientRect().top >= portfolio.getBoundingClientRect().top - 1;
    const actions = section.querySelector('nav[aria-label="Ações de contato"]')?.getBoundingClientRect();
    const copyDoesNotHitActions = !actions || [...section.querySelectorAll('#mobile-home-title,[data-mobile-intro-line],[data-mobile-partner-item]')].every(node => node.getBoundingClientRect().bottom <= actions.top + 1);
    return { route: location.pathname === `/${id}`, header: Math.abs(nav.height - (id === 'home' ? 72 : 52)) <= 1, top: Math.abs(r.top - (id === 'home' ? nav.bottom : 0)) <= 1, bottom: Math.abs(r.bottom - h) <= 1, clipped, missing, mapDoesNotCoverHome, copyDoesNotHitActions, ctaCount: id === 'home' ? section.querySelectorAll('nav[aria-label="Ações de contato"] a').length : 2, overflow: document.documentElement.scrollWidth > innerWidth };
  }, id);
}

async function expectScene(page: Page, id: 'home' | 'portfolio') {
  await expect.poll(() => visibleScene(page, id), {timeout: 7000}).toEqual({route:true,header:true,top:true,bottom:true,clipped:[],missing:[],mapDoesNotCoverHome:true,copyDoesNotHitActions:true,ctaCount:2,overflow:false});
}

for (const id of ['home','portfolio'] as const) {
  test(`rotação e F5 preservam a cena ${id}`, async ({browser}) => {
    const context = await browser.newContext({locale:'pt-BR',viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    const page = await context.newPage();
    await page.goto(new URL(`/${id}`,test.info().project.use.baseURL).toString(),{waitUntil:'networkidle'});
    await expectScene(page,id);
    await page.evaluate(() => window.dispatchEvent(new Event('touchstart')));
    for (const viewport of [{width:844,height:390},{width:390,height:844}]) {
      await page.setViewportSize(viewport);
      await expectScene(page,id);
      await page.reload({waitUntil:'domcontentloaded'});
      await expectScene(page,id);
      await page.evaluate(() => window.dispatchEvent(new Event('touchstart')));
    }
    await context.close();
  });
}

test('resize e retorno preservam o progresso da rolagem livre', async ({browser}) => {
  const context = await browser.newContext({locale:'pt-BR',viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const page = await context.newPage();
  await page.goto(new URL('/home',test.info().project.use.baseURL).toString(),{waitUntil:'networkidle'});
  await expectScene(page,'home');
  await page.mouse.wheel(0,150); await page.waitForTimeout(400);
  const progress = () => page.evaluate(() => scrollY / document.querySelector('#home')!.getBoundingClientRect().height);
  const before = await progress(); expect(before).toBeGreaterThan(.1);
  await page.setViewportSize({width:390,height:760});
  await expect.poll(async () => Math.abs(await progress() - before)).toBeLessThan(.003);
  const cdp = await context.newCDPSession(page);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await cdp.send('Page.setWebLifecycleState',{state:'frozen'});
  await page.setViewportSize({width:390,height:844});
  await cdp.send('Page.setWebLifecycleState',{state:'active'});
  await page.evaluate(() => {window.dispatchEvent(new Event('focus'));document.dispatchEvent(new Event('visibilitychange'));});
  await expect.poll(async () => Math.abs(await progress() - before)).toBeLessThan(.003);
  await page.mouse.wheel(0,100);await page.waitForTimeout(350);
  expect(await progress()).toBeGreaterThan(before + .05);
  await context.close();
});

for (const viewport of [{width:283,height:500},{width:320,height:568},{width:390,height:694},{width:390,height:844},{width:430,height:932},{width:667,height:375}]) {
  test(`F5 e ciclo de foco mantêm conteúdo inteiro ${viewport.width}x${viewport.height}`, async ({browser}) => {
    test.setTimeout(120_000);
    const context = await browser.newContext({locale:'pt-BR',viewport,isMobile:true,hasTouch:true});
    const page = await context.newPage();
    const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto(new URL('/home',test.info().project.use.baseURL).toString(), {waitUntil:'networkidle'});
    for (const id of ['home','portfolio'] as const) {
      if (id === 'portfolio') {
        await page.getByRole('button',{name:'Abrir menu',exact:true}).click();
        await page.getByRole('button',{name:'Portfólio',exact:true}).click();
        await expect(page).toHaveURL(/\/portfolio$/);
      }
      await expectScene(page,id);
      await page.reload({waitUntil:'domcontentloaded'});
      await expectScene(page,id);
      await page.waitForTimeout(500);
      await expectScene(page,id);
      // End initial load alignment and wait beyond menu's retry window. Neither
      // may mask a broken restoration by correcting its result afterward.
      await page.evaluate(() => window.dispatchEvent(new Event('touchstart')));
      await page.waitForTimeout(5200);
      // Freeze the actual Chromium document, change the viewport while suspended,
      // then resume. Blur/focus events separately cover the window listeners.
      const cdp = await context.newCDPSession(page);
      await page.evaluate(() => window.dispatchEvent(new Event('blur')));
      await cdp.send('Page.setWebLifecycleState',{state:'frozen'});
      await page.setViewportSize({...viewport,height:viewport.height-60});
      await cdp.send('Page.setWebLifecycleState',{state:'active'});
      await page.evaluate(() => window.dispatchEvent(new Event('focus')));
      await expectScene(page,id);
      await page.setViewportSize(viewport);
      await expectScene(page,id);
      await page.screenshot({path:test.info().outputPath(`${id}-returned.png`)});
      await page.reload({waitUntil:'domcontentloaded'});
      await expectScene(page,id);
      await cdp.detach();
    }
    // Returning by menu must restore the CTA, even after a portfolio lifecycle.
    await page.getByRole('button',{name:'Abrir menu',exact:true}).click();
    await page.getByRole('button',{name:'Início',exact:true}).click();
    await expectScene(page,'home');
    for (const progress of [.28,.65]) {
      await page.mouse.wheel(0,viewport.height * progress);
      await page.waitForTimeout(300);
      const path = new URL(page.url()).pathname;
      await page.reload({waitUntil:'domcontentloaded'});
      await expectScene(page,path === '/portfolio' ? 'portfolio' : 'home');
    }
    expect(errors).toEqual([]);
    await context.close();
  });
}
