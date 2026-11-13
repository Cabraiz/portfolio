// Dados do mapa, estilos de posição e tipos compartilhados do Portfolio.
import type {
	CSSProperties,
	PointerEvent as ReactPointerEvent,
	RefObject,
} from "react";

import flagHongKong from "../../../assets/Mateus/portfolio/flags/hong-kong-semicircle-realistic-v1.webp";
import flagBrazil from "../../../assets/Mateus/portfolio/flags/brasil-semicircle-realistic-v4.webp";
import flagUnitedStates from "../../../assets/Mateus/portfolio/flags/estados-unidos-semicircle-realistic-v3.webp";
import flagGuineaBissau from "../../../assets/Mateus/portfolio/flags/guine-bissau-semicircle-realistic-v3.webp";
import flagMexico from "../../../assets/Mateus/portfolio/flags/mexico-semicircle-realistic-v3.webp";
import flagPortugal from "../../../assets/Mateus/portfolio/flags/portugal-semicircle-realistic-v3.webp";

import type { PortfolioProjectId } from "./types";

const PORTFOLIO_AUTOPLAY_INTERVAL_MS = 6200;
const COUNTRY_FLAGS: Readonly<Record<string, string>> = {
	Brasil: flagBrazil,
	// O único projeto na China é em Hong Kong, que tem bandeira própria.
	"Hong Kong": flagHongKong,
	México: flagMexico,
	"Guiné-Bissau": flagGuineaBissau,
	"Estados Unidos": flagUnitedStates,
	Portugal: flagPortugal,
};

const PROJECT_DESCRIPTIONS: Record<PortfolioProjectId, string> = {
	"erp-varejo":
		"Gestão completa de cotações, produtos e fornecedores para operações comerciais com visão clara do negócio.",
	"app-bank":
		"Experiência bancária mobile desenhada para tornar consultas, movimentações e decisões financeiras mais simples.",
	"guine-bissau-commerce":
		"Loja virtual com catálogo, carrinho e checkout para conectar produtos locais a clientes em Guiné-Bissau.",
	"clockright":
		"Ponto eletrônico por reconhecimento facial em quiosque, com gestão de equipe e jornada, ausências e correções, em conformidade com a LGPD.",
	"central-clube-livro":
		"Experiência editorial para um clube de leitura, com narrativas imersivas, encontros e descoberta de livros.",
	"site-adv":
		"Aplicativo de leilão ao vivo de gemas e plantas ultrarraras, com lances em tempo real e a abertura da pedra na transmissão.",
	"site-cabeleireira":
		"Vitrine digital para serviços, identidade de marca e captação de clientes em uma experiência local acolhedora.",
};

const WORLD_MAP_POINTS: ReadonlyArray<
	Readonly<{
		id: PortfolioProjectId;
		x: number;
		y: number;
	}>
> = [
	{ id: "erp-varejo", x: 35.9326, y: 61.8116 },
	{ id: "site-cabeleireira", x: 39.2981, y: 52.0733 },
];

const FORTALEZA_MAP_POSITION = { x: 39.2981, y: 52.0733 } as const;
const BRAZIL_ROUTE_HUB = FORTALEZA_MAP_POSITION;
const WORLD_JOURNEY_ORIGIN = FORTALEZA_MAP_POSITION;
const WORLD_JOURNEY_DESTINATIONS: Partial<
	Record<PortfolioProjectId, Readonly<{ x: number; y: number }>>
> = {
	"app-bank": { x: 20.7708, y: 38.5259 },
	// Bissau, na costa oeste da Guiné-Bissau.
	"guine-bissau-commerce": { x: 45.6673, y: 43.4091 },
	// Ajuste visual do atlas ilustrado: Salt Lake fica ao sudeste do Great Salt Lake.
	"clockright": { x: 19.05, y: 25.15 },
	// Coimbra (Região Centro): projeção direta de 40,2033°N 8,4103°O. A costa
	// do atlas bate com a real (~0,1°), então não precisa de ajuste.
	"central-clube-livro": { x: 47.6638, y: 27.6648 },
	// Hong Kong: a costa do atlas é simplificada e a projeção direta cai na água; ajuste visual para a ponta de Kowloon.
	"site-adv": { x: 81.7, y: 37.47 },
};
const WORLD_ASPECT_RATIO = 2;

