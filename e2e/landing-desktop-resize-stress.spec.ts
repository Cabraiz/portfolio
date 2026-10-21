import { expect, test, type Page } from "@playwright/test";

/**
 * Contrato do desktop: cada seção tem exatamente a altura da viewport, as
 * seções são contíguas e, depois de navegar ou redimensionar, a seção que
 * estava alinhada continua alinhada no topo. Estes testes misturam roda,
 * teclado, cliques no menu e redimensionamentos (720p <-> 1080p etc.).
 */

const SECTION_IDS = [
  "home",
  "portfolio",
  "roadMap",
  "technologies",
  "contact",
] as const;

type SectionId = (typeof SECTION_IDS)[number];

const SECTION_PATHS: Record<SectionId, string> = {
  home: "/home",
  portfolio: "/portfolio",
  roadMap: "/servicos",
  technologies: "/technologies",
  contact: "/contact",
};

const SIZES = [
  { width: 1351, height: 630 },
  { width: 1280, height: 720 },
  { width: 1366, height: 768 },
  { width: 1920, height: 1080 },
  { width: 1920, height: 960 },
  { width: 1536, height: 864 },
  { width: 1366, height: 600 },
  { width: 1440, height: 900 },
] as const;

type Size = (typeof SIZES)[number];

type LandingSnapshot = Readonly<{
  violations: string[];
  activeSectionId: string;
  activeTop: number | null;
}>;

function readLandingSnapshot(page: Page): Promise<LandingSnapshot> {
  return page.evaluate((sectionPaths) => {
    const violations: string[] = [];
    const viewportHeight = window.innerHeight;
    const landing = document.querySelector<HTMLElement>(
      "main[data-landing-viewport='desktop']",
    );
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>(
        "main[data-landing-viewport='desktop'] > section[data-page-section='true']",
      ),
    );

    sections.forEach((section, index) => {
      const rect = section.getBoundingClientRect();

      if (Math.abs(rect.height - viewportHeight) > 1) {
        violations.push(
          `${section.id} tem ${Math.round(rect.height)}px numa viewport de ${viewportHeight}px`,
        );
      }

      const previous = sections[index - 1]?.getBoundingClientRect();
      if (previous && Math.abs(rect.top - previous.bottom) > 1) {
        violations.push(`${section.id} não encosta na seção anterior`);
      }
    });

    const activeSectionId = landing?.dataset.activeSection ?? "";
    const mostVisible = sections
      .map((section) => {
        const rect = section.getBoundingClientRect();
        return {
          id: section.id,
          visible: Math.max(
            0,
            Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0),
          ),
        };
      })
      .sort((left, right) => right.visible - left.visible)[0];

    if (
      mostVisible &&
      mostVisible.id !== activeSectionId &&
      mostVisible.visible > viewportHeight * 0.6
    ) {
      violations.push(
        `seção ativa é ${activeSectionId}, mas ${mostVisible.id} ocupa a tela`,
      );
    }

    const expectedPath = sectionPaths[activeSectionId];
    if (expectedPath && location.pathname !== expectedPath) {
      violations.push(`URL ${location.pathname} não bate com ${activeSectionId}`);
    }

    if (
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth
    ) {
      violations.push("rolagem horizontal");
    }

    const activeRect = document
      .getElementById(activeSectionId)
      ?.getBoundingClientRect();

    return {
      violations,
      activeSectionId,
      activeTop: activeRect ? Math.round(activeRect.top) : null,
    };
  }, SECTION_PATHS as Record<string, string>);
}

