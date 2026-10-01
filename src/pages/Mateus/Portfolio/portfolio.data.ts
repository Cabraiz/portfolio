import imagemNexovare from "../../../assets/Mateus/portfolio/nexovare-dashboard-preview-v3.png";
import imagem2 from "../../../assets/Mateus/portfolio/innomof-banking-app-premium-v2.webp";
import imagemGuineBissauCommerce from "../../../assets/Mateus/portfolio/bideiras-marketplace-preview-v1.webp";
import imagem3 from "../../../assets/Mateus/portfolio/imagem3-barbearia-v3.webp";
import imagemCentralClube from "../../../assets/Mateus/portfolio/entre-paginas-home-preview-v2.webp";
import imagem4 from "../../../assets/Mateus/portfolio/imagem4-wagner-v2.webp";
import imagem5 from "../../../assets/Mateus/portfolio/imagem5-fran-v2.webp";
import mobileNexovare from "../../../assets/Mateus/portfolio/mobile-summary/nexovare-mobile-summary-v1.webp";
import mobileBank from "../../../assets/Mateus/portfolio/mobile-summary/app-banco-mobile-summary-v1.webp";
import mobileBideiras from "../../../assets/Mateus/portfolio/mobile-summary/bideiras-mobile-summary-v1.webp";
import mobileBarber from "../../../assets/Mateus/portfolio/mobile-summary/app-barbearia-mobile-summary-v1.webp";
import mobileEntrePaginas from "../../../assets/Mateus/portfolio/mobile-summary/entre-paginas-mobile-summary-v2.webp";
import mobileWalter from "../../../assets/Mateus/portfolio/mobile-summary/walter-adv-mobile-summary-v1.webp";
import mobileFran from "../../../assets/Mateus/portfolio/mobile-summary/fran-studio-mobile-summary-v1.webp";

