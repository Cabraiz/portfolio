/**
 * Gera os currículos em inglês e espanhol (public/files/*.pdf) a partir de
 * resume-content.mjs, num layout de uma coluna legível por ATS (texto real,
 * sem foto, como é o padrão nos EUA). Uso:
 *   node scripts/resume/build-resumes.mjs
 * (PRERENDER_CHROMIUM_PATH aponta para um Chromium local, se preciso.)
 */
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "@playwright/test";

import { RESUMES } from "./resume-content.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const escapeHtml = (value) =>
	String(value)
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;");

function resumeHtml(resume) {
	const { contact, headings } = resume;
	const link = (href, text) => `<a href="${escapeHtml(href)}">${escapeHtml(text)}</a>`;
	return `<!doctype html>
<html lang="${resume.lang}">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(contact.name)} — ${escapeHtml(resume.title)}</title>
<meta name="author" content="${escapeHtml(contact.name)}" />
<style>
  @page { size: Letter; margin: 0.55in 0.6in; }
  * { box-sizing: border-box; }
  body { margin: 0; font: 10.2pt/1.42 "Helvetica Neue", Arial, sans-serif; color: #1b1f24; }
  a { color: #0b5c55; text-decoration: none; }
  header { border-bottom: 2px solid #0b665f; padding-bottom: 8px; margin-bottom: 10px; }
  h1 { margin: 0; font-size: 21pt; letter-spacing: 0.01em; }
  .title { margin: 2px 0 6px; font-size: 12pt; font-weight: 700; color: #0b665f; }
  .contact { font-size: 9.3pt; color: #3b434c; }
  .contact span + span::before { content: " · "; color: #9aa3ab; }
  h2 { margin: 12px 0 5px; font-size: 10.5pt; text-transform: uppercase; letter-spacing: 0.12em; color: #0b665f; }
  p { margin: 0; }
  .job { margin-bottom: 8px; break-inside: avoid; }
  .job-head { display: flex; justify-content: space-between; gap: 12px; font-weight: 700; }
  .job-head span:last-child { font-weight: 400; color: #4a535c; white-space: nowrap; }
  .job-role { font-style: italic; color: #3b434c; }
  ul { margin: 3px 0 0; padding-left: 16px; }
  li { margin: 2px 0; }
  .row { display: flex; justify-content: space-between; gap: 12px; }
  .row span:last-child { color: #4a535c; white-space: nowrap; }
  .skills { display: grid; grid-template-columns: 92px 1fr; gap: 2px 10px; }
  .skills dt { font-weight: 700; }
  .skills dd { margin: 0; }
</style>
</head>
<body>
<header>
  <h1>${escapeHtml(contact.name)}</h1>
  <p class="title">${escapeHtml(resume.title)}</p>
  <p class="contact">
    <span>${escapeHtml(resume.location)}</span>
    <span>${link(`mailto:${contact.email}`, contact.email)}</span>
    <span>${link(contact.whatsapp, contact.phone)}</span>
  </p>
  <p class="contact">
    <span>${link(`https://${contact.site}`, contact.site)}</span>
    <span>${link(`https://www.${contact.linkedin}/`, contact.linkedin)}</span>
    <span>${link(`https://${contact.github}`, contact.github)}</span>
  </p>
</header>

<h2>${escapeHtml(headings.summary)}</h2>
<p>${escapeHtml(resume.summary)}</p>

<h2>${escapeHtml(headings.experience)}</h2>
${resume.experience
	.map(
		(job) => `<section class="job">
  <div class="job-head"><span>${escapeHtml(job.company)} — ${escapeHtml(job.place)}</span><span>${escapeHtml(job.period)}</span></div>
  <div class="job-role">${escapeHtml(job.role)}</div>
  <ul>${job.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join("")}</ul>
</section>`
	)
	.join("\n")}

<h2>${escapeHtml(headings.education)}</h2>
${resume.education
	.map(
		([degree, school, years]) =>
			`<div class="row"><span><strong>${escapeHtml(degree)}</strong>, ${escapeHtml(school)}</span><span>${escapeHtml(years)}</span></div>`
	)
	.join("\n")}

<h2>${escapeHtml(headings.skills)}</h2>
<dl class="skills">
${resume.skills.map(([area, value]) => `<dt>${escapeHtml(area)}</dt><dd>${escapeHtml(value)}</dd>`).join("\n")}
</dl>

<h2>${escapeHtml(headings.languages)}</h2>
<p>${escapeHtml(resume.languages)}</p>
</body>
</html>`;
}

const browser = await chromium.launch(
	process.env.PRERENDER_CHROMIUM_PATH
		? { executablePath: process.env.PRERENDER_CHROMIUM_PATH }
		: {}
);
try {
	const page = await browser.newPage();
	for (const resume of Object.values(RESUMES)) {
		await page.setContent(resumeHtml(resume), { waitUntil: "load" });
		const output = path.join(projectRoot, "public/files", resume.file);
		await page.pdf({ path: output, format: "Letter", printBackground: true });
		console.log(`Currículo gerado: ${path.relative(projectRoot, output)}`);
	}
} finally {
	await browser.close();
}
