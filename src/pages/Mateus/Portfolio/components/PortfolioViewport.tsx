import { memo } from "react";

import PortfolioStage from "./PortfolioStage";

import type { PortfolioProject } from "../types";
import rootStyles from "../core/PortfolioRoot.module.css";
import stageStyles from "../ui/stage/PortfolioViewport.module.css";

type PortfolioViewportProps = Readonly<{
  activeProject: PortfolioProject;
  previousProject?: PortfolioProject | null;
  nextProject?: PortfolioProject | null;
  hasPrevious?: boolean;
  hasNext?: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
  className?: string;
}>;

function joinClasses(
  ...classes: Array<string | undefined | null | false>
): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Wrapper leve de compatibilidade.
 * O viewport antigo tinha:
 * - stage ativa
 * - sidebar de anterior/próximo
 * - placeholders ricos
 *
 * Agora ele fica só com:
 * - stage ativa
 * - navegação simples
 *
 * previousProject / nextProject permanecem nas props apenas para evitar
 * quebra imediata em call sites antigos, mas não são mais usados.
 */
function PortfolioViewportComponent({
  activeProject,
  previousProject,
  nextProject,
  hasPrevious = false,
  hasNext = false,
  onPrevious,
  onNext,
  onHoverStart,
  onHoverEnd,
  className,
}: PortfolioViewportProps) {
  void previousProject;
  void nextProject;

  const handlePrevious = hasPrevious ? onPrevious : undefined;
  const handleNext = hasNext ? onNext : undefined;

  return (
    <section
      className={joinClasses(
        rootStyles.portfolioStageColumn,
        stageStyles.portfolioViewport,
        className,
      )}
      data-portfolio-viewport="true"
      data-project-id={activeProject.id}
      aria-label="Projeto em destaque do portfólio"
    >
      <div className={stageStyles.portfolioViewportInner}>
        <PortfolioStage
          project={activeProject}
          className={stageStyles.portfolioViewportStageSlot}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onHoverStart={onHoverStart}
          onHoverEnd={onHoverEnd}
        />
      </div>
    </section>
  );
}

const PortfolioViewport = memo(PortfolioViewportComponent);

PortfolioViewport.displayName = "PortfolioViewport";

export default PortfolioViewport;
