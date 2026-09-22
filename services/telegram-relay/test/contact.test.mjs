import assert from "node:assert/strict";
import test from "node:test";

import contactHandler from "../api/contact.js";

const originalFetch = globalThis.fetch;
const CONVERSATION_ID = "16b7d6c2-6d4d-4a0f-9d88-12ef8ac25f41";

test.afterEach(() => {
	globalThis.fetch = originalFetch;
	delete process.env.TELEGRAM_BOT_TOKEN;
	delete process.env.TELEGRAM_CHAT_ID;
});

test("forwards a valid portfolio message to Telegram", async () => {
	process.env.TELEGRAM_BOT_TOKEN = "test-token";
	process.env.TELEGRAM_CHAT_ID = "123456";

	let telegramRequest;
	globalThis.fetch = async (url, init) => {
		telegramRequest = { url, init };
		return new Response(JSON.stringify({ ok: true }), { status: 200 });
	};

	const response = await contactHandler.fetch(
		new Request("https://relay.example/api/contact", {
			method: "POST",
			headers: {
				"content-type": "application/json",
				origin: "https://cabraiz.com",
				"user-agent": "Playwright",
				"x-forwarded-for": "203.0.113.10",
			},
			body: JSON.stringify({
			message: "Olá, quero conversar sobre um projeto.",
			conversationId: CONVERSATION_ID,
				pageUrl: "https://cabraiz.com/contact",
				language: "pt-BR",
				startedAt: Date.now() - 3000,
				website: "",
			}),
		})
	);

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
});

test("returns Telegram replies for the matching browser conversation", async () => {
	process.env.TELEGRAM_BOT_TOKEN = "test-token";
	process.env.TELEGRAM_CHAT_ID = "123456";

	globalThis.fetch = async () =>
		new Response(
			JSON.stringify({
				ok: true,
				result: [
					{
						update_id: 77,
						message: {
							date: 1_790_100_000,
							text: "Olá! Recebi sua mensagem.",
							from: { is_bot: false },
							chat: { id: 123456 },
							reply_to_message: {
								text: `Mensagem original\n[Conversa: ${CONVERSATION_ID}]`,
							},
						},
					},
				],
			}),
			{ status: 200, headers: { "content-type": "application/json" } }
		);

	const response = await contactHandler.fetch(
		new Request(
			`https://relay.example/api/contact?conversationId=${CONVERSATION_ID}&after=0`,
			{ headers: { origin: "https://cabraiz.com" } }
		)
	);
	const body = await response.json();

	assert.equal(response.status, 200);
	assert.equal(body.cursor, 77);
	assert.deepEqual(body.replies, [
		{
			id: 77,
			text: "Olá! Recebi sua mensagem.",
			sentAt: 1_790_100_000_000,
		},
	]);
});

test("rejects requests from another origin", async () => {
	const response = await contactHandler.fetch(
		new Request("https://relay.example/api/contact", {
			method: "POST",
			headers: {
				"content-type": "application/json",
				origin: "https://example.com",
			},
			body: JSON.stringify({
				message: "Spam",
				startedAt: Date.now() - 3000,
			}),
		})
	);

	assert.equal(response.status, 403);
});

test("requires a human-sized delay before submission", async () => {
	process.env.TELEGRAM_BOT_TOKEN = "test-token";
	process.env.TELEGRAM_CHAT_ID = "123456";

	const response = await contactHandler.fetch(
		new Request("https://relay.example/api/contact", {
			method: "POST",
			headers: {
				"content-type": "application/json",
				origin: "https://cabraiz.com",
			},
			body: JSON.stringify({
		message: "Mensagem rápida demais",
		conversationId: CONVERSATION_ID,
				startedAt: Date.now(),
			}),
		})
	);

	assert.equal(response.status, 400);
});
