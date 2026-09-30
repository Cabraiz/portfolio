import {expect,test} from '@playwright/test';

const routes=[
 {id:'home',path:'/home',label:'Início',root:'[data-mobile-editorial-home]'},
 {id:'portfolio',path:'/portfolio',label:'Portfólio',root:'[data-portfolio-root]'},
 {id:'roadMap',path:'/servicos',label:'Serviços',root:'[data-services-root]'},
 {id:'technologies',path:'/technologies',label:'Rede IA',root:'[data-cognitive-network-root]'},
 {id:'contact',path:'/contact',label:'Contato',root:'[data-mobile-contact]'},
];

for(const viewport of [{width:390,height:844},{width:568,height:320}]){
 test(`reload preserva a seção inteira ${viewport.width}x${viewport.height}`,async({browser})=>{
  test.setTimeout(120_000);
  const context=await browser.newContext({viewport,isMobile:true,hasTouch:true});
  const page=await context.newPage();
  await page.goto(new URL('/home',test.info().project.use.baseURL).toString(),{waitUntil:'networkidle'});
  for(const route of routes){
   await test.step(route.id,async()=>{
    if(route.id!=='home'){
     await page.getByRole('button',{name:'Abrir menu',exact:true}).click();
     await page.getByRole('button',{name:route.label,exact:true}).click();
     await expect(page).toHaveURL(new RegExp(`${route.path}$`));
    }
    await page.locator(route.root).waitFor();
    await page.reload({waitUntil:'networkidle'});
    await page.locator(route.root).waitFor();
    const measure=()=>page.evaluate(({id,root,path})=>{
     const node=document.querySelector(root),navbar=document.querySelector('nav.navbar');
     if(!node||!navbar)return {ready:false};
     const rect=node.getBoundingClientRect(),bar=navbar.getBoundingClientRect();
     const expectedTop=id==='portfolio'?0:bar.bottom+(id==='home'?0:2);
     return{path:location.pathname===path,top:Math.abs(rect.top-expectedTop)<=1,bottom:Math.abs(rect.bottom-(visualViewport?.height??innerHeight))<=1};
    },route);
    await expect.poll(measure,{timeout:6000}).toEqual({path:true,top:true,bottom:true});
    // Late font/image mounting and browser restoration must not undo alignment.
    await page.waitForTimeout(1500);
    expect(await measure()).toEqual({path:true,top:true,bottom:true});
    // Do not let initial load alignment conceal a bad foreground restoration.
    await page.evaluate(()=>window.dispatchEvent(new Event('touchstart')));
    const cdp=await context.newCDPSession(page);
    await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
    await cdp.send('Page.setWebLifecycleState',{state:'frozen'});
    await page.setViewportSize({...viewport,height:Math.max(320,viewport.height-60)});
    await cdp.send('Page.setWebLifecycleState',{state:'active'});
    await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
    await expect.poll(measure,{timeout:6000}).toEqual({path:true,top:true,bottom:true});
    await page.setViewportSize(viewport);
    await expect.poll(measure,{timeout:6000}).toEqual({path:true,top:true,bottom:true});
    await cdp.detach();
   });
  }
  await context.close();
 });
}

test('reload realinha após a altura visível mudar e libera a rolagem do usuário',async({browser})=>{
 test.setTimeout(90_000);
 for(const route of routes){
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const page=await context.newPage();
  await page.goto(new URL(route.path,test.info().project.use.baseURL).toString(),{waitUntil:'networkidle'});
  await page.locator(route.root).waitFor();
  await page.reload({waitUntil:'networkidle'});await page.locator(route.root).waitFor();
  // Cover changes beyond the old five-second retry window.
  await page.waitForTimeout(5200);
  await page.setViewportSize({width:390,height:760});
  await expect.poll(()=>page.locator(route.root).evaluate(e=>Math.round(e.getBoundingClientRect().bottom)),{timeout:3000}).toBe(760);
  await page.setViewportSize({width:390,height:844});
  await expect.poll(()=>page.locator(route.root).evaluate(e=>Math.round(e.getBoundingClientRect().bottom)),{timeout:3000}).toBe(844);
  if(route.id==='home'){
   await page.mouse.wheel(0,120);await page.waitForTimeout(400);
   const previous=await page.evaluate(()=>scrollY);
   expect(previous).toBeGreaterThan(80);
   await page.setViewportSize({width:390,height:760});await page.waitForTimeout(400);
   expect(await page.evaluate(()=>scrollY)).toBeGreaterThan(80);
  }
  await context.close();
 }
});

test('menu cabe na paisagem e rola sem mover a seção',async({browser})=>{
 const context=await browser.newContext({viewport:{width:568,height:320},isMobile:true,hasTouch:true});
 const page=await context.newPage();
 await page.goto(new URL('/technologies',test.info().project.use.baseURL).toString(),{waitUntil:'networkidle'});
 await page.locator('[data-cognitive-network-root]').waitFor();
 await page.getByRole('button',{name:'Abrir menu',exact:true}).click();
 const panel=page.getByRole('navigation',{name:'Navegação principal mobile'});
 const rect=await panel.boundingBox();expect(rect).not.toBeNull();expect(rect!.y+rect!.height).toBeLessThanOrEqual(320);
 const before=await page.evaluate(()=>scrollY);
 await panel.hover();await page.mouse.wheel(0,300);
 await expect.poll(()=>panel.evaluate(e=>e.scrollTop)).toBeGreaterThan(0);
 expect(await page.evaluate(()=>scrollY)).toBe(before);
 await page.getByRole('button',{name:'Contato',exact:true}).click();
 await expect(page).toHaveURL(/\/contact$/);
 await context.close();
});
