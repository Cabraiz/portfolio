const DEFAULT_ALLOWED_ORIGINS = [
	"https://cabraiz.com",
	"https://www.cabraiz.com",
	"http://localhost:4173",
	"http://127.0.0.1:4173",
	"http://localhost:5173",
	"http://127.0.0.1:5173",
];

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const recentRequests = new Map();

function json(body, status, origin = null) {
	const headers = {
		"content-type": "application/json; charset=utf-8",
		"cache-control": "no-store",
		"x-content-type-options": "nosniff",
	};

	if (origin) {
		headers["access-control-allow-origin"] = origin;
		headers.vary = "Origin";
	}

	return new Response(JSON.stringify(body), { status, headers });
}

function getAllowedOrigins() {
	const configured = process.env.ALLOWED_ORIGINS?.split(",")
		.map((origin) => origin.trim())
		.filter(Boolean);

	return new Set(configured?.length ? configured : DEFAULT_ALLOWED_ORIGINS);
}

function getClientKey(request) {
	return (
		request.headers.get("x-vercel-forwarded-for") ??
		request.headers.get("x-forwarded-for") ??
		"unknown"
	)
		.split(",")[0]
		.trim();
}

function isRateLimited(clientKey, now) {
	const activeRequests = (recentRequests.get(clientKey) ?? []).filter(
		(timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS
	);

	if (activeRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
		recentRequests.set(clientKey, activeRequests);
		return true;
	}

	activeRequests.push(now);
	recentRequests.set(clientKey, activeRequests);
	return false;
}

function cleanSingleLine(value, maxLength) {
	if (typeof value !== "string") return "";
	return value
		.replace(/[\r\n\t]+/g, " ")
		.trim()
		.slice(0, maxLength);
}

function formatTelegramMessage({ message, pageUrl, language, userAgent }) {
	const receivedAt = new Intl.DateTimeFormat("pt-BR", {
		dateStyle: "short",
		timeStyle: "medium",
		timeZone: "America/Sao_Paulo",
	}).format(new Date());

	return [
		"💬 Nova mensagem pelo portfólio",
		"",
		message,
		"",
		`Página: ${pageUrl || "não informada"}`,
		`Idioma: ${language || "não informado"}`,
		`Recebida em: ${receivedAt}`,
		`Navegador: ${userAgent || "não informado"}`,
	].join("\n");
}

export default {
	async fetch(request) {
		const origin = request.headers.get("origin");
		const allowedOrigin =
			origin && getAllowedOrigins().has(origin) ? origin : null;

		if (request.method === "OPTIONS") {
			if (!allowedOrigin) return json({ ok: false }, 403);

			return new Response(null, {
				status: 204,
				headers: {
					"access-control-allow-origin": allowedOrigin,
					"access-control-allow-methods": "POST, OPTIONS",
					"access-control-allow-headers": "content-type",
					"access-control-max-age": "86400",
					vary: "Origin",
				},
			});
		}

		if (request.method !== "POST") {
			return json(
				{ ok: false, error: "Método não permitido." },
				405,
				allowedOrigin
			);
		}

		if (!allowedOrigin) {
			return json({ ok: false, error: "Origem não permitida." }, 403);
		}

		const contentLength = Number(request.headers.get("content-length") ?? 0);
		if (contentLength > 12_000) {
			return json(
				{ ok: false, error: "Mensagem muito grande." },
				413,
				allowedOrigin
			);
		}

		let payload;
		try {
			payload = await request.json();
		} catch {
			return json(
				{ ok: false, error: "Conteúdo inválido." },
				400,
				allowedOrigin
			);
		}

		const message =
			typeof payload.message === "string" ? payload.message.trim() : "";
		const website =
			typeof payload.website === "string" ? payload.website.trim() : "";
		const startedAt = Number(payload.startedAt);
		const now = Date.now();

		if (website) {
			return json({ ok: true }, 200, allowedOrigin);
		}

		if (message.length < 2 || message.length > 1000) {
			return json(
				{ ok: false, error: "A mensagem deve ter entre 2 e 1000 caracteres." },
				400,
				allowedOrigin
			);
		}

		if (
			!Number.isFinite(startedAt) ||
			now - startedAt < 1500 ||
			startedAt > now
		) {
			return json({ ok: false, error: "Envio inválido." }, 400, allowedOrigin);
		}

		const clientKey = getClientKey(request);
		if (isRateLimited(clientKey, now)) {
			return json(
				{ ok: false, error: "Muitas mensagens. Aguarde alguns minutos." },
				429,
				allowedOrigin
			);
		}

		const token = process.env.TELEGRAM_BOT_TOKEN;
		const chatId = process.env.TELEGRAM_CHAT_ID;
		if (!token || !chatId) {
			console.error(
				"Telegram relay is missing required environment variables."
			);
			return json(
				{ ok: false, error: "Serviço temporariamente indisponível." },
				503,
				allowedOrigin
			);
		}

		const telegramText = formatTelegramMessage({
			message,
			pageUrl: cleanSingleLine(payload.pageUrl, 300),
			language: cleanSingleLine(payload.language, 20),
			userAgent: cleanSingleLine(request.headers.get("user-agent"), 180),
		});

		try {
			const telegramResponse = await fetch(
				`https://api.telegram.org/bot${token}/sendMessage`,
				{
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({
						chat_id: chatId,
						text: telegramText,
						disable_web_page_preview: true,
					}),
					signal: AbortSignal.timeout(8000),
				}
			);

			if (!telegramResponse.ok) {
				console.error(
					"Telegram rejected a portfolio message.",
					telegramResponse.status
				);
				return json(
					{ ok: false, error: "Não foi possível entregar a mensagem." },
					502,
					allowedOrigin
				);
			}

			return json({ ok: true }, 200, allowedOrigin);
		} catch (error) {
			console.error(
				"Telegram delivery failed.",
				error instanceof Error ? error.message : "Unknown error"
			);
			return json(
				{ ok: false, error: "Não foi possível entregar a mensagem." },
				502,
				allowedOrigin
			);
		}
	},
};
