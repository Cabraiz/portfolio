import {
	useLayoutEffect,
	useMemo,
	useRef,
	type CSSProperties,
} from "react";
import { Container, Row } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n/i18n";
import "tippy.js/dist/tippy.css";

import "../../../../styles/styles.css";

import gsap from "gsap";

import heroCinemaBackground from "@/assets/Mateus/home/hero-cinema-v2.webp";
import heroCinemaVote2 from "@/assets/Mateus/home/hero-cinema-vote-2.webp";
import heroCinemaVote3 from "@/assets/Mateus/home/hero-cinema-vote-3.webp";
import heroCinemaVote4 from "@/assets/Mateus/home/hero-cinema-vote-4.webp";
import heroCinemaVote5 from "@/assets/Mateus/home/hero-cinema-vote-5.webp";
import heroCinemaVote6 from "@/assets/Mateus/home/hero-cinema-vote-6.webp";
import heroCinemaVote7 from "@/assets/Mateus/home/hero-cinema-vote-7.webp";
import HeroTextColumn from "../components/desktop/HeroTextColumn";
import { useHomeHeroLayout } from "../hooks/useHomeHeroLayout";
import { getWhatsAppGreeting } from "../utils/home.utils";
import { shouldDisableScrollFades } from "../../../../features/scroll/scrollMotionFlags";

