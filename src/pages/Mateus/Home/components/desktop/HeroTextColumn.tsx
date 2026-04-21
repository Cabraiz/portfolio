import { type CSSProperties, useMemo } from "react";
import { Col } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import Tippy from "@tippyjs/react";

import RoleTitle from "../../../RoleTitle";
import CTAButton from "../../../shared/CTAButton/CTAButton";
import ResumeDownloadButton from "../../../shared/ResumeDownloadButton/ResumeDownloadButton";
import WhatsAppSignalButton from "../../../shared/WhatsAppSignalButton/WhatsAppSignalButton";
import WhatsAppHeroSlot from "../../../shared/WhatsAppSignalButton/WhatsAppHeroSlot";

import {
	MEET_HREF,
	RESUME_HREF,
	seals,
	WHATSAPP_HREF,
} from "../../data/home.data";

type HeroTextColumnProps = Readonly<{
	isCompactDesktop: boolean;
	isPT: boolean;
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
	isPT,
	whatsappTopLabel,
	secondaryLabel,
}: HeroTextColumnProps) {
	const { t } = useTranslation();

	const seniorTitleStyle = useMemo<CSSProperties>(() => {
		return {
			fontSize: isCompactDesktop ? "3rem" : "4rem",
			fontWeight: 700,
			color: "#f1c40f",
			marginBottom: isCompactDesktop ? "30px" : "3.2rem",
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
			backgroundImage: "linear-gradient(90deg, #f1c40f 100%, #f1c40f 100%)",
			marginBottom: isCompactDesktop ? "30px" : "46px",
			display: "flex",
			alignItems: "center",
			justifyContent: "flex-start",
			height: isCompactDesktop ? "3rem" : "4rem",
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
			marginBottom: isCompactDesktop ? "30px" : "8px",
			boxSizing: "border-box",
			overflow: "visible",
			flexWrap: "nowrap",
		};
	}, [contentBlockWidth, isCompactDesktop]);

	const heroTextColumnStyle = useMemo<CSSProperties>(() => {
		return {
			...heroTextColumnBaseStyle,
			paddingTop: isCompactDesktop ? "clamp(60px, 8vh, 88px)" : "12vh",
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
		if (isPT) {
			return (
				<WhatsAppSignalButton
					href={WHATSAPP_HREF}
					label="WhatsApp"
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
				label="MEET"
				backLabel="LET'S TALK"
				ariaLabel="Open meeting link"
				href={MEET_HREF}
				target="_blank"
				rel="noopener noreferrer"
				variant="heroPrimary"
				size={isCompactDesktop ? "compact" : "default"}
				align="center"
				fullWidth
			/>
		);
	}, [isCompactDesktop, isPT, whatsappTopLabel]);

	const secondaryHeroAction = useMemo(() => {
		return (
			<ResumeDownloadButton
				label={secondaryLabel}
				ariaLabel={secondaryLabel}
				href={RESUME_HREF}
				target="_blank"
				rel="noopener noreferrer"
				size={isCompactDesktop ? "compact" : "default"}
				fullWidth
			/>
		);
	}, [isCompactDesktop, secondaryLabel]);

	const primaryHeroActionWithOffset = useMemo(() => {
		return <div style={primaryActionOffsetStyle}>{primaryHeroAction}</div>;
	}, [primaryActionOffsetStyle, primaryHeroAction]);

	return (
		<Col md={5} style={heroTextColumnStyle} className="px-0">
			<div style={seniorTitleStyle}>Senior</div>

			<div className="font-sequel" style={roleContainerStyle}>
				<RoleTitle />
			</div>

			<div style={sealsContainerStyle}>
				{seals.map((seal) => (
					<Tippy
						key={seal.key}
						content={
							<div
								style={{
									display: "flex",
									gap: "1rem",
									maxWidth: "280px",
									padding: "4px",
									boxSizing: "border-box",
								}}
							>
								<img
									src={seal.cat}
									alt={`${seal.alt} mascot`}
									style={{
										height: "11vh",
										maxWidth: "96px",
										width: "auto",
										borderRadius: "8px",
										display: "block",
										flexShrink: 0,
									}}
								/>
								<p
									style={{
										fontSize: "12px",
										margin: 0,
										wordBreak: "break-word",
									}}
								>
									{t(`selo.${seal.key}`)}
								</p>
							</div>
						}
						placement="top"
						animation="fade"
						arrow
						delay={[500, 100]}
						theme="bubble"
						offset={[0, 20]}
					>
						<div
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
								alt={seal.alt}
								style={{
									height: isCompactDesktop ? "32px" : "40px",
									maxWidth: "100%",
									width: "auto",
									display: "block",
									filter: "grayscale(100%)",
									opacity: 0.8,
									...seal.style,
								}}
							/>
						</div>
					</Tippy>
				))}
			</div>

			<div style={heroActionsWrapperStyle}>
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
