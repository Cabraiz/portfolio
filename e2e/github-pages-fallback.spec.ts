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

for (const route of [
  "/home",
  "/portfolio",
  "/roadmap",
  "/technologies",
  "/live",
  "/contact",
]) {
  test(`${route} has a direct GitHub Pages document for refresh`, async ({
    request,
  }) => {
    const response = await request.get(route);
    expect(response.status()).toBe(200);
    expect(response.url()).toMatch(new RegExp(`${route}/?$`));
    expect(await response.text()).toContain('<div id="root"></div>');
  });
}
