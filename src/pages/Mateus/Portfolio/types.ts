export type PortfolioProjectId =
  | "erp-varejo"
  | "app-bank"
  | "app-barber"
  | "site-adv"
  | "site-cabeleireira";

export type PortfolioMediaFit = "cover" | "contain";

export type PortfolioMediaAnchorX =
  | "left"
  | "center"
  | "right"
  | `${number}%`
  | `${number}px`;

export type PortfolioMediaAnchorY =
  | "top"
  | "center"
  | "bottom"
  | `${number}%`
  | `${number}px`;

export type PortfolioMediaAspectRatio =
  | "16 / 9"
  | "4 / 3"
  | "3 / 2"
  | "1 / 1"
  | string;

export type PortfolioTechnologyName = string;

export type PortfolioProjectMedia = Readonly<{
  aspectRatio?: PortfolioMediaAspectRatio;
  fit?: PortfolioMediaFit;
  position?: string;
  focalPointX?: PortfolioMediaAnchorX;
  focalPointY?: PortfolioMediaAnchorY;
}>;

export type PortfolioProject = Readonly<{
  id: PortfolioProjectId;
  name: string;
  year: string;
  imageSrc: string;
  imageAlt: string;
  logoSrc: string;
  logoAlt: string;
  projectLabel: string;
  technologies: readonly PortfolioTechnologyName[];
  media?: PortfolioProjectMedia;
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

export type PortfolioTechnologyStat = Readonly<{
  name: PortfolioTechnologyName;
  projectCount: number;
  projectIds: readonly PortfolioProjectId[];
}>;

export type PortfolioProjectLookup = ReadonlyMap<
  PortfolioProjectId,
  PortfolioProject
>;

export type PortfolioTechnologyLookup = ReadonlyMap<
  PortfolioTechnologyName,
  PortfolioTechnologyStat
>;
