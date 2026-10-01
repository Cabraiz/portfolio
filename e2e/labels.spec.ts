import { expect, test, type Page } from '@playwright/test';

async function connectLanguageTest(page: Page) {
  // Test-only module uses the application's singleton; no debug API is shipped.
  await page.route('**/__label-test.js',route=>route.fulfill({contentType:'text/javascript',body:`
    import i18n from '/src/i18n/i18n.ts';
    import { localizeLabel } from '/src/i18n/labels.ts';
    window.labelTest={changeLanguage:language=>i18n.changeLanguage(language),localizeLabel};
  `}));
  await page.addScriptTag({type:'module',url:'/__label-test.js'});
  await expect.poll(()=>page.evaluate(()=>Boolean(Reflect.get(window,'labelTest')))).toBe(true);
}

for(const viewport of [{width:390,height:844},{width:1366,height:720}]){
  test(`PT/EN completam a Home, mapa, Rede IA e chat ${viewport.width}`,async({browser})=>{
    test.setTimeout(90_000);
    const context=await browser.newContext({viewport,locale:'en-US',isMobile:viewport.width<992,hasTouch:viewport.width<992,reducedMotion:'reduce'});
    const page=await context.newPage();
    await page.route('**/api/contact*',route=>route.fulfill({json:{ok:true,cursor:0,replies:[]}}));
    await page.goto('/home',{waitUntil:'networkidle'});
    await expect(page.locator('html')).toHaveAttribute('lang','en');
    if(viewport.width<992){
      await expect(page.getByText('Software Engineer',{exact:true})).toBeVisible();
      await expect(page.getByText('Founder',{exact:true})).toBeVisible();
      await expect(page.getByText('Résumé',{exact:true})).toBeVisible();
      await expect(page.getByText('TECHNOLOGY',{exact:true})).toBeVisible();
    }else await expect(page.getByText('Developer',{exact:true})).toBeVisible();
    await page.screenshot({path:test.info().outputPath('home-en.png')});
    await connectLanguageTest(page);
    await page.evaluate(()=>Reflect.get(window,'labelTest').changeLanguage('pt'));
    await expect(page.locator('html')).toHaveAttribute('lang','pt');
    if(viewport.width<992)await expect(page.getByText('Engenheiro de Software',{exact:true})).toBeVisible();
    else await expect(page.getByText('Desenvolvedor',{exact:true})).toBeVisible();
    await page.evaluate(()=>Reflect.get(window,'labelTest').changeLanguage('en'));
    await page.goto('/portfolio',{waitUntil:'networkidle'});
    if(viewport.width<992)await expect(page.locator('[data-mobile-feature-copy] h2')).toHaveText('NEXOVARE');
    await expect(page.getByText('Business management platform',{exact:true}).filter({visible:true}).first()).toBeVisible();
    if(viewport.width<992){
      await expect(page.getByRole('button',{name:'Zoom in',exact:true})).toBeVisible();
      await expect(page.locator('[data-mobile-location]').getByText('Brazil',{exact:true})).toBeVisible();
      await expect(page.getByText('All projects',{exact:true})).toBeVisible();
    }
    await page.screenshot({path:test.info().outputPath('portfolio-en.png')});
    const next=page.getByRole('button',{name:'Next project',exact:true}).filter({visible:true}).first();
    await next.click();
    await expect(page.getByText('Mobile banking experience',{exact:true}).filter({visible:true}).first()).toBeVisible();
    await next.click();
    await expect(page.getByText('Cross-border e-commerce',{exact:true}).filter({visible:true}).first()).toBeVisible();
    await page.goto('/servicos',{waitUntil:'networkidle'});
    await expect(page.locator('#roadMap').getByText('Services',{exact:true})).toBeVisible();
    await page.goto('/technologies',{waitUntil:'networkidle'});
    await expect(page.getByText(viewport.width<992?'AI BRAIN':'ARTIFICIAL BRAIN AT WORK',{exact:true})).toBeVisible();
    await expect(page.getByText('THINKING ·',{exact:false}).first()).toBeVisible();
    const brainText=await page.locator('#technologies').innerText();
    expect(brainText).not.toMatch(/PENSANDO|CÉREBRO|LEMBRANÇAS|Raciocínio|Criatividade|Estabilidade|sinais/);
    await expect(page.locator('#technologies [data-animated-number]').filter({hasText:'signals'})).toHaveCount(1);
    await page.screenshot({path:test.info().outputPath('brain-en.png')});
    await page.goto('/contact',{waitUntil:'networkidle'});
    await page.getByRole('button',{name:'Open chat',exact:true}).click();
    await expect(page.getByText('Assistant',{exact:true})).toBeVisible();
    await expect(page.getByRole('button',{name:'Send',exact:true})).toBeVisible();
    await page.screenshot({path:test.info().outputPath('chat-en.png')});
    await page.locator('input[name="message"]').fill('Mensagem pessoal sem tradução');
    await connectLanguageTest(page);
    await page.evaluate(()=>Reflect.get(window,'labelTest').changeLanguage('pt'));
    await expect(page.getByRole('button',{name:'Enviar',exact:true})).toBeVisible();
    await expect(page.locator('input[name="message"]')).toHaveValue('Mensagem pessoal sem tradução');
    await page.reload({waitUntil:'networkidle'});
    await expect(page.locator('html')).toHaveAttribute('lang','pt');
    await page.getByRole('button',{name:'Abrir chat',exact:true}).click();
    await expect(page.getByText('Atendente',{exact:true})).toBeVisible();
    await page.screenshot({path:test.info().outputPath('labels-pt.png')});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBe(0);
    await context.close();
  });
}

