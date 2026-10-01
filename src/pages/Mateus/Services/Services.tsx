import { localizeLabel, useLabelLanguage } from '@/i18n/labels';
import { useLayoutEffect, useRef } from "react";

import workshopBackground from "@/assets/Mateus/services/industrial-workshop-background-v2.png";
import workbench from "@/assets/Mateus/services/industrial-workbench-base-robot-interaction-v5.png";
import laptopClubeOff from "@/assets/Mateus/services/devices/laptop-workshop-off-v4.png";
import phoneClubeOff from "@/assets/Mateus/services/devices/phone-workshop-stand-off-v6.png";
import roboticArmStatic from "@/assets/Mateus/services/devices/robotic-arm-workshop-static-v4.png";
import roboticClawOpen from "@/assets/Mateus/services/devices/robotic-claw-telescopic-open-v1.png";
import roboticClawClosed from "@/assets/Mateus/services/devices/robotic-claw-telescopic-closed-v1.png";
import roboticArmBlock from "@/assets/Mateus/services/devices/robotic-arm-metal-block-v2.png";
import lagArthurControllerBody from "@/assets/Mateus/services/lag-arthur-controller-body-follow-v5.png";
import lagArthurControllerEyes from "@/assets/Mateus/services/lag-arthur-controller-eyes-gaze-v6.png";
import lagArthurControllerHead from "@/assets/Mateus/services/lag-arthur-controller-head-gaze-base-v6.png";
import servicesSignAnimated from "@/assets/Mateus/services/services-front-wall-rail-lag-arthur-104frames-v22.webp";
import servicesSignStatic from "@/assets/Mateus/services/services-front-wall-rail-static-v21.png";
import { ensureGsapRuntime } from "@/features/scroll/gsapRuntime";
import { shouldDisableScrollFades } from "@/features/scroll/scrollMotionFlags";

import styles from "./Services.module.css";