function HomeDesktop() {
	const containerRef = useRef<HTMLDivElement>(null);
	const heroBackgrounds = useMemo(
		() => [
			heroCinemaBackground,
			heroCinemaVote2,
			heroCinemaVote3,
			heroCinemaVote4,
			heroCinemaVote5,
			heroCinemaVote6,
			heroCinemaVote7,
		],
		[],
	);
	const selectedHeroOption = useMemo(() => {
		const requestedOption = Number(
			new URLSearchParams(window.location.search).get("hero"),
		);

		return requestedOption >= 1 && requestedOption <= heroBackgrounds.length
			? requestedOption
			: 6;
	}, [heroBackgrounds.length]);
	const selectedHeroBackground = heroBackgrounds[selectedHeroOption - 1];

	const { t } = useTranslation();
	const { sectionStyle, isCompactDesktop } = useHomeHeroLayout();

	const currentLanguage = i18n.resolvedLanguage ?? i18n.language ?? "pt";

	const isPT = useMemo(() => {
		return currentLanguage === "pt" || currentLanguage.startsWith("pt");
	}, [currentLanguage]);

	const secondaryLabel = useMemo(() => {
		return t("buttons.downloadCV");
	}, [t, currentLanguage]);

	const whatsappTopLabel = useMemo(() => {
		return getWhatsAppGreeting();
	}, []);

	const backgroundImageStyle = useMemo<CSSProperties>(() => {
		return {
			position: "absolute",
			top: 0,
			left: 0,
			width: "100%",
			height: "100%",
			objectFit: "cover",
			objectPosition: isCompactDesktop ? "center top" : "center center",
			display: "block",
			zIndex: 0,
		};
	}, [isCompactDesktop]);

	const backgroundOverlayStyle = useMemo<CSSProperties>(() => {
		return {
			position: "absolute",
			inset: 0,
			zIndex: 0,
			pointerEvents: "none",
			background:
				"linear-gradient(90deg, rgba(3, 8, 14, 0.94) 0%, rgba(3, 8, 14, 0.78) 27%, rgba(3, 8, 14, 0.28) 48%, rgba(3, 8, 14, 0.06) 72%), linear-gradient(180deg, rgba(2, 5, 9, 0.12) 0%, rgba(2, 5, 9, 0.08) 58%, rgba(2, 5, 9, 0.42) 100%)",
		};
	}, []);

	const signatureStyle = useMemo<CSSProperties>(() => {
		return {
			position: "absolute",
			right: isCompactDesktop
				? "clamp(24px, 3vw, 38px)"
				: "clamp(42px, 4vw, 76px)",
			bottom: isCompactDesktop ? "104px" : "clamp(122px, 11vh, 142px)",
			zIndex: 2,
			display: "flex",
			flexDirection: "column",
			alignItems: "flex-start",
			gap: isCompactDesktop ? "1px" : "2px",
			color: "rgba(255, 255, 255, 0.84)",
			fontFamily: '"Arial Narrow", "Roboto Condensed", "Brutal", sans-serif',
			fontSize: isCompactDesktop ? "8.5px" : "10px",
			fontStretch: "condensed",
			fontWeight: 500,
			lineHeight: 1.42,
			letterSpacing: "0.24em",
			textAlign: "left",
			textTransform: "uppercase",
			textShadow: "0 2px 10px rgba(0, 0, 0, 0.72)",
			transform: "scaleX(0.78) scaleY(1.12)",
			transformOrigin: "right bottom",
			whiteSpace: "nowrap",
			pointerEvents: "none",
		};
	}, [isCompactDesktop]);

	const editorialPhraseStyle = useMemo<CSSProperties>(() => {
		return {
			position: "absolute",
			top: isCompactDesktop ? "88px" : "clamp(92px, 9vh, 112px)",
			right: isCompactDesktop
				? "clamp(24px, 3vw, 38px)"
				: "clamp(42px, 4vw, 76px)",
			zIndex: 2,
			display: "flex",
			flexDirection: "column",
			alignItems: "flex-start",
			color: "rgba(255, 255, 255, 0.72)",
			fontFamily: '"Arial Narrow", "Roboto Condensed", "Brutal", sans-serif',
			fontSize: isCompactDesktop ? "10.4px" : "11.7px",
			fontStretch: "condensed",
			fontWeight: 500,
			lineHeight: 1.42,
			letterSpacing: "0.36em",
			textAlign: "left",
			textTransform: "uppercase",
			textShadow: "0 2px 10px rgba(0, 0, 0, 0.72)",
			transform: "scaleX(0.8) scaleY(1.1)",
			transformOrigin: "right top",
			whiteSpace: "nowrap",
			pointerEvents: "none",
		};
	}, [isCompactDesktop]);

	const rootStyle = useMemo<CSSProperties>(() => {
		return {
			position: "relative",
			inlineSize: "100%",
			maxInlineSize: "100%",
			minInlineSize: 0,
			blockSize: "100%",
			minBlockSize: "100%",
			display: "flex",
			flexDirection: "column",
			overflowX: "hidden",
			overflowY: "hidden",
			boxSizing: "border-box",
		};
	}, []);

	const containerStyle = useMemo<CSSProperties>(() => {
		return {
			...sectionStyle,
			inlineSize: "100%",
			maxInlineSize: "100%",
			minInlineSize: 0,
			blockSize: "100%",
			minBlockSize: "100%",
			display: "flex",
			flexDirection: "column",
			flex: "1 1 auto",
			alignItems: "stretch",
			justifyContent: "center",
			overflowX: "hidden",
			overflowY: "hidden",
			boxSizing: "border-box",
			paddingLeft: 0,
			paddingRight: 0,
			margin: 0,
		};
	}, [sectionStyle]);

	const innerContainerStyle = useMemo<CSSProperties>(() => {
		return {
			inlineSize: "100%",
			maxInlineSize: "100%",
			minInlineSize: 0,
			margin: "0 auto",
			paddingInline: isCompactDesktop
				? "clamp(16px, 2.4vw, 24px)"
				: "clamp(26px, 3vw, 54px)",
			paddingBlock: isCompactDesktop ? "clamp(8px, 1.2vh, 14px)" : "clamp(10px, 1.6vh, 18px)",
			boxSizing: "border-box",
			position: "relative",
			zIndex: 1,
			display: "flex",
			flexDirection: "column",
			justifyContent: "center",
			overflow: "hidden",
		};
	}, [isCompactDesktop]);

	const contentRailStyle = useMemo<CSSProperties>(() => {
		return {
			width: isCompactDesktop
				? "clamp(430px, 43vw, 610px)"
				: "clamp(520px, 39vw, 720px)",
			maxWidth: "100%",
			minWidth: 0,
			display: "flex",
			alignItems: "center",
			boxSizing: "border-box",
		};
	}, [isCompactDesktop]);

	const rowStyle = useMemo<CSSProperties>(() => {
		const style: CSSProperties = {
			inlineSize: "100%",
			maxInlineSize: "100%",
			minInlineSize: 0,
			minBlockSize: isCompactDesktop ? "auto" : "clamp(560px, 68vh, 720px)",
			margin: 0,
			paddingTop: 0,
			paddingBottom: 0,
			display: "flex",
			flexWrap: "nowrap",
			flexDirection: "row",
			alignItems: "center",
			alignContent: "center",
			justifyContent: "flex-start",
			columnGap: isCompactDesktop ? "8px" : "clamp(8px, 0.8vw, 18px)",
			rowGap: 0,
			boxSizing: "border-box",
			overflow: "hidden",
		};

		(style as CSSProperties & Record<string, string>)["--bs-gutter-x"] = "0px";
		(style as CSSProperties & Record<string, string>)["--bs-gutter-y"] = "0px";

		return style;
	}, [isCompactDesktop]);

	useLayoutEffect(() => {
		const container = containerRef.current;

		if (!container) {
			return undefined;
		}

		const disableHeroIntro = shouldDisableScrollFades();

		if (disableHeroIntro) {
			gsap.set(container, {
				opacity: 1,
				y: 0,
				clearProps: "transform,opacity,willChange",
			});

			container.style.willChange = "auto";
			return undefined;
		}

		const ctx = gsap.context(() => {
			gsap.set(container, {
				opacity: 0,
				y: isCompactDesktop ? 12 : 16,
				willChange: "transform, opacity",
			});

			gsap.to(container, {
				opacity: 1,
				y: 0,
				duration: isCompactDesktop ? 0.42 : 0.52,
				ease: "power2.out",
				overwrite: "auto",
				onStart: () => {
					container.style.willChange = "transform, opacity";
				},
				onComplete: () => {
					gsap.set(container, {
						clearProps: "transform,opacity",
					});
					container.style.willChange = "auto";
				},
			});
		}, container);

		return () => {
			ctx.revert();
			container.style.willChange = "auto";
		};
	}, [isCompactDesktop]);

	return (
		<div
			ref={containerRef}
			style={rootStyle}
			data-mateus-hero-root="true"
			data-mateus-hero-mobile="false"
		>
			<img
				src={selectedHeroBackground}
				alt=""
				aria-hidden="true"
				data-hero-option={selectedHeroOption}
				loading="eager"
				decoding="async"
				fetchPriority="high"
				style={backgroundImageStyle}
			/>
			<div aria-hidden="true" style={backgroundOverlayStyle} />
			<div
				style={editorialPhraseStyle}
				aria-label="Histórias também são feitas de código"
			>
				<span>Histórias</span>
				<span>Também são</span>
				<span>Feitas de código.</span>
			</div>
			<div
				style={signatureStyle}
				aria-label="Mateus Cabral, Engenheiro de Software, Fundador"
			>
				<strong style={{ fontSize: "1.12em", fontWeight: 700 }}>
					Mateus Cabral
				</strong>
				<span>Engenheiro de Software</span>
				<span>Fundador</span>
			</div>

			<Container fluid className="px-0" style={containerStyle}>
				<div style={innerContainerStyle}>
					<Row className="custom-section-row g-0 mx-0" style={rowStyle}>
						<div style={contentRailStyle}>
							<HeroTextColumn
								isCompactDesktop={isCompactDesktop}
								isPT={isPT}
								whatsappTopLabel={whatsappTopLabel}
								secondaryLabel={secondaryLabel}
							/>
						</div>
					</Row>
				</div>
			</Container>
		</div>
	);
}

export default HomeDesktop;
