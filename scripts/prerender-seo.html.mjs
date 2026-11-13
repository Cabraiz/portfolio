// JSON-LD, <head> e HTML de cada página pré-renderizada (prerender-seo.mjs).

import {
	seo,
	shellHtml,
	buildDate,
	LANGUAGES,
	DEFAULT_LANGUAGE,
	HTML_LANG,
	OG_LOCALE,
	HREFLANG,
	escapeHtml,
	absolute,
} from "./prerender-seo.context.mjs";

function personNode(language) {
	const { person } = seo;
	return {
		"@type": "Person",
		"@id": `${seo.siteUrl}/#person`,
		name: person.name,
		alternateName: person.alternateName,
		givenName: person.givenName,
		familyName: person.familyName,
		jobTitle: person.jobTitle[language],
		description: person.description[language],
		url: absolute(seo.pages.home[language].path),
		image: { "@id": `${seo.siteUrl}/#portrait` },
		knowsLanguage: person.knowsLanguage,
		email: `mailto:${person.email}`,
		address: {
			"@type": "PostalAddress",
			addressLocality: person.address.locality,
			addressRegion: person.address.region,
			addressCountry: person.address.country,
		},
		knowsAbout: person.knowsAbout,
		worksFor: { "@type": "Organization", name: person.worksFor.name, url: person.worksFor.url },
		alumniOf: person.alumniOf.map((school) => ({
			"@type": "CollegeOrUniversity",
			name: school.name,
			url: school.url,
		})),
		hasCredential: person.credentials.map((name) => ({
			"@type": "EducationalOccupationalCredential",
			name,
			credentialCategory: "certification",
		})),
		sameAs: person.sameAs,
	};
}

// Foto oficial: a mesma URL em Person.image, no sitemap de imagens e no
// llms.txt, para buscadores e assistentes ligarem o rosto ao nome.
function portraitNode(language) {
	const { portrait, person } = seo;
	return {
		"@type": "ImageObject",
		"@id": `${seo.siteUrl}/#portrait`,
		url: portrait.url,
		contentUrl: portrait.url,
		width: portrait.width,
		height: portrait.height,
		encodingFormat: "image/jpeg",
		caption: portrait.caption[language],
		name: person.name,
		representativeOfPage: true,
		creator: { "@id": `${seo.siteUrl}/#person` },
		creditText: person.name,
		copyrightNotice: `© ${person.name}`,
		about: { "@id": `${seo.siteUrl}/#person` },
	};
}

function structuredData(pageId, language, projects) {
	const page = seo.pages[pageId][language];
	const url = absolute(page.path);
	const graph = [
		{
			"@type": "WebSite",
			"@id": `${seo.siteUrl}/#website`,
			url: `${seo.siteUrl}/`,
			name: seo.siteName,
			alternateName: `${seo.person.name} — ${seo.person.jobTitle[language]}`,
			inLanguage: LANGUAGES.map((code) => HTML_LANG[code]),
			publisher: { "@id": `${seo.siteUrl}/#person` },
		},
		personNode(language),
		portraitNode(language),
	];

	if (pageId === "home") {
		graph.push({
			"@type": "ProfilePage",
			"@id": `${url}#webpage`,
			url,
			name: page.title,
			description: page.description,
			inLanguage: HTML_LANG[language],
			dateModified: buildDate,
			isPartOf: { "@id": `${seo.siteUrl}/#website` },
			mainEntity: { "@id": `${seo.siteUrl}/#person` },
			primaryImageOfPage: { "@id": `${seo.siteUrl}/#portrait` },
			image: { "@id": `${seo.siteUrl}/#portrait` },
		});
	} else {
		graph.push({
			"@type": "CollectionPage",
			"@id": `${url}#webpage`,
			url,
			name: page.title,
			description: page.description,
			inLanguage: HTML_LANG[language],
			dateModified: buildDate,
			isPartOf: { "@id": `${seo.siteUrl}/#website` },
			about: { "@id": `${seo.siteUrl}/#person` },
			mainEntity: {
				"@type": "ItemList",
				numberOfItems: projects.length,
				itemListElement: projects.map((project, index) => ({
					"@type": "ListItem",
					position: index + 1,
					item: {
						"@type": "CreativeWork",
						"@id": `${url}#${project.id}`,
						name: project.name,
						description: project.description,
						genre: project.category,
						dateCreated: project.year,
						keywords: project.technologies.join(", "),
						locationCreated: { "@type": "Place", name: `${project.place}, ${project.country}` },
						image: project.image ? absolute(project.image) : undefined,
						creator: { "@id": `${seo.siteUrl}/#person` },
						inLanguage: HTML_LANG[language],
					},
				})),
			},
		});
	}

	return JSON.stringify({ "@context": "https://schema.org", "@graph": graph }, null, 2).replaceAll(
		"</",
		"<\\/"
	);
}

