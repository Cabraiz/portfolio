export function normalizeTooltipClassName(value: string): string {
  return value
    .toLowerCase()
    .replaceAll(/\s+/g, "")
    .normalize("NFD")
    .replaceAll(/[\u0300-\u036f]/g, "");
}

export function getWhatsAppGreeting(): string {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Bom dia!";
  }

  if (hour < 18) {
    return "Boa tarde!";
  }

  return "Boa noite!";
}
