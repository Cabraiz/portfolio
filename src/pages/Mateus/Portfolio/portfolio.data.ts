import imagemNexovare from "../../../assets/Mateus/portfolio/nexovare-dashboard-preview-v3.webp";
import imagem2 from "../../../assets/Mateus/portfolio/innomof-banking-app-premium-v2.webp";
import imagemGuineBissauCommerce from "../../../assets/Mateus/portfolio/bideiras-marketplace-preview-v2.webp";
import imagemClockRight from "../../../assets/Mateus/portfolio/clockright-home-preview-v1.webp";
import imagemCentralClube from "../../../assets/Mateus/portfolio/entre-paginas-home-preview-v2.webp";
import imagem4 from "../../../assets/Mateus/portfolio/imagem4-gemarium-v1.webp";
import imagem5 from "../../../assets/Mateus/portfolio/imagem5-fran-v4.webp";
import mobileNexovare from "../../../assets/Mateus/portfolio/mobile-summary/nexovare-mobile-summary-v1.webp";
import mobileBank from "../../../assets/Mateus/portfolio/mobile-summary/app-banco-mobile-summary-v1.webp";
import mobileBideiras from "../../../assets/Mateus/portfolio/mobile-summary/bideiras-mobile-summary-v2.webp";
import mobileClockRight from "../../../assets/Mateus/portfolio/mobile-summary/clockright-mobile-summary-v2.webp";
import mobileEntrePaginas from "../../../assets/Mateus/portfolio/mobile-summary/entre-paginas-mobile-summary-v2.webp";
import mobileWalter from "../../../assets/Mateus/portfolio/mobile-summary/gemarium-mobile-summary-v1.webp";
import mobileFran from "../../../assets/Mateus/portfolio/mobile-summary/fran-studio-mobile-summary-v2.webp";