async function expectSettled(
  page: Page,
  context: string,
  alignedSectionId?: SectionId,
): Promise<void> {
  await expect
    .poll(
      async () => {
        const snapshot = await readLandingSnapshot(page);
        const violations = [...snapshot.violations];
        const pendingTarget = await page
          .locator("html")
          .getAttribute("data-landing-scroll-target");

        if (alignedSectionId) {
          if (snapshot.activeSectionId !== alignedSectionId) {
            violations.push(
              `esperava ${alignedSectionId} ativa, veio ${snapshot.activeSectionId}`,
            );
          } else if (Math.abs(snapshot.activeTop ?? Infinity) > 2) {
            violations.push(
              `${alignedSectionId} deveria estar no topo, está em ${snapshot.activeTop}px`,
            );
          }

          if (pendingTarget !== null) {
            violations.push(`alvo de rolagem pendente ${pendingTarget}`);
          }
        }

        return violations;
      },
      { timeout: 8_000, message: context },
    )
    .toEqual([]);
}

async function openLanding(
  page: Page,
  size: Size,
  sectionId: SectionId = "home",
): Promise<string[]> {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize(size);
  await page.goto(SECTION_PATHS[sectionId], { waitUntil: "networkidle" });
  await expectSettled(page, `abre ${sectionId}`, sectionId);
  return errors;
}

async function clickSection(page: Page, sectionId: SectionId): Promise<void> {
  await page.locator(`button[data-nav-link="${sectionId}"]`).click();
}

async function wheel(page: Page, deltaY: number, times = 1): Promise<void> {
  await page.mouse.move(640, 300);
  for (let index = 0; index < times; index += 1) {
    await page.mouse.wheel(0, deltaY);
    await page.waitForTimeout(60);
  }
}

const RESIZE_ROUND_TRIPS: readonly (readonly [Size, Size])[] = [
  [SIZES[0], SIZES[3]],
  [SIZES[3], SIZES[1]],
  [SIZES[2], SIZES[6]],
];

for (const [from, to] of RESIZE_ROUND_TRIPS) {
  test(`mantém a seção alinhada ao ir de ${from.width}x${from.height} para ${to.width}x${to.height} e voltar`, async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const errors = await openLanding(page, from);

    for (const sectionId of SECTION_IDS) {
      await clickSection(page, sectionId);
      await expectSettled(page, `clique em ${sectionId}`, sectionId);

      await page.setViewportSize(to);
      await expectSettled(
        page,
        `${sectionId} após redimensionar para ${to.width}x${to.height}`,
        sectionId,
      );

      await page.setViewportSize(from);
      await expectSettled(
        page,
        `${sectionId} após voltar para ${from.width}x${from.height}`,
        sectionId,
      );
    }

    expect(errors).toEqual([]);
  });
}

test("redimensionamento contínuo (arrastar a janela) termina alinhado", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await openLanding(page, SIZES[3]);

  for (const sectionId of ["technologies", "portfolio"] as const) {
    await clickSection(page, sectionId);
    await expectSettled(page, `clique em ${sectionId}`, sectionId);

    for (let step = 0; step <= 12; step += 1) {
      await page.setViewportSize({
        width: Math.round(1920 - step * 47),
        height: Math.round(1080 - step * 37),
      });
      await page.waitForTimeout(25);
    }
    await expectSettled(page, `${sectionId} ao encolher arrastando`, sectionId);

    for (let step = 12; step >= 0; step -= 2) {
      await page.setViewportSize({
        width: Math.round(1920 - step * 47),
        height: Math.round(1080 - step * 37),
      });
      await page.waitForTimeout(25);
    }
    await expectSettled(page, `${sectionId} ao crescer arrastando`, sectionId);
  }
});

test("posição parcial da roda é preservada ao redimensionar", async ({
  page,
}) => {
  await openLanding(page, SIZES[0]);
  await clickSection(page, "roadMap");
  await expectSettled(page, "clique em serviços", "roadMap");

  // Para no meio do caminho entre serviços e a rede IA.
  await page.evaluate(() => window.scrollBy(0, window.innerHeight * 0.4));
  await expect
    .poll(() =>
      page.evaluate(() =>
        Math.round(
          -document.getElementById("roadMap")!.getBoundingClientRect().top /
            window.innerHeight *
            100,
        ),
      ),
    )
    .toBe(40);

  await page.setViewportSize(SIZES[3]);
  await expect
    .poll(
      () =>
        page.evaluate(() =>
          Math.round(
            -document.getElementById("roadMap")!.getBoundingClientRect().top /
              window.innerHeight *
              100,
          ),
        ),
      { message: "progresso dentro de serviços após redimensionar" },
    )
    .toBe(40);
  await expectSettled(page, "geometria após redimensionar parcialmente");
});

