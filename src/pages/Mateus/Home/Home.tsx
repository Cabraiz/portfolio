import HomeDesktop from "./variants/HomeDesktop";
import HomeMobile from "./variants/HomeMobile";
import { useMateusViewport } from "./hooks/useHomeViewport";

export default function Home() {
  const { isMobile } = useMateusViewport();

  return isMobile ? <HomeMobile /> : <HomeDesktop />;
}