import logoNexovare from "../../../assets/Mateus/portfolio/logos/refined/nexovare-nx-mark-v2-trim.webp";
import logo2 from "../../../assets/Mateus/portfolio/logos/logo2-trim.webp";
import logoGuineBissauCommerce from "../../../assets/Mateus/portfolio/logos/refined/bideiras-turban-icon-v1-trim.webp";
import logoClockRight from "../../../assets/Mateus/portfolio/logos/refined/clockright-app-icon-v2-trim.webp";
import logoCentralClube from "../../../assets/Mateus/portfolio/logos/refined/entre-paginas-mark-v3-trim.webp";
import logo4 from "../../../assets/Mateus/portfolio/logos/refined/gemarium-emblema-v1.webp";
import logo5 from "../../../assets/Mateus/portfolio/logos/refined/fran-site-lockup-v4-trim.webp";

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
    id: "app-bank",
    name: "APP BANCO",
    year: "2022",
    imageSrc: imagem2,
    mobileImageSrc: mobileBank,
    imageAlt: "Preview do projeto APP BANCO",
    logoSrc: logo2,
    logoAspect: 1.024,
    logoAlt: "Logo do projeto APP BANCO",
    projectLabel: "Projeto em destaque",
    subtitle: "Experiência bancária mobile",
    statusLabel: "ATUAL",
    counterLabel: "01",
    accent: "amber",
    tags: ["Mobile", "Finance", "Dashboard"],
    technologies: ["Flutter", "Rust", "MongoDB"],
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
    year: "2021",
    imageSrc: imagemGuineBissauCommerce,
    mobileImageSrc: mobileBideiras,
    imageAlt: "Preview do marketplace Bideiras em Guiné-Bissau",
    logoSrc: logoGuineBissauCommerce,
    logoAspect: 0.675,
    logoAlt: "Ícone da Bideiras: mulher com turbante amarelo",
    siteUrl: "https://ecommerce.cabraiz.com/",
    projectLabel: "Projeto em destaque",
    subtitle: "Comércio digital internacional",
    statusLabel: "SELECIONAR",
    counterLabel: "02",
    accent: "coral",
    tags: ["E-commerce", "Catálogo", "Checkout"],
    technologies: ["React", ".NET", "MongoDB"],
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
    id: "clockright",
    name: "ClockRight",
    year: "2023",
    imageSrc: imagemClockRight,
    mobileImageSrc: mobileClockRight,
    imageAlt: "Tela inicial do ClockRight, ponto eletrônico por reconhecimento facial",
    logoSrc: logoClockRight,
    logoAspect: 1.0,
    logoAlt: "Ícone do ClockRight: relógio",
    siteUrl: "https://clockright.cabraiz.com/",
    projectLabel: "Projeto em destaque",
    subtitle: "Ponto por biometria facial",
    statusLabel: "SELECIONAR",
    counterLabel: "03",
    accent: "orange",
    tags: ["Ponto eletrônico", "Reconhecimento facial", "LGPD"],
    technologies: ["Angular", "Go", "Neo4j"],
    media: {
      ...defaultProjectMedia,
      position: "center 30%",
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
    year: "2021",
    imageSrc: imagemCentralClube,
    mobileImageSrc: mobileEntrePaginas,
    imageAlt: "Página inicial do projeto Entre Paginas",
    logoSrc: logoCentralClube,
    logoAspect: 1.902,
    logoAlt: "Logo Entre Paginas",
    siteUrl: "https://entrepaginas.cabraiz.com/",
    projectLabel: "Projeto em destaque",
    subtitle: "Comunidade editorial",
    statusLabel: "SELECIONAR",
    counterLabel: "04",
    accent: "burgundy",
    tags: ["Editorial", "Comunidade", "Leitura"],
    technologies: ["React", "Node.js", "Qdrant"],
    media: {
      ...defaultProjectMedia,
      position: "center top",
    },
    worldLocation: {
      country: "Portugal",
      city: "Coimbra",
      region: "Região Centro",
      lat: 40.2033,
      lng: -8.4103,
    },
  },
  {
    id: "site-adv",
    name: "Rag Everything",
    year: "2024",
    imageSrc: imagem4,
    mobileImageSrc: mobileWalter,
    imageAlt: "Preview do projeto Rag Everything",
    logoSrc: logo4,
    logoAspect: 1.208,
    logoAlt: "Logo do projeto Rag Everything",
    projectLabel: "Projeto em destaque",
    subtitle: "Leilão de gemas e plantas raras",
    statusLabel: "SELECIONAR",
    counterLabel: "05",
    accent: "platinum",
    tags: ["Leilão", "Gemas", "Plantas raras"],
    technologies: ["Flutter", "Go", "PostgreSQL"],
    media: {
      ...defaultProjectMedia,
      position: "50% 8%",
    },
    worldLocation: {
      country: "Hong Kong",
      city: "Hong Kong",
      lat: 22.3193,
      lng: 114.1694,
    },
  },
  {
    id: "erp-varejo",
    name: "NEXOVARE",
    year: "2020",
    imageSrc: imagemNexovare,
    mobileImageSrc: mobileNexovare,
    imageAlt: "Preview do painel de gestão Nexovare",
    logoSrc: logoNexovare,
    logoAspect: 1.443,
    logoAlt: "Monograma NX do ecossistema Nexovare",
    projectLabel: "Projeto em destaque",
    subtitle: "Ecossistema comercial",
    statusLabel: "SELECIONAR",
    counterLabel: "06",
    accent: "gold",
    tags: ["ERP", "Varejo", "Backoffice"],
    technologies: ["Angular", "Java", "Cassandra"],
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
    id: "site-cabeleireira",
    name: "Fran Studio",
    year: "2022",
    imageSrc: imagem5,
    mobileImageSrc: mobileFran,
    imageAlt: "Preview do projeto Fran Studio",
    logoSrc: logo5,
    logoAspect: 2.99,
    logoAlt: "Logo do projeto Fran Studio",
    siteUrl: "https://francyaraujo.com/",
    projectLabel: "Projeto em destaque",
    subtitle: "Marca e captação local",
    statusLabel: "SELECIONAR",
    counterLabel: "07",
    accent: "neutral",
    tags: ["Studio", "Serviços", "Conversão"],
    technologies: ["React", "Node.js", "Qdrant"],
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
