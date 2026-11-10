// Texto do aviso de privacidade nos três idiomas do site. Fica fora do catálogo
// de rótulos porque é um documento corrido, revisado como um todo por idioma.

export type PrivacyLanguage = "pt" | "en" | "es";

// /privacidade já é a política geral de cabraiz.com e subdomínios (anúncios),
// servida pelo Cloudflare; este aviso é o do portfólio e tem endereço próprio.
// Os mesmos caminhos estão em scripts/prerender-seo.mjs (documento direto).
export const PRIVACY_PATHS: Record<PrivacyLanguage, string> = {
	pt: "/aviso-de-privacidade",
	en: "/en/privacy-notice",
	es: "/es/aviso-de-privacidad",
};

/** Política geral de cabraiz.com e dos sites em subdomínios. */
export const GENERAL_POLICY_URL = "https://cabraiz.com/privacidade";
const GENERAL_POLICY_LABEL = "cabraiz.com/privacidade";

/** Endereço do aviso no idioma atual do site (português quando não houver). */
export function privacyPathFor(language: string | undefined): string {
	const code = (language ?? "pt").slice(0, 2);
	return code in PRIVACY_PATHS ? PRIVACY_PATHS[code as PrivacyLanguage] : PRIVACY_PATHS.pt;
}

export const PRIVACY_CONTACT_EMAIL = "contact@cabraiz.com";

/** Trechos do texto que viram link (e-mail de contato e política geral). */
export const PRIVACY_LINKS: readonly Readonly<{ text: string; href: string }>[] = [
	{ text: PRIVACY_CONTACT_EMAIL, href: `mailto:${PRIVACY_CONTACT_EMAIL}` },
	{ text: GENERAL_POLICY_LABEL, href: GENERAL_POLICY_URL },
];

type Section = Readonly<{ title: string; paragraphs: readonly string[]; items?: readonly string[] }>;

export type PrivacyText = Readonly<{
	htmlLang: string;
	documentTitle: string;
	title: string;
	updated: string;
	intro: string;
	sections: readonly Section[];
	back: string;
	backHref: string;
}>;

