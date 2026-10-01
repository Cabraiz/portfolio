import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
const catalog=JSON.parse(readFileSync('src/i18n/label-catalog.json','utf8')) as string[][];

const projects = [
  {id:'erp-varejo',name:'NEXOVARE',subtitle:'Ecossistema comercial',year:'2021',asset:'nexovare'},
  {id:'app-bank',name:'APP BANCO',subtitle:'Experiência bancária mobile',year:'2022',asset:'app-banco'},
  {id:'guine-bissau-commerce',name:'BIDEIRAS',subtitle:'Comércio digital internacional',year:'2024',asset:'bideiras'},
  {id:'app-barber',name:'APP BARBEARIA',subtitle:'Agenda e recorrência',year:'2023',asset:'app-barbearia'},
  {id:'central-clube-livro',name:'Entre Paginas',subtitle:'Comunidade editorial',year:'2026',asset:'entre-paginas',assetVersion:2},
  {id:'site-adv',name:'Walter Adv',subtitle:'Presença institucional',year:'2020',asset:'walter-adv'},
  {id:'site-cabeleireira',name:'Fran Studio',subtitle:'Marca e captação local',year:'2021',asset:'fran-studio'},
];
const viewports = [{width:283,height:500},{width:320,height:568},{width:360,height:640},
  {width:390,height:844},{width:430,height:932},{width:667,height:375}];

for (const viewport of viewports) for (const language of ['pt','en']) {
  test(`resumo mobile ${viewport.width}x${viewport.height} ${language}`,async({browser})=>{
    test.setTimeout(90_000);
    const context=await browser.newContext({viewport,locale:language==='pt'?'pt-BR':'en-US',isMobile:true,hasTouch:true,reducedMotion:'reduce'});
    const page=await context.newPage();
    await page.goto('/portfolio',{waitUntil:'networkidle'});
    const card=page.locator('[data-mobile-detail-card]');
    for (const project of projects) {
      if(project.id!=='erp-varejo')await card.getByRole('button',{name:language==='pt'?'Próximo projeto':'Next project',exact:true}).click();
      await expect(card.locator(`[data-mobile-project-id="${project.id}"]`)).toHaveAttribute('aria-pressed','true');
      await expect(card.locator('h2')).toHaveText(project.name);
      const next=card.getByRole('button',{name:language==='pt'?'Próximo projeto':'Next project',exact:true});
      const nextPosition=await next.evaluate(button=>{
        const summary=button.closest('[data-mobile-feature-details]');
        const title=summary?.querySelector('h2')?.getBoundingClientRect();
        const meta=summary?.querySelector('[data-mobile-meta]')?.getBoundingClientRect();
        const box=button.getBoundingClientRect();
        return {inSummary:!!summary,box:box.toJSON(),title:title?.toJSON(),meta:meta?.toJSON()};
      });
      expect(nextPosition.inSummary).toBe(true);
      expect(nextPosition.box.left).toBeGreaterThanOrEqual(nextPosition.title!.right-1);
      const nextMiddle=nextPosition.box.top+nextPosition.box.height/2;
      expect(nextMiddle).toBeGreaterThan(nextPosition.title!.top);
      expect(nextMiddle).toBeLessThan(nextPosition.meta!.bottom);
      expect(nextPosition.box.height).toBeGreaterThanOrEqual(44);
      const translation=catalog.find(entry=>entry[0]===project.subtitle);
      const subtitle=language==='en'?translation?.at(-1):project.subtitle;
      await expect(card.locator('[data-mobile-feature-copy] p')).toHaveText(subtitle!);
      await expect(card.getByText(subtitle!,{exact:true})).toHaveCount(1);
      await expect(card.locator('[data-mobile-meta] > span').first()).toHaveText(project.year);
      const image=card.locator('[data-mobile-project-preview] img');
      await expect(image).toBeVisible();
      await expect.poll(()=>image.evaluate(img=>(img as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
      await page.screenshot({path:test.info().outputPath(`${project.asset}-${language}.png`)});
      const geometry=await card.evaluate(element=>{
        const rect=(selector:string)=>element.querySelector(selector)!.getBoundingClientRect().toJSON();
        const children=[...element.querySelectorAll('[data-mobile-feature-copy] h2,[data-mobile-feature-copy] p,[data-mobile-meta] span')].filter(child=>child.getAttribute('data-overflow-hidden')!=='true');
        const meta=element.querySelector('[data-mobile-meta]')!;
        const chips=[...meta.querySelectorAll('span')].map(child=>({text:child.textContent,hidden:child.getAttribute('data-overflow-hidden')==='true',ariaHidden:child.getAttribute('aria-hidden'),box:child.getBoundingClientRect().toJSON()}));
        const bounds=element.getBoundingClientRect();
        return {card:bounds.toJSON(),picture:rect('[data-mobile-project-preview]'),title:rect('h2'),subtitle:rect('[data-mobile-feature-copy] p'),meta:rect('[data-mobile-meta]'),
          clipped:children.filter(child=>child.scrollWidth>child.clientWidth+1||child.getBoundingClientRect().right>bounds.right-5).map(child=>child.textContent),
          chips,metaWidth:meta.clientWidth,
          viewport:{width:innerWidth,height:innerHeight,visualHeight:visualViewport?.height,dpr:devicePixelRatio},overflow:document.documentElement.scrollWidth-innerWidth};
      });
      expect(geometry.picture.right).toBeLessThanOrEqual(geometry.title.left);
      expect(geometry.subtitle.top).toBeGreaterThanOrEqual(geometry.title.bottom-1);
      expect(geometry.meta.top).toBeGreaterThanOrEqual(geometry.subtitle.bottom-1);
      expect(geometry.card.bottom).toBeLessThanOrEqual(viewport.height+1);
      expect(geometry.card.top).toBeGreaterThan(100);
      expect(geometry.clipped).toEqual([]);
      expect(geometry.overflow).toBe(0);
      const shown=geometry.chips.filter(chip=>!chip.hidden);
      expect(shown[0].text).toBe(project.year);
      for(const chip of shown){
        expect(chip.box.top).toBeCloseTo(shown[0].box.top,0);
        expect(chip.box.right).toBeLessThanOrEqual(geometry.meta.left+geometry.metaWidth+0.5);
      }
      for(const chip of geometry.chips.filter(chip=>chip.hidden))expect(chip.ariaHidden).toBe('true');
      await expect(image).toHaveAttribute('src',new RegExp(`${project.asset}-mobile-summary-v${project.assetVersion ?? 1}`));
      await test.info().attach(`${project.asset}-geometry`,{body:JSON.stringify(geometry),contentType:'application/json'});
    }
    await page.reload({waitUntil:'networkidle'});
    await expect(card.locator('h2')).toBeVisible();
    await context.close();
  });
}
