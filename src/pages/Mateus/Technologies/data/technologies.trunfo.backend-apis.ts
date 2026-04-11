// src/pages/Mateus/Technologies/data/technologies.trunfo.backend-apis.ts

import type { TechnologyTrunfoCategoryRegistry } from "./technologies.trunfo.registry";

export const TECHNOLOGIES_TRUNFO_BACKEND_APIS = {
  java: {
    technologyId: "java",
    name: "Java",
    imageSrc: null,
    imageAlt: "Java",
    stats: [
      { id: "robustness", label: "Robustez", value: 10 },
      { id: "typing", label: "Tipagem", value: 10 },
      { id: "concurrency", label: "Concorrência", value: 9 },
      { id: "enterprise", label: "Enterprise Ready", value: 10 },
      { id: "runtime", label: "Runtime", value: 8 },
    ],
  },

  "spring-boot": {
    technologyId: "spring-boot",
    name: "Spring Boot",
    imageSrc: null,
    imageAlt: "Spring Boot",
    stats: [
      { id: "api", label: "APIs REST", value: 10 },
      { id: "security", label: "Segurança", value: 9 },
      { id: "architecture", label: "Arquitetura", value: 10 },
      { id: "integration", label: "Integração", value: 9 },
      { id: "maturity", label: "Maturidade", value: 10 },
    ],
  },

  nodejs: {
    technologyId: "nodejs",
    name: "Node.js",
    imageSrc: null,
    imageAlt: "Node.js",
    stats: [
      { id: "throughput", label: "Throughput I/O", value: 10 },
      { id: "delivery", label: "Velocidade Entrega", value: 10 },
      { id: "api", label: "APIs", value: 9 },
      { id: "ecosystem", label: "Ecossistema", value: 10 },
    ],
  },

  nestjs: {
    technologyId: "nestjs",
    name: "NestJS",
    imageSrc: null,
    imageAlt: "NestJS",
    stats: [
      { id: "structure", label: "Estrutura", value: 10 },
      { id: "modules", label: "Modularidade", value: 9 },
      { id: "testing", label: "Testabilidade", value: 9 },
      { id: "api", label: "APIs", value: 9 },
    ],
  },

  fastify: {
    technologyId: "fastify",
    name: "Fastify",
    imageSrc: null,
    imageAlt: "Fastify",
    stats: [
      { id: "performance", label: "Performance", value: 10 },
      { id: "schema", label: "Schema-first", value: 8 },
      { id: "simplicity", label: "Simplicidade", value: 8 },
    ],
  },

  python: {
    technologyId: "python",
    name: "Python",
    imageSrc: null,
    imageAlt: "Python",
    stats: [
      { id: "productivity", label: "Produtividade", value: 10 },
      { id: "automation", label: "Automação", value: 10 },
      { id: "data", label: "Dados", value: 9 },
      { id: "api", label: "APIs", value: 8 },
    ],
  },

  fastapi: {
    technologyId: "fastapi",
    name: "FastAPI",
    imageSrc: null,
    imageAlt: "FastAPI",
    stats: [
      { id: "api", label: "APIs REST", value: 10 },
      { id: "typing", label: "Tipagem", value: 9 },
      { id: "docs", label: "Docs Automáticas", value: 10 },
      { id: "speed", label: "Velocidade", value: 9 },
    ],
  },
} as const satisfies TechnologyTrunfoCategoryRegistry;
