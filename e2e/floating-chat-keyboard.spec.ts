import { expect, test } from '@playwright/test';

// No celular o chat não aparece: o contato fica pelos botões do Início.
const sizes = [{width:320,height:640},{width:360,height:800},{width:390,height:844},{width:430,height:932},{width:667,height:375},{width:844,height:390}];
for (const viewport of sizes) {
  test(`celular não mostra o chat ${viewport.width}x${viewport.height}`, async ({browser}) => {
    const context=await browser.newContext({locale:'pt-BR',viewport,isMobile:true,hasTouch:true});
    const page=await context.newPage();
    for (const path of ['/home','/portfolio','/contact','/servicos']) {
      await page.goto(path,{waitUntil:'networkidle'});
      await expect(page.locator('main[data-landing-viewport="mobile"]')).toBeVisible();
      await page.waitForTimeout(300);
      await expect(page.getByRole('button',{name:'Abrir chat'}),path).toHaveCount(0);
      await expect(page.locator('[data-chat-panel]'),path).toHaveCount(0);
    }
    await context.close();
  });
}

test('o chat continua no desktop', async ({page}) => {
  await page.setViewportSize({width:1366,height:720});
  await page.goto('/contact',{waitUntil:'networkidle'});
  await expect(page.getByRole('button',{name:'Abrir chat'})).toBeVisible();
});
