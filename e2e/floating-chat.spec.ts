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
	await expect(
		page.locator('[data-chat-author="visitor"] [data-chat-avatar="visitor"]')
	).toHaveAttribute("aria-label", /Visitante anônimo|Anonymous visitor/);
	await expect(
		page.locator('[data-chat-author="mateus"] [data-chat-avatar="mateus"]')
	).toHaveAttribute("alt", "Mateus Cabral");
	await expect(
		page.locator('[data-chat-author="mateus"] [data-chat-avatar="mateus"]')
	).toHaveAttribute("src", /mateus-chat-avatar-v2/);
	expect(receivedPayload).toMatchObject({
		message: "Olá, quero conversar sobre um projeto.",
		website: "",
	});
	expect(receivedPayload?.conversationId).toMatch(
		/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
	);

	await expect
		.poll(() =>
			page.evaluate(() =>
				window.localStorage.getItem("cabraiz-chat-messages")
			)
		)
		.toContain("Olá, quero conversar sobre um projeto.");
	await page.reload();
	await page.getByRole("button", { name: "Abrir chat" }).click();
	await expect(
		page.locator('[data-chat-author="visitor"]', {
			hasText: "Olá, quero conversar sobre um projeto.",
		})
	).toHaveCount(1);
	await expect(
		page.locator('[data-chat-author="mateus"]', {
			hasText: "Olá! Recebi sua mensagem e retorno por aqui.",
		})
	).toHaveCount(1);
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
		// Mobile Home intentionally hides chat; wait for an eligible route to settle.
		await page.goto("/contact", { waitUntil: "networkidle" });
		await expect(page.locator('main[data-active-section="contact"]')).toBeVisible();
		await page.getByRole("button", { name: "Abrir chat" }).click();

		const closeButton = page.getByRole("button", {
			name: /Fechar|Close/,
			exact: true,
		});
		await expect(closeButton).toBeVisible();
		await expect(closeButton).toHaveText("×");
		await expect(page.getByText("Atendente virtual", { exact: true })).toBeVisible();
		await expect(page.getByText("Online", { exact: true })).toBeVisible();
		const closeButtonBox = await closeButton.boundingBox();
		expect(closeButtonBox, `${viewport.width}x${viewport.height}`).not.toBeNull();
		expect(closeButtonBox!.width).toBeGreaterThanOrEqual(41);
		expect(closeButtonBox!.height).toBeGreaterThanOrEqual(41);
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

test("opens services and minimizes the chat from the pricing action", async ({
	page,
}) => {
	test.setTimeout(45_000);
	for (const scenario of [
		{ viewport: { width: 1366, height: 600 }, startPath: "/home" },
		{ viewport: { width: 390, height: 844 }, startPath: "/contact" },
	]) {
		await page.setViewportSize(scenario.viewport);
		await page.goto(scenario.startPath);
		await page.getByRole("button", { name: "Abrir chat" }).click();

		const panel = page.locator('[data-chat-panel="true"]');
		await expect(panel).toBeVisible();

		await page.getByRole("button", { name: /Ver valores|View pricing/ }).click();
		await expect(page).toHaveURL(/\/servicos$/);
		await expect(panel).toHaveCount(0, { timeout: 1200 });
		await expect(page.locator('[data-services-root="true"]')).toBeVisible();
		await expect(page.getByRole("button", { name: "Abrir chat" })).toBeVisible();
	}
});

test("shrinks the chat toward its trigger before removing it", async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 720 });
	await page.goto("/home");
	await page.getByRole("button", { name: "Abrir chat" }).click();

	const panel = page.locator('[data-chat-panel="true"]');
	await expect(panel).toBeVisible();
	const before = await panel.boundingBox();
	expect(before).not.toBeNull();

	await page.getByRole("button", { name: /Fechar|Close/, exact: true }).click();
	await expect(panel).toBeAttached();
	await page.waitForTimeout(220);
	const during = await panel.boundingBox();
	expect(during).not.toBeNull();
	expect(during!.width).toBeLessThan(before!.width * 0.92);
	expect(during!.height).toBeLessThan(before!.height * 0.98);
	expect(during!.x).toBeGreaterThan(before!.x);
	expect(during!.y).toBeGreaterThan(before!.y);

	await expect(panel).toHaveCount(0, { timeout: 1200 });
	await expect(page.getByRole("button", { name: "Abrir chat" })).toBeVisible();
});