import logoNexovare from "../../../assets/Mateus/portfolio/logos/refined/nexovare-nx-mark-v2.png";
import logo2 from "../../../assets/Mateus/portfolio/logos/logo2.webp";
import logoGuineBissauCommerce from "../../../assets/Mateus/portfolio/logos/refined/bideiras-market-bag-icon-v1.png";
import logo3 from "../../../assets/Mateus/portfolio/logos/refined/pessoa-barbearia-lockup-v3.png";
import logoCentralClube from "../../../assets/Mateus/portfolio/logos/refined/entre-paginas-mark-v3.png";
import logo4 from "../../../assets/Mateus/portfolio/logos/refined/wagner-advocacia-lockup-v3.png";
import logo5 from "../../../assets/Mateus/portfolio/logos/refined/fran-site-lockup-v4.png";

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
    name: "NEXOVARE",
    year: "2021",
    imageSrc: imagemNexovare,
    mobileImageSrc: mobileNexovare,
    imageAlt: "Preview do painel de gestão Nexovare",
    logoSrc: logoNexovare,
    logoAlt: "Monograma NX do ecossistema Nexovare",
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
      city: "Guararapes",
      region: "São Paulo",
      lat: -21.260833,
      lng: -50.642778,
    },
  },
  {
    id: "app-bank",
    name: "APP BANCO",
    year: "2022",
    imageSrc: imagem2,
    mobileImageSrc: mobileBank,
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
      country: "México",
      city: "Puerto Vallarta",
      region: "Jalisco · Pacífico",
      lat: 20.6534,
      lng: -105.2253,
    },
  },
  {
    id: "guine-bissau-commerce",
    name: "BIDEIRAS",
    year: "2024",
    imageSrc: imagemGuineBissauCommerce,
    mobileImageSrc: mobileBideiras,
    imageAlt: "Preview do marketplace Bideiras em Guiné-Bissau",
    logoSrc: logoGuineBissauCommerce,
    logoAlt: "Ícone da Bideiras em forma de sacola nas cores da Guiné-Bissau",
    projectLabel: "Projeto em destaque",
    subtitle: "Comércio digital internacional",
    statusLabel: "SELECIONAR",
    counterLabel: "03",
    accent: "coral",
    tags: ["E-commerce", "Catálogo", "Checkout"],
    technologies: ["React", "Node.js", "PostgreSQL"],
    media: {
      ...defaultProjectMedia,
      position: "center center",
    },
    worldLocation: {
      country: "Guiné-Bissau",
      city: "Bissau",
      region: "África Ocidental",
      lat: 11.8636,
      lng: -15.5977,
    },
  },
  {
    id: "app-barber",
    name: "APP BARBEARIA",
    year: "2023",
    imageSrc: imagem3,
    mobileImageSrc: mobileBarber,
    imageAlt: "Preview do projeto APP BARBEARIA",
    logoSrc: logo3,
    logoAlt: "Logo do projeto APP BARBEARIA",
    projectLabel: "Projeto em destaque",
    subtitle: "Agenda e recorrência",
    statusLabel: "SELECIONAR",
    counterLabel: "04",
    accent: "orange",
    tags: ["Booking", "UX", "Serviços"],
    technologies: ["React", "Node.js", "MongoDB"],
    media: {
      ...defaultProjectMedia,
      position: "50% 12%",
    },
    worldLocation: {
      country: "Estados Unidos",
      city: "Salt Lake City",
      region: "Utah",
      lat: 40.7608,
      lng: -111.891,
    },
  },
  {
    id: "central-clube-livro",
    name: "Entre Paginas",
    year: "2026",
    imageSrc: imagemCentralClube,
    mobileImageSrc: mobileEntrePaginas,
    imageAlt: "Página inicial do projeto Entre Paginas",
    logoSrc: logoCentralClube,
    logoAlt: "Logo Entre Paginas",
    projectLabel: "Projeto em destaque",
    subtitle: "Comunidade editorial",
    statusLabel: "SELECIONAR",
    counterLabel: "05",
    accent: "burgundy",
    tags: ["Editorial", "Comunidade", "Leitura"],
    technologies: ["Next.js", "TypeScript", "GSAP"],
    media: {
      ...defaultProjectMedia,
      position: "center top",
    },
    worldLocation: {
      country: "Portugal",
      city: "Lisboa",
      region: "Europa",
      lat: 38.7223,
      lng: -9.1393,
    },
  },
  {
    id: "site-adv",
    name: "Walter Adv",
    year: "2020",
    imageSrc: imagem4,
    mobileImageSrc: mobileWalter,
    imageAlt: "Preview do projeto Walter Adv",
    logoSrc: logo4,
    logoAlt: "Logo do projeto Walter Adv",
    projectLabel: "Projeto em destaque",
    subtitle: "Presença institucional",
    statusLabel: "SELECIONAR",
    counterLabel: "06",
    accent: "platinum",
    tags: ["Institucional", "Branding", "Landing"],
    technologies: ["React", "TypeScript", "CSS Modules"],
    media: {
      ...defaultProjectMedia,
      position: "50% 8%",
    },
    worldLocation: {
      country: "Brasil",
      city: "São Paulo",
      region: "São Paulo",
      lat: -23.5505,
      lng: -46.6333,
    },
  },
  {
    id: "site-cabeleireira",
    name: "Fran Studio",
    year: "2021",
    imageSrc: imagem5,
    mobileImageSrc: mobileFran,
    imageAlt: "Preview do projeto Fran Studio",
    logoSrc: logo5,
    logoAlt: "Logo do projeto Fran Studio",
    projectLabel: "Projeto em destaque",
    subtitle: "Marca e captação local",
    statusLabel: "SELECIONAR",
    counterLabel: "07",
    accent: "neutral",
    tags: ["Studio", "Serviços", "Conversão"],
    technologies: ["React", "JavaScript", "UI Design"],
    media: {
      ...defaultProjectMedia,
      position: "58% 14%",
    },
    worldLocation: {
      country: "Brasil",
      city: "Fortaleza",
      region: "Ceará",
      lat: -3.7319,
      lng: -38.5267,
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
