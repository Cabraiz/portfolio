import MateusDesktop from "./MateusDesktop";
import MateusMobile from "./MateusMobile";

const isMobile = window.innerWidth < 768;

const Mateus = () => {
  return isMobile ? <MateusMobile /> : <MateusDesktop />;
};

export default Mateus;
