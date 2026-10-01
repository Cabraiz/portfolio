import { expect, test } from '@playwright/test';

const sizes = [{width:320,height:640},{width:360,height:800},{width:390,height:844},{width:430,height:932},{width:667,height:375}];
for (const viewport of sizes) {
  test(`chat acompanha teclado e mantém a conversa ${viewport.width}x${viewport.height}`, async ({browser}) => {
    const context=await browser.newContext({locale:'pt-BR',viewport,isMobile:true,hasTouch:true,reducedMotion:'reduce'});
    const page=await context.newPage();
    await page.addInitScript(() => {
      const id='16b7d6c2-6d4d-4a0f-9d88-12ef8ac25f41';
      localStorage.setItem('cabraiz-chat-conversation-id',id);
      localStorage.setItem('cabraiz-chat-messages',JSON.stringify({conversationId:id,updatedAt:Date.now(),messages:Array.from({length:12},(_,i)=>({id:String(i),author:i%2?'mateus':'visitor',text:i===11?'Podemos conversar por aqui.':`Mensagem anterior ${i+1}`}))}));
      // Model Chrome's OSK contract: layout stays unchanged while the visible
      // rectangle shrinks/pans. This does not emulate a physical OS keyboard.
      const visible=new EventTarget();
      let keyboardHeight:number|null=null;
      Object.assign(visible,{offsetTop:0,offsetLeft:0,pageTop:0,pageLeft:0,scale:1});
      Object.defineProperties(visible,{width:{get:()=>innerWidth},height:{get:()=>keyboardHeight??innerHeight}});
      Object.defineProperty(window,'visualViewport',{configurable:true,value:visible});
      Object.assign(window,{setChatVisibleViewport:(height:number,top=0)=>{keyboardHeight=height;Object.assign(visible,{offsetTop:top,pageTop:top});visible.dispatchEvent(new Event('resize'));visible.dispatchEvent(new Event('scroll'));}});
    });
    let posts=0;
    await page.route('**/api/contact*', async route=>{
      if(route.request().method()==='POST'){posts++;await route.fulfill({json:{ok:true}});}
      else await route.fulfill({json:{ok:true,cursor:91,replies:[{id:91,text:'Recebi sua mensagem.',sentAt:Date.now()}]}});
    });
    await page.goto('/contact',{waitUntil:'networkidle'});
    await page.getByRole('button',{name:'Abrir chat'}).click();
    const input=page.locator('input[name="message"]'),panel=page.locator('[data-chat-panel]'),body=page.locator('[data-chat-scroll-area]');
    await expect(panel).toBeVisible();
    await expect.soft(input).not.toBeFocused();
    const landingHeight=await page.locator('main[data-active-section="contact"]').evaluate(e=>e.getBoundingClientRect().height);
    await input.fill('Quero conversar sobre um projeto.');
    const visibleHeight=viewport.height<500?220:300;
    const setVisible=async(height:number,top=0)=>{await page.evaluate(({height,top})=>Reflect.get(window,'setChatVisibleViewport')(height,top),{height,top});await page.waitForTimeout(200);};
    const check=async(height:number,top:number)=>{
      await expect.poll(()=>panel.evaluate(e=>e.getBoundingClientRect().bottom)).toBeLessThanOrEqual(top+height);
      const metric=await page.evaluate(()=>{
        const box=(selector:string)=>{const r=document.querySelector(selector)!.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,height:r.height,width:r.width};};
        const input=document.querySelector('input[name="message"]')!;
        return {panel:box('[data-chat-panel]'),body:box('[data-chat-scroll-area]'),composer:box('[data-chat-composer]'),close:box('[data-chat-panel] > button'),input:box('input[name="message"]'),send:box('[data-chat-composer] button'),font:parseFloat(getComputedStyle(input).fontSize),innerHeight,overflow:document.documentElement.scrollWidth-innerWidth};
      });
      expect(metric.panel.top).toBeGreaterThanOrEqual(top);
      expect(metric.body.height).toBeGreaterThanOrEqual(60);
      expect(metric.body.bottom).toBeLessThanOrEqual(metric.composer.top+1);
      for(const item of [metric.input,metric.send,metric.close]){
        expect(item.top).toBeGreaterThanOrEqual(top);expect(item.bottom).toBeLessThanOrEqual(top+height);expect(item.left).toBeGreaterThanOrEqual(0);expect(item.right).toBeLessThanOrEqual(viewport.width);expect(item.height).toBeGreaterThanOrEqual(42);
      }
      expect(metric.font).toBeGreaterThanOrEqual(16);expect(metric.overflow).toBe(0);
      return metric;
    };
    for(const top of [0,48,0]){
      await setVisible(visibleHeight,top);
      const metric=await check(visibleHeight,top);
      expect(metric.innerHeight).toBe(viewport.height);
      expect(await page.locator('main[data-active-section="contact"]').evaluate(e=>e.getBoundingClientRect().height)).toBe(landingHeight);
      await expect(panel).toHaveAttribute('data-chat-compact','true');
      await expect(body.getByText('Podemos conversar por aqui.')).toBeInViewport();
    }
    await page.screenshot({path:test.info().outputPath('above-keyboard.png'),clip:{x:0,y:0,width:viewport.width,height:visibleHeight}});
    await input.press('Enter');
    await expect(body.getByText('Recebi sua mensagem.')).toBeInViewport();
    expect(posts).toBe(1);
    await check(visibleHeight,0);
    await input.fill('Rascunho preservado');
    await input.blur();await setVisible(viewport.height);
    await check(viewport.height,0);
    await expect(input).toHaveValue('Rascunho preservado');
    await page.getByRole('button',{name:/Fechar|Close/,exact:true}).click();
    await expect(panel).toHaveCount(0);
    await context.close();
  });
}

