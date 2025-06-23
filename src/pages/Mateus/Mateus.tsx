import { FC, useEffect, useState } from "react";
import MateusDesktop from "./MateusDesktop";
import MateusMobile from "./MateusMobile";

interface MateusProps {
  isActive: boolean;
}

const Mateus: FC<MateusProps> = ({ isActive }) => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile ? (
    <MateusMobile/>
  ) : (
    <MateusDesktop />
  );
};

export default Mateus;
