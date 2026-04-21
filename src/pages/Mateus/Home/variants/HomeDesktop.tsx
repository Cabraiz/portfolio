import {
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
	type CSSProperties,
} from "react";
import { Container, Row } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n/i18n";
import "tippy.js/dist/tippy.css";

import "../../../../styles/styles.css";

import gsap from "gsap";

import HeroTextColumn from "../components/desktop/HeroTextColumn";
import HeroProfileColumnDesktop from "../components/desktop/HeroProfileColumn";
import { useHomeHeroLayout } from "../hooks/useHomeHeroLayout";
import { getWhatsAppGreeting } from "../utils/home.utils";
import { shouldDisableScrollFades } from "../../../../features/scroll/scrollMotionFlags";

function HomeDesktop() {
	const containerRef = useRef<HTMLDivElement>(null);

	const { t } = useTranslation();
	const { sectionStyle, isCompactDesktop } = useHomeHeroLayout();

	const [isImageLoaded, setIsImageLoaded] = useState(false);

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
			justifyContent: "center",
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
			<Container fluid className="px-0" style={containerStyle}>
				<div style={innerContainerStyle}>
					<Row className="custom-section-row g-0 mx-0" style={rowStyle}>
						<HeroTextColumn
							isCompactDesktop={isCompactDesktop}
							isPT={isPT}
							whatsappTopLabel={whatsappTopLabel}
							secondaryLabel={secondaryLabel}
						/>

						<HeroProfileColumnDesktop
							isCompactDesktop={isCompactDesktop}
							isPT={isPT}
							isImageLoaded={isImageLoaded}
							onImageLoad={() => setIsImageLoaded(true)}
						/>
					</Row>
				</div>
			</Container>
		</div>
	);
}

export default HomeDesktop;
