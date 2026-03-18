import type { CSSProperties } from "react";

export type WhatsAppSignalDensity = "default" | "compact";

type CssVarRecord = Record<`--${string}`, string | number>;

type SignalSizeTokens = Readonly<{
  width: string;
  height: string;
  radius: string;
  paddingX: string;

  drawerWidth: string;
  drawerHeight: string;
  drawerRadius: string;

  cornerSize: string;
  cornerOffset: string;
  cornerOffsetHover: string;

  paddingTop: string;
  paddingBottom: string;
  paddingInline: string;

  heroLift: string;
}>;

type HeroSlotTokens = Readonly<{
  bleedTop: string;
  bleedBottom: string;
  gap: string;
  alignTop: string;
}>;

type ZIndexTokens = Readonly<{
  heroSlotRoot: number;
  heroSlotPrimary: number;
  heroSlotSecondary: number;

  signalRoot: number;
  signalDrawers: number;
  signalButton: number;
  signalCorners: number;
}>;

type SignalThemeTokens = Readonly<{
  glow: string;
  border: string;
  buttonBackground: string;
  drawerBackground: string;
  drawerBackgroundBottom: string;
  labelColor: string;
  iconColor: string;
  drawerTextColor: string;
  cornerStroke: string;
}>;

export const WHATSAPP_SIGNAL_Z_INDEX: ZIndexTokens = Object.freeze({
  heroSlotRoot: 6,
  heroSlotPrimary: 4,
  heroSlotSecondary: 1,

  signalRoot: 3,
  signalDrawers: 2,
  signalButton: 4,
  signalCorners: 1,
});

export const WHATSAPP_SIGNAL_SIZES: Readonly<
  Record<WhatsAppSignalDensity, SignalSizeTokens>
> = Object.freeze({
  default: Object.freeze({
    width: "clamp(220px, 24vw, 320px)",
    height: "64px",
    radius: "18px",
    paddingX: "22px",

    drawerWidth: "clamp(132px, 14vw, 172px)",
    drawerHeight: "34px",
    drawerRadius: "12px",

    cornerSize: "42px",
    cornerOffset: "16px",
    cornerOffsetHover: "28px",

    paddingTop: "calc(34px + 10px)",
    paddingBottom: "calc(34px + 10px)",
    paddingInline: "calc(28px + 10px)",

    heroLift: "0px",
  }),

  compact: Object.freeze({
    width: "clamp(210px, 23vw, 286px)",
    height: "58px",
    radius: "16px",
    paddingX: "18px",

    drawerWidth: "clamp(122px, 13vw, 156px)",
    drawerHeight: "30px",
    drawerRadius: "11px",

    cornerSize: "36px",
    cornerOffset: "12px",
    cornerOffsetHover: "20px",

    paddingTop: "calc(30px + 8px)",
    paddingBottom: "calc(30px + 8px)",
    paddingInline: "calc(20px + 8px)",

    heroLift: "-2px",
  }),
});

export const WHATSAPP_HERO_SLOT_TOKENS: Readonly<
  Record<WhatsAppSignalDensity, HeroSlotTokens>
> = Object.freeze({
  default: Object.freeze({
    bleedTop: "clamp(34px, 4.2vh, 50px)",
    bleedBottom: "clamp(38px, 4.8vh, 56px)",
    gap: "clamp(14px, 1.5vw, 22px)",
    alignTop: "clamp(20px, 2.9vh, 34px)",
  }),

  compact: Object.freeze({
    bleedTop: "clamp(28px, 3.5vh, 40px)",
    bleedBottom: "clamp(30px, 3.8vh, 44px)",
    gap: "clamp(12px, 1.1vw, 18px)",
    alignTop: "clamp(16px, 2.3vh, 24px)",
  }),
});

export const WHATSAPP_SIGNAL_ANIMATION = Object.freeze({
  hoverTranslateY: "-1px",
  activeTranslateY: "0px",
  transitionDuration: "180ms",
  transitionTiming: "cubic-bezier(0.22, 1, 0.36, 1)",
});

