import React, {
	useCallback,
	useMemo,
	useState,
	type CSSProperties,
} from "react";

import { FREE_DRIVE_STEERING_WHEEL_IMAGE_SRC } from "../domain/homeDrive.constants";
import type { HomeDriveSteeringWheelController } from "../hooks/useHomeDriveSteeringWheel";
import styles from "./HomeDriveSteeringWheel.module.css";

export type HomeDriveSteeringWheelProps = Readonly<{
	controller: HomeDriveSteeringWheelController;
}>;

export default function HomeDriveSteeringWheel({
	controller,
}: HomeDriveSteeringWheelProps) {
	const [imageFailed, setImageFailed] = useState(false);

	const rootClassName = useMemo(() => {
		return [styles.root, controller.isDragging ? styles.dragging : ""]
			.filter(Boolean)
			.join(" ");
	}, [controller.isDragging]);

	const wheelStyle = useMemo<CSSProperties>(() => {
		return {
			"--free-drive-wheel-rotation": `${controller.wheelRotationDeg}deg`,
		} as CSSProperties;
	}, [controller.wheelRotationDeg]);

	const handleImageError = useCallback(() => {
		setImageFailed(true);
	}, []);

	return (
		<div className={rootClassName}>
			<div
				ref={controller.wheelRef}
				className={styles.touchTarget}
				style={wheelStyle}
				aria-label="Volante"
				role="slider"
				aria-valuemin={-1}
				aria-valuemax={1}
				aria-valuenow={Number(controller.steering.toFixed(2))}
				tabIndex={0}
				{...controller.handlers}
			>
				<div className={styles.wheel}>
					<div className={styles.fallbackWheel} aria-hidden="true">
						<span className={styles.fallbackGrip} />
						<span className={styles.fallbackHub} />
						<span className={styles.fallbackSpokeTop} />
						<span className={styles.fallbackSpokeLeft} />
						<span className={styles.fallbackSpokeRight} />
					</div>

					{!imageFailed ? (
						<img
							className={styles.wheelImage}
							src={FREE_DRIVE_STEERING_WHEEL_IMAGE_SRC}
							alt=""
							draggable={false}
							onError={handleImageError}
						/>
					) : null}
				</div>
			</div>
		</div>
	);
}
