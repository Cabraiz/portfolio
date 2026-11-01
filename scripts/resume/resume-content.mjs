// Conteúdo dos currículos em inglês, português e espanhol (os mesmos fatos). Edite aqui e rode
// `node scripts/resume/build-resumes.mjs` para gerar os PDFs.

const contact = {
	name: "Mateus Cardoso Cabral",
	email: "contact@cabraiz.com",
	phone: "+55 85 99857-5707",
	whatsapp: "https://wa.me/5585998575707",
	linkedin: "linkedin.com/in/cabraiz",
	github: "github.com/Cabraiz",
	site: "cabraiz.com",
};

const skills = [
	["AI", "LLMs, multi-agent systems, RAG, agent orchestration, AI coding harnesses"],
	["Cloud", "AWS (EC2, S3, RDS, IAM, SQS/SNS, Cognito) — 7 yrs · GCP (Compute Engine, Cloud SQL, Cloud Storage, Pub/Sub) — 6 yrs"],
	["Containers", "Docker and Kubernetes — 12 yrs"],
	["Frontend", "React (Next.js/TypeScript) — 10 yrs · Angular — 10 yrs · Vue.js (Nuxt.js/TypeScript)"],
	["Mobile", "Flutter — 6 yrs · React Native — 5 yrs"],
	["Backend", "Java (Spring Boot) — 12 yrs · Kotlin — 7 yrs · Node.js (Express) — 12 yrs · NestJS — 7 yrs · Python — 10 yrs · FastAPI — 7 yrs · GraphQL (Apollo Server) — 6 yrs"],
	["Data", "PostgreSQL (SQL) — 12 yrs · MongoDB — 12 yrs · Redis — 7 yrs"],
	["Messaging", "RabbitMQ — 8 yrs · Kafka — 8 yrs"],
	["Testing", "Selenium — 10 yrs · Cypress — 5 yrs · Playwright — 5 yrs"],
	["Observability", "Datadog — 6 yrs · Grafana — 5 yrs · Prometheus — 4 yrs"],
];

