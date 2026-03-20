import { useCallback, type KeyboardEvent } from "react";

import styles from "./Portfolio.module.css";

import {
  defaultPortfolioProjectId,
  portfolioProjectListItems,
  portfolioProjects,
  portfolioSectionCopy,
} from "./portfolio.data";

import usePortfolioActiveItem from "./hooks/usePortfolioActiveItem";

import PortfolioHeader from "./components/PortfolioHeader";
import PortfolioTimelineRail from "./components/PortfolioTimelineRail";
import PortfolioViewport from "./components/PortfolioViewport";

export default function Portfolio() {
  const {
    activeProject,
    activeProjectId,
    previousProject,
    nextProject,
    hasPrevious,
    hasNext,
    setActiveProjectById,
    goToPrevious,
    goToNext,
  } = usePortfolioActiveItem({
    projects: portfolioProjects,
    defaultProjectId: defaultPortfolioProjectId,
  });

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (event.key === "ArrowLeft") {
        if (!hasPrevious) {
          return;
        }

        event.preventDefault();
        goToPrevious();
      }

      if (event.key === "ArrowRight") {
        if (!hasNext) {
          return;
        }

        event.preventDefault();
        goToNext();
      }
    },
    [goToNext, goToPrevious, hasNext, hasPrevious],
  );

  return (
    <section
      className={styles.portfolioRoot}
      aria-label="Portfólio"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      data-portfolio-root="true"
    >
      <div className={styles.portfolioSection}>
        <PortfolioHeader copy={portfolioSectionCopy} />

        <div className={styles.portfolioLayout}>
          <div className={styles.portfolioSidebarColumn}>
            <PortfolioTimelineRail
              projects={portfolioProjectListItems}
              activeProjectId={activeProjectId}
              onSelectProject={setActiveProjectById}
            />
          </div>

          <div className={styles.portfolioViewportColumn}>
            <PortfolioViewport
              activeProject={activeProject}
              previousProject={previousProject}
              nextProject={nextProject}
              hasPrevious={hasPrevious}
              hasNext={hasNext}
              onPrevious={goToPrevious}
              onNext={goToNext}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