test('chat compacto responde a resize real, rotação e erro sem perder o rascunho',async({browser})=>{
  const context=await browser.newContext({locale:'pt-BR',viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  const page=await context.newPage();let attempts=0;
  await page.route('**/api/contact*',async route=>{
    if(route.request().method()==='GET')await route.fulfill({json:{ok:true,cursor:0,replies:[]}});
    else{attempts++;await route.fulfill({json:{ok:attempts>1}});}
  });
  await page.goto('/contact',{waitUntil:'networkidle'});
  await page.getByRole('button',{name:'Abrir chat'}).click();
  const panel=page.locator('[data-chat-panel]'),input=page.locator('input[name="message"]');
  await expect.poll(()=>panel.evaluate(e=>e.getBoundingClientRect().height)).toBe(360);
  await expect(input).not.toBeFocused();
  await input.fill('Rascunho de um novo projeto');
  await page.setViewportSize({width:390,height:300});
  await expect.poll(()=>panel.evaluate(e=>e.getBoundingClientRect().bottom)).toBeLessThanOrEqual(300);
  await expect(panel).toHaveAttribute('data-chat-compact','true');
  await page.getByRole('button',{name:/Enviar|Send/,exact:true}).click();
  await expect(input).toBeFocused();
  await expect(input).toHaveValue('Rascunho de um novo projeto');
  await expect(page.getByText(/Não enviado|Not sent/)).toBeInViewport();
  await input.press('Enter');
  await expect(input).toHaveValue('');
  expect(attempts).toBe(2);
  await expect(page.getByText(/Mensagem enviada\.$|Message sent\.$/)).toBeInViewport();
  for(const viewport of [{width:390,height:844},{width:844,height:390},{width:390,height:844}]){
    await input.blur();await page.setViewportSize(viewport);
    await expect.poll(()=>panel.evaluate(e=>e.getBoundingClientRect().bottom)).toBeLessThanOrEqual(viewport.height);
    await expect(page.locator('[data-chat-author="visitor"]')).toBeInViewport();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBe(0);
  }
  await page.getByRole('button',{name:/Fechar|Close/,exact:true}).click();
  await expect(panel).toHaveCount(0);
  await page.getByRole('button',{name:'Abrir chat'}).click();
  await expect(page.locator('[data-chat-author="visitor"]')).toHaveCount(1);
  await context.close();
});
