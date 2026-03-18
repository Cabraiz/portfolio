import type { JSX } from "react";

import ConversationCTA from "./components/ConversationCTA";
import PartnerLogosRow from "./components/PartnerLogosRow";
import {
  CONVERSATION_DEFAULT_TITLE_TAG,
  CONVERSATION_PRIMARY_CTA,
  CONVERSATION_SECONDARY_CTA,
  CONVERSATION_SECTION_COPY,
  CONVERSATION_SECTION_ID,
} from "./constants";
import type { ConversationSectionProps } from "./types";
import styles from "./ConversationSection.module.css";

function joinClasses(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export default function ConversationSection({
  id = CONVERSATION_SECTION_ID,
  className,
  copy = CONVERSATION_SECTION_COPY,
  primaryAction = CONVERSATION_PRIMARY_CTA,
  secondaryAction = CONVERSATION_SECONDARY_CTA,
  partners = [],
  compact = false,
  titleAs = CONVERSATION_DEFAULT_TITLE_TAG,
}: ConversationSectionProps) {
  const resolvedTitleId = `${id}-title`;
  const resolvedHighlights = copy.highlights ?? [];
  const hasPartners = partners.length > 0;
  const hasPrimaryAction = Boolean(primaryAction?.href);
  const hasSecondaryAction = Boolean(secondaryAction?.href);
  const hasCtaGroup = hasPrimaryAction || hasSecondaryAction;
  const ctaSize = compact ? "compact" : "default";

  const TitleTag = titleAs as keyof JSX.IntrinsicElements;

  const sectionClassName = joinClasses(
    styles.section,
    compact && styles.sectionCompact,
    className,
  );

  const contentCardClassName = joinClasses(
    styles.contentCard,
    compact && styles.contentCardCompact,
  );

  const copyBlockClassName = joinClasses(
    styles.copyBlock,
    compact && styles.copyBlockCompact,
  );

  const eyebrowClassName = joinClasses(
    styles.eyebrow,
    compact && styles.eyebrowCompact,
  );

  const titleClassName = joinClasses(
    styles.title,
    compact && styles.titleCompact,
  );

  const descriptionClassName = joinClasses(
    styles.description,
    compact && styles.descriptionCompact,
  );

  const highlightsClassName = joinClasses(
    styles.highlights,
    compact && styles.highlightsCompact,
  );

  const highlightItemClassName = joinClasses(
    styles.highlightItem,
    compact && styles.highlightItemCompact,
  );

  const ctaPanelClassName = joinClasses(
    styles.ctaPanel,
    compact && styles.ctaPanelCompact,
  );

  const ctaGroupClassName = joinClasses(
    styles.ctaGroup,
    compact && styles.ctaGroupCompact,
  );

  return (
    <section
      id={id}
      className={sectionClassName}
      aria-labelledby={resolvedTitleId}
      data-compact={compact ? "true" : "false"}
    >
      <div className={styles.shell}>
        {hasPartners ? (
          <div className={styles.partnersRail}>
            <PartnerLogosRow
              partners={partners}
              compact={compact}
              ariaLabel={copy.partnersAriaLabel}
            />
          </div>
        ) : null}

        <div className={contentCardClassName}>
          <div className={copyBlockClassName}>
            {copy.eyebrow ? (
              <span className={eyebrowClassName}>{copy.eyebrow}</span>
            ) : null}

            <TitleTag id={resolvedTitleId} className={titleClassName}>
              {copy.title}
            </TitleTag>

            {copy.description ? (
              <p className={descriptionClassName}>{copy.description}</p>
            ) : null}

            {resolvedHighlights.length > 0 ? (
              <ul className={highlightsClassName} aria-label="Diferenciais">
                {resolvedHighlights.map((highlight, index) => (
                  <li
                    key={`${index}-${highlight}`}
                    className={highlightItemClassName}
                  >
                    {highlight}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {hasCtaGroup ? (
            <div className={ctaPanelClassName}>
              <div
                className={ctaGroupClassName}
                aria-label={copy.ctaGroupAriaLabel}
              >
                {hasPrimaryAction ? (
                  <ConversationCTA
                    action={primaryAction}
                    caption="Disponível para novos projetos"
                    supportText={copy.supportText}
                    size={ctaSize}
                    fullWidth
                  />
                ) : null}

                {hasSecondaryAction ? (
                  <ConversationCTA
                    action={secondaryAction}
                    size={ctaSize}
                    fullWidth
                  />
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
