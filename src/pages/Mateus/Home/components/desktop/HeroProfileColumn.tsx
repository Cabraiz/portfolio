import { Col } from "react-bootstrap";

import MeetQrPopoverButton from "./MeetQrPopoverButton";
import SocialButton from "./SocialButton";
import { useHomeHeroLayout } from "../../hooks/useHomeHeroLayout";
import {
	PROFILE_IMAGE,
	PROFILE_IMAGE_ALT,
	SOCIAL_ICONS,
} from "../../data/home.data";

type HeroProfileColumnProps = Readonly<{
	isCompactDesktop: boolean;
	isPT: boolean;
	isImageLoaded: boolean;
	onImageLoad: () => void;
}>;

export default function HeroProfileColumn({
	isCompactDesktop,
	isImageLoaded,
	onImageLoad,
}: HeroProfileColumnProps) {
	const {
		profileColumnStyle,
		profileCardStyle,
		profileImageWrapperStyle,
		socialRowStyle,
		isMobileViewport,
	} = useHomeHeroLayout();

	const mobileIconSlotStyle = {
		width: "100%",
		maxWidth: "52px",
		aspectRatio: "1 / 1",
		minWidth: "44px",
		minHeight: "44px",
		display: "inline-flex",
		alignItems: "center",
		justifyContent: "center",
		boxSizing: "border-box" as const,
	};

	const desktopIconSlotStyle = {
		display: "inline-flex",
		alignItems: "center",
		justifyContent: "center",
	};

	const iconSlotStyle = isMobileViewport
		? mobileIconSlotStyle
		: desktopIconSlotStyle;

	const desktopColumnWidth = isCompactDesktop ? "51.5%" : "52.5%";
	const desktopCardMaxWidth = isCompactDesktop
		? "clamp(400px, 29vw, 470px)"
		: "clamp(430px, 31vw, 540px)";
	const desktopCardOffset = isCompactDesktop
		? "clamp(-2px, -0.15vw, -4px)"
		: "clamp(-3px, -0.25vw, -8px)";
	const desktopColumnPaddingLeft = isCompactDesktop
		? "clamp(2px, 0.25vw, 6px)"
		: "clamp(4px, 0.45vw, 10px)";

	return (
		<Col
			md={7}
			className="px-0"
			style={{
				...profileColumnStyle,
				height: "100%",
				minHeight: "100%",
				minWidth: 0,
				maxWidth: "100%",
				boxSizing: "border-box",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				flex: isMobileViewport ? "1 1 100%" : `0 0 ${desktopColumnWidth}`,
				width: isMobileViewport ? "100%" : desktopColumnWidth,
				paddingLeft: isMobileViewport ? 0 : desktopColumnPaddingLeft,
				paddingRight: 0,
				overflow: "visible",
			}}
		>
			<div
				style={{
					...profileCardStyle,
					width: "100%",
					maxWidth: isMobileViewport
						? "min(100%, 420px)"
						: desktopCardMaxWidth,
					boxSizing: "border-box",
					marginLeft: isMobileViewport ? 0 : desktopCardOffset,
					marginRight: 0,
					overflow: "hidden",
					paddingTop: isMobileViewport
						? "clamp(12px, 2.4vw, 16px)"
						: "clamp(14px, 1.2vw, 20px)",
					paddingInline: isMobileViewport
						? "clamp(12px, 2.8vw, 18px)"
						: "clamp(16px, 1.4vw, 24px)",
					paddingBottom: isMobileViewport
						? "clamp(14px, 2.8vw, 20px)"
						: "clamp(18px, 1.6vw, 26px)",
				}}
			>
				<div
					style={{
						...profileImageWrapperStyle,
						background: "rgba(255, 255, 255, 0.02)",
						width: "100%",
						maxWidth: "100%",
						boxSizing: "border-box",
						overflow: "hidden",
						height: isMobileViewport
							? "auto"
							: isCompactDesktop
								? "clamp(360px, 48vh, 420px)"
								: "clamp(400px, 52vh, 460px)",
						aspectRatio: "auto",
					}}
				>
					<img
						src={PROFILE_IMAGE}
						alt={PROFILE_IMAGE_ALT}
						loading="eager"
						decoding="async"
						fetchPriority="high"
						onLoad={onImageLoad}
						style={{
							width: "100%",
							height: "100%",
							objectFit: "cover",
							objectPosition: "center top",
							opacity: isImageLoaded ? 1 : 0.98,
							transition: "opacity 160ms ease",
							display: "block",
						}}
					/>
				</div>

				<div style={socialRowStyle}>
					<div style={iconSlotStyle}>
						<SocialButton
							href="https://www.linkedin.com/in/cabraiz/"
							icon={SOCIAL_ICONS.linkedin}
							alt="LinkedIn"
						/>
					</div>

					<div style={iconSlotStyle}>
						<SocialButton
							href="mailto:mateusccabr@gmail.com?subject=Freelance."
							icon={SOCIAL_ICONS.gmail}
							alt="Gmail"
						/>
					</div>

					<div style={iconSlotStyle}>
						<SocialButton
							href="https://www.instagram.com/cabraiz/"
							icon={SOCIAL_ICONS.instagram}
							alt="Instagram"
						/>
					</div>

					{!isMobileViewport && (
						<div style={iconSlotStyle}>
							<MeetQrPopoverButton />
						</div>
					)}
				</div>
			</div>
		</Col>
	);
}


