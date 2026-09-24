export type CognitiveViewMode = "neural" | "pipeline" | "memory";

export type CognitiveLayerId =
	| "input"
	| "context"
	| "retrieval"
	| "reasoning"
	| "output";

export type CognitivePoint = Readonly<{
	x: number;
	y: number;
}>;

export type CognitiveNode = Readonly<{
	id: string;
	label: string;
	shortLabel: string;
	layer: CognitiveLayerId;
	description: string;
	signal: string;
	positions: Readonly<Record<CognitiveViewMode, CognitivePoint>>;
}>;

export type CognitiveEdge = Readonly<{
	from: string;
	to: string;
	weight: "primary" | "secondary";
}>;

export const COGNITIVE_LAYER_META: Readonly<
	Record<
		CognitiveLayerId,
		Readonly<{ label: string; shortLabel: string; color: string }>
	>
> = {
	input: {
		label: "Sinais de entrada",
		shortLabel: "INPUT",
		color: "#7dd3fc",
	},
	context: {
		label: "Contexto aumentado",
		shortLabel: "CAG",
		color: "#c084fc",
	},
	retrieval: {
		label: "Recuperação aumentada",
		shortLabel: "RAG",
		color: "#2dd4bf",
	},
	reasoning: {
		label: "Raciocínio",
		shortLabel: "MODEL",
		color: "#f472b6",
	},
	output: {
		label: "Aplicações",
		shortLabel: "OUTPUT",
		color: "#fbbf24",
	},
};

// Public allowlist only. Raw operational databases are intentionally never
// imported by the portfolio bundle.
export const COGNITIVE_NODES: readonly CognitiveNode[] = [
	{
		id: "intent",
		label: "Intenção",
		shortLabel: "INTENT",
		layer: "input",
		description:
			"Objetivo declarado que inicia a composição de contexto e define o resultado esperado.",
		signal: "consulta",
		positions: {
			neural: { x: 100, y: 148 },
			pipeline: { x: 92, y: 112 },
			memory: { x: 184, y: 94 },
		},
	},
	{
		id: "documents",
		label: "Documentos",
		shortLabel: "DOCS",
		layer: "input",
		description:
			"Fontes textuais autorizadas, organizadas para extração e associação semântica.",
		signal: "fonte",
		positions: {
			neural: { x: 82, y: 278 },
			pipeline: { x: 92, y: 232 },
			memory: { x: 98, y: 220 },
		},
	},
	{
		id: "code",
		label: "Código",
		shortLabel: "CODE",
		layer: "input",
		description:
			"Estruturas, contratos e implementações que acrescentam evidência técnica ao contexto.",
		signal: "estrutura",
		positions: {
			neural: { x: 112, y: 406 },
			pipeline: { x: 92, y: 352 },
			memory: { x: 132, y: 372 },
		},
	},
	{
		id: "preferences",
		label: "Preferências",
		shortLabel: "PREFS",
		layer: "input",
		description:
			"Restrições de linguagem, apresentação e escopo aplicadas antes da síntese.",
		signal: "restrição",
		positions: {
			neural: { x: 218, y: 486 },
			pipeline: { x: 92, y: 472 },
			memory: { x: 248, y: 478 },
		},
	},
	{
		id: "context-cache",
		label: "Context Cache",
		shortLabel: "CACHE",
		layer: "context",
		description:
			"Camada CAG que mantém contexto estável já preparado para reduzir reconstruções desnecessárias.",
		signal: "persistência",
		positions: {
			neural: { x: 306, y: 108 },
			pipeline: { x: 292, y: 142 },
			memory: { x: 356, y: 92 },
		},
	},
	{
		id: "curated-memory",
		label: "Memória curada",
		shortLabel: "MEMORY",
		layer: "context",
		description:
			"Conhecimento resumido, revisado e mantido como contexto de longa duração.",
		signal: "contexto",
		positions: {
			neural: { x: 274, y: 274 },
			pipeline: { x: 292, y: 282 },
			memory: { x: 500, y: 64 },
		},
	},
	{
		id: "context-policy",
		label: "Política de contexto",
		shortLabel: "POLICY",
		layer: "context",
		description:
			"Decide o que pode entrar no contexto público e o que deve permanecer fora da visualização.",
		signal: "governança",
		positions: {
			neural: { x: 318, y: 442 },
			pipeline: { x: 292, y: 422 },
			memory: { x: 644, y: 92 },
		},
	},
	{
		id: "cognitive-core",
		label: "Núcleo CAG + RAG",
		shortLabel: "CORE",
		layer: "retrieval",
		description:
			"Ponto de convergência entre contexto pré-carregado e recuperação orientada pela consulta.",
		signal: "fusão",
		positions: {
			neural: { x: 500, y: 280 },
			pipeline: { x: 500, y: 282 },
			memory: { x: 500, y: 280 },
		},
	},
	{
		id: "hybrid-search",
		label: "Busca híbrida",
		shortLabel: "SEARCH",
		layer: "retrieval",
		description:
			"Combina sinais semânticos e estruturados para localizar material relevante.",
		signal: "recuperação",
		positions: {
			neural: { x: 612, y: 108 },
			pipeline: { x: 500, y: 112 },
			memory: { x: 766, y: 170 },
		},
	},
	{
		id: "context-ranking",
		label: "Ranking contextual",
		shortLabel: "RANK",
		layer: "retrieval",
		description:
			"Ordena fragmentos pela relação com o objetivo, recência e força da evidência.",
		signal: "prioridade",
		positions: {
			neural: { x: 676, y: 276 },
			pipeline: { x: 500, y: 432 },
			memory: { x: 838, y: 302 },
		},
	},
	{
		id: "evidence",
		label: "Evidências",
		shortLabel: "EVIDENCE",
		layer: "retrieval",
		description:
			"Trechos e relações selecionados para sustentar a resposta e permitir verificação.",
		signal: "prova",
		positions: {
			neural: { x: 624, y: 446 },
			pipeline: { x: 500, y: 482 },
			memory: { x: 774, y: 430 },
		},
	},
	{
		id: "routing",
		label: "Roteamento",
		shortLabel: "ROUTE",
		layer: "reasoning",
		description:
			"Seleciona a estratégia adequada para transformar o contexto em uma solução verificável.",
		signal: "decisão",
		positions: {
			neural: { x: 792, y: 128 },
			pipeline: { x: 704, y: 142 },
			memory: { x: 650, y: 468 },
		},
	},
	{
		id: "synthesis",
		label: "Síntese",
		shortLabel: "SYNTH",
		layer: "reasoning",
		description:
			"Integra contexto, evidências e objetivo em uma estrutura coerente de saída.",
		signal: "composição",
		positions: {
			neural: { x: 814, y: 280 },
			pipeline: { x: 704, y: 282 },
			memory: { x: 500, y: 508 },
		},
	},
	{
		id: "validation",
		label: "Validação",
		shortLabel: "VERIFY",
		layer: "reasoning",
		description:
			"Compara resultado, requisitos e evidências antes de liberar uma resposta.",
		signal: "controle",
		positions: {
			neural: { x: 790, y: 432 },
			pipeline: { x: 704, y: 422 },
			memory: { x: 350, y: 468 },
		},
	},
	{
		id: "software",
		label: "Software",
		shortLabel: "BUILD",
		layer: "output",
		description:
			"Implementações, testes e artefatos construídos a partir do contexto validado.",
		signal: "entrega",
		positions: {
			neural: { x: 930, y: 92 },
			pipeline: { x: 908, y: 112 },
			memory: { x: 232, y: 420 },
		},
	},
	{
		id: "research",
		label: "Pesquisa",
		shortLabel: "RESEARCH",
		layer: "output",
		description:
			"Análises sustentadas por fontes e distinção clara entre evidência e inferência.",
		signal: "análise",
		positions: {
			neural: { x: 946, y: 216 },
			pipeline: { x: 908, y: 232 },
			memory: { x: 136, y: 302 },
		},
	},
	{
		id: "design",
		label: "Design",
		shortLabel: "DESIGN",
		layer: "output",
		description:
			"Sistemas visuais e experiências que convertem intenção técnica em leitura humana.",
		signal: "experiência",
		positions: {
			neural: { x: 946, y: 344 },
			pipeline: { x: 908, y: 352 },
			memory: { x: 162, y: 170 },
		},
	},
	{
		id: "automation",
		label: "Automação",
		shortLabel: "AUTO",
		layer: "output",
		description:
			"Fluxos repetíveis com critérios explícitos, observação e limites de execução.",
		signal: "processo",
		positions: {
			neural: { x: 924, y: 468 },
			pipeline: { x: 908, y: 472 },
			memory: { x: 266, y: 88 },
		},
	},
];

