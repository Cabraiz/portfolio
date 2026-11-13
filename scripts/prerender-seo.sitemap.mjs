// sitemap.xml e llms.txt (prerender-seo.mjs).

import {
	seo,
	buildDate,
	LANGUAGES,
	PAGE_IDS,
	LANGUAGE_NAMES,
	WHATSAPP_URL,
	absolute,
} from "./prerender-seo.context.mjs";
import {
	alternateLinks,
} from "./prerender-seo.html.mjs";

function sitemapXml() {
	const entries = PAGE_IDS.flatMap((pageId) =>
		LANGUAGES.map(
			(language) => `  <url>
    <loc>${absolute(seo.pages[pageId][language].path)}</loc>
    <lastmod>${buildDate}</lastmod>
${alternateLinks(pageId, "    <xhtml:link")}${
				pageId === "home"
					? `
    <image:image><image:loc>${seo.portrait.url}</image:loc></image:image>
    <image:image><image:loc>${seo.shareImage.url}</image:loc></image:image>`
					: ""
			}
  </url>`
		)
	);
	for (const language of LANGUAGES) {
		entries.push(`  <url>
    <loc>${absolute(seo.resume[language])}</loc>
    <lastmod>${buildDate}</lastmod>
  </url>`);
	}
	return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entries.join("\n")}
</urlset>
`;
}

const LLMS_HEADINGS = {
	en: { location: "Location", technologies: "Technologies", projects: "Projects (English)" },
	pt: { location: "Local", technologies: "Tecnologias", projects: "Projetos (português)" },
	es: { location: "Ubicación", technologies: "Tecnologías", projects: "Proyectos (español)" },
};

function llmsTxt(projectsByLanguage) {
	const { person } = seo;
	const projectLines = (language) =>
		projectsByLanguage[language]
			.map(
				(project) =>
					`### ${project.name} — ${project.category} (${project.year})\n` +
					`${LLMS_HEADINGS[language].location}: ${project.place}, ${project.country}\n` +
					`${project.description}\n` +
					`${LLMS_HEADINGS[language].technologies}: ${project.technologies.join(", ")}\n`
			)
			.join("\n");
	return `# ${person.name} — ${LANGUAGES.map((code) => person.jobTitle[code]).join(" / ")}

${LANGUAGES.map((code) => `> ${person.description[code]}`).join("\n>\n")}

Site: ${seo.siteUrl} — English at /en/home/ (main version), Português (Brasil) at /home/, Español (Latinoamérica) at /es/home/.
Location: Fortaleza, Brazil (UTC-3). Works remotely with teams in the Americas and Europe.

## Availability / Disponibilidade / Disponibilidad

${LANGUAGES.map((code) => `- ${person.availability[code]}`).join("\n")}

## Experience highlights

${person.highlights.en.map((item) => `- ${item}`).join("\n")}

## Destaques (português)

${person.highlights.pt.map((item) => `- ${item}`).join("\n")}

## Destacados (español)

${person.highlights.es.map((item) => `- ${item}`).join("\n")}

## Pages

${LANGUAGES.flatMap((code) => [
	`- [${LANGUAGE_NAMES[code]} — Home](${absolute(seo.pages.home[code].path)}): ${seo.pages.home[code].description}`,
	`- [${LANGUAGE_NAMES[code]} — Portfolio](${absolute(seo.pages.portfolio[code].path)}): ${seo.pages.portfolio[code].description}`,
]).join("\n")}

## Résumé / Currículo / Currículum (PDF)

${LANGUAGES.map((code) => `- [${LANGUAGE_NAMES[code]}](${absolute(seo.resume[code])})`).join("\n")}

## Photo / Foto

- [Official photo of ${person.name}](${seo.portrait.url}): ${seo.portrait.caption.en}
- [Wide photo](${seo.shareImage.url})

## Contact

- Email: ${person.email}
- WhatsApp: ${WHATSAPP_URL}
${person.sameAs.map((url) => `- ${url}`).join("\n")}

## Expertise

${person.knowsAbout.map((item) => `- ${item}`).join("\n")}

${LANGUAGES.map((code) => `## ${LLMS_HEADINGS[code].projects}\n\n${projectLines(code)}`).join("\n")}`;
}

export {
	sitemapXml,
	LLMS_HEADINGS,
	llmsTxt,
};
