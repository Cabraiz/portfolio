import {expect,test} from '@playwright/test';

const viewports=[{width:283,height:500},{width:390,height:844},{width:430,height:932},{width:667,height:375},{width:1280,height:720}];
for(const viewport of viewports)for(const language of ['pt','en']){
 test(`chat pricing navigates visibly ${viewport.width}x${viewport.height} ${language}`,async({browser})=>{
  test.setTimeout(60000);
  const mobile=viewport.width<768;
  const context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile,locale:language==='pt'?'pt-BR':'en-US',reducedMotion:'no-preference'});
  const page=await context.newPage();
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/contact',{waitUntil:'networkidle'});
  const trigger=page.getByRole('button',{name:language==='pt'?'Abrir chat':'Open chat',exact:true});
  await trigger.click();
  const input=page.locator('input[name="message"]');
  await input.fill('Quero conhecer os serviços');
  await page.getByRole('button',{name:language==='pt'?'Ver valores':'View pricing',exact:true}).click();
  await expect(page).toHaveURL(/\/servicos$/);
  await expect(page.locator('[data-chat-panel]')).toHaveCount(0);
  const services=page.locator('[data-services-root]');
  await expect(services).toBeVisible();
  await expect.poll(()=>services.evaluate(element=>Math.abs(element.getBoundingClientRect().top)),{timeout:6000}).toBeLessThan(100);
  await expect(page.locator('[data-landing-viewport][data-active-section]')).toHaveAttribute('data-active-section','roadMap');
  await services.screenshot({path:test.info().outputPath('services-after-click.png')});
  await page.reload({waitUntil:'networkidle'});
  await expect.poll(()=>services.evaluate(element=>Math.abs(element.getBoundingClientRect().top)),{timeout:6000}).toBeLessThan(100);
  // Return through the actual navigation, then repeat the chat shortcut.
  if(mobile)await page.getByRole('button',{name:language==='pt'?'Abrir menu':'Open menu',exact:true}).click();
  const contactLabel=mobile?(language==='pt'?'Contato':'Contact'):(language==='pt'?'Fotos':'Photos');
  await page.getByRole('button',{name:contactLabel,exact:true}).click();
  await expect(page).toHaveURL(/\/contact$/);
  await expect(page.locator('section#contact')).toBeInViewport();
  await trigger.click();
  await page.getByRole('button',{name:language==='pt'?'Ver valores':'View pricing',exact:true}).click();
  await expect.poll(()=>services.evaluate(element=>Math.abs(element.getBoundingClientRect().top)),{timeout:6000}).toBeLessThan(100);
  expect(errors).toEqual([]);
  await context.close();
 });
}
