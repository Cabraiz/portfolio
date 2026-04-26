import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";

import { tickHomeDrivePhysics } from "../domain/homeDrive.physics";
import type {
	HomeDriveInputState,
	HomeDriveRuntimeState,
} from "../domain/homeDrive.types";

export type UseHomeDriveLoopOptions = Readonly<{
	enabled: boolean;
	input: HomeDriveInputState;
	setRuntime: Dispatch<SetStateAction<HomeDriveRuntimeState>>;
}>;

export function useHomeDriveLoop({
	enabled,
	input,
	setRuntime,
}: UseHomeDriveLoopOptions): void {
	const inputRef = useRef(input);

	useEffect(() => {
		inputRef.current = input;
	}, [input]);

	useEffect(() => {
		if (!enabled) {
			return undefined;
		}

		let frameId = 0;
		let previousNow = performance.now();
		let disposed = false;

		const tick = (now: number) => {
			if (disposed) {
				return;
			}

			const deltaSeconds = (now - previousNow) / 1000;
			previousNow = now;

			setRuntime((current) =>
				tickHomeDrivePhysics(current, inputRef.current, deltaSeconds)
			);

			frameId = window.requestAnimationFrame(tick);
		};

		frameId = window.requestAnimationFrame(tick);

		return () => {
			disposed = true;
			window.cancelAnimationFrame(frameId);
		};
	}, [enabled, setRuntime]);
}
