import type { Meta, StoryObj } from "@storybook/react";
import WhatsAppSignalButton from "../pages/Mateus/shared/WhatsAppSignalButton/WhatsAppSignalButton";

const meta = {
  title: "Mateus/WhatsAppSignalButton",
  component: WhatsAppSignalButton,
  parameters: {
    layout: "centered",
    backgrounds: {
      default: "dark-shell",
      values: [
        { name: "dark-shell", value: "#070b11" },
        { name: "surface", value: "#111827" },
      ],
    },
  },
  decorators: [
    (Story) => (
      <div
        style={{
          minHeight: "320px",
          width: "100%",
          display: "grid",
          placeItems: "center",
          padding: "32px",
          background:
            "radial-gradient(circle at top, rgba(37, 211, 102, 0.08), transparent 30%), #070b11",
        }}
      >
        <Story />
      </div>
    ),
  ],
  args: {
    href: "https://wa.me/5585999999999",
    label: "WhatsApp",
    topLabel: "Contato direto",
    bottomLabel: "Resposta rápida",
    fullWidth: false,
    compact: false,
    disabled: false,
  },
} satisfies Meta<typeof WhatsAppSignalButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Compact: Story = {
  args: {
    compact: true,
  },
};

export const FullWidth: Story = {
  args: {
    fullWidth: true,
    label: "Chamar no WhatsApp",
  },
  render: (args) => (
    <div style={{ width: "min(100%, 420px)" }}>
      <WhatsAppSignalButton {...args} />
    </div>
  ),
};

export const FocusVisible: Story = {
  args: {
    label: "Conversar agora",
  },
  play: async ({ canvasElement }) => {
    const link = canvasElement.querySelector("a");
    if (link instanceof HTMLElement) {
      link.focus();
    }
  },
};

export const LongLabels: Story = {
  args: {
    label: "Agendar conversa no WhatsApp",
    topLabel: "Disponível para projetos",
    bottomLabel: "Retorno em horário comercial",
  },
};
