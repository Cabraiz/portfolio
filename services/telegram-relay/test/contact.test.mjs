import assert from "node:assert/strict";
import test from "node:test";

import contactHandler from "../api/contact.js";

const originalFetch = globalThis.fetch;

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
	const response = await contactHandler.fetch(
		new Request("https://relay.example/api/contact", {
			method: "POST",
			headers: {
				"content-type": "application/json",
				origin: "https://cabraiz.com",
			},
			body: JSON.stringify({
				message: "Mensagem rápida demais",
				startedAt: Date.now(),
			}),
		})
	);

	assert.equal(response.status, 400);
});
