import { useLayoutEffect, useRef } from "react";

import workshopBackground from "@/assets/Mateus/services/industrial-workshop-background-v2.png";
import workbench from "@/assets/Mateus/services/industrial-workbench-base-v2.png";
import servicesSignStatic from "@/assets/Mateus/services/services-led-sign-crisp-2x-v7.webp";
import servicesSignAnimated from "@/assets/Mateus/services/services-led-sign-live-8frames-v8.webp";
import { ensureGsapRuntime } from "@/features/scroll/gsapRuntime";
import { shouldDisableScrollFades } from "@/features/scroll/scrollMotionFlags";

import styles from "./Services.module.css";

export default function Services() {
	const rootRef = useRef<HTMLElement>(null);
	const backgroundRef = useRef<HTMLImageElement>(null);
	const atmosphereRef = useRef<HTMLDivElement>(null);
	const headingRef = useRef<HTMLElement>(null);
	const titleRef = useRef<HTMLHeadingElement>(null);
	const workbenchRef = useRef<HTMLImageElement>(null);

	useLayoutEffect(() => {
		const root = rootRef.current;
		const background = backgroundRef.current;
		const atmosphere = atmosphereRef.current;
		const heading = headingRef.current;
		const title = titleRef.current;
		const workbenchElement = workbenchRef.current;

		if (
			!root ||
			!background ||
			!atmosphere ||
			!heading ||
			!title ||
			!workbenchElement
		) {
			return;
		}

		const reducedMotion =
			shouldDisableScrollFades() ||
			window.matchMedia("(prefers-reduced-motion: reduce)").matches;

		if (reducedMotion) {
			root.dataset.servicesMotion = "reduced";
			return () => {
				delete root.dataset.servicesMotion;
			};
		}

		const { gsap, ScrollTrigger } = ensureGsapRuntime();
		root.dataset.servicesMotion = "scroll";

		const context = gsap.context(() => {
			gsap.set([background, atmosphere, heading, title, workbenchElement], {
				force3D: true,
			});

			const sceneTimeline = gsap.timeline({
				defaults: { ease: "none" },
				scrollTrigger: {
					id: "services-scroll-scene",
					trigger: root,
					start: "top bottom",
					end: "bottom top",
					scrub: 0.65,
					invalidateOnRefresh: true,
				},
			});

			sceneTimeline
				.fromTo(
					background,
					{ yPercent: -4, scale: 1.075 },
					{ yPercent: 0, scale: 1.025, duration: 0.48 },
					0
				)
				.to(background, { yPercent: 4, scale: 1.045, duration: 0.52 }, 0.48)
				.fromTo(
					atmosphere,
					{ opacity: 0.58 },
					{ opacity: 1, duration: 0.48 },
					0
				)
				.to(atmosphere, { opacity: 0.72, duration: 0.52 }, 0.48)
				.fromTo(
					heading,
					{ x: -54, y: 22, autoAlpha: 0 },
					{
						x: 0,
						y: 0,
						autoAlpha: 1,
						duration: 0.38,
						ease: "power3.out",
					},
					0.06
				)
				.to(heading, { y: -26, autoAlpha: 0.7, duration: 0.42 }, 0.58)
				.fromTo(
					workbenchElement,
					{ xPercent: 10, y: 34, scale: 0.97, autoAlpha: 0.62 },
					{
						xPercent: 0,
						y: 0,
						scale: 1,
						autoAlpha: 1,
						duration: 0.44,
						ease: "power2.out",
					},
					0.04
				)
				.to(
					workbenchElement,
					{ xPercent: -1.5, y: -16, scale: 1.012, duration: 0.5 },
					0.5
				);

		}, root);

		const refreshFrame = window.requestAnimationFrame(() => {
			ScrollTrigger.refresh();
		});

		return () => {
			window.cancelAnimationFrame(refreshFrame);
			context.revert();
			delete root.dataset.servicesMotion;
		};
	}, []);

	return (
		<section
			ref={rootRef}
			className={styles.root}
			aria-labelledby="services-title"
			data-services-root="true"
		>
			<div className={styles.sceneFrame} data-services-scene-frame="true">
				<img
					ref={backgroundRef}
					className={styles.background}
					src={workshopBackground}
					alt=""
					aria-hidden="true"
					loading="eager"
					decoding="async"
				/>

				<div
					ref={atmosphereRef}
					className={styles.atmosphere}
					aria-hidden="true"
				/>

				<header ref={headingRef} className={styles.heading}>
					<h2
						ref={titleRef}
						id="services-title"
						className={styles.title}
						data-title-treatment="physical-red-led-storefront-sign-2d"
					>
						<span className={styles.titleLabel}>Serviços</span>
						<picture
							className={styles.signAnimation}
							data-sign-frame-count="8"
							data-sign-motion="baked-eight-frame-loop"
							aria-hidden="true"
						>
							<source
								media="(prefers-reduced-motion: reduce)"
								srcSet={servicesSignStatic}
							/>
							<img
								className={styles.titleImage}
								src={servicesSignAnimated}
								alt=""
								decoding="async"
							/>
						</picture>
					</h2>
				</header>

				<div className={styles.workbenchStage} aria-hidden="true">
					<img
						ref={workbenchRef}
						className={styles.workbench}
						src={workbench}
						alt=""
					/>
				</div>
			</div>
		</section>
	);
}
