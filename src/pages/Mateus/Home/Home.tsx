import HomeDesktop from "./variants/HomeDesktop";
import MateusMobile from "./variants/HomeMobile";
import { useMateusViewport } from "./hooks/useHomeViewport";

export default function Mateus() {
	const { isMobile } = useMateusViewport();

	return isMobile ? <MateusMobile /> : <HomeDesktop />;
}
