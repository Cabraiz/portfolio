import { expect, test } from "@playwright/test";

test("sends a portfolio chat message through the contact API", async ({
	page,
}) => {
	let receivedPayload: Record<string, unknown> | null = null;

	await page.route("**/api/contact*", async (route) => {
		if (route.request().method() === "GET") {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({
					ok: true,
					cursor: 91,
					replies: [
						{
							id: 91,
							text: "Olá! Recebi sua mensagem e retorno por aqui.",
							sentAt: Date.now(),
						},
					],
				}),
			});
			return;
		}

		receivedPayload = route.request().postDataJSON();
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({ ok: true }),
		});
	});

	await page.goto("/");
	await page.getByRole("button", { name: "Abrir chat" }).click();

	const input = page.locator('input[name="message"]');
	await input.fill("Olá, quero conversar sobre um projeto.");
	await page.getByRole("button", { name: /Enviar|Send/, exact: true }).click();

	await expect(
		page.getByText(
			/Mensagem enviada\. A resposta do Mateus aparecerá aqui|Message sent\. Mateus' reply will appear here/
		)
	).toBeVisible();
	await expect(
		page.getByText("Olá! Recebi sua mensagem e retorno por aqui.")
	).toBeVisible();
	expect(receivedPayload).toMatchObject({
		message: "Olá, quero conversar sobre um projeto.",
		website: "",
	});
	expect(receivedPayload?.conversationId).toMatch(
		/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
	);
});
test("keeps the message after a delivery error and allows a successful retry", async ({
	page,
}) => {
	let postAttempts = 0;

	await page.route("**/api/contact*", async (route) => {
		if (route.request().method() === "GET") {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({ ok: true, cursor: 0, replies: [] }),
			});
			return;
		}

		postAttempts += 1;
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify(
				postAttempts === 1
					? { ok: false, error: "Telegram indisponível" }
					: { ok: true }
			),
		});
	});

	await page.goto("/");
	await page.getByRole("button", { name: "Abrir chat" }).click();

	const message = "Preciso de uma proposta para um novo projeto.";
	const input = page.locator('input[name="message"]');
	const sendButton = page.getByRole("button", {
		name: /Enviar|Send/,
		exact: true,
	});

	await input.fill(message);
	await sendButton.click();
	await expect(
		page.getByText(
			/Não foi possível enviar agora\. Tente novamente\.|The message could not be sent\. Please try again\./
		)
	).toBeVisible();
	await expect(input).toHaveValue(message);

	await sendButton.click();
	await expect(
		page.getByText(
			/Mensagem enviada\. A resposta do Mateus aparecerá aqui|Message sent\. Mateus' reply will appear here/
		)
	).toBeVisible();
	await expect(page.locator('[data-chat-author="visitor"]')).toHaveText(message);
	expect(postAttempts).toBe(2);
});

test("resumes reply polling after a reload for a recent conversation", async ({
	page,
}) => {
	const conversationId = "16b7d6c2-6d4d-4a0f-9d88-12ef8ac25f41";
	let requestedConversationId = "";

	await page.route("**/api/contact*", async (route) => {
		const requestUrl = new URL(route.request().url());
		requestedConversationId =
			requestUrl.searchParams.get("conversationId") ?? "";
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({
				ok: true,
				cursor: 121,
				replies: [
					{
						id: 121,
						text: "Resposta recuperada depois do recarregamento.",
						sentAt: Date.now(),
					},
				],
			}),
		});
	});

	await page.goto("/");
	await page.evaluate(
		([storedConversationId, lastSentAt]) => {
			window.localStorage.setItem(
				"cabraiz-chat-conversation-id",
				storedConversationId
			);
			window.localStorage.setItem("cabraiz-chat-last-sent-at", lastSentAt);
		},
		[conversationId, String(Date.now())]
	);
	await page.reload();
	await page.getByRole("button", { name: "Abrir chat" }).click();

	await expect(
		page.getByText("Resposta recuperada depois do recarregamento.")
	).toBeVisible();
	expect(requestedConversationId).toBe(conversationId);
});

