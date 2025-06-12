import { useState, useEffect } from "react";
import { makeWhiteTransparent } from "./utils";

export const useProcessedImage = (imgSrc: string): string | null => {
  const [processedImg, setProcessedImg] = useState<string | null>(null);

  useEffect(() => {
    const processImage = async () => {
      const img = new Image();
      img.src = imgSrc;
      const result = await makeWhiteTransparent(img);
      setProcessedImg(result);
    };

    processImage();
  }, [imgSrc]);

  return processedImg;
};
