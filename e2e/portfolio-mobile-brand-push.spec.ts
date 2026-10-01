import {expect,test} from '@playwright/test';

for(const locale of ['pt-BR','en-US']){
test(`reativa o empurrão ao desativar movimento reduzido sem F5 ${locale}`,async({browser})=>{
 const context=await browser.newContext({locale,viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
 const page=await context.newPage();
 try{
  await page.goto(new URL('/home',test.info().project.use.baseURL).toString(),{waitUntil:'networkidle'});
  await page.locator('[data-mobile-editorial-home]').waitFor();
  const logo=page.locator('[data-mobile-brand-pusher]');
  await expect(logo).not.toHaveAttribute('data-mobile-brand-owner');
  await page.emulateMedia({reducedMotion:'no-preference'});
  await expect(logo).toHaveAttribute('data-mobile-brand-owner','home');
  await page.mouse.wheel(0,1);
  let partnersMoved=false,labelsMoved=false,maxPush=0;
  for(let y=350;y<=1350;y+=25){
   await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),y);
   await page.waitForTimeout(60);
   const state=await page.evaluate(()=>{
    const moved=(elements:Element[])=>elements.some(e=>new DOMMatrixReadOnly(getComputedStyle(e).transform).m41>8);
    return {partners:moved([...document.querySelectorAll('[data-mobile-partner-item]')]),
     labels:moved([...(document.querySelector('[data-mobile-location]')?.children??[])]),
     push:parseFloat(document.querySelector<HTMLElement>('[data-mobile-detail-card]')?.style.getPropertyValue('--mobile-brand-push')??'0')||0};
   });
   partnersMoved ||= state.partners;labelsMoved ||= state.labels;maxPush=Math.max(maxPush,state.push);
   // Change the preference while the card is in contact, before virtualization removes it.
   if(partnersMoved && labelsMoved && maxPush===28) break;
  }
  expect(partnersMoved).toBe(true);expect(labelsMoved).toBe(true);expect(maxPush).toBe(28);
  await page.emulateMedia({reducedMotion:'reduce'});
  await expect(logo).not.toHaveAttribute('data-mobile-brand-owner');
  await expect.poll(()=>page.locator('[data-mobile-detail-card]').evaluate(e=>parseFloat(getComputedStyle(e).getPropertyValue('--mobile-brand-push'))||0)).toBe(0);
  expect(await page.locator('[data-mobile-partner-item], [data-mobile-location] > *').evaluateAll(rows=>rows.every(e=>Math.abs(new DOMMatrixReadOnly(getComputedStyle(e).transform).m41)<.1))).toBe(true);
  await page.emulateMedia({reducedMotion:'no-preference'});
  await expect(logo).toHaveAttribute('data-mobile-brand-owner','portfolio');
 }finally{await context.close();}
});
}

for(const locale of ['pt-BR','en-US']){
 test(`mantém empurrão com toque após F5 ${locale}`,async({browser})=>{
  test.setTimeout(90_000);
  const context=await browser.newContext({locale,viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'no-preference'});
  const page=await context.newPage();
  try{
   await page.goto(new URL('/home',test.info().project.use.baseURL).toString(),{waitUntil:'networkidle'});
   await page.reload({waitUntil:'networkidle'});
   await page.locator('[data-mobile-editorial-home]').waitFor();
   await expect(page.locator('[data-mobile-brand-pusher]')).toHaveAttribute('data-mobile-brand-owner','home');
   const cdp=await context.newCDPSession(page);
   await page.evaluate(()=>{
    const state={partners:false,labels:false,push:0,overflow:false,hidden:false};
    (window as Window & {brandTouchProbe?:typeof state}).brandTouchProbe=state;
    const sample=()=>{
     const moved=(elements:Element[])=>elements.some(e=>new DOMMatrixReadOnly(getComputedStyle(e).transform).m41>8);
     const partners=[...document.querySelectorAll('[data-mobile-partner-item]')];
     const labels=[...(document.querySelector('[data-mobile-location]')?.children??[])];
     state.partners ||= moved(partners);state.labels ||= moved(labels);
     state.push=Math.max(state.push,parseFloat(document.querySelector<HTMLElement>('[data-mobile-detail-card]')?.style.getPropertyValue('--mobile-brand-push')??'0')||0);
     state.overflow ||= document.documentElement.scrollWidth>innerWidth;
     state.hidden ||= [...partners,...labels].some(e=>Number(getComputedStyle(e).opacity)<.7);
     requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
   });
   for(let swipe=0;swipe<15;swipe++){
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:360,y:650}]});
    for(let i=1;i<=12;i++){
     await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:360,y:650-i*9}]});
     await page.waitForTimeout(30);
    }
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await page.waitForTimeout(100);
   }
   const state=await page.evaluate(()=>(window as Window & {brandTouchProbe?:{partners:boolean;labels:boolean;push:number;overflow:boolean;hidden:boolean}}).brandTouchProbe);
   expect(state).toEqual({partners:true,labels:true,push:28,overflow:false,hidden:false});
   expect(await page.evaluate(()=>scrollY)).toBeGreaterThan(1000);
  }finally{await context.close();}
 });
}