/** hreflang de todas as versões, mais x-default (inglês). */
function alternateLinks(pageId, prefix) {
	const pages = seo.pages[pageId];
	return [
		...LANGUAGES.map(
			(code) => `${prefix} rel="alternate" hreflang="${HREFLANG[code]}" href="${absolute(pages[code].path)}" />`
		),
		`${prefix} rel="alternate" hreflang="x-default" href="${absolute(pages[DEFAULT_LANGUAGE].path)}" />`,
	].join("\n");
}

function headBlock(pageId, language, projects, preloads) {
	const page = seo.pages[pageId][language];
	const url = absolute(page.path);
	const title = escapeHtml(page.title);
	const description = escapeHtml(page.description);
	const share = seo.shareImage;
	const imageAlt = escapeHtml(share.alt[language]);
	return `<!-- seo:start (gerado por scripts/prerender-seo.mjs) -->
    <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" />
    <meta name="author" content="${escapeHtml(seo.person.name)}" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <link rel="canonical" href="${url}" />
${alternateLinks(pageId, "    <link")}
    <meta http-equiv="content-language" content="${HTML_LANG[language]}" />
    <link rel="alternate" type="text/plain" href="${seo.siteUrl}/llms.txt" title="llms.txt" />
    <meta property="og:type" content="${pageId === "home" ? "profile" : "website"}" />
    <meta property="og:site_name" content="${escapeHtml(seo.siteName)}" />
    <meta property="og:locale" content="${OG_LOCALE[language]}" />
${LANGUAGES.filter((code) => code !== language)
	.map((code) => `    <meta property="og:locale:alternate" content="${OG_LOCALE[code]}" />`)
	.join("\n")}
    <meta property="og:url" content="${url}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <link rel="image_src" href="${seo.portrait.url}" />
    <meta property="og:image" content="${share.url}" />
    <meta property="og:image:secure_url" content="${share.url}" />
    <meta property="og:image:type" content="image/jpeg" />
    <meta property="og:image:width" content="${share.width}" />
    <meta property="og:image:height" content="${share.height}" />
    <meta property="og:image:alt" content="${imageAlt}" />
    <meta property="profile:first_name" content="${escapeHtml(seo.person.givenName)}" />
    <meta property="profile:last_name" content="${escapeHtml(seo.person.familyName)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${share.url}" />
    <meta name="twitter:image:alt" content="${imageAlt}" />
${preloads
	.map(
		({ href, media }) =>
			`    <link rel="preload" as="image" href="${href}" media="${media}" fetchpriority="high" />`
	)
	.join("\n")}
    <script type="application/ld+json">
${structuredData(pageId, language, projects)}
    </script>
    <!-- seo:end -->`;
}

function renderPage(pageId, language, rootHtml, projects, preloads) {
	let html = shellHtml.replace(
		/<!-- seo:start[\s\S]*?<!-- seo:end -->/,
		headBlock(pageId, language, projects, preloads)
	);
	html = html.replace(/<html lang="[^"]*">/, `<html lang="${HTML_LANG[language]}">`);
	html = html.replace(/<noscript>\s*Mateus[\s\S]*?<\/noscript>\s*/, "");
	html = html.replace(
		'<div id="root"></div>',
		`<div id="root" data-prerendered="true">${rootHtml}</div>`
	);
	if (!html.includes('data-prerendered="true"')) {
		throw new Error("Não achei o <div id=\"root\"></div> no index.html do build.");
	}
	return html;
}

function retiredPage(target) {
	return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="robots" content="noindex,follow" />
    <link rel="canonical" href="${target}" />
    <meta http-equiv="refresh" content="0; url=${target}" />
    <title>${escapeHtml(seo.pages.home.pt.title)}</title>
  </head>
  <body>
    <p>Esta página mudou para <a href="${target}">${target}</a>.</p>
  </body>
</html>
`;
}

export {
	personNode,
	portraitNode,
	structuredData,
	alternateLinks,
	headBlock,
	renderPage,
	retiredPage,
};
