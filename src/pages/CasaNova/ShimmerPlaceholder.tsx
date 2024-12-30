import React from "react";
import "./ShimmerPlaceholder.css";

interface ShimmerPlaceholderProps {
  height: string;
  width?: string;
  style?: React.CSSProperties;
}

const ShimmerPlaceholder: React.FC<ShimmerPlaceholderProps> = ({
  height,
  width = "100%",
  style = {},
}) => {
  return (
    <div
      className="shimmer-wrapper"
      style={{ height, width, ...style }}
    >
      <div className="shimmer"></div>
    </div>
  );
};

export default ShimmerPlaceholder;
