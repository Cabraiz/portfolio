import { useLayoutEffect, useRef } from "react";

import workshopBackground from "@/assets/Mateus/services/industrial-workshop-background-v2.png";
import workbench from "@/assets/Mateus/services/industrial-workbench-base-v2.png";
import laptopClubeOff from "@/assets/Mateus/services/devices/laptop-clube-raytrace-off-v3.png";
import monitorOff from "@/assets/Mateus/services/devices/monitor-raytrace-off-v1.png";
import phoneClubeOff from "@/assets/Mateus/services/devices/phone-clube-raytrace-off-v2.png";
import servicesSignStatic from "@/assets/Mateus/services/services-oval-wires-static-v14.png";
import servicesSignAnimated from "@/assets/Mateus/services/services-sign-lag-arthur-roving-repair-104frames-v17.webp";
import { ensureGsapRuntime } from "@/features/scroll/gsapRuntime";
import { shouldDisableScrollFades } from "@/features/scroll/scrollMotionFlags";

import styles from "./Services.module.css";

export default function Services() {
	const rootRef = useRef<HTMLElement>(null);
	const backgroundRef = useRef<HTMLImageElement>(null);
	const atmosphereRef = useRef<HTMLDivElement>(null);
	const headingRef = useRef<HTMLElement>(null);
	const titleRef = useRef<HTMLHeadingElement>(null);
	const signRigRef = useRef<HTMLPictureElement>(null);
	const workbenchRef = useRef<HTMLDivElement>(null);

	useLayoutEffect(() => {
		const root = rootRef.current;
		const background = backgroundRef.current;
		const atmosphere = atmosphereRef.current;
		const heading = headingRef.current;
		const title = titleRef.current;
		const signRig = signRigRef.current;
		const workbenchElement = workbenchRef.current;

		if (
			!root ||
			!background ||
			!atmosphere ||
			!heading ||
			!title ||
			!signRig ||
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
		let swingTween: ReturnType<typeof gsap.to> | undefined;
		let settleTween: ReturnType<typeof gsap.to> | undefined;
		let settleSwing: ReturnType<typeof gsap.delayedCall> | undefined;

		const context = gsap.context(() => {
			gsap.set([background, atmosphere, heading, title, signRig, workbenchElement], {
				force3D: true,
			});
			gsap.set(signRig, { rotation: 0, transformOrigin: "50% 0%" });

			settleSwing = gsap
				.delayedCall(0.1, () => {
					settleTween = gsap.to(signRig, {
						rotation: 0,
						duration: 1.35,
						ease: "elastic.out(1, 0.32)",
						overwrite: true,
					});
				})
				.pause();

			ScrollTrigger.create({
				id: "services-sign-scroll-rig",
				trigger: root,
				start: "top bottom",
				end: "bottom top",
				onUpdate: (self) => {
					const rotation = gsap.utils.clamp(
						-4.25,
						4.25,
						-self.getVelocity() / 520,
					);

					settleTween?.kill();
					swingTween = gsap.to(signRig, {
						rotation,
						duration: 0.14,
						ease: "power2.out",
						overwrite: true,
					});
					settleSwing.restart(true);
				},
				onLeave: () => settleSwing.restart(true),
				onLeaveBack: () => settleSwing.restart(true),
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
			swingTween?.kill();
			settleTween?.kill();
			settleSwing?.kill();
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
						data-title-treatment="physical-amber-oval-storefront-sign-2d"
					>
						<span className={styles.titleLabel}>Serviços</span>
						<picture
							ref={signRigRef}
							className={styles.signAnimation}
							data-sign-frame-count="104"
							data-sign-motion="lag-arthur-rappel-left-right-contact-repair"
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
					<div ref={workbenchRef} className={styles.workbenchRig}>
						<img className={styles.workbench} src={workbench} alt="" />
						<div
							className={styles.deviceRow}
							data-device-count="3"
							data-device-lighting="off"
						>
							<picture
								className={`${styles.device} ${styles.laptopDevice}`}
								data-service-device="laptop"
							>
								<img
									className={styles.deviceImage}
									src={laptopClubeOff}
									alt=""
									decoding="async"
								/>
							</picture>
							<picture
								className={`${styles.device} ${styles.phoneDevice}`}
								data-service-device="phone"
							>
								<img
									className={styles.deviceImage}
									src={phoneClubeOff}
									alt=""
									decoding="async"
								/>
							</picture>
							<picture
								className={`${styles.device} ${styles.monitorDevice}`}
								data-service-device="monitor"
							>
								<img
									className={styles.deviceImage}
									src={monitorOff}
									alt=""
									decoding="async"
								/>
							</picture>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
