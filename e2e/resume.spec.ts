import { expect, test } from "@playwright/test";

const resumePath = "/resume";
const resumeIndexPath = "/resume/";
const resumePdfPath = "/files/mateus-cabral-resume.pdf";

test("opening /resume redirects to the downloadable CV", async ({ page, request }) => {
  const resumeEntry = await request.get(resumeIndexPath);
  expect(resumeEntry.status()).toBe(200);
  expect(resumeEntry.headers()["content-type"]).toContain("text/html");
  expect(await resumeEntry.text()).toContain(resumePdfPath);

  const pdfResponse = await request.get(resumePdfPath);
  expect(pdfResponse.status()).toBe(200);
  expect(pdfResponse.headers()["content-type"]).toContain("application/pdf");
  expect((await pdfResponse.body()).byteLength).toBeGreaterThan(100_000);

  const pdfRequestPromise = page.waitForRequest((request) =>
    request.url().endsWith(resumePdfPath),
  );

  const navigationResponse = await page.goto(resumePath, { waitUntil: "commit" });
  const pdfRequest = await pdfRequestPromise;
  const browserPdfResponse = await pdfRequest.response();

  expect(navigationResponse?.status()).toBe(200);
  expect(pdfRequest.url()).toContain(resumePdfPath);
  expect(browserPdfResponse?.status()).toBe(200);
});
