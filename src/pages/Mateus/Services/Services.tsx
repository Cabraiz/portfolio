import { localizeLabel, useLabelLanguage } from '@/i18n/labels';
import { useEffect, useRef, useState } from "react";

import workshopBackground from "@/assets/Mateus/services/industrial-workshop-background-v2.webp";
import workbench from "@/assets/Mateus/services/industrial-workbench-base-robot-interaction-v5.webp";
import laptopClubeOff from "@/assets/Mateus/services/devices/laptop-workshop-off-v4.webp";
import phoneClubeOff from "@/assets/Mateus/services/devices/phone-workshop-stand-off-v6.webp";
import roboticArmStatic from "@/assets/Mateus/services/devices/robotic-arm-workshop-static-v4.webp";
import roboticClawOpen from "@/assets/Mateus/services/devices/robotic-claw-telescopic-open-v1.webp";
import roboticClawClosed from "@/assets/Mateus/services/devices/robotic-claw-telescopic-closed-v1.webp";
import roboticArmBlock from "@/assets/Mateus/services/devices/robotic-arm-metal-block-v2.webp";
import lagArthurControllerBody from "@/assets/Mateus/services/lag-arthur-controller-body-follow-v5.webp";
import lagArthurControllerEyes from "@/assets/Mateus/services/lag-arthur-controller-eyes-gaze-v6.webp";
import lagArthurControllerHead from "@/assets/Mateus/services/lag-arthur-controller-head-gaze-base-v6.webp";
import servicesSignAnimated from "@/assets/Mateus/services/services-front-wall-rail-lag-arthur-104frames-v22.webp";
import servicesSignStatic from "@/assets/Mateus/services/services-front-wall-rail-static-v21.webp";

import styles from "./Services.module.css";
import { useServicesMotion } from "./Services.motion";

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
	// A placa animada tem ~6 MB; até a seção se aproximar da tela mostramos o
	// quadro estático (idêntico ao primeiro quadro) para não competir com a home.
	const [signAnimationEnabled, setSignAnimationEnabled] = useState(false);

	useEffect(() => {
		const root = rootRef.current;

		if (!root || typeof IntersectionObserver === "undefined") {
			setSignAnimationEnabled(true);
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries.some((entry) => entry.isIntersecting)) {
					setSignAnimationEnabled(true);
					observer.disconnect();
				}
			},
			{ rootMargin: "25% 0px" },
		);

		observer.observe(root);

		return () => observer.disconnect();
	}, []);

	useServicesMotion({
		rootRef,
		backgroundRef,
		atmosphereRef,
		headingRef,
		titleRef,
		signRigRef,
		workbenchRef,
		robotArmStaticRef,
		robotClawRef,
		robotClawRailRef,
		robotClawOpenRef,
		robotClawClosedRef,
		robotBlockRef,
		robotCharacterRef,
		robotCharacterHeadRef,
		robotCharacterEyesRef,
	});

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
								src={
									signAnimationEnabled ? servicesSignAnimated : servicesSignStatic
								}
								alt={localizeLabel("")}
								data-sign-animation-enabled={signAnimationEnabled}
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
