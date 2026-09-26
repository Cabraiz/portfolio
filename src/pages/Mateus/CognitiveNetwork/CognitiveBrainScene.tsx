import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import React, {
	Suspense,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import * as THREE from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import type { CognitiveViewMode } from "./cognitiveNetwork.data";
import styles from "./CognitiveNetwork.module.css";

type PointerState = {
	x: number;
	y: number;
	active: boolean;
};

type ScenePalette = Readonly<{
	brain: string;
	emissive: string;
}>;

const MODEL_URL = `${import.meta.env.BASE_URL}models/cognitive-brain/brain-optimized.glb`;
const DRACO_PATH = `${import.meta.env.BASE_URL}models/cognitive-brain/draco/`;
const BRAIN_PITCH_MIN = 0.28;
const BRAIN_PITCH_MAX = 0.4;
const BRAIN_YAW_MIN = -0.28;
const BRAIN_YAW_MAX = 0.72;

const FISSURE_VERTEX_SHADER = `
	attribute float lineDistance;
	varying float vLineDistance;
	void main() {
		vLineDistance = lineDistance;
		gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
	}
`;

const FISSURE_FRAGMENT_SHADER = `
	uniform vec3 uColor;
	uniform float uOpacity;
	uniform float uOffset;
	uniform float uDashSize;
	uniform float uGapSize;
	varying float vLineDistance;
	void main() {
		float pattern = mod(vLineDistance + uOffset, uDashSize + uGapSize);
		if (pattern > uDashSize) discard;
		float progress = pattern / uDashSize;
		float spark = smoothstep(0.0, 0.28, progress) * (1.0 - smoothstep(0.72, 1.0, progress));
		gl_FragColor = vec4(uColor, uOpacity * (0.52 + spark * 0.48));
	}
`;

const PALETTES: Readonly<Record<CognitiveViewMode, ScenePalette>> = {
	neural: {
		brain: "#8f4d59",
		emissive: "#5b132e",
	},
	pipeline: {
		brain: "#92505a",
		emissive: "#6a251f",
	},
	memory: {
		brain: "#844b5a",
		emissive: "#3f204c",
	},
};

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

function isVisibleBrainRegion(name: string): boolean {
	if (
		/cerebell|vermis|flocculus|declive|culmen|white matter|tonsil|artery|sinus|plexus/i.test(
			name
		)
	) {
		return false;
	}

	return /gyrus|gyri|sulcus|pole\.|lobule|precuneus|cuneus|insula/i.test(name);
}

const BrainModel: React.FC<{
	mode: CognitiveViewMode;
	pointer: React.MutableRefObject<PointerState>;
	onReady: () => void;
}> = ({ mode, pointer, onReady }) => {
	const groupRef = useRef<THREE.Group>(null);
	const materialCollectionRef = useRef<THREE.MeshStandardMaterial[]>([]);
	const palette = PALETTES[mode];
	const gltf = useLoader(GLTFLoader, MODEL_URL, (loader) => {
		const dracoLoader = new DRACOLoader();
		dracoLoader.setDecoderPath(DRACO_PATH);
		dracoLoader.setDecoderConfig({ type: "wasm" });
		loader.setDRACOLoader(dracoLoader);
	});

	const normalized = useMemo(() => {
		const sourceScene = gltf.scene.clone(true);
		const scene = new THREE.Group();
		const box = new THREE.Box3();
		const materials: THREE.MeshStandardMaterial[] = [];
		const fissureLineMaterials: THREE.ShaderMaterial[] = [];
		const fissureEdgeGeometries: THREE.EdgesGeometry[] = [];
		const surfaceGeometries: THREE.BufferGeometry[] = [];
		let meshIndex = 0;
		const materialCount = 2;
		const geometryBuckets = Array.from(
			{ length: materialCount },
			() => [] as THREE.BufferGeometry[]
		);
		const fissureBuckets = Array.from(
			{ length: materialCount },
			() => [] as THREE.BufferGeometry[]
		);

		for (let materialIndex = 0; materialIndex < materialCount; materialIndex += 1) {
			const color = new THREE.Color(palette.brain);
			color.offsetHSL(
				(materialIndex % 3) * 0.003 - 0.003,
				-0.025,
				((materialIndex % 6) - 2.5) * 0.008
			);
			materials.push(
				new THREE.MeshStandardMaterial({
					color,
					emissive: new THREE.Color(palette.emissive),
					emissiveIntensity: 0.026,
					metalness: 0.08,
					roughness: 0.34,
					transparent: false,
					opacity: 1,
					side: THREE.FrontSide,
				})
			);
		}

		const fissureColors = ["#ff4b9d", "#ff6d88", "#d84dff", "#ffb0c8"];
		for (let materialIndex = 0; materialIndex < materialCount; materialIndex += 1) {
			fissureLineMaterials.push(
				new THREE.ShaderMaterial({
					uniforms: {
						uColor: {
							value: new THREE.Color(
								fissureColors[materialIndex % fissureColors.length]
							),
						},
						uOpacity: { value: 0.28 },
						uOffset: { value: materialIndex * 0.07 },
						uDashSize: { value: 0.045 },
						uGapSize: { value: 0.026 },
					},
					vertexShader: FISSURE_VERTEX_SHADER,
					fragmentShader: FISSURE_FRAGMENT_SHADER,
					transparent: true,
					depthTest: true,
					depthWrite: false,
					blending: THREE.AdditiveBlending,
				})
			);
		}

		sourceScene.updateMatrixWorld(true);

		sourceScene.traverse((child) => {
			if (!(child instanceof THREE.Mesh)) return;
			if (!isVisibleBrainRegion(child.name)) return;
			const materialIndex = meshIndex % materialCount;
			const contributesCorticalContour =
				/sulcus|fissure|gyrus|gyri/i.test(
					child.name
				);
			const geometry = child.geometry.clone();
			geometry.applyMatrix4(child.matrixWorld);
			geometry.clearGroups();
			for (const attributeName of Object.keys(geometry.attributes)) {
				if (!["position", "normal", "uv"].includes(attributeName)) {
					geometry.deleteAttribute(attributeName);
				}
			}
			geometry.computeBoundingBox();
			if (geometry.boundingBox) box.union(geometry.boundingBox);
			geometryBuckets[materialIndex].push(geometry);
			if (contributesCorticalContour) {
				fissureBuckets[meshIndex % fissureBuckets.length].push(
					new THREE.EdgesGeometry(geometry, 48)
				);
			}
			meshIndex += 1;
		});

		geometryBuckets.forEach((bucket, materialIndex) => {
			if (bucket.length === 0) return;
			const mergedGeometry = mergeGeometries(bucket, false);
			bucket.forEach((geometry) => geometry.dispose());
			if (!mergedGeometry) return;
			const mesh = new THREE.Mesh(mergedGeometry, materials[materialIndex]);
			mesh.name = `merged cortical tissue ${materialIndex + 1}`;
			mesh.castShadow = false;
			mesh.receiveShadow = false;
			scene.add(mesh);
			surfaceGeometries.push(mergedGeometry);
		});

		fissureBuckets.forEach((bucket, materialIndex) => {
			if (bucket.length === 0) return;
			const mergedGeometry = mergeGeometries(bucket, false);
			bucket.forEach((geometry) => geometry.dispose());
			if (!mergedGeometry) return;
			const edgeLines = new THREE.LineSegments(
				mergedGeometry,
				fissureLineMaterials[materialIndex]
			);
			edgeLines.computeLineDistances();
			edgeLines.name = `merged fissure glow ${materialIndex + 1}`;
			edgeLines.renderOrder = 8;
			scene.add(edgeLines);
			fissureEdgeGeometries.push(mergedGeometry as THREE.EdgesGeometry);
		});

		const size = box.getSize(new THREE.Vector3());
		const center = box.getCenter(new THREE.Vector3());
		const scale = 2.58 / Math.max(size.x, size.y, size.z, 0.001);
		const normalizedPosition = new THREE.Vector3(
			-center.x * scale,
			-center.y * scale,
			-center.z * scale
		);
		return {
			scene,
			materials,
			fissureLineMaterials,
			fissureEdgeGeometries,
			surfaceGeometries,
			scale,
			position: normalizedPosition,
		};
	}, [gltf.scene, palette.brain, palette.emissive]);

	useEffect(() => {
		materialCollectionRef.current = normalized.materials;
		onReady();
		return () => {
			normalized.materials.forEach((material) => material.dispose());
			normalized.fissureLineMaterials.forEach((material) => material.dispose());
			normalized.fissureEdgeGeometries.forEach((geometry) => geometry.dispose());
			normalized.surfaceGeometries.forEach((geometry) => geometry.dispose());
		};
	}, [normalized, onReady]);

	useFrame(({ clock }, delta) => {
		const group = groupRef.current;
		if (!group) return;
		const time = clock.elapsedTime;
		const automaticPitch = 0.34 + Math.sin(time * 0.41) * 0.03;
		const pointerPitch = pointer.current.active ? pointer.current.y * 0.03 : 0;
		const targetX = THREE.MathUtils.clamp(
			automaticPitch + pointerPitch,
			BRAIN_PITCH_MIN,
			BRAIN_PITCH_MAX
		);
		const automaticYaw = 0.22 + Math.sin(time * 0.34) * 0.34;
		const pointerYaw = pointer.current.active ? pointer.current.x * 0.16 : 0;
		const targetY = THREE.MathUtils.clamp(
			automaticYaw + pointerYaw,
			BRAIN_YAW_MIN,
			BRAIN_YAW_MAX
		);
		group.rotation.x = THREE.MathUtils.damp(group.rotation.x, targetX, 3.4, delta);
		group.rotation.y = THREE.MathUtils.damp(
			group.rotation.y,
			targetY,
			3.1,
			delta
		);
		group.rotation.z = Math.sin(time * 0.33) * 0.025;
		group.position.y = Math.sin(time * 0.82) * 0.055;
		const pulseScale = 1 + Math.sin(time * 1.85) * 0.012;
		group.scale.setScalar(pulseScale);

		materialCollectionRef.current.forEach((material, index) => {
			const regionalPulse = Math.pow(
				Math.max(0, Math.sin(time * 3.3 - index * 0.73)),
				10
			);
			const softPulse = (Math.sin(time * 1.45 + index * 0.19) + 1) * 0.007;
			material.emissiveIntensity = 0.012 + softPulse + regionalPulse * 0.11;
		});

		normalized.fissureLineMaterials.forEach((material, index) => {
			const thoughtPulse = Math.pow(
				Math.max(0, Math.sin(time * 2.55 - index * 0.92)),
				8
			);
			const travelingSpark = Math.pow(
				Math.max(0, Math.sin(time * 5.2 + index * 1.37)),
				18
			);
			material.uniforms.uOpacity.value =
				0.11 + thoughtPulse * 0.24 + travelingSpark * 0.22;
			material.uniforms.uOffset.value = time * (0.13 + index * 0.035);
		});
	});

	return (
		<group ref={groupRef} rotation={[0.34, 0.28, 0]}>
			<primitive
				object={normalized.scene}
				scale={normalized.scale}
				position={normalized.position}
			/>
		</group>
	);
};

const CognitiveScene: React.FC<{
	mode: CognitiveViewMode;
	pointer: React.MutableRefObject<PointerState>;
	onModelReady: () => void;
}> = ({ mode, pointer, onModelReady }) => {
	return (
		<>
			<fog attach="fog" args={["#edf4ff", 5.8, 10]} />
			<hemisphereLight args={["#ead9df", "#2d1018", 0.85]} />
			<ambientLight intensity={0.46} color="#c79daa" />
			<directionalLight position={[3.4, 4.8, 5.2]} intensity={3.25} color="#ffd7cb" />
			<directionalLight position={[-4.2, 0.4, 3.2]} intensity={1.65} color="#a9c6e8" />
			<BrainModel mode={mode} pointer={pointer} onReady={onModelReady} />
		</>
	);
};

const NeuralCore3D: React.FC<{ mode: CognitiveViewMode }> = ({ mode }) => {
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
			aria-label="Cérebro anatômico 3D com contornos luminosos nas fissuras corticais"
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
			{!modelReady && <span className={styles.modelLoader}>CARREGANDO CÉREBRO 3D...</span>}
		</div>
	);
};

export default NeuralCore3D;
