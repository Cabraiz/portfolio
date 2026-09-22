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
const TELEGRAM_UPDATES_CACHE_MS = 2000;
const CONVERSATION_ID_PATTERN =
	/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const recentRequests = new Map();
let cachedUpdates = [];
let cachedUpdatesExpiresAt = 0;
let updatesRequest = null;

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

function formatTelegramMessage({
	message,
	pageUrl,
	language,
	userAgent,
	conversationId,
}) {
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
		"",
		"↩️ Use Responder nesta mensagem para devolver a resposta ao visitante.",
		`[Conversa: ${conversationId}]`,
	].join("\n");
}

async function getTelegramUpdates(token) {
	const now = Date.now();
	if (cachedUpdatesExpiresAt > now) return cachedUpdates;
	if (updatesRequest) return updatesRequest;

	updatesRequest = (async () => {
		const params = new URLSearchParams({
			limit: "100",
			timeout: "0",
			allowed_updates: JSON.stringify(["message"]),
		});
		const response = await fetch(
			`https://api.telegram.org/bot${token}/getUpdates?${params}`,
			{ signal: AbortSignal.timeout(8000) }
		);
		const payload = await response.json();
		if (!response.ok || payload.ok !== true || !Array.isArray(payload.result)) {
			throw new Error(`Telegram getUpdates returned ${response.status}`);
		}

		cachedUpdates = payload.result;
		cachedUpdatesExpiresAt = Date.now() + TELEGRAM_UPDATES_CACHE_MS;
		return cachedUpdates;
	})();

	try {
		return await updatesRequest;
	} finally {
		updatesRequest = null;
	}
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
					"access-control-allow-methods": "GET, POST, OPTIONS",
					"access-control-allow-headers": "content-type",
					"access-control-max-age": "86400",
					vary: "Origin",
				},
			});
		}

		if (request.method !== "GET" && request.method !== "POST") {
			return json(
				{ ok: false, error: "Método não permitido." },
				405,
				allowedOrigin
			);
		}

		if (!allowedOrigin) {
			return json({ ok: false, error: "Origem não permitida." }, 403);
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

		if (request.method === "GET") {
			const url = new URL(request.url);
			const conversationId = url.searchParams.get("conversationId") ?? "";
			const afterUpdateId = Number(url.searchParams.get("after") ?? 0);

			if (
				!CONVERSATION_ID_PATTERN.test(conversationId) ||
				!Number.isSafeInteger(afterUpdateId) ||
				afterUpdateId < 0
			) {
				return json({ ok: false, error: "Conversa inválida." }, 400, allowedOrigin);
			}

			try {
				const updates = await getTelegramUpdates(token);
				const marker = `[Conversa: ${conversationId}]`;
				const replies = updates
					.filter((update) => {
						const reply = update.message;
						return (
							Number(update.update_id) > afterUpdateId &&
							String(reply?.chat?.id) === String(chatId) &&
							reply?.from?.is_bot !== true &&
							typeof reply?.text === "string" &&
							reply.reply_to_message?.text?.includes(marker)
						);
					})
					.map((update) => ({
						id: Number(update.update_id),
						text: update.message.text.trim().slice(0, 1000),
						sentAt: Number(update.message.date) * 1000,
					}));
				const cursor = replies.reduce(
					(maximum, reply) => Math.max(maximum, reply.id),
					afterUpdateId
				);

				return json({ ok: true, replies, cursor }, 200, allowedOrigin);
			} catch (error) {
				console.error(
					"Telegram replies could not be read.",
					error instanceof Error ? error.message : "Unknown error"
				);
				return json(
					{ ok: false, error: "Não foi possível buscar respostas." },
					502,
					allowedOrigin
				);
			}
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
		const conversationId =
			typeof payload.conversationId === "string"
				? payload.conversationId.trim()
				: "";
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

		if (!CONVERSATION_ID_PATTERN.test(conversationId)) {
			return json({ ok: false, error: "Conversa inválida." }, 400, allowedOrigin);
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

		const telegramText = formatTelegramMessage({
			message,
			pageUrl: cleanSingleLine(payload.pageUrl, 300),
			language: cleanSingleLine(payload.language, 20),
			userAgent: cleanSingleLine(request.headers.get("user-agent"), 180),
			conversationId,
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