test('mapeamento preserva nomes e resolve parâmetros, singular e plural',async({page})=>{
  await page.goto('/contact',{waitUntil:'networkidle'});
  await connectLanguageTest(page);
  const check=async(language:string,text:string)=>page.evaluate(async({language,text})=>{const api=Reflect.get(window,'labelTest');await api.changeLanguage(language);return api.localizeLabel(text);},{language,text});
  expect(await check('en','Selecionar Entre Paginas')).toBe('Select Entre Paginas');
  expect(await check('en','Destino atual: Bissau, Guiné-Bissau')).toBe('Current destination: Bissau, Guinea-Bissau');
  expect(await check('en','1 passageiros aguardando no 2º andar')).toBe('1 passenger waiting on floor 2');
  expect(await check('en','3 passageiros aguardando no 2º andar')).toBe('3 passengers waiting on floor 2');
  expect(await check('pt','1 passageiros aguardando no 2º andar')).toBe('1 passageiro aguardando no 2º andar');
  expect(await check('en','Walter Adv')).toBe('Walter Adv');
  expect(await check('en','Fran Studio')).toBe('Fran Studio');
  expect(await check('en','Entre Paginas')).toBe('Entre Paginas');
  expect(await check('en','\n   sinais ')).toBe('\n   signals ');
});

test('jogo do elevador mantém controles e nomes acessíveis nos dois idiomas',async({browser})=>{
  const context=await browser.newContext({viewport:{width:390,height:844},locale:'en-US',isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  const page=await context.newPage();
  await page.goto('/elevator',{waitUntil:'networkidle'});
  await expect(page.getByRole('button',{name:'Go up one floor',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Restart elevator game',exact:true})).toBeVisible();
  await expect(page.getByText('Drop-offs',{exact:true})).toBeVisible();
  await connectLanguageTest(page);
  await page.evaluate(()=>Reflect.get(window,'labelTest').changeLanguage('pt'));
  await expect(page.getByRole('button',{name:'Subir um andar',exact:true})).toBeVisible();
  await expect(page.getByText('Pontuação',{exact:true})).toBeVisible();
  await page.screenshot({path:test.info().outputPath('elevator-pt.png')});
  await context.close();
});

test('bússola acompanha o idioma e preserva o modo explícito',async({page})=>{
  await page.goto('/contact',{waitUntil:'networkidle'});
  await connectLanguageTest(page);
  await page.evaluate(()=>Reflect.get(window,'labelTest').changeLanguage('en'));
  await page.route('**/__compass-test.js',route=>route.fulfill({contentType:'text/javascript',body:`
    import React from '/node_modules/.vite/deps/react.js';
    import ReactDOM from '/node_modules/.vite/deps/react-dom_client.js';
    import Compass from '/src/pages/Mateus/Home/components/mobile/game/driving/view/HomeDriveCompass.tsx';
    const host=document.createElement('div');host.id='compass-test';document.body.append(host);
    ReactDOM.createRoot(host).render(React.createElement(React.Fragment,null,
      React.createElement(Compass,{headingRad:Math.PI/2}),
      React.createElement(Compass,{headingRad:Math.PI*1.5}),
      React.createElement(Compass,{headingRad:Math.PI*1.5,cardinalMode:'ptBR'})
    ));
  `}));
  await page.addScriptTag({type:'module',url:'/__compass-test.js'});
  const compass=page.locator('#compass-test');
  await expect(compass.getByRole('status',{name:'Compass: heading E',exact:true})).toBeVisible();
  await expect(compass.getByRole('status',{name:'Compass: heading W',exact:true})).toBeVisible();
  await expect(compass.getByRole('status',{name:'Compass: heading O',exact:true})).toBeVisible();
  await page.evaluate(()=>Reflect.get(window,'labelTest').changeLanguage('pt'));
  await expect(compass.getByRole('status',{name:'Bússola: direção O',exact:true})).toHaveCount(2);
});
