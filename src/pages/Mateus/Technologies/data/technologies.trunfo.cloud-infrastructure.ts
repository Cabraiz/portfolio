// src/pages/Mateus/Technologies/data/technologies.trunfo.cloud-infrastructure.ts

import type { TechnologyTrunfoCategoryRegistry } from "./technologies.trunfo.registry";

export const TECHNOLOGIES_TRUNFO_CLOUD_INFRASTRUCTURE = {
  docker: {
    technologyId: "docker",
    name: "Docker",
    imageSrc: null,
    imageAlt: "Docker",
    stats: [
      { id: "portability", label: "Portabilidade", value: 10 },
      { id: "devex", label: "Dev Experience", value: 9 },
      { id: "runtime", label: "Runtime Prod.", value: 8 },
      { id: "delivery", label: "Velocidade Deploy", value: 9 },
      { id: "ops", label: "Operação", value: 8 },
    ],
  },

  kubernetes: {
    technologyId: "kubernetes",
    name: "Kubernetes",
    imageSrc: null,
    imageAlt: "Kubernetes",
    stats: [
      { id: "orchestration", label: "Orquestração", value: 10 },
      { id: "scaling", label: "Escalabilidade", value: 10 },
      { id: "resilience", label: "Resiliência", value: 9 },
      { id: "automation", label: "Automação", value: 9 },
      { id: "complexity", label: "Complexidade", value: 7 },
    ],
  },

  aws: {
    technologyId: "aws",
    name: "AWS",
    imageSrc: null,
    imageAlt: "AWS",
    stats: [
      { id: "coverage", label: "Cobertura Cloud", value: 10 },
      { id: "maturity", label: "Maturidade", value: 10 },
      { id: "scaling", label: "Escalabilidade", value: 9 },
      { id: "integration", label: "Integração", value: 9 },
      { id: "cost", label: "Custo/Controle", value: 7 },
    ],
  },

  gcp: {
    technologyId: "gcp",
    name: "GCP",
    imageSrc: null,
    imageAlt: "GCP",
    stats: [
      { id: "data", label: "Stack de Dados", value: 9 },
      { id: "containers", label: "Containers", value: 8 },
      { id: "ml", label: "ML/AI Ready", value: 9 },
      { id: "observability", label: "Observabilidade", value: 8 },
      { id: "simplicity", label: "Simplicidade", value: 8 },
    ],
  },

  terraform: {
    technologyId: "terraform",
    name: "Terraform",
    imageSrc: null,
    imageAlt: "Terraform",
    stats: [
      { id: "iac", label: "Infra as Code", value: 10 },
      { id: "reuse", label: "Reuso", value: 9 },
      { id: "versioning", label: "Versionamento", value: 9 },
      { id: "standard", label: "Padronização", value: 9 },
    ],
  },

  nginx: {
    technologyId: "nginx",
    name: "Nginx",
    imageSrc: null,
    imageAlt: "Nginx",
    stats: [
      { id: "reverse-proxy", label: "Reverse Proxy", value: 10 },
      { id: "performance", label: "Performance", value: 9 },
      { id: "routing", label: "Roteamento", value: 8 },
      { id: "stability", label: "Estabilidade", value: 9 },
    ],
  },
} as const satisfies TechnologyTrunfoCategoryRegistry;
