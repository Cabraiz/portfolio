import type { Meta, StoryObj } from "@storybook/react";

import ConversationCTA from "../pages/Mateus/Portfolio/sections/ConversationSection/components/ConversationCTA";
import type { ConversationCTAAction } from "../pages/Mateus/Portfolio/sections/ConversationSection/types";

const primaryAction: ConversationCTAAction = {
  id: "conversation-primary",
  label: "VAMOS CONVERSAR",
  href: "https://wa.me/5585988887777",
  ariaLabel: "Abrir conversa no WhatsApp",
  variant: "primary",
  icon: "whatsapp",
  external: true,
  target: "_blank",
  rel: "noopener noreferrer",
};

const secondaryAction: ConversationCTAAction = {
  id: "conversation-secondary",
  label: "CURRÍCULO",
  href: "/resume.pdf",
  ariaLabel: "Baixar currículo em PDF",
  variant: "secondary",
  icon: "download",
  download: true,
  target: "_self",
};

const meta = {
  title: "Mateus/Portfolio/ConversationCTA",
  component: ConversationCTA,
  parameters: {
    layout: "centered",
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
          display: "grid",
          placeItems: "center",
          padding: "32px",
          background:
            "radial-gradient(circle at top, rgba(255, 204, 0, 0.12), transparent 35%), linear-gradient(180deg, #0d0d0d 0%, #171717 100%)",
        }}
      >
        <div
          style={{
            width: "min(100%, 520px)",
            display: "grid",
            gap: "16px",
          }}
        >
          <Story />
        </div>
      </div>
    ),
  ],
  args: {
    action: primaryAction,
    size: "default",
    fullWidth: false,
    loading: false,
    disabled: false,
  },
  argTypes: {
    className: { control: false },
    action: { control: false },
  },
} satisfies Meta<typeof ConversationCTA>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  name: "Primary / Default",
  args: {
    action: primaryAction,
  },
};

export const Secondary: Story = {
  name: "Secondary / Default",
  args: {
    action: secondaryAction,
  },
};

export const Compact: Story = {
  name: "Primary / Compact",
  args: {
    action: primaryAction,
    size: "compact",
  },
};

export const FullWidth: Story = {
  name: "Primary / Full width",
  args: {
    action: primaryAction,
    fullWidth: true,
  },
};

export const Loading: Story = {
  name: "Primary / Loading",
  args: {
    action: primaryAction,
    loading: true,
  },
};

export const Disabled: Story = {
  name: "Secondary / Disabled",
  args: {
    action: secondaryAction,
    disabled: true,
  },
};

export const LongLabel: Story = {
  name: "Primary / Long label",
  args: {
    action: {
      ...primaryAction,
      id: "conversation-primary-long",
      label: "VAMOS CONVERSAR SOBRE ARQUITETURA E EVOLUÇÃO DO PRODUTO",
    },
    fullWidth: true,
  },
};
