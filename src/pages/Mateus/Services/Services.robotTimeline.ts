import type { ensureGsapRuntime } from "@/features/scroll/gsapRuntime";

type GsapInstance = ReturnType<typeof ensureGsapRuntime>["gsap"];

// Ciclo do braço robótico (desce, pega o bloco, levanta e solta) em loop
export function createRobotInteractionTimeline({
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
}: Readonly<{
	gsap: GsapInstance;
	root: HTMLElement;
	robotArmStaticElement: HTMLImageElement;
	robotClawElement: HTMLDivElement;
	robotClawRailElement: HTMLSpanElement;
	robotClawOpenElement: HTMLImageElement;
	robotClawClosedElement: HTMLImageElement;
	robotBlockElement: HTMLImageElement;
	robotCharacterHeadElement: HTMLDivElement;
	robotCharacterEyesElement: HTMLImageElement;
}>) {
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

	return robotInteractionTimeline;
}
