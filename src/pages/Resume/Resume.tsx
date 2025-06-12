import React from "react";
import MateusPDF from "./Mateus_Resume.pdf";

const Resume = () => {
  const iframeStyle = {
    width: "100%",
    height: "100vh",
    border: "none",
  };

  return (
    <div>
      <iframe
        src={MateusPDF}
        title="Mateus Resume"
        style={iframeStyle}
      ></iframe>
    </div>
  );
};

export default Resume;