export const COGNITIVE_EDGES: readonly CognitiveEdge[] = [
	{ from: "intent", to: "context-cache", weight: "primary" },
	{ from: "intent", to: "hybrid-search", weight: "secondary" },
	{ from: "documents", to: "hybrid-search", weight: "primary" },
	{ from: "code", to: "hybrid-search", weight: "primary" },
	{ from: "preferences", to: "context-policy", weight: "primary" },
	{ from: "documents", to: "curated-memory", weight: "secondary" },
	{ from: "code", to: "curated-memory", weight: "secondary" },
	{ from: "context-cache", to: "cognitive-core", weight: "primary" },
	{ from: "curated-memory", to: "cognitive-core", weight: "primary" },
	{ from: "context-policy", to: "cognitive-core", weight: "primary" },
	{ from: "hybrid-search", to: "context-ranking", weight: "primary" },
	{ from: "context-ranking", to: "evidence", weight: "primary" },
	{ from: "hybrid-search", to: "cognitive-core", weight: "secondary" },
	{ from: "evidence", to: "cognitive-core", weight: "primary" },
	{ from: "cognitive-core", to: "routing", weight: "primary" },
	{ from: "cognitive-core", to: "synthesis", weight: "primary" },
	{ from: "routing", to: "synthesis", weight: "secondary" },
	{ from: "synthesis", to: "validation", weight: "primary" },
	{ from: "validation", to: "software", weight: "primary" },
	{ from: "validation", to: "research", weight: "primary" },
	{ from: "validation", to: "design", weight: "primary" },
	{ from: "validation", to: "automation", weight: "primary" },
	{ from: "software", to: "curated-memory", weight: "secondary" },
	{ from: "research", to: "curated-memory", weight: "secondary" },
	{ from: "design", to: "context-cache", weight: "secondary" },
];

export const COGNITIVE_VIEW_OPTIONS: readonly Readonly<{
	id: CognitiveViewMode;
	label: string;
	description: string;
}>[] = [
	{
		id: "neural",
		label: "Sinapses",
		description: "Rede de ativações e retornos entre contexto e decisão.",
	},
	{
		id: "pipeline",
		label: "Fluxo CAG/RAG",
		description: "Leitura em camadas, da entrada até a aplicação.",
	},
	{
		id: "memory",
		label: "Memória",
		description: "Órbitas de associação em torno do núcleo cognitivo.",
	},
];
