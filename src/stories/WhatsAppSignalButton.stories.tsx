import type { CSSProperties } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import CTAButton from "../pages/Mateus/shared/CTAButton/CTAButton";
import WhatsAppHeroSlot from "../pages/Mateus/shared/WhatsAppSignalButton/WhatsAppHeroSlot";
import WhatsAppSignalButton from "../pages/Mateus/shared/WhatsAppSignalButton/WhatsAppSignalButton";

const WHATSAPP_HREF = "https://wa.me/5585999999999";

const meta = {
  title: "Mateus/WhatsAppSignalButton",
  component: WhatsAppSignalButton,
  parameters: {
    layout: "fullscreen",
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
          minHeight: "100vh",
          width: "100%",
          display: "grid",
          placeItems: "center",
          padding: "32px",
          background:
            "radial-gradient(circle at top, rgba(37, 211, 102, 0.08), transparent 30%), #070b11",
          boxSizing: "border-box",
        }}
      >
        <Story />
      </div>
    ),
  ],
  args: {
    href: WHATSAPP_HREF,
    label: "WhatsApp",
    topLabel: "Contato direto",
    bottomLabel: "Resposta rápida",
    fullWidth: false,
    compact: false,
    hero: false,
    disabled: false,
  },
} satisfies Meta<typeof WhatsAppSignalButton>;

export default meta;

type Story = StoryObj<typeof meta>;

const cardStyle: CSSProperties = {
  width: "min(100%, 1180px)",
  borderRadius: "28px",
  padding: "36px",
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.02))",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 20px 60px rgba(0,0,0,0.28)",
  boxSizing: "border-box",
};

const heroGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 5fr) minmax(320px, 4fr)",
  gap: "36px",
  alignItems: "start",
};

const compactHeroGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 5fr) minmax(280px, 4fr)",
  gap: "28px",
  alignItems: "start",
};

const titleStyle: CSSProperties = {
  fontSize: "4rem",
  fontWeight: 800,
  color: "#f1c40f",
  lineHeight: 1,
  margin: 0,
  marginBottom: "20px",
};

const roleStyle: CSSProperties = {
  height: "56px",
  borderRadius: "18px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#f1c40f",
  border: "1px solid rgba(241, 196, 15, 0.7)",
  background: "rgba(241, 196, 15, 0.06)",
  fontSize: "1.1rem",
  fontWeight: 800,
  marginBottom: "28px",
};

const logosBlockStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "16px",
  padding: "18px 22px",
  marginBottom: "26px",
  borderRadius: "22px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.06)",
  backdropFilter: "blur(10px)",
  position: "relative",
  zIndex: 1,
};

const simulatedProfileStyle: CSSProperties = {
  minHeight: "440px",
  borderRadius: "28px",
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 20px 60px rgba(0,0,0,0.24)",
};

const heroActionsWrapperStyle: CSSProperties = {
  position: "relative",
  zIndex: 6,
  width: "100%",
  overflow: "visible",
  isolation: "isolate",
};

function FakeLogo({ label }: Readonly<{ label: string }>) {
  return (
    <div
      style={{
        minWidth: 0,
        height: "54px",
        flex: 1,
        borderRadius: "14px",
        display: "grid",
        placeItems: "center",
        color: "rgba(255,255,255,0.82)",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.05)",
        fontSize: "0.9rem",
        fontWeight: 700,
        letterSpacing: "0.03em",
      }}
    >
      {label}
    </div>
  );
}

function SecondaryHeroAction({ compact = false }: Readonly<{ compact?: boolean }>) {
  return (
    <CTAButton
      label="CURRÍCULO"
      backLabel="CURRÍCULO"
      ariaLabel="Abrir currículo"
      href="/resume"
      target="_blank"
      rel="noopener noreferrer"
      variant="heroSecondary"
      size={compact ? "compact" : "default"}
      align="center"
      fullWidth
    />
  );
}

function HeroPreview({
  compact = false,
  withLogos = true,
  withHeroSlot = true,
}: Readonly<{
  compact?: boolean;
  withLogos?: boolean;
  withHeroSlot?: boolean;
}>) {
  const primaryAction = (
    <WhatsAppSignalButton
      href={WHATSAPP_HREF}
      label="WhatsApp"
      topLabel="Contato direto"
      bottomLabel="Resposta rápida"
      ariaLabel="Abrir conversa no WhatsApp"
      fullWidth
      compact={compact}
      hero={withHeroSlot}
    />
  );

  const secondaryAction = <SecondaryHeroAction compact={compact} />;

  return (
    <div style={cardStyle}>
      <div style={compact ? compactHeroGridStyle : heroGridStyle}>
        <div style={{ position: "relative", overflow: "visible" }}>
          <h1 style={titleStyle}>Senior</h1>

          <div style={roleStyle}>Front-End Specialist</div>

          {withLogos ? (
            <div style={logosBlockStyle}>
              <FakeLogo label="Bank of the Northeast" />
              <FakeLogo label="Unifor" />
              <FakeLogo label="SANA" />
              <FakeLogo label="SEDIH" />
            </div>
          ) : null}

          <div style={heroActionsWrapperStyle}>
            {withHeroSlot ? (
              <WhatsAppHeroSlot
                compact={compact}
                preserveDesktopOffset={!compact}
                primary={primaryAction}
                secondary={secondaryAction}
              />
            ) : (
              <div style={{ width: "min(100%, 420px)" }}>{primaryAction}</div>
            )}
          </div>
        </div>

        <div style={simulatedProfileStyle} />
      </div>
    </div>
  );
}

export const Default: Story = {
  render: (args) => <WhatsAppSignalButton {...args} />,
};

export const DesktopNormal: Story = {
  name: "Desktop normal",
  render: () => <HeroPreview compact={false} withLogos={false} withHeroSlot={false} />,
};

export const Compact720p: Story = {
  name: "Compact / 720p",
  render: () => (
    <div
      style={{
        width: "min(100%, 1180px)",
        minHeight: "720px",
        display: "grid",
        placeItems: "center",
      }}
    >
      <HeroPreview compact withLogos withHeroSlot />
    </div>
  ),
};

export const WithHeroSlot: Story = {
  name: "With hero slot",
  render: () => <HeroPreview compact={false} withLogos={false} withHeroSlot />,
};

export const WithLogosBlockAbove: Story = {
  name: "With container above (logos simulation)",
  render: () => <HeroPreview compact={false} withLogos withHeroSlot />,
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
    const action = canvasElement.querySelector("a, button");
    if (action instanceof HTMLElement) {
      action.focus();
    }
  },
};

export const LongLabels: Story = {
  args: {
    label: "Agendar conversa no WhatsApp",
    topLabel: "Disponível para projetos",
    bottomLabel: "Retorno em horário comercial",
  },
  render: (args) => (
    <div style={{ width: "min(100%, 420px)" }}>
      <WhatsAppSignalButton {...args} />
    </div>
  ),
};
