import type {
  ConversationPartner,
  PartnerLogosRowProps,
} from "../types";
import styles from "./PartnerLogosRow.module.css";

function joinClasses(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

function getPartnerInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return "LP";
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

function isExternalHref(href: string): boolean {
  return /^(https?:)?\/\//i.test(href) || href.startsWith("mailto:") || href.startsWith("tel:");
}

function resolveTarget(partner: ConversationPartner): "_self" | "_blank" {
  if (!partner.href) {
    return "_self";
  }

  if (typeof partner.external === "boolean") {
    return partner.external ? "_blank" : "_self";
  }

  return isExternalHref(partner.href) ? "_blank" : "_self";
}

function resolveRel(partner: ConversationPartner, target: "_self" | "_blank"): string | undefined {
  if (!partner.href) {
    return undefined;
  }

  return target === "_blank" ? "noreferrer noopener" : undefined;
}

function PartnerLogoChip({
  partner,
  compact = false,
}: Readonly<{
  partner: ConversationPartner;
  compact?: boolean;
}>) {
  const target = resolveTarget(partner);
  const rel = resolveRel(partner, target);

  const content = (
    <div
      className={joinClasses(
        styles.chipInner,
        compact && styles.chipInnerCompact,
      )}
    >
      <div
        className={joinClasses(
          styles.logoMark,
          compact && styles.logoMarkCompact,
        )}
        aria-hidden="true"
      >
        {partner.logoSrc ? (
          <img
            className={styles.logoImage}
            src={partner.logoSrc}
            alt=""
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span className={styles.logoFallback}>
            {getPartnerInitials(partner.name)}
          </span>
        )}
      </div>

      <span
        className={joinClasses(
          styles.name,
          compact && styles.nameCompact,
        )}
      >
        {partner.name}
      </span>
    </div>
  );

  if (partner.href) {
    return (
      <a
        className={joinClasses(styles.chip, compact && styles.chipCompact)}
        href={partner.href}
        target={target}
        rel={rel}
        aria-label={`Abrir página de ${partner.name}`}
      >
        {content}
      </a>
    );
  }

  return (
    <div
      className={joinClasses(styles.chip, compact && styles.chipCompact)}
      aria-label={partner.alt ?? partner.name}
    >
      {content}
    </div>
  );
}

export default function PartnerLogosRow({
  partners,
  className,
  compact = false,
  ariaLabel = "Parceiros e marcas atendidas",
}: PartnerLogosRowProps) {
  if (!partners.length) {
    return null;
  }

  return (
    <div
      className={joinClasses(
        styles.root,
        compact && styles.rootCompact,
        className,
      )}
      aria-label={ariaLabel}
    >
      <ul
        className={joinClasses(
          styles.track,
          compact && styles.trackCompact,
        )}
        role="list"
      >
        {partners.map((partner) => (
          <li key={partner.id} className={styles.item}>
            <PartnerLogoChip partner={partner} compact={compact} />
          </li>
        ))}
      </ul>
    </div>
  );
}
