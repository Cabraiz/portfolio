export type PortfolioProjectId =
  | "erp-varejo"
  | "app-bank"
  | "app-barber"
  | "site-adv"
  | "site-cabeleireira";

export type PortfolioProject = Readonly<{
  id: PortfolioProjectId;
  name: string;
  year: string;
  imageSrc: string;
  imageAlt: string;
  logoSrc: string;
  logoAlt: string;
  projectLabel: string;
}>;

export type PortfolioSectionCopy = Readonly<{
  eyebrow: string;
  title: string;
  description: string;
}>;

export type PortfolioViewportVisualState =
  | "active"
  | "near"
  | "far"
  | "placeholder";

export type PortfolioActiveProjectState = Readonly<{
  activeIndex: number;
  activeProject: PortfolioProject;
  previousProject: PortfolioProject | null;
  nextProject: PortfolioProject | null;
}>;

export type PortfolioProjectSelection = Readonly<{
  projectId: PortfolioProjectId;
  index: number;
}>;

export type PortfolioProjectListItem = Readonly<{
  id: PortfolioProjectId;
  name: string;
  year: string;
}>;

export type PortfolioProjectLookup = ReadonlyMap<
  PortfolioProjectId,
  PortfolioProject
>;