test("prevents duplicate delivery from two immediate clicks", async ({ page }) => {
	let postAttempts = 0;

	await page.route("**/api/contact*", async (route) => {
		if (route.request().method() === "GET") {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({ ok: true, cursor: 0, replies: [] }),
			});
			return;
		}

		postAttempts += 1;
		await new Promise((resolve) => setTimeout(resolve, 200));
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({ ok: true }),
		});
	});

	await page.goto("/");
	await page.getByRole("button", { name: "Abrir chat" }).click();
	await page
		.locator('input[name="message"]')
		.fill("Esta mensagem deve chegar somente uma vez.");

	const sendButton = page.getByRole("button", {
		name: /Enviar|Send/,
		exact: true,
	});
	await sendButton.evaluate((button) => {
		button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
		button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
	});

	await expect(
		page.getByText(
			/Mensagem enviada\. A resposta do Mateus aparecerá aqui|Message sent\. Mateus' reply will appear here/
		)
	).toBeVisible();
	expect(postAttempts).toBe(1);
});

test("keeps the open chat and its controls inside short and mobile viewports", async ({
	page,
}) => {
	test.setTimeout(60_000);
	const viewports = [
		{ width: 320, height: 640 },
		{ width: 360, height: 640 },
		{ width: 1366, height: 600 },
		{ width: 1366, height: 720 },
		{ width: 1920, height: 1080 },
	];

	for (const viewport of viewports) {
		await page.setViewportSize(viewport);
		await page.goto("/");
		await page.getByRole("button", { name: "Abrir chat" }).click();

		const closeButton = page.getByRole("button", {
			name: /Fechar|Close/,
			exact: true,
		});
		await expect(closeButton).toBeVisible();
		await expect(closeButton).toHaveText("×");
		await expect(page.locator('input[name="message"]')).toBeVisible();
		await expect(
			page.getByRole("button", { name: /Enviar|Send/, exact: true })
		).toBeVisible();

		const panelBox = await closeButton.locator("..").boundingBox();
		const composerBox = await page
			.locator('[data-chat-composer="true"]')
			.boundingBox();
		expect(panelBox, `${viewport.width}x${viewport.height}`).not.toBeNull();
		expect(composerBox, `${viewport.width}x${viewport.height}`).not.toBeNull();
		expect(panelBox!.x).toBeGreaterThanOrEqual(0);
		expect(panelBox!.y).toBeGreaterThanOrEqual(0);
		expect(panelBox!.x + panelBox!.width).toBeLessThanOrEqual(viewport.width);
		expect(panelBox!.y + panelBox!.height).toBeLessThanOrEqual(viewport.height);
		const heightRatio = panelBox!.height / viewport.height;
		expect(heightRatio).toBeGreaterThanOrEqual(0.79);
		expect(heightRatio).toBeLessThanOrEqual(0.81);
		const composerBottomInset =
			panelBox!.y + panelBox!.height - (composerBox!.y + composerBox!.height);
		expect(composerBottomInset).toBeGreaterThanOrEqual(15);
		expect(composerBottomInset).toBeLessThanOrEqual(30);
	}
});

test("hides the scrollbar and keeps wheel scrolling inside the chat", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1366, height: 600 });
	await page.goto("/home");
	await page.getByRole("button", { name: "Abrir chat" }).click();
	await page.getByRole("button", { name: /Ver valores|View pricing/ }).click();

	const scrollArea = page.locator('[data-chat-scroll-area="true"]');
	await expect(scrollArea).toBeVisible();
	await expect
		.poll(() =>
			scrollArea.evaluate(
				(element) => element.scrollHeight > element.clientHeight
			)
		)
		.toBe(true);
	expect(
		await scrollArea.evaluate(
			(element) => getComputedStyle(element).scrollbarWidth
		)
	).toBe("none");

	const panel = page
		.getByRole("button", { name: /Fechar|Close/, exact: true })
		.locator("..");
	const panelBox = await panel.boundingBox();
	expect(panelBox).not.toBeNull();

	const pathBeforeWheel = new URL(page.url()).pathname;
	await page.mouse.move(panelBox!.x + 40, panelBox!.y + 40);
	await page.mouse.wheel(0, 420);

	await expect
		.poll(() => scrollArea.evaluate((element) => element.scrollTop))
		.toBeGreaterThan(0);
	expect(new URL(page.url()).pathname).toBe(pathBeforeWheel);

	for (let attempt = 0; attempt < 6; attempt += 1) {
		await page.mouse.wheel(0, 1000);
	}
	await page.waitForTimeout(250);
	expect(new URL(page.url()).pathname).toBe(pathBeforeWheel);
});
