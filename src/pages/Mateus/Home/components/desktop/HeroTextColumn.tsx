import { localizeLabel, useLabelLanguage } from '@/i18n/labels';
import { type CSSProperties, useMemo } from "react";
import { Col } from "react-bootstrap";

import RoleTitle from "../../../RoleTitle";
import CTAButton from "../../../shared/CTAButton/CTAButton";
import ResumeDownloadButton from "../../../shared/ResumeDownloadButton/ResumeDownloadButton";
import WhatsAppSignalButton from "../../../shared/WhatsAppSignalButton/WhatsAppSignalButton";
import WhatsAppHeroSlot from "../../../shared/WhatsAppSignalButton/WhatsAppHeroSlot";

import {
	BOOKING_URL,
	type ContactLanguage,
	getContactEmailHref,
	getWhatsAppHref,
	RESUME_HREFS,
	seals,
} from "../../data/home.data";

const polishedGoldGradient =
	"linear-gradient(105deg, #c58b22 0%, #f3cf66 15%, #fff3b7 28%, #d29a27 41%, #fff8d1 50%, #d29a27 59%, #fff3b7 72%, #f3cf66 85%, #c58b22 100%)";

type HeroTextColumnProps = Readonly<{
	isCompactDesktop: boolean;
	language: ContactLanguage;
	whatsappTopLabel: string;
	secondaryLabel: string;
}>;

const heroTextColumnBaseStyle: CSSProperties = {
	position: "relative",
	zIndex: 2,
	overflow: "visible",
	minWidth: 0,
	maxWidth: "100%",
	boxSizing: "border-box",
};

const heroActionsWrapperStyle: CSSProperties = {
	position: "relative",
	zIndex: 6,
	width: "100%",
	maxWidth: "100%",
	minWidth: 0,
	overflow: "visible",
	isolation: "isolate",
	boxSizing: "border-box",
};

