// src/pages/Mateus/Technologies/data/technologies.trunfo.frontend-mobile.ts

import type { TechnologyTrunfoCategoryRegistry } from "./technologies.trunfo.registry";

export const TECHNOLOGIES_TRUNFO_FRONTEND_MOBILE = {
  react: {
    technologyId: "react",
    name: "React",
    imageSrc: null,
    imageAlt: "React",
    stats: [
      { id: "ecosystem", label: "Ecossistema", value: 10 },
      { id: "componentization", label: "Componentização", value: 10 },
      { id: "ux", label: "UX Moderna", value: 9 },
      { id: "performance", label: "Performance", value: 8 },
      { id: "maintainability", label: "Manutenibilidade", value: 9 },
    ],
  },

  typescript: {
    technologyId: "typescript",
    name: "TypeScript",
    imageSrc: null,
    imageAlt: "TypeScript",
    stats: [
      { id: "typing", label: "Tipagem", value: 10 },
      { id: "scalability", label: "Escalabilidade", value: 9 },
      { id: "refactor", label: "Refatoração", value: 10 },
      { id: "safety", label: "Segurança", value: 9 },
    ],
  },

  javascript: {
    technologyId: "javascript",
    name: "JavaScript",
    imageSrc: null,
    imageAlt: "JavaScript",
    stats: [
      { id: "flexibility", label: "Flexibilidade", value: 10 },
      { id: "browser", label: "Browser Native", value: 10 },
      { id: "ecosystem", label: "Ecossistema", value: 10 },
      { id: "maintainability", label: "Manutenibilidade", value: 7 },
    ],
  },

  nextjs: {
    technologyId: "nextjs",
    name: "Next.js",
    imageSrc: null,
    imageAlt: "Next.js",
    stats: [
      { id: "ssr", label: "SSR/SSG", value: 10 },
      { id: "seo", label: "SEO", value: 10 },
      { id: "routing", label: "Routing", value: 9 },
      { id: "delivery", label: "Delivery", value: 9 },
    ],
  },

  "react-native": {
    technologyId: "react-native",
    name: "React Native",
    imageSrc: null,
    imageAlt: "React Native",
    stats: [
      { id: "cross-platform", label: "Cross-platform", value: 9 },
      { id: "speed", label: "Velocidade", value: 8 },
      { id: "reuse", label: "Reuso", value: 9 },
    ],
  },

  flutter: {
    technologyId: "flutter",
    name: "Flutter",
    imageSrc: null,
    imageAlt: "Flutter",
    stats: [
      { id: "ui-control", label: "Controle UI", value: 9 },
      { id: "cross-platform", label: "Cross-platform", value: 9 },
      { id: "performance", label: "Performance", value: 8 },
    ],
  },
} as const satisfies TechnologyTrunfoCategoryRegistry;