export const WHATSAPP_SIGNAL_THEME: SignalThemeTokens = Object.freeze({
  glow: "none",
  border: "transparent",
  buttonBackground:
    "linear-gradient(180deg, #46f17e 0%, #25d366 100%)",
  drawerBackground:
    "linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(240, 240, 240, 0.98))",
  drawerBackgroundBottom:
    "linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(232, 232, 232, 0.98))",
  labelColor: "#ffffff",
  iconColor: "#000000",
  drawerTextColor: "rgba(18, 18, 18, 0.92)",
  cornerStroke: "rgba(255, 255, 255, 0.42)",
});

function toCssProperties(vars: CssVarRecord): CSSProperties {
  return vars as CSSProperties;
}

export function getWhatsAppSignalCssVars(
  density: WhatsAppSignalDensity = "default"
): CSSProperties {
  const size = WHATSAPP_SIGNAL_SIZES[density];

  return toCssProperties({
    "--signal-width": size.width,
    "--signal-height": size.height,
    "--signal-radius": size.radius,
    "--signal-padding-x": size.paddingX,

    "--signal-drawer-width": size.drawerWidth,
    "--signal-drawer-height": size.drawerHeight,
    "--signal-drawer-radius": size.drawerRadius,

    "--signal-corner-size": size.cornerSize,
    "--signal-corner-offset": size.cornerOffset,
    "--signal-corner-offset-hover": size.cornerOffsetHover,

    "--signal-padding-top": size.paddingTop,
    "--signal-padding-bottom": size.paddingBottom,
    "--signal-padding-inline": size.paddingInline,

    "--signal-hero-lift": size.heroLift,

    "--signal-z-root": WHATSAPP_SIGNAL_Z_INDEX.signalRoot,
    "--signal-z-drawers": WHATSAPP_SIGNAL_Z_INDEX.signalDrawers,
    "--signal-z-button": WHATSAPP_SIGNAL_Z_INDEX.signalButton,
    "--signal-z-corners": WHATSAPP_SIGNAL_Z_INDEX.signalCorners,

    "--signal-hover-translate-y":
      WHATSAPP_SIGNAL_ANIMATION.hoverTranslateY,
    "--signal-active-translate-y":
      WHATSAPP_SIGNAL_ANIMATION.activeTranslateY,
    "--signal-transition-duration":
      WHATSAPP_SIGNAL_ANIMATION.transitionDuration,
    "--signal-transition-timing":
      WHATSAPP_SIGNAL_ANIMATION.transitionTiming,

    "--signal-glow": WHATSAPP_SIGNAL_THEME.glow,
    "--signal-border": WHATSAPP_SIGNAL_THEME.border,
    "--signal-button-background":
      WHATSAPP_SIGNAL_THEME.buttonBackground,
    "--signal-drawer-background":
      WHATSAPP_SIGNAL_THEME.drawerBackground,
    "--signal-drawer-background-bottom":
      WHATSAPP_SIGNAL_THEME.drawerBackgroundBottom,
    "--signal-label-color":
      WHATSAPP_SIGNAL_THEME.labelColor,
    "--signal-icon-color":
      WHATSAPP_SIGNAL_THEME.iconColor,
    "--signal-drawer-text-color":
      WHATSAPP_SIGNAL_THEME.drawerTextColor,
    "--signal-corner-stroke":
      WHATSAPP_SIGNAL_THEME.cornerStroke,
  });
}

export function getWhatsAppHeroSlotCssVars(
  density: WhatsAppSignalDensity = "default"
): CSSProperties {
  const slot = WHATSAPP_HERO_SLOT_TOKENS[density];

  return toCssProperties({
    "--hero-slot-bleed-top": slot.bleedTop,
    "--hero-slot-bleed-bottom": slot.bleedBottom,
    "--hero-slot-gap": slot.gap,
    "--hero-slot-align-top": slot.alignTop,

    "--hero-slot-z-root": WHATSAPP_SIGNAL_Z_INDEX.heroSlotRoot,
    "--hero-slot-z-primary": WHATSAPP_SIGNAL_Z_INDEX.heroSlotPrimary,
    "--hero-slot-z-secondary": WHATSAPP_SIGNAL_Z_INDEX.heroSlotSecondary,
  });
}

export function getWhatsAppCompositeCssVars(
  density: WhatsAppSignalDensity = "default"
): CSSProperties {
  return {
    ...getWhatsAppSignalCssVars(density),
    ...getWhatsAppHeroSlotCssVars(density),
  };
}
