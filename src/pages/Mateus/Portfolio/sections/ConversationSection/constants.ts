import type { ConversationCTAAction, ConversationSectionCopy } from "./types";

export const CONVERSATION_SECTION_ID = "conversation";

export const CONVERSATION_DEFAULT_TITLE_TAG = "h2" as const;

/**
 * Copy-base da seção.
 * Mantém o conteúdo centralizado e evita string solta dentro do componente.
 */
export const CONVERSATION_SECTION_COPY = {
  eyebrow: "Senior",
  title: "Full Stack Developer",
  description:
    "Desenvolvedor focado em experiências web sólidas, arquitetura limpa e entrega de produto com padrão profissional.",
  highlights: [
    "Front-end com foco em UX, performance e responsividade",
    "Back-end orientado a domínio, integrações e escalabilidade",
    "Capacidade de atuar do discovery à entrega em produção",
  ],
  supportText:
    "Disponível para conversar sobre produto, engenharia, refatoração estrutural e evolução de plataformas digitais.",
  ctaGroupAriaLabel: "Ações principais de contato e currículo",
  partnersAriaLabel: "Empresas e instituições com experiência profissional",
} satisfies ConversationSectionCopy;

/**
 * Ajuste os hrefs abaixo para os links reais do projeto.
 * Aqui deixei âncoras seguras para não acoplar este arquivo a rotas externas.
 */
export const CONVERSATION_PRIMARY_CTA = {
  id: "conversation-primary",
  label: "VAMOS CONVERSAR",
  href: "#contato",
  ariaLabel: "Ir para a ação principal de contato",
  variant: "primary",
  icon: "whatsapp",
  target: "_self",
} satisfies ConversationCTAAction;

export const CONVERSATION_SECONDARY_CTA = {
  id: "conversation-secondary",
  label: "CURRÍCULO",
  href: "#curriculo",
  ariaLabel: "Ir para a ação de currículo",
  variant: "secondary",
  icon: "download",
  target: "_self",
} satisfies ConversationCTAAction;

export const CONVERSATION_DEFAULT_ACTIONS = [
  CONVERSATION_PRIMARY_CTA,
  CONVERSATION_SECONDARY_CTA,
] as const;