/** Onde o projeto fica no mapa (destino no exterior ou ponto no Brasil). */
function getProjectMapPosition(
	projectId: PortfolioProjectId
): Readonly<{ x: number; y: number }> {
	return (
		WORLD_JOURNEY_DESTINATIONS[projectId] ??
		WORLD_MAP_POINTS.find((point) => point.id === projectId) ??
		FORTALEZA_MAP_POSITION
	);
}

function isSameMapPosition(
	a: Readonly<{ x: number; y: number }>,
	b: Readonly<{ x: number; y: number }>
): boolean {
	return Math.abs(a.x - b.x) < 0.01 && Math.abs(a.y - b.y) < 0.01;
}

type LogoStyle = CSSProperties & { "--logo-aspect": number };

const toLogoStyle = (aspect: number): LogoStyle => ({ "--logo-aspect": aspect });

type MapPointStyle = CSSProperties & {
	"--point-x": string;
	"--point-y": string;
};

type RouteStyle = CSSProperties & {
	"--route-angle": string;
	"--route-length": string;
	"--route-x": string;
	"--route-y": string;
};

type GeographicPositionStyle = CSSProperties & {
	"--geo-x": string;
	"--geo-y": string;
};

type PortfolioRootStyle = CSSProperties & {
	"--mobile-map-zoom": string;
	"--mobile-detail-card-height": string;
	"--mobile-map-center-y": string;
	"--mobile-world-height": string;
};

function toGeographicPositionStyle(
	point: Readonly<{ x: number; y: number }>
): GeographicPositionStyle {
	return {
		"--geo-x": `${point.x}%`,
		"--geo-y": `${point.y}%`,
	};
}

function toRouteStyle(
	from: Readonly<{ x: number; y: number }>,
	to: Readonly<{ x: number; y: number }>
): RouteStyle {
	const deltaX = (to.x - from.x) / 100;
	const deltaY = (to.y - from.y) / 100;
	const normalizedVerticalDelta = deltaY / WORLD_ASPECT_RATIO;

	return {
		"--route-x": `${from.x}%`,
		"--route-y": `${from.y}%`,
		"--route-angle": `${Math.atan2(normalizedVerticalDelta, deltaX) * (180 / Math.PI)}deg`,
		"--route-length": `${Math.hypot(deltaX, normalizedVerticalDelta) * 100}%`,
	};
}

function formatCounter(index: number): string {
	return String(index + 1).padStart(2, "0");
}

type JourneyFlight = Readonly<{
	projectId: PortfolioProjectId;
	origin: Readonly<{ x: number; y: number }> | null;
	landed: boolean;
}>;

// Toque nos botões de projeto (seleciona só se o dedo não arrastou).
type ProjectPointerProps = Readonly<{
	selectProject: (index: number) => void;
	handleProjectPointerDown: (
		index: number,
		event: ReactPointerEvent<HTMLButtonElement>
	) => void;
	handleProjectPointerMove: (event: ReactPointerEvent<HTMLButtonElement>) => void;
	handleProjectPointerUp: (
		index: number,
		event: ReactPointerEvent<HTMLButtonElement>
	) => void;
	projectPointerStartRef: RefObject<{
		index: number;
		x: number;
		y: number;
	} | null>;
}>;

export type { JourneyFlight, MapPointStyle, PortfolioRootStyle, ProjectPointerProps };
export {
	PORTFOLIO_AUTOPLAY_INTERVAL_MS,
	COUNTRY_FLAGS,
	PROJECT_DESCRIPTIONS,
	WORLD_MAP_POINTS,
	BRAZIL_ROUTE_HUB,
	WORLD_JOURNEY_ORIGIN,
	WORLD_JOURNEY_DESTINATIONS,
	getProjectMapPosition,
	isSameMapPosition,
	toLogoStyle,
	toGeographicPositionStyle,
	toRouteStyle,
	formatCounter,
};
