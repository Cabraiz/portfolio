import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const outputDirectory = path.join(projectRoot, "dist");
const appShellPath = path.join(outputDirectory, "index.html");

const appRoutes = [
  "home",
  "portfolio",
  "servicos",
  "roadmap",
  "technologies",
  "pricing",
  "live",
  "contact",
  "drive",
  "elevator",
  "enigma",
  "libras-unlock",
  "libras",
  "rosa-unlock",
  "rosa",
  "vinho-unlock",
  "vinho",
  "registerhublocal",
  "loginhublocal",
  "doris",
  "casanova",
  "surprise",
  "hublocal",
];

await Promise.all(
  appRoutes.map(async (route) => {
    const routeDirectory = path.join(outputDirectory, route);
    await mkdir(routeDirectory, { recursive: true });
    await copyFile(appShellPath, path.join(routeDirectory, "index.html"));
  }),
);

await copyFile(
  path.join(projectRoot, "404.html"),
  path.join(outputDirectory, "404.html"),
);

console.log(
  `GitHub Pages prepared with ${appRoutes.length} direct application routes.`,
);
