import { useLayoutEffect, type RefObject } from "react";

import { ensureGsapRuntime } from "@/features/scroll/gsapRuntime";
import { shouldDisableScrollFades } from "@/features/scroll/scrollMotionFlags";

import { createRobotInteractionTimeline } from "./Services.robotTimeline";

// Movimento da seção: robô em loop, placa que balança e cena presa à rolagem
export function useServicesMotion({
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
}: Readonly<{
	rootRef: RefObject<HTMLElement | null>;
	backgroundRef: RefObject<HTMLImageElement | null>;
	atmosphereRef: RefObject<HTMLDivElement | null>;
	headingRef: RefObject<HTMLElement | null>;
	titleRef: RefObject<HTMLHeadingElement | null>;
	signRigRef: RefObject<HTMLPictureElement | null>;
	workbenchRef: RefObject<HTMLDivElement | null>;
	robotArmStaticRef: RefObject<HTMLImageElement | null>;
	robotClawRef: RefObject<HTMLDivElement | null>;
	robotClawRailRef: RefObject<HTMLSpanElement | null>;
	robotClawOpenRef: RefObject<HTMLImageElement | null>;
	robotClawClosedRef: RefObject<HTMLImageElement | null>;
	robotBlockRef: RefObject<HTMLImageElement | null>;
	robotCharacterRef: RefObject<HTMLDivElement | null>;
	robotCharacterHeadRef: RefObject<HTMLDivElement | null>;
	robotCharacterEyesRef: RefObject<HTMLImageElement | null>;
}>) {
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
			const robotInteractionTimeline = createRobotInteractionTimeline({
				gsap,
				root,
				robotArmStaticElement,
				robotClawElement,
				robotClawRailElement,
				robotClawOpenElement,
				robotClawClosedElement,
				robotBlockElement,
				robotCharacterHeadElement,
				robotCharacterEyesElement,
			});

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
			ScrollTrigger.refresh(true);
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
}