for(const viewport of [{width:283,height:500},{width:390,height:844},{width:667,height:375},{width:985,height:430}]){
 test(`logo empurra labels e card por contato ${viewport.width}x${viewport.height}`,async({browser})=>{
  const context=await browser.newContext({locale:'pt-BR',viewport,isMobile:true,hasTouch:true});const page=await context.newPage();
  await page.goto(new URL('/home',test.info().project.use.baseURL).toString(),{waitUntil:'networkidle'});
  const root=page.locator('[data-portfolio-root]');await root.waitFor();
  await page.mouse.wheel(0,1);await page.waitForTimeout(100);
  const height=await page.locator('[data-mobile-editorial-home]').evaluate(e=>e.getBoundingClientRect().height);
  const entry=await root.evaluate(e=>e.getBoundingClientRect().top+scrollY);
  const positions=[.4,.55,.64,.655,.67,.685,.7,.715,.73,.75,.77,.79,.81,.85,.9]
   .map(p=>height*p)
   .concat(Array.from({length:41},(_,index)=>entry+viewport.height*index/50));
  const samples=[];
  for(const position of positions){
   await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),position);await page.waitForTimeout(120);
   const data=await page.evaluate(()=>{
    const logo=document.querySelector<HTMLElement>('[data-mobile-brand-pusher]')!,location=document.querySelector('[data-mobile-location]'),card=document.querySelector<HTMLElement>('[data-mobile-detail-card]');
    if(!location||!card)return null;
    const box=logo.getBoundingClientRect(),cardBox=card.getBoundingClientRect();
    const rows=Array.from(location.children).map(e=>({x:new DOMMatrixReadOnly(getComputedStyle(e).transform).m41,top:e.getBoundingClientRect().top,bottom:e.getBoundingClientRect().bottom,right:e.getBoundingClientRect().right,opacity:Number(getComputedStyle(e).opacity)}));
    const first=card.querySelector('[data-mobile-project-id]')?.getBoundingClientRect();
    const push=parseFloat(getComputedStyle(card).getPropertyValue('--mobile-brand-push'))||0;
    return{rows,push,logoTop:box.top,logoBottom:box.bottom,logoRight:box.right,cardTop:cardBox.top,cardRight:cardBox.right,cardLeft:cardBox.left,firstLeft:first?.left,overflow:document.documentElement.scrollWidth>innerWidth};
   });
   if(data)samples.push(data);
  }
  expect(samples.length).toBeGreaterThan(4);
  expect(samples[0].rows.every(row=>Math.abs(row.x)<.1)).toBe(true);
  expect(samples[0].push).toBe(0);
  expect(samples.some(s=>s.rows.some(row=>row.x>8))).toBe(true);
  expect(samples.some(s=>s.rows[0].x>s.rows[2].x+1)).toBe(true);
  const pushed=samples.filter(s=>s.push>=(viewport.width<360?20:28)-.1);
  expect(pushed.length).toBeGreaterThan(0);
  for(const sample of samples){
   expect(sample.overflow).toBe(false);expect(sample.cardRight).toBeLessThanOrEqual(viewport.width);
   expect(sample.push).toBeGreaterThanOrEqual(0);expect(sample.push).toBeLessThanOrEqual(28);
   for(const [index,row] of sample.rows.entries()){expect(row.opacity).toBe(samples[0].rows[index].opacity);expect(row.opacity).toBeGreaterThan(.7);expect(row.x).toBeGreaterThanOrEqual(0);expect(row.right).toBeLessThanOrEqual(viewport.width-7);if(row.x>1)expect(sample.logoBottom+8).toBeGreaterThan(row.top);}
   for(const row of sample.rows){if(sample.logoTop>=row.bottom+32)expect(Math.abs(row.x),'label must return once the logo safely passes').toBeLessThan(.1);}
   if(sample.push>0){expect(sample.logoBottom+8).toBeGreaterThan(sample.cardTop);expect(sample.cardLeft).toBeGreaterThan(samples[0].cardLeft);}
  }
  for(const sample of pushed){expect(sample.firstLeft!).toBeGreaterThanOrEqual(sample.logoRight+6);}
  await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.waitForTimeout(300);
  expect(await page.locator('[data-mobile-detail-card]').evaluate(e=>parseFloat(getComputedStyle(e).getPropertyValue('--mobile-brand-push'))||0)).toBe(0);
  expect(await page.locator('[data-mobile-location] > *').evaluateAll(rows=>rows.every(e=>Math.abs(new DOMMatrixReadOnly(getComputedStyle(e).transform).m41)<.1))).toBe(true);
  await context.close();
 });
}

test('movimento reduzido e desktop mantêm o Portfólio estático',async({browser})=>{
 for(const scenario of [{viewport:{width:390,height:844},reducedMotion:'reduce' as const},{viewport:{width:1366,height:720},reducedMotion:'no-preference' as const}]){
  const context=await browser.newContext(scenario),page=await context.newPage();
  await page.goto(new URL('/portfolio',test.info().project.use.baseURL).toString(),{waitUntil:'networkidle'});await page.locator('[data-portfolio-root]').waitFor();
  expect(await page.locator('[data-mobile-detail-card]').evaluate(e=>parseFloat(getComputedStyle(e).getPropertyValue('--mobile-brand-push'))||0)).toBe(0);
  await context.close();
 }
});
