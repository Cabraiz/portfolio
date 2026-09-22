import { expect, test } from "@playwright/test";

test("sends a portfolio chat message through the contact API", async ({
	page,
}) => {
	let receivedPayload: Record<string, unknown> | null = null;

	await page.route("**/api/contact", async (route) => {
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
			/Mensagem enviada para o Mateus no Telegram|Your message was sent to Mateus on Telegram/
		)
	).toBeVisible();
	expect(receivedPayload).toMatchObject({
		message: "Olá, quero conversar sobre um projeto.",
		website: "",
	});
});
