import { expect, test } from '@playwright/test';

const viewports=[{width:283,height:500},{width:320,height:568},{width:360,height:640},
  {width:390,height:844},{width:430,height:932},{width:667,height:375},{width:390,height:844,language:'en'}];

for(const viewport of viewports)test(`home skeleton ${viewport.width}x${viewport.height} ${viewport.language??'pt'}`,async({browser})=>{
  const context=await browser.newContext({viewport,locale:viewport.language==='en'?'en-US':'pt-BR',isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  const page=await context.newPage();
  const errors:string[]=[];
  page.on('pageerror',error=>errors.push(error.message));
  for(let attempt=0;attempt<2;attempt++){
    let release!:()=>void;
    const gate=new Promise<void>(resolve=>{release=resolve;});
    await page.route(/\/HomeMobile(?:-[\w-]+)?\.(?:tsx|js)(?:\?.*)?$/,async route=>{await gate;await route.continue();});
    if(attempt)await page.reload({waitUntil:'domcontentloaded'});
    else await page.goto('/home',{waitUntil:'domcontentloaded'});
    const skeleton=page.locator('#home [data-skeleton-variant]');
    await expect(skeleton).toBeVisible();
    await page.evaluate(()=>document.fonts.ready);
    await page.screenshot({path:test.info().outputPath(`loading-${attempt}.png`)});
    const initial=await skeleton.evaluate(element=>{
      const root=element.getBoundingClientRect();
      const section=element.closest('[data-page-section]')!.getBoundingClientRect();
      const content=element.closest('[data-section-content]')!.getBoundingClientRect();
      const action=element.querySelector('[data-home-skeleton-part="actions"], [class*="heroActionsRow"]')!.getBoundingClientRect();
      const parts=Object.fromEntries([...element.querySelectorAll('[data-home-skeleton-part]')].map(part=>[part.getAttribute('data-home-skeleton-part'),part.getBoundingClientRect().toJSON()]));
      return {root:root.toJSON(),section:section.toJSON(),content:content.toJSON(),action:action.toJSON(),parts,radius:getComputedStyle(element).borderTopLeftRadius,overflow:document.documentElement.scrollWidth-innerWidth};
    });
    expect(initial.radius).toBe('0px');
    expect(initial.root.height).toBeCloseTo(initial.content.height,0);
    expect(initial.action.bottom).toBeCloseTo(initial.root.bottom,0);
    expect(initial.overflow).toBe(0);
    await expect(skeleton.locator('[data-home-skeleton-part="partners"] [class*="partnerSignature"]')).toHaveCount(4);
    release();
    await page.unrouteAll({behavior:'wait'});
    const loaded=page.locator('[data-mobile-editorial-home]');
    await expect(loaded).toBeVisible();
    await expect(skeleton).toHaveCount(0);
    await expect.poll(()=>loaded.locator('img').evaluate(image=>(image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    await expect(loaded.locator('[data-home-portrait-skeleton]')).toHaveCount(0);
    const final=await loaded.evaluate(element=>{
      const selectors={eyebrow:'section > [class*="eyebrow"]',title:'section > [class*="title"]',identity:'section > [class*="identity"]',intro:'section > p',partners:'section > [class*="partners"]',actions:'nav'};
      return {root:element.getBoundingClientRect().toJSON(),parts:Object.fromEntries(Object.entries(selectors).map(([key,selector])=>[key,element.querySelector(selector)!.getBoundingClientRect().toJSON()]))};
    });
    expect(final.root.height).toBeCloseTo(initial.root.height,0);
    for(const [key,box] of Object.entries(final.parts)){
      const placeholder=initial.parts[key];
      expect(placeholder,`${key} placeholder`).toBeDefined();
      expect(Math.abs(placeholder.top-box.top),`${key} top jump`).toBeLessThan(3);
      expect(Math.abs(placeholder.height-box.height),`${key} height jump`).toBeLessThan(3);
    }
    await page.screenshot({path:test.info().outputPath(`loaded-${attempt}.png`)});
    await test.info().attach(`geometry-${attempt}`,{body:JSON.stringify({initial,final}),contentType:'application/json'});
  }
  expect(errors).toEqual([]);
  await context.close();
});

for(const viewport of [{width:390,height:844},{width:667,height:375}])test(`portrait loading ${viewport.width}x${viewport.height}`,async({browser})=>{
  const context=await browser.newContext({viewport,locale:'pt-BR',isMobile:true,hasTouch:true});
  const page=await context.newPage();
  let release!:()=>void;
  const gate=new Promise<void>(resolve=>{release=resolve;});
  await page.route(/hero-mobile-portrait[^/]*\.png(?:\?.*)?$/,async route=>{
    if(route.request().resourceType()==='image')await gate;
    await route.continue();
  });
  await page.goto('/home',{waitUntil:'domcontentloaded'});
  const home=page.locator('[data-mobile-editorial-home]');
  const placeholder=home.locator('[data-home-portrait-skeleton]');
  await expect(placeholder).toBeVisible();
  const shape=await placeholder.boundingBox();
  const image=home.locator('img');
  const imageBox=await image.boundingBox();
  expect(shape!.width).toBeCloseTo(imageBox!.width,0);
  expect(shape!.height).toBeCloseTo(imageBox!.height,0);
  const height=await home.evaluate(element=>element.getBoundingClientRect().height);
  await page.screenshot({path:test.info().outputPath('portrait-loading.png')});
  release();
  await expect(placeholder).toHaveCount(0);
  await expect.poll(()=>image.evaluate(element=>(element as HTMLImageElement).naturalWidth)).toBe(1024);
  expect(await home.evaluate(element=>element.getBoundingClientRect().height)).toBeCloseTo(height,0);
  await page.screenshot({path:test.info().outputPath('portrait-loaded.png')});
  await context.close();
});

test('desktop keeps its original skeleton',async({page})=>{
  await page.setViewportSize({width:1280,height:720});
  let release!:()=>void;
  const gate=new Promise<void>(resolve=>{release=resolve;});
  await page.route(/\/HomeDesktop(?:-[\w-]+)?\.(?:tsx|js)(?:\?.*)?$/,async route=>{await gate;await route.continue();});
  await page.goto('/home',{waitUntil:'domcontentloaded'});
  const skeleton=page.locator('#home [data-skeleton-variant="hero"]');
  await expect(skeleton).toBeVisible();
  await expect(skeleton.locator('[class*="heroOrb"]')).toBeVisible();
  await page.screenshot({path:test.info().outputPath('desktop-loading.png')});
  release();
  await page.unrouteAll({behavior:'wait'});
});
