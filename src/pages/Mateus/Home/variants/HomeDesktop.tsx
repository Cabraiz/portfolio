import { localizeLabel, useLabelLanguage } from '@/i18n/labels';
import { useLayoutEffect, useMemo, useRef, useState } from "react";
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
import heroCinemaVote6Preview from "@/assets/Mateus/home/hero-cinema-vote-6-preview.webp";
import useProgressiveSource from "@/features/media/useProgressiveSource";
import { DESKTOP_HERO_LQIP } from "../data/heroPlaceholders";
import { ensureGsapRuntime } from "@/features/scroll/gsapRuntime";
import useHomeDesktopMotion from "../hooks/useHomeDesktopMotion";
import HeroTextColumn from "../components/desktop/HeroTextColumn";
import { useHomeHeroLayout } from "../hooks/useHomeHeroLayout";
import { getWhatsAppGreeting } from "../utils/home.utils";
import { resolveContactLanguage } from "../data/home.data";
import { shouldDisableScrollFades } from "../../../../features/scroll/scrollMotionFlags";
import { useHomeDesktopStyles } from "./HomeDesktop.styles";

const HERO_REVEAL_MS = 800;

function HomeDesktop() {
  useLabelLanguage();
	const containerRef = useRef<HTMLDivElement>(null);
	const backgroundRef = useRef<HTMLImageElement>(null);
	const overlayRef = useRef<HTMLDivElement>(null);
	const ambientLightRef = useRef<HTMLDivElement>(null);
	const kineticFieldRef = useRef<HTMLDivElement>(null);
	const editorialPhraseRef = useRef<HTMLDivElement>(null);
	const signatureRef = useRef<HTMLDivElement>(null);
	const innerContainerRef = useRef<HTMLDivElement>(null);
	const contentRailRef = useRef<HTMLDivElement>(null);
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
		[]
	);
	const selectedHeroOption = useMemo(() => {
		const requestedOption = Number(
			new URLSearchParams(window.location.search).get("hero")
		);

		return requestedOption >= 1 && requestedOption <= heroBackgrounds.length
			? requestedOption
			: 6;
	}, [heroBackgrounds.length]);
	const selectedHeroBackground = heroBackgrounds[selectedHeroOption - 1];
	// Foto progressiva (só a foto padrão tem miniatura): miniatura desfocada,
	// prévia e a foto final entrando por cima, perdendo o desfoque.
	const hasHeroPlaceholder = selectedHeroOption === 6;
	const heroPlaceholder = useProgressiveSource(
		DESKTOP_HERO_LQIP,
		hasHeroPlaceholder ? heroCinemaVote6Preview : null
	);
	const [heroRevealed, setHeroRevealed] = useState(false);
	const [heroPlaceholderDone, setHeroPlaceholderDone] = useState(!hasHeroPlaceholder);

	const { t } = useTranslation();
	const { sectionStyle, isCompactDesktop } = useHomeHeroLayout();

	const currentLanguage = i18n.resolvedLanguage ?? i18n.language ?? "pt";

	const contactLanguage = resolveContactLanguage(currentLanguage);

	const secondaryLabel = useMemo(() => {
		return t("buttons.downloadCV");
	}, [t, currentLanguage]);

	const whatsappTopLabel = useMemo(() => {
		return getWhatsAppGreeting();
	}, []);

	const {
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
	} = useHomeDesktopStyles({
		selectedHeroOption,
		isCompactDesktop,
		heroRevealed,
		heroPlaceholder,
		sectionStyle,
	});

	useHomeDesktopMotion(containerRef);

	useLayoutEffect(() => {
		const container = containerRef.current;

		if (!container) {
			return undefined;
		}

		const background = backgroundRef.current;
		const overlay = overlayRef.current;
		const ambientLight = ambientLightRef.current;
		const kineticField = kineticFieldRef.current;
		const editorialPhrase = editorialPhraseRef.current;
		const signature = signatureRef.current;
		const innerContainer = innerContainerRef.current;
		const contentRail = contentRailRef.current;
		const glints = kineticField
			? Array.from(
					kineticField.querySelectorAll<HTMLElement>("[data-home-glint]")
				)
			: [];
		const disableHeroIntro =
			shouldDisableScrollFades() ||
			window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		const animatedElements = [
			background,
			overlay,
			ambientLight,
			kineticField,
			editorialPhrase,
			signature,
			innerContainer,
			contentRail,
			...glints,
		].filter(
			(element): element is NonNullable<typeof element> => element !== null
		);

		if (disableHeroIntro) {
			return undefined;
		}

		const { gsap: runtimeGsap, ScrollTrigger } = ensureGsapRuntime();
		let ambientObserver: IntersectionObserver | null = null;
		const ctx = gsap.context(() => {
			runtimeGsap.set(animatedElements, {
				willChange: "transform, opacity",
				force3D: true,
			});

			const introElements = [innerContainer, editorialPhrase, signature].filter(
				(element): element is HTMLDivElement => element !== null
			);

			runtimeGsap.fromTo(
				introElements,
				{ autoAlpha: 0 },
				{
					autoAlpha: 1,
					duration: isCompactDesktop ? 0.48 : 0.62,
					stagger: 0.08,
					ease: "power2.out",
					overwrite: "auto",
				}
			);

			// Brilhos e luz ambiente em loop: só com o Início na tela (fora dela
			// ocupavam a thread principal e travavam as animações do Portfólio).
			const ambientIdle = runtimeGsap.timeline({ paused: true });
			glints.forEach((glint, index) => {
				ambientIdle.to(glint, {
					x: index % 2 === 0 ? 14 : -11,
					y: index === 1 ? -13 : 10,
					scale: index === 1 ? 1.7 : 1.45,
					opacity: index === 1 ? 0.44 : 0.52,
					duration: 4.6 + index * 0.9,
					ease: "sine.inOut",
					repeat: -1,
					yoyo: true,
				}, 0);
			});

			if (ambientLight) {
				ambientIdle.to(ambientLight, {
					xPercent: 2.4,
					yPercent: -1.6,
					scale: 1.035,
					opacity: 0.54,
					duration: 6.8,
					ease: "sine.inOut",
					repeat: -1,
					yoyo: true,
				}, 0);
			}
			ambientObserver = new IntersectionObserver(
				([entry]) => {
					if (entry?.isIntersecting) ambientIdle.play();
					else ambientIdle.pause();
				},
				// Encostar na borda da tela não conta como visível.
				{ rootMargin: "-1px 0px -1px 0px" }
			);
			ambientObserver.observe(container);

			const scrollTimeline = runtimeGsap.timeline({
				defaults: { ease: "none" },
				scrollTrigger: {
					trigger: container,
					start: "top top",
					end: "bottom top",
					scrub: 0.55,
					invalidateOnRefresh: true,
				},
			});

			scrollTimeline
				.to(background, { yPercent: 7, scale: 1.065, duration: 1 }, 0)
				.to(overlay, { opacity: 0.82, duration: 1 }, 0)
				.to(contentRail, { y: isCompactDesktop ? -22 : -34, duration: 1 }, 0)
				.to(editorialPhrase, { y: -24, x: 8, duration: 1 }, 0)
				.to(signature, { y: -14, x: -6, duration: 1 }, 0)
				.to(kineticField, { yPercent: -5, opacity: 0.24, duration: 1 }, 0);
		}, container);

		const refreshFrame = window.requestAnimationFrame(() => {
			ScrollTrigger.refresh(true);
		});

		return () => {
			window.cancelAnimationFrame(refreshFrame);
			ambientObserver?.disconnect();
			ctx.revert();
		};
	}, [isCompactDesktop]);

	return (
		<div
			ref={containerRef}
			style={rootStyle}
			data-mateus-hero-root="true"
			data-mateus-hero-mobile="false"
		>
			<div style={backgroundFrameStyle} data-hero-crop-frame="true" data-home-motion="photo-frame">
				{!heroPlaceholderDone ? (
					<img
						src={heroPlaceholder.src}
						alt=""
						aria-hidden="true"
						data-hero-placeholder={heroPlaceholder.stage}
						style={heroPlaceholderStyle}
					/>
				) : null}
				<img
					ref={backgroundRef}
					src={selectedHeroBackground}
					alt={localizeLabel("Retrato de Mateus Cabral")}
					data-hero-option={selectedHeroOption}
					data-hero-crop={
						selectedHeroOption === 6 ? "css-neck-reduction" : "source-frame"
					}
					data-hero-source-unchanged="true"
					loading="eager"
					decoding="async"
					fetchPriority="high"
					data-reveal={heroRevealed ? "done" : "pending"}
					onLoad={(event) => {
						const image = event.currentTarget;
						void image.decode().catch(() => undefined).then(() => {
							if (!image.isConnected) return;
							setHeroRevealed(true);
							const reduceMotion = window.matchMedia(
								"(prefers-reduced-motion: reduce)"
							).matches;
							window.setTimeout(
								() => setHeroPlaceholderDone(true),
								reduceMotion ? 0 : HERO_REVEAL_MS
							);
						});
					}}
					style={heroRevealStyle}
				/>
			</div>
			<div ref={overlayRef} aria-hidden="true" style={backgroundOverlayStyle} />
			<div style={ambientLightFrameStyle} aria-hidden="true">
				<div ref={ambientLightRef} style={ambientLightStyle} />
			</div>
			<div ref={kineticFieldRef} aria-hidden="true" style={kineticFieldStyle}>
				{kineticGlints.map((glint, index) => (
					<span
						key={`${glint.top}-${glint.left}`}
						data-home-glint={index + 1}
						style={{
							position: "absolute",
							top: glint.top,
							left: glint.left,
							width: glint.size,
							height: glint.size,
							borderRadius: "50%",
							opacity: glint.opacity,
							background:
								"radial-gradient(circle, rgba(255, 222, 161, 0.95) 0%, rgba(246, 156, 54, 0.42) 38%, transparent 72%)",
							boxShadow: "0 0 18px rgba(242, 143, 40, 0.36)",
						}}
					/>
				))}
			</div>
			<div
				ref={editorialPhraseRef}
				data-agent-piece=""
				style={editorialPhraseStyle}
				aria-label={localizeLabel("Histórias também são feitas de código")}
			>
				<span data-home-motion="phrase-line">{localizeLabel("Histórias")}</span>
				<span data-home-motion="phrase-line">{localizeLabel("Também são")}</span>
				<span data-home-motion="phrase-line">{localizeLabel("Feitas de código.")}</span>
			</div>
			{/* H1 da página: nome e cargo (mesma identidade do título e dos dados
			    estruturados), com o visual de assinatura de sempre; abaixo, a
			    disponibilidade no formato que cada mercado procura. */}
			<div ref={signatureRef} style={signatureStyle} data-agent-piece="">
				<h1
					style={signatureHeadingStyle}
					aria-label={localizeLabel("Mateus Cabral, Senior AI Engineer")}
				>
					<strong style={{ fontSize: "1.12em", fontWeight: 700 }}>
						{localizeLabel("Mateus Cabral")}</strong>
					<span>{localizeLabel("Senior AI Engineer")}</span>
				</h1>
				<p style={availabilityStyle} data-home-availability="">
					{localizeLabel("Remoto · CLT ou PJ")}
				</p>
			</div>

			<Container fluid className="px-0" style={containerStyle}>
				<div ref={innerContainerRef} style={innerContainerStyle}>
					<Row className="custom-section-row g-0 mx-0" style={rowStyle}>
						<div ref={contentRailRef} style={contentRailStyle}>
							<HeroTextColumn
								isCompactDesktop={isCompactDesktop}
								language={contactLanguage}
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
