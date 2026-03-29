import { memo } from "react";

import PortfolioProjectCard from "./PortfolioProjectCard";

import type { PortfolioProject } from "../types";
import styles from "../ui/stage/PortfolioViewport.module.css";

type PortfolioStageProps = Readonly<{
  project: PortfolioProject;
  className?: string;
  onPrevious?: () => void;
  onNext?: () => void;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
}>;

function joinClasses(
  ...classes: Array<string | undefined | null | false>
): string {
  return classes.filter(Boolean).join(" ");
}

function PortfolioStageComponent({
  project,
  className,
  onPrevious,
  onNext,
  onHoverStart,
  onHoverEnd,
}: PortfolioStageProps) {
  return (
    <section
      className={joinClasses(styles.portfolioViewportStage, className)}
      data-portfolio-stage="true"
      data-project-id={project.id}
      aria-label={`Projeto em destaque: ${project.name}`}
    >
      <div
        className={styles.portfolioViewportStageFrame}
        data-portfolio-stage-frame="true"
      >
        <PortfolioProjectCard
          key={project.id}
          project={project}
          className={styles.portfolioViewportActiveCard}
          onPrevious={onPrevious}
          onNext={onNext}
          onHoverStart={onHoverStart}
          onHoverEnd={onHoverEnd}
        />
      </div>
    </section>
  );
}

const PortfolioStage = memo(PortfolioStageComponent);

PortfolioStage.displayName = "PortfolioStage";

export default PortfolioStage;
