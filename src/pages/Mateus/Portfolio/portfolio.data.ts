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
  eyebrow: "",
  title: "Portfólio",
  description: "",
};

const defaultProjectMedia = {
  aspectRatio: "16 / 9",
  fit: "cover",
} as const;

export const portfolioProjects: ReadonlyArray<PortfolioProject> = [
  {
    id: "erp-varejo",
    name: "SISTEMA ERP VAREJO",
    year: "2021",
    imageSrc: imagem1,
    imageAlt: "Preview do projeto ERP VAREJO",
    logoSrc: logo1,
    logoAlt: "Logo do projeto ERP VAREJO",
    projectLabel: "Projeto",
    media: {
      ...defaultProjectMedia,
      position: "center top",
    },
  },
  {
    id: "app-bank",
    name: "APP BANCO",
    year: "2022",
    imageSrc: imagem2,
    imageAlt: "Preview do projeto APP BANCO",
    logoSrc: logo2,
    logoAlt: "Logo do projeto APP BANCO",
    projectLabel: "Projeto",
    media: {
      ...defaultProjectMedia,
      position: "50% 18%",
    },
  },
  {
    id: "app-barber",
    name: "APP BARBEARIA",
    year: "2023",
    imageSrc: imagem3,
    imageAlt: "Preview do projeto APP BARBEARIA",
    logoSrc: logo3,
    logoAlt: "Logo do projeto APP BARBEARIA",
    projectLabel: "Projeto",
    media: {
      ...defaultProjectMedia,
      position: "50% 20%",
    },
  },
  {
    id: "site-adv",
    name: "WEB SITE ADVOCACIA",
    year: "2020",
    imageSrc: imagem4,
    imageAlt: "Preview do projeto WEB SITE ADVOCACIA",
    logoSrc: logo4,
    logoAlt: "Logo do projeto WEB SITE ADVOCACIA",
    projectLabel: "Projeto",
    media: {
      ...defaultProjectMedia,
      position: "center top",
    },
  },
  {
    id: "site-cabeleireira",
    name: "WEB SITE STUDIO",
    year: "2021",
    imageSrc: imagem5,
    imageAlt: "Preview do projeto WEB SITE STUDIO",
    logoSrc: logo5,
    logoAlt: "Logo do projeto WEB SITE STUDIO",
    projectLabel: "Projeto",
    media: {
      ...defaultProjectMedia,
      position: "58% center",
    },
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

export function getPortfolioProjectIndex(
  projectId: PortfolioProjectId,
): number {
  return portfolioProjects.findIndex((project) => project.id === projectId);
}
