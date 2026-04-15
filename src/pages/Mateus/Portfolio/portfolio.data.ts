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
  position: "center 10%",
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
    projectLabel: "Projeto em destaque",
    subtitle: "Ecossistema comercial",
    statusLabel: "SELECIONAR",
    counterLabel: "01",
    accent: "gold",
    tags: ["ERP", "Varejo", "Backoffice"],
    technologies: ["Java", "React", "PostgreSQL"],
    media: {
      ...defaultProjectMedia,
      position: "center 8%",
    },
    worldLocation: {
      country: "Brasil",
      city: "Fortaleza",
      region: "América do Sul",
      lat: -3.7319,
      lng: -38.5267,
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
    projectLabel: "Projeto em destaque",
    subtitle: "Experiência bancária mobile",
    statusLabel: "ATUAL",
    counterLabel: "02",
    accent: "amber",
    tags: ["Mobile", "Finance", "Dashboard"],
    technologies: ["React", "Node.js", "TypeScript"],
    media: {
      ...defaultProjectMedia,
      position: "50% 14%",
    },
    worldLocation: {
      country: "Canadá",
      city: "Winnipeg",
      region: "América do Norte",
      lat: 49.8951,
      lng: -97.1384,
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
    projectLabel: "Projeto em destaque",
    subtitle: "Agenda e recorrência",
    statusLabel: "SELECIONAR",
    counterLabel: "03",
    accent: "orange",
    tags: ["Booking", "UX", "Serviços"],
    technologies: ["React", "Node.js", "MongoDB"],
    media: {
      ...defaultProjectMedia,
      position: "50% 12%",
    },
    worldLocation: {
      country: "Brasil",
      city: "São Paulo",
      region: "América do Sul",
      lat: -23.5505,
      lng: -46.6333,
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
    projectLabel: "Projeto em destaque",
    subtitle: "Presença institucional",
    statusLabel: "SELECIONAR",
    counterLabel: "04",
    accent: "platinum",
    tags: ["Institucional", "Branding", "Landing"],
    technologies: ["React", "TypeScript", "CSS Modules"],
    media: {
      ...defaultProjectMedia,
      position: "50% 8%",
    },
    worldLocation: {
      country: "Brasil",
      city: "Brasília",
      region: "América do Sul",
      lat: -15.7939,
      lng: -47.8828,
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
    projectLabel: "Projeto em destaque",
    subtitle: "Marca e captação local",
    statusLabel: "SELECIONAR",
    counterLabel: "05",
    accent: "neutral",
    tags: ["Studio", "Serviços", "Conversão"],
    technologies: ["React", "JavaScript", "UI Design"],
    media: {
      ...defaultProjectMedia,
      position: "58% 14%",
    },
    worldLocation: {
      country: "Brasil",
      city: "Rio de Janeiro",
      region: "América do Sul",
      lat: -22.9068,
      lng: -43.1729,
    },
  },
] as const;

export const defaultPortfolioProjectId: PortfolioProjectId =
  portfolioProjects[0].id;

export const portfolioProjectIds = portfolioProjects.map(
  (project) => project.id
) as ReadonlyArray<PortfolioProjectId>;

export const portfolioProjectListItems: ReadonlyArray<PortfolioProjectListItem> =
  portfolioProjects.map((project) => ({
    id: project.id,
    name: project.name,
    year: project.year,
    subtitle: project.subtitle,
    statusLabel: project.statusLabel,
    accent: project.accent,
    counterLabel: project.counterLabel,
    railLogoSrc: project.logoSrc,
    railLogoAlt: project.logoAlt,
  }));

export const portfolioProjectLookup: PortfolioProjectLookup = new Map(
  portfolioProjects.map((project) => [project.id, project])
);

export function getPortfolioProjectById(
  projectId: PortfolioProjectId
): PortfolioProject | undefined {
  return portfolioProjectLookup.get(projectId);
}

export function getPortfolioProjectIndex(
  projectId: PortfolioProjectId
): number {
  return portfolioProjects.findIndex((project) => project.id === projectId);
}
