// src/pages/Mateus/Technologies/data/technologies.copy.ts

import type { TechnologySortMode } from "../domain/technologies.types";

export type TechnologiesSectionCopy = Readonly<{
  eyebrow: string;
  title: string;
  description: string;
  caption: string;
  spotlightTitle: string;
  spotlightDescription: string;
}>;

export type TechnologiesFilterCopy = Readonly<{
  searchPlaceholder: string;
  allCategoriesLabel: string;
  minimumYearsLabel: string;
  featuredOnlyLabel: string;
  clearFiltersLabel: string;
  sortLabel: string;
  sortOptions: Readonly<Record<TechnologySortMode, string>>;
}>;

export type TechnologiesMetricsCopy = Readonly<{
  totalVisibleLabel: string;
  totalYearsLabel: string;
  averageYearsLabel: string;
  seniorStacksLabel: string;
  helperVisible: string;
  helperYears: string;
  helperAverage: string;
  helperSenior: string;
}>;

export type TechnologiesEmptyStateCopy = Readonly<{
  title: string;
  description: string;
  actionLabel: string;
}>;

export type TechnologiesExperienceCopy = Readonly<{
  yearsSuffixSingular: string;
  yearsSuffixPlural: string;
  yearsUnknown: string;
  expertiseTitle: string;
  galleryTitle: string;
  relatedStacksTitle: string;
}>;

export const TECHNOLOGIES_SECTION_COPY: TechnologiesSectionCopy = {
  eyebrow: "Engineering Capabilities",
  title: "Stack técnica organizada como sistema visual, não como lista de currículo.",
  description:
    "Esta camada transforma qualificações em uma experiência premium de leitura: domínio por categoria, tempo de prática, stacks relacionadas e profundidade técnica suficiente para comunicar senioridade com clareza.",
  caption:
    "Arquitetura pensada para hex grid, spotlight lateral, filtros por domínio e futura galeria visual por tecnologia.",
  spotlightTitle: "Technology Spotlight",
  spotlightDescription:
    "Selecione uma stack para destacar senioridade, ecossistema relacionado e evidências visuais do domínio técnico.",
};

export const TECHNOLOGIES_FILTER_COPY: TechnologiesFilterCopy = {
  searchPlaceholder: "Buscar tecnologia, alias, framework ou domínio",
  allCategoriesLabel: "Todas as categorias",
  minimumYearsLabel: "Tempo mínimo",
  featuredOnlyLabel: "Somente destaques",
  clearFiltersLabel: "Limpar filtros",
  sortLabel: "Ordenar por",
  sortOptions: {
    featured: "Destaques",
    "years-desc": "Mais experiência",
    "years-asc": "Menos experiência",
    "name-asc": "A–Z",
  },
};

export const TECHNOLOGIES_METRICS_COPY: TechnologiesMetricsCopy = {
  totalVisibleLabel: "Tecnologias visíveis",
  totalYearsLabel: "Anos acumulados",
  averageYearsLabel: "Média por stack",
  seniorStacksLabel: "Stacks maduras",
  helperVisible: "total de stacks renderizadas na seção",
  helperYears: "somatório da experiência declarada",
  helperAverage: "média de anos por tecnologia",
  helperSenior: "stacks com trajetória sênior",
};

export const TECHNOLOGIES_EMPTY_STATE_COPY: TechnologiesEmptyStateCopy = {
  title: "Nenhuma tecnologia encontrada",
  description:
    "Os filtros atuais esconderam toda a matriz. Ajuste a categoria, a busca ou o tempo mínimo para voltar a visualizar as stacks.",
  actionLabel: "Resetar visualização",
};

export const TECHNOLOGIES_EXPERIENCE_COPY: TechnologiesExperienceCopy = {
  yearsSuffixSingular: "ano",
  yearsSuffixPlural: "anos",
  yearsUnknown: "tempo não informado",
  expertiseTitle: "Experiência",
  galleryTitle: "Galeria visual",
  relatedStacksTitle: "Ecossistema relacionado",
};
