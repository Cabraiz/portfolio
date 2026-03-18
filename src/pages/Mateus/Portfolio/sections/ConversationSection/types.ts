export type ConversationCtaVariant = "primary" | "secondary";

export type ConversationCtaSize = "default" | "compact";

export type ConversationCtaIcon = "whatsapp" | "download" | "none";

export type ConversationHeadingTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

export type ConversationPartner = Readonly<{
  id: string;
  name: string;
  alt: string;
  logoSrc: string;
  href?: string;
  external?: boolean;
}>;

export type ConversationCTAAction = Readonly<{
  id: string;
  label: string;
  href: string;
  ariaLabel?: string;
  variant: ConversationCtaVariant;
  icon?: ConversationCtaIcon;
  external?: boolean;
  download?: boolean | string;
  target?: "_self" | "_blank";
  rel?: string;
}>;

export type ConversationSectionCopy = Readonly<{
  eyebrow: string;
  title: string;
  description: string;
  highlights: readonly string[];
  supportText?: string;
  ctaGroupAriaLabel?: string;
  partnersAriaLabel?: string;
}>;

export type ConversationCTAProps = Readonly<{
  action: ConversationCTAAction;
  className?: string;
  size?: ConversationCtaSize;
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
}>;

export type PartnerLogosRowProps = Readonly<{
  partners: readonly ConversationPartner[];
  className?: string;
  compact?: boolean;
  ariaLabel?: string;
}>;

export type ConversationSectionProps = Readonly<{
  id?: string;
  className?: string;
  copy?: ConversationSectionCopy;
  primaryAction?: ConversationCTAAction;
  secondaryAction?: ConversationCTAAction;
  partners?: readonly ConversationPartner[];
  compact?: boolean;
  titleAs?: ConversationHeadingTag;
}>;