export default function HeroTextColumn({
	isCompactDesktop,
	language,
	whatsappTopLabel,
	secondaryLabel,
}: HeroTextColumnProps) {
  useLabelLanguage();
	const seniorTitleStyle = useMemo<CSSProperties>(() => {
		return {
			fontSize: isCompactDesktop ? "2.31rem" : "3.08rem",
			fontWeight: 700,
			letterSpacing: "0.04em",
			color: "transparent",
			backgroundImage: polishedGoldGradient,
			backgroundSize: "100% 100%",
			backgroundRepeat: "no-repeat",
			backgroundClip: "text",
			WebkitBackgroundClip: "text",
			WebkitTextFillColor: "transparent",
			filter: "drop-shadow(0 2px 8px rgba(199, 139, 18, 0.24))",
			marginBottom: isCompactDesktop ? "18px" : "24px",
			lineHeight: 1,
			maxWidth: "100%",
			wordBreak: "break-word",
		};
	}, [isCompactDesktop]);

	const contentBlockWidth = useMemo(() => {
		if (isCompactDesktop) {
			return {
				width: "92%",
				maxWidth: "92%",
			};
		}

		return {
			width: "91%",
			maxWidth: "880px",
		};
	}, [isCompactDesktop]);

	const roleContainerStyle = useMemo<CSSProperties>(() => {
		return {
			...contentBlockWidth,
			minWidth: 0,
			marginBottom: isCompactDesktop ? "18px" : "24px",
			display: "flex",
			alignItems: "center",
			justifyContent: "flex-start",
			height: "auto",
			boxSizing: "border-box",
			overflow: "visible",
		};
	}, [contentBlockWidth, isCompactDesktop]);

	const sealsContainerStyle = useMemo<CSSProperties>(() => {
		return {
			...contentBlockWidth,
			minWidth: 0,
			display: "flex",
			justifyContent: "center",
			alignItems: "center",
			gap: isCompactDesktop ? "0.9rem" : "2rem",
			padding: isCompactDesktop ? "0.72rem 0.9rem" : "1.2rem 2rem",
			backgroundColor: "rgba(255, 255, 255, 0.035)",
			border: "1px solid rgba(255, 255, 255, 0.06)",
			borderRadius: isCompactDesktop ? "16px" : "20px",
			marginBottom: isCompactDesktop ? "18px" : "24px",
			boxSizing: "border-box",
			overflow: "visible",
			flexWrap: "nowrap",
		};
	}, [contentBlockWidth, isCompactDesktop]);

	const heroTextColumnStyle = useMemo<CSSProperties>(() => {
		return {
			...heroTextColumnBaseStyle,
			paddingTop: isCompactDesktop ? "clamp(72px, 10vh, 96px)" : "calc(12vh + 12px)",
			paddingRight: 0,
			paddingLeft: isCompactDesktop ? "clamp(6px, 0.8vw, 12px)" : 0,
			flex: "1 1 0",
		};
	}, [isCompactDesktop]);

	const primaryActionOffsetStyle = useMemo<CSSProperties>(() => {
		return {
			width: "100%",
			maxWidth: "100%",
			transform: isCompactDesktop
				? "none"
				: "translateX(clamp(-14px, -1vw, -24px)) scale(1.3)",
			transformOrigin: "center left",
		};
	}, [isCompactDesktop]);

	const primaryHeroAction = useMemo(() => {
		// Brasil e América Latina falam por WhatsApp; para a gringa, e-mail.
		if (language !== "en") {
			return (
				<WhatsAppSignalButton
					href={getWhatsAppHref(language)}
					label={localizeLabel("WhatsApp")}
					topLabel={whatsappTopLabel}
					bottomLabel="Vamos Nessa?"
					ariaLabel="Abrir conversa no WhatsApp"
					fullWidth
					compact={isCompactDesktop}
					hero
				/>
			);
		}

		return (
			<CTAButton
				label={localizeLabel(BOOKING_URL ? "AGENDAR CONVERSA" : "E-MAIL")}
				backLabel={localizeLabel("VAMOS CONVERSAR")}
				ariaLabel={localizeLabel(BOOKING_URL ? "AGENDAR CONVERSA" : "Enviar e-mail para Mateus")}
				href={BOOKING_URL || getContactEmailHref(language)}
				target={BOOKING_URL ? "_blank" : undefined}
				rel={BOOKING_URL ? "noopener noreferrer" : undefined}
				variant="heroPrimary"
				size={isCompactDesktop ? "compact" : "default"}
				align="center"
				fullWidth
			/>
		);
	}, [isCompactDesktop, language, whatsappTopLabel]);

	const secondaryHeroAction = useMemo(() => {
		return (
			<ResumeDownloadButton
				label={localizeLabel(secondaryLabel)}
				ariaLabel={secondaryLabel}
				href={RESUME_HREFS[language]}
				target="_blank"
				rel="noopener noreferrer"
				size={isCompactDesktop ? "compact" : "default"}
				fullWidth
			/>
		);
	}, [isCompactDesktop, language, secondaryLabel]);

	const primaryHeroActionWithOffset = useMemo(() => {
		return <div style={primaryActionOffsetStyle}>{localizeLabel(primaryHeroAction)}</div>;
	}, [primaryActionOffsetStyle, primaryHeroAction]);

	return (
		<Col md={5} style={heroTextColumnStyle} className="px-0">
			<div style={seniorTitleStyle} data-home-motion="eyebrow">{localizeLabel("Senior")}</div>

			<div className="font-sequel" style={roleContainerStyle} data-home-motion="role" data-agent-piece="">
				<RoleTitle />
			</div>

			<div style={sealsContainerStyle} data-agent-piece="">
				{seals.map((seal) => (
					<div
						key={seal.key}
						data-home-motion="seal"
						style={{
							minWidth: 0,
							maxWidth: "100%",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<img
							src={seal.src}
							alt={localizeLabel(seal.alt)}
							style={{
height: "auto",
maxHeight: isCompactDesktop ? "32px" : "40px",
								maxWidth: "100%",
								width: "auto",
								display: "block",
								filter: "grayscale(100%)",
								opacity: 0.8,
								...seal.style,
							}}
						/>
					</div>
				))}
			</div>

			<div style={heroActionsWrapperStyle} data-home-motion="actions" data-agent-piece="">
				<WhatsAppHeroSlot
					compact={isCompactDesktop}
					preserveDesktopOffset={!isCompactDesktop}
					primary={primaryHeroActionWithOffset}
					secondary={secondaryHeroAction}
				/>
			</div>
		</Col>
	);
}
