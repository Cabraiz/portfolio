import { localizeLabel, useLabelLanguage } from '@/i18n/labels';
import { Canvas, useThree } from "@react-three/fiber";
import React, {
	Suspense,
	useEffect,
	useRef,
	useState,
} from "react";
import * as THREE from "three";

import type { CognitiveViewMode } from "./cognitiveNetwork.data";
import styles from "./CognitiveNetwork.module.css";
import { CognitiveScene, type PointerState } from "./CognitiveBrainScene.brain";

const RenderScheduler: React.FC = () => {
	const invalidate = useThree((state) => state.invalidate);
	const canvas = useThree((state) => state.gl.domElement);

	useEffect(() => {
		let intervalId = 0;
		let isVisible = true;
		const observer = new IntersectionObserver(
			([entry]) => {
				isVisible = entry?.isIntersecting ?? false;
				if (isVisible) invalidate();
			},
			{ rootMargin: "120px" }
		);

		const startScheduler = () => {
			window.clearInterval(intervalId);
			const isLargeViewport = window.matchMedia(
				"(min-width: 1200px) and (min-height: 900px)"
			).matches;
			const targetFrameInterval = 1000 / (isLargeViewport ? 18 : 20);
			intervalId = window.setInterval(() => {
				if (document.visibilityState === "visible" && isVisible) invalidate();
			}, targetFrameInterval);
		};

		observer.observe(canvas);
		startScheduler();
		window.addEventListener("resize", startScheduler);
		return () => {
			observer.disconnect();
			window.clearInterval(intervalId);
			window.removeEventListener("resize", startScheduler);
		};
	}, [canvas, invalidate]);

	return null;
};

const NeuralCore3D: React.FC<{ mode: CognitiveViewMode }> = ({ mode }) => {
  useLabelLanguage();
	const pointerRef = useRef<PointerState>({ x: 0, y: 0, active: false });
	const [modelReady, setModelReady] = useState(false);
	const markReady = React.useCallback(() => setModelReady(true), []);

	const updatePointer = (event: React.PointerEvent<HTMLDivElement>) => {
		const bounds = event.currentTarget.getBoundingClientRect();
		pointerRef.current = {
			x: THREE.MathUtils.clamp(((event.clientX - bounds.left) / bounds.width) * 2 - 1, -1, 1),
			y: THREE.MathUtils.clamp(((event.clientY - bounds.top) / bounds.height) * 2 - 1, -1, 1),
			active: true,
		};
		event.currentTarget.dataset.pointerActive = "true";
		event.currentTarget.dataset.lastPointerType = event.pointerType;
	};

	const deactivatePointer = (element: HTMLDivElement) => {
		pointerRef.current.active = false;
		element.dataset.pointerActive = "false";
	};

	return (
		<div
			className={styles.coreCanvas}
			data-cognitive-core-canvas="true"
			data-cognitive-form="anatomical-brain"
			data-brain-model-ready={modelReady ? "true" : "false"}
			data-tunnel-count="0"
			data-brain-surface-signals="0"
			data-line-glow="none"
			data-fissure-glow="dense-animated-cortical-contours"
			data-fissure-motion="traveling-dashes"
			data-brain-material="wet-reflective-tissue"
			data-brain-lighting="bright-studio-three-point"
			data-external-lines="none"
			data-brain-rotation="bounded-front-hemisphere"
			data-brain-tilt="top-forward-base-receded"
			data-brain-pitch-range="0.28:0.40"
			data-brain-yaw-range="-0.28:0.72"
			data-inferior-anatomy="hidden"
			data-pointer-active="false"
			data-last-pointer-type="none"
			data-render-profile="merged-geometry-hidpi-no-msaa"
			data-visible-triangle-budget="30000"
			data-optimized-model="brain-optimized.glb"
			data-render-fps-target="20:18"
			aria-label={localizeLabel("Cérebro anatômico 3D com contornos luminosos nas fissuras corticais")}
			role="img"
			onPointerEnter={updatePointer}
			onPointerMove={updatePointer}
			onPointerDown={(event) => {
				event.currentTarget.setPointerCapture(event.pointerId);
				updatePointer(event);
			}}
			onPointerUp={(event) => {
				if (event.currentTarget.hasPointerCapture(event.pointerId)) {
					event.currentTarget.releasePointerCapture(event.pointerId);
				}
				if (event.pointerType !== "mouse") deactivatePointer(event.currentTarget);
			}}
			onPointerCancel={(event) => deactivatePointer(event.currentTarget)}
			onPointerLeave={(event) => deactivatePointer(event.currentTarget)}
		>
			<Canvas
				className={styles.webglCanvas}
				frameloop="demand"
				camera={{ position: [0, 0.12, 7.35], fov: 39, near: 0.1, far: 30 }}
				dpr={0.76}
				gl={{
					antialias: false,
					alpha: true,
					stencil: false,
					powerPreference: "high-performance",
					precision: "mediump",
				}}
			>
				<RenderScheduler />
				<Suspense fallback={null}>
					<CognitiveScene mode={mode} pointer={pointerRef} onModelReady={markReady} />
				</Suspense>
			</Canvas>
			{!modelReady && <span className={styles.modelLoader}>{localizeLabel("CARREGANDO CÉREBRO 3D...")}</span>}
		</div>
	);
};

export default NeuralCore3D;
