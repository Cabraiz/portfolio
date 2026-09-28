import { useLayoutEffect, useRef } from "react";

import workshopBackground from "@/assets/Mateus/services/industrial-workshop-background-v2.png";
import workbench from "@/assets/Mateus/services/industrial-workbench-base-robot-interaction-v5.png";
import laptopClubeOff from "@/assets/Mateus/services/devices/laptop-workshop-off-v4.png";
import phoneClubeOff from "@/assets/Mateus/services/devices/phone-workshop-stand-off-v5.png";
import roboticArmOpen from "@/assets/Mateus/services/devices/robotic-arm-workshop-open-v2.png";
import roboticArmClosed from "@/assets/Mateus/services/devices/robotic-arm-workshop-closed-v3.png";
import roboticArmBlock from "@/assets/Mateus/services/devices/robotic-arm-metal-block-v2.png";
import lagArthurPointing from "@/assets/Mateus/services/lag-arthur-pointing-claw-v3.png";
import servicesSignAnimated from "@/assets/Mateus/services/services-front-wall-rail-lag-arthur-104frames-v22.webp";
import servicesSignStatic from "@/assets/Mateus/services/services-front-wall-rail-static-v21.png";
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
	const robotArmRigRef = useRef<HTMLDivElement>(null);
	const robotArmOpenRef = useRef<HTMLImageElement>(null);
	const robotArmClosedRef = useRef<HTMLImageElement>(null);
	const robotBlockRef = useRef<HTMLImageElement>(null);
	const robotCharacterRef = useRef<HTMLImageElement>(null);

	useLayoutEffect(() => {
		const root = rootRef.current;
		const background = backgroundRef.current;
		const atmosphere = atmosphereRef.current;
		const heading = headingRef.current;
		const title = titleRef.current;
		const signRig = signRigRef.current;
		const workbenchElement = workbenchRef.current;
		const robotArmRig = robotArmRigRef.current;
		const robotArmOpenElement = robotArmOpenRef.current;
		const robotArmClosedElement = robotArmClosedRef.current;
		const robotBlockElement = robotBlockRef.current;
		const robotCharacterElement = robotCharacterRef.current;

		if (
			!root ||
			!background ||
			!atmosphere ||
			!heading ||
			!title ||
			!signRig ||
			!workbenchElement ||
			!robotArmRig ||
			!robotArmOpenElement ||
			!robotArmClosedElement ||
			!robotBlockElement ||
			!robotCharacterElement
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
			gsap.set(
				[
					background,
					atmosphere,
					heading,
					title,
					signRig,
					workbenchElement,
					robotArmRig,
					robotBlockElement,
					robotCharacterElement,
				],
				{
					force3D: true,
				}
			);
			gsap.set(signRig, { rotation: 0, transformOrigin: "50% 0%" });
			gsap.set(robotArmOpenElement, { autoAlpha: 1 });
			gsap.set(robotArmClosedElement, { autoAlpha: 0 });

			gsap
				.timeline({ repeat: -1, repeatDelay: 0.65 })
				.to(
					robotCharacterElement,
					{
						yPercent: -2.5,
						rotation: -1.4,
						duration: 0.42,
						ease: "power2.out",
					},
					0.2
				)
				.to(
					robotArmRig,
					{
						xPercent: -1.5,
						yPercent: 8,
						rotation: -1.2,
						duration: 0.9,
						ease: "power2.inOut",
					},
					0.45
				)
				.set(robotArmOpenElement, { autoAlpha: 0 }, 1.36)
				.set(robotArmClosedElement, { autoAlpha: 1 }, 1.36)
				.to(
					robotArmRig,
					{
						xPercent: -3,
						yPercent: -3,
						rotation: 0,
						duration: 0.82,
						ease: "power2.inOut",
					},
					1.52
				)
				.to(
					robotBlockElement,
					{
						xPercent: -6,
						yPercent: -44,
						duration: 0.82,
						ease: "power2.inOut",
					},
					1.52
				)
				.to(
					robotCharacterElement,
					{
						yPercent: -6,
						rotation: 1.8,
						duration: 0.26,
						yoyo: true,
						repeat: 1,
						ease: "power2.inOut",
					},
					1.58
				)
				.to(
					robotArmRig,
					{
						xPercent: -1.5,
						yPercent: 8,
						rotation: -1.2,
						duration: 0.82,
						ease: "power2.inOut",
					},
					3.02
				)
				.to(
					robotBlockElement,
					{
						xPercent: 0,
						yPercent: 0,
						duration: 0.82,
						ease: "power2.inOut",
					},
					3.02
				)
				.set(robotArmClosedElement, { autoAlpha: 0 }, 3.9)
				.set(robotArmOpenElement, { autoAlpha: 1 }, 3.9)
				.to(
					robotArmRig,
					{
						xPercent: 0,
						yPercent: 0,
						rotation: 0,
						duration: 0.72,
						ease: "power2.inOut",
					},
					4.04
				)
				.to(
					robotCharacterElement,
					{
						yPercent: 0,
						rotation: 0,
						duration: 0.52,
						ease: "power2.out",
					},
					4.04
				);

			const activeSettleSwing = gsap
				.delayedCall(0.1, () => {
					settleTween = gsap.to(signRig, {
						rotation: 0,
						duration: 1.35,
						ease: "elastic.out(1, 0.32)",
						overwrite: true,
					});
				})
				.pause();
			settleSwing = activeSettleSwing;

			ScrollTrigger.create({
				id: "services-sign-scroll-rig",
				trigger: root,
				start: "top bottom",
				end: "bottom top",
				onUpdate: (self) => {
					const rotation = gsap.utils.clamp(
						-4.25,
						4.25,
						-self.getVelocity() / 520
					);

					settleTween?.kill();
					swingTween = gsap.to(signRig, {
						rotation,
						duration: 0.14,
						ease: "power2.out",
						overwrite: true,
					});
					activeSettleSwing.restart(true);
				},
				onLeave: () => activeSettleSwing.restart(true),
				onLeaveBack: () => activeSettleSwing.restart(true),
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
						data-title-treatment="front-wall-rail-amber-sign-2d"
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
							<div
								className={`${styles.device} ${styles.robotArmDevice}`}
								data-service-device="robot-arm"
							>
								<div className={styles.robotInteraction}>
									<div ref={robotArmRigRef} className={styles.robotArmRig}>
										<img
											ref={robotArmOpenRef}
											className={`${styles.robotArmLayer} ${styles.robotArmOpen}`}
											src={roboticArmOpen}
											alt=""
											decoding="async"
										/>
										<img
											ref={robotArmClosedRef}
											className={`${styles.robotArmLayer} ${styles.robotArmClosed}`}
											src={roboticArmClosed}
											alt=""
											decoding="async"
										/>
									</div>
									<img
										ref={robotBlockRef}
										className={styles.robotBlock}
										src={roboticArmBlock}
										alt=""
										decoding="async"
									/>
									<img
										ref={robotCharacterRef}
										className={styles.robotCharacter}
										src={lagArthurPointing}
										alt=""
										decoding="async"
									/>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
