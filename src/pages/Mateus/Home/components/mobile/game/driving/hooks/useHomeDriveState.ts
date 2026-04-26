import {
	useCallback,
	useState,
	type Dispatch,
	type SetStateAction,
} from "react";

import {
	FREE_DRIVE_START_HEADING_RAD,
	FREE_DRIVE_START_POSITION_X,
	FREE_DRIVE_START_POSITION_Z,
	FREE_DRIVE_START_SPEED_MPS,
} from "../domain/homeDrive.constants";
import type { HomeDriveRuntimeState } from "../domain/homeDrive.types";

export type UseHomeDriveStateResult = Readonly<{
	runtime: HomeDriveRuntimeState;
	setRuntime: Dispatch<SetStateAction<HomeDriveRuntimeState>>;
	resetRuntime: () => void;
}>;

export function createInitialHomeDriveRuntimeState(): HomeDriveRuntimeState {
	return {
		elapsedSeconds: 0,
		car: {
			position: {
				x: FREE_DRIVE_START_POSITION_X,
				z: FREE_DRIVE_START_POSITION_Z,
			},
			headingRad: FREE_DRIVE_START_HEADING_RAD,
			speedMps: FREE_DRIVE_START_SPEED_MPS,
			steerAngleRad: 0,
		},
	};
}

export function useHomeDriveState(): UseHomeDriveStateResult {
	const [runtime, setRuntime] = useState<HomeDriveRuntimeState>(() =>
		createInitialHomeDriveRuntimeState()
	);

	const resetRuntime = useCallback(() => {
		setRuntime(createInitialHomeDriveRuntimeState());
	}, []);

	return {
		runtime,
		setRuntime,
		resetRuntime,
	};
}
