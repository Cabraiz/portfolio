import type { Meta, StoryObj } from "@storybook/react";

import ConversationSection from "../pages/Mateus/Portfolio/sections/ConversationSection/ConversationSection";
import {
  CONVERSATION_PRIMARY_CTA,
  CONVERSATION_SECONDARY_CTA,
  CONVERSATION_SECTION_COPY,
} from "../pages/Mateus/Portfolio/sections/ConversationSection/constants";
import type {
  ConversationPartner,
  ConversationSectionCopy,
} from "../pages/Mateus/Portfolio/sections/ConversationSection/types";

const partners: readonly ConversationPartner[] = [
  {
    id: "bnb",
    name: "Bank of the Northeast",
    alt: "Logo do Bank of the Northeast",
    logoSrc:
      "https://dummyimage.com/180x64/1c1c1c/e8e8e8.png&text=Bank+of+the+Northeast",
    href: "#",
  },
  {
    id: "unifor",
    name: "Unifor",
    alt: "Logo da Unifor",
    logoSrc: "https://dummyimage.com/180x64/1c1c1c/e8e8e8.png&text=Unifor",
    href: "#",
  },
  {
    id: "sana",
    name: "SANA",
    alt: "Logo da SANA",
    logoSrc: "https://dummyimage.com/180x64/1c1c1c/e8e8e8.png&text=SANA",
    href: "#",
  },
  {
    id: "sedih",
    name: "SEDIH",
    alt: "Logo da SEDIH",
    logoSrc: "https://dummyimage.com/180x64/1c1c1c/e8e8e8.png&text=SEDIH",
    href: "#",
  },
];

const backendFocusedCopy: ConversationSectionCopy = {
  eyebrow: "Senior",
  title: "Back-End Developer",
  description:
    "Atuação orientada a arquitetura, integrações, observabilidade e evolução sustentável de plataformas críticas.",
  highlights: [
    "APIs robustas, contratos claros e organização por domínio",
    "Filas, processamento assíncrono e fluxos de background",
    "Deploy, monitoramento e hardening de ambientes",
  ],
  supportText:
    "Disponível para discutir refatoração estrutural, confiabilidade, performance e governança técnica.",
  ctaGroupAriaLabel: "Ações principais de contato e currículo",
  partnersAriaLabel: "Empresas e instituições com experiência profissional",
};

const longContentCopy: ConversationSectionCopy = {
  eyebrow: "Senior",
  title: "Full Stack Developer",
  description:
    "Desenvolvedor focado em produto, arquitetura e execução ponta a ponta, com experiência em front-end, back-end, integrações, observabilidade e evolução contínua de plataformas digitais.",
  highlights: [
    "Arquitetura limpa com foco em clareza de manutenção",
    "Responsividade, performance e acabamento visual profissional",
    "Integrações externas, automações e fluxos assíncronos",
    "Capacidade de liderar entregas complexas com visão de produto",
  ],
  supportText:
    "Aberto para conversar sobre projetos novos, reestruturação de sistemas existentes, melhoria de UX e aceleração de entregas com base técnica sólida.",
  ctaGroupAriaLabel: "Ações principais de contato e currículo",
  partnersAriaLabel: "Empresas e instituições com experiência profissional",
};

const meta = {
  title: "Mateus/Portfolio/ConversationSection",
  component: ConversationSection,
  parameters: {
    layout: "fullscreen",
    controls: { expanded: true },
    backgrounds: {
      default: "portfolio-dark",
      values: [
        { name: "portfolio-dark", value: "#0d0d0d" },
        { name: "light", value: "#f5f5f5" },
      ],
    },
  },
  decorators: [
    (Story) => (
      <div
        style={{
          minHeight: "100vh",
          width: "100%",
          padding: "40px 24px",
          background:
            "radial-gradient(circle at top, rgba(255, 204, 0, 0.14), transparent 32%), linear-gradient(180deg, #0d0d0d 0%, #171717 100%)",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: "min(100%, 1280px)",
            margin: "0 auto",
          }}
        >
          <Story />
        </div>
      </div>
    ),
  ],
  args: {
    id: "conversation",
    copy: CONVERSATION_SECTION_COPY,
    primaryAction: CONVERSATION_PRIMARY_CTA,
    secondaryAction: CONVERSATION_SECONDARY_CTA,
    partners,
    compact: false,
    titleAs: "h2",
  },
  argTypes: {
    className: { control: false },
  },
} satisfies Meta<typeof ConversationSection>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Default",
};

export const Compact: Story = {
  name: "Compact",
  args: {
    compact: true,
  },
};

export const BackendFocused: Story = {
  name: "Back-end focused",
  args: {
    copy: backendFocusedCopy,
  },
};

export const WithLongContent: Story = {
  name: "With long content",
  args: {
    copy: longContentCopy,
    primaryAction: {
      ...CONVERSATION_PRIMARY_CTA,
      id: "conversation-primary-long",
      label: "VAMOS CONVERSAR SOBRE PRODUTO, ARQUITETURA E ESCALABILIDADE",
    },
    secondaryAction: {
      ...CONVERSATION_SECONDARY_CTA,
      id: "conversation-secondary-long",
      label: "VER CURRÍCULO COMPLETO",
    },
  },
};

export const SinglePartnerRowStress: Story = {
  name: "Partner rail stress",
  args: {
    partners: [
      ...partners,
      {
        id: "extra-1",
        name: "Projeto Extra 1",
        alt: "Logo Projeto Extra 1",
        logoSrc:
          "https://dummyimage.com/180x64/1c1c1c/e8e8e8.png&text=Projeto+1",
        href: "#",
      },
      {
        id: "extra-2",
        name: "Projeto Extra 2",
        alt: "Logo Projeto Extra 2",
        logoSrc:
          "https://dummyimage.com/180x64/1c1c1c/e8e8e8.png&text=Projeto+2",
        href: "#",
      },
    ],
  },
};