export const RESUMES = {
	en: {
		file: "mateus-cabral-resume-en.pdf",
		lang: "en",
		contact,
		title: "Senior AI Engineer · Full Stack",
		location: "Fortaleza, Brazil (UTC-3) · Remote",
		availability: "Open to full-time roles via EOR (Deel, Remote) or contract work (B2B)",
		headings: {
			summary: "Summary",
			experience: "Experience",
			education: "Education",
			skills: "Technical skills",
			languages: "Languages",
		},
		summary:
			"Senior AI Engineer and full stack developer with 13 years of experience across frontend, backend, cloud and DevOps, building critical systems, SaaS products and complex integrations. Designs and ships applied AI in production — LLMs, multi-agent systems, RAG and intelligent automation — with a focus on reliability, security and business impact. Experienced with micro-frontends, microservices, APIs and CI/CD, and with remote work for a Canadian company.",
		experience: [
			{
				period: "2025 — Present",
				company: "Qualicorp",
				place: "São Paulo, Brazil (remote)",
				role: "Senior Full Stack Software Engineer",
				bullets: [
					"Designed and built AI solutions with LLM/agent orchestration, RAG, an AI coding harness and Git worktrees, enabling 3–4 workstreams in parallel and up to 4x more weekly deliveries for the squad.",
					"Created and evolved 3+ AI/LLM initiatives and maintain over 60% of the production portfolio with React, TypeScript, Node.js, Java/Spring Boot and AWS, covering REST APIs, microservices, CI/CD, troubleshooting, incident management and critical fixes.",
				],
			},
			{
				period: "2021 — 2025",
				company: "SkipTheDishes",
				place: "Winnipeg, Canada (remote)",
				role: "Senior Software Developer",
				bullets: [
					"End-to-end development and deployment of backend services, REST APIs and integrations for a new React Native mobile module, plus critical features — cutting main-flow navigation time by 31%, initial load by 38% and abandonment on modernized screens by 11%.",
					"Migrated and modernized services with applied AI automation, reducing operational effort by 36%, speeding up technical modernization by 28% and improving the stability of production integrations.",
				],
			},
			{
				period: "2017 — 2021",
				company: "Banco do Nordeste (BNB)",
				place: "Fortaleza, Brazil",
				role: "Full Stack Developer",
				bullets: [
					"Modernized bank slip (boleto), credit card and bank transfer flows with React, Node.js and Java 11/Spring Boot, strengthening the stability of financial journeys and the reliability of critical services.",
					"Evolved a GraphQL BFF layer integrated with the legacy core banking system through an API gateway, using RabbitMQ, Redis and Docker/Kubernetes/OpenShift, improving integration, resilience and operational efficiency.",
					"New Technologies Lab: modernized interfaces with Angular and React on a legacy Java 8 + JSF (PrimeFaces) stack.",
				],
			},
			{
				period: "2015 — 2017",
				company: "Konvix Tecnologia",
				place: "São José do Rio Preto, Brazil",
				role: "Full Stack Developer",
				bullets: [
					"Modernized modules of a multi-company SaaS ERP with React, Java and Node.js, improving point-of-sale, inventory and tax flows, performance and operational consistency.",
					"Moved the backend to a stateless, multi-tenant architecture with JWT-authenticated REST APIs running on AWS (Docker, ECS/EKS, RDS/PostgreSQL, S3), improving scalability, deployments and queries.",
				],
			},
		],
		education: [
			["M.Sc. in Applied Informatics", "UNIFOR, Brazil", "2023 — 2025"],
			["B.Sc. in Computer Science", "UNIFOR, Brazil", "2015 — 2020"],
		],
		skills,
		languages: "Portuguese — native · English — B2 (written corporate communication and technical presentations)",
	},
	pt: {
		file: "mateus-cabral-resume.pdf",
		lang: "pt-BR",
		contact,
		title: "Senior AI Engineer · Full Stack",
		location: "Fortaleza (CE) · Remoto",
		availability: "Disponível para CLT ou PJ, em regime remoto",
		headings: {
			summary: "Resumo",
			experience: "Experiência profissional",
			education: "Formação",
			skills: "Competências técnicas",
			languages: "Idiomas",
		},
		summary:
			"Senior AI Engineer e desenvolvedor full stack com 13 anos de experiência em frontend, backend, cloud e DevOps, atuando em sistemas críticos, produtos SaaS e integrações complexas. Leva IA aplicada para produção — LLMs, sistemas multiagente, RAG e automação inteligente — com foco em confiabilidade, segurança e impacto de negócio. Experiência em micro-frontends, microsserviços, APIs e CI/CD, e em trabalho remoto para empresa canadense.",
		experience: [
			{
				period: "2025 — Atual",
				company: "Qualicorp",
				place: "São Paulo, SP (remoto)",
				role: "Senior Full Stack Software Engineer",
				bullets: [
					"Concepção e implementação de soluções de IA, com orquestração de agentes/LLMs, RAG, AI Coding Harness e Git Worktree, viabilizando 3–4 demandas em paralelo e aumento de até 4x nas entregas semanais na squad.",
					"Criação e evolução de 3+ iniciativas com IA/LLMs e sustentação de mais de 60% do portfólio em produção com React, TypeScript, Node.js, Java/Spring Boot e AWS, abrangendo APIs REST, microsserviços, CI/CD, troubleshooting, gestão de incidentes e correções críticas.",
				],
			},
			{
				period: "2021 — 2025",
				company: "SkipTheDishes",
				place: "Winnipeg, Canadá (remoto)",
				role: "Senior Software Developer",
				bullets: [
					"Desenvolvimento end-to-end e deploy de serviços backend, APIs REST e integrações para um novo módulo mobile com React Native, além da evolução de funcionalidades críticas, reduzindo em 31% o tempo de navegação do fluxo principal, 38% o carregamento inicial e 11% a taxa de abandono das telas modernizadas.",
					"Migração e modernização de serviços com automação de IA aplicada, reduzindo em 36% o esforço operacional, acelerando em 28% a modernização técnica e aumentando a estabilidade das integrações em produção.",
				],
			},
			{
				period: "2017 — 2021",
				company: "Banco do Nordeste (BNB)",
				place: "Fortaleza, CE",
				role: "Desenvolvedor Full Stack",
				bullets: [
					"Modernizei fluxos de boletos, cartões de crédito e transferências bancárias com React, Node.js e Java 11/Spring Boot, reforçando a estabilidade das jornadas financeiras e a confiabilidade dos serviços críticos.",
					"Evolução de uma camada BFF com GraphQL, integrada ao core bancário legado via API Gateway, com RabbitMQ, Redis e Docker/Kubernetes/OpenShift, ampliando a integração entre sistemas, a resiliência e a eficiência operacional.",
					"Laboratório de Novas Tecnologias: modernização de interfaces com Angular e React em ambiente legado Java 8 + JSF (PrimeFaces).",
				],
			},
			{
				period: "2015 — 2017",
				company: "Konvix Tecnologia",
				place: "São José do Rio Preto, SP",
				role: "Desenvolvedor Full Stack",
				bullets: [
					"Modernizei módulos do ERP SaaS multiempresa com React, Java e Node.js, aprimorando fluxos de PDV, estoque e fiscal, performance e consistência operacional.",
					"Evoluí o backend para arquitetura stateless e multi-tenant, com APIs REST autenticadas por JWT e operação em AWS (Docker, ECS/EKS, RDS/PostgreSQL, S3), melhorando escalabilidade, deploys e consultas.",
				],
			},
		],
		education: [
			["Mestrado em Informática Aplicada", "UNIFOR", "2023 — 2025"],
			["Bacharelado em Ciência da Computação", "UNIFOR", "2015 — 2020"],
		],
		skills: skills.map(([area, value]) => [
			{
				AI: "IA",
				Cloud: "Cloud",
				Containers: "Contêineres",
				Frontend: "Frontend",
				Mobile: "Mobile",
				Backend: "Backend",
				Data: "Dados",
				Messaging: "Mensageria",
				Testing: "Testes",
				Observability: "Observabilidade",
			}[area],
			value
				.replaceAll(" yrs", " anos")
				.replace(
					"LLMs, multi-agent systems, RAG, agent orchestration, AI coding harnesses",
					"LLMs, sistemas multiagente, RAG, orquestração de agentes, AI coding harness"
				)
				.replace("Docker and Kubernetes", "Docker e Kubernetes"),
		]),
		languages: "Português — nativo · Inglês — B2 (comunicação escrita em ambiente corporativo e apresentações técnicas)",
	},
	es: {
		file: "mateus-cabral-resume-es.pdf",
		lang: "es",
		contact,
		title: "Ingeniero de IA Senior · Full Stack",
		location: "Fortaleza, Brasil (UTC-3) · Remoto",
		availability: "Disponible para contrato internacional (Deel/EOR) o como contractor, con pagos en USD",
		headings: {
			summary: "Perfil",
			experience: "Experiencia",
			education: "Formación",
			skills: "Habilidades técnicas",
			languages: "Idiomas",
		},
		summary:
			"Ingeniero de IA Senior y desarrollador full stack con 13 años de experiencia en frontend, backend, cloud y DevOps, en sistemas críticos, productos SaaS e integraciones complejas. Diseña y lleva a producción IA aplicada — LLMs, sistemas multiagente, RAG y automatización inteligente — con foco en confiabilidad, seguridad e impacto en el negocio. Experiencia con micro-frontends, microservicios, APIs y CI/CD, y en trabajo remoto para una empresa canadiense.",
		experience: [
			{
				period: "2025 — Actual",
				company: "Qualicorp",
				place: "São Paulo, Brasil (remoto)",
				role: "Senior Full Stack Software Engineer",
				bullets: [
					"Diseño e implementación de soluciones de IA con orquestación de agentes/LLMs, RAG, AI Coding Harness y Git Worktree, lo que permitió 3–4 frentes en paralelo y hasta 4x más entregas semanales en el equipo.",
					"Creación y evolución de 3+ iniciativas con IA/LLMs y mantenimiento de más del 60% del portafolio en producción con React, TypeScript, Node.js, Java/Spring Boot y AWS, incluyendo APIs REST, microservicios, CI/CD, troubleshooting, gestión de incidentes y correcciones críticas.",
				],
			},
			{
				period: "2021 — 2025",
				company: "SkipTheDishes",
				place: "Winnipeg, Canadá (remoto)",
				role: "Senior Software Developer",
				bullets: [
					"Desarrollo end-to-end y despliegue de servicios backend, APIs REST e integraciones para un nuevo módulo móvil con React Native, además de funcionalidades críticas: −31% en el tiempo de navegación del flujo principal, −38% en la carga inicial y −11% en la tasa de abandono de las pantallas modernizadas.",
					"Migración y modernización de servicios con automatización basada en IA, reduciendo 36% el esfuerzo operativo, acelerando 28% la modernización técnica y aumentando la estabilidad de las integraciones en producción.",
				],
			},
			{
				period: "2017 — 2021",
				company: "Banco do Nordeste (BNB)",
				place: "Fortaleza, Brasil",
				role: "Desarrollador Full Stack",
				bullets: [
					"Modernicé los flujos de boletos bancarios, tarjetas de crédito y transferencias con React, Node.js y Java 11/Spring Boot, reforzando la estabilidad de los procesos financieros y la confiabilidad de los servicios críticos.",
					"Evolución de una capa BFF con GraphQL integrada al core bancario legado mediante un API Gateway, con RabbitMQ, Redis y Docker/Kubernetes/OpenShift, mejorando la integración entre sistemas, la resiliencia y la eficiencia operativa.",
					"Laboratorio de Nuevas Tecnologías: modernización de interfaces con Angular y React sobre un entorno legado Java 8 + JSF (PrimeFaces).",
				],
			},
			{
				period: "2015 — 2017",
				company: "Konvix Tecnologia",
				place: "São José do Rio Preto, Brasil",
				role: "Desarrollador Full Stack",
				bullets: [
					"Modernicé módulos de un ERP SaaS multiempresa con React, Java y Node.js, mejorando los flujos de punto de venta, inventario y fiscal, el rendimiento y la consistencia operativa.",
					"Evolución del backend a una arquitectura stateless y multi-tenant, con APIs REST autenticadas por JWT sobre AWS (Docker, ECS/EKS, RDS/PostgreSQL, S3), mejorando la escalabilidad, los despliegues y las consultas.",
				],
			},
		],
		education: [
			["Maestría en Informática Aplicada", "UNIFOR, Brasil", "2023 — 2025"],
			["Licenciatura en Ciencias de la Computación", "UNIFOR, Brasil", "2015 — 2020"],
		],
		skills: skills.map(([area, value]) => [
			{
				AI: "IA",
				Cloud: "Cloud",
				Containers: "Contenedores",
				Frontend: "Frontend",
				Mobile: "Móvil",
				Backend: "Backend",
				Data: "Datos",
				Messaging: "Mensajería",
				Testing: "Pruebas",
				Observability: "Observabilidad",
			}[area],
			value
				.replaceAll(" yrs", " años")
				.replace(
					"LLMs, multi-agent systems, RAG, agent orchestration, AI coding harnesses",
					"LLMs, sistemas multiagente, RAG, orquestación de agentes, AI coding harness"
				)
				.replace("Docker and Kubernetes", "Docker y Kubernetes"),
		]),
		languages: "Portugués — nativo · Inglés — B2 (comunicación escrita corporativa y presentaciones técnicas)",
	},
};
