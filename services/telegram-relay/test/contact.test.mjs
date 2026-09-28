import assert from "node:assert/strict";
import test from "node:test";

const originalFetch = globalThis.fetch;
const CONVERSATION_ID = "16b7d6c2-6d4d-4a0f-9d88-12ef8ac25f41";
let moduleSequence = 0;

async function loadHandler() {
	const module = await import(`../api/contact.js?test=${moduleSequence++}`);
	return module.default;
}

function configureTelegram() {
	process.env.TELEGRAM_BOT_TOKEN = "test-token";
	process.env.TELEGRAM_CHAT_ID = "123456";
}

function createMessageRequest(overrides = {}, headers = {}) {
	return new Request("https://relay.example/api/contact", {
		method: "POST",
		headers: {
			"content-type": "application/json",
			origin: "https://cabraiz.com",
			"user-agent": "Playwright",
			"x-forwarded-for": "203.0.113.10",
			...headers,
		},
		body: JSON.stringify({
			message: "Olá, quero conversar sobre um projeto.",
			conversationId: CONVERSATION_ID,
			pageUrl: "https://cabraiz.com/contact",
			language: "pt-BR",
			startedAt: Date.now() - 3000,
			website: "",
			...overrides,
		}),
	});
}

test.afterEach(() => {
	globalThis.fetch = originalFetch;
	delete process.env.TELEGRAM_BOT_TOKEN;
	delete process.env.TELEGRAM_CHAT_ID;
});

test("forwards a valid portfolio message to Telegram with reply guidance", async () => {
	configureTelegram();
	const contactHandler = await loadHandler();
	let telegramRequest;

	globalThis.fetch = async (url, init) => {
		telegramRequest = { url, init };
		return new Response(JSON.stringify({ ok: true }), { status: 200 });
	};

	const response = await contactHandler.fetch(createMessageRequest());

	assert.equal(response.status, 200);
	assert.deepEqual(await response.json(), { ok: true });
	assert.equal(
		telegramRequest.url,
		"https://api.telegram.org/bottest-token/sendMessage"
	);

	const telegramBody = JSON.parse(telegramRequest.init.body);
	assert.equal(telegramBody.chat_id, "123456");
	assert.match(telegramBody.text, /Olá, quero conversar sobre um projeto\./);
	assert.match(telegramBody.text, /https:\/\/cabraiz\.com\/contact/);
	assert.match(telegramBody.text, new RegExp(`\\[Conversa: ${CONVERSATION_ID}\\]`));
	assert.deepEqual(telegramBody.reply_markup, {
		force_reply: true,
		input_field_placeholder: "Responder ao visitante",
	});
});

test("reads the latest Telegram updates and returns ordered matching replies", async () => {
	configureTelegram();
	const contactHandler = await loadHandler();
	let requestedUrl = "";

	globalThis.fetch = async (url) => {
		requestedUrl = String(url);
		return new Response(
			JSON.stringify({
				ok: true,
				result: [
					{
						update_id: 79,
						message: {
							date: 1_790_100_002,
							text: "Segunda resposta",
							from: { is_bot: false },
							chat: { id: 123456 },
							reply_to_message: {
								text: `Original\n[Conversa: ${CONVERSATION_ID}]`,
							},
						},
					},
					{
						update_id: 78,
						message: {
							date: 1_790_100_001,
							text: "Outra conversa",
							from: { is_bot: false },
							chat: { id: 123456 },
							reply_to_message: {
								text: "Original\n[Conversa: 2e4da977-d26c-45eb-80af-5503a37a4729]",
							},
						},
					},
					{
						update_id: 77,
						message: {
							date: 1_790_100_000,
							text: " Primeira resposta ",
							from: { is_bot: false },
							chat: { id: 123456 },
							reply_to_message: {
								text: `Original\n[Conversa: ${CONVERSATION_ID}]`,
							},
						},
					},
					{
						update_id: 80,
						message: {
							date: 1_790_100_003,
							text: "   ",
							from: { is_bot: false },
							chat: { id: 123456 },
							reply_to_message: {
								text: `Original\n[Conversa: ${CONVERSATION_ID}]`,
							},
						},
					},
				],
			}),
			{ status: 200, headers: { "content-type": "application/json" } }
		);
	};

	const response = await contactHandler.fetch(
		new Request(
			`https://relay.example/api/contact?conversationId=${CONVERSATION_ID}&after=0`,
			{ headers: { origin: "https://cabraiz.com" } }
		)
	);
	const body = await response.json();
	const updateUrl = new URL(requestedUrl);

	assert.equal(response.status, 200);
	assert.equal(updateUrl.searchParams.get("offset"), "-100");
	assert.equal(updateUrl.searchParams.get("limit"), "100");
	assert.equal(body.cursor, 79);
	assert.deepEqual(body.replies, [
		{ id: 77, text: "Primeira resposta", sentAt: 1_790_100_000_000 },
		{ id: 79, text: "Segunda resposta", sentAt: 1_790_100_002_000 },
	]);
});

