import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("application document uses the dark background before JavaScript", async ({
  request,
}) => {
  const response = await request.get("/home");
  const html = await response.text();

  expect(response.status()).toBe(200);
  expect(html).toMatch(/html,body,#root\{[^}]*background:#050505[^}]*\}/);
});

test("GitHub Pages fallback redirects without painting the old 404 screen", async ({
  request,
}) => {
  const [rootFallback, publicFallback] = await Promise.all([
    readFile(new URL("../404.html", import.meta.url), "utf8"),
    readFile(new URL("../public/404.html", import.meta.url), "utf8"),
  ]);

  expect(rootFallback).toBe(publicFallback);
  expect(rootFallback).toContain("background: #050505");
  expect(rootFallback).toContain("visibility: hidden");
  expect(rootFallback).not.toContain("#0f2027");
  expect(rootFallback).not.toContain("<h1>404</h1>");
  expect(rootFallback.indexOf("<script>")).toBeLessThan(
    rootFallback.indexOf("<body>"),
  );

  const deployedFallback = await request.get("/404.html");
  expect(deployedFallback.status()).toBe(200);
  expect(await deployedFallback.text()).toBe(rootFallback);
});

// Início e Portfólio (pt e en) chegam pré-renderizados, com o conteúdo
// legível por buscadores e IAs antes do JavaScript.
for (const route of ["/home", "/portfolio", "/en/home", "/en/portfolio"]) {
  test(`${route} has a direct GitHub Pages document for refresh`, async ({
    request,
  }) => {
    const response = await request.get(route);
    expect(response.status()).toBe(200);
    expect(response.url()).toMatch(new RegExp(`${route}/?$`));
    expect(await response.text()).toContain('<div id="root" data-prerendered="true">');
  });
}

// Rotas aposentadas respondem com um documento que leva ao Início e não é
// indexado.
for (const route of ["/servicos", "/roadmap", "/technologies", "/live", "/contact"]) {
  test(`${route} redirects to the home document without being indexed`, async ({
    request,
  }) => {
    const response = await request.get(route);
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).toContain('<meta name="robots" content="noindex,follow" />');
    expect(html).toMatch(/<meta http-equiv="refresh" content="0; url=[^"]*\/home\/" \/>/);
  });
}
