import { useMemo, type CSSProperties } from "react";

import type useProgressiveSource from "@/features/media/useProgressiveSource";
import type { useHomeHeroLayout } from "../hooks/useHomeHeroLayout";

type HomeHeroLayout = ReturnType<typeof useHomeHeroLayout>;

// Estilos inline do Início no desktop (mesma ordem de hooks de antes)
export function useHomeDesktopStyles({
	selectedHeroOption,
	isCompactDesktop,
	heroRevealed,
	heroPlaceholder,
	sectionStyle,
}: Readonly<{
	selectedHeroOption: number;
	isCompactDesktop: HomeHeroLayout["isCompactDesktop"];
	heroRevealed: boolean;
	heroPlaceholder: Pick<ReturnType<typeof useProgressiveSource>, "stage">;
	sectionStyle: HomeHeroLayout["sectionStyle"];
}>) {
	const backgroundImageStyle = useMemo<CSSProperties>(() => {
		const usesPortraitNeckCrop = selectedHeroOption === 6;

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
			transform: usesPortraitNeckCrop ? "scale(1.055)" : undefined,
			transformOrigin: usesPortraitNeckCrop ? "72% 22%" : "center center",
		};
	}, [isCompactDesktop, selectedHeroOption]);

	const heroRevealStyle = useMemo<CSSProperties>(() => {
		return {
			...backgroundImageStyle,
			opacity: heroRevealed ? 1 : 0,
			filter: heroRevealed ? "blur(0px)" : "blur(14px)",
			transition: "opacity 420ms ease, filter 800ms ease",
		};
	}, [backgroundImageStyle, heroRevealed]);

	const heroPlaceholderStyle = useMemo<CSSProperties>(() => {
		return {
			...backgroundImageStyle,
			filter: heroPlaceholder.stage === "preview" ? "blur(3px)" : "blur(14px)",
			transition: "filter 420ms ease",
		};
	}, [backgroundImageStyle, heroPlaceholder.stage]);

	const backgroundFrameStyle = useMemo<CSSProperties>(() => {
		return {
			position: "absolute",
			inset: 0,
			zIndex: 0,
			overflow: "clip",
			contain: "paint",
			pointerEvents: "none",
		};
	}, []);

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

	const ambientLightStyle = useMemo<CSSProperties>(() => {
		return {
			position: "absolute",
			inset: "-12% -8%",
			zIndex: 1,
			pointerEvents: "none",
			opacity: 0.42,
			background:
				"radial-gradient(circle at 78% 24%, rgba(255, 181, 76, 0.2) 0%, rgba(255, 181, 76, 0.07) 12%, transparent 31%), radial-gradient(circle at 64% 74%, rgba(245, 146, 46, 0.12) 0%, transparent 27%)",
			mixBlendMode: "screen",
			transformOrigin: "74% 38%",
		};
	}, []);

	const ambientLightFrameStyle = useMemo<CSSProperties>(() => {
		return {
			position: "absolute",
			inset: 0,
			zIndex: 1,
			overflow: "clip",
			contain: "paint",
			pointerEvents: "none",
		};
	}, []);

	const kineticFieldStyle = useMemo<CSSProperties>(() => {
		return {
			position: "absolute",
			inset: 0,
			zIndex: 1,
			pointerEvents: "none",
			overflow: "hidden",
		};
	}, []);

	const kineticGlints = useMemo(
		() => [
			{ top: "18%", left: "73%", size: 8, opacity: 0.34 },
			{ top: "45%", left: "83%", size: 5, opacity: 0.26 },
			{ top: "72%", left: "68%", size: 6, opacity: 0.22 },
		],
		[]
	);

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
			margin: 0,
			transform: "scaleX(0.78) scaleY(1.12)",
			transformOrigin: "right bottom",
			whiteSpace: "nowrap",
			pointerEvents: "none",
		};
	}, [isCompactDesktop]);

	const signatureHeadingStyle = useMemo<CSSProperties>(() => {
		return {
			display: "flex",
			flexDirection: "column",
			alignItems: "flex-start",
			gap: isCompactDesktop ? "1px" : "2px",
			margin: 0,
			font: "inherit",
			letterSpacing: "inherit",
		};
	}, [isCompactDesktop]);

	const availabilityStyle = useMemo<CSSProperties>(() => {
		return {
			margin: isCompactDesktop ? "3px 0 0" : "5px 0 0",
			color: "rgba(255, 255, 255, 0.62)",
			fontSize: "0.92em",
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
			paddingBlock: isCompactDesktop
				? "clamp(8px, 1.2vh, 14px)"
				: "clamp(10px, 1.6vh, 18px)",
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

	return {
		heroRevealStyle,
		heroPlaceholderStyle,
		backgroundFrameStyle,
		backgroundOverlayStyle,
		ambientLightStyle,
		ambientLightFrameStyle,
		kineticFieldStyle,
		kineticGlints,
		signatureStyle,
		signatureHeadingStyle,
		availabilityStyle,
		editorialPhraseStyle,
		rootStyle,
		containerStyle,
		innerContainerStyle,
		contentRailStyle,
		rowStyle,
	};
}
