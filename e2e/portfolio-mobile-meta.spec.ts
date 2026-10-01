import {expect,test} from '@playwright/test';

for(const language of ['pt','en'])test(`mobile metadata returns after resize ${language}`,async({browser})=>{
 const context=await browser.newContext({viewport:{width:283,height:500},locale:language==='pt'?'pt-BR':'en-US',isMobile:true,hasTouch:true,reducedMotion:'reduce'});
 const page=await context.newPage();
 await page.goto('/portfolio',{waitUntil:'networkidle'});
 const card=page.locator('[data-mobile-detail-card]');
 for(let index=0;index<5;index++)await card.getByRole('button',{name:language==='pt'?'Próximo projeto':'Next project',exact:true}).click();
 await expect(card.locator('h2')).toHaveText('Walter Adv');
 const chips=card.locator('[data-mobile-meta] span');
 const inspect=()=>chips.evaluateAll(elements=>elements.map(element=>({text:element.textContent,hidden:element.getAttribute('data-overflow-hidden')==='true',visible:getComputedStyle(element).visibility!=='hidden',ariaHidden:element.getAttribute('aria-hidden')})));
 await expect.poll(async()=>(await inspect()).filter(chip=>chip.hidden).length).toBeGreaterThan(0);
 const narrow=await inspect();
 await page.screenshot({path:test.info().outputPath('narrow.png')});
 await page.setViewportSize({width:667,height:375});
 await expect.poll(async()=>(await inspect()).filter(chip=>chip.hidden).length).toBeLessThan(narrow.filter(chip=>chip.hidden).length);
 const wide=await inspect();
 expect(wide.filter(chip=>chip.hidden).every(chip=>!chip.visible&&chip.ariaHidden==='true')).toBe(true);
 await page.setViewportSize({width:283,height:500});
 await expect.poll(inspect).toEqual(narrow);
 await context.close();
});