test("clique no menu depois de rolar com a roda chega exatamente na seção", async ({
  page,
}) => {
  test.setTimeout(90_000);
  const errors = await openLanding(page, SIZES[0]);

  for (const sectionId of SECTION_IDS) {
    await wheel(page, 300, 6);
    await page.waitForTimeout(500);
    await wheel(page, -300, 6);
    await page.waitForTimeout(500);
    await clickSection(page, sectionId);
    await expectSettled(page, `clique em ${sectionId} após rolar`, sectionId);
  }

  expect(errors).toEqual([]);
});

test("entrar no portfólio pela roda alinha a seção no topo da tela", async ({
  page,
}) => {
  await openLanding(page, SIZES[1]);
  await wheel(page, 120, 2);
  await expectSettled(page, "ímã do portfólio", "portfolio");
});

test("interromper uma navegação com a roda não deixa alvo pendente", async ({
  page,
}) => {
  await openLanding(page, SIZES[1]);
  await clickSection(page, "contact");
  await page.waitForTimeout(150);
  await wheel(page, -200, 2);
  await expect(page.locator("html")).not.toHaveAttribute(
    "data-landing-scroll-target",
    /.+/,
  );

  await page.waitForTimeout(1_500);
  const scrollBeforeBlur = await page.evaluate(() => window.scrollY);
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await page.waitForTimeout(200);
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await page.waitForTimeout(500);

  // Voltar o foco não pode reaplicar o alvo antigo (contato).
  expect(
    Math.abs((await page.evaluate(() => window.scrollY)) - scrollBeforeBlur),
  ).toBeLessThanOrEqual(2);
});

function createRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
}

for (const seed of [11, 23, 37]) {
  test(`sequência aleatória de roda, teclado, menu e resize (seed ${seed})`, async ({
    page,
  }) => {
    test.setTimeout(240_000);
    const random = createRandom(seed);
    const pick = <T,>(items: readonly T[]): T =>
      items[Math.floor(random() * items.length)];
    const errors = await openLanding(page, pick(SIZES), pick(SECTION_IDS));
    const steps: string[] = [];

    for (let step = 0; step < 25; step += 1) {
      const roll = random();

      if (roll < 0.3) {
        const sectionId = pick(SECTION_IDS);
        steps.push(`clique ${sectionId}`);
        await clickSection(page, sectionId);
        await expectSettled(page, steps.join(" → "), sectionId);
        continue;
      }

      if (roll < 0.55) {
        const delta = pick([-1, 1]) * pick([100, 240, 400]);
        const times = 1 + Math.floor(random() * 5);
        steps.push(`roda ${times}x${delta}`);
        await wheel(page, delta, times);
        await page.waitForTimeout(400);
        await expectSettled(page, steps.join(" → "));
        continue;
      }

      if (roll < 0.65) {
        const key = pick(["PageDown", "PageUp", "ArrowDown", "Space"]);
        steps.push(`tecla ${key}`);
        await page.keyboard.press(key);
        await page.waitForTimeout(400);
        await expectSettled(page, steps.join(" → "));
        continue;
      }

      const before = await readLandingSnapshot(page);
      const size = pick(SIZES);
      steps.push(`resize ${size.width}x${size.height}`);
      await page.setViewportSize(size);
      await expectSettled(
        page,
        steps.join(" → "),
        before.activeTop === 0 && before.violations.length === 0
          ? (before.activeSectionId as SectionId)
          : undefined,
      );
    }

    expect(errors).toEqual([]);
  });
}
