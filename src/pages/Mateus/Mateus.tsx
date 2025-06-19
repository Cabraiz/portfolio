import MateusDesktop from "./MateusDesktop";
import MateusMobile from "./MateusMobile";

const isMobile = window.innerWidth < 768;

const Mateus = () => {
  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start", 
      }}
    >
      {isMobile ? <MateusMobile /> : <MateusDesktop />}
    </div>
  );
};

export default Mateus;
