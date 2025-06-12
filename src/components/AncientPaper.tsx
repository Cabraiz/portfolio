// components/AncientPaper.tsx
import React from "react";
import "./AncientPaper.css";

interface Props {
  children: React.ReactNode;
}

const AncientPaper: React.FC<Props> = ({ children }) => {
  return (
    <div className="ancient-bg">
      <div className="ancient-scroll">
        <div className="scroll-top" />
        <div className="ancient-content">{children}</div>
        <div className="scroll-bottom" />
      </div>
    </div>
  );
};

export default AncientPaper;
