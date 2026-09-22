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
	await page.getByTitle("Abrir chat").click();

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
