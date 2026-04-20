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

import "../../styles/styles.css";

import gsap from "gsap";

import HeroTextColumn from "../components/desktop/HeroTextColumn";
import HeroProfileColumnMobile from "../components/mobile/HeroProfileColumnMobile";
import { useHomeHeroLayout } from "../hooks/useHomeHeroLayout";
import { getWhatsAppGreeting } from "../utils/home.utils";
import { shouldDisableScrollFades } from "../../../../features/scroll/scrollMotionFlags";

import fotoMateus from "../../assets/Mateus/perfil.webp";
import iconLinkedin from "../../assets/Mateus/Icon/IconLinkedIn.png";
import iconMail from "../../assets/Mateus/Icon/IconGmail.png";
import iconInstagram from "../../assets/Mateus/Icon/IconInsta.png";

const MOBILE_HERO_BACKGROUND = `
  radial-gradient(circle at 18% 16%, rgba(255, 215, 0, 0.08), transparent 24%),
  radial-gradient(circle at 82% 18%, rgba(255, 255, 255, 0.05), transparent 20%),
  linear-gradient(180deg, #0b0b0b 0%, #131313 48%, #1a1a1a 100%)
`;

const MOBILE_HERO_BACKGROUND_COLOR = "#111111";

function MateusMobile() {
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

	const mobileSocialItems = useMemo(() => {
		return [
			{
				key: "linkedin",
				href: "https://www.linkedin.com/in/mateuscabrals/",
				icon: iconLinkedin,
				alt: "LinkedIn",
			},
			{
				key: "email",
				href: "mailto:mateuscabrals@gmail.com",
				icon: iconMail,
				alt: "Email",
				target: "_self" as const,
				rel: "noopener noreferrer",
			},
			{
				key: "instagram",
				href: "https://www.instagram.com/mtscrl/",
				icon: iconInstagram,
				alt: "Instagram",
			},
		] as const;
	}, []);

	const mobileSeniorLabel = useMemo(() => {
		return "Senior";
	}, []);

	const mobileRoleLabel = useMemo(() => {
		return isPT ? "Back-End e APIs" : "Back-End & APIs";
	}, [isPT]);

	const rootStyle = useMemo<CSSProperties>(() => {
		return {
			position: "relative",
			width: "100%",
			minWidth: 0,
			minHeight: "auto",
			height: "auto",
			display: "flex",
			flexDirection: "column",
			overflowX: "clip",
			overflowY: "visible",
			boxSizing: "border-box",
			background: MOBILE_HERO_BACKGROUND,
			backgroundColor: MOBILE_HERO_BACKGROUND_COLOR,
		};
	}, []);

	const containerStyle = useMemo<CSSProperties>(() => {
		return {
			...sectionStyle,
			width: "100%",
			minWidth: 0,
			minHeight: "auto",
			height: "auto",
			display: "flex",
			flexDirection: "column",
			flex: "1 1 auto",
			alignItems: "stretch",
			justifyContent:
				sectionStyle.justifyContent ??
				(isCompactDesktop ? "center" : "flex-start"),
			overflowX: "clip",
			overflowY: "visible",
			boxSizing: "border-box",
			minBlockSize: "auto",
			maxWidth: "100%",
			background: MOBILE_HERO_BACKGROUND,
			backgroundColor: MOBILE_HERO_BACKGROUND_COLOR,
			backgroundImage: MOBILE_HERO_BACKGROUND,
			backgroundRepeat: "no-repeat",
			backgroundSize: "cover",
			backgroundPosition: "center top",
		};
	}, [isCompactDesktop, sectionStyle]);

	const innerContainerStyle = useMemo<CSSProperties>(() => {
		return {
			width: "100%",
			maxWidth: "min(100%, 1600px)",
			margin: "0 auto",
			padding: 0,
			boxSizing: "border-box",
			position: "relative",
			zIndex: 1,
		};
	}, []);

	const rowStyle = useMemo<CSSProperties>(() => {
		return {
			width: "100%",
			minWidth: 0,
			flex: "0 0 auto",
			minHeight: 0,
			height: "auto",
			margin: 0,
			paddingTop: 0,
			paddingBottom: 0,
			display: "flex",
			flexWrap: "wrap",
			flexDirection: "column-reverse",
			alignItems: "stretch",
			alignContent: "stretch",
			justifyContent: "flex-start",
			rowGap: "clamp(12px, 4vw, 18px)",
			boxSizing: "border-box",
		};
	}, []);

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
				y: 12,
				willChange: "transform, opacity",
			});

			gsap.to(container, {
				opacity: 1,
				y: 0,
				duration: 0.42,
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
	}, []);

	return (
		<div
			ref={containerRef}
			style={rootStyle}
			data-mateus-hero-root="true"
			data-mateus-hero-mobile="true"
		>
			<Container fluid style={containerStyle}>
				<div style={innerContainerStyle}>
					<Row className="custom-section-row" style={rowStyle}>
						<HeroTextColumn
							isCompactDesktop
							isPT={isPT}
							whatsappTopLabel={whatsappTopLabel}
							secondaryLabel={secondaryLabel}
						/>

						<HeroProfileColumnMobile
							imageSrc={fotoMateus}
							imageAlt="Mateus Cabral"
							socialItems={mobileSocialItems}
							seniorLabel={mobileSeniorLabel}
							roleLabel={mobileRoleLabel}
							imageLoaded={isImageLoaded}
							onImageLoad={() => setIsImageLoaded(true)}
						/>
					</Row>
				</div>
			</Container>
		</div>
	);
}

export default MateusMobile;
