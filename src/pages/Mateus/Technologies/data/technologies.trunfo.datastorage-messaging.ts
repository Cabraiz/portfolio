// src/pages/Mateus/Technologies/data/technologies.trunfo.datastorage-messaging.ts

import type { TechnologyTrunfoCategoryRegistry } from "./technologies.trunfo.registry";

export const TECHNOLOGIES_TRUNFO_DATASTORAGE_MESSAGING = {
  postgresql: {
    technologyId: "postgresql",
    name: "PostgreSQL",
    imageSrc: null,
    imageAlt: "PostgreSQL",
    stats: [
      { id: "sql", label: "SQL Power", value: 10 },
      { id: "consistency", label: "Consistência", value: 10 },
      { id: "features", label: "Recursos", value: 10 },
      { id: "scalability", label: "Escalabilidade", value: 8 },
      { id: "reliability", label: "Confiabilidade", value: 10 },
    ],
  },

  mysql: {
    technologyId: "mysql",
    name: "MySQL",
    imageSrc: null,
    imageAlt: "MySQL",
    stats: [
      { id: "simplicity", label: "Simplicidade", value: 9 },
      { id: "compatibility", label: "Compatibilidade", value: 9 },
      { id: "stability", label: "Estabilidade", value: 9 },
      { id: "ops", label: "Operação", value: 8 },
    ],
  },

  redis: {
    technologyId: "redis",
    name: "Redis",
    imageSrc: null,
    imageAlt: "Redis",
    stats: [
      { id: "latency", label: "Baixa Latência", value: 10 },
      { id: "cache", label: "Cache", value: 10 },
      { id: "pubsub", label: "Pub/Sub", value: 8 },
      { id: "simplicity", label: "Simplicidade", value: 9 },
    ],
  },

  mongodb: {
    technologyId: "mongodb",
    name: "MongoDB",
    imageSrc: null,
    imageAlt: "MongoDB",
    stats: [
      { id: "schema", label: "Schema Flexível", value: 10 },
      { id: "document", label: "Modelo Documento", value: 10 },
      { id: "speed", label: "Velocidade", value: 8 },
      { id: "scale", label: "Escala Horizontal", value: 9 },
    ],
  },

  kafka: {
    technologyId: "kafka",
    name: "Kafka",
    imageSrc: null,
    imageAlt: "Kafka",
    stats: [
      { id: "stream", label: "Streaming", value: 10 },
      { id: "throughput", label: "Throughput", value: 10 },
      { id: "durability", label: "Durabilidade", value: 9 },
      { id: "integration", label: "Integração", value: 9 },
      { id: "complexity", label: "Complexidade", value: 7 },
    ],
  },

  rabbitmq: {
    technologyId: "rabbitmq",
    name: "RabbitMQ",
    imageSrc: null,
    imageAlt: "RabbitMQ",
    stats: [
      { id: "queues", label: "Filas", value: 10 },
      { id: "routing", label: "Routing", value: 9 },
      { id: "retries", label: "Retries", value: 9 },
      { id: "simplicity", label: "Simplicidade", value: 8 },
    ],
  },

  elasticsearch: {
    technologyId: "elasticsearch",
    name: "Elasticsearch",
    imageSrc: null,
    imageAlt: "Elasticsearch",
    stats: [
      { id: "search", label: "Busca", value: 10 },
      { id: "indexing", label: "Indexação", value: 10 },
      { id: "analytics", label: "Analytics", value: 9 },
      { id: "ops", label: "Operação", value: 7 },
    ],
  },
} as const satisfies TechnologyTrunfoCategoryRegistry;