export const PRIVACY_TEXT: Record<PrivacyLanguage, PrivacyText> = {
	pt: {
		htmlLang: "pt-BR",
		documentTitle: "Aviso de privacidade · Mateus Cabral",
		title: "Aviso de privacidade",
		updated: "Atualizado em 10 de novembro de 2026",
		intro:
			"Este aviso explica, de forma direta, quais dados este site trata, para quê e quais são os seus direitos, conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018, LGPD).",
		sections: [
			{
				title: "Quem é o responsável",
				paragraphs: [
					`Mateus Cabral, desenvolvedor, em Fortaleza (CE), Brasil, é o controlador dos dados tratados neste site. Para qualquer assunto de privacidade, escreva para ${PRIVACY_CONTACT_EMAIL}.`,
				],
			},
			{
				title: "Quais dados são tratados",
				paragraphs: [],
				items: [
					"Mensagens do chat: o texto que você escreve, a página de onde enviou, o idioma do site e um identificador aleatório da conversa. Nome, e-mail ou telefone não são pedidos; envie apenas se quiser ser respondido por outro canal.",
					"Estatísticas de acesso: o site usa o Cloudflare Web Analytics, que conta visitas de forma agregada, sem cookies e sem identificar quem visita.",
					"Dados técnicos da conexão: a hospedagem (GitHub Pages) e a rede de entrega (Cloudflare) recebem dados como endereço IP e tipo de navegador para entregar e proteger o site.",
					"WhatsApp, e-mail e currículo: ao clicar nesses botões, o contato acontece fora deste site, sob as regras de cada serviço.",
				],
			},
			{
				title: "Para que e com qual base legal",
				paragraphs: [
					"As mensagens do chat são usadas apenas para responder ao seu contato, inclusive sobre propostas de trabalho (procedimentos preliminares a um contrato e legítimo interesse, art. 7º, V e IX, da LGPD). Os dados técnicos e as estatísticas servem para manter o site funcionando, seguro e para entender o uso de forma agregada (legítimo interesse).",
					"Nenhum dado é vendido, usado para publicidade ou para criar perfis.",
				],
			},
			{
				title: "Com quem os dados são compartilhados",
				paragraphs: [
					"As mensagens do chat passam por um servidor na Vercel e chegam ao Telegram de Mateus Cabral. Esses serviços, assim como o GitHub e o Cloudflare, podem processar dados fora do Brasil (transferência internacional, art. 33 da LGPD), somente para entregar o site e as mensagens.",
				],
			},
			{
				title: "Cookies e armazenamento no navegador",
				paragraphs: [
					"Este site não usa cookies. Se você usar o chat, a conversa fica guardada no armazenamento local do seu navegador por até 24 horas, para mostrar as respostas; a escolha de idioma também pode ficar salva. Nada disso é gravado antes de você enviar uma mensagem ou escolher um idioma, e você pode apagar a qualquer momento limpando os dados do site no navegador.",
				],
			},
			{
				title: "Por quanto tempo",
				paragraphs: [
					"As mensagens do chat são guardadas somente pelo tempo necessário para a conversa e apagadas quando você pedir.",
				],
			},
			{
				title: "Seus direitos",
				paragraphs: [
					`Você pode confirmar se há dados seus, acessá-los, corrigi-los, pedir a exclusão, saber com quem foram compartilhados e se opor a um tratamento (art. 18 da LGPD). Basta escrever para ${PRIVACY_CONTACT_EMAIL}. Você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).`,
					"Quem visita de fora do Brasil, inclusive da União Europeia, tem os mesmos direitos pelo mesmo contato.",
				],
			},
			{
				title: "Outros sites em cabraiz.com",
				paragraphs: [
					`Os sites em subdomínios (como a loja bideiras) e os anúncios do Google AdSense que alguns deles exibem seguem a política geral em ${GENERAL_POLICY_LABEL}. Este portfólio não exibe anúncios.`,
				],
			},
			{
				title: "Mudanças neste aviso",
				paragraphs: ["Se este aviso mudar, a data no topo será atualizada."],
			},
		],
		back: "Voltar ao site",
		backHref: "/home",
	},
	en: {
		htmlLang: "en",
		documentTitle: "Privacy notice · Mateus Cabral",
		title: "Privacy notice",
		updated: "Last updated November 10, 2026",
		intro:
			"This notice explains plainly what data this website handles, why, and what your rights are, under Brazil's General Data Protection Law (Law 13,709/2018, LGPD) and, for visitors in the European Union, the GDPR.",
		sections: [
			{
				title: "Who is responsible",
				paragraphs: [
					`Mateus Cabral, a software developer based in Fortaleza, Brazil, is the controller of the data handled on this website. For any privacy matter, write to ${PRIVACY_CONTACT_EMAIL}.`,
				],
			},
			{
				title: "What data is handled",
				paragraphs: [],
				items: [
					"Chat messages: the text you write, the page you sent it from, the site language and a random conversation identifier. Your name, email or phone number are not requested; share them only if you want a reply through another channel.",
					"Visit statistics: the site uses Cloudflare Web Analytics, which counts visits in aggregate, without cookies and without identifying visitors.",
					"Technical connection data: the host (GitHub Pages) and the delivery network (Cloudflare) receive data such as IP address and browser type to deliver and protect the site.",
					"WhatsApp, email and résumé: when you click these buttons, the contact happens outside this site, under each service's own terms.",
				],
			},
			{
				title: "Why, and on what legal basis",
				paragraphs: [
					"Chat messages are used only to reply to you, including about job opportunities (steps prior to entering a contract and legitimate interest). Technical data and statistics keep the site running and secure and show aggregate usage (legitimate interest).",
					"No data is sold, used for advertising or used to build profiles.",
				],
			},
			{
				title: "Who the data is shared with",
				paragraphs: [
					"Chat messages pass through a server on Vercel and reach Mateus Cabral's Telegram. These services, like GitHub and Cloudflare, may process data outside Brazil and outside the European Union, only to deliver the site and the messages.",
				],
			},
			{
				title: "Cookies and browser storage",
				paragraphs: [
					"This site does not use cookies. If you use the chat, the conversation is kept in your browser's local storage for up to 24 hours so replies can be shown; your language choice may also be saved. Nothing is stored before you send a message or pick a language, and you can delete it at any time by clearing this site's data in your browser.",
				],
			},
			{
				title: "How long data is kept",
				paragraphs: [
					"Chat messages are kept only as long as the conversation requires and are deleted on request.",
				],
			},
			{
				title: "Your rights",
				paragraphs: [
					`You can ask whether data about you is held, access it, correct it, have it deleted, learn who it was shared with and object to its use. Write to ${PRIVACY_CONTACT_EMAIL}. You may also complain to Brazil's data protection authority (ANPD) or, in the EU, to your local supervisory authority.`,
				],
			},
			{
				title: "Other sites on cabraiz.com",
				paragraphs: [
					`Sites on subdomains (such as the bideiras store) and the Google AdSense ads some of them show follow the general policy at ${GENERAL_POLICY_LABEL} (in Portuguese). This portfolio does not show ads.`,
				],
			},
			{
				title: "Changes to this notice",
				paragraphs: ["If this notice changes, the date at the top will be updated."],
			},
		],
		back: "Back to the site",
		backHref: "/en/home",
	},
	es: {
		htmlLang: "es",
		documentTitle: "Aviso de privacidad · Mateus Cabral",
		title: "Aviso de privacidad",
		updated: "Actualizado el 10 de noviembre de 2026",
		intro:
			"Este aviso explica, de forma directa, qué datos trata este sitio, para qué y cuáles son tus derechos, conforme a la Ley General de Protección de Datos de Brasil (Ley 13.709/2018, LGPD) y, para visitantes de la Unión Europea, al RGPD.",
		sections: [
			{
				title: "Quién es el responsable",
				paragraphs: [
					`Mateus Cabral, desarrollador con base en Fortaleza, Brasil, es el responsable de los datos tratados en este sitio. Para cualquier asunto de privacidad, escribe a ${PRIVACY_CONTACT_EMAIL}.`,
				],
			},
			{
				title: "Qué datos se tratan",
				paragraphs: [],
				items: [
					"Mensajes del chat: el texto que escribes, la página desde la que lo enviaste, el idioma del sitio y un identificador aleatorio de la conversación. No se piden nombre, correo ni teléfono; compártelos solo si quieres respuesta por otro canal.",
					"Estadísticas de visitas: el sitio usa Cloudflare Web Analytics, que cuenta visitas de forma agregada, sin cookies y sin identificar a quien visita.",
					"Datos técnicos de la conexión: el alojamiento (GitHub Pages) y la red de entrega (Cloudflare) reciben datos como la dirección IP y el tipo de navegador para entregar y proteger el sitio.",
					"WhatsApp, correo y currículum: al hacer clic en esos botones, el contacto ocurre fuera de este sitio, bajo las reglas de cada servicio.",
				],
			},
			{
				title: "Para qué y con qué base legal",
				paragraphs: [
					"Los mensajes del chat se usan solo para responder tu contacto, incluso sobre propuestas de trabajo (medidas previas a un contrato e interés legítimo). Los datos técnicos y las estadísticas mantienen el sitio funcionando y seguro y muestran el uso de forma agregada (interés legítimo).",
					"Ningún dato se vende, se usa para publicidad ni para crear perfiles.",
				],
			},
			{
				title: "Con quién se comparten los datos",
				paragraphs: [
					"Los mensajes del chat pasan por un servidor en Vercel y llegan al Telegram de Mateus Cabral. Estos servicios, al igual que GitHub y Cloudflare, pueden procesar datos fuera de Brasil, solo para entregar el sitio y los mensajes.",
				],
			},
			{
				title: "Cookies y almacenamiento en el navegador",
				paragraphs: [
					"Este sitio no usa cookies. Si usas el chat, la conversación se guarda en el almacenamiento local de tu navegador por hasta 24 horas para mostrar las respuestas; tu elección de idioma también puede quedar guardada. No se guarda nada antes de que envíes un mensaje o elijas un idioma, y puedes borrarlo cuando quieras limpiando los datos de este sitio en el navegador.",
				],
			},
			{
				title: "Por cuánto tiempo",
				paragraphs: [
					"Los mensajes del chat se guardan solo el tiempo necesario para la conversación y se eliminan cuando lo pidas.",
				],
			},
			{
				title: "Tus derechos",
				paragraphs: [
					`Puedes confirmar si hay datos tuyos, acceder a ellos, corregirlos, pedir su eliminación, saber con quién se compartieron y oponerte a su uso. Escribe a ${PRIVACY_CONTACT_EMAIL}. También puedes reclamar ante la autoridad de protección de datos de Brasil (ANPD) o, en la Unión Europea, ante tu autoridad local.`,
				],
			},
			{
				title: "Otros sitios en cabraiz.com",
				paragraphs: [
					`Los sitios en subdominios (como la tienda bideiras) y los anuncios de Google AdSense que algunos muestran siguen la política general en ${GENERAL_POLICY_LABEL} (en portugués). Este portafolio no muestra anuncios.`,
				],
			},
			{
				title: "Cambios en este aviso",
				paragraphs: ["Si este aviso cambia, se actualizará la fecha de arriba."],
			},
		],
		back: "Volver al sitio",
		backHref: "/es/home",
	},
};
