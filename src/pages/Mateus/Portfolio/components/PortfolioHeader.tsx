import { memo } from "react";

import type { PortfolioSectionCopy } from "../types";
import styles from "../ui/shell/PortfolioHeader.module.css";

type PortfolioHeaderProps = Readonly<{
  copy: PortfolioSectionCopy;
  className?: string;
}>;

function joinClasses(
  ...classes: Array<string | undefined | null | false>
): string {
  return classes.filter(Boolean).join(" ");
}

function PortfolioHeaderComponent({
  copy,
  className,
}: PortfolioHeaderProps) {
  return (
    <header
      className={joinClasses(styles.portfolioHeader, className)}
      data-portfolio-header="true"
    >
      <div className={styles.portfolioHeaderInner}>
        {copy.eyebrow ? (
          <span className={styles.portfolioEyebrow}>{copy.eyebrow}</span>
        ) : null}

        <h2 className={styles.portfolioTitle}>{copy.title}</h2>

        {copy.description ? (
          <p className={styles.portfolioDescription}>{copy.description}</p>
        ) : null}
      </div>
    </header>
  );
}

const PortfolioHeader = memo(PortfolioHeaderComponent);

PortfolioHeader.displayName = "PortfolioHeader";

export default PortfolioHeader;