test("allows the local development origin in a CORS preflight", async () => {
	const contactHandler = await loadHandler();
	const response = await contactHandler.fetch(
		new Request("https://relay.example/api/contact", {
			method: "OPTIONS",
			headers: { origin: "http://127.0.0.1:5173" },
		})
	);

	assert.equal(response.status, 204);
	assert.equal(
		response.headers.get("access-control-allow-origin"),
		"http://127.0.0.1:5173"
	);
	assert.match(response.headers.get("access-control-allow-methods"), /GET/);
	assert.match(response.headers.get("access-control-allow-methods"), /POST/);
});

test("rejects requests from another origin", async () => {
	const contactHandler = await loadHandler();
	const response = await contactHandler.fetch(
		new Request("https://relay.example/api/contact", {
			method: "POST",
			headers: {
				"content-type": "application/json",
				origin: "https://example.com",
			},
			body: JSON.stringify({ message: "Spam", startedAt: Date.now() - 3000 }),
		})
	);

	assert.equal(response.status, 403);
});

test("returns 503 when Telegram credentials are missing", async () => {
	const contactHandler = await loadHandler();
	const response = await contactHandler.fetch(createMessageRequest());

	assert.equal(response.status, 503);
	assert.equal((await response.json()).ok, false);
});

test("rejects malformed message submissions", async (t) => {
	await t.test("invalid JSON", async () => {
		configureTelegram();
		const contactHandler = await loadHandler();
		const response = await contactHandler.fetch(
			new Request("https://relay.example/api/contact", {
				method: "POST",
				headers: {
					"content-type": "application/json",
					origin: "https://cabraiz.com",
				},
				body: "{",
			})
		);
		assert.equal(response.status, 400);
	});

	await t.test("message shorter than two characters", async () => {
		configureTelegram();
		const contactHandler = await loadHandler();
		const response = await contactHandler.fetch(
			createMessageRequest({ message: "x" })
		);
		assert.equal(response.status, 400);
	});

	await t.test("invalid conversation id", async () => {
		configureTelegram();
		const contactHandler = await loadHandler();
		const response = await contactHandler.fetch(
			createMessageRequest({ conversationId: "invalid" })
		);
		assert.equal(response.status, 400);
	});

	await t.test("submission faster than the anti-bot delay", async () => {
		configureTelegram();
		const contactHandler = await loadHandler();
		const response = await contactHandler.fetch(
			createMessageRequest({ startedAt: Date.now() })
		);
		assert.equal(response.status, 400);
	});
});

test("accepts honeypot spam without forwarding it", async () => {
	configureTelegram();
	const contactHandler = await loadHandler();
	let fetchCalls = 0;
	globalThis.fetch = async () => {
		fetchCalls += 1;
		return new Response(JSON.stringify({ ok: true }), { status: 200 });
	};

	const response = await contactHandler.fetch(
		createMessageRequest({ website: "filled-by-bot.example" })
	);

	assert.equal(response.status, 200);
	assert.equal(fetchCalls, 0);
});

test("rejects an oversized request before parsing it", async () => {
	configureTelegram();
	const contactHandler = await loadHandler();
	const response = await contactHandler.fetch(
		createMessageRequest({}, { "content-length": "12001" })
	);

	assert.equal(response.status, 413);
});

test("treats a Telegram HTTP 200 with ok false as a failed delivery", async () => {
	configureTelegram();
	const contactHandler = await loadHandler();
	globalThis.fetch = async () =>
		new Response(JSON.stringify({ ok: false, description: "Bad Request" }), {
			status: 200,
		});

	const response = await contactHandler.fetch(createMessageRequest());

	assert.equal(response.status, 502);
	assert.equal((await response.json()).ok, false);
});

test("rate limits the sixth message from the same client", async () => {
	configureTelegram();
	const contactHandler = await loadHandler();
	globalThis.fetch = async () =>
		new Response(JSON.stringify({ ok: true }), { status: 200 });

	for (let attempt = 0; attempt < 5; attempt += 1) {
		const response = await contactHandler.fetch(createMessageRequest());
		assert.equal(response.status, 200);
	}

	const blockedResponse = await contactHandler.fetch(createMessageRequest());
	assert.equal(blockedResponse.status, 429);
});

test("returns 502 when Telegram replies cannot be loaded", async () => {
	configureTelegram();
	const contactHandler = await loadHandler();
	globalThis.fetch = async () =>
		new Response(JSON.stringify({ ok: false }), { status: 500 });

	const response = await contactHandler.fetch(
		new Request(
			`https://relay.example/api/contact?conversationId=${CONVERSATION_ID}&after=0`,
			{ headers: { origin: "https://cabraiz.com" } }
		)
	);

	assert.equal(response.status, 502);
	assert.equal((await response.json()).ok, false);
});