export default function Services() {
  useLabelLanguage();
	const rootRef = useRef<HTMLElement>(null);
	const backgroundRef = useRef<HTMLImageElement>(null);
	const atmosphereRef = useRef<HTMLDivElement>(null);
	const headingRef = useRef<HTMLElement>(null);
	const titleRef = useRef<HTMLHeadingElement>(null);
	const signRigRef = useRef<HTMLPictureElement>(null);
	const workbenchRef = useRef<HTMLDivElement>(null);
	const robotArmStaticRef = useRef<HTMLImageElement>(null);
	const robotClawRef = useRef<HTMLDivElement>(null);
	const robotClawRailRef = useRef<HTMLSpanElement>(null);
	const robotClawOpenRef = useRef<HTMLImageElement>(null);
	const robotClawClosedRef = useRef<HTMLImageElement>(null);
	const robotBlockRef = useRef<HTMLImageElement>(null);
	const robotCharacterRef = useRef<HTMLDivElement>(null);
	const robotCharacterHeadRef = useRef<HTMLDivElement>(null);
	const robotCharacterEyesRef = useRef<HTMLImageElement>(null);

	useLayoutEffect(() => {
		const root = rootRef.current;
		const background = backgroundRef.current;
		const atmosphere = atmosphereRef.current;
		const heading = headingRef.current;
		const title = titleRef.current;
		const signRig = signRigRef.current;
		const workbenchElement = workbenchRef.current;
		const robotArmStaticElement = robotArmStaticRef.current;
		const robotClawElement = robotClawRef.current;
		const robotClawRailElement = robotClawRailRef.current;
		const robotClawOpenElement = robotClawOpenRef.current;
		const robotClawClosedElement = robotClawClosedRef.current;
		const robotBlockElement = robotBlockRef.current;
		const robotCharacterElement = robotCharacterRef.current;
		const robotCharacterHeadElement = robotCharacterHeadRef.current;
		const robotCharacterEyesElement = robotCharacterEyesRef.current;

		if (
			!root ||
			!background ||
			!atmosphere ||
			!heading ||
			!title ||
			!signRig ||
			!workbenchElement ||
			!robotArmStaticElement ||
			!robotClawElement ||
			!robotClawRailElement ||
			!robotClawOpenElement ||
			!robotClawClosedElement ||
			!robotBlockElement ||
			!robotCharacterElement ||
			!robotCharacterHeadElement ||
			!robotCharacterEyesElement
		) {
			return;
		}

		const reducedMotion =
			shouldDisableScrollFades() ||
			window.matchMedia("(prefers-reduced-motion: reduce)").matches;

		if (reducedMotion) {
			root.dataset.servicesMotion = "reduced";
			root.dataset.robotPhase = "static";
			return () => {
				delete root.dataset.servicesMotion;
				delete root.dataset.robotPhase;
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
					robotClawElement,
					robotBlockElement,
					robotCharacterElement,
					robotCharacterHeadElement,
					robotCharacterEyesElement,
				],
				{
					force3D: true,
				}
			);
			gsap.set(signRig, { rotation: 0, transformOrigin: "50% 0%" });
			gsap.set(robotArmStaticElement, { clearProps: "transform" });
			gsap.set(robotClawRailElement, { height: 0 });
			gsap.set(robotClawOpenElement, { autoAlpha: 1 });
			gsap.set(robotClawClosedElement, { autoAlpha: 0 });
			gsap.set(robotCharacterHeadElement, {
				rotation: 0,
				xPercent: 0,
				yPercent: 0,
				transformOrigin: "49% 46%",
			});
			gsap.set(robotCharacterEyesElement, { yPercent: 0 });
			const getClawContactTravel = () => {
				const clawAssemblyTop =
					(robotClawElement.offsetParent as HTMLElement | null)?.offsetTop ?? 0;
				const clawVisibleBottom =
					clawAssemblyTop +
					robotClawElement.offsetTop +
					robotClawElement.offsetHeight * (711 / 768);
				const blockVisibleTop =
					robotBlockElement.offsetTop +
					robotBlockElement.offsetHeight * (399 / 1146);
				const contactOverlap = Math.max(
					1.5,
					robotArmStaticElement.offsetWidth * 0.014
				);

				return Math.max(
					0,
					blockVisibleTop - clawVisibleBottom + contactOverlap
				);
			};
			const setRobotPhase = (phase: string) => {
				root.dataset.robotPhase = phase;
			};

			const robotInteractionTimeline = gsap
				.timeline({ repeat: -1, repeatDelay: 0.95, repeatRefresh: true })
				.call(() => setRobotPhase("rest"), [], 0)
				.call(() => setRobotPhase("descending"), [], 0.38)
				.to(
					robotCharacterHeadElement,
					{
						rotation: 7.5,
						xPercent: 1.4,
						yPercent: 1.2,
						duration: 0.82,
						ease: "power2.inOut",
					},
					0.38
				)
				.to(
					robotCharacterEyesElement,
					{
						yPercent: 1.25,
						duration: 0.28,
						ease: "power2.inOut",
					},
					0.92
				)
				.to(
					robotClawElement,
					{
						y: getClawContactTravel,
						duration: 0.82,
						ease: "power2.inOut",
					},
					0.38
				)
				.to(
					robotClawRailElement,
					{
						height: getClawContactTravel,
						duration: 0.82,
						ease: "power2.inOut",
					},
					0.38
				)
				.call(() => setRobotPhase("gripping"), [], 1.2)
				.set(robotClawOpenElement, { autoAlpha: 0 }, 1.2)
				.set(robotClawClosedElement, { autoAlpha: 1 }, 1.2)
				.call(() => setRobotPhase("lifting"), [], 1.46)
				.to(
					robotCharacterHeadElement,
					{
						rotation: 0,
						xPercent: 0,
						yPercent: 0,
						duration: 0.88,
						ease: "power2.inOut",
					},
					1.46
				)
				.to(
					robotCharacterEyesElement,
					{
						yPercent: 0,
						duration: 0.48,
						ease: "power2.inOut",
					},
					1.46
				)
				.to(
					robotClawElement,
					{
						y: 0,
						duration: 0.88,
						ease: "power2.inOut",
					},
					1.46
				)
				.to(
					robotClawRailElement,
					{
						height: 0,
						duration: 0.88,
						ease: "power2.inOut",
					},
					1.46
				)
				.to(
					robotBlockElement,
					{
						y: () => -getClawContactTravel(),
						duration: 0.88,
						ease: "power2.inOut",
					},
					1.46
				)
				.call(() => setRobotPhase("holding"), [], 2.34)
				.to(
					robotCharacterHeadElement,
					{
						rotation: 7.5,
						xPercent: 1.4,
						yPercent: 1.2,
						duration: 1.08,
						ease: "power2.inOut",
					},
					2.66
				)
				.call(() => setRobotPhase("lowering"), [], 2.86)
				.to(
					robotClawElement,
					{
						y: getClawContactTravel,
						duration: 0.88,
						ease: "power2.inOut",
					},
					2.86
				)
				.to(
					robotCharacterEyesElement,
					{
						yPercent: 1.25,
						duration: 0.34,
						ease: "power2.inOut",
					},
					3.42
				)
				.to(
					robotClawRailElement,
					{
						height: getClawContactTravel,
						duration: 0.88,
						ease: "power2.inOut",
					},
					2.86
				)
				.to(
					robotBlockElement,
					{
						y: 0,
						duration: 0.88,
						ease: "power2.inOut",
					},
					2.86
				)
				.call(() => setRobotPhase("releasing"), [], 3.76)
				.set(robotClawClosedElement, { autoAlpha: 0 }, 3.76)
				.set(robotClawOpenElement, { autoAlpha: 1 }, 3.76)
				.call(() => setRobotPhase("retracting"), [], 3.9)
				.to(
					robotClawElement,
					{
						y: 0,
						duration: 0.72,
						ease: "power2.inOut",
					},
					3.9
				)
				.to(
					robotClawRailElement,
					{
						height: 0,
						duration: 0.72,
						ease: "power2.inOut",
					},
					3.9
				)
				.to(
					robotCharacterHeadElement,
					{
						xPercent: 0,
						yPercent: 0,
						rotation: 0,
						duration: 0.72,
						ease: "power2.inOut",
					},
					3.9
				)
				.to(
					robotCharacterEyesElement,
					{
						yPercent: 0,
						duration: 0.48,
						ease: "power2.inOut",
					},
					3.9
				)
				.call(() => setRobotPhase("rest"), [], 4.62);

			robotInteractionTimeline.timeScale(0.72);

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
			delete root.dataset.robotPhase;
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
					alt={localizeLabel("")}
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
						<span className={styles.titleLabel}>{localizeLabel("Serviços")}</span>
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
								alt={localizeLabel("")}
								decoding="async"
							/>
						</picture>
					</h2>
				</header>

				<div className={styles.workbenchStage} aria-hidden="true">
					<div ref={workbenchRef} className={styles.workbenchRig}>
						<img className={styles.workbench} src={workbench} alt={localizeLabel("")} />
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
									alt={localizeLabel("")}
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
									alt={localizeLabel("")}
									decoding="async"
								/>
							</picture>
							<div
								className={`${styles.device} ${styles.robotArmDevice}`}
								data-service-device="robot-arm"
							>
								<div className={styles.robotInteraction}>
									<img
										ref={robotArmStaticRef}
										className={styles.robotArmStatic}
										data-robot-arm-static="true"
										src={roboticArmStatic}
										alt={localizeLabel("")}
										decoding="async"
									/>
									<div className={styles.robotClawAssembly}>
										<span
											ref={robotClawRailRef}
											className={styles.robotClawRail}
											data-robot-claw-rail="true"
										/>
										<div
											ref={robotClawRef}
											className={styles.robotClawCarriage}
											data-robot-claw="true"
										>
											<img
												ref={robotClawOpenRef}
												className={`${styles.robotClawLayer} ${styles.robotClawOpen}`}
												src={roboticClawOpen}
												alt={localizeLabel("")}
												decoding="async"
											/>
											<img
												ref={robotClawClosedRef}
												className={`${styles.robotClawLayer} ${styles.robotClawClosed}`}
												src={roboticClawClosed}
												alt={localizeLabel("")}
												decoding="async"
											/>
										</div>
									</div>
									<img
										ref={robotBlockRef}
										className={styles.robotBlock}
										data-robot-block="true"
										src={roboticArmBlock}
										alt={localizeLabel("")}
										decoding="async"
									/>
									<div
										ref={robotCharacterRef}
										className={styles.robotCharacter}
										data-robot-character="true"
									>
										<img
											className={styles.robotCharacterLayer}
											src={lagArthurControllerBody}
											alt={localizeLabel("")}
											decoding="async"
										/>
										<div
											ref={robotCharacterHeadRef}
											className={`${styles.robotCharacterLayer} ${styles.robotCharacterHead}`}
											data-robot-character-head="true"
										>
											<img
												className={styles.robotCharacterHeadLayer}
												src={lagArthurControllerHead}
												alt={localizeLabel("")}
												decoding="async"
											/>
											<img
												ref={robotCharacterEyesRef}
												className={`${styles.robotCharacterHeadLayer} ${styles.robotCharacterEyes}`}
												data-robot-character-eyes="true"
												src={lagArthurControllerEyes}
												alt={localizeLabel("")}
												decoding="async"
											/>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
