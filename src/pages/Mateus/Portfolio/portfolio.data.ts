import imagem1 from "../../../assets/Mateus/portfolio/imagem1.webp";
import imagem2 from "../../../assets/Mateus/portfolio/imagem2.webp";
import imagem3 from "../../../assets/Mateus/portfolio/imagem3.webp";
import imagem4 from "../../../assets/Mateus/portfolio/imagem4.webp";
import imagem5 from "../../../assets/Mateus/portfolio/imagem5.webp";

import logo1 from "../../../assets/Mateus/portfolio/logos/logo1.webp";
import logo2 from "../../../assets/Mateus/portfolio/logos/logo2.webp";
import logo3 from "../../../assets/Mateus/portfolio/logos/logo3.webp";
import logo4 from "../../../assets/Mateus/portfolio/logos/logo4.webp";
import logo5 from "../../../assets/Mateus/portfolio/logos/logo5.webp";

import type {
  PortfolioProject,
  PortfolioProjectId,
  PortfolioProjectListItem,
  PortfolioProjectLookup,
  PortfolioSectionCopy,
} from "./types";

export const portfolioSectionCopy: PortfolioSectionCopy = {
  eyebrow: "Projetos selecionados",
  title: "Portfólio",
  description:
    "Alguns trabalhos com foco em produto, interface e execução visual. A seção foi simplificada para priorizar fluidez, legibilidade e uma rolagem mais estável no desktop.",
};

export const portfolioProjects: ReadonlyArray<PortfolioProject> = [
  {
    id: "erp-varejo",
    name: "ERP VAREJO",
    year: "2021",
    imageSrc: imagem1,
    imageAlt: "Preview do projeto ERP VAREJO",
    logoSrc: logo1,
    logoAlt: "Logo do projeto ERP VAREJO",
    projectLabel: "Projeto",
  },
  {
    id: "app-bank",
    name: "APP BANK",
    year: "2022",
    imageSrc: imagem2,
    imageAlt: "Preview do projeto APP BANK",
    logoSrc: logo2,
    logoAlt: "Logo do projeto APP BANK",
    projectLabel: "Projeto",
  },
  {
    id: "app-barber",
    name: "APP BARBER",
    year: "2023",
    imageSrc: imagem3,
    imageAlt: "Preview do projeto APP BARBER",
    logoSrc: logo3,
    logoAlt: "Logo do projeto APP BARBER",
    projectLabel: "Projeto",
  },
  {
    id: "site-adv",
    name: "SITE ADV",
    year: "2020",
    imageSrc: imagem4,
    imageAlt: "Preview do projeto SITE ADV",
    logoSrc: logo4,
    logoAlt: "Logo do projeto SITE ADV",
    projectLabel: "Projeto",
  },
  {
    id: "site-cabeleireira",
    name: "SITE CABELEIREIRA",
    year: "2021",
    imageSrc: imagem5,
    imageAlt: "Preview do projeto SITE CABELEIREIRA",
    logoSrc: logo5,
    logoAlt: "Logo do projeto SITE CABELEIREIRA",
    projectLabel: "Projeto",
  },
] as const;

export const defaultPortfolioProjectId: PortfolioProjectId =
  portfolioProjects[0].id;

export const portfolioProjectIds = portfolioProjects.map(
  (project) => project.id,
) as ReadonlyArray<PortfolioProjectId>;

export const portfolioProjectListItems: ReadonlyArray<PortfolioProjectListItem> =
  portfolioProjects.map((project) => ({
    id: project.id,
    name: project.name,
    year: project.year,
  }));

export const portfolioProjectLookup: PortfolioProjectLookup = new Map(
  portfolioProjects.map((project) => [project.id, project]),
);

export function getPortfolioProjectById(
  projectId: PortfolioProjectId,
): PortfolioProject | undefined {
  return portfolioProjectLookup.get(projectId);
}

export function getPortfolioProjectIndex(projectId: PortfolioProjectId): number {
  return portfolioProjects.findIndex((project) => project.id === projectId);
}
